import { NextResponse, NextRequest } from "next/server"
import { auth } from "@/auth"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        const cookieList = req.cookies.getAll()

        return NextResponse.json({
            hasSession: !!session,
            sessionUser: session?.user || null,
            cookiesFound: cookieList.map(c => ({ name: c.name, hasValue: !!c.value, length: c.value.length })),
            url: req.url,
            headers: {
                host: req.headers.get("host"),
                origin: req.headers.get("origin"),
                userAgent: req.headers.get("user-agent")
            }
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
    }
}
