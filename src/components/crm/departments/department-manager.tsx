'use client'

import { useState, useMemo } from 'react'
import {
    Network, Plus, Edit2, Trash2, ChevronRight,
    ChevronDown, Search, Building2, Briefcase,
    MoreVertical, ArrowRight, Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { upsertDepartment, deleteDepartment } from '@/app/actions/crm/departments'
import { toast } from "sonner"
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Department {
    id: string
    name: string
    code: string | null
    description: string | null
    parent_id: string | null
    is_active: boolean | null
}

interface Props {
    initialDepartments: Department[]
}

export function DepartmentManager({ initialDepartments }: Props) {
    const [departments, setDepartments] = useState(initialDepartments)
    const [search, setSearch] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [editingDept, setEditingDept] = useState<Department | null>(null)
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        parent_id: '' as string | null,
        is_active: true
    })

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const handleOpenDialog = (dept?: Department, parentId?: string) => {
        if (dept) {
            setEditingDept(dept)
            setFormData({
                name: dept.name,
                code: dept.code || '',
                description: dept.description || '',
                parent_id: dept.parent_id,
                is_active: dept.is_active ?? true
            })
        } else {
            setEditingDept(null)
            setFormData({
                name: '',
                code: '',
                description: '',
                parent_id: parentId || null,
                is_active: true
            })
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const result = await upsertDepartment({
            id: editingDept?.id,
            ...formData
        })
        setLoading(false)

        if (result.success) {
            toast.success("Success", { description: 'Department saved successfully' })
            setIsDialogOpen(false)
            // Refresh logic - real apps would fetch or use revalidatePath
            window.location.reload()
        } else {
            toast.error("Error", { description: result.error || 'Failed to save' })
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This cannot be undone.')) return

        const result = await deleteDepartment(id)
        if (result.success) {
            toast.success("Deleted", { description: 'Department removed successfully' })
            window.location.reload()
        } else {
            toast.error("Error", { description: result.error || 'Failed to delete' })
        }
    }

    // Build the tree
    const tree = useMemo(() => {
        const map: Record<string, any> = {}
        const roots: any[] = []

        departments.forEach(d => {
            map[d.id] = { ...d, children: [] }
        })

        departments.forEach(d => {
            if (d.parent_id && map[d.parent_id]) {
                map[d.parent_id].children.push(map[d.id])
            } else {
                roots.push(map[d.id])
            }
        })

        return roots
    }, [departments])

    const renderDept = (dept: any, depth = 0) => {
        const hasChildren = dept.children.length > 0 || (dept.crm_designations && dept.crm_designations.length > 0)
        const isExpanded = expanded[dept.id]
        const isMatch = dept.name.toLowerCase().includes(search.toLowerCase()) ||
            (dept.code && dept.code.toLowerCase().includes(search.toLowerCase()))

        return (
            <div key={dept.id} className="space-y-1">
                <div className={cn(
                    "group flex items-center justify-between p-3 rounded-2xl transition-all duration-300",
                    "hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 border border-transparent hover:border-indigo-100",
                    isMatch ? "bg-white/40" : "opacity-60 grayscale-[0.5]"
                )}
                    style={{ marginLeft: `${depth * 24}px` }}
                >
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => toggleExpand(dept.id)}
                            className={cn(
                                "w-6 h-6 flex items-center justify-center rounded-lg transition-colors hover:bg-slate-100",
                                !hasChildren && "invisible"
                            )}
                        >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>

                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
                            depth === 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                        )}>
                            {depth === 0 ? <Building2 className="w-5 h-5" /> : <Briefcase className="w-4 h-4" />}
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                {dept.name}
                                {dept.code && <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black text-slate-500 uppercase">{dept.code}</span>}
                                <Badge variant={dept.is_active ? 'default' : 'secondary'} className="text-[8px] h-4 px-1 py-0 shadow-none border-none">
                                    {dept.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                <span className="text-[10px] text-indigo-400 font-bold ml-2">
                                    {dept.crm_designations?.length || 0} ROLES
                                </span>
                            </h4>
                            <p className="text-xs text-slate-400 font-medium truncate max-w-[300px]">{dept.description || 'No description'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" title="Add Sub-Department" onClick={() => handleOpenDialog(undefined, dept.id)} className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                            <Plus className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Add Designation" asChild className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                            <a href={`/settings/designations/new?department_id=${dept.id}`}>
                                <Briefcase className="w-4 h-4" />
                            </a>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4 text-slate-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl p-2 border-slate-100 shadow-2xl">
                                <DropdownMenuItem onClick={() => handleOpenDialog(dept)} className="rounded-lg gap-2 cursor-pointer">
                                    <Edit2 className="w-3.5 h-3.5" /> Edit Dept
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(dept.id)} className="rounded-lg gap-2 cursor-pointer text-red-600 focus:text-red-600">
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {isExpanded && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                        {/* Render Designations */}
                        {dept.crm_designations?.map((desig: any) => (
                            <div
                                key={desig.id}
                                className="flex items-center justify-between p-2 pl-8 ml-[36px] bg-slate-50/50 rounded-xl border border-transparent hover:border-slate-200 group-designation"
                                style={{ marginLeft: `${(depth + 1) * 24}px` }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-indigo-400 mr-1" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{desig.name}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{desig.description || 'No role description'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-indigo-600" asChild>
                                        <a href={`/settings/designations/${desig.id}`}>
                                            <Edit2 className="h-3 w-3" />
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {/* Render Sub-Departments */}
                        {dept.children.map((child: any) => renderDept(child, depth + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white shadow-xl">
                <div className="flex items-center gap-4 w-full md:w-96 bg-white rounded-2xl px-4 py-2 border border-slate-100 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                    <Search className="w-5 h-5 text-slate-400" />
                    <Input
                        placeholder="Scan for departments..."
                        className="border-none bg-transparent focus-visible:ring-0 px-0 h-8 font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button
                        onClick={() => handleOpenDialog()}
                        className="flex-1 md:flex-none bg-indigo-600 hover:bg-slate-900 text-white font-bold h-12 px-8 rounded-2xl shadow-lg shadow-indigo-100 transition-all hover:-translate-y-1"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Deploy New Department
                    </Button>
                </div>
            </div>

            {/* Tree View */}
            <div className="space-y-4">
                {tree.map(root => renderDept(root))}
                {tree.length === 0 && (
                    <div className="text-center py-20 bg-white/20 rounded-[3rem] border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4 shadow-sm">
                            <Layers className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Neural Network Empty</h3>
                        <p className="text-slate-500 font-medium">Initialize your organization's structural hierarchy.</p>
                    </div>
                )}
            </div>

            {/* Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[2rem] shadow-3xl">
                    <form onSubmit={handleSubmit}>
                        <div className="p-8 space-y-6">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">
                                    {editingDept ? 'Modify Department' : 'Deploy New Department'}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Official Name</Label>
                                    <Input
                                        required
                                        placeholder="e.g. Strategic Operations"
                                        className="h-12 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Auth Code (ID)</Label>
                                        <Input
                                            placeholder="OPS-01"
                                            className="h-12 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Parent Entity</Label>
                                        <select
                                            className="w-full h-12 bg-slate-50 border-transparent rounded-xl px-4 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                                            value={formData.parent_id || ''}
                                            onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                                        >
                                            <option value="">Top Level (Headquarters)</option>
                                            {departments.filter(d => d.id !== editingDept?.id).map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-2">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            id="is_active"
                                            checked={formData.is_active}
                                            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                        />
                                        <Label htmlFor="is_active" className="text-sm font-bold text-slate-700">
                                            {formData.is_active ? 'Active' : 'Inactive'}
                                        </Label>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Operational Brief</Label>
                                    <Textarea
                                        placeholder="Describe the department mission..."
                                        className="bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[100px]"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="bg-slate-50 p-6">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold text-slate-500">Cancel</Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-indigo-600 hover:bg-slate-900 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-indigo-100"
                            >
                                {loading ? 'Processing...' : (editingDept ? 'Update Hierarchy' : 'Initialize')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
