const fs = require('fs');
const path = require('path');

const DIST = path.join(process.cwd(), 'dist');
const PAGES = [
  'index.html',
  'produits.html',
  'products.html',
  'nouveautes.html',
  'references.html',
  'catalogue.html',
  'contact.html'
];

function escAttr(v = '') {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function humanizeImage(src = '') {
  const clean = String(src).split('?')[0].split('#')[0];
  const name = clean.split('/').pop().replace(/\.[a-z0-9]+$/i, '');
  if (!name) return 'MAGIC LIGHT';
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();
}

function ensureImageAlt(html) {
  html = html.replace(
    /(<a\b[^>]*class=["'][^"']*\brefitem[^"']*["'][^>]*>\s*)(<img\b[^>]*>)(\s*<div\b[^>]*class=["'][^"']*label[^"']*["'][^>]*>\s*<strong>([^<]+)<\/strong>)/gi,
    (all, before, img, after, label) => {
      if (/\salt\s*=/i.test(img)) return all;
      return before + img.replace(/>$/, ` alt="${escAttr(label.trim())}">`) + after;
    }
  );

  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (/\salt\s*=/i.test(tag)) return tag;
    const src = (tag.match(/\ssrc=["']([^"']+)["']/i) || [])[1] || '';
    let alt = humanizeImage(src);
    if (/logo/i.test(src)) alt = 'MAGIC LIGHT';
    return tag.replace(/>$/, ` alt="${escAttr(alt)}">`);
  });
}

function improveControls(html) {
  let dotIndex = 0;
  html = html.replace(/<button\b([^>]*)class=["']([^"']*\bdot\b[^"']*)["']([^>]*)>(\s*)<\/button>/gi,
    (all, a, cls, b, inner) => {
      dotIndex += 1;
      if (/aria-label\s*=/i.test(all)) return all;
      return `<button${a}class="${cls}"${b} aria-label="Afficher la diapositive ${dotIndex}" type="button">${inner}</button>`;
    });

  html = html.replace(/<button\b([^>]*)class=["']([^"']*\bclose\b[^"']*)["']([^>]*)>([\s\S]*?)<\/button>/gi,
    (all, a, cls, b, inner) => {
      if (/aria-label\s*=/i.test(all)) return all;
      return `<button${a}class="${cls}"${b} aria-label="Fermer" type="button">${inner}</button>`;
    });

  return html;
}

function improveSocialLinks(html) {
  html = html.replace(/<a([^>]*href=["'][^"']*facebook\.com[^"']*["'][^>]*)>\s*f\s*<\/a>/gi,
    '<a$1 aria-label="Facebook MAGIC LIGHT"><span aria-hidden="true">f</span><span class="sr-only">Facebook MAGIC LIGHT</span></a>');
  html = html.replace(/<a([^>]*href=["'][^"']*instagram\.com[^"']*["'][^>]*)>\s*ig\s*<\/a>/gi,
    '<a$1 aria-label="Instagram MAGIC LIGHT"><span aria-hidden="true">ig</span><span class="sr-only">Instagram MAGIC LIGHT</span></a>');
  return html;
}

function improveBlankTargets(html) {
  return html.replace(/<a\b[^>]*target=["']_blank["'][^>]*>/gi, (tag) => {
    if (/\srel\s*=/i.test(tag)) return tag;
    return tag.replace(/>$/, ' rel="noopener noreferrer">');
  });
}

function injectA11yStyles(html) {
  if (html.includes('data-magic-quality-styles')) return html;
  const css = `\n<style data-magic-quality-styles>\n` +
    `.sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}\n` +
    `.kicker,.see,.admin-price{color:#76551a!important}\n` +
    `.ref{color:#5f6670!important}\n` +
    `.lang small{color:#5f6670!important}\n` +
    `.social-mini a{min-width:44px!important;min-height:44px!important}\n` +
    `.smallbtn{min-height:44px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important}\n` +
    `.dot{position:relative!important;width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;padding:0!important;border:0!important;border-radius:50%!important;background:transparent!important;transform:none!important;display:grid!important;place-items:center!important}\n` +
    `.dot::after{content:"";display:block;width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.42);transition:transform .2s ease,background .2s ease}\n` +
    `.dot.active::after{background:var(--gold2)!important;transform:scale(1.2)}\n` +
    `.dots{gap:0!important;bottom:8px!important}\n` +
    `.social-mini a:focus-visible,.btn:focus-visible,.smallbtn:focus-visible,.menu:focus-visible,.dot:focus-visible,.close:focus-visible{outline:3px solid #76551a!important;outline-offset:3px!important}\n` +
    `@media(max-width:900px){.hero-copy{bottom:88px!important}.hero-buttons{gap:12px!important}.hero-buttons .btn{min-height:48px!important;padding:0 20px!important}.dots{bottom:8px!important}}\n` +
    `@media(max-width:620px){` +
      `html.ml-mobile-device .grid,html.ml-mobile-device #adminProductsGrid,html.ml-mobile-device .products-grid,html.ml-mobile-device .product-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important}` +
      `html.ml-mobile-device .card{align-self:start!important;overflow:hidden!important;border-radius:11px!important}` +
      `html.ml-mobile-device .card img{display:block!important;width:100%!important;height:auto!important;max-height:none!important;aspect-ratio:auto!important;object-fit:contain!important;object-position:center!important;background:#fff!important}` +
      `html.ml-mobile-device .card .body{padding:7px!important}` +
      `html.ml-mobile-device .card h3{min-height:2.35em!important;font-size:.72rem!important;line-height:1.18!important;margin:5px 0 3px!important}` +
      `html.ml-mobile-device .card .ref{font-size:.58rem!important}` +
      `html.ml-mobile-device .card .badge{font-size:.56rem!important;padding:3px 5px!important}` +
      `html.ml-mobile-device .card .actions{gap:4px!important;margin-top:6px!important}` +
      `html.ml-mobile-device .card .actions .smallbtn{min-height:30px!important;padding:5px 3px!important;font-size:.56rem!important;line-height:1.05!important;border-radius:8px!important}` +
      `html.ml-mobile-device .admin-price{font-size:.72rem!important;line-height:1.1!important;margin-top:4px!important}` +
    `}\n` +
    `@media(max-width:330px){` +
      `html.ml-mobile-device .grid,html.ml-mobile-device #adminProductsGrid,html.ml-mobile-device .products-grid,html.ml-mobile-device .product-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}` +
      `html.ml-mobile-device .card h3{font-size:.74rem!important}` +
    `}\n` +
    `</style>\n`;
  return html.replace(/<\/head>/i, css + '</head>');
}

function improveHomeSemantics(html) {
  html = improveSocialLinks(html);
  html = improveControls(html);
  return html;
}

let changed = 0;
for (const rel of PAGES) {
  const file = path.join(DIST, rel);
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  html = ensureImageAlt(html);
  html = improveBlankTargets(html);
  html = injectA11yStyles(html);
  if (rel === 'index.html') html = improveHomeSemantics(html);
  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
    changed += 1;
  }
}

console.log(`MAGIC LIGHT quality: ${changed} public page(s) improved for accessibility/SEO and mobile tap targets.`);
