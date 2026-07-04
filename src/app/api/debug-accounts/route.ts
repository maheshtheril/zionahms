import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const groups = await prisma.accounts.findMany({ where: { is_group: true } });
    return NextResponse.json(groups);
}
