import { prisma } from "@/lib/prisma"
import crypto from "crypto"

// Runtime cache to prevent redundant seeding on every request
let isAccountingMenuSeeded = false;

export async function ensureAccountingMenu() {
    if (isAccountingMenuSeeded) return;
    isAccountingMenuSeeded = true; // Lock immediately to prevent parallel hammering
    
    try {
        // --- ADMIN CONFIG NOW HANDLED IN ensureAdminMenus ---
        
        // 2.5 Ensure 'Dashboard' exists in Accounting Module
        await ensureAccountingDashboard();
        // 2. SEED REPORTS
        await ensureLedgerReports();
        
        // 3. SEED TRANSACTIONS
        await ensureTransactionMenus();

        // 4. SEED MASTERS
        await ensureAccountingMasters();

        isAccountingMenuSeeded = true;
    } catch (e) {
        console.error("Failed to auto-seed menu:", e);
    }
}

async function ensureAccountingMasters() {
    let masterParent = await prisma.menu_items.findFirst({ where: { key: 'acc-masters' } });
    if (!masterParent) {
        masterParent = await prisma.menu_items.create({
            data: { label: 'MASTERS', url: '#', key: 'acc-masters', module_key: 'finance', icon: 'Settings', sort_order: 30, is_global: true, permission_code: 'accounting:view' }
        });
    } else {
        await prisma.menu_items.update({ where: { id: masterParent.id }, data: { sort_order: 30, parent_id: null } });
    }

    const coaMenu = await prisma.menu_items.findFirst({ where: { key: 'acc-coa' } });
    if (!coaMenu) {
        await prisma.menu_items.create({
            data: { label: 'Chart of Accounts', url: '/hms/accounting/coa', key: 'acc-coa', module_key: 'finance', icon: 'ListTree', parent_id: masterParent.id, sort_order: 10, is_global: true, permission_code: 'accounting:view' }
        });
    } else {
        await prisma.menu_items.update({ where: { id: coaMenu.id }, data: { sort_order: 10, parent_id: masterParent.id } });
    }

    const accConfig = await prisma.menu_items.findFirst({ where: { key: 'finance-accounting-settings' } });
    if (!accConfig) {
        await prisma.menu_items.create({
            data: { label: 'Accounting & Security PIN', url: '/settings/accounting', key: 'finance-accounting-settings', module_key: 'finance', icon: 'Calculator', parent_id: masterParent.id, sort_order: 20, is_global: true, permission_code: 'accounting:view' }
        });
    } else {
        await prisma.menu_items.update({
            where: { id: accConfig.id },
            data: { module_key: 'finance', parent_id: masterParent.id, label: 'Accounting & Security PIN', sort_order: 20 }
        });
    }
}

async function ensureTransactionMenus() {
    let transParent = await prisma.menu_items.findFirst({ where: { key: 'acc-transactions' } });
    if (!transParent) {
        transParent = await prisma.menu_items.create({
            data: { label: 'TRANSACTIONS', url: '#', key: 'acc-transactions', module_key: 'finance', icon: 'ArrowRightLeft', sort_order: 10, is_global: true, permission_code: 'accounting:view' }
        });
    } else {
        await prisma.menu_items.update({ where: { id: transParent.id }, data: { sort_order: 10, parent_id: null } });
    }

    const paymentMenu = await prisma.menu_items.findFirst({ where: { key: 'acc-payments' } });
    if (!paymentMenu) {
        await prisma.menu_items.create({
            data: { label: 'Payment Vouchers', url: '/hms/accounting/payments', key: 'acc-payments', module_key: 'finance', icon: 'ArrowUpRight', parent_id: transParent.id, sort_order: 10, is_global: true, permission_code: 'accounting:view' }
        });
    } else { await prisma.menu_items.update({ where: { id: paymentMenu.id }, data: { sort_order: 10, parent_id: transParent.id } }); }

    const receiptMenu = await prisma.menu_items.findFirst({ where: { key: 'acc-receipts' } });
    if (!receiptMenu) {
        await prisma.menu_items.create({
            data: { label: 'Receipt Vouchers', url: '/hms/accounting/receipts', key: 'acc-receipts', module_key: 'finance', icon: 'ArrowDownLeft', parent_id: transParent.id, sort_order: 20, is_global: true, permission_code: 'accounting:view' }
        });
    } else { await prisma.menu_items.update({ where: { id: receiptMenu.id }, data: { sort_order: 20, parent_id: transParent.id } }); }

    const journalMenu = await prisma.menu_items.findFirst({ where: { key: 'acc-journals' } });
    if (!journalMenu) {
        await prisma.menu_items.create({
            data: { label: 'Journal Register', url: '/hms/accounting/journals', key: 'acc-journals', module_key: 'finance', icon: 'BookOpen', parent_id: transParent.id, sort_order: 30, is_global: true, permission_code: 'accounting:view' }
        });
    } else { await prisma.menu_items.update({ where: { id: journalMenu.id }, data: { sort_order: 30, parent_id: transParent.id } }); }

    const creditNoteMenu = await prisma.menu_items.findFirst({ where: { key: 'acc-credit-note' } });
    if (!creditNoteMenu) {
        await prisma.menu_items.create({
            data: { label: 'Credit Note', url: '/hms/accounting/credit-notes', key: 'acc-credit-note', module_key: 'finance', icon: 'Ticket', parent_id: transParent.id, sort_order: 40, is_global: true, permission_code: 'accounting:view' }
        });
    } else { await prisma.menu_items.update({ where: { id: creditNoteMenu.id }, data: { sort_order: 40, parent_id: transParent.id } }); }

    const debitNoteMenu = await prisma.menu_items.findFirst({ where: { key: 'acc-debit-note' } });
    if (!debitNoteMenu) {
        await prisma.menu_items.create({
            data: { label: 'Debit Note', url: '/hms/accounting/debit-notes', key: 'acc-debit-note', module_key: 'finance', icon: 'Ticket', parent_id: transParent.id, sort_order: 50, is_global: true, permission_code: 'accounting:view' }
        });
    } else { await prisma.menu_items.update({ where: { id: debitNoteMenu.id }, data: { sort_order: 50, parent_id: transParent.id } }); }
}

