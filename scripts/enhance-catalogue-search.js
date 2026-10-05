const fs = require('fs');
const path = require('path');

const styles = [
  'assets/catalogue-search-pro.css',
  'assets/catalogue-filters-pro.css',
  'assets/catalogue-favorites.css',
  'assets/catalogue-compare.css',
  'assets/catalogue-360.css'
];
const scripts = [
  'assets/catalogue-search-pro.js',
  'assets/catalogue-filters-pro.js',
  'assets/catalogue-favorites.js',
  'assets/catalogue-compare.js',
  'assets/catalogue-360.js'
];

function enhance(file){
  if (!fs.existsSync(file)) return false;
  let html = fs.readFileSync(file, 'utf8');
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
  return true;
}

const dist=path.join(process.cwd(),'dist');
const targets=['produits.html','products.html'].map(name=>path.join(dist,name));
let count=0;
for(const file of targets) if(enhance(file)) count++;
if(!count){
  console.error('Catalogue enhancement failed: no product page found in dist');
  process.exit(1);
}
console.log(`MAGIC LIGHT catalogue: enhanced ${count} product page(s) — search + filters + favorites + comparison + 360 ON`);
