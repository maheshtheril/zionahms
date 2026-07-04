import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { Button } from '@/components/ui/button'
import { Plus, Sparkles, TrendingUp, Banknote, PieChart, Filter, Search, DollarSign } from "lucide-react"
import { formatCurrency } from '@/lib/currency'
import { LeadTable } from '@/components/crm/lead-table'
import { Input } from '@/components/ui/input'
import { SearchLeads } from '@/components/crm/search-leads'

import { getCompanyDefaultCurrency } from '@/app/actions/currency'

import { getSources, getCRMUsers } from '@/app/actions/crm/masters'
import { FilterLeads } from '@/components/crm/filter-leads'
import { ExportLeadsButton } from '@/components/crm/export-leads-button'

export const dynamic = 'force-dynamic'

interface PageProps {
    searchParams: {
        page?: string
        limit?: string
        q?: string
        status?: string
        source_id?: string
        owner_id?: string
        from?: string
        to?: string
        is_hot?: string
        followup_from?: string
        followup_to?: string
        branch_id?: string
    }
}

export default async function LeadsPage(props: PageProps) {
    const searchParams = await props.searchParams;
    const session = await auth()
    const tenantId = session?.user?.tenantId
    const defaultCurrency = await getCompanyDefaultCurrency()

    const page = Number(searchParams?.page) || 1
    const limit = Number(searchParams?.limit) || 20
    const query = searchParams?.q || ''
    const status = searchParams?.status
    const sourceId = searchParams?.source_id
    const ownerId = searchParams?.owner_id
    const branchId = searchParams?.branch_id
    const fromDate = searchParams?.from
    const toDate = searchParams?.to
    const followupFrom = searchParams?.followup_from
    const followupTo = searchParams?.followup_to
    const isHot = searchParams?.is_hot === 'true'
    const skip = (page - 1) * limit

    const isGlobalAdmin = session?.user?.isAdmin
    const isTenantAdmin = session?.user?.isTenantAdmin
    const canViewAll = isGlobalAdmin || isTenantAdmin || session?.user?.role?.toLowerCase() === 'admin'

    // Security: Restrict non-admins to their own data
    let effectiveOwnerId = undefined; // Default: No owner filter (See ALL)

    // IF user CAN view all (Admin/TenantAdmin):
    // Only filter by owner if they explicitly requested it via ?owner_id=...
    if (canViewAll) {
        effectiveOwnerId = ownerId;
    }
    // IF user CANNOT view all (Standard User):
    // Force the filter to be their own ID, ignoring whatever they requested
    else {
        effectiveOwnerId = session?.user?.id;
    }

    const where: any = {
        tenant_id: tenantId || undefined,
        deleted_at: null,
        ...(status ? { status } : {}),
        ...(sourceId ? { source_id: sourceId } : {}),
        ...(effectiveOwnerId ? { owner_id: effectiveOwnerId } : {}),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(isHot ? { is_hot: true } : {}),
        ...((fromDate || toDate) ? {
            created_at: {
                ...(fromDate ? { gte: new Date(fromDate) } : {}),
                ...(toDate ? { lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)) } : {}),
            }
        } : {}),
        ...((followupFrom || followupTo) ? {
            next_followup_date: {
                ...(followupFrom ? { gte: new Date(followupFrom) } : {}),
                ...(followupTo ? { lte: new Date(new Date(followupTo).setHours(23, 59, 59, 999)) } : {}),
            }
        } : {}),
        ...(query ? {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { company_name: { contains: query, mode: 'insensitive' } },
                { contact_name: { contains: query, mode: 'insensitive' } },
            ]
        } : {})
    }

    // Parallel data fetching for performance
    const [leads, totalCount, stats, sources, users, branches] = await Promise.all([
        prisma.crm_leads.findMany({
            where,
            take: limit,
            skip: skip,
            orderBy: { created_at: 'desc' },
            include: {
                stage: true,
                target_type: true,
                branch: {
                    select: { name: true }
                },
                owner: {
                    select: { id: true, name: true, email: true }
                },
                source: true
            } as any
        }),
        prisma.crm_leads.count({ where }),
        prisma.crm_leads.aggregate({
            where: where,
            _sum: {
                estimated_value: true
            }
        }),
        getSources(),
        getCRMUsers(),
        prisma.hms_branch.findMany({
            where: { tenant_id: tenantId || undefined, is_active: true },
            select: { id: true, name: true }
        })
    ])

    const hotLeadsCount = await prisma.crm_leads.count({
        where: {
            ...where,
            is_hot: true
        }
    })

    const totalValue = Number(stats._sum.estimated_value) || 0

    return (
        <div className="min-h-screen bg-futuristic">
            {/* Animated Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
            </div>

            <div className="relative container mx-auto py-8 space-y-8 max-w-[1600px]">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-bold text-gradient-primary tracking-tight">Leads Overview</h1>
                            {!canViewAll && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
                                    My Leads
                                </span>
                            )}
                            {canViewAll && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                                    All Leads
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 mt-1 dark:text-slate-400">
                            Driving growth through intelligent lead tracking.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex-1 min-w-[300px] relative">
                            <SearchLeads defaultValue={query} />
                        </div>
                        <div className="flex gap-2">
                            <ExportLeadsButton />
                            <FilterLeads sources={sources} users={users} branches={branches} />
                            <Link href="/crm/leads/new">
                                <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg border-none px-6 rounded-xl">
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Lead
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="glass-card bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-white/20 shadow-xl flex items-center justify-between hover:scale-[1.02] transition-all duration-300">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Pipeline Leads</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{totalCount}</h3>
                        </div>
                        <div className="h-12 w-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                            <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                    <div className="glass-card bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-white/20 shadow-xl flex items-center justify-between hover:scale-[1.02] transition-all duration-300">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Hot Opportunities 🔥</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{hotLeadsCount}</h3>
                        </div>
                        <div className="h-12 w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                            <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                    <div className="glass-card bg-white/40 dark:bg-slate-900/40 p-6 rounded-2xl border border-white/20 shadow-xl flex items-center justify-between hover:scale-[1.02] transition-all duration-300">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Potential Value</p>
                            <h3 className="text-3xl font-bold text-gradient-primary mt-1">{formatCurrency(totalValue, defaultCurrency.code)}</h3>
                        </div>
                        <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                            {defaultCurrency.code === 'INR' ? (
                                <Banknote className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="glass-card bg-white/30 dark:bg-slate-900/30 rounded-3xl border border-white/20 shadow-2xl overflow-hidden backdrop-blur-xl">
                    <LeadTable
                        data={leads}
                        totalOrCount={totalCount}
                        page={page}
                        limit={limit}
                    />
                </div>
            </div>
        </div>
    )
}
