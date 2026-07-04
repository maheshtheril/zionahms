import { updateProduct } from './src/app/actions/inventory';
import { auth } from './src/lib/auth';

async function test() {
  const fd = new FormData();
  fd.append("id", "86aaa43b-e219-4416-9318-80fcf3d94430");
  fd.append("name", "General Consultation");
  fd.append("sku", "CONS-001");
  fd.append("taxRateId", "40d5325b-82df-4dae-a94a-fa4d0950de97");
  // dummy required fields
  
  const res = await updateProduct(fd);
  console.log(res);
}

test().catch(console.error);
