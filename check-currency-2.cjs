const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.app_user.findFirst({
        orderBy: { created_at: 'desc' }
    });
    console.log('User:', user?.email, user?.company_id);
    
    if (user?.company_id) {
        const company = await prisma.company.findUnique({
            where: { id: user.company_id },
            include: { company_settings: { include: { currencies: true } } }
        });
        console.log('Company Currency:', company?.company_settings?.currencies);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
