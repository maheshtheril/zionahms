import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, Users, Search, Activity, User, Filter } from "lucide-react"
import { auth } from "@/auth"

import SearchInput from "@/components/search-input"
import { AdmissionDialog } from "@/components/hms/patients/admission-dialog"

export default async function PatientsPage({
    searchParams
}: {
    searchParams: Promise<{
        q?: string
    }>
}) {
    const { q } = await searchParams;
    const query = q || ''

    // Get current user's tenant
    const session = await auth()
    const tenantId = session?.user?.tenantId

    if (!tenantId) {
        return (
            <div className="space-y-6 p-6">
                <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-r-lg shadow-sm">
                    <p className="font-medium">No tenant found. Please login again.</p>
                </div>
            </div>
        )
    }

    const isAdmin = session?.user?.isAdmin || (session?.user as any)?.isTenantAdmin;

    const patients = await prisma.hms_patient.findMany({
        take: 20,
        orderBy: { updated_at: 'desc' },
        where: {
            tenant_id: tenantId, // Filter by current user's tenant
            ...(query ? {
                OR: [
                    { first_name: { contains: query, mode: 'insensitive' } },
                    { last_name: { contains: query, mode: 'insensitive' } },
                    { patient_number: { contains: query, mode: 'insensitive' } }
                ]
            } : {})
        }
    })

    return (
        <div className="space-y-8 max-w-7xl mx-auto w-full pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600 mb-2">
                        <Users className="h-5 w-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">Patient Registry</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Patients</h1>
                    <p className="text-slate-500 font-medium">Manage records, admissions, and clinical history.</p>
                </div>
                <Link
                    href="/hms/patients/new"
                    className="h-12 px-6 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2 font-bold shadow-sm"
                >
                    <Plus className="h-5 w-5" />
                    <span>Register New Patient</span>
                </Link>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-full md:w-[400px]">
                    <SearchInput placeholder="Search by name, phone, or ID..." />
                </div>
                <button className="h-11 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 font-medium flex items-center gap-2 transition-colors w-full md:w-auto">
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                </button>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Patient Details</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Contact</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Demographics</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Last Activity</th>
                                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {patients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                                                <Users className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900">No patients found</p>
                                                <p className="text-sm text-slate-500">Get started by registering a new patient.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                patients.map((patient: any) => {
                                    const initials = `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase();
                                    
                                    return (
                                    <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100 shadow-sm shrink-0">
                                                    {initials || <User className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{patient.first_name} {patient.last_name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs font-mono font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">ID: {patient.patient_number || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-slate-700">
                                                {(patient.contact as any)?.phone || (patient as any).phone || <span className="text-slate-300 italic">No phone</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${patient.gender === 'male' ? 'bg-blue-50 text-blue-600 border border-blue-100' : patient.gender === 'female' ? 'bg-pink-50 text-pink-600 border border-pink-100' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                                                    {patient.gender || 'Unknown'}
                                                </span>
                                                {(patient.metadata as any)?.blood_group && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-100 text-[10px] font-black uppercase tracking-wider text-rose-600">
                                                        <Activity className="h-3 w-3 text-rose-400" />
                                                        {(patient.metadata as any).blood_group}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-500">
                                                {patient.updated_at ? new Date(patient.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <AdmissionDialog
                                                    patientId={patient.id}
                                                    patientName={`${patient.first_name} ${patient.last_name}`}
                                                />
                                                <Link
                                                    href={`/hms/prescriptions/new?patientId=${patient.id}`}
                                                    className="h-9 px-3 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-colors"
                                                    title="Quick Prescribe"
                                                >
                                                    Rx
                                                </Link>
                                                <Link
                                                    href={`/hms/patients/${patient.id}`}
                                                    className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all shadow-sm"
                                                >
                                                    View
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
