'use client'

import { seedRolesAndPermissions } from "@/app/actions/rbac"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Sparkles } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function SeedRolesButton() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSeed = async () => {
        setLoading(true)
        try {
            const result = await seedRolesAndPermissions()

            if ('error' in result) {
                toast.error("Error", { description: result.error })
            } else {
                toast.success("Success", { description: result.message })
                router.refresh()
            }
        } catch (error) {
            toast.error("Error", { description: "Failed to seed roles" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleSeed}
            disabled={loading}
            className="relative group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/60 transition-all duration-300 border-0"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur" />
            {loading ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Seeding...
                </>
            ) : (
                <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Load Standard Roles
                </>
            )}
        </Button>
    )
}
