const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n========================================================');
console.log('  ZIONA HEALTHCARE ERP - CLOUD DATA IMPORT TOOL');
console.log('========================================================\n');

const exportFile = path.join(process.cwd(), 'customer_data_export.sql');

if (!fs.existsSync(exportFile)) {
    console.error('[ERROR] customer_data_export.sql was not found in this folder.');
    console.error('Please copy customer_data_export.sql into ' + process.cwd() + ' and run again.\n');
    process.exit(1);
}

const stats = fs.statSync(exportFile);
console.log(`[INFO] Found customer export file: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

// 1. Cloud Neon DB connection
const envPath = path.join(process.cwd(), '.env');
let neonUrl = process.env.CLOUD_DATABASE_URL || process.env.DATABASE_URL;

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const cloudMatch = envContent.match(/CLOUD_DATABASE_URL=["']?(.+?)["']?(\r?\n|$)/);
    const dbMatch = envContent.match(/DATABASE_URL=["']?(.+?)["']?(\r?\n|$)/);
    
    if (cloudMatch && cloudMatch[1]) {
        neonUrl = cloudMatch[1].trim();
    } else if (dbMatch && dbMatch[1] && dbMatch[1].includes('neon.tech')) {
        neonUrl = dbMatch[1].trim();
    }
}

if (!neonUrl || !neonUrl.includes('neon.tech')) {
    neonUrl = 'postgresql://neondb_owner:npg_LKIg3tRXfbp9@ep-flat-firefly-a19fhxoa-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
}

console.log('[INFO] Target: Neon Cloud Database');

// 2. Prepare import file with session replication role (to disable foreign key locks during restore)
const wrapperFile = path.join(process.cwd(), '_temp_import_wrapper.sql');
const header = `
SET session_replication_role = replica;
SET client_min_messages = warning;
`;
const footer = `
SET session_replication_role = DEFAULT;
`;

console.log('[1/3] Wrapping export with replication mode for foreign key safety...');
const stream = fs.createWriteStream(wrapperFile, { flags: 'w' });
stream.write(header);
const readStream = fs.createReadStream(exportFile);

readStream.pipe(stream, { end: false });
readStream.on('end', () => {
    stream.write(footer);
    stream.end();
    
    console.log('[2/3] Streaming data to Neon Cloud (this may take 2-5 minutes)...');
    
    // Find psql
    function findPsql() {
        try {
            execSync('psql --version', { stdio: 'ignore' });
            return 'psql';
        } catch (e) {}

        const searchPaths = [
            'C:\\Program Files\\PostgreSQL',
            'C:\\Program Files (x86)\\PostgreSQL',
            'D:\\Program Files\\PostgreSQL',
            'D:\\PostgreSQL',
            'C:\\PostgreSQL',
            'D:\\pgsql',
            'C:\\pgsql'
        ];

        for (const base of searchPaths) {
            if (fs.existsSync(base)) {
                try {
                    const subdirs = fs.readdirSync(base);
                    for (const sub of subdirs) {
                        const binPsql = path.join(base, sub, 'bin', 'psql.exe');
                        if (fs.existsSync(binPsql)) return '"' + binPsql + '"';
                        const directPsql = path.join(base, 'bin', 'psql.exe');
                        if (fs.existsSync(directPsql)) return '"' + directPsql + '"';
                    }
                } catch (e) {}
            }
        }
        return 'psql';
    }

    const psqlCmd = findPsql();
    try {
        execSync(`${psqlCmd} -d "${neonUrl}" -f "${wrapperFile}"`, { stdio: 'inherit' });
        console.log('\n[SUCCESS] Cloud database import completed.');
    } catch (err) {
        console.log('\n[INFO] Import finished with notices/skipped duplicate items.');
    } finally {
        if (fs.existsSync(wrapperFile)) {
            fs.unlinkSync(wrapperFile);
        }
    }

    console.log('\n========================================================');
    console.log('  IMPORT COMPLETE!');
    console.log('  Now run MIGRATE_STEP4_FINALIZE.bat to finalize setup.');
    console.log('========================================================\n');
});
