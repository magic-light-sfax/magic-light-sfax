const fs = require('fs');
const path = require('path');

const dist = path.join(process.cwd(), 'dist');
const publicPages = [
  'index.html',
  'produits.html',
  'products.html',
  'nouveautes.html',
  'references.html',
  'catalogue.html',
  'contact.html'
];

function addAttr(tag, name, value) {
  const re = new RegExp(`\\s${name}\\s*=`, 'i');
  if (re.test(tag)) return tag;
  return tag.replace(/\s*\/?\s*>$/, (end) => ` ${name}="${value}"${end}`);
}

function optimizeImages(html) {
  let seen = 0;
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    seen += 1;
    tag = addAttr(tag, 'decoding', 'async');

    const isLikelyCritical = seen <= 2 || /class\s*=\s*["'][^"']*logo/i.test(tag) || /data-eager/i.test(tag);
    if (isLikelyCritical) {
      tag = addAttr(tag, 'loading', 'eager');
      tag = addAttr(tag, 'fetchpriority', 'high');
    } else {
      tag = addAttr(tag, 'loading', 'lazy');
      tag = addAttr(tag, 'fetchpriority', 'low');
    }
    return tag;
  });
}

function optimizeIframes(html) {
  return html.replace(/<iframe\b[^>]*>/gi, (tag) => addAttr(tag, 'loading', 'lazy'));
}

function injectHeadHints(html) {
  if (!html.includes('data-magic-performance-hints')) {
    const hints = [
      '<!-- MAGIC LIGHT performance hints -->',
      '<link data-magic-performance-hints rel="dns-prefetch" href="//www.googletagmanager.com">',
      '<link rel="dns-prefetch" href="//connect.facebook.net">'
    ].join('\n');
    html = html.replace(/<\/head>/i, `${hints}\n</head>`);
  }
  return html;
}

function injectRuntime(html) {
  if (html.includes('/assets/performance.js')) return html;
  const tag = '<script src="/assets/performance.js" defer></script>';
  return html.replace(/<\/body>/i, `${tag}\n</body>`);
}

let changed = 0;
for (const rel of publicPages) {
  const file = path.join(dist, rel);
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  html = optimizeImages(html);
  html = optimizeIframes(html);
  html = injectHeadHints(html);
  html = injectRuntime(html);
  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
    changed += 1;
  }
}

console.log(`MAGIC LIGHT performance: ${changed} public page(s) optimized.`);
