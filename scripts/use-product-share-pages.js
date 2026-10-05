const fs=require('fs');
const path=require('path');

const file=path.join(process.cwd(),'dist','assets','product-share.js');
if(!fs.existsSync(file)){
  console.warn('Product share patch: dist/assets/product-share.js introuvable.');
  process.exit(0);
}

let js=fs.readFileSync(file,'utf8');
const before=`  function productUrl(p){\n    const key=p.ref||p.name;\n    const url=new URL(PRODUCT_PATH,location.origin);\n    url.searchParams.set('share',key);\n    return url.href;\n  }`;
const after=`  function shareSlug(v){\n    const raw=String(v||'').trim();\n    const normalized=raw.normalize ? raw.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'') : raw;\n    return normalized.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'produit';\n  }\n\n  function productUrl(p){\n    const key=p.ref||p.name;\n    return new URL('/p/'+shareSlug(key)+'/',location.origin).href;\n  }`;

if(!js.includes(before)){
  console.warn('Product share patch: fonction productUrl attendue introuvable.');
  process.exit(0);
}
js=js.replace(before,after);
fs.writeFileSync(file,js,'utf8');
console.log('MAGIC LIGHT sharing: liens sociaux dirigés vers les previews produit Open Graph.');
