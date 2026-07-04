import { getMenuItems } from './src/app/actions/navigation';
import fs from 'fs';

async function main() {
    // mock global auth
    global.window = {} as any;
    const items = await getMenuItems();
    fs.writeFileSync('c:/2035-HMS/SAAS_ERP/computed-menus.json', JSON.stringify(items, null, 2));
    console.log("Written computed menus.");
}
main().catch(console.error);
