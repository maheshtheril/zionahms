import { signup } from './src/app/actions/auth';

async function testSignup() {
    console.log('Testing signup...');
    const formData = new FormData();
    formData.append('email', 'test_tax_insert_' + Date.now() + '@example.com');
    formData.append('password', 'password123');
    formData.append('name', 'Test Tax User');
    formData.append('companyName', 'Test Tax Company');
    formData.append('countryId', 'GB'); // UK
    formData.append('currencyId', 'GBP');

    const result = await signup(null, formData);
    console.log('Signup result:', result);
}

testSignup().catch(console.error);
