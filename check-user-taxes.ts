import { prisma } from './src/lib/prisma';
async function main() {
    const users = await prisma.app_user.findMany({
        orderBy: { created_at: 'desc' },
        take: 20,
        select: { email: true, created_at: true }
    });
    console.log(users);
}
main().finally(() => prisma.$disconnect());
