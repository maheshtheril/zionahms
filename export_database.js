const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n========================================================');
console.log('  ZIONA HEALTHCARE ERP - DATA EXPORT TOOL');
console.log('========================================================\n');

// 1. Resolve DATABASE_URL from .env
const envPath = path.join(process.cwd(), '.env');
let dbUrl = process.env.DATABASE_URL;

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL=["']?(.+?)["']?(\r?\n|$)/);
    if (match && match[1]) {
        dbUrl = match[1].trim();
    }
}

if (!dbUrl) {
    dbUrl = 'postgresql://postgres:hms2035@localhost:5432/hms_db';
    console.log('[INFO] Using fallback database URL: postgresql://postgres:***@localhost:5432/hms_db');
} else {
    console.log('[INFO] Detected Database connection from .env');
}

// 2. Search for pg_dump across common drives & directories
function findPgDump() {
    try {
        execSync('pg_dump --version', { stdio: 'ignore' });
        return 'pg_dump';
    } catch (e) {}

    const searchPaths = [
        'C:\\Program Files\\PostgreSQL',
        'C:\\Program Files (x86)\\PostgreSQL',
        'D:\\Program Files\\PostgreSQL',
        'D:\\PostgreSQL',
        'C:\\PostgreSQL',
        'D:\\ZIONA_HOSPITAL\\pgsql',
        'C:\\pgsql'
    ];

    for (const base of searchPaths) {
        if (fs.existsSync(base)) {
            try {
                const subdirs = fs.readdirSync(base);
                for (const sub of subdirs) {
                    const binDump = path.join(base, sub, 'bin', 'pg_dump.exe');
                    if (fs.existsSync(binDump)) {
                        return '"' + binDump + '"';
                    }
                    const directDump = path.join(base, 'bin', 'pg_dump.exe');
                    if (fs.existsSync(directDump)) {
                        return '"' + directDump + '"';
                    }
                }
            } catch (e) {}
        }
    }

    return null;
}

const pgDumpCmd = findPgDump();
const exportFile = path.join(process.cwd(), 'customer_data_export.sql');

if (pgDumpCmd) {
    console.log('[OK] Located pg_dump utility: ' + pgDumpCmd);
    console.log('[1/2] Exporting complete database data (with column-mapping safety)...');
    
    try {
        const dumpArgs = [
            '--data-only',
            '--column-inserts',
            '--no-owner',
            '--no-privileges',
            '--no-comments',
            '--disable-triggers',
            '--exclude-table=sessions',
            '--exclude-table=refresh_tokens',
            '--exclude-table=express_session',
            '--exclude-table=email_verification_tokens',
            '--exclude-table=hms_idempotency_keys',
            '--exclude-table=audit_log',
            '--exclude-table=agent_task_log',
            '-d "' + dbUrl + '"',
            '-f "' + exportFile + '"'
        ].join(' ');

        execSync(pgDumpCmd + ' ' + dumpArgs, { stdio: 'inherit' });
        
        const stats = fs.statSync(exportFile);
        console.log('\n[SUCCESS] Export generated: ' + exportFile);
        console.log('[INFO] Export size: ' + (stats.size / 1024).toFixed(2) + ' KB');
        console.log('\n========================================================');
        console.log('  EXPORT COMPLETE!');
        console.log('  Please send "customer_data_export.sql" to your provider.');
        console.log('========================================================\n');
        process.exit(0);
    } catch (err) {
        console.warn('[WARNING] pg_dump encountered an issue: ' + err.message);
        console.log('[INFO] Switching to fallback Prisma direct exporter...');
    }
} else {
    console.log('[INFO] pg_dump CLI not found in paths. Using built-in Prisma direct exporter...');
}

// 3. Fallback: Built-in Prisma Exporter (Zero dependency on PostgreSQL CLI)
async function prismaExport() {
    console.log('[1/2] Connecting directly via Prisma database engine...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
        await prisma.$connect();
        console.log('[OK] Connected to database successfully.');

        console.log('[2/2] Fetching hospital records (patients, invoices, inventory, staff)...');
        
        const backupData = {
            exportedAt: new Date().toISOString(),
            company: await prisma.company.findMany().catch(() => []),
            company_settings: await prisma.company_settings.findMany().catch(() => []),
            hms_patient: await prisma.hms_patient.findMany().catch(() => []),
            hms_appointments: await prisma.hms_appointments.findMany().catch(() => []),
            hms_clinicians: await prisma.hms_clinicians.findMany().catch(() => []),
            hms_departments: await prisma.hms_departments.findMany().catch(() => []),
            hms_invoice: await prisma.hms_invoice.findMany().catch(() => []),
            hms_invoice_lines: await prisma.hms_invoice_lines.findMany().catch(() => []),
            hms_invoice_payments: await prisma.hms_invoice_payments.findMany().catch(() => []),
            hms_product: await prisma.hms_product.findMany().catch(() => []),
            hms_product_category: await prisma.hms_product_category.findMany().catch(() => []),
            hms_product_batch: await prisma.hms_product_batch.findMany().catch(() => []),
            hms_lab_order: await prisma.hms_lab_order.findMany().catch(() => []),
            hms_lab_order_lines: await prisma.hms_lab_order_lines.findMany().catch(() => []),
            hms_lab_test: await prisma.hms_lab_test.findMany().catch(() => []),
            accounts: await prisma.accounts.findMany().catch(() => []),
            journal_entries: await prisma.journal_entries.findMany().catch(() => []),
            journal_lines: await prisma.journal_lines.findMany().catch(() => []),
            app_user: await prisma.app_user.findMany({ select: { id: true, email: true, name: true, role: true, tenant_id: true, created_at: true } }).catch(() => []),
        };

        const jsonExportFile = path.join(process.cwd(), 'customer_data_export.json');
        fs.writeFileSync(jsonExportFile, JSON.stringify(backupData, null, 2));

        console.log('\n[SUCCESS] Export generated: ' + jsonExportFile);
        console.log('[INFO] Patients: ' + backupData.hms_patient.length);
        console.log('[INFO] Invoices: ' + backupData.hms_invoice.length);
        console.log('[INFO] Products: ' + backupData.hms_product.length);
        console.log('\n========================================================');
        console.log('  EXPORT COMPLETE!');
        console.log('  Please send "customer_data_export.json" to your provider.');
        console.log('========================================================\n');
    } catch (e) {
        console.error('[ERROR] Export failed: ' + e.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

prismaExport();
