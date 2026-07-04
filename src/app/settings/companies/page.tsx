'use server'

import { getTenantCompanies } from "@/app/actions/company"
import Link from "next/link"
import { Building2, MoreHorizontal, Plus } from "lucide-react"

export default async function CompaniesPage() {
    const res = await getTenantCompanies()
    const companies = res.data || []

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
                    <p className="text-gray-500 mt-1">Manage your legal entities and branches.</p>
                </div>
                <Link
                    href="/settings/companies/new"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                >
                    <Plus size={18} />
                    New Company
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map((company: any) => (
                    <div key={company.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow relative group">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{company.name}</h3>
                                    <p className="text-sm text-gray-500 capitalize">{company.industry || 'General'}</p>
                                </div>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>

                        <div className="mt-6 flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Status</span>
                                <span className={`font-medium ${company.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                                    {company.enabled ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Currency</span>
                                <span className="font-medium text-gray-900">USD</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end">
                            <Link href={`#`} className="text-blue-600 text-sm font-medium hover:underline">
                                Settings &rarr;
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
