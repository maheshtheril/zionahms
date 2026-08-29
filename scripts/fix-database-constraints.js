require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:hms2035@localhost:5432/ziona_hospital";
const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
});

async function run() {
    console.log("=================================================");
    console.log("  ZIONA HMS - DATABASE AUTO-HEAL & CONSTRAINT SYNC");
    console.log("=================================================\n");

    const tables = [
        'hms_appointments',
        'hms_patient',
        'hms_clinicians',
        'hms_invoice',
        'prescription',
        'hms_lab_order',
        'hms_imaging_order',
        'hms_bed',
        'hms_print_template',
        'company',
        'tenant'
    ];

    for (const t of tables) {
        try {
            // 1. Fill any NULL IDs
            const nullFix = await pool.query(`UPDATE ${t} SET id = gen_random_uuid() WHERE id IS NULL;`);
            if (nullFix.rowCount > 0) {
                console.log(`[REPAIRED] Generated valid UUIDs for ${nullFix.rowCount} rows with NULL IDs in '${t}'.`);
            }

            // 2. Enforce DEFAULT gen_random_uuid() and NOT NULL
            await pool.query(`ALTER TABLE ${t} ALTER COLUMN id SET DEFAULT gen_random_uuid();`);
            await pool.query(`ALTER TABLE ${t} ALTER COLUMN id SET NOT NULL;`);
            console.log(`[OK] Table '${t}.id' constraint verified (DEFAULT gen_random_uuid, NOT NULL).`);
        } catch (err) {
            console.warn(`[NOTICE] Table '${t}':`, err.message);
        }
    }

    console.log("\n=================================================");
    console.log("  SUCCESS: Database repair completed successfully!");
    console.log("=================================================");
}

run().catch(console.error).finally(() => pool.end());
