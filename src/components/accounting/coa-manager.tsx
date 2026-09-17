'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import {
    Plus, Search, Pencil, Trash2, RefreshCw,
    BookOpen, ArrowRightLeft, Layers, Folder,
    FolderPlus, CheckCircle2, ChevronRight,
    ArrowUpRight, ShieldCheck, FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { deleteAccount, upsertAccount } from "@/app/actions/accounting/chart-of-accounts"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Account {
    id: string
    code: string
    name: string
    type: string
    parent_id?: string | null
    is_group: boolean
    is_reconcilable: boolean
    is_active: boolean
}

const ACCOUNT_TYPES = [
    { value: 'Asset', label: 'Assets', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', dot: 'bg-blue-500' },
    { value: 'Liability', label: 'Liabilities', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
    { value: 'Equity', label: 'Equity & Capital', badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', dot: 'bg-purple-500' },
    { value: 'Revenue', label: 'Income & Revenue', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
    { value: 'Expense', label: 'Operating Expenses', badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', dot: 'bg-rose-500' },
]

export function ChartOfAccountsManager({ initialAccounts }: { initialAccounts: Account[] }) {
    const [accounts, setAccounts] = useState<Account[]>(initialAccounts)
    const [search, setSearch] = useState("")
    const [selectedType, setSelectedType] = useState<string>("ALL")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Form State
    const [editingAccount, setEditingAccount] = useState<Account | null>(null)
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 'Asset',
        parent_id: 'none',
        is_group: false,
        is_reconcilable: false
    })

    const filteredAccounts = accounts.filter(acc => {
        const matchesSearch = acc.name.toLowerCase().includes(search.toLowerCase()) ||
            acc.code.toLowerCase().includes(search.toLowerCase());
        const matchesType = selectedType === "ALL" || acc.type.toLowerCase() === selectedType.toLowerCase();
        return matchesSearch && matchesType;
    }).sort((a, b) => a.code.localeCompare(b.code));

    const handleOpenDialog = (account?: Account) => {
        if (account) {
            setEditingAccount(account)
            setFormData({
                code: account.code,
                name: account.name,
                type: account.type,
                parent_id: account.parent_id || 'none',
                is_group: account.is_group ?? false,
                is_reconcilable: account.is_reconcilable
            })
        } else {
            setEditingAccount(null)
            setFormData({ code: '', name: '', type: 'Asset', parent_id: 'none', is_group: false, is_reconcilable: false })
        }
        setIsDialogOpen(true)
    }

    const suggestNextCode = (parentId: string, type: string) => {
        const siblings = accounts.filter(a => (parentId === 'none' ? !a.parent_id : a.parent_id === parentId) && a.type === type);
        if (siblings.length === 0) {
            const parent = accounts.find(a => a.id === parentId);
            if (parent) return `${parent.code}01`;
            return "";
        }
        const codes = siblings.map(s => parseInt(s.code)).filter(c => !isNaN(c));
        if (codes.length === 0) return "";
        return (Math.max(...codes) + 1).toString();
    }

    const handleQuickAdd = (parent: Account) => {
        const nextCode = suggestNextCode(parent.id, parent.type);
        setEditingAccount(null);
        setFormData({
            code: nextCode,
            name: '',
            type: parent.type,
            parent_id: parent.id,
            is_group: false,
            is_reconcilable: parent.type === 'Asset' || parent.type === 'Liability'
        });
        setIsDialogOpen(true);
    }

    const handleDelete = async () => {
        if (!editingAccount) return;
        
        if (!confirm(`Are you sure you want to delete ${editingAccount.name}?`)) {
            return;
        }

        setIsLoading(true)
        try {
            const res = await deleteAccount(editingAccount.id);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Account deleted successfully");
                setIsDialogOpen(false);
                window.location.reload();
            }
        } catch (e) {
            toast.error("An error occurred during deletion");
        } finally {
            setIsLoading(false);
        }
    }

    // Keyboard shortcut Alt+C to add account, Alt+D to delete
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 'c' && !isDialogOpen) {
                e.preventDefault();
                handleOpenDialog();
            }
            if (isDialogOpen && editingAccount && e.altKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                handleDelete();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDialogOpen, editingAccount]);

    const handleSubmit = async () => {
        if (!formData.code || !formData.name) {
            toast.error("Please fill in the code and name.");
            return;
        }

        setIsLoading(true)
        try {
            const payload = {
                id: editingAccount?.id,
                code: formData.code,
                name: formData.name,
                type: formData.type,
                is_group: formData.is_group,
                is_reconcilable: formData.is_reconcilable,
                parent_id: formData.parent_id === 'none' ? null : formData.parent_id
            };

            const res = await upsertAccount(payload)

            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(editingAccount ? "Account updated successfully" : "Account created successfully")
                setIsDialogOpen(false)
                window.location.reload();
            }
        } catch (e) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    const handleParentChange = (parentId: string) => {
        const parent = accounts.find(a => a.id === parentId);
        if (parent) {
            const nextCode = suggestNextCode(parentId, parent.type);
            setFormData(prev => ({
                ...prev,
                parent_id: parentId,
                type: parent.type,
                code: nextCode || prev.code
            }));
        } else {
            setFormData(prev => ({ ...prev, parent_id: parentId }));
        }
    }

    const parentOptions = accounts.filter(a =>
        a.id !== editingAccount?.id &&
        a.is_group &&
        (editingAccount ? a.type === editingAccount.type : true)
    );

    interface AccountNode extends Account {
        children: AccountNode[];
    }

    const buildTree = (allAccs: Account[], parentId: string | null = null, type: string): AccountNode[] => {
        return allAccs
            .filter(a => a.parent_id === parentId && a.type === type)
            .sort((a, b) => a.code.localeCompare(b.code))
            .map(acc => ({
                ...acc,
                children: buildTree(allAccs, acc.id, type)
            }));
    };

    const AccountRow = ({ node, depth }: { node: AccountNode, depth: number }) => (
        <>
            <tr className={cn(
                "hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group",
                node.is_group && "bg-slate-50/50 dark:bg-slate-900/40 font-semibold"
            )}>
                <td className="px-6 py-3 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 w-36">
                    {node.code}
                </td>
                <td className="px-6 py-3">
                    <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
                        {depth > 0 && (
                            <span className="text-slate-300 dark:text-slate-600 font-mono text-xs">└─</span>
                        )}
                        {node.is_group ? (
                            <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                        ) : (
                            <BookOpen className="h-4 w-4 text-slate-400 shrink-0" />
                        )}
                        <span className={cn(
                            "text-xs tracking-tight",
                            node.is_group ? "font-bold text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                        )}>
                            {node.name}
                        </span>
                        {node.is_reconcilable && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" title="Reconcilable Ledger">
                                REC
                            </span>
                        )}
                    </div>
                </td>
                <td className="px-6 py-3 text-center w-28">
                    {node.is_group ? (
                        <Badge variant="outline" className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                            GROUP
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-[10px] font-medium text-slate-500 border-slate-200 dark:border-slate-800">
                            LEDGER
                        </Badge>
                    )}
                </td>
                <td className="px-6 py-3 text-right w-44">
                    <div className="flex items-center justify-end gap-1.5">
                        {node.is_group && (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleQuickAdd(node)}
                                title="Add Child Account"
                                className="h-7 w-7 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                            >
                                <FolderPlus className="h-3.5 w-3.5" />
                            </Button>
                        )}
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDialog(node)}
                            title="Edit Account"
                            className="h-7 w-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {!node.is_group && (
                            <Link href={`/hms/accounting/ledger/${node.id}`}>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    title="View Ledger Statement"
                                    className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                >
                                    <ArrowRightLeft className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        )}
                    </div>
                </td>
            </tr>
            {node.children.map(child => (
                <AccountRow key={child.id} node={child} depth={depth + 1} />
            ))}
        </>
    );

    const totalGroups = accounts.filter(a => a.is_group).length;
    const totalLedgers = accounts.filter(a => !a.is_group).length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 p-6 lg:p-8 space-y-6">
            
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Chart of Accounts</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Institutional General Ledger structure, account hierarchy & balance classification
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => handleOpenDialog()}
                        className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Account
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-indigo-700/50 text-[10px] font-mono font-normal">Alt+C</span>
                    </Button>
                </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Accounts</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{accounts.length}</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Active GL nodes registered in system</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Groups</span>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{totalGroups}</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Parent classifications & sub-headers</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Ledgers</span>
                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{totalLedgers}</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Transaction postable ledger accounts</p>
                </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search by code or account name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-xs font-medium"
                    />
                </div>

                {/* Account Type Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    {['ALL', 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setSelectedType(type)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap",
                                selectedType.toLowerCase() === type.toLowerCase()
                                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/50"
                            )}
                        >
                            {type === 'ALL' ? 'All Types' : type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Account Hierarchy Sections */}
            <div className="space-y-6">
                {ACCOUNT_TYPES.map(type => {
                    if (selectedType !== "ALL" && selectedType.toLowerCase() !== type.value.toLowerCase()) {
                        return null;
                    }

                    const rootNodes = buildTree(filteredAccounts, null, type.value);
                    if (rootNodes.length === 0 && search !== "") return null;
                    if (rootNodes.length === 0 && search === "") return null;

                    return (
                        <div key={type.value} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-2.5 h-2.5 rounded-full", type.dot)} />
                                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                        {type.label}
                                    </h3>
                                </div>
                                <Badge variant="outline" className={cn("text-[10px] font-bold font-mono", type.badge)}>
                                    {filteredAccounts.filter(a => a.type === type.value).length} accounts
                                </Badge>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                                            <th className="px-6 py-3 w-36">Code</th>
                                            <th className="px-6 py-3">Account Particulars</th>
                                            <th className="px-6 py-3 text-center w-28">Type</th>
                                            <th className="px-6 py-3 text-right w-44">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {rootNodes.map(node => (
                                            <AccountRow key={node.id} node={node} depth={0} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add / Edit Account Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
                            {editingAccount ? "Edit Account Ledger" : "Create New Account Ledger"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Configure General Ledger code, parent classification, and reconciliation rules.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Type Toggle: Ledger vs Group */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Account Classification</label>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_group: false })}
                                    className={cn(
                                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                                        !formData.is_group ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
                                    )}
                                >
                                    Posting Ledger
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_group: true })}
                                    className={cn(
                                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                                        formData.is_group ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
                                    )}
                                >
                                    Account Group
                                </button>
                            </div>
                        </div>

                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Account Name</label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Petty Cash, Office Supplies, Patient Receivables"
                                className="h-10 rounded-xl text-xs font-semibold"
                                autoFocus
                            />
                        </div>

                        {/* Under (Parent) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Parent Group (Under)</label>
                            <select
                                value={formData.parent_id}
                                onChange={e => handleParentChange(e.target.value)}
                                className="w-full h-10 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                                <option value="none">Primary / Root (No Parent)</option>
                                {parentOptions.map(p => (
                                    <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Code & Nature */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Account Code</label>
                                <Input
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="e.g. 1001"
                                    className="h-10 rounded-xl text-xs font-mono font-bold"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Nature</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    disabled={formData.parent_id !== 'none'}
                                    className="w-full h-10 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50"
                                >
                                    {ACCOUNT_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Reconcilable Toggle */}
                        {!formData.is_group && (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">Bank Reconciliation</span>
                                    <p className="text-[11px] text-slate-400">Allow matching statement transactions</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_reconcilable: !formData.is_reconcilable })}
                                    className={cn(
                                        "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                                        formData.is_reconcilable
                                            ? "bg-emerald-600 text-white"
                                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                    )}
                                >
                                    {formData.is_reconcilable ? "Enabled" : "Disabled"}
                                </button>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex items-center justify-between gap-2 pt-2">
                        {editingAccount ? (
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleDelete}
                                disabled={isLoading}
                                className="rounded-xl text-xs font-bold mr-auto"
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                            </Button>
                        ) : <div />}

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsDialogOpen(false)}
                                className="rounded-xl text-xs font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                            >
                                {isLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                                {editingAccount ? "Save Changes" : "Create Account"}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
