'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

function cleanShift(shift: any, userObj?: any) {
    if (!shift) return null;
    return {
        ...shift,
        user_name: userObj?.full_name || userObj?.name || 'Institutional Personnel',
        user_email: userObj?.email || 'user@hms.local',
        opening_balance: Number(shift.opening_balance || 0),
        closing_balance: Number(shift.closing_balance || 0),
        system_balance: Number(shift.system_balance || 0),
        difference: Number(shift.difference || 0)
    };
}

export async function getCurrentShift() {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const shift = await prisma.hms_cash_shift.findFirst({
            where: {
                user_id: session.user.id,
                status: 'open'
            }
        });
        if (!shift) return null;
        const user = await prisma.app_user.findUnique({
            where: { id: shift.user_id },
            select: { name: true, full_name: true, email: true }
        }).catch(() => null);
        return cleanShift(shift, user);
    } catch (e) {
        console.error("Failed to fetch shift:", e);
        return null;
    }
}

export async function startShift(openingBalance: number, denominations?: any) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const tenantId = session.user.tenantId;
    const companyId = session.user.companyId;

    if (!tenantId || !companyId) {
        return { error: "Tenant or Company information missing from session." };
    }

    try {
        const existing = await prisma.hms_cash_shift.findFirst({
            where: { user_id: session.user.id, status: 'open' }
        });
        if (existing) return { error: "You already have an open shift." };

        await prisma.hms_cash_shift.create({
            data: {
                tenant_id: tenantId,
                company_id: companyId,
                user_id: session.user.id,
                start_time: new Date(),
                opening_balance: openingBalance,
                denominations: denominations ? { opening: denominations } : undefined,
                status: 'open'
            }
        });
        revalidatePath('/hms/reception/dashboard');
        return { success: true };
    } catch (e) {
        return { error: (e as Error).message };
    }
}

