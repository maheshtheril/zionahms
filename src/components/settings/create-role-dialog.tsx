'use client'

import { useState, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { createRole, getAllPermissions } from "@/app/actions/rbac"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Plus, Shield, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export function CreateRoleDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingPermissions, setLoadingPermissions] = useState(false)
    const [permissions, setPermissions] = useState<Array<{ code: string; name: string; module: string }>>([])
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [activeModule, setActiveModule] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        key: '',
        name: ''
    })
    const router = useRouter()

    // Helper to normalize module names
    const normalizeModule = (name: string) => {
        if (!name) return 'Other';
        const lower = name.toLowerCase();
        if (lower === 'crm' || lower === 'hms' || lower === 'erp') return name.toUpperCase();
        if (lower === 'system') return 'System';
        return name.charAt(0).toUpperCase() + name.slice(1);
    }

    const loadPermissions = async () => {
        setLoadingPermissions(true)
        const result = await getAllPermissions()
        if ('data' in result) {
            const perms = result.data || []
            setPermissions(perms)
            if (perms.length > 0 && !activeModule) {
                setActiveModule(normalizeModule(perms[0].module))
            }
        }
        setLoadingPermissions(false)
    }

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (newOpen && permissions.length === 0) {
            loadPermissions()
        }
        if (!newOpen) {
            // Reset form
            setFormData({ key: '', name: '' })
            setSelectedPermissions([])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.key || !formData.name) {
            toast.error("Validation Error", { description: "Please fill in all required fields" })
            return
        }

        if (selectedPermissions.length === 0) {
            toast.error("Validation Error", { description: "Please select at least one permission" })
            return
        }

        setLoading(true)
        try {
            const result = await createRole({
                key: formData.key,
                name: formData.name,
                permissions: selectedPermissions
            })

            if ('error' in result) {
                toast.error("Error", { description: result.error })
            } else {
                toast.success("Success", { description: "Role created successfully" })
                setOpen(false)
                router.refresh()
            }
        } catch (error) {
            toast.error("Error", { description: "Failed to create role" })
        } finally {
            setLoading(false)
        }
    }

    const togglePermission = useCallback((permCode: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permCode)
                ? prev.filter(p => p !== permCode)
                : [...prev, permCode]
        )
    }, [])

    const selectAllInModule = (moduleKey: string) => {
        // key matches the normalized module name
        const modulePerms = permissions
            .filter(p => normalizeModule(p.module) === moduleKey)
            .map(p => p.code)

        const allSelected = modulePerms.every(p => selectedPermissions.includes(p))

        if (allSelected) {
            setSelectedPermissions(prev => prev.filter(p => !modulePerms.includes(p)))
        } else {
            setSelectedPermissions(prev => [...new Set([...prev, ...modulePerms])])
        }
    }

    // Group permissions by module - Memoized to prevent render loops
    const permissionsByModule = useMemo(() => {
        return permissions.reduce((acc, perm) => {
            const moduleName = normalizeModule(perm.module);

            if (!acc[moduleName]) {
                acc[moduleName] = []
            }
            acc[moduleName].push(perm)
            return acc
        }, {} as Record<string, typeof permissions>)
    }, [permissions])

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="relative group bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 transition-all duration-300 border-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-cyan-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur" />
                    <Plus className="h-4 w-4 mr-2" />
                    Create Role
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col border-slate-700 bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Create New Role
                    </DialogTitle>
                    <DialogDescription>
                        Define a new role with specific permissions for your organization
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 gap-4 p-1">
                    {/* Fixed Header Inputs */}
                    <div className="grid grid-cols-2 gap-4 px-1 shrink-0">
                        <div className="space-y-2">
                            <Label htmlFor="key">Role Key *</Label>
                            <Input
                                id="key"
                                placeholder="e.g., custom_manager"
                                value={formData.key}
                                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                required
                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus-visible:ring-indigo-500"
                            />
                            <p className="text-xs text-muted-foreground">
                                Unique identifier (lowercase, underscores only)
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Role Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Custom Manager"
                                value={formData.name}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    const key = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                                    setFormData({ name, key });
                                }}
                                required
                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus-visible:ring-indigo-500"
                            />
                            <p className="text-xs text-muted-foreground">
                                Display name for this role
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col flex-1 min-h-0 gap-2">
                        <div className="flex justify-between items-center px-1">
                            <div>
                                <Label>Permissions *</Label>
                                <p className="text-xs text-muted-foreground">
                                    Select {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        {loadingPermissions ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : (
                            <div className="flex flex-1 border rounded-lg overflow-hidden border-slate-700 bg-slate-900/50 min-h-0">
                                {/* Left Sidebar */}
                                <div className="w-[180px] bg-slate-900/80 border-r border-slate-700 flex flex-col">
                                    <div className="p-3 border-b border-slate-800 bg-slate-900 shrink-0">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Modules</p>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        <div className="flex flex-col">
                                            {Object.entries(permissionsByModule)
                                                .sort(([a], [b]) => a.localeCompare(b))
                                                .map(([module, perms]) => (
                                                    <button
                                                        key={module}
                                                        onClick={(e) => { e.preventDefault(); setActiveModule(module); }}
                                                        className={cn(
                                                            "w-full text-left px-3 py-3 text-sm flex items-center justify-between transition-colors border-l-2",
                                                            activeModule === module
                                                                ? "bg-cyan-950/30 text-cyan-400 border-cyan-500 font-medium"
                                                                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-transparent"
                                                        )}
                                                    >
                                                        <span className="truncate mr-2">{module}</span>
                                                        <Badge variant="secondary" className="scale-75 bg-slate-800 text-slate-400 border-slate-700 h-5 px-1.5">{perms.length}</Badge>
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Content */}
                                <div className="flex-1 flex flex-col bg-slate-950/30 min-h-0">
                                    {activeModule && permissionsByModule[activeModule] ? (
                                        <>
                                            <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/20 h-[53px] shrink-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-white text-sm">{activeModule}</h3>
                                                    <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px] h-5">
                                                        {permissionsByModule[activeModule].length} Items
                                                    </Badge>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => selectAllInModule(activeModule)}
                                                    className="text-xs h-7 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30"
                                                >
                                                    {permissionsByModule[activeModule].every(p => selectedPermissions.includes(p.code))
                                                        ? 'Deselect All'
                                                        : 'Select All'}
                                                </Button>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-3">
                                                <div className="grid grid-cols-2 gap-3 pb-20">
                                                    {permissionsByModule[activeModule].map(perm => (
                                                        <div
                                                            key={perm.code}
                                                            className="flex items-start space-x-3 p-3 rounded-md bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 cursor-pointer transition-all group"
                                                            onClick={() => togglePermission(perm.code)}
                                                        >
                                                            <div className="relative flex items-center justify-center h-4 w-4">
                                                                <input
                                                                    type="checkbox"
                                                                    id={perm.code}
                                                                    checked={selectedPermissions.includes(perm.code)}
                                                                    readOnly
                                                                    className="peer h-4 w-4 appearance-none rounded border border-slate-500 bg-transparent checked:bg-cyan-500 checked:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 pointer-events-none transition-all"
                                                                />
                                                                <Check className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                                            </div>
                                                            <div className="grid gap-0.5">
                                                                <label className="text-sm font-medium leading-none cursor-pointer text-slate-200 group-hover:text-white transition-colors">
                                                                    {/* Format name to Title Case + Handle CRM specifically */}
                                                                    {perm.name
                                                                        .replace(/_/g, ' ')
                                                                        .replace(/\b\w/g, c => c.toUpperCase())
                                                                        .replace(/\bCrm\b/g, 'CRM')
                                                                        .replace(/\bHms\b/g, 'HMS')}
                                                                </label>
                                                                <p className="text-[10px] text-slate-500 font-mono group-hover:text-slate-400">{perm.code}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Select a module to view permissions</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Role
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
