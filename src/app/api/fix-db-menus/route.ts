import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        // 1. Move HMS Dashboard to Top
        const hmsDash = await prisma.menu_items.findFirst({
            where: { key: 'hms-dashboard' }
        })
        
        if (hmsDash) {
            await prisma.menu_items.update({
                where: { id: hmsDash.id },
                data: { sort_order: 1 } // ensure it's at the top
            })
        }

        // 2. Insert POS Menu Item under Pharmacy
        const pharmacyParent = await prisma.menu_items.findFirst({
            where: { key: 'inv-pharmacy' }
        })
        const invParent = await prisma.menu_items.findFirst({
            where: { key: 'inv-dashboard' }
        })
        
        const parent = pharmacyParent?.parent_id || invParent?.parent_id
        
        if (parent) {
            const existingPos = await prisma.menu_items.findFirst({
                where: { key: 'inv-pos' }
            })

            if (!existingPos) {
                await prisma.menu_items.create({
                    data: {
                        parent_id: parent,
                        module_key: 'inventory',
                        key: 'inv-pos',
                        label: 'POS Terminal',
                        icon: 'MonitorSmartphone',
                        url: '/hms/pharmacy/pos',
                        sort_order: 10,
                        permission_code: 'pharmacy:view',
                        is_global: true
                    }
                })
            }
        }

        return NextResponse.json({ success: true, parent })
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message })
    }
}
