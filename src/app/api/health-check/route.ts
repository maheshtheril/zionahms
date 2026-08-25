import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const userCount = await prisma.app_user.count()
        const user = await prisma.app_user.findFirst({
            where: { email: 'maheshtheril@live.com' },
            select: { id: true, email: true, is_active: true }
        })

        return NextResponse.json({
            status: "OK",
            databaseConnected: true,
            hasAuthSecret: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
            totalUsers: userCount,
            foundMahesh: !!user,
            maheshDetails: user,
            nodeEnv: process.env.NODE_ENV
        })
    } catch (e: any) {
        return NextResponse.json({
            status: "ERROR",
            error: e.message,
            stack: e.stack
        }, { status: 500 })
    }
}