async function ensureLedgerReports() {
    let reportParent = await prisma.menu_items.findFirst({ where: { key: 'acc-reports' } });
    if (!reportParent) {
        reportParent = await prisma.menu_items.create({
            data: { label: 'REPORTS', url: '#', key: 'acc-reports', module_key: 'finance', icon: 'BarChart3', sort_order: 20, is_global: true, permission_code: 'accounting:view' }
        });
    } else {
        await prisma.menu_items.update({ where: { id: reportParent.id }, data: { sort_order: 20, parent_id: null } });
    }

    const reports = [
        { key: 'acc-shift-audit', label: 'Daily Shift Audit', url: '/hms/accounting/shifts', icon: 'ShieldCheck', sort: 10 },
        { key: 'acc-cb', label: 'Cash / Bank Book', url: '/hms/accounting/cashbook', icon: 'Banknote', sort: 20 },
        { key: 'acc-db', label: 'Day Book', url: '/hms/accounting/daybook', icon: 'BookOpen', sort: 30 },
        { key: 'acc-tb', label: 'Trial Balance', url: '/hms/accounting/trial-balance', icon: 'Activity', sort: 40 },
        { key: 'acc-pl', label: 'Profit & Loss A/c', url: '/hms/accounting/profit-and-loss', icon: 'TrendingUp', sort: 50 },
        { key: 'acc-bs', label: 'Balance Sheet', url: '/hms/accounting/balance-sheet', icon: 'Scale', sort: 60 },
        { key: 'acc-ageing', label: 'Bill-wise Ageing Analysis', url: '/hms/accounting/ageing', icon: 'History', sort: 70 },
    ];

    for (const r of reports) {
        const existing = await prisma.menu_items.findFirst({ where: { key: r.key } });
        if (!existing) {
            await prisma.menu_items.create({
                data: { label: r.label, url: r.url, key: r.key, module_key: 'finance', icon: r.icon, parent_id: reportParent.id, sort_order: r.sort, is_global: true, permission_code: 'accounting:view' }
            });
        } else {
            await prisma.menu_items.update({
                where: { id: existing.id },
                data: { sort_order: r.sort, parent_id: reportParent.id }
            });
        }
    }
}


let isAdminMenuSeeded = false;

export async function ensureAdminMenus() {
    if (isAdminMenuSeeded) return;
    isAdminMenuSeeded = true; // Lock immediately
    try {
        const adminItems = [
            { key: 'users', label: 'Users', url: '/settings/users', icon: 'Users', sort: 90, permission: 'users:view' },
            { key: 'roles', label: 'Roles & Permissions', url: '/settings/roles', icon: 'Shield', url_key: 'settings-roles', sort: 91, permission: 'roles:manage' }, // Added unique key
            { key: 'accounting-settings', label: 'Accounting & Security PIN', url: '/settings/accounting', icon: 'Calculator', sort: 94, permission: 'settings:view' },
            { key: 'print-formats', label: 'Print & Billing Formats', url: '/hms/settings/print', icon: 'FileText', sort: 94, permission: 'settings:view' },
            { key: 'hms-settings', label: 'HMS Settings', url: '/settings/hms', icon: 'Activity', sort: 95, permission: 'hms:admin' },
            { key: 'geography-settings', label: 'Geography & Regions', url: '/settings/geography', icon: 'Globe', sort: 96, permission: 'settings:view' },
            { key: 'holiday-settings', label: 'Holiday Masters', url: '/settings/holidays', icon: 'CalendarDays', sort: 97, permission: 'settings:view' },
            { key: 'branch-settings', label: 'Branch Management', url: '/settings/branches', icon: 'Building2', sort: 98, permission: 'settings:view' },
            { key: 'general-settings', label: 'Global Settings', url: '/settings/global', icon: 'Settings', sort: 99, permission: 'settings:view' },
        ];

        for (const item of adminItems) {
            try {
                const existing = await prisma.menu_items.findFirst({
                    where: { key: item.key }
                });

                if (!existing) {
                    await prisma.menu_items.create({
                        data: {
                            label: item.label,
                            url: item.url,
                            key: item.key,
                            module_key: 'configuration',
                            icon: item.icon,
                            sort_order: item.sort,
                            permission_code: item.permission,
                            is_global: true,
                            parent_id: null // Explicitly handle parent_id
                        }
                    });
                    console.log(`Auto-seeded Admin Menu: ${item.label}`);
                } else {
                    // Update permission if missing or label if out of date
                    if (!existing.permission_code || existing.module_key !== 'configuration' || existing.label !== item.label || existing.sort_order !== item.sort) {
                        await prisma.menu_items.update({
                            where: { id: existing.id },
                            data: {
                                module_key: 'configuration',
                                permission_code: item.permission,
                                label: item.label,
                                sort_order: item.sort,
                                parent_id: null
                            }
                        });
                    }
                }
            } catch (innerError: any) {
                console.error(`Failed to seed admin menu item ${item.label} (Prisma):`, innerError?.message);

                // Fallback: Raw SQL Insert
                try {
                    const rawId = crypto.randomUUID();
                    // Use a raw query to bypass potential Prisma schema mismatch
                    await prisma.$executeRawUnsafe(`
                        INSERT INTO "menu_items" 
                        ("id", "label", "url", "key", "module_key", "icon", "sort_order", "permission_code", "is_global", "parent_id", "created_at", "updated_at")
                        VALUES 
                        ($1::uuid, $2, $3, $4, 'configuration', $5, $6, $7, true, NULL, NOW(), NOW())
                    `, rawId, item.label, item.url, item.key, item.icon, item.sort, item.permission);

                    console.log(`Auto-seeded Admin Menu via Raw SQL: ${item.label}`);
                } catch (rawError: any) {
                    console.error(`Failed to seed admin menu item ${item.label} via Raw SQL:`, rawError?.message);
                }
                // Continue to next item
            }
        }
        isAdminMenuSeeded = true;
    } catch (e) {
        console.error("Failed to seed admin menus:", e);
    }
}

