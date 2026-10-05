const fs=require('fs');
const path=require('path');

const ROOT=process.cwd();
const DIST=path.join(ROOT,'dist');
const productsPath=path.join(DIST,'produits.html');
const outRoot=path.join(DIST,'p');
const SITE='https://magic-light-sfax.netlify.app';

function decode(v=''){
  return String(v)
    .replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,'&')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCharCode(parseInt(n,16)));
}
function esc(v=''){
  return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function slug(v=''){
  const s=String(v).trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  return s||'produit';
}
function attr(tag,name){
  const m=tag.match(new RegExp(`${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`,'i'));
  return m?decode(m[2]).trim():'';
}
function absoluteUrl(src=''){
  if(/^https?:\/\//i.test(src)) return src;
  return SITE+'/'+String(src).replace(/^\.?\//,'');
}

if(!fs.existsSync(productsPath)){
  console.warn('Share pages: dist/produits.html introuvable.');
  process.exit(0);
}

const html=fs.readFileSync(productsPath,'utf8');
const re=/<button\b[^>]*class=["'][^"']*\bview-product\b[^"']*["'][^>]*>/gi;
const seen=new Set();
let count=0, match;
fs.rmSync(outRoot,{recursive:true,force:true});
fs.mkdirSync(outRoot,{recursive:true});

while((match=re.exec(html))){
  const tag=match[0];
  const name=attr(tag,'data-name')||'Produit MAGIC LIGHT';
  const ref=attr(tag,'data-ref');
  const desc=attr(tag,'data-desc')||`Découvrez ${name} chez MAGIC LIGHT.`;
  const img=attr(tag,'data-img');
  const key=ref||name;
  const pageSlug=slug(key);
  if(seen.has(pageSlug)) continue;
  seen.add(pageSlug);

  const productUrl=`${SITE}/p/${pageSlug}/`;
  const target=`${SITE}/produits.html?share=${encodeURIComponent(key)}`;
  const image=absoluteUrl(img||'assets/logo.jpg');
  const title=`${name} | MAGIC LIGHT`;

  const page=`<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>${esc(title)}</title>\n<meta name="description" content="${esc(desc)}">\n<link rel="canonical" href="${esc(productUrl)}">\n<meta property="og:type" content="product">\n<meta property="og:site_name" content="MAGIC LIGHT">\n<meta property="og:title" content="${esc(name)}">\n<meta property="og:description" content="${esc(desc)}">\n<meta property="og:url" content="${esc(productUrl)}">\n<meta property="og:image" content="${esc(image)}">\n<meta property="og:image:alt" content="${esc(name)}">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${esc(name)}">\n<meta name="twitter:description" content="${esc(desc)}">\n<meta name="twitter:image" content="${esc(image)}">\n<meta name="robots" content="index,follow,max-image-preview:large">\n<style>body{font-family:Arial,sans-serif;margin:0;background:#f5f5f5;color:#171717}.box{max-width:620px;margin:8vh auto;background:#fff;border-radius:20px;padding:28px;box-shadow:0 14px 40px #0001}.box img{width:100%;max-height:390px;object-fit:contain;border-radius:14px;background:#f7f7f7}.k{color:#b1842f;font-weight:800}.btn{display:inline-block;margin-top:18px;padding:13px 18px;border-radius:12px;background:#111;color:#fff;text-decoration:none;font-weight:800}</style>\n</head>\n<body>\n<div class="box"><div class="k">MAGIC LIGHT</div><h1>${esc(name)}</h1>${ref?`<p><strong>Référence:</strong> ${esc(ref)}</p>`:''}<img src="${esc(image)}" alt="${esc(name)}"><p>${esc(desc)}</p><a class="btn" href="${esc(target)}">Voir le produit dans MAGIC LIGHT</a></div>\n<script>(function(){var standalone=window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;if(standalone){location.replace(${JSON.stringify(target)})}})();</script>\n</body>\n</html>`;

  const dir=path.join(outRoot,pageSlug);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),page,'utf8');
  count++;
}

console.log(`MAGIC LIGHT sharing: ${count} page(s) produit générée(s) avec Open Graph.`);
