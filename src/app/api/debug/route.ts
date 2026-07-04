import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const users = await prisma.app_user.findMany({
            where: { email: { contains: 'shamsu', mode: 'insensitive' } },
            include: { company: true }
        });
        
        const results = [];
        for (const u of users) {
            let taxes = [];
            if (u.company_id) {
                const maps = await prisma.company_tax_maps.findMany({
                    where: { company_id: u.company_id },
                    include: { tax_rates: true }
                });
                taxes = maps.map(m => m.tax_rates.name);
            }
            results.push({ email: u.email, company: u.company?.name, taxes });
        }
        
        // Let's also print DATABASE_URL safely (just the host) to know what Vercel uses
        const dbUrl = process.env.DATABASE_URL || '';
        const hostMatch = dbUrl.match(/@([^\/]+)/);
        const host = hostMatch ? hostMatch[1] : 'unknown';

        return NextResponse.json({ success: true, host, results });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
