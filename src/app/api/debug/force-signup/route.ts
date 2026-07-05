import { NextResponse } from 'next/server';
import { signup } from '@/app/actions/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;

  const required = ['email', 'password', 'name', 'companyName'];
  const formData = new FormData();
  for (const key of required) {
    const val = params.get(key);
    if (!val) return NextResponse.json({ error: `Missing ${key}` }, { status: 400 });
    formData.append(key, val);
  }

  const optional = ['countryId', 'currencyId', 'industry', 'modules', 'address', 'phone', 'taxId'];
  for (const key of optional) {
    const val = params.get(key);
    if (val) formData.append(key, val);
  }

  // Call the server action directly.
  const result = await signup(null, formData);
  return NextResponse.json(result);
}
