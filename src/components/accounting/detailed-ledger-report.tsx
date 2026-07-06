'use client'

import { useState, useEffect } from 'react'
import {
    Calendar, Download, Filter, Search,
    FileText, CreditCard, Banknote, RefreshCcw,
    Printer, ChevronDown, ChevronRight
} from 'lucide-react'
import { getDaybook, getCashBankBook, getCategoryAccounts } from "@/app/actions/accounting/reports"
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import React from 'react'
import { cn } from '@/lib/utils'

interface DetailedLedgerProps {
    type: 'daybook' | 'cashbook' | 'bankbook'
    currencyCode?: string
    currencySymbol?: string
}

export function DetailedLedgerReport({
    type,
    currencyCode = 'INR',
    currencySymbol = 'Rs.'
}: DetailedLedgerProps) {
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState(new Date())
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    const [endDate, setEndDate] = useState(new Date())
    const [entries, setEntries] = useState<any[]>([])
    const [openingBalance, setOpeningBalance] = useState(0)
    const [bookAccountIds, setBookAccountIds] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
    
    const [availableAccounts, setAvailableAccounts] = useState<any[]>([])
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
    const [accountSummaries, setAccountSummaries] = useState<any[]>([])

    useEffect(() => {
        if (type !== 'daybook') {
            getCategoryAccounts(type === 'cashbook' ? 'cash' : 'bank').then(res => {
                if (res.success) setAvailableAccounts(res.data || [])
            })
        }
    }, [type])

    useEffect(() => {
        loadData()
    }, [date, startDate, endDate, type, selectedAccountId])

    async function loadData() {
        setLoading(true)
        try {
            let res;
            if (type === 'daybook') {
                res = await getDaybook(date)
            } else {
                res = await getCashBankBook(
                    type === 'cashbook' ? 'cash' : 'bank', 
                    startDate, 
                    endDate, 
                    selectedAccountId ? [selectedAccountId] : undefined
                )
            }

            if (res.success) {
                const result = res as any
                setEntries(result.data || [])
                setOpeningBalance(result.openingBalance || 0)
                setBookAccountIds(result.accountIds || [])
                setAccountSummaries(result.accountSummaries || [])
            }
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }

    const toggleExpand = (id: string) => {
        const next = new Set(expandedEntries)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setExpandedEntries(next)
    }

    const fmt = (val: number) => {
        if (!val) return '-'
        return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)
    }

    const filteredEntries = entries.filter(e =>
        e.ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.journal_entry_lines.some((l: any) =>
            l.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.accounts?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    )

    const totalDebit = entries.reduce((sum, e) => {
        if (type === 'daybook') return sum + e.journal_entry_lines.reduce((lSum: number, l: any) => lSum + Number(l.debit || 0), 0)
        return sum + e.journal_entry_lines
            .filter((l: any) => bookAccountIds.includes(l.account_id))
            .reduce((lSum: number, l: any) => lSum + Number(l.debit || 0), 0)
    }, 0)

    const totalCredit = entries.reduce((sum, e) => {
        if (type === 'daybook') return sum + e.journal_entry_lines.reduce((lSum: number, l: any) => lSum + Number(l.credit || 0), 0)
        return sum + e.journal_entry_lines
            .filter((l: any) => bookAccountIds.includes(l.account_id))
            .reduce((lSum: number, l: any) => lSum + Number(l.credit || 0), 0)
    }, 0)

    const closingBalance = openingBalance + totalDebit - totalCredit

    const getMovementAndParticulars = (e: any) => {
        if (type === 'daybook') {
            return {
                particulars: e.journal_entry_lines[0]?.description?.toUpperCase() || 'NO NARRATION',
                debit: e.journal_entry_lines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0),
                credit: e.journal_entry_lines.reduce((s: number, l: any) => s + Number(l.credit || 0), 0)
            }
        }

        const bookLines = e.journal_entry_lines.filter((l: any) => bookAccountIds.includes(l.account_id))
        const contraLines = e.journal_entry_lines.filter((l: any) => !bookAccountIds.includes(l.account_id))

        const debit = bookLines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0)
        const credit = bookLines.reduce((s: number, l: any) => s + Number(l.credit || 0), 0)

        let particulars = 'MULTIPLE ACCOUNTS'
        if (contraLines.length === 1) particulars = contraLines[0].accounts.name
        else if (contraLines.length > 1) {
            const sorted = [...contraLines].sort((a, b) => (Number(b.debit) + Number(b.credit)) - (Number(a.debit) + Number(a.credit)))
            particulars = sorted[0].accounts.name + ' (As Per Details)'
        } else if (bookLines.length > 1) {
            const mainMovementIsDebit = debit > 0
            const oppositeLines = bookLines.filter((l: any) => mainMovementIsDebit ? Number(l.credit) > 0 : Number(l.debit) > 0)
            if (oppositeLines.length > 0) particulars = oppositeLines[0].accounts.name
            else particulars = 'INTERNAL TRANSFER'
        } else if (e.journal_entry_lines.length > 0) {
            particulars = e.journal_entry_lines[0].accounts.name
        }

        if (bookLines.length === 1 && bookAccountIds.length > 1) {
            particulars = `${bookLines[0].accounts.name}: ${particulars}`
        }

        return { particulars, debit, credit }
    }

    const titleMap = {
        daybook: 'Daybook',
        cashbook: 'Cashbook',
        bankbook: 'Bankbook'
    }

    const Icon = type === 'daybook' ? FileText : type === 'cashbook' ? Banknote : CreditCard;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 print:bg-white flex flex-col">
            
            {/* ── Header ── */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5 no-print shrink-0">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-5 w-5 text-indigo-600" />
                            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                {titleMap[type]} Register
                            </h1>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {type === 'daybook' 
                                ? `Daily transactions for ${format(date, 'dd MMM yyyy')}` 
                                : `Ledger entries from ${format(startDate, 'dd MMM')} to ${format(endDate, 'dd MMM yyyy')}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {type === 'daybook' ? (
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <input
                                    type="date"
                                    value={format(date, 'yyyy-MM-dd')}
                                    onChange={e => setDate(new Date(e.target.value))}
                                    className="bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <input
                                    type="date"
                                    value={format(startDate, 'yyyy-MM-dd')}
                                    onChange={e => setStartDate(new Date(e.target.value))}
                                    className="bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none [color-scheme:light] dark:[color-scheme:dark]"
                                />
                                <span className="text-slate-400 text-xs">to</span>
                                <input
                                    type="date"
                                    value={format(endDate, 'yyyy-MM-dd')}
                                    onChange={e => setEndDate(new Date(e.target.value))}
                                    className="bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>
                        )}

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search voucher or narration..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm w-64 focus:outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all shadow-sm shadow-indigo-200">
                            <Printer className="h-4 w-4" />
                            Print
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Layout ── */}
            <div className="flex-1 flex overflow-hidden max-w-[1600px] w-full mx-auto p-4 md:p-6 gap-6">
                
                {/* Sidebar for Accounts (Cash/Bank only) */}
                {type !== 'daybook' && (
                    <div className="w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col no-print shrink-0 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <h3 className="font-black text-sm uppercase tracking-widest text-slate-500 dark:text-slate-400">Select Account</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            <button
                                onClick={() => setSelectedAccountId(null)}
                                className={cn(
                                    "w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                                    selectedAccountId === null
                                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                )}
                            >
                                All {type === 'cashbook' ? 'Cash' : 'Bank'} Accounts
                            </button>

                            {availableAccounts.map(acc => {
                                const summary = accountSummaries.find(s => s.id === acc.id);
                                return (
                                    <button
                                        key={acc.id}
                                        onClick={() => setSelectedAccountId(acc.id)}
                                        className={cn(
                                            "w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex flex-col gap-1",
                                            selectedAccountId === acc.id
                                                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        )}
                                    >
                                        <span className="font-bold">{acc.name}</span>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 font-medium">{acc.code}</span>
                                            {summary && (
                                                <span className={cn(
                                                    "font-bold",
                                                    selectedAccountId === acc.id ? "text-indigo-600 dark:text-indigo-400" : "text-emerald-600 dark:text-emerald-500"
                                                )}>
                                                    {currencySymbol}{fmt(summary.closing)}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Ledger Table */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden print:shadow-none print:border-black">
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 print:bg-gray-100 print:border-black sticky top-0 z-10">
                                <tr>
                                    <th className="px-5 py-3 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-8"></th>
                                    <th className="px-5 py-3 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-5 py-3 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Vch No.</th>
                                    <th className="px-5 py-3 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Particulars</th>
                                    <th className="px-5 py-3 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Debit (In)</th>
                                    <th className="px-5 py-3 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Credit (Out)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 print:divide-slate-300">
                                {type !== 'daybook' && (
                                    <tr className="bg-indigo-50/50 dark:bg-indigo-900/10">
                                        <td></td>
                                        <td className="px-5 py-4 text-sm font-bold text-indigo-600 dark:text-indigo-400">Opening</td>
                                        <td className="px-5 py-4 text-sm font-semibold text-slate-400">BS</td>
                                        <td className="px-5 py-4 text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase">Balance B/F</td>
                                        <td className="px-5 py-4 text-sm font-black text-emerald-600 dark:text-emerald-500 text-right">{openingBalance >= 0 ? fmt(openingBalance) : '-'}</td>
                                        <td className="px-5 py-4 text-sm font-black text-rose-600 dark:text-rose-500 text-right">{openingBalance < 0 ? fmt(Math.abs(openingBalance)) : '-'}</td>
                                    </tr>
                                )}

                                {loading ? (
                                    <tr><td colSpan={6} className="py-20 text-center"><p className="text-sm text-slate-500 font-semibold uppercase tracking-widest animate-pulse">Syncing Ledger...</p></td></tr>
                                ) : filteredEntries.length === 0 ? (
                                    <tr><td colSpan={6} className="py-20 text-center"><p className="text-sm text-slate-400 dark:text-slate-600 italic">No transactions found for this period.</p></td></tr>
                                ) : filteredEntries.map(e => {
                                    const m = getMovementAndParticulars(e);
                                    const isExpanded = expandedEntries.has(e.id);
                                    return (
                                        <React.Fragment key={e.id}>
                                            <tr 
                                                onClick={() => toggleExpand(e.id)}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-5 py-3">
                                                    <ChevronRight className={cn("h-4 w-4 text-slate-400 transition-transform", isExpanded && "rotate-90")} />
                                                </td>
                                                <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{format(new Date(e.created_at || e.date), 'dd MMM yyyy')}</td>
                                                <td className="px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-300">{e.ref?.length > 15 && e.ref?.includes('-') ? `${e.ref.split('-')[0]}-...${e.ref.slice(-6).toUpperCase()}` : (e.ref || '-')}</td>
                                                <td className="px-5 py-3 text-sm font-semibold text-slate-900 dark:text-white uppercase">
                                                    {m.particulars}
                                                    {type === 'daybook' && (
                                                        <p className="text-xs font-normal text-slate-500 dark:text-slate-400 normal-case mt-0.5">Contains {e.journal_entry_lines.length} lines</p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-500 text-right">{fmt(m.debit)}</td>
                                                <td className="px-5 py-3 text-sm font-bold text-rose-600 dark:text-rose-500 text-right">{fmt(m.credit)}</td>
                                            </tr>
                                            <AnimatePresence>
                                                {(isExpanded || (typeof window !== 'undefined' && window.matchMedia('print').matches)) && (
                                                    <tr className="bg-slate-50/80 dark:bg-slate-800/30">
                                                        <td></td>
                                                        <td colSpan={5} className="px-5 py-3 border-y border-slate-100 dark:border-slate-800/50">
                                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-1.5 py-1">
                                                                {e.journal_entry_lines.map((l: any, i: number) => (
                                                                    <div key={i} className="flex items-center text-xs font-medium gap-4">
                                                                        <span className={cn("w-6 font-bold", l.debit > 0 ? "text-emerald-600" : "text-rose-600")}>{l.debit > 0 ? 'DR' : 'CR'}</span>
                                                                        <span className="w-64 text-slate-700 dark:text-slate-300 truncate font-semibold uppercase">{l.accounts.name}</span>
                                                                        <span className="flex-1 text-slate-500 dark:text-slate-400 italic truncate">{l.description}</span>
                                                                        <span className="w-24 text-right text-emerald-600 dark:text-emerald-500">{l.debit > 0 ? fmt(l.debit) : ''}</span>
                                                                        <span className="w-24 text-right text-rose-600 dark:text-rose-500">{l.credit > 0 ? fmt(l.credit) : ''}</span>
                                                                    </div>
                                                                ))}
                                                            </motion.div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    )
                                })}
                            </tbody>
                            <tfoot className="bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700 print:border-black">
                                <tr>
                                    <td colSpan={4} className="px-5 py-3 text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest text-right">Total Movement</td>
                                    <td className="px-5 py-3 text-sm font-black text-slate-900 dark:text-white text-right">{fmt(totalDebit)}</td>
                                    <td className="px-5 py-3 text-sm font-black text-slate-900 dark:text-white text-right">{fmt(totalCredit)}</td>
                                </tr>
                                {type !== 'daybook' && (
                                    <tr className="bg-slate-200 dark:bg-slate-700/50">
                                        <td colSpan={4} className="px-5 py-4 text-sm font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest text-right border-t-2 border-double border-slate-400 dark:border-slate-500">Closing Balance (C/F)</td>
                                        <td colSpan={2} className="px-5 py-4 text-base font-black text-indigo-700 dark:text-indigo-400 text-right border-t-2 border-double border-slate-400 dark:border-slate-500">
                                            {currencySymbol}{fmt(closingBalance)}
                                            <span className="text-xs ml-2 uppercase text-indigo-500/70">{closingBalance >= 0 ? '(DR)' : '(CR)'}</span>
                                        </td>
                                    </tr>
                                )}
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
