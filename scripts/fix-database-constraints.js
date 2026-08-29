const path = require('path');
const fs = require('fs');

// Zero-dependency .env parser
function loadEnv() {
    const envPaths = [
        path.resolve(process.cwd(), '.env'),
        path.resolve(__dirname, '..', '.env'),
        path.resolve(__dirname, '.env'),
        'C:\\2035-HMS\\SAAS_ERP\\.env',
        'D:\\ZIONA_HOSPITAL\\.env'
    ];
    for (const p of envPaths) {
        if (fs.existsSync(p)) {
            console.log("[INFO] Loaded environment from:", p);
            const content = fs.readFileSync(p, 'utf8');
            content.split('\n').forEach(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) return;
                const eqIdx = trimmed.indexOf('=');
                if (eqIdx !== -1) {
                    const key = trimmed.slice(0, eqIdx).trim();
                    let val = trimmed.slice(eqIdx + 1).trim();
                    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
                    if (!process.env[key]) process.env[key] = val;
                }
            });
            break;
        }
    }
}
loadEnv();

// Dynamic PostgreSQL Pool Resolver
function getPool() {
    const candidatePaths = [
        'pg',
        path.resolve(process.cwd(), 'node_modules/pg'),
        path.resolve(process.cwd(), '.next/standalone/node_modules/pg'),
        path.resolve(__dirname, '../node_modules/pg'),
        path.resolve(__dirname, '../.next/standalone/node_modules/pg'),
        'C:\\2035-HMS\\SAAS_ERP\\node_modules\\pg',
        'C:\\2035-HMS\\ZIONA_HOSPITAL\\node_modules\\pg',
        'D:\\ZIONA_HOSPITAL\\node_modules\\pg',
        'D:\\ZIONA_HOSPITAL\\.next\\standalone\\node_modules\\pg'
    ];

    for (const cp of candidatePaths) {
        try {
            const mod = require(cp);
            if (mod && mod.Pool) return mod.Pool;
        } catch (_) {}
    }
    throw new Error("PostgreSQL client ('pg') module could not be located. Ensure application is extracted.");
}

async function run() {
    console.log("=================================================");
    console.log("  ZIONA HMS - DATABASE AUTO-HEAL & CONSTRAINT SYNC");
    console.log("=================================================\n");

    const Pool = getPool();
    const connectionString = process.env.DATABASE_URL || "postgresql://postgres:hms2035@localhost:5432/ziona_hospital";
    console.log("[DB] Target:", connectionString.replace(/:[^:@]+@/, ':****@'));

    const pool = new Pool({
        connectionString,
        ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
    });

    const tables = [
        'hms_appointments',
        'hms_cash_shift',
        'hms_patient',
        'hms_clinicians',
        'hms_invoice',
        'hms_invoice_lines',
        'hms_invoice_payments',
        'hms_encounter',
        'prescription',
        'hms_lab_order',
        'hms_imaging_order',
        'hms_bed',
        'hms_print_template',
        'company',
        'tenant'
    ];

    let totalRepaired = 0;

    for (const t of tables) {
        try {
            // 1. Fill any NULL IDs
            const nullFix = await pool.query(`UPDATE ${t} SET id = gen_random_uuid() WHERE id IS NULL;`);
            if (nullFix.rowCount > 0) {
                console.log(`[REPAIRED] Generated valid UUIDs for ${nullFix.rowCount} row(s) with NULL IDs in '${t}'.`);
                totalRepaired += nullFix.rowCount;
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
    console.log(`  SUCCESS: Database repair completed! (Fixed ${totalRepaired} invalid rows)`);
    console.log("  You can now start the application normally.");
    console.log("=================================================\n");

    await pool.end();
}

run().catch(err => {
    console.error("\n[CRITICAL ERROR]:", err.message);
});
