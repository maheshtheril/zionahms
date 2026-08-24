'use client'

import { useState, useEffect, useMemo } from "react"
import { getAllPermissions } from "@/app/actions/rbac"
import { createPermission, deletePermission } from "@/app/actions/permissions"
import { getActiveModules, syncMissingModules, createModule } from "@/app/actions/modules"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Shield, Search, Lock, Code, LayoutGrid, List, Layers } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Futuristic Module Colors (Updated for DB Keys)
// Futuristic Module Colors (Updated for Theme Capability)
const MODULE_COLORS: Record<string, string> = {
    'hms': 'text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800 hover:border-cyan-500',
    'crm': 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 hover:border-purple-500',
    'finance': 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 hover:border-emerald-500',
    'inventory': 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 hover:border-amber-500',
    'purchasing': 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 hover:border-orange-500',
    'pharmacy': 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 hover:border-teal-500',
    'system': 'text-slate-700 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 hover:border-slate-500',
    'hr': 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 hover:border-rose-500',
    'projects': 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:border-blue-500',
    'reports': 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 hover:border-indigo-500',
    'sales': 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 hover:border-yellow-500',
    'default': 'text-slate-700 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 hover:border-slate-600',
};

const getModuleColor = (key: string) => {
    return MODULE_COLORS[key.toLowerCase()] || MODULE_COLORS['default'];
};


import { useSearchParams } from "next/navigation"

