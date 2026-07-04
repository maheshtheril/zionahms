import { prisma } from '../src/lib/prisma';

async function main() {
    console.log("Starting Storage Location Migration...");
    
    // Fetch all products that have metadata
    const products = await prisma.hms_product.findMany({
        where: {
            metadata: {
                not: "{}"
            }
        },
        select: {
            id: true,
            tenant_id: true,
            company_id: true,
            metadata: true
        }
    });

    console.log(`Found ${products.length} products to evaluate.`);
    
    let migratedCount = 0;

    for (const p of products) {
        const metadata: any = p.metadata;
        if (!metadata || !metadata.storageLocation) continue;
        
        const loc = metadata.storageLocation;
        let locZone = '';
        let locRack = '';
        let locShelf = '';
        
        if (loc.includes(' | ')) {
            const parts = loc.split(' | ');
            locZone = parts[0]?.replace('Zone: ', '') || '';
            locRack = parts[1]?.replace('Rack: ', '') || '';
            locShelf = parts[2]?.replace('Shelf: ', '') || '';
        } else {
            locZone = loc;
        }
        
        if (!locZone && !locRack && !locShelf) continue;
        
        console.log(`Migrating Product ${p.id} - Zone: ${locZone}, Rack: ${locRack}, Shelf: ${locShelf}`);
        
        let parentId: string | null = null;
        
        // 1. Zone
        if (locZone) {
            let zone = await prisma.hms_storage_locations.findFirst({
                where: { name: locZone, type: 'ZONE', company_id: p.company_id }
            });
            if (!zone) {
                zone = await prisma.hms_storage_locations.create({
                    data: {
                        tenant_id: p.tenant_id,
                        company_id: p.company_id,
                        name: locZone,
                        type: 'ZONE'
                    }
                });
            }
            parentId = zone.id;
        }
        
        // 2. Rack
        if (locRack) {
            let rack = await prisma.hms_storage_locations.findFirst({
                where: { name: locRack, type: 'RACK', parent_id: parentId, company_id: p.company_id }
            });
            if (!rack) {
                rack = await prisma.hms_storage_locations.create({
                    data: {
                        tenant_id: p.tenant_id,
                        company_id: p.company_id,
                        name: locRack,
                        type: 'RACK',
                        parent_id: parentId
                    }
                });
            }
            parentId = rack.id;
        }
        
        // 3. Shelf
        if (locShelf) {
            let shelf = await prisma.hms_storage_locations.findFirst({
                where: { name: locShelf, type: 'SHELF', parent_id: parentId, company_id: p.company_id }
            });
            if (!shelf) {
                shelf = await prisma.hms_storage_locations.create({
                    data: {
                        tenant_id: p.tenant_id,
                        company_id: p.company_id,
                        name: locShelf,
                        type: 'SHELF',
                        parent_id: parentId
                    }
                });
            }
            parentId = shelf.id;
        }
        
        if (parentId) {
            // Check if link exists
            const existingLink = await prisma.hms_product_storage_link.findFirst({
                where: { product_id: p.id, location_id: parentId }
            });
            
            if (!existingLink) {
                await prisma.hms_product_storage_link.create({
                    data: {
                        product_id: p.id,
                        location_id: parentId,
                        is_primary: true
                    }
                });
            }
            migratedCount++;
        }
    }
    
    console.log(`Migration Complete. Migrated ${migratedCount} products.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
