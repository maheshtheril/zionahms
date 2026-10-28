const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function packageApp() {
    const srcDir = process.cwd();
    const destDir = path.join(path.dirname(srcDir), 'ZIONA_HOSPITAL');

    console.log(`[SHIELD] Designing bundle at: ${destDir}`);

    if (fs.existsSync(destDir)) {
        console.log('[INFO] Cleaning old bundle (preserving .git)...');
        const files = fs.readdirSync(destDir);
        for (const file of files) {
            if (file !== '.git' && file !== '.env' && file !== '.env.local') {
                try {
                    fs.rmSync(path.join(destDir, file), { recursive: true, force: true });
                } catch (err) {
                    if (err.code === 'EBUSY') {
                        console.warn(`[WARN] Skipping locked resource: ${file}. Please close any programs using this folder.`);
                    } else {
                        throw err;
                    }
                }
            }
        }
    } else {
        fs.mkdirSync(destDir);
    }

    const toKeep = [
        '.next',
        '.env.production.example',
        'public',
        'prisma',
        'prisma.config.ts',
        'package.json',
        'package-lock.json',
        'whatsapp-bridge',
        'smart_guard.js',
        'START_HOSPITAL.bat',
        'START_HOSPITAL_NEW.bat',
        'FIX_DATABASE_TABLES.bat',
        'scripts',
        'setup_database.js',
        'create_shortcut.js',
        'ZIONA_INSTALLER.bat',
        'ZIONA_SETUP.bat',
        'RUN_WHATSAPP.bat',
        'SYNC_TO_CLOUD.bat',
        'ZIONA_DASHBOARD.bat',
        'configure_ip.js',
        'configure_cloud.js',
        'setup_ssl.js',
        'setup_whatsapp_local_db.js',
        '.gitignore_production',
        'PUSH_TO_CUSTOMER.bat',
        'INITIALIZE_GIT.bat',
        'UPDATE_HOSPITAL.bat',
        'HOSPITAL_RECOVERY.bat',
        'ZIONA_DB_SYNC.bat',
        'ZIONA_DATA_PUSH.bat',
        'RECOVER_CLOUD.bat',
        'ZIONA_MASTER_SYNC.bat',
        'ACTIVATE_AUTO_SKY_SYNC.bat',
        'REPAIR_CUSTOMER_CLOUD.js',
        'RESTORE_NEON_TO_LOCAL.bat',
        'ONE_CLICK_MIGRATE_CUSTOMER_LIVE.bat',
        'CHECK_MIGRATION_STATUS.bat',
        'CHECK_CLOUD_STATUS.bat',
        'TEST_RMH_IN_BROWSER.bat',
        'migrations',
        'backups',
        'tmp'
    ];

    console.log('[INFO] Moving enterprise components...');
    toKeep.forEach(item => {
        const fullSrc = path.join(srcDir, item);
        const fullDest = path.join(destDir, item);
        
        if (fs.existsSync(fullSrc)) {
            if (fs.lstatSync(fullSrc).isDirectory()) {
                // Use robocopy for fast directory copy on windows
                try {
                    execSync(`robocopy "${fullSrc}" "${fullDest}" /E /NFL /NDL /NJH /NJS /nc /ns /np`, { stdio: 'ignore' });
                } catch (e) {
                    // Robocopy returns non-zero even on success, we check if dest exists
                    if (!fs.existsSync(fullDest)) console.error(`Failed to move ${item}`);
                }
            } else {
                // Special handling for gitignore
                const finalDest = (item === '.gitignore_production') ? path.join(destDir, '.gitignore') : fullDest;
                fs.copyFileSync(fullSrc, finalDest);
            }
        }
    });

    // CRITICAL: Copy ONLY minimal dependencies from node_modules for database setup & runtime
    const prodDeps = [
        'node_modules/.prisma', 
        'node_modules/@prisma', 
        'node_modules/prisma',
        'node_modules/pg',
        'node_modules/pg-types',
        'node_modules/pg-protocol',
        'node_modules/pg-pool',
        'node_modules/pg-connection-string',
        'node_modules/pg-int8',
        'node_modules/pgpass',
        'node_modules/postgres',
        'node_modules/postgres-array',
        'node_modules/postgres-bytea',
        'node_modules/postgres-date',
        'node_modules/postgres-interval',
        'node_modules/dotenv'
    ];
    console.log('[INFO] Syncing Database Engines & Core Drivers...');
    prodDeps.forEach(dep => {
        const fullSrc = path.join(srcDir, dep);
        const fullDest = path.join(destDir, dep);
        const standaloneDest = path.join(destDir, '.next', 'standalone', dep);
        
        if (fs.existsSync(fullSrc)) {
            try {
                // Copy to root node_modules for backup/setup
                execSync(`robocopy "${fullSrc}" "${fullDest}" /E /NFL /NDL /NJH /NJS /nc /ns /np`, { stdio: 'ignore' });
                // CRITICAL: Copy to standalone node_modules so server.js can find them
                if (fs.existsSync(path.join(destDir, '.next', 'standalone'))) {
                    execSync(`robocopy "${fullSrc}" "${standaloneDest}" /E /NFL /NDL /NJH /NJS /nc /ns /np`, { stdio: 'ignore' });
                }
            } catch (e) {}
        }
    });

    // 2. Add an indicator file
    fs.writeFileSync(path.join(destDir, '.ziona_shield'), 'PROD_BUILD');

    console.log('[SUCCESS] Source code removed. Ziona Shield active.');
    console.log('[TIP] High-speed Git Update: Only changed files will be pushed.');
}

packageApp();
