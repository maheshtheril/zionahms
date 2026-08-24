'use client'

import { useState, useEffect } from "react"
import { updateRole, deleteRole, getAllPermissions } from "@/app/actions/rbac"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Pencil, Trash2, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"

interface RoleActionsProps {
    role: {
        id: string
        key: string
        name: string
        permissions: string[]
    }
}

export function RoleActions({ role }: RoleActionsProps) {
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingPermissions, setLoadingPermissions] = useState(false)
    const [permissions, setPermissions] = useState<Array<{ code: string; name: string; module: string }>>([])
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(role.permissions || [])
    const [name, setName] = useState(role.name || '')
    const [searchQuery, setSearchQuery] = useState("")
    const router = useRouter()

    const loadPermissions = async () => {
        setLoadingPermissions(true)
        const result = await getAllPermissions()
        if ('data' in result) {
            setPermissions(result.data || [])
        }
        setLoadingPermissions(false)
    }

    useEffect(() => {
        if (editOpen && permissions.length === 0 && !loadingPermissions) {
            loadPermissions()
        }
    }, [editOpen])

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name) {
            toast.error("Validation Error", { description: "Please enter a role name" })
            return
        }

        if (selectedPermissions.length === 0) {
            toast.error("Validation Error", { description: "Please select at least one permission" })
            return
        }

        setLoading(true)
        try {
            const result = await updateRole(role.id, {
                name,
                permissions: selectedPermissions
            })

            if ('error' in result) {
                toast.error("Error", { description: result.error })
            } else {
                toast.success("Success", { description: "Role updated successfully" })
                setEditOpen(false)
                router.refresh()
            }
        } catch (error) {
            toast.error("Error", { description: "Failed to update role" })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        setLoading(true)
        try {
            const result = await deleteRole(role.id)

            if ('error' in result) {
                toast.error("Error", { description: result.error })
            } else {
                toast.success("Success", { description: "Role deleted successfully" })
                setDeleteOpen(false)
                router.refresh()
            }
        } catch (error) {
            toast.error("Error", { description: "Failed to delete role" })
        } finally {
            setLoading(false)
        }
    }

    const togglePermission = (permCode: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permCode)
                ? prev.filter(p => p !== permCode)
                : [...prev, permCode]
        )
    }

    const selectAllInModule = (module: string) => {
        const modulePerm = permissions.filter(p => p.module === module).map(p => p.code)
        const allSelected = modulePerm.every(p => selectedPermissions.includes(p))

        if (allSelected) {
            setSelectedPermissions(prev => prev.filter(p => !modulePerm.includes(p)))
        } else {
            setSelectedPermissions(prev => [...new Set([...prev, ...modulePerm])])
        }
    }

    // Group permissions by module
    const permissionsByModule = permissions.reduce((acc, perm) => {
        if (!acc[perm.module]) {
            acc[perm.module] = []
        }
        acc[perm.module].push(perm)
        return acc
    }, {} as Record<string, typeof permissions>)

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Role
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setDeleteOpen(true)}
                        className="text-red-600"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Role
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900">
                    <DialogHeader>
                        <DialogTitle>Edit Role: {role.key}</DialogTitle>
                        <DialogDescription>
                            Update the role name and permissions
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEdit} className="flex flex-col flex-1 min-h-0">
                        <div className="space-y-6 flex-1 overflow-y-auto px-1">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Role Name *</Label>
                                <Input
                                    id="edit-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <Label>Permissions Configuration</Label>

                                {/* DEBUG MODE: Simplified Rendering */}
                                {loadingPermissions ? (
                                    <div className="flex items-center justify-center p-4">Loading...</div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                            <Input
                                                placeholder="Search permissions..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-8"
                                            />
                                        </div>
                                        <div className="h-[300px] overflow-y-auto border p-2 rounded-md bg-slate-50 dark:bg-slate-950">
                                            <p className="text-xs font-bold pb-2 text-slate-500 uppercase tracking-wider">
                                                Showing {permissions.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.module.toLowerCase().includes(searchQuery.toLowerCase())).length} of {permissions.length} Permissions
                                            </p>
                                            {permissions
                                                .filter(p =>
                                                    !searchQuery ||
                                                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    p.module.toLowerCase().includes(searchQuery.toLowerCase())
                                                )
                                                .map(p => (
                                                    <label key={p.code} className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded cursor-pointer">
                                                        <Checkbox
                                                            checked={selectedPermissions.includes(p.code)}
                                                            onCheckedChange={() => togglePermission(p.code)}
                                                        />
                                                        <div>
                                                            <span className="text-sm font-medium">{p.name}</span>
                                                            <span className="ml-2 text-xs text-slate-400">({p.module})</span>
                                                        </div>
                                                    </label>
                                                ))}
                                            {permissions.length === 0 && <p className="text-red-500">No permissions loaded.</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditOpen(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Role?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the role <strong>{role.name}</strong>?
                            This action cannot be undone. Users assigned to this role will lose their permissions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Role'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
