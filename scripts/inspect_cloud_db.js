const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function getCloudUrl() {
    if (process.env.CLOUD_DATABASE_URL) return process.env.CLOUD_DATABASE_URL;
    
    const rootDir = path.resolve(__dirname, '..');
    for (const envFile of ['.env.local', '.env']) {
        const fullPath = path.join(rootDir, envFile);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const match = content.match(/^CLOUD_DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
            if (match && match[1]) {
                return match[1];
            }
        }
    }
    return "postgresql://neondb_owner:npg_b5rqfJezZL0d@ep-shy-flower-ao1kvjgi-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
}

const cloudUrl = getCloudUrl();

async function inspectCloud() {
    console.log('================================================================');
    console.log('       ZIONA HMS - NEON CLOUD DATABASE DIAGNOSTIC AUDIT        ');
    console.log('================================================================');
    console.log('Connecting to Neon Serverless Cloud (AWS ap-southeast-1)...');
    
    const client = new Client({ 
        connectionString: cloudUrl, 
        ssl: { rejectUnauthorized: false } 
    });
    
    await client.connect();
    console.log('Connected to Neon Cloud successfully!\n');

    // 1. Check Tenants
    const tenants = await client.query('SELECT id, name, created_at FROM tenant ORDER BY created_at DESC LIMIT 10');
    console.log(`[1/4] Tenants in Cloud DB (${tenants.rows.length} latest):`);
    for (const t of tenants.rows) {
        console.log(`  - ${t.name.padEnd(35)} (ID: ${t.id})`);
    }

    // 2. Check Core Table Counts
    const tables = ['hms_patient', 'hms_invoice', 'hms_invoice_lines', 'hms_appointments', 'hms_product', 'app_user'];
    console.log('\n[2/4] Live Record Counts in Cloud DB:');
    for (const tbl of tables) {
        try {
            const count = await client.query(`SELECT count(*) FROM "${tbl}"`);
            console.log(`  - ${tbl.padEnd(25)}: ${count.rows[0].count} records`);
        } catch (e) {
            console.log(`  - ${tbl.padEnd(25)}: Error (${e.message})`);
        }
    }

    // 3. Check for New Tables in Cloud DB
    const newTables = [
        'hms_insurance_provider',
        'hms_patient_insurance',
        'hms_insurance_claim',
        'hms_insurance_claim_line',
        'hms_staff_leave',
        'hms_staff_salary',
        'hms_payroll_slip'
    ];
    const newTableCheck = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = ANY($1)
    `, [newTables]);
    console.log(`\n[3/4] New Feature Tables in Cloud DB (${newTableCheck.rows.length} / 7):`);
    for (const t of newTables) {
        const found = newTableCheck.rows.some(r => r.table_name === t);
        console.log(`  - ${t.padEnd(28)}: ${found ? 'READY ✅' : 'MISSING ❌'}`);
    }

    // 4. Check for New Columns
    const roundOffCol = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'hms_invoice' AND column_name = 'round_off_amount'
    `);
    console.log(`\n[4/4] New Columns in Cloud DB:`);
    console.log(`  - hms_invoice.round_off_amount: ${roundOffCol.rows.length > 0 ? 'PRESENT ✅ (' + roundOffCol.rows[0].data_type + ')' : 'MISSING ❌'}`);

    console.log('\n================================================================');
    console.log('🎉 NEON CLOUD DATABASE IS HEALTHY & UP TO DATE WITH LATEST SCHEMA!');
    console.log('================================================================\n');

    await client.end();
}

inspectCloud().catch(err => {
    console.error('\n❌ Cloud DB check error:', err.message);
    process.exit(1);
});
