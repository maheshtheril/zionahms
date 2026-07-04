
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Save, X, UserPlus, Mail, Phone, Building2, Briefcase, Globe } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { createEmployee, getEmployeeMasters } from '@/app/actions/crm/employees'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

function renderDesignationOptions(designations: any[] = [], parentId: string | null = null, depth = 0): any {
    if (!Array.isArray(designations)) return [];
    return designations
        .filter(desig => (desig.parent_id || null) === parentId)
        .map(desig => {
            return (
                <React.Fragment key={desig.id}>
                    <SelectItem 
                        value={desig.id} 
                        className={depth === 0 ? "font-bold text-slate-800" : "text-slate-600"}
                    >
                        {"\u00A0".repeat(depth * 4)}{depth > 0 ? "↳ " : ""}{desig.name}
                    </SelectItem>
                    {renderDesignationOptions(designations, desig.id, depth + 1)}
                </React.Fragment>
            );
        });
}

export default function NewEmployeePage() {
    const router = useRouter()
    const [isMounted, setIsMounted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [masters, setMasters] = useState<{
        designations: any[],
        branches: any[],
        departments: any[],
        supervisors: any[]
    }>({
        designations: [],
        branches: [],
        departments: [],
        supervisors: []
    })

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        designation_id: '',
        department_id: '',
        supervisor_id: 'none',
        branch_id: '',
        office: '',
        category: '',
        address: '',
        city: '',
        pincode: '',
        country: 'India',
        state: '',
        district: '',
        status: 'active',
        // Target Settings
        targetType: 'individual',
        targetCycle: 'monthly',
        targets: {
            'January': '',
            'February': '',
            'March': '',
            'April': '',
            'May': '',
            'June': '',
            'July': '',
            'August': '',
            'September': '',
            'October': '',
            'November': '',
            'December': ''
        }
    })

    useEffect(() => {
        setIsMounted(true)
        async function load() {
            const res = await getEmployeeMasters()
            if (res.success) {
                setMasters(res as any)
            }
        }
        load()
    }, [])

    if (!isMounted) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.password !== formData.confirmPassword) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Passwords do not match."
            })
            return
        }

        if (!formData.username || !formData.email || !formData.first_name) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please fill in all required fields."
            })
            return
        }

        setLoading(true)
        try {
            const result = await createEmployee(formData as any)
            if (result.success) {
                toast({
                    title: "Success",
                    description: "Employee created successfully."
                })
                router.push('/crm/employees')
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to create employee"
                })
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred."
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            <header className="flex items-center justify-between border-b border-indigo-500/10 pb-10">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20">
                        <UserPlus className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">Initialize personnel</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-3">Personnel Deployment & Hierarchy Mapping</p>
                    </div>
                </div>
                <Button variant="outline" onClick={() => router.back()} className="rounded-2xl border-slate-200 font-bold px-6 h-12 gap-2 text-slate-500 hover:bg-slate-50">
                    <X className="h-4 w-4" /> Cancel Process
                </Button>
            </header>

            <form onSubmit={handleSubmit}>
                <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="bg-slate-100/50 p-1 rounded-2xl mb-6">
                        <TabsTrigger value="personal" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Personal Details</TabsTrigger>
                        <TabsTrigger value="target" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Target Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="personal">
                        {/* same content as before, but without the extra Tabs wrap */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
                            <div className="md:col-span-2 space-y-6">
                                <Card className="border-slate-200 shadow-sm overflow-hidden">
                                    <CardHeader className="bg-slate-50 border-b">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <UserPlus className="h-4 w-4 text-indigo-600" />
                                            Identity & Security
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label>First Name <span className="text-red-500">*</span></Label>
                                                <Input required placeholder="Karthick" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Last Name</Label>
                                                <Input placeholder="Aravindh" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label>User Name <span className="text-red-500">*</span></Label>
                                                <Input placeholder="karthick_a" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Mobile</Label>
                                                <Input placeholder="9995679797" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label>Password</Label>
                                                <Input type="password" placeholder="********" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Confirm Password</Label>
                                                <Input type="password" placeholder="********" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label>Email <span className="text-red-500">*</span></Label>
                                                <Input type="email" placeholder="pm@attestation.in" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Country</Label>
                                                <Input type="text" placeholder="e.g. India" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label>State / Province</Label>
                                                <Input placeholder="Enter state" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>District</Label>
                                                <Input type="text" placeholder="e.g. Ernakulam" value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Physical Address</Label>
                                            <Input placeholder="Building, Street, Area" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label>City</Label>
                                                <Input placeholder="City" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Zip / Postal Code</Label>
                                                <Input placeholder="Zip/Postal code" value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-200 shadow-sm overflow-hidden">
                                    <CardHeader className="bg-slate-50 border-b">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Briefcase className="h-4 w-4 text-indigo-600" />
                                            Role & Access
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label>Role</Label>
                                                <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                                                    <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="user">User / Agent</SelectItem>
                                                        <SelectItem value="manager">Manager</SelectItem>
                                                        <SelectItem value="admin">Administrator</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <Label>Designation</Label>
                                                    <a href="/settings/designations/new" target="_blank" className="text-[10px] font-bold text-indigo-600 hover:underline">QUICK ADD (New Tab)</a>
                                                </div>
                                                <Select
                                                    value={formData.designation_id}
                                                    onValueChange={v => {
                                                        const desig = masters.designations.find(d => d.id === v);
                                                        const update: any = { designation_id: v };
                                                        if (desig?.department_id) {
                                                            update.department_id = desig.department_id;
                                                        }
                                                        setFormData({ ...formData, ...update });
                                                    }}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Select Designation" /></SelectTrigger>
                                                    <SelectContent>
                                                        {renderDesignationOptions(masters.designations)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <Label>Department</Label>
                                                    <a href="/crm/departments" className="text-[10px] font-bold text-indigo-600 hover:underline">MANAGE</a>
                                                </div>
                                                <Select value={formData.department_id} onValueChange={v => setFormData({ ...formData, department_id: v })}>
                                                    <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                                                    <SelectContent>
                                                        {masters.departments.map(d => (
                                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Branch / Office</Label>
                                                <Select value={formData.branch_id} onValueChange={v => setFormData({ ...formData, branch_id: v })}>
                                                    <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                                                    <SelectContent>
                                                        {masters.branches.map(b => (
                                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1">
                                            <div className="space-y-1">
                                                <Label>Select Supervisor</Label>
                                                <Select value={formData.supervisor_id} onValueChange={v => setFormData({ ...formData, supervisor_id: v })}>
                                                    <SelectTrigger><SelectValue placeholder="Search" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">No Supervisor</SelectItem>
                                                        {masters.supervisors.map(s => (
                                                            <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                                    <h4 className="text-xl font-bold mb-6">Review</h4>
                                    <div className="space-y-3 text-xs font-medium">
                                        <div className="flex justify-between border-b border-white/20 pb-2"><span>NAME:</span><span>{formData.first_name} {formData.last_name}</span></div>
                                        <div className="flex justify-between border-b border-white/20 pb-2"><span>ROLE:</span><span>{formData.role.toUpperCase()}</span></div>
                                        <div className="flex justify-between border-b border-white/20 pb-2"><span>EMAIL:</span><span>{formData.email}</span></div>
                                    </div>
                                    <Button type="submit" disabled={loading} className="w-full mt-8 bg-white text-indigo-700 hover:bg-slate-100 h-12 rounded-xl font-bold">
                                        {loading ? "INITIALIZING..." : "CREATE USER"}
                                    </Button>
                                    <p className="text-[9px] mt-4 opacity-50 text-center leading-relaxed">By clicking create, you initialize the SSO account and link it to the CRM profile.</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="target">
                        <Card className="border-slate-200 shadow-sm rounded-[2rem] overflow-hidden">
                            <CardHeader className="bg-slate-50 p-8 border-b">
                                <CardTitle className="text-2xl font-black">Target Settings</CardTitle>
                                <CardDescription className="text-slate-500 font-medium">Configure performance benchmarks for this deployment cycle.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-2 gap-8 mb-8">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Type of Target *</Label>
                                        <Select value={formData.targetType} onValueChange={v => setFormData({ ...formData, targetType: v })}>
                                            <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Individual Target" /></SelectTrigger>
                                            <SelectContent><SelectItem value="individual">Individual Target</SelectItem><SelectItem value="team">Team Target</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Target Cycle *</Label>
                                        <Select value={formData.targetCycle} onValueChange={v => setFormData({ ...formData, targetCycle: v })}>
                                            <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Monthly" /></SelectTrigger>
                                            <SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="weekly">Weekly</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="border border-slate-100 rounded-[2rem] p-8 bg-slate-50/50">
                                    <h3 className="text-lg font-bold mb-4">Targets</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-2">
                                            {Object.keys(formData.targets).map(month => (
                                                <div key={month} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                                    <span className="text-sm font-bold text-slate-700">{month}</span>
                                                    <Input
                                                        type="number"
                                                        className="w-24 h-8 text-right font-bold"
                                                        placeholder="0"
                                                        value={(formData.targets as any)[month]}
                                                        onChange={e => setFormData({
                                                            ...formData,
                                                            targets: { ...formData.targets, [month]: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="hidden md:block">
                                            <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 h-full">
                                                <div className="text-center font-bold mb-4">January 2024</div>
                                                <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-slate-400">
                                                    <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
                                                </div>
                                                <div className="grid grid-cols-7 gap-2 mt-4">
                                                    {Array.from({ length: 31 }).map((_, i) => (
                                                        <div key={i} className={cn(
                                                            "h-8 flex items-center justify-center rounded-full font-bold text-xs transition-all",
                                                            i % 7 === 6 ? "bg-emerald-500 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"
                                                        )}>
                                                            {i + 1}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest text-center">Cycle Overview</p>
                                                    <p className="text-xs text-indigo-900/60 text-center mt-2 leading-relaxed font-medium">Configure specific milestones per month to track progress automatically.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-10 rounded-xl">
                                        {loading ? "SAVING..." : "CREATE USER & TARGETS"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </form>
        </div >
    )
}
