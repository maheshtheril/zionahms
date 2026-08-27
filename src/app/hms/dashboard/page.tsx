import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { DashboardClient } from "@/components/hms/dashboard-client"
import { ensureHmsMenus } from "@/lib/menu-seeder"
import { getTenant } from "../../actions/tenant"
import { getCurrentCompany } from "../../actions/company"
import { redirect } from 'next/navigation'
// hms_invoice_status removed
import { getUserPermissions } from "@/app/actions/rbac"


export default async function DashboardPage() {
    // [OPTIMIZATION] Removed blocking ensureHmsMenus() - Self-healing handled in background or on-demand
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    const perms = await getUserPermissions(session.user.id);
    const role = session?.user?.role?.toLowerCase() || '';
    const isAdmin = session?.user?.isAdmin || (session?.user as any)?.isTenantAdmin || role === 'admin' || role === 'super_admin' || perms.includes('*') || perms.includes('hms:dashboard:admin');

    // ONLY redirect non-admin functional staff (Doctors, Nurses, Receptionists, Pharmacists, Lab Techs)
    if (!isAdmin) {
        // 1. DOCTOR DASHBOARD
        if (perms.includes('hms:dashboard:doctor') || role === 'doctor') {
            redirect('/hms/doctor/dashboard');
        }

        // 2. NURSING DASHBOARD
        if (perms.includes('hms:dashboard:nurse') || role === 'nurse') {
            redirect('/hms/nursing/dashboard');
        }

        // 3. RECEPTION DASHBOARD
        if (perms.includes('hms:dashboard:reception') || role === 'receptionist') {
            redirect('/hms/reception/dashboard');
        }

        // 4. LAB DASHBOARD
        if (perms.includes('hms:dashboard:lab') || role.includes('lab')) {
            redirect('/hms/lab/dashboard');
        }

        // 5. ACCOUNTING DASHBOARD
        if (perms.includes('hms:dashboard:accounting') || role === 'accountant' || role === 'finance') {
            redirect('/hms/accounting');
        }

        // 6. PHARMACY DASHBOARD
        if (perms.includes('hms:dashboard:pharmacy') || role.includes('pharmac')) {
            redirect('/hms/pharmacy/dashboard');
        }
    }

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500 bg-slate-50/50 rounded-xl m-4 border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-sm border border-red-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </div>
                <div className="text-2xl font-bold mb-2 text-slate-700">Access Restricted</div>
                <p className="text-slate-600">The main management dashboard is restricted to Administrators.</p>
                <p className="text-sm mt-4 text-slate-400">Please use the side menu to navigate to your assigned modules.</p>
            </div>
        )
    }

    const tenantId = session?.user?.tenantId
    const companyId = session?.user?.companyId

    if (!tenantId || !companyId) {
        // Fallback for Receptionists who might be routed here but belong at /hms/reception/dashboard
        if (session?.user?.role === 'receptionist') {
            redirect('/hms/reception/dashboard');
        }

        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
                <div className="text-lg font-semibold mb-2">Setup Required</div>
                <p>You are logged in, but no default Company is assigned to your account.</p>
                <p className="text-sm mt-4">Tenant ID: {tenantId || 'Missing'}</p>
            </div>
        )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Yesterday boundaries for trend calculation
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // 7-day window for revenue chart
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    // Fetch essential data in parallel
    const [
        patients,
        doctors,
        rawAppointments,
        totalPatientsCount,
        pendingBillsCount,
        revenueAggregate,
        tenant,
        currentCompany,
        // New: yesterday stats for trends
        yesterdayPatientsCount,
        yesterdayAppointmentsCount,
        yesterdayPendingBillsCount,
        yesterdayRevenue,
        // New: 7-day revenue for chart
        sevenDayRevenue,
        // New: Recent bills for activity feed
        recentBills,
    ] = await Promise.all([
        // 1. Patients for modal (limit to recent/active)
        prisma.hms_patient.findMany({
            where: { tenant_id: tenantId },
            take: 100,
            orderBy: { updated_at: 'desc' },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                patient_number: true,
                dob: true,
                gender: true
            }
        }),

        // 2. Doctors for modal
        prisma.hms_clinicians.findMany({
            where: {
                is_active: true,
                tenant_id: tenantId
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                hms_specializations: { select: { name: true } },
                role: true,
                consultation_start_time: true,
                consultation_end_time: true,
                consultation_slot_duration: true
            },
            orderBy: { first_name: 'asc' }
        }),

        // 3. Appointments for today
        prisma.hms_appointments.findMany({
            where: {
                tenant_id: tenantId,
                company_id: companyId,
                starts_at: {
                    gte: today,
                    lt: tomorrow
                }
            },
            orderBy: { starts_at: 'asc' }
        }),

        // 4. Stats: Total Patients
        prisma.hms_patient.count({ where: { tenant_id: tenantId } }),

        // 5. Stats: Pending Bills
        prisma.hms_invoice.count({
            where: {
                tenant_id: tenantId,
                status: 'draft' as any
            }
        }),

        // 6. Stats: Revenue (Today)
        prisma.hms_invoice.aggregate({
            where: {
                tenant_id: tenantId,
                status: 'paid' as any,
                created_at: {
                    gte: today,
                    lt: tomorrow
                }
            },
            _sum: {
                total: true
            }
        }).then(r => Number(r._sum.total || 0)),

        // 7. Tenant Branding
        getTenant(),

        // 8. Company Branding
        getCurrentCompany(),

        // 9. Yesterday: Total Patients (cumulative as of yesterday — use total - today's new patients)
        prisma.hms_patient.count({
            where: {
                tenant_id: tenantId,
                created_at: { lt: today }
            }
        }),

        // 10. Yesterday: Appointments count
        prisma.hms_appointments.count({
            where: {
                tenant_id: tenantId,
                company_id: companyId,
                starts_at: {
                    gte: yesterday,
                    lt: today
                }
            }
        }),

        // 11. Yesterday: Pending bills
        prisma.hms_invoice.count({
            where: {
                tenant_id: tenantId,
                status: 'draft' as any,
                created_at: {
                    gte: yesterday,
                    lt: today
                }
            }
        }),

        // 12. Yesterday: Revenue
        prisma.hms_invoice.aggregate({
            where: {
                tenant_id: tenantId,
                status: 'paid' as any,
                created_at: {
                    gte: yesterday,
                    lt: today
                }
            },
            _sum: { total: true }
        }).then(r => Number(r._sum.total || 0)),

        // 13. 7-day revenue breakdown
        prisma.hms_invoice.findMany({
            where: {
                tenant_id: tenantId,
                status: 'paid' as any,
                created_at: {
                    gte: sevenDaysAgo,
                    lt: tomorrow
                }
            },
            select: {
                created_at: true,
                total: true
            }
        }),

        // 14. Recent 5 bills with patient info
        prisma.hms_invoice.findMany({
            where: { tenant_id: tenantId },
            take: 5,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                invoice_number: true,
                total: true,
                status: true,
                created_at: true,
                hms_patient: {
                    select: {
                        first_name: true,
                        last_name: true,
                        patient_number: true
                    }
                }
            }
        }),
    ])

    // Manual enrichment of appointments
    const patientIds = [...new Set(rawAppointments.map(a => a.patient_id).filter(Boolean))] as string[]
    const clinicianIds = [...new Set(rawAppointments.map(a => a.clinician_id).filter(Boolean))] as string[]

    const [relatedPatients, relatedClinicians] = await Promise.all([
        prisma.hms_patient.findMany({
            where: { id: { in: patientIds } },
            select: { id: true, first_name: true, last_name: true, patient_number: true }
        }),
        prisma.hms_clinicians.findMany({
            where: { id: { in: clinicianIds } },
            select: { id: true, first_name: true, last_name: true }
        })
    ])

    const patientMap = new Map(relatedPatients.map(p => [p.id, p]))
    const clinicianMap = new Map(relatedClinicians.map(c => [c.id, c]))

    const appointments = rawAppointments.map(apt => ({
        ...apt,
        patient: patientMap.get(apt.patient_id as string) || { first_name: 'Unknown', last_name: '', patient_number: 'N/A' },
        clinician: clinicianMap.get(apt.clinician_id as string) || { first_name: 'Unknown', last_name: '' }
    }))

    // Build 7-day revenue chart data
    const revenueByDay: Record<string, number> = {}
    for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo)
        d.setDate(d.getDate() + i)
        const key = d.toISOString().split('T')[0]
        revenueByDay[key] = 0
    }
    for (const inv of sevenDayRevenue) {
        const key = new Date(inv.created_at).toISOString().split('T')[0]
        if (key in revenueByDay) {
            revenueByDay[key] = (revenueByDay[key] || 0) + Number(inv.total || 0)
        }
    }
    const revenueChart = Object.entries(revenueByDay).map(([date, value]) => ({
        date,
        label: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
        value
    }))

    // Compute % trends vs yesterday
    const calcTrend = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0
        return Math.round(((current - previous) / previous) * 100)
    }

    const stats = {
        totalPatients: totalPatientsCount,
        todayAppointments: appointments.length,
        pendingBills: pendingBillsCount as number,
        revenue: Number(revenueAggregate || 0),
        trends: {
            patients: calcTrend(totalPatientsCount, yesterdayPatientsCount),
            appointments: calcTrend(appointments.length, yesterdayAppointmentsCount),
            pendingBills: calcTrend(pendingBillsCount as number, yesterdayPendingBillsCount),
            revenue: calcTrend(Number(revenueAggregate || 0), yesterdayRevenue),
        }
    }

    return (
        <DashboardClient
            user={JSON.parse(JSON.stringify(session.user))}
            stats={stats}
            appointments={JSON.parse(JSON.stringify(appointments))}
            patients={JSON.parse(JSON.stringify(patients))}
            doctors={JSON.parse(JSON.stringify(doctors))}
            tenant={tenant}
            company={currentCompany}
            revenueChart={revenueChart}
            recentBills={JSON.parse(JSON.stringify(recentBills))}
        />
    )
}
