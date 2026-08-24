'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getAccountLedger } from '@/app/actions/accounting/reports';
import { getAccounts } from '@/app/actions/accounting/chart-of-accounts';
import { 
  History, 
  Search, 
  Download, 
  Printer,
  ChevronRight,
  Calculator,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  FileText,
  Clock,
  ArrowRightLeft,
  Filter,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchableSelect, type Option } from '@/components/ui/searchable-select';
import { format, startOfMonth } from 'date-fns';
import { useLocalization } from '@/contexts/localization-context';

interface LedgerLine {
  id: string;
  debit: number;
  credit: number;
  description: string;
  partner_name?: string | null;
  created_at: string;
  journal_entries: {
    date: string;
    ref: string;
    journals: {
      name: string;
      code: string;
    }
  }
}

interface Account {
    id: string;
    name: string;
    code: string;
    type: string;
}

export function AccountLedger({ initialAccountId }: { initialAccountId?: string }) {
  const { formatCurrency, currencySymbol } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(initialAccountId);
  
  const [entries, setEntries] = useState<LedgerLine[]>([]);
  const [accountInfo, setAccountInfo] = useState<Account | null>(null);
  const [openingBalance, setOpeningBalance] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [dateFrom, setDateFrom] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // SEARCHABLE ACCOUNT FETCHER
  const handleAccountSearch = useCallback(async (query: string): Promise<Option[]> => {
      const [accRes, patRes] = await Promise.all([
          getAccounts(query),
          import('@/app/actions/patient-search').then(mod => mod.searchPatients(query))
      ]);

      let results: Option[] = [];

      if (accRes.success && accRes.data) {
          results = accRes.data
            .filter((a: any) => !a.is_group)
            .map((a: any) => ({
              id: a.id,
              label: a.name.toUpperCase(),
              subLabel: `${a.code} | ${a.type}`,
              type: 'account'
          }));
      }

      if (patRes && patRes.length > 0) {
          const patientOptions = patRes.map((p: any) => ({
              id: p.id,
              label: `${p.first_name} ${p.last_name || ''}`.trim().toUpperCase(),
              subLabel: `PATIENT: ${p.patient_number || 'NO ID'}`,
              type: 'patient'
          }));
          results = [...results, ...patientOptions];
      }

      return results;
  }, []);

  const handleSelection = (id: string | null, option?: Option | null) => {
      if (!id || !option) return;
      setSelectedAccountId(id);
  };

  // 2. Load Ledger Data
  useEffect(() => {
    async function loadLedger() {
      if (!selectedAccountId) return;
      
      setLoading(true);
      setError(null);
      try {
          const res = await getAccountLedger(
              selectedAccountId, 
              dateFrom ? new Date(dateFrom) : undefined, 
              dateTo ? new Date(dateTo) : undefined
          );
          if (res.success) {
            setEntries(res.lines);
            setAccountInfo(res.account);
            setOpeningBalance(res.openingBalance || 0);
          } else {
            setError(res.error || 'Failed to load ledger data');
          }
      } catch (err) {
          setError("Connection to audit node failed.");
      } finally {
          setLoading(false);
      }
    }
    loadLedger();
  }, [selectedAccountId, dateFrom, dateTo]);

  // Calculate Running Balances
  let currentBalance = openingBalance;
  const ledgerWithBalance = entries.map(entry => {
    const debit = Number(entry.debit || 0);
    const credit = Number(entry.credit || 0);
    
    // Assets/Expenses: Debit increases, Credit decreases
    // Liabilities/Equity/Revenue: Credit increases, Debit decreases
    const type = accountInfo?.type || 'Asset';
    const isNaturalDebit = ['Asset', 'Expense'].includes(type);
    
    if (isNaturalDebit) {
        currentBalance += (debit - credit);
    } else {
        currentBalance += (credit - debit);
    }
    
    return { ...entry, runningBalance: currentBalance };
  }).reverse(); // Most recent first

  const filteredEntries = ledgerWithBalance.filter(e => 
    e.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.journal_entries?.ref?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalDebit = entries.reduce((sum, e) => sum + Number(e.debit || 0), 0);
  const totalCredit = entries.reduce((sum, e) => sum + Number(e.credit || 0), 0);

  // SAFE CURRENCY RENDERER
  const renderAmount = (amount: number, color?: string) => {
      const val = formatCurrency(amount, currencySymbol);
      return <span className={cn("font-black tracking-tighter", color)}>{val}</span>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex flex-col gap-4 animate-in fade-in duration-500">
      
      {/* 1. INSTITUTIONAL CONTROL PANEL */}
      <Card className="bg-slate-100 dark:bg-[#003333] text-slate-900 dark:text-[#64ffff] border-none rounded-none p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
        <div className="space-y-1">
            <div className="flex items-center gap-2 opacity-50 text-slate-500 dark:text-[#64ffff]">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">General Ledger Terminal</p>
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">ACCOUNT <span className="text-primary dark:text-[#ffffcc]">STATEMENT</span></h2>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 dark:text-[#ffffcc]/60">
                <span>PERIOD: {format(new Date(), 'MMM yyyy').toUpperCase()}</span>
                <span>STATUS: AUDIT-LOCKED</span>
            </div>
        </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                <input 
                    type="date" 
                    className="h-14 bg-white dark:bg-[#004d4d] border border-slate-200 dark:border-[#006666] text-slate-900 dark:text-[#ffffcc] font-black uppercase px-4 focus:outline-none focus:border-primary"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    title="From Date"
                />
                <input 
                    type="date" 
                    className="h-14 bg-white dark:bg-[#004d4d] border border-slate-200 dark:border-[#006666] text-slate-900 dark:text-[#ffffcc] font-black uppercase px-4 focus:outline-none focus:border-primary"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    title="To Date"
                />
            <div className="w-full sm:w-96">
                <SearchableSelect 
                    placeholder="SEARCH LEDGER NAME / CODE..."
                    onSearch={handleAccountSearch}
                    onChange={(id, opt) => handleSelection(id, opt)}
                    value={selectedAccountId}
                    valueLabel={accountInfo?.name}
                    variant="ghost"
                    className="h-14 bg-white dark:bg-[#004d4d] border border-slate-200 dark:border-[#006666] text-slate-900 dark:text-[#ffffcc] font-black uppercase placeholder:text-slate-300 dark:placeholder:text-[#64ffff]/30"
                />
            </div>
            <div className="flex items-center gap-1">
                <button type="button" className="h-14 w-14 bg-white dark:bg-[#004d4d] hover:bg-slate-50 dark:hover:bg-[#006666] border border-slate-200 dark:border-[#006666] flex items-center justify-center text-slate-500 dark:text-[#64ffff] transition-all">
                    <Download className="h-5 w-5" />
                </button>
                <button 
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        if (!selectedAccountId) return;
                        window.print();
                    }} 
                    className="h-14 px-8 bg-slate-900 dark:bg-[#ffffcc] hover:bg-black dark:hover:bg-white text-white dark:text-black font-black text-xs uppercase tracking-widest transition-all print:hidden">
                    <Printer className="h-4 w-4 mr-2 inline" /> PRINT
                </button>
            </div>
        </div>
      </Card>

      {!selectedAccountId ? (
          <div className="flex-1 flex flex-col items-center justify-center py-40 gap-6 opacity-30">
                <div className="p-10 border-4 border-dashed border-primary/20 rounded-full">
                    <Search className="h-20 w-20 text-primary animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-2xl font-black uppercase tracking-widest">Awaiting Identity Input</p>
                    <p className="text-xs font-bold uppercase tracking-[0.4em]">Use the search gateway above to load a ledger node</p>
                </div>
          </div>
      ) : loading ? (
          <div className="p-8 space-y-8 animate-pulse">
              <div className="grid grid-cols-4 gap-4">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 bg-secondary rounded-none" />)}
              </div>
              <Skeleton className="h-96 w-full bg-secondary rounded-none" />
          </div>
      ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-40 gap-6">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <p className="text-xl font-black text-red-500 uppercase">{error}</p>
              <Button variant="outline" onClick={() => setSelectedAccountId(undefined)}>Reset Terminal</Button>
          </div>
      ) : (
          <div className="px-4 pb-10 space-y-4">
            
            {/* 2. SUMMARY RIBBON */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
                {[
                    { label: "Opening Bal", val: openingBalance, icon: History, color: "text-foreground" },
                    { label: "Period Debits", val: totalDebit, icon: TrendingUp, color: "text-red-500" },
                    { label: "Period Credits", val: totalCredit, icon: TrendingDown, color: "text-emerald-500" },
                    { label: "Current Bal", val: Math.abs(currentBalance), icon: Calculator, color: "text-primary", sub: currentBalance >= 0 ? 'DR' : 'CR' }
                ].map((card, idx) => (
                    <Card key={idx} className="p-6 bg-card border border-border rounded-none relative overflow-hidden group">
                        <div className="flex justify-between items-start relative z-10">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-50">{card.label}</p>
                                <h3 className={cn("text-2xl font-black tracking-tighter", card.color)}>
                                    {renderAmount(card.val)}
                                    {card.sub && <span className="ml-2 text-[10px] opacity-40">{card.sub}</span>}
                                </h3>
                            </div>
                            <card.icon className="h-4 w-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </Card>
                ))}
            </div>

            {/* 3. TRANSACTION TERMINAL */}
            <Card className="bg-card border border-border rounded-none flex flex-col overflow-hidden">
                <div className="h-12 bg-secondary border-b border-border flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase text-primary tracking-widest">{accountInfo?.name} ({accountInfo?.code})</span>
                        <div className="h-4 w-px bg-border" />
                        <span className="text-[10px] opacity-40 uppercase">Transactions: {entries.length}</span>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="SEARCH ENTRIES..."
                            className="bg-background border border-border h-7 pl-9 pr-4 text-[9px] font-black uppercase tracking-widest focus:outline-none focus:border-primary w-64"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-secondary/50 border-b border-border">
                                <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest opacity-50">Date</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest opacity-50">Voucher Type</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest opacity-50">Reference</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest opacity-50">Particulars</th>
                                <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest opacity-50">Debit (Dr)</th>
                                <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest opacity-50">Credit (Cr)</th>
                                <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest opacity-50">Net Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredEntries.map((entry, idx) => (
                                <tr key={entry.id} className="hover:bg-secondary/30 transition-colors group text-[11px]">
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-muted-foreground">
                                        {entry.journal_entries?.date ? format(new Date(entry.journal_entries.date), 'dd-MM-yyyy') : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[9px] font-black text-primary uppercase">{entry.journal_entries.journals?.name || 'General'}</span>
                                    </td>
                                    <td className="px-6 py-4 font-black">
                                        {entry.journal_entries.ref || 'SYS-AUTO'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground line-clamp-1">{entry.description || 'Institutional Posting'}</span>
                                            {entry.partner_name && (
                                                <span className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1 mt-1">
                                                    <User className="h-2.5 w-2.5" /> {entry.partner_name}
                                                </span>
                                            )}
                                            <span className="text-[9px] opacity-40 uppercase">Line Ref: {entry.id.slice(0,8)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {Number(entry.debit) > 0 ? renderAmount(Number(entry.debit), "text-red-500") : <span className="opacity-10">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {Number(entry.credit) > 0 ? renderAmount(Number(entry.credit), "text-emerald-500") : <span className="opacity-10">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {renderAmount(Math.abs(entry.runningBalance))}
                                            <span className="text-[8px] font-black opacity-30 uppercase">{entry.runningBalance >= 0 ? 'Dr' : 'Cr'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredEntries.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center opacity-30 italic uppercase tracking-widest">No entries found for this ledger query</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-secondary/50 border-t-2 border-border font-black text-[12px]">
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-right uppercase tracking-[0.2em] opacity-50">Total Ledger Movements</td>
                                <td className="px-6 py-4 text-right text-red-500 border-t-4 border-double border-red-500/20">{renderAmount(totalDebit)}</td>
                                <td className="px-6 py-4 text-right text-emerald-500 border-t-4 border-double border-emerald-500/20">{renderAmount(totalCredit)}</td>
                                <td className="px-6 py-4 text-right bg-primary/5">{renderAmount(Math.abs(currentBalance))}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Card>

            <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground uppercase px-4">
                <div className="flex gap-6">
                    <span className="flex items-center gap-2 text-primary"><ShieldCheck className="h-3 w-3" /> Integrity Locked</span>
                    <span>System: ERP-Audit-v4</span>
                </div>
                <span>Server Timestamp: {format(new Date(), 'HH:mm:ss')}</span>
            </div>
          </div>
      )}

      {/* --- WORLD STANDARD PRINT LAYOUT --- */}
      {selectedAccountId && !loading && !error && (
        <div className="hidden print:block bg-white text-black font-sans w-full absolute top-0 left-0 p-8 m-0 z-50">
            {/* --- HEADER --- */}
            <div className="border-b-2 border-black pb-4 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">Hospital / Enterprise</h1>
                        <p className="text-sm mt-1 max-w-sm">Official Ledger Record</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-black uppercase tracking-widest text-slate-800">General Ledger</h2>
                        <p className="text-sm font-bold mt-2">Date Printed: {format(new Date(), 'dd-MMM-yyyy HH:mm')}</p>
                    </div>
                </div>
            </div>

            {/* --- ACCOUNT INFO & SUMMARY --- */}
            <div className="flex justify-between items-start mb-8 border border-slate-300 rounded-lg p-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Account Particulars</p>
                    <h3 className="text-xl font-black uppercase mt-1">{accountInfo?.name}</h3>
                    <p className="text-sm font-bold text-slate-700">Code: {accountInfo?.code} | Type: {accountInfo?.type}</p>
                    <p className="text-sm font-bold text-slate-600 mt-2">
                        Period: {dateFrom ? format(new Date(dateFrom), 'dd-MMM-yyyy') : 'Start'} to {dateTo ? format(new Date(dateTo), 'dd-MMM-yyyy') : 'End'}
                    </p>
                </div>
                <div className="text-right grid grid-cols-2 gap-x-8 gap-y-2">
                    <p className="text-xs font-bold uppercase text-slate-500">Opening Balance:</p>
                    <p className="text-sm font-black">{formatCurrency(openingBalance)}</p>
                    
                    <p className="text-xs font-bold uppercase text-slate-500">Total Debit:</p>
                    <p className="text-sm font-black text-slate-700">{formatCurrency(totalDebit)}</p>
                    
                    <p className="text-xs font-bold uppercase text-slate-500">Total Credit:</p>
                    <p className="text-sm font-black text-slate-700">{formatCurrency(totalCredit)}</p>
                    
                    <p className="text-xs font-bold uppercase text-slate-800 border-t border-slate-300 pt-1 mt-1">Closing Balance:</p>
                    <p className="text-sm font-black border-t border-slate-300 pt-1 mt-1">{formatCurrency(Math.abs(currentBalance))} {currentBalance >= 0 ? 'Dr' : 'Cr'}</p>
                </div>
            </div>

            {/* --- LEDGER TABLE --- */}
            <table className="w-full text-left text-sm border-collapse">
                <thead>
                    <tr className="border-y-2 border-black">
                        <th className="py-3 px-2 font-black uppercase text-xs">Date</th>
                        <th className="py-3 px-2 font-black uppercase text-xs">Voucher</th>
                        <th className="py-3 px-2 font-black uppercase text-xs">Particulars</th>
                        <th className="py-3 px-2 font-black uppercase text-xs text-right">Debit</th>
                        <th className="py-3 px-2 font-black uppercase text-xs text-right">Credit</th>
                        <th className="py-3 px-2 font-black uppercase text-xs text-right">Balance</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    <tr>
                        <td className="py-2 px-2 font-medium">--</td>
                        <td className="py-2 px-2">--</td>
                        <td className="py-2 px-2 font-bold italic">Opening Balance B/F</td>
                        <td className="py-2 px-2 text-right"></td>
                        <td className="py-2 px-2 text-right"></td>
                        <td className="py-2 px-2 text-right font-black">{formatCurrency(Math.abs(openingBalance))} {openingBalance >= 0 ? 'Dr' : 'Cr'}</td>
                    </tr>
                    
                    {ledgerWithBalance.slice().reverse().map((entry: any) => (
                        <tr key={entry.id} className="break-inside-avoid">
                            <td className="py-2 px-2">
                                {entry.journal_entries?.date ? format(new Date(entry.journal_entries.date), 'dd-MM-yyyy') : 'N/A'}
                            </td>
                            <td className="py-2 px-2">
                                <span className="font-bold">{entry.journal_entries?.ref || 'AUTO'}</span>
                            </td>
                            <td className="py-2 px-2">
                                <span className="font-medium">{entry.description || 'Institutional Posting'}</span>
                                {entry.partner_name && (
                                    <span className="block text-xs font-bold text-slate-600">[{entry.partner_name}]</span>
                                )}
                            </td>
                            <td className="py-2 px-2 text-right">
                                {Number(entry.debit) > 0 ? formatCurrency(Number(entry.debit)) : '-'}
                            </td>
                            <td className="py-2 px-2 text-right">
                                {Number(entry.credit) > 0 ? formatCurrency(Number(entry.credit)) : '-'}
                            </td>
                            <td className="py-2 px-2 text-right font-bold">
                                {formatCurrency(Math.abs(entry.runningBalance))} <span className="text-xs opacity-70">{entry.runningBalance >= 0 ? 'Dr' : 'Cr'}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="border-y-2 border-black font-black">
                        <td colSpan={3} className="py-3 px-2 text-right uppercase tracking-widest text-xs">Total Transacted:</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(totalDebit)}</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(totalCredit)}</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(Math.abs(currentBalance))} {currentBalance >= 0 ? 'Dr' : 'Cr'}</td>
                    </tr>
                </tfoot>
            </table>

            {/* --- FOOTER --- */}
            <div className="mt-16 pt-8 border-t border-slate-300 flex justify-between text-xs text-slate-500 font-bold uppercase tracking-widest break-inside-avoid">
                <div className="text-center">
                    <p className="border-t border-slate-400 w-48 pt-2 mx-auto">Prepared By</p>
                </div>
                <div className="text-center">
                    <p className="border-t border-slate-400 w-48 pt-2 mx-auto">Authorized Signatory</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

function LedgerSkeleton() {
  return (
    <div className="space-y-8 animate-pulse p-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-28 rounded-none bg-secondary" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-none bg-secondary" />
    </div>
  );
}
