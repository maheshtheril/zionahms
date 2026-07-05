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
    const isClient = content.includes('use client') || content.includes('use client;') || content.includes('\'use client\'') || content.includes('\"use client\"');
    
    if (!isClient && content.includes('useLocalization')) {
        let newContent = content;
        // Remove import
        newContent = newContent.replace(/import\s+\{\s*useLocalization\s*\}\s+from\s+["']@\/contexts\/localization-context["'];?\r?\n?/g, '');
        
        // Replace destructuring
        newContent = newContent.replace(/const\s+\{\s*currencySymbol\s*\}\s*=\s*useLocalization\(\);\s*\r?\n?/g, '');

        // Replace any remaining currencySymbol with fallback if it's used as a fallback itself
        newContent = newContent.replace(/\|\|\s*currencySymbol/g, '|| "$"');
        
        // Also if currencySymbol is used standalone, replace it with '"$"'
        // This is a naive replace, but we only have a few cases
        newContent = newContent.replace(/currencySymbol/g, '"$"');

        // But wait! We might have just replaced currencySymbol in `session?.user?.currencySymbol`!
        // Let's revert `session?.user?.currencySymbol`
        newContent = newContent.replace(/session\?\.user\?\."\$"/g, 'session?.user?.currencySymbol');
        
        if (newContent !== content) {
            fs.writeFileSync(file, newContent);
            console.log('Fixed:', file);
            count++;
        }
    }
});
console.log('Total fixed:', count);
