const fs = require('fs');
const path = require('path');

const DIST = path.join(process.cwd(), 'dist');
const SITE = 'https://magic-light-sfax.netlify.app';
const sitemapPath = path.join(DIST, 'sitemap.xml');
const productRoot = path.join(DIST, 'p');
const today = new Date().toISOString().slice(0, 10);

if (!fs.existsSync(sitemapPath)) {
  console.warn('Product sitemap: sitemap.xml introuvable.');
  process.exit(0);
}

let xml = fs.readFileSync(sitemapPath, 'utf8');
let added = 0;

if (fs.existsSync(productRoot)) {
  const dirs = fs.readdirSync(productRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  const entries = [];
  for (const dir of dirs) {
    const indexFile = path.join(productRoot, dir, 'index.html');
    if (!fs.existsSync(indexFile)) continue;
    const url = `${SITE}/p/${encodeURIComponent(dir)}/`;
    if (xml.includes(`<loc>${url}</loc>`)) continue;
    entries.push(`  <url><loc>${url}</loc><lastmod>${today}</lastmod></url>`);
    added++;
  }

  if (entries.length) {
    xml = xml.replace(/\s*<\/urlset>\s*$/i, `\n${entries.join('\n')}\n</urlset>\n`);
    fs.writeFileSync(sitemapPath, xml, 'utf8');
  }
}

console.log(`MAGIC LIGHT sitemap: ${added} page(s) produit ajoutée(s).`);
