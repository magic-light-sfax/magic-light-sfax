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

function insertBeforeLast(html, tagName, content) {
  const needle = `</${String(tagName).toLowerCase()}>`;
  const i = html.toLowerCase().lastIndexOf(needle);
  return i < 0 ? html + content : html.slice(0, i) + content + html.slice(i);
}

function deferThirdPartyAnalytics(html) {
  // Keep the GA4 queue/config in place, but postpone downloading the vendor
  // bundle until a real interaction (or a long fallback timeout). First-party
  // analytics still records the initial page view immediately.
  html = html.replace(
    /\s*<script\s+async\s+src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=[^"']+["']><\/script>\s*/gi,
    '\n'
  );

  // Preserve the standard Meta fbq queue, but stop the inline bootstrap from
  // immediately inserting fbevents.js. The delayed loader below inserts it.
  html = html.replace(
    /t=b\.createElement\(e\);t\.async=!0;\s*t\.src=v;s=b\.getElementsByTagName\(e\)\[0\];s\.parentNode\.insertBefore\(t,s\)/g,
    't=null'
  );

  if (html.includes('data-magic-vendor-delay')) return html;

  const loader = `\n<script data-magic-vendor-delay>\n(function(){\n  var loaded=false;\n  function loadVendors(){\n    if(loaded) return;\n    loaded=true;\n    var cfg=window.magicAnalyticsConfig||{};\n    if(cfg.ga4Enabled && cfg.ga4MeasurementId){\n      var g=document.createElement('script');\n      g.async=true;\n      g.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(cfg.ga4MeasurementId);\n      document.head.appendChild(g);\n    }\n    if(cfg.metaEnabled && cfg.metaPixelId){\n      var f=document.createElement('script');\n      f.async=true;\n      f.src='https://connect.facebook.net/en_US/fbevents.js';\n      document.head.appendChild(f);\n    }\n  }\n  ['pointerdown','keydown','touchstart'].forEach(function(type){\n    window.addEventListener(type,loadVendors,{once:true,passive:true,capture:true});\n  });\n  window.addEventListener('scroll',loadVendors,{once:true,passive:true});\n  setTimeout(loadVendors,15000);\n})();\n</script>\n`;

  return insertBeforeLast(html, 'body', loader);
}

function removeRedundantRuntime(html) {
  // Static images/iframes are already optimized at build time, and dynamic
  // product cards already ship with lazy-loading attributes. Avoid running a
  // MutationObserver on every public page during the critical render window.
  return html.replace(/\s*<script\s+src=["']\/assets\/performance\.js["']\s+defer><\/script>\s*/gi, '\n');
}

function deferHomepageProducts(html) {
  // Admin-fed homepage cards are below the fold. Fetch them after load/idle so
  // they do not compete with the hero image and initial interaction work.
  return html.replace(
    /(^|\n)(\s*)loadProducts\(\);(\s*)(?=\n\}\)\(\);)/,
    `$1$2var runProducts=function(){ loadProducts(); };\n$2window.addEventListener('load',function(){\n$2  if('requestIdleCallback' in window){\n$2    requestIdleCallback(runProducts,{timeout:2500});\n$2  }else{\n$2    setTimeout(runProducts,1200);\n$2  }\n$2},{once:true});$3`
  );
}

let changed = 0;
for (const rel of PAGES) {
  const file = path.join(DIST, rel);
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  html = deferThirdPartyAnalytics(html);
  html = removeRedundantRuntime(html);
  if (rel === 'index.html') html = deferHomepageProducts(html);
  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
    changed += 1;
  }
}

console.log(`MAGIC LIGHT noncritical work: ${changed} public page(s) deferred.`);