export async function ensureCrmMenus() {
    try {
        const items = [
            { key: 'crm-dashboard', label: 'CRM Dashboard', url: '/crm/dashboard', icon: 'LayoutDashboard', sort: 10 },
            { key: 'crm-intelligence', label: 'Intelligence', url: '/crm/intelligence', icon: 'Brain', sort: 11 },
            { key: 'crm-leads', label: 'Leads', url: '/crm/leads', icon: 'Users', sort: 20 },
            { key: 'crm-deals', label: 'Deals Pipeline', url: '/crm/deals', icon: 'DollarSign', sort: 30 },
            { key: 'crm-targets', label: 'Targets', url: '/crm/targets', icon: 'Target', sort: 40 },
            { key: 'crm-activities', label: 'Activities', url: '/crm/activities', icon: 'PhoneCall', sort: 50 },
            // Staff & HR (Nested)
            { key: 'crm-staff-root', label: 'Staff & Workforce', url: '#', icon: 'Briefcase', sort: 60 },
            // CRM Setup (Nested)
            { key: 'crm-setup-root', label: 'Advanced & Setup', url: '#', icon: 'Settings', sort: 70 },
        ];

        // --- HELPER FOR RAW SQL INSERT ---
        const rawInsert = async (data: any) => {
            const rawId = crypto.randomUUID();
            const parentId = data.parent_id || null;
            // Safe param handling for optional fields
            const perm = data.permission_code || null;

            await prisma.$executeRawUnsafe(`
                INSERT INTO "menu_items" 
                ("id", "label", "url", "key", "module_key", "icon", "sort_order", "permission_code", "is_global", "parent_id", "created_at", "updated_at")
                VALUES 
                ($1::uuid, $2, $3, $4, $5, $6, $7, $8, true, $9::uuid, NOW(), NOW())
            `, rawId, data.label, data.url, data.key, data.module_key, data.icon, data.sort_order, perm, parentId);
            return { id: rawId };
        };

        // 2a. Staff & HR Root
        let staffParent: any = await prisma.menu_items.findFirst({ where: { key: 'crm-staff-root' } });
        if (!staffParent) {
            try {
                staffParent = await prisma.menu_items.create({
                    data: { label: 'Staff & Workforce', url: '#', key: 'crm-staff-root', module_key: 'crm', icon: 'Briefcase', sort_order: 80, is_global: true, permission_code: 'crm:staff', parent_id: null }
                });
            } catch (e: any) {
                console.error("Failed to create Staff Root (Prisma):", e?.message);
                try {
                    const res = await rawInsert({ label: 'Staff & Workforce', url: '#', key: 'crm-staff-root', module_key: 'crm', icon: 'Briefcase', sort_order: 80, permission_code: 'crm:staff', parent_id: null });
                    staffParent = { id: res.id }; // Mock object for children
                    console.log("Created Staff Root via Raw SQL");
                } catch (rawE: any) { console.error("Failed to create Staff Root (Raw):", rawE?.message); }
            }
        } else if (staffParent.permission_code !== 'crm:staff') {
            await prisma.menu_items.update({
                where: { id: staffParent.id },
                data: { permission_code: 'crm:staff' }
            });
        }

        const staffItems = [
            { key: 'crm-employees', label: 'Employee Directory', url: '/crm/employees', icon: 'Users', sort: 10, permission: 'hr:view' },
            { key: 'crm-departments', label: 'Departments', url: '/crm/departments', icon: 'Network', sort: 15, permission: 'hr:view' },
            { key: 'crm-org-chart', label: 'Org Chart', url: '/crm/org-chart', icon: 'GitGraph', sort: 16, permission: 'hr:view' },
            { key: 'crm-designations', label: 'Designations', url: '/settings/designations', icon: 'UserCheck', sort: 20, permission: 'roles:manage' },
        ];

        if (staffParent) {
            for (const item of staffItems) {
                try {
                    const existing = await prisma.menu_items.findFirst({ where: { key: item.key } });
                    if (!existing) {
                        await prisma.menu_items.create({
                            data: {
                                label: item.label, url: item.url, key: item.key, module_key: 'crm', icon: item.icon,
                                parent_id: staffParent.id, sort_order: item.sort, permission_code: item.permission, is_global: true
                            }
                        });
                    } else {
                        await prisma.menu_items.update({
                            where: { id: existing.id },
                            data: { module_key: 'crm', parent_id: staffParent.id, permission_code: item.permission, sort_order: item.sort }
                        });
                    }
                } catch (e: any) {
                    console.error(`Failed to seed ${item.label} (Prisma):`, e?.message);
                    try {
                        await rawInsert({
                            label: item.label, url: item.url, key: item.key, module_key: 'crm', icon: item.icon,
                            parent_id: staffParent.id, sort_order: item.sort, permission_code: item.permission
                        });
                        console.log(`Created ${item.label} via Raw SQL`);
                    } catch (rawE: any) { console.error(`Failed to seed ${item.label} (Raw):`, rawE?.message); }
                }
            }
        }

        // 2b. Advanced Setup Root
        let setupParent: any = await prisma.menu_items.findFirst({ where: { key: 'crm-setup-root' } });
        if (!setupParent) {
            try {
                setupParent = await prisma.menu_items.create({
                    data: { label: 'Advanced & Setup', url: '#', key: 'crm-setup-root', module_key: 'crm', icon: 'Settings', sort_order: 90, is_global: true, permission_code: 'crm:setup', parent_id: null }
                });
            } catch (e: any) {
                console.error("Failed to create Setup Root (Prisma):", e?.message);
                try {
                    const res = await rawInsert({ label: 'Advanced & Setup', url: '#', key: 'crm-setup-root', module_key: 'crm', icon: 'Settings', sort_order: 90, permission_code: 'crm:setup', parent_id: null });
                    setupParent = { id: res.id };
                    console.log("Created Setup Root via Raw SQL");
                } catch (rawE: any) { console.error("Failed to create Setup Root (Raw):", rawE?.message); }
            }
        } else if (setupParent.permission_code !== 'crm:setup') {
            await prisma.menu_items.update({
                where: { id: setupParent.id },
                data: { permission_code: 'crm:setup' }
            });
        }

        const setupItems = [
            { key: 'crm-masters', label: 'CRM Masters', url: '/settings/crm', icon: 'Database', sort: 10, permission: 'crm:admin' },
            { key: 'import-leads', label: 'Leads Import', url: '/crm/import/leads', icon: 'UploadCloud', sort: 20, permission: 'crm:create_leads' },
            { key: 'custom-fields', label: 'Custom Fields', url: '/settings/custom-fields', icon: 'FileText', sort: 30, permission: 'settings:view' },
        ];

        if (setupParent) {
            for (const item of setupItems) {
                try {
                    const existing = await prisma.menu_items.findFirst({ where: { key: item.key } });
                    if (!existing) {
                        await prisma.menu_items.create({
                            data: {
                                label: item.label, url: item.url, key: item.key, module_key: 'crm', icon: item.icon,
                                parent_id: setupParent.id, sort_order: item.sort, permission_code: item.permission, is_global: true
                            }
                        });
                    } else {
                        await prisma.menu_items.update({
                            where: { id: existing.id },
                            data: { module_key: 'crm', parent_id: setupParent.id, permission_code: item.permission, sort_order: item.sort }
                        });
                    }
                } catch (e: any) {
                    console.error(`Failed to seed ${item.label} (Prisma):`, e?.message);
                    try {
                        await rawInsert({
                            label: item.label, url: item.url, key: item.key, module_key: 'crm', icon: item.icon,
                            parent_id: setupParent.id, sort_order: item.sort, permission_code: item.permission
                        });
                        console.log(`Created ${item.label} via Raw SQL`);
                    } catch (rawE: any) { console.error(`Failed to seed ${item.label} (Raw):`, rawE?.message); }
                }
            }
        }

        for (const item of items) {
            try {
                const existing = await prisma.menu_items.findFirst({
                    where: { key: item.key }
                });

                if (!existing) {
                    await prisma.menu_items.create({
                        data: {
                            label: item.label,
                            url: item.url,
                            key: item.key,
                            module_key: 'crm',
                            icon: item.icon,
                            sort_order: item.sort,
                            is_global: true,
                            parent_id: null
                        }
                    });
                    console.log(`Auto-seeded CRM Menu: ${item.label}`);
                } else {
                    // Ensure it is in CRM module, correct URL, and correct sort
                    if (existing.module_key !== 'crm' || existing.url !== item.url || existing.label !== item.label || existing.sort_order !== item.sort) {
                        await prisma.menu_items.update({
                            where: { id: existing.id },
                            data: {
                                module_key: 'crm',
                                url: item.url,
                                label: item.label,
                                sort_order: item.sort,
                                parent_id: null // Ensure top level
                            }
                        });
                    }
                }
            } catch (innerError: any) {
                console.error(`Failed to seed CRM menu item ${item.label} (Prisma):`, innerError?.message);

                // Fallback: Raw SQL Insert
                try {
                    const rawId = crypto.randomUUID();
                    await prisma.$executeRawUnsafe(`
                       INSERT INTO "menu_items" 
                       ("id", "label", "url", "key", "module_key", "icon", "sort_order", "permission_code", "is_global", "parent_id", "created_at", "updated_at")
                       VALUES 
                       ($1::uuid, $2, $3, $4, 'crm', $5, $6, NULL, true, NULL, NOW(), NOW())
                   `, rawId, item.label, item.url, item.key, item.icon, item.sort);

                    console.log(`Auto-seeded CRM Menu via Raw SQL: ${item.label}`);
                } catch (rawError: any) {
                    console.error(`Failed to seed CRM menu item ${item.label} via Raw SQL:`, rawError?.message);
                }
            }
        }

        // Cleanup Redundant
        await prisma.menu_items.deleteMany({ where: { key: 'crm-pipeline' } });

    } catch (e) {
        console.error("Failed to seed CRM menus:", e);
    }
}