export async function getShiftSummary(shiftId?: string | null) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        let shift: any = null;

        // 1. Look up by provided ID if valid
        if (shiftId && typeof shiftId === 'string' && shiftId.trim() !== '' && shiftId !== 'undefined' && shiftId !== 'null') {
            shift = await prisma.hms_cash_shift.findUnique({ where: { id: shiftId } }).catch(() => null);
        }

        // 2. Fallback: Find user's active open shift
        if (!shift) {
            shift = await prisma.hms_cash_shift.findFirst({
                where: {
                    user_id: session.user.id,
                    status: 'open'
                },
                orderBy: { start_time: 'desc' }
            }).catch(() => null);
        }

        // 3. Fallback: Find latest shift in tenant
        if (!shift && session.user.tenantId) {
            shift = await prisma.hms_cash_shift.findFirst({
                where: {
                    tenant_id: session.user.tenantId,
                    status: 'open'
                },
                orderBy: { start_time: 'desc' }
            }).catch(() => null);
        }

        if (!shift) {
            return { success: false, error: "No active shift found. Please start a shift first." };
        }

        // 1. Fetch Collections (Inbound) - with null safety
        let collections: any[] = [];
        try {
            collections = await prisma.hms_invoice_payments.findMany({
                where: {
                    tenant_id: shift.tenant_id,
                    created_at: { 
                        gte: shift.start_time,
                        ...(shift.end_time && { lte: shift.end_time })
                    },
                    hms_invoice: { status: { not: 'cancelled' } }
                },
                include: {
                    hms_invoice: { select: { status: true, invoice_number: true, hms_patient: { select: { first_name: true, last_name: true, full_name: true } } } }
                },
                orderBy: { created_at: 'desc' }
            });
        } catch (e) {
            console.warn("[ShiftSummary] Warning fetching collections:", (e as Error).message);
        }

        // 1.5 Fetch Invoices (Revenue generated during shift)
        let invoices: any[] = [];
        try {
            invoices = await prisma.hms_invoice.findMany({
                where: {
                    tenant_id: shift.tenant_id,
                    created_at: { 
                        gte: shift.start_time,
                        ...(shift.end_time && { lte: shift.end_time })
                    },
                    status: { not: 'cancelled' }
                },
                include: {
                    hms_patient: { select: { first_name: true, last_name: true, full_name: true } },
                    hms_invoice_lines: true
                },
                orderBy: { created_at: 'desc' }
            });
        } catch (e) {
            console.warn("[ShiftSummary] Warning fetching invoices:", (e as Error).message);
        }

        // 2. Fetch Expenses (Outbound)
        let expenses: any[] = [];
        try {
            expenses = await prisma.payments.findMany({
                where: {
                    tenant_id: shift.tenant_id,
                    ...(shift.company_id ? { company_id: shift.company_id } : {}),
                    metadata: { path: ['type'], equals: 'outbound' },
                    created_at: { 
                        gte: shift.start_time,
                        ...(shift.end_time && { lte: shift.end_time })
                    }
                },
                orderBy: { created_at: 'desc' }
            });
        } catch (e) {
            console.warn("[ShiftSummary] Warning fetching expenses:", (e as Error).message);
        }

        // 3. Calculate Summaries
        const summary = {
            cashCollected: 0,
            cashExpenses: 0,
            card: 0,
            upi: 0,
            other: 0,
            totalIn: 0,
            totalOut: 0,
            totalRevenue: 0,
            pendingBillsTotal: 0,
            netCash: 0 // (Opening + CashIn) - CashOut
        };

        // Process Collections
        collections.forEach(p => {
            const amt = Number(p.amount || 0);
            summary.totalIn += amt;
            if (p.method === 'cash') summary.cashCollected += amt;
            else if (p.method === 'card') summary.card += amt;
            else if (p.method === 'upi') summary.upi += amt;
            else summary.other += amt;
        });

        // Process Invoices
        invoices.forEach(i => {
            const total = Number(i.total || 0);
            summary.totalRevenue += total;
            const status = (i.status || '').toLowerCase();
            if (status === 'draft' || status === 'pending') {
                const outst = Number(i.outstanding_amount || i.outstanding || 0);
                const pendingAmount = outst > 0 ? outst : total;
                summary.pendingBillsTotal += pendingAmount;
            }
        });

        // Process Expenses
        expenses.forEach(e => {
            const amt = Number(e.amount || 0);
            summary.totalOut += amt;
            summary.cashExpenses += amt;
        });

        // Net Cash in Drawer = Cash Collected - Cash Expenses
        summary.netCash = summary.cashCollected - summary.cashExpenses;

        // 4. Generate Unified Ledger
        const ledger = [
            ...collections.map(c => ({
                id: c.id,
                time: c.created_at,
                type: 'IN', // INCOME
                method: c.method,
                amount: Number(c.amount),
                description: `Inv #${c.hms_invoice?.invoice_number} - ${c.hms_invoice?.hms_patient?.full_name || c.hms_invoice?.hms_patient?.first_name || 'Patient'}`,
                category: 'Sales Receipt / Collection'
            })),
            ...expenses.map(e => ({
                id: e.id,
                time: e.created_at,
                type: 'OUT', // EXPENSE
                method: 'cash',
                amount: Number(e.amount),
                description: (e.metadata as any)?.payee_name ? `${(e.metadata as any)?.category_name || 'Expense'} (${(e.metadata as any)?.payee_name})` : ((e.metadata as any)?.description || (e.metadata as any)?.memo || (e.metadata as any)?.notes || 'Petty Cash Expense'),
                category: (e.metadata as any)?.category_name || (e.metadata as any)?.category || 'Petty Cash'
            })),
            ...invoices.filter(i => {
                const status = (i.status || '').toLowerCase();
                return status === 'draft' || status === 'pending';
            }).map(i => {
                const tot = Number(i.total || 0);
                const outst = Number(i.outstanding_amount || i.outstanding || 0);
                const pendingAmt = outst > 0 ? outst : tot;
                return {
                    id: i.id,
                    time: i.created_at,
                    type: 'PENDING',
                    method: '-',
                    amount: pendingAmt,
                    description: `Unpaid Inv #${i.invoice_number} - ${i.hms_patient?.full_name || i.hms_patient?.first_name || 'Walk-in'}`,
                    category: 'Draft / Pending Bill'
                };
            })
        ].sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());

        const user = await prisma.app_user.findUnique({
            where: { id: shift.user_id },
            select: { name: true, full_name: true, email: true }
        }).catch(() => null);

        return { 
            success: true, 
            summary, 
            shift: cleanShift(shift, user), 
            ledger,
            invoices,
            collections,
            expenses
        };
    } catch (error) {
        console.error("[getShiftSummary Error]:", error);
        return { 
            success: false, 
            error: (error as Error).message || "Failed to calculate shift totals" 
        };
    }
}

