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
    let original = content;

    // 1. Fix JSX double currencies: `${currencySymbol}` -> `{currencySymbol}`
    // But be careful not to break template literals!
    // In template literals, it's `${currencySymbol}` which is valid interpolation.
    // How to distinguish JSX text from template literals?
    // JSX text `${currencySymbol}` has a literal `$`.
    // Let's look for `> $ {currencySymbol}` or something? No, it's usually `${currencySymbol}{amount}`
    
    // Instead of regex, let's just do targeted replacements based on the exact string patterns we know are wrong.
    // e.g. `$${currencySymbol}` in template literals
    content = content.replace(/\$\$\{currencySymbol\}/g, '${currencySymbol}');

    // e.g. `> ${currencySymbol}` or ` ${currencySymbol}` or `"${currencySymbol}` which are JSX text
    // Actually, in JSX it's written as ` ${currencySymbol}{` or `>${currencySymbol}{` or `${currencySymbol}{`
    // Let's replace `\$\{currencySymbol\}\{` with `{currencySymbol}{`
    content = content.replace(/\$\{currencySymbol\}\{/g, '{currencySymbol}{');
    
    // Let's replace `\$\{currencySymbol\}` with `{currencySymbol}` ONLY IF it's not preceded by a backtick or a `$`
    // Wait, regex lookbehind:
    content = content.replace(/(?<![`$])\$\{currencySymbol\}/g, '{currencySymbol}');

    // Also fix `$"${currencySymbol}"` to `"${currencySymbol}"`
    content = content.replace(/\$"\$\{currencySymbol\}"/g, '"${currencySymbol}"');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Fixed:', file);
        count++;
    }
});
console.log('Total files fixed:', count);
