
import { Metadata } from 'next'
import { getPotentialAssignees, getTarget } from '@/app/actions/crm/targets'
import { TargetForm } from '@/components/crm/targets/target-form'
import { BackButton } from '@/components/ui/back-button'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
    title: 'Recalibrate Target | SAAS ERP',
    description: 'Adjust performance achievement parameters',
}

interface PageProps {
    params: {
        id: string
    }
}

export default async function EditTargetPage(props: { params: Promise<any> }) {
    const params = await props.params;
    const target = await getTarget(params.id)
    if (!target) return notFound()

    const potentialAssignees = await getPotentialAssignees()

    return (
        <div className="min-h-screen bg-futuristic">
            {/* Animated Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
            </div>

            <div className="relative container mx-auto py-8 space-y-8 max-w-4xl">
                <div className="flex items-center justify-between mb-8 px-4">
                    <div className="flex items-center gap-4">
                        <BackButton href="/crm/targets" />
                        <div>
                            <h1 className="text-3xl font-black text-gradient-primary uppercase tracking-tighter">Adjust Objective</h1>
                            <p className="text-slate-500 font-medium">Recalibrate parameters for optimal performance.</p>
                        </div>
                    </div>
                </div>

                <div className="px-4 pb-12">
                    <TargetForm assignees={potentialAssignees as any[]} initialData={target} />
                </div>
            </div >
        </div >
    )
}
