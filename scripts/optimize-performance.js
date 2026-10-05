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

const homeHeroImages = new Set([
  'assets/lustre-anneau.png',
  'assets/fomsi-panel-led.png',
  'assets/fibre-optique.png',
  'assets/eclairage-escalier-auto.png',
  'assets/ruban-rgb-neon.png',
  'assets/suspension-moderne.png'
]);

function addAttr(tag, name, value) {
  const re = new RegExp(`\\s${name}\\s*=`, 'i');
  if (re.test(tag)) return tag;
  return tag.replace(/\s*\/?\s*>$/, (end) => ` ${name}="${value}"${end}`);
}

function setAttr(tag, name, value) {
  const re = new RegExp(`(\\s${name}\\s*=\\s*)(["'])[^"']*\\2`, 'i');
  if (re.test(tag)) {
    return tag.replace(re, (_m, prefix) => `${prefix}"${value}"`);
  }
  return addAttr(tag, name, value);
}

function netlifyImageUrl(src, width) {
  let clean = String(src || '').trim().replace(/^\.\//, '');
  if (!clean.startsWith('/')) clean = '/' + clean;
  return `/.netlify/images?url=${encodeURIComponent(clean)}&w=${width}&fm=webp`;
}

function localRasterSource(tag) {
  const match = tag.match(/\ssrc\s*=\s*["']([^"']+)["']/i);
  if (!match) return '';
  const src = match[1].trim();
  if (!/^(?:\.\/|\/)?assets\/.+\.(?:png|jpe?g)$/i.test(src)) return '';
  return src.replace(/^\.\//, '').replace(/^\//, '');
}

function responsiveImage(tag, src, widths, sizes) {
  const maxWidth = widths[widths.length - 1];
  tag = setAttr(tag, 'src', netlifyImageUrl(src, maxWidth));
  tag = setAttr(
    tag,
    'srcset',
    widths.map((w) => `${netlifyImageUrl(src, w)} ${w}w`).join(', ')
  );
  tag = setAttr(tag, 'sizes', sizes);
  return tag;
}

function optimizeImages(html, rel) {
  let seen = 0;
  let homeHeroSeen = 0;

  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    seen += 1;
    tag = addAttr(tag, 'decoding', 'async');

    const source = localRasterSource(tag);
    const isHomeHero = rel === 'index.html' && source && homeHeroImages.has(source) && homeHeroSeen < 6;
    if (isHomeHero) homeHeroSeen += 1;

    const isFirstHero = isHomeHero && homeHeroSeen === 1;
    const isLogo = /(?:^|\/)logo\.jpe?g$/i.test(source);
    const isQr = /(?:^|\/)[^/]*-qr\.jpe?g$/i.test(source);
    const isLikelyCritical = isFirstHero || seen <= 2 || /class\s*=\s*["'][^"']*logo/i.test(tag) || /data-eager/i.test(tag);

    // Serve local raster assets through Netlify Image CDN. This lets the
    // browser download a correctly sized WebP instead of a full-size PNG/JPG.
    if (source && !isQr) {
      if (isHomeHero) {
        tag = responsiveImage(tag, source, [640, 1024, 1600], '100vw');
      } else if (isLogo) {
        tag = responsiveImage(tag, source, [96, 160], '(max-width: 900px) 50px, 82px');
      } else {
        tag = responsiveImage(
          tag,
          source,
          [480, 768, 960],
          '(max-width: 620px) 100vw, (max-width: 1050px) 50vw, 33vw'
        );
      }
    }

    if (isLikelyCritical) {
      tag = setAttr(tag, 'loading', 'eager');
      tag = setAttr(tag, 'fetchpriority', 'high');
    } else {
      tag = setAttr(tag, 'loading', 'lazy');
      tag = setAttr(tag, 'fetchpriority', 'low');
    }
    return tag;
  });
}

function optimizeIframes(html) {
  return html.replace(/<iframe\b[^>]*>/gi, (tag) => addAttr(tag, 'loading', 'lazy'));
}

function injectHeadHints(html, rel) {
  if (!html.includes('data-magic-performance-hints')) {
    const hints = [
      '<!-- MAGIC LIGHT performance hints -->',
      '<link data-magic-performance-hints rel="dns-prefetch" href="//www.googletagmanager.com">',
      '<link rel="dns-prefetch" href="//connect.facebook.net">'
    ];

    if (rel === 'index.html') {
      const hero = 'assets/lustre-anneau.png';
      const heroSrcset = [640, 1024, 1600]
        .map((w) => `${netlifyImageUrl(hero, w)} ${w}w`)
        .join(', ');
      hints.push(
        `<link rel="preload" as="image" href="${netlifyImageUrl(hero, 1600)}" imagesrcset="${heroSrcset}" imagesizes="100vw" fetchpriority="high">`
      );
    }

    html = html.replace(/<\/head>/i, `${hints.join('\n')}\n</head>`);
  }
  return html;
}

function stabilizeHomepageCarousel(html, rel) {
  if (rel !== 'index.html') return html;

  // Keep the first hero stable through the critical rendering window. A slide
  // change during Lighthouse can promote a lazy image to the LCP candidate.
  return html.replace(
    'showSlide(0);autoplay();',
    "showSlide(0);\nwindow.addEventListener('load',()=>setTimeout(autoplay,8000),{once:true});"
  );
}

function insertBeforeLastClosingTag(html, tagName, content) {
  const needle = `</${String(tagName).toLowerCase()}>`;
  const index = html.toLowerCase().lastIndexOf(needle);
  if (index < 0) throw new Error(`Missing ${needle}`);
  return html.slice(0, index) + content + html.slice(index);
}

function injectRuntime(html) {
  if (html.includes('<script src="/assets/performance.js" defer></script>')) return html;
  const tag = '<script src="/assets/performance.js" defer></script>\n';

  // produits.html contains a literal </body></html> inside the JavaScript used
  // to build the printable/PDF order document. Injecting before the FIRST
  // </body> puts a real </script> token inside that JS string; the browser then
  // closes the page script early and prints the remaining JavaScript as text.
  // The final </body> is the real document close.
  return insertBeforeLastClosingTag(html, 'body', tag);
}

let changed = 0;
for (const rel of publicPages) {
  const file = path.join(dist, rel);
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  html = optimizeImages(html, rel);
  html = optimizeIframes(html);
  html = injectHeadHints(html, rel);
  html = stabilizeHomepageCarousel(html, rel);
  html = injectRuntime(html);
  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
    changed += 1;
  }
}

console.log(`MAGIC LIGHT performance: ${changed} public page(s) optimized.`);