let isHmsMenuSeeded = false;

export async function ensureHmsMenus() {
    if (isHmsMenuSeeded) return;
    isHmsMenuSeeded = true; // Lock immediately
    try {
        const hmsItems = [
            { key: 'hms-reception', label: 'Reception', url: '/hms/reception/dashboard', icon: 'MonitorCheck', sort: 10, permission: 'hms:dashboard:reception' },
            { key: 'hms-doctor-dash', label: 'Doctor Dashboard', url: '/hms/doctor/dashboard', icon: 'AppWindow', sort: 11, permission: 'hms:dashboard:doctor' },
            { key: 'hms-nursing', label: 'Nursing Station', url: '/hms/nursing/dashboard', icon: 'Activity', sort: 12, permission: 'hms:dashboard:nurse' },
            { key: 'hms-lab', label: 'Laboratory', url: '#', icon: 'Microscope', sort: 13, permission: 'lab:view' },
            { key: 'hms-lab-dashboard', label: 'Dashboard', url: '/hms/lab/dashboard', icon: 'LayoutDashboard', sort: 1, parent_key: 'hms-lab', permission: 'lab:view' },
            { key: 'hms-lab-billing', label: 'Lab Billing', url: '/hms/billing/new', icon: 'Receipt', sort: 2, parent_key: 'hms-lab', permission: 'billing:view' },
            { key: 'hms-lab-pending', label: 'Pending Samples', url: '/hms/lab/pending', icon: 'TestTube', sort: 3, parent_key: 'hms-lab', permission: 'lab:view' },
            { key: 'hms-lab-results', label: 'Result Processing', url: '/hms/lab/results', icon: 'Activity', sort: 4, parent_key: 'hms-lab', permission: 'lab:view' },
            { key: 'hms-lab-reports', label: 'Approved Reports', url: '/hms/lab/reports', icon: 'FileCheck', sort: 5, parent_key: 'hms-lab', permission: 'lab:view' },
            { key: 'hms-lab-orders', label: 'All Orders', url: '/hms/lab/orders', icon: 'List', sort: 6, parent_key: 'hms-lab', permission: 'lab:view' },
            { key: 'hms-lab-tests', label: 'Test Catalog', url: '/hms/lab/tests', icon: 'Settings', sort: 7, parent_key: 'hms-lab', permission: 'lab:view' },
            { key: 'hms-pharmacy-billing', label: 'Pharmacy Billing', url: '/hms/pharmacy/billing', icon: 'Pill', sort: 14, permission: 'billing:view' },
            { key: 'hms-billing', label: 'Billing', url: '/hms/billing', icon: 'Receipt', sort: 15, permission: 'billing:view' },
            { key: 'hms-claims', label: 'Claims', url: '/hms/billing/claims', icon: 'ShieldPlus', sort: 16, permission: 'billing:view' },
            { key: 'hms-patients', label: 'Patients', url: '/hms/patients', icon: 'UserCircle', sort: 20, permission: 'patients:view' },
            { key: 'hms-appointments', label: 'Appointments', url: '/hms/appointments', icon: 'Calendar', sort: 21, permission: 'appointments:view' },
            { key: 'hms-dashboard', label: 'HMS Dashboard', url: '/hms/dashboard', icon: 'LayoutDashboard', sort: 5, permission: 'hms:admin' },
            { key: 'hms-analytics', label: 'Analytics & Trends', url: '/hms/analytics', icon: 'BarChart3', sort: 6, permission: 'hms:admin' },
            { key: 'hms-wards', label: 'Clinics / Wards', url: '/hms/wards', icon: 'LayoutGrid', sort: 40, permission: 'hms:admin' },
            { key: 'hms-doctors', label: 'Clinicians & Staff', url: '/hms/doctors', icon: 'UserCheck', sort: 41, permission: 'hms:admin' },
            { key: 'hms-attendance', label: 'Attendance', url: '/hms/attendance', icon: 'Clock', sort: 50, permission: 'hms:admin' },
            { key: 'hms-roster', label: 'Staff Roster', url: '/hms/attendance/roster', icon: 'Layers', sort: 51, parent_key: 'hms-attendance', permission: 'hms:admin' },
            { key: 'hms-attendance-logs', label: 'Daily Logs', url: '/hms/attendance/logs', icon: 'ListChecks', sort: 52, parent_key: 'hms-attendance', permission: 'hms:admin' },
            { key: 'hms-attendance-analytics', label: 'Staff Analytics', url: '/hms/attendance/analytics', icon: 'BarChart3', sort: 53, parent_key: 'hms-attendance', permission: 'hms:admin' },
            { key: 'hms-hr-dashboard', label: 'HR Command Center', url: '/hms/hr/dashboard', icon: 'Briefcase', sort: 60, permission: 'hms:admin' },
            { key: 'hms-hr-attendance', label: 'HR Attendance', url: '/hms/hr/attendance', icon: 'History', sort: 61, parent_key: 'hms-hr-dashboard', permission: 'hms:admin' },
            { key: 'hms-hr-leave', label: 'Leave Approvals', url: '/hms/hr/leave', icon: 'CalendarX', sort: 62, parent_key: 'hms-hr-dashboard', permission: 'hms:admin' },
            { key: 'hms-hr-payroll', label: 'Payroll Engine', url: '/hms/hr/payroll', icon: 'DollarSign', sort: 63, parent_key: 'hms-hr-dashboard', permission: 'hms:admin' },
        ];

        // --- HELPER FOR RAW SQL INSERT (Duplicate for scope) ---
        // Note: Ideally extract this to a shared helper file, but keeping localized for now to avoid large refactors.
        const rawInsertHms = async (data: any) => {
            const rawId = crypto.randomUUID();
            const parentId = data.parent_id || null;
            const perm = data.permission_code || null;

            await prisma.$executeRawUnsafe(`
                INSERT INTO "menu_items" 
                ("id", "label", "url", "key", "module_key", "icon", "sort_order", "permission_code", "is_global", "parent_id", "created_at", "updated_at")
                VALUES 
                ($1::uuid, $2, $3, $4, $5, $6, $7, $8, true, $9::uuid, NOW(), NOW())
            `, rawId, data.label, data.url, data.key, data.module_key, data.icon, data.sort_order, perm, parentId);
            return { id: rawId };
        };

        for (const item of hmsItems) {
            try {
                const existing = await prisma.menu_items.findFirst({
                    where: { key: item.key }
                });

                let currentId = existing?.id;
                if (!existing) {
                    const created = await prisma.menu_items.create({
                        data: {
                            label: item.label,
                            url: item.url,
                            key: item.key,
                            module_key: 'hms',
                            icon: item.icon,
                            sort_order: item.sort,
                            permission_code: item.permission,
                            is_global: true,
                            parent_id: null
                        }
                    });
                    currentId = created.id;
                    console.log(`Auto-seeded HMS Menu: ${item.label}`);
                } else {
                    // Always update permission_code to ensure security
                    await prisma.menu_items.update({
                        where: { id: existing.id },
                        data: {
                            label: item.label,
                            url: item.url,
                            icon: item.icon,
                            sort_order: item.sort,
                            permission_code: item.permission
                        }
                    });
                }
                
                // Nesting Fix: If it has a parent_key, find that parent and set it
                if ((item as any).parent_key && currentId) {
                    const parent = await prisma.menu_items.findFirst({ where: { key: (item as any).parent_key } });
                    if (parent) {
                        await prisma.menu_items.update({
                            where: { id: currentId },
                            data: { parent_id: parent.id }
                        });
                    }
                } else if (currentId) {
                    await prisma.menu_items.update({
                        where: { id: currentId },
                        data: { parent_id: null }
                    });
                }
            } catch (innerError: any) {
                console.error(`Failed to seed HMS menu item ${item.label} (Prisma):`, innerError?.message);
                // Fallback: Raw SQL Insert
                try {
                    await rawInsertHms({
                        label: item.label, url: item.url, key: item.key, module_key: 'hms', icon: item.icon,
                        sort_order: item.sort, permission_code: item.permission, parent_id: null
                    });
                    console.log(`Auto-seeded HMS Menu via Raw SQL: ${item.label}`);
                } catch (rawError: any) {
                    console.error(`Failed to seed HMS menu item ${item.label} via Raw SQL:`, rawError?.message);
                }
            }
        }
        isHmsMenuSeeded = true;
    } catch (e) {
        console.error("Failed to seed HMS menus:", e);
    }
}

