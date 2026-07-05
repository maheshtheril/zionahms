import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const all = await prisma.currencies.findMany();
        return NextResponse.json(all);
    } catch (e) {
        return NextResponse.json({ error: String(e) });
    }
}
