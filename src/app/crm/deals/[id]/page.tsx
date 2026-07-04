import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Edit, ArrowLeft, Target, Calendar, TrendingUp, DollarSign, Banknote } from "lucide-react"
import { formatCurrency } from '@/lib/currency'
import { Badge } from '@/components/ui/badge'

interface PageProps {
    params: {
        id: string
    }
}

export default async function ViewDealPage(props: PageProps) {
    const params = await props.params;
    const session = await auth()
    const tenantId = session?.user?.tenantId

    if (!tenantId) return <div>Unauthorized</div>

    const deal = await prisma.crm_deals.findUnique({
        where: { id: params.id, tenant_id: tenantId },
        include: {
            pipeline: true,
            stage: true,
            account: true,
        }
    })

    if (!deal) notFound()

    return (
        <div className="min-h-screen bg-slate-50/50 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Link href="/crm/deals">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pipeline
                        </Button>
                    </Link>
                    <Link href={`/crm/deals/${deal.id}/edit`}>
                        <Button>
                            <Edit className="w-4 h-4 mr-2" /> Edit Deal
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900">{deal.title}</h1>
                                    <p className="text-slate-500 mt-1">{deal.pipeline?.name}</p>
                                </div>
                                <Badge className="uppercase">{deal.status}</Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">Value</p>
                                    <div className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                        {deal.currency === 'INR' ? <Banknote className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                                        {formatCurrency(Number(deal.value), deal.currency)}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">Stage</p>
                                    <div className="text-xl font-semibold text-slate-900">
                                        {deal.stage?.name || 'Unknown'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <h2 className="text-xl font-bold mb-4">Details</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Probability</span>
                                    <span className="font-semibold">{Number(deal.probability)}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Expected Close</span>
                                    <span className="font-semibold">{deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Account</span>
                                    <span className="font-semibold">{deal.account?.name || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold mb-4">Pipeline Progress</h3>
                            <div className="relative pt-1">
                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-100">
                                    <div
                                        style={{ width: `${Number(deal.probability)}%` }}
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">This deal is {Number(deal.probability)}% likely to close</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
