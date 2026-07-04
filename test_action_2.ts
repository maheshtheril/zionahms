import { updateProduct } from './src/app/actions/inventory';

async function run() {
  const fd = new FormData();
  fd.append("id", "86aaa43b-e219-4416-9318-80fcf3d94430");
  fd.append("name", "General Consultation");
  fd.append("sku", "CONS-001");
  fd.append("taxRateId", "40d5325b-82df-4dae-a94a-fa4d0950de97");
  // Some valid existing category ID just in case
  
  // mock session? 
  // Next.js server actions using auth() outside of Next.js runtime will FAIL!
}

run();
