'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function getStorageLocationsTree() {
    const session = await auth();
    if (!session?.user) {
        return { error: "Unauthorized" };
    }

    try {
        // Fetch all active locations for the company
        const locations = await prisma.hms_storage_locations.findMany({
            where: {
                company_id: session.user.companyId,
                is_active: true
            },
            orderBy: { name: 'asc' }
        });

        // Build tree
        const zones = locations.filter(l => l.type === 'ZONE');
        const racks = locations.filter(l => l.type === 'RACK');
        const shelves = locations.filter(l => l.type === 'SHELF');
        const bins = locations.filter(l => l.type === 'BIN');

        const tree = zones.map(zone => {
            const zoneRacks = racks.filter(r => r.parent_id === zone.id).map(rack => {
                const rackShelves = shelves.filter(s => s.parent_id === rack.id).map(shelf => {
                    const shelfBins = bins.filter(b => b.parent_id === shelf.id);
                    return { ...shelf, children: shelfBins };
                });
                return { ...rack, children: rackShelves };
            });
            return { ...zone, children: zoneRacks };
        });

        return { 
            success: true, 
            tree,
            flat: { zones, racks, shelves, bins }
        };

    } catch (error) {
        console.error("Failed to fetch storage locations:", error);
        return { error: "Failed to fetch storage locations" };
    }
}

export async function getStorageLocationsFlat() {
    const session = await auth();
    if (!session?.user) {
        return { error: "Unauthorized", data: [] };
    }

    try {
        const locations = await prisma.hms_storage_locations.findMany({
            where: {
                company_id: session.user.companyId,
                is_active: true
            },
            orderBy: { name: 'asc' }
        });

        return { success: true, data: locations };
    } catch (error) {
        console.error("Failed to fetch storage locations:", error);
        return { error: "Failed to fetch storage locations", data: [] };
    }
}
