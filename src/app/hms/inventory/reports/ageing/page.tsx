import { Metadata } from 'next';
import { getStockAgeingData } from '@/app/actions/reports-ageing';
import { AgeingDashboard } from '@/components/inventory/reports/ageing-dashboard';
import { ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Stock Ageing Report | Inventory',
    description: 'Analyze inventory ageing and identify slow-moving stock',
};

export default async function AgeingReportPage() {
    const response = await getStockAgeingData();

    if (response.error || !response.success || !response.data) {
        return (
            <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl flex flex-col items-center gap-3 max-w-md text-center">
                    <ShieldAlert className="w-12 h-12 text-rose-500" />
                    <h2 className="text-lg font-bold">Failed to Load Report</h2>
                    <p className="text-sm">{response.error || "An unexpected error occurred while calculating ageing data."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Stock Ageing Analysis</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Identify slow-moving inventory and capital lock-up using FIFO tracking.
                    </p>
                </div>
            </div>

            <AgeingDashboard data={response.data} />
        </div>
    );
}
