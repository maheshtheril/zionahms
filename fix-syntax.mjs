import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (file.endsWith('.tsx') && !file.includes('scratch')) {
            results.push(fullPath);
        }
    });
    return results;
}
const files = walk('c:/2035-HMS/SAAS_ERP/src');
let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('."$"')) {
        let newContent = content.replace(/\."\$"/g, '.currencySymbol');
        if (newContent !== content) {
            fs.writeFileSync(file, newContent);
            console.log('Fixed:', file);
            count++;
        }
    }
});
console.log('Total fixed syntax errors:', count);
