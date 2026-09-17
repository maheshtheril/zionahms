
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime())
        });
    } catch (error: any) {
        return NextResponse.json({
            status: "unhealthy",
            timestamp: new Date().toISOString()
        }, { status: 503 });
    }
}
