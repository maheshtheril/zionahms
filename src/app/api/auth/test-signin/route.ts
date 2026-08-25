import { NextResponse } from "next/server"
import { signIn } from "@/auth"

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const result = await signIn("credentials", {
            email: "maheshtheril@live.com",
            password: "Admin@12345",
            redirect: false
        })

        return NextResponse.json({
            success: true,
            result
        })
    } catch (e: any) {
        return NextResponse.json({
            success: false,
            errorName: e?.name,
            errorMessage: e?.message,
            errorType: e?.type,
            errorStack: e?.stack,
            errorDigest: e?.digest,
            allKeys: Object.keys(e || {})
        }, { status: 500 })
    }
}
