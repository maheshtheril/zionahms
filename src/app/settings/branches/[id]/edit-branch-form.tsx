
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save, X, Building2, MapPin, Phone, MessageSquare } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { updateBranch } from '@/app/actions/settings'

export default function EditBranchForm({ branch }: { branch: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: branch.name || '',
        code: branch.code || '',
        type: branch.type || 'office',
        phone: branch.phone || '',
        email: branch.email || '',
        address: branch.address || '',
        is_active: branch.is_active ?? true,
        metadata: branch.metadata || {}
    })

    const handleMetadataChange = (key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            metadata: {
                ...prev.metadata,
                geofence: {
                    ...(prev.metadata?.geofence || {}),
                    [key]: value
                }
            }
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const result = await updateBranch(branch.id, formData)

        if (result.success) {
            toast({
                title: "Branch updated",
                description: `${formData.name} settings have been saved.`,
            })
            router.push('/settings/branches')
            router.refresh()
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.error || "Failed to update branch"
            })
        }
        setLoading(false)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <header className="flex items-center justify-between border-b pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Branch</h1>
                            <Badge variant={formData.is_active ? "success" : "secondary"}>
                                {formData.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <p className="text-slate-500">Modify configuration and contact details for {branch.name}.</p>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="bg-slate-50/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-indigo-600" />
                                Branch Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Branch Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Short Code</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Location Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={v => setFormData({ ...formData, type: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="office">Office / Corporate</SelectItem>
                                            <SelectItem value="warehouse">Warehouse / Lab</SelectItem>
                                            <SelectItem value="clinic">Clinic / Retail</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between border-t mt-4">
                                <div className="space-y-0.5">
                                    <Label>Active Status</Label>
                                    <p className="text-xs text-slate-500">Disable this to prevent users from selecting this branch.</p>
                                </div>
                                <Switch
                                    checked={formData.is_active}
                                    onCheckedChange={(v: boolean) => setFormData({ ...formData, is_active: v })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="bg-slate-50/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-indigo-600" />
                                Location & Contact
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="address">Physical Address</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Contact Phone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Public Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="bg-slate-50/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-emerald-600" />
                                Geofenced Attendance
                            </CardTitle>
                            <CardDescription>Restrict employee check-ins to a specific GPS radius around this branch.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="geo_lat">Latitude</Label>
                                    <Input
                                        id="geo_lat"
                                        type="number"
                                        step="any"
                                        placeholder="e.g. 12.9716"
                                        value={formData.metadata?.geofence?.lat || ''}
                                        onChange={e => handleMetadataChange('lat', parseFloat(e.target.value) || null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="geo_lng">Longitude</Label>
                                    <Input
                                        id="geo_lng"
                                        type="number"
                                        step="any"
                                        placeholder="e.g. 77.5946"
                                        value={formData.metadata?.geofence?.lng || ''}
                                        onChange={e => handleMetadataChange('lng', parseFloat(e.target.value) || null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="geo_radius">Allowed Radius (Meters)</Label>
                                    <Input
                                        id="geo_radius"
                                        type="number"
                                        placeholder="e.g. 50"
                                        value={formData.metadata?.geofence?.radius_meters || ''}
                                        onChange={e => handleMetadataChange('radius_meters', parseInt(e.target.value) || null)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-0 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Save className="h-32 w-32" />
                        </div>
                        <CardHeader>
                            <CardTitle>Save Changes</CardTitle>
                            <CardDescription className="text-slate-400">Apply updates to all users in this branch.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                            <Button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Branch"}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full text-slate-300 hover:text-white hover:bg-white/10"
                                onClick={() => router.back()}
                            >
                                Discard Changes
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-xs text-amber-800 leading-relaxed flex gap-3">
                        <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                            <strong>Note:</strong> Changing the branch code may affect legacy report filtering. Please use caution when updating codes for active locations.
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
