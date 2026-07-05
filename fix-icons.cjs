const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk('c:/2035-HMS/SAAS_ERP/src');
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('IndianRupee')) {
        let newContent = content.replace(/IndianRupee/g, 'Banknote');
        
        // Fix double Banknote imports if they happen
        newContent = newContent.replace(/Banknote,\s*Banknote/g, 'Banknote');
        newContent = newContent.replace(/Banknote\s*,\s*Banknote/g, 'Banknote');
        
        // One more pass just in case
        const importMatch = newContent.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/);
        if (importMatch) {
            const imports = importMatch[1].split(',').map(s => s.trim()).filter(Boolean);
            const uniqueImports = [...new Set(imports)];
            newContent = newContent.replace(importMatch[0], `import { ${uniqueImports.join(', ')} } from "lucide-react"`);
        }

        if (newContent !== content) {
            fs.writeFileSync(file, newContent);
            console.log('Fixed:', file);
            count++;
        }
    }
});
console.log('Total files fixed:', count);
