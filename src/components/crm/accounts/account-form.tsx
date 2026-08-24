
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAccount } from '@/app/actions/crm/accounts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from "sonner"
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function AccountForm() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        const res = await createAccount(formData)

        setLoading(false)

        if (res.error) {
            toast.error("Error", { description: res.error })
        } else {
            toast.success("Success", { description: "Account created successfully." })
            router.push('/crm/accounts')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/crm/accounts" className="text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">New Account</h1>
            </div>

            <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle>Organization Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Account Name <span className="text-red-500">*</span></Label>
                        <Input id="name" name="name" required placeholder="Acme Inc." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="industry">Industry</Label>
                            <Input id="industry" name="industry" placeholder="Software" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input id="website" name="website" type="url" placeholder="https://example.com" />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-100">
                    <Link href="/crm/accounts">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={loading} className="min-w-[120px]">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}
