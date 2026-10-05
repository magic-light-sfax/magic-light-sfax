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

function insertBeforeFirstClosingTag(html, tag, content){
  const re = new RegExp(`</${tag}>`, 'i');
  const match = re.exec(html);
  if(!match) throw new Error(`Missing </${tag}>`);
  return html.slice(0, match.index) + content + html.slice(match.index);
}

function insertBeforeLastClosingTag(html, tag, content){
  const lower = html.toLowerCase();
  const needle = `</${tag.toLowerCase()}>`;
  const index = lower.lastIndexOf(needle);
  if(index < 0) throw new Error(`Missing </${tag}>`);
  return html.slice(0, index) + content + html.slice(index);
}

function enhance(file){
  if (!fs.existsSync(file)) return false;
  let html = fs.readFileSync(file, 'utf8');

  for (const href of styles) {
    if (!html.includes(href)) {
      html = insertBeforeFirstClosingTag(
        html,
        'head',
        `  <link rel="stylesheet" href="${href}">\n`
      );
    }
  }

  // Important: produits.html contains literal </body></html> text inside the
  // print-window template string. Always inject before the LAST real </body>
  // or the browser will terminate the page script early and print JS as text.
  for (const src of scripts) {
    if (!html.includes(src)) {
      html = insertBeforeLastClosingTag(
        html,
        'body',
        `  <script src="${src}" defer></script>\n`
      );
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
