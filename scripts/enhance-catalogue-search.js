const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'dist', 'produits.html');
if (!fs.existsSync(file)) {
  console.error('Catalogue enhancement failed: dist/produits.html not found');
  process.exit(1);
}

let html = fs.readFileSync(file, 'utf8');

const styles = [
  'assets/catalogue-search-pro.css',
  'assets/catalogue-filters-pro.css'
];
const scripts = [
  'assets/catalogue-search-pro.js',
  'assets/catalogue-filters-pro.js'
];

for (const href of styles) {
  if (!html.includes(href)) {
    html = html.replace(/<\/head>/i, `  <link rel="stylesheet" href="${href}">\n</head>`);
  }
}
for (const src of scripts) {
  if (!html.includes(src)) {
    html = html.replace(/<\/body>/i, `  <script src="${src}" defer></script>\n</body>`);
  }
}

fs.writeFileSync(file, html, 'utf8');
console.log('MAGIC LIGHT catalogue: professional search + advanced filters ON');
