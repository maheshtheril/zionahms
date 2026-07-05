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
        } else if (file.endsWith('page.tsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk('c:/2035-HMS/SAAS_ERP/src/app');

let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix signature with { params } destructured
    if (content.match(/export default async function \w+\(\{\s*params\s*\}\s*:\s*\{.*?\}\)/s)) {
        content = content.replace(/(export default async function \w+)\(\{\s*params\s*\}\s*:\s*\{.*?\}\)\s*\{/, (match, p1) => {
            return `${p1}(props: { params: Promise<any> }) {\n    const params = await props.params;`;
        });
    } else if (content.match(/export default async function \w+\(\{\s*params\s*\}\s*:\s*\w+\)/s)) {
        content = content.replace(/(export default async function \w+)\(\{\s*params\s*\}\s*:\s*\w+\)\s*\{/, (match, p1) => {
            return `${p1}(props: { params: Promise<any> }) {\n    const params = await props.params;`;
        });
    }

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
        count++;
    }
});

console.log(`Total files updated: ${count}`);