let isPurchasingMenuSeeded = false;

export async function ensurePurchasingMenus() {
    if (isPurchasingMenuSeeded) return;
    isPurchasingMenuSeeded = true; // Lock immediately
    try {
        // 0. Ensure Reports Parent Exists
        await ensureInventoryReports();

        // 1. Ensure 'Procurement' Parent Exists
        let procParent = await prisma.menu_items.findFirst({ where: { key: 'inv-procurement' } });

        if (!procParent) {
            const inventoryModule = await prisma.menu_items.findFirst({ where: { key: 'hms-inventory' } });
            // Fallback to separate group if no inventory parent found easily, or create top level
            procParent = await prisma.menu_items.create({
                data: { label: 'Procurement', url: '#', key: 'inv-procurement', module_key: 'inventory', icon: 'ShoppingCart', sort_order: 10, permission_code: 'purchasing:view', is_global: true }
            });
        } else if (!procParent.permission_code || procParent.sort_order !== 10) {
            await prisma.menu_items.update({ where: { id: procParent.id }, data: { permission_code: 'purchasing:view', sort_order: 10, parent_id: null } });
        }

        const items = [
            { key: 'inv-po', label: 'Purchase Orders', url: '/hms/purchasing/orders', icon: 'FileText', sort: 10, permission: 'purchasing:view' },
            { key: 'inv-receipts', label: 'Goods Receipts', url: '/hms/purchasing/receipts', icon: 'ClipboardList', sort: 20, permission: 'purchasing:view' },
            { key: 'inv-returns', label: 'Purchase Returns', url: '/hms/purchasing/returns', icon: 'Undo2', sort: 30, permission: 'purchasing:returns:view' },
            { key: 'inv-suppliers', label: 'Suppliers', url: '/hms/purchasing/suppliers', icon: 'Truck', sort: 40, permission: 'suppliers:view' },
        ];

        // Ensure Audit Terminal is Top Level
        const auditKey = 'inv-audit';
        const existingAudit = await prisma.menu_items.findFirst({ where: { key: auditKey } });
        if (!existingAudit) {
            await prisma.menu_items.create({
                data: { label: 'Audit Terminal', url: '/hms/inventory/audit', key: auditKey, module_key: 'inventory', icon: 'ShieldCheck', sort_order: 20, permission_code: 'inventory:view', is_global: true }
            });
        } else {
            await prisma.menu_items.update({ where: { id: existingAudit.id }, data: { parent_id: null, sort_order: 20 } });
        }

        // Ensure Dashboard is Top Level
        const dashKey = 'inv-dashboard';
        const existingDash = await prisma.menu_items.findFirst({ where: { key: dashKey } });
        if (!existingDash) {
            await prisma.menu_items.create({
                data: { label: 'Inventory Overview', url: '/hms/inventory', key: dashKey, module_key: 'inventory', icon: 'LayoutDashboard', sort_order: 5, permission_code: 'inventory:view', is_global: true }
            });
        } else if (!existingDash.permission_code || existingDash.parent_id || existingDash.label !== 'Inventory Overview' || existingDash.sort_order !== 5) {
            await prisma.menu_items.update({ where: { id: existingDash.id }, data: { parent_id: null, permission_code: 'inventory:view', label: 'Inventory Overview', sort_order: 5 } });
        }
        // Ensure Product Master Exists
        const prodKey = 'inv-products';
        const existingProd = await prisma.menu_items.findFirst({ where: { key: prodKey } });
        if (!existingProd) {
            await prisma.menu_items.create({
                data: { label: 'Product Master', url: '/hms/inventory/products', key: prodKey, module_key: 'inventory', icon: 'Package', sort_order: 30, permission_code: 'inventory:view', is_global: true }
            });
        } else if (!existingProd.permission_code || existingProd.sort_order !== 30) {
            await prisma.menu_items.update({ where: { id: existingProd.id }, data: { permission_code: 'inventory:view', sort_order: 30 } });
        }

        // Ensure Bulk Import Exists (Direct Access)
        const importKey = 'inv-import';
        const existingImport = await prisma.menu_items.findFirst({ where: { key: importKey } });
        if (!existingImport) {
            await prisma.menu_items.create({
                data: { label: 'Bulk Import Products', url: '/hms/inventory/products?import=true', key: importKey, module_key: 'inventory', icon: 'Upload', sort_order: 31, permission_code: 'inventory:view', is_global: true }
            });
        } else if (existingImport.url !== '/hms/inventory/products?import=true' || existingImport.sort_order !== 31) {
            await prisma.menu_items.update({ where: { id: existingImport.id }, data: { url: '/hms/inventory/products?import=true', sort_order: 31 } });
        }

        for (const item of items) {
            const existing = await prisma.menu_items.findFirst({ where: { key: item.key } });
            if (!existing) {
                await prisma.menu_items.create({
                    data: {
                        label: item.label,
                        url: item.url,
                        key: item.key,
                        module_key: 'inventory',
                        icon: item.icon,
                        parent_id: procParent.id,
                        sort_order: item.sort,
                        permission_code: item.permission,
                        is_global: true
                    }
                });
                console.log(`Auto-seeded Purchasing Menu: ${item.label}`);
            } else {
                await prisma.menu_items.update({ where: { id: existing.id }, data: { permission_code: item.permission, sort_order: item.sort } });
            }
        }

        // Also ensure Sales Returns in Billing
        // Try to find the 'Billing' group or similar
        const billingMenu = await prisma.menu_items.findFirst({ where: { key: 'hms-billing' } });
        // hms-billing is usually a top level item or child. In fallback it was child of Income.
        // In HMS seeder, it's a top level item sort 60.

        // If billing is top level, we might want to make it a parent or add a sibling.
        // Let's add 'Credit Notes' as a top level item after Billing if Billing is top level.
        if (billingMenu) {
            const existingSR = await prisma.menu_items.findFirst({ where: { key: 'hms-sales-returns' } });
            if (!existingSR) {
                await prisma.menu_items.create({
                    data: {
                        label: 'Credit Notes',
                        url: '/hms/billing/returns',
                        key: 'hms-sales-returns',
                        module_key: 'hms',
                        icon: 'RotateCcw',
                        parent_id: billingMenu.parent_id, // Same level
                        sort_order: (billingMenu.sort_order || 60) + 1,
                        is_global: true
                    }
                });
                console.log("Auto-seeded Sales Returns Menu");
            }
        }

        // 3. CLEANUP: Delete any other items in 'inventory' module
        // const allowedKeys = ['inv-dashboard', 'inv-products', 'inv-procurement', 'inv-suppliers', 'inv-po', 'inv-receipts', 'inv-returns'];
        // Also keep 'hms-inventory' if it was somehow mapped to inventory, but we want to be strict.

        /* DISABLE CLEANUP TO PREVENT FK ERRORS
        await prisma.menu_items.deleteMany({
            where: {
                module_key: 'inventory',
                key: { notIn: allowedKeys }
            }
        });
        */

        // 3b. ADDITIONAL CLEANUP: Rogue Keys (True Bulletproof 2.0)
        // 1. Explicitly handle 'inventory-root' which acts as a parent
        const rogueRoot = await prisma.menu_items.findFirst({ where: { key: 'inventory-root' } });
        if (rogueRoot) {
            // Unlink any children pointing to this root
            await prisma.menu_items.updateMany({
                where: { parent_id: rogueRoot.id },
                data: { parent_id: null }
            });
            // Delete the root
            // await prisma.menu_items.delete({ where: { id: rogueRoot.id } }); // FK Error risk
        }

        // const rogueKeys = ['inv-receive', 'inventory.products', 'inv-moves']; // Removed hms.inventory
        // Unlink these specific keys if they have parents (nesting cleanup)
        /*
        await prisma.menu_items.updateMany({
            where: { key: { in: rogueKeys } },
            data: { parent_id: null }
        });
        // Delete them
        await prisma.menu_items.deleteMany({ where: { key: { in: rogueKeys } } });
        */

        // 4. STANDARDIZE: Update Sort Orders and Labels
        await prisma.menu_items.updateMany({ where: { key: 'inv-dashboard' }, data: { sort_order: 10, label: 'Inventory' } }); // Renamed to Inventory
        await prisma.menu_items.updateMany({ where: { key: 'inv-products' }, data: { sort_order: 20, label: 'Product Master' } });
        await prisma.menu_items.updateMany({ where: { key: 'inv-procurement' }, data: { sort_order: 30 } });

        // 5. MIGRATION: Move HMS Menus to Proper Modules (World Class Standard)
        // Move 'hms-accounting' to 'accounting' module
        await prisma.menu_items.updateMany({
            where: { key: 'hms-accounting' },
            data: { module_key: 'finance', sort_order: 10 }
        });
        // Ensure children follow (module_key is usually denormalized on parent, but good to be safe)
        const hmsAcc = await prisma.menu_items.findFirst({ where: { key: 'hms-accounting' } });
        if (hmsAcc) {
            await prisma.menu_items.updateMany({
                where: { parent_id: hmsAcc.id },
                data: { module_key: 'finance' }
            });
        }

        // Move 'hms-inventory' to 'inventory' module
        await prisma.menu_items.updateMany({
            where: { key: 'hms-inventory' },
            data: { module_key: 'inventory', sort_order: 6, label: 'Pharmacy Store' } // Rename to distinguish
        });
        const hmsInv = await prisma.menu_items.findFirst({ where: { key: 'hms-inventory' } });
        if (hmsInv) {
            await prisma.menu_items.updateMany({
                where: { parent_id: hmsInv.id },
                data: { module_key: 'inventory' }
            });
        }

        // Move 'hms-purchasing' to 'inventory' module (Procurement)
        await prisma.menu_items.updateMany({
            where: { key: 'hms-purchasing' },
            data: { module_key: 'inventory', sort_order: 7, label: 'Central Purchasing' }
        });
        const hmsPurch = await prisma.menu_items.findFirst({ where: { key: 'hms-purchasing' } });
        if (hmsPurch) {
            await prisma.menu_items.updateMany({
                where: { parent_id: hmsPurch.id },
                data: { module_key: 'inventory' }
            });
        }

        isPurchasingMenuSeeded = true;
    } catch (e) {
        console.error("Failed to seed Purchasing menus:", e);
    }
}
async function ensureAccountingDashboard() {
    const existing = await prisma.menu_items.findFirst({ where: { key: 'acc-dashboard' } });
    if (!existing) {
        await prisma.menu_items.create({
            data: {
                label: 'Financial Overview',
                url: '/hms/accounting',
                key: 'acc-dashboard',
                module_key: 'finance',
                icon: 'LayoutDashboard',
                sort_order: 1,
                is_global: true,
                permission_code: 'accounting:view'
            }
        });
        console.log("Auto-seeded Accounting Dashboard");
    }
}

