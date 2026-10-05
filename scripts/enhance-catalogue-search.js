const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'dist', 'produits.html');
if (!fs.existsSync(file)) {
  console.error('Catalogue enhancement failed: dist/produits.html not found');
  process.exit(1);
}

let html = fs.readFileSync(file, 'utf8');
const cssTag = '<link rel="stylesheet" href="assets/catalogue-search-pro.css">';
const jsTag = '<script src="assets/catalogue-search-pro.js" defer></script>';

if (!html.includes('catalogue-search-pro.css')) {
  html = html.replace(/<\/head>/i, `  ${cssTag}\n</head>`);
}
if (!html.includes('catalogue-search-pro.js')) {
  html = html.replace(/<\/body>/i, `  ${jsTag}\n</body>`);
}

fs.writeFileSync(file, html, 'utf8');
console.log('MAGIC LIGHT catalogue: professional search ON');