export default function PermissionsPage() {
    const searchParams = useSearchParams()
    const isDeveloper = searchParams.get('dev') === 'true'

    const [permissions, setPermissions] = useState<Array<{ code: string; name: string; module: string }>>([])
    const [dbModules, setDbModules] = useState<Array<{ id: string, module_key: string, name: string }>>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [selectedModule, setSelectedModule] = useState("All")

    // Create/Delete States
    const [createOpen, setCreateOpen] = useState(false)
    const [createModuleOpen, setCreateModuleOpen] = useState(false)
    const [newPermission, setNewPermission] = useState({ code: '', name: '', module: 'Custom' })
    const [newModule, setNewModule] = useState({ key: '', name: '', description: '' })
    const [submitting, setSubmitting] = useState(false)
    // Removed isCustomModule state as we enforce strict selection

    const loadData = async () => {
        setLoading(true)

        // Sync first to ensure DB has all used modules
        await syncMissingModules();

        const [permRes, modRes] = await Promise.all([
            getAllPermissions(),
            getActiveModules()
        ]);

        if (permRes.success && permRes.data) {
            setPermissions(permRes.data)
        }

        if (modRes.success && modRes.data) {
            // DIRECTLY USE DB DATA. NO NORMALIZATION "CHEATING".
            setDbModules(modRes.data);
        }

        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPermission.code || !newPermission.name) return;

        setSubmitting(true);
        try {
            const result = await createPermission({
                code: newPermission.code,
                name: newPermission.name,
                category: newPermission.module
            });

            if (result.error) {
                toast.error("Error", { description: result.error });
            } else {
                toast.success("Success", { description: "Permission created successfully" });
                setCreateOpen(false);
                setNewPermission({ code: '', name: '', module: 'Custom' });
                // isCustomModule removed
                loadData();
            }
        } catch (error) {
            toast.error("Operation Failed", { description: "Could not create permission" });
        } finally {
            setSubmitting(false);
        }
    }

    const handleCreateModule = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const result = await createModule(newModule);
            if (result.error) {
                toast.error("Error", { description: result.error });
            } else {
                toast.success("Success", { description: "Module registered successfully" });
                setCreateModuleOpen(false);
                setNewModule({ key: '', name: '', description: '' });
                loadData(); // Refresh list
            }
        } catch (error) {
            toast.error("Error", { description: "Unexpected error" });
        } finally {
            setSubmitting(false);
        }
    }

    const handleDelete = async (code: string) => {
        if (!confirm(`Are you sure you want to delete permission '${code}'? \nThis allows access to functionality.`)) return;

        const result = await deletePermission(code);
        if (result.error) {
            toast.error("Error", { description: result.error });
        } else {
            toast.success("Permission Deleted", { description: `Permission '${code}' removed.` });
            loadData();
        }
    }

    // Filter Logic
    const filteredPermissions = useMemo(() => {
        return permissions.filter(p => {
            const matchesSearch =
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.code.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesModule = selectedModule === "All" ||
                p.module.toLowerCase() === selectedModule.toLowerCase() ||
                // Try matching against name if selectedModule is a Name like "Hospital Management" and p.module is "HMS"?
                // We'll stick to simple case-insensitive comparison for now.
                // Or if we stored the 'key' in selectedModule?
                false;

            return matchesSearch && matchesModule;
        });
    }, [permissions, searchQuery, selectedModule]);

    // Stats Logic (Using DB Objects)
    const moduleStats = useMemo(() => {
        // Map Key (lowercase) -> { count, name, key }
        const map: Record<string, { count: number, name: string, key: string }> = {};

        // Init with DB
        dbModules.forEach(m => {
            map[m.module_key.toLowerCase()] = { count: 0, name: m.name, key: m.module_key };
        });

        // Count Permissions
        permissions.forEach(p => {
            const lookup = p.module.toLowerCase();
            if (map[lookup]) {
                map[lookup].count++;
            } else {
                // Permission uses a category not in DB modules (Sync failed?)
                // Just show it as is
                map[lookup] = { count: 1, name: p.module, key: p.module };
            }
        });

        return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
    }, [permissions, dbModules]);

    // Available Modules (Strictly DB)
    const availableModules = useMemo(() => {
        return dbModules.sort((a, b) => a.name.localeCompare(b.name));
    }, [dbModules]);


    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8 font-sans transition-colors duration-300">
            {/* Ambient Background Glow */}
            <div className="fixed top-0 left-0 w-full h-96 bg-purple-900/20 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
            <div className="fixed bottom-0 right-0 w-full h-96 bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none translate-y-1/2" />

            <div className="max-w-7xl mx-auto relative z-10 space-y-8">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-white/5">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
                            <Shield className="h-10 w-10 text-cyan-600 dark:text-cyan-400" />
                            Access Control Registry
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg flex items-center gap-2">
                            Define granular capabilities for the neural system.
                            {dbModules.length > 0 && (
                                <div className="mt-4 flex items-center gap-3 text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30 px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800/50 w-fit animate-in slide-in-from-left-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                                        <div className="relative h-2.5 w-2.5 bg-emerald-500 rounded-full"></div>
                                    </div>
                                    <span className="font-mono text-sm tracking-wide">
                                        DATABASE CONNECTION ACTIVE: {dbModules.length} MODULES SYNCED
                                    </span>
                                </div>
                            )}
                        </p>
                    </div>

                    {isDeveloper && (
                        <div className="flex items-center gap-3">
                            <Dialog open={createModuleOpen} onOpenChange={setCreateModuleOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="border-cyan-500/20 text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10">
                                        <Layers className="mr-2 h-4 w-4" />
                                        Register Module
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                                    <DialogHeader>
                                        <DialogTitle>Register New Module</DialogTitle>
                                        <DialogDescription>
                                            Define a new functional module in the database.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleCreateModule} className="space-y-4">
                                        <div>
                                            <Label>Module Key</Label>
                                            <Input
                                                placeholder="e.g. logistics"
                                                value={newModule.key}
                                                onChange={e => setNewModule({ ...newModule, key: e.target.value })}
                                                className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 font-mono"
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">Lowercase, no spaces.</p>
                                        </div>
                                        <div>
                                            <Label>Display Name</Label>
                                            <Input
                                                placeholder="e.g. Logistics & Fleet"
                                                value={newModule.name}
                                                onChange={e => setNewModule({ ...newModule, name: e.target.value })}
                                                className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                                                required
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={submitting}>
                                                {submitting ? <Loader2 className="animate-spin" /> : "Create Module"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 md:w-auto w-full">
                                        <Plus className="mr-2 h-5 w-5" />
                                        Create Permission
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl">Define New Capability</DialogTitle>
                                        <DialogDescription className="text-slate-500 dark:text-slate-400">
                                            Create a new permission code that can be used to protect Pages, Forms, or API Routes.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleCreate} className="space-y-6 mt-4">
                                        <div className="space-y-2">
                                            <Label className="text-cyan-700 dark:text-cyan-400">Permission Code</Label>
                                            <div className="relative">
                                                <Code className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                                <Input
                                                    placeholder="e.g. hms:surgery:create"
                                                    value={newPermission.code}
                                                    onChange={e => setNewPermission({ ...newPermission, code: e.target.value })}
                                                    className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 font-mono text-sm"
                                                    required
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500">Must be unique. Convention: module:feature:action</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Display Name</Label>
                                            <Input
                                                placeholder="e.g. Create New Surgery"
                                                value={newPermission.name}
                                                onChange={e => setNewPermission({ ...newPermission, name: e.target.value })}
                                                className="bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                Module Category
                                                <span className="text-xs font-normal text-slate-500">(Synced from Database)</span>
                                            </Label>
                                            <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-950 rounded-lg border border-slate-800 max-h-32 overflow-y-auto">
                                                {availableModules.map(mod => (
                                                    <div
                                                        key={mod.id}
                                                        onClick={() => { setNewPermission({ ...newPermission, module: mod.name }); }}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors border",
                                                            newPermission.module === mod.name
                                                                ? "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border-cyan-500/50 dark:border-cyan-500 shadow-[0_0_10px_rgba(8,145,178,0.2)]"
                                                                : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-slate-200"
                                                        )}
                                                    >
                                                        {mod.name}
                                                    </div>
                                                ))}
                                                {/* "Other" option REMOVED to enforce DB integrity */}
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                To add a new category, use the "Register Module" button first.
                                            </p>
                                        </div>

                                        <DialogFooter>
                                            <Button type="submit" disabled={submitting} className="w-full bg-cyan-600 hover:bg-cyan-500">
                                                {submitting ? <Loader2 className="animate-spin" /> : "Register Permission"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                </header>


                {/* Controls Section */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-2xl">
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar">
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedModule('All')}
                            className={cn("rounded-full px-4", selectedModule === 'All' ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white")}
                        >
                            All
                            <span className="ml-2 text-xs bg-slate-200/20 px-1.5 py-0.5 rounded-full">{permissions.length}</span>
                        </Button>
                        {moduleStats.map(mod => {
                            const colorStyle = getModuleColor(mod.key);
                            const isSelected = selectedModule === mod.name;

                            return (
                                <Button
                                    key={mod.key}
                                    variant="outline"
                                    onClick={() => setSelectedModule(mod.name)}
                                    className={cn(
                                        "rounded-full px-4 whitespace-nowrap transition-all border",
                                        isSelected
                                            ? colorStyle.replace('bg-', 'bg-opacity-50 bg-') + " shadow-[0_0_15px_rgba(var(--color-primary),0.3)] ring-1 ring-white/20"
                                            : "opacity-70 hover:opacity-100 bg-transparent nav-item", // Dim unselected
                                        // We need to override the default btn styles to apply our custom colors
                                        colorStyle
                                    )}
                                >
                                    {mod.name}
                                    <span className={cn(
                                        "ml-2 text-xs px-2 py-0.5 rounded-full bg-black/20"
                                    )}>
                                        {mod.count}
                                    </span>
                                </Button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search permissions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:border-cyan-500/50 transition-all rounded-full h-9"
                            />
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-10 w-10 text-cyan-500 animate-spin" />
                            <p className="text-slate-500 animate-pulse">Scanning Security Matrix...</p>
                        </div>
                    </div>
                ) : (
                    <motion.div
                        layout
                        className={cn(
                            "grid gap-4 w-full",
                            viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
                        )}
                    >
                        <AnimatePresence>
                            {filteredPermissions.map((perm) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    key={perm.code}
                                    className="group relative overflow-hidden bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 rounded-xl p-5 hover:shadow-2xl hover:shadow-cyan-900/10 transition-all duration-300"
                                >
                                    {/* Hover Glow Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline" className={cn("text-xs rounded-md px-2 py-0.5 border font-normal", MODULE_COLORS[perm.module] || MODULE_COLORS['Custom'])}>
                                                {perm.module}
                                            </Badge>

                                            {/* Delete Action */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(perm.code)}
                                                className="h-6 w-6 text-slate-600 hover:text-red-400 hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white truncate" title={perm.name}>
                                                {perm.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-slate-100 dark:bg-black/20 px-2 py-1 rounded w-fit max-w-full">
                                                <Lock className="h-3 w-3 flex-shrink-0" />
                                                <span className="truncate">{perm.code}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

                {!loading && filteredPermissions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <Shield className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg">No permissions found matching your criteria.</p>
                        <Button variant="link" onClick={() => { setSearchQuery(''); setSelectedModule('All'); }}>Clear Filters</Button>
                    </div>
                )}
            </div>
        </div>
    )
}
