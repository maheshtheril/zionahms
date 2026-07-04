'use client';

import React, { useState, useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
    AlertTriangle, PackageSearch, Search, Download, TrendingUp, Clock
} from 'lucide-react';
import { useLocalization } from "@/contexts/localization-context";

interface AgeingData {
    totalValue: number;
    deadStockValue: number;
    riskPercentage: number;
    bucketTotals: Record<string, number>;
    detailedGrid: any[];
}

export function AgeingDashboard({ data }: { data: AgeingData }) {
    const { currencySymbol } = useLocalization();
    const [searchTerm, setSearchTerm] = useState('');
    const [ageBracketFilter, setAgeBracketFilter] = useState('ALL');

    const chartData = [
        { name: '0-30 Days', value: data.bucketTotals['0-30'] || 0, fill: '#10b981' },
        { name: '31-60 Days', value: data.bucketTotals['31-60'] || 0, fill: '#3b82f6' },
        { name: '61-90 Days', value: data.bucketTotals['61-90'] || 0, fill: '#f59e0b' },
        { name: '91-120 Days', value: data.bucketTotals['91-120'] || 0, fill: '#ef4444' },
        { name: '120+ Days', value: data.bucketTotals['120+'] || 0, fill: '#7f1d1d' },
    ];

    const filteredGrid = useMemo(() => {
        return data.detailedGrid.filter(row => {
            const matchesSearch = row.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                row.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                row.category.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (!matchesSearch) return false;

            if (ageBracketFilter !== 'ALL') {
                return row.buckets[ageBracketFilter] > 0;
            }

            return true;
        });
    }, [data.detailedGrid, searchTerm, ageBracketFilter]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    const handleExport = () => {
        const headers = ['SKU', 'Product Name', 'Category', 'Total Qty', 'Total Value', '0-30 Days', '31-60 Days', '61-90 Days', '91-120 Days', '120+ Days'];
        const csvContent = [
            headers.join(','),
            ...filteredGrid.map(r => [
                `"${r.sku}"`,
                `"${r.name}"`,
                `"${r.category}"`,
                r.totalQty,
                r.totalValue,
                r.buckets['0-30'],
                r.buckets['31-60'],
                r.buckets['61-90'],
                r.buckets['91-120'],
                r.buckets['120+']
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `stock_ageing_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6">
            {/* KPI ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <PackageSearch className="w-16 h-16 text-emerald-600" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total Inventory Value</p>
                        <h3 className="text-3xl font-black text-gray-900">{formatCurrency(data.totalValue)}</h3>
                        <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Active Capital
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Clock className="w-16 h-16 text-rose-600" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Aged Stock ({'>'}90 Days)</p>
                        <h3 className="text-3xl font-black text-gray-900">{formatCurrency(data.deadStockValue)}</h3>
                        <p className="text-xs text-rose-600 font-bold mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Capital Locked
                        </p>
                    </div>
                </div>

                <div className={`rounded-2xl p-6 border shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow ${data.riskPercentage > 20 ? 'bg-rose-50 border-rose-100' : 'bg-white border-gray-100'}`}>
                    <div className="relative z-10">
                        <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${data.riskPercentage > 20 ? 'text-rose-700' : 'text-gray-500'}`}>Obsolescence Risk</p>
                        <div className="flex items-end gap-3">
                            <h3 className={`text-4xl font-black ${data.riskPercentage > 20 ? 'text-rose-600' : 'text-gray-900'}`}>
                                {data.riskPercentage.toFixed(1)}%
                            </h3>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-4 overflow-hidden">
                            <div className={`h-2 rounded-full ${data.riskPercentage > 20 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(data.riskPercentage, 100)}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CHART SECTION */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Stock Value by Age Bracket</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }} />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tickFormatter={(val) => `${currencySymbol}${(val/1000).toFixed(0)}k`}
                                tick={{ fill: '#6b7280', fontSize: 12 }} 
                            />
                            <RechartsTooltip 
                                cursor={{ fill: '#f9fafb' }}
                                formatter={(value: number) => [formatCurrency(value), 'Value']}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* DATA GRID */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-gray-900">Ageing Analysis Detail</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <select 
                            value={ageBracketFilter}
                            onChange={(e) => setAgeBracketFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                        >
                            <option value="ALL">All Ages</option>
                            <option value="0-30">Has 0-30 Days</option>
                            <option value="31-60">Has 31-60 Days</option>
                            <option value="61-90">Has 61-90 Days</option>
                            <option value="91-120">Has 91-120 Days</option>
                            <option value="120+">Has 120+ Days</option>
                        </select>
                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-lg transition-colors"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total Qty</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Value</th>
                                <th className="px-4 py-3 text-xs font-bold text-emerald-600 uppercase tracking-wider text-right bg-emerald-50/50">0-30 Days</th>
                                <th className="px-4 py-3 text-xs font-bold text-blue-600 uppercase tracking-wider text-right bg-blue-50/50">31-60 Days</th>
                                <th className="px-4 py-3 text-xs font-bold text-amber-600 uppercase tracking-wider text-right bg-amber-50/50">61-90 Days</th>
                                <th className="px-4 py-3 text-xs font-bold text-rose-600 uppercase tracking-wider text-right bg-rose-50/50">91-120 Days</th>
                                <th className="px-4 py-3 text-xs font-bold text-rose-800 uppercase tracking-wider text-right bg-rose-100/50">120+ Days</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredGrid.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                        No products found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredGrid.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-gray-900 text-sm">{row.name}</div>
                                            <div className="text-xs text-gray-500 font-mono mt-0.5">{row.sku}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{row.category}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{row.totalQty.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{formatCurrency(row.totalValue)}</td>
                                        
                                        <td className="px-4 py-3 text-sm font-semibold text-emerald-700 text-right bg-emerald-50/30">
                                            {row.buckets['0-30'] > 0 ? row.buckets['0-30'].toLocaleString() : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-blue-700 text-right bg-blue-50/30">
                                            {row.buckets['31-60'] > 0 ? row.buckets['31-60'].toLocaleString() : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-amber-700 text-right bg-amber-50/30">
                                            {row.buckets['61-90'] > 0 ? row.buckets['61-90'].toLocaleString() : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-rose-600 text-right bg-rose-50/30">
                                            {row.buckets['91-120'] > 0 ? row.buckets['91-120'].toLocaleString() : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-black text-rose-800 text-right bg-rose-100/30">
                                            {row.buckets['120+'] > 0 ? row.buckets['120+'].toLocaleString() : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
