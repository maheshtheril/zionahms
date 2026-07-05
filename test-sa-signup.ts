import { signup } from './src/app/actions/auth';
import { prisma } from './src/lib/prisma';

async function testSignup() {
    console.log('Testing SA signup...');
    
    // Find SA country ID
    const sa = await prisma.countries.findFirst({ where: { iso2: 'SA' }});
    if (!sa) {
        console.error('SA country not found!');
        return;
    }

    const formData = new FormData();
    formData.append('email', 'sa_tax_test_' + Date.now() + '@example.com');
    formData.append('password', 'password123');
    formData.append('name', 'SA Tax User');
    formData.append('companyName', 'SA Tax Company');
    formData.append('countryId', sa.id); 
    formData.append('currencyId', 'SAR');

    try {
        const result = await signup(null, formData);
        console.log('Signup result:', result);
    } catch(err) {
        console.error('Signup error:', err);
    }
}

testSignup().finally(() => prisma.$disconnect());
