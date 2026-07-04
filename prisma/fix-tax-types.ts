import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Starting Tax Types Data Migration...');
    
    // 1. Create or Find Core Tax Regimes
    const genericNames = ['GST', 'VAT', 'Sales Tax'];
    const genericTypes = {};
    
    for (const name of genericNames) {
        let type = await prisma.tax_types.findUnique({ where: { name } });
        if (!type) {
            type = await prisma.tax_types.create({
                data: {
                    name,
                    description: ${name} Regime,
                    is_active: true
                }
            });
            console.log(Created generic tax type: );
        } else {
            console.log(Found generic tax type: );
        }
        genericTypes[name] = type;
    }

    // 2. Map existing Tax Rates to new Regimes
    const allRates = await prisma.tax_rates.findMany({ include: { tax_types: true } });
    
    for (const rate of allRates) {
        const typeName = rate.tax_types.name.toUpperCase();
        let targetType = null;
        
        if (typeName.includes('GST') || rate.name.toUpperCase().includes('GST')) {
            targetType = genericTypes['GST'];
        } else if (typeName.includes('VAT') || rate.name.toUpperCase().includes('VAT')) {
            targetType = genericTypes['VAT'];
        } else if (typeName.includes('SALES') || rate.name.toUpperCase().includes('SALES')) {
            targetType = genericTypes['Sales Tax'];
        }

        if (targetType && rate.tax_type_id !== targetType.id) {
            await prisma.tax_rates.update({
                where: { id: rate.id },
                data: { tax_type_id: targetType.id }
            });
            console.log(Re-mapped tax rate '' to regime '');
        }
    }

    // 3. Re-map Company Settings
    const companySettings = await prisma.company_settings.findMany({ where: { default_tax_type_id: { not: null } }, include: { tax_types: true } });
    for (const setting of companySettings) {
        if (setting.tax_types) {
            const typeName = setting.tax_types.name.toUpperCase();
            let targetType = null;
            if (typeName.includes('GST')) targetType = genericTypes['GST'];
            else if (typeName.includes('VAT')) targetType = genericTypes['VAT'];
            else if (typeName.includes('SALES')) targetType = genericTypes['Sales Tax'];

            if (targetType && setting.default_tax_type_id !== targetType.id) {
                await prisma.company_settings.update({
                    where: { company_id: setting.company_id },
                    data: { default_tax_type_id: targetType.id }
                });
                console.log(Re-mapped company '' default tax system to '');
            }
        }
    }

    // 4. Clean up bad Tax Types (GST_*, VAT_*)
    const allTypes = await prisma.tax_types.findMany();
    for (const type of allTypes) {
        if (!genericNames.includes(type.name)) {
            // Delete if not a core regime
            try {
                await prisma.tax_types.delete({ where: { id: type.id } });
                console.log(Deleted incorrect tax type: );
            } catch (e) {
                console.log(Could not delete tax type  (might be referenced elsewhere): );
            }
        }
    }

    console.log('Migration Complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.\$disconnect();
  });