export async function closeShift(shiftId: string, closingCash: number, denominations: any) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const { summary } = await getShiftSummary(shiftId) as any;
    if (!summary) return { error: "Failed to calc summary" };

    const shift = await prisma.hms_cash_shift.findUnique({ where: { id: shiftId } });
    if (!shift) return { error: "Shift not found" };

    const systemCash = Number(shift.opening_balance) + summary.netCash;
    const diff = closingCash - systemCash;

    await prisma.hms_cash_shift.update({
        where: { id: shiftId },
        data: {
            end_time: new Date(),
            closing_balance: closingCash,
            system_balance: systemCash,
            denominations: { opening: (shift.denominations as any)?.opening, closing: denominations },
            status: 'closed'
        }
    });

    revalidatePath('/hms/reception/dashboard');
    return { success: true };
}

export async function getShiftsForAudit(startDate?: Date, endDate?: Date) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const shifts = await prisma.hms_cash_shift.findMany({
            where: {
                tenant_id: session.user.tenantId,
                status: 'closed',
                end_time: {
                    gte: startDate || new Date(new Date().setDate(new Date().getDate() - 30)),
                    lte: endDate || new Date()
                }
            },
            include: {
                // We'll join with user to see who handled the shift
            },
            orderBy: {
                end_time: 'desc'
            }
        });

        // Get all users to map names
        const users = await prisma.app_user.findMany({
            where: { tenant_id: session.user.tenantId },
            select: { id: true, name: true, full_name: true }
        });

        const userMap = new Map(users.map(u => [u.id, u.full_name || u.name]));

        const shiftsWithNames = shifts.map(s => ({
            ...cleanShift(s),
            userName: userMap.get(s.user_id) || 'Unknown User'
        }));

        return { success: true, shifts: shiftsWithNames };
    } catch (e) {
        return { error: (e as Error).message };
    }
}

export async function getShiftHistory() {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const shifts = await prisma.hms_cash_shift.findMany({
            where: {
                user_id: session.user.id,
                status: 'closed'
            },
            orderBy: {
                end_time: 'desc'
            },
            take: 10
        });

        return { success: true, shifts: shifts.map(cleanShift) };
    } catch (e) {
        return { error: (e as Error).message };
    }
}

export async function verifyShift(shiftId: string, notes: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await prisma.hms_cash_shift.update({
            where: { id: shiftId },
            data: {
                notes: `AUDITED: ${notes}`,
                updated_at: new Date()
            }
        });
        revalidatePath('/hms/accounting/shifts');
        return { success: true };
    } catch (e) {
        return { error: (e as Error).message };
    }
}

export async function recordShiftExpense(amount: number, description: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const shift = await prisma.hms_cash_shift.findFirst({
            where: { user_id: session.user.id, status: 'open' }
        });

        if (!shift) return { error: "No active shift to log expense." };

        await prisma.payments.create({
            data: {
                id: crypto.randomUUID(),
                tenant_id: session.user.tenantId!,
                company_id: session.user.companyId!,
                amount: amount,
                payment_date: new Date(),
                payment_method: 'cash',
                created_by: session.user.id,
                metadata: {
                    type: 'outbound',
                    category: 'Petty Cash',
                    description: description,
                    source: 'shift_manager',
                    shift_id: shift.id
                }
            }
        });
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "Failed to log expense" };
    }
}
