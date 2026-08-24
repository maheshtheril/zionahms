'use client'

import { createPatientEmergency } from "@/app/actions/patient-emergency" // Explicit Import
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export function CreatePatientFormEmergency() {
    const router = useRouter()

    const [isPending, setIsPending] = useState(false)

    async function onSubmit(formData: FormData) {
        setIsPending(true)
        try {
            console.log("Submitting to Emergency Action...");
            const res = await createPatientEmergency(null, formData)
            console.log("Result:", res);

            if (res.error) {
                toast.error("Error", { description: res.error })
            } else if (res.success) {
                toast.success("Success", { description: "Patient registered (Invoice Skipped)." })
                // Redirect to confirm
                window.location.href = `/hms/patients/${res.data.id}`
            }
        } catch (err: any) {
            toast.error("Crash", { description: err.message })
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Card className="p-6 max-w-2xl mx-auto mt-10 border-2 border-red-500">
            <h1 className="text-2xl font-bold text-red-600 mb-4">EMERGENCY REGISTRATION</h1>
            <p className="mb-4 text-sm text-slate-500">Use this form if standard registration is failing. Billing is disabled.</p>

            <form action={onSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input name="first_name" required placeholder="John" />
                    </div>
                    <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input name="last_name" placeholder="Doe" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input name="phone" required placeholder="9876543210" />
                    </div>
                    <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select name="gender" defaultValue="male">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" name="dob" />
                </div>

                <Input type="hidden" name="billing_mode" value="skip" />

                <Button type="submit" disabled={isPending} className="w-full bg-red-600 hover:bg-red-700 text-white">
                    {isPending ? "Forcing Registration..." : "Force Register Patient"}
                </Button>
            </form>
        </Card>
    )
}