async function ensureInventoryReports() {
    let reportParent = await prisma.menu_items.findFirst({ where: { key: 'inv-reports' } });
    if (!reportParent) {
        reportParent = await prisma.menu_items.create({
            data: { label: 'REPORTS', url: '#', key: 'inv-reports', module_key: 'inventory', icon: 'BarChart3', sort_order: 80, is_global: true, permission_code: 'inventory:view' }
        });
    } else {
        await prisma.menu_items.update({ where: { id: reportParent.id }, data: { sort_order: 80, parent_id: null } });
    }

    const reports = [
        { key: 'inv-report-stock', label: 'Stock Report', url: '/hms/inventory/reports/stock', icon: 'BarChart3', sort: 10 },
        { key: 'inv-report-ledger', label: 'Movement Register', url: '/hms/inventory/reports/ledger', icon: 'Database', sort: 20 },
        { key: 'inv-report-valuation', label: 'Stock Valuation', url: '/hms/inventory/reports/stock', icon: 'DollarSign', sort: 30 },
        { key: 'inv-report-ageing', label: 'Stock Ageing', url: '/hms/inventory/reports/ageing', icon: 'Clock', sort: 40 },
    ];

    for (const r of reports) {
        const existing = await prisma.menu_items.findFirst({ where: { key: r.key } });
        if (!existing) {
            await prisma.menu_items.create({
                data: { label: r.label, url: r.url, key: r.key, module_key: 'inventory', icon: r.icon, parent_id: reportParent.id, sort_order: r.sort, is_global: true, permission_code: 'inventory:view' }
            });
        } else if (existing.label !== r.label || existing.url !== r.url) {
            await prisma.menu_items.update({
                where: { id: existing.id },
                data: { label: r.label, url: r.url, parent_id: reportParent.id }
            });
        }
    }
}
