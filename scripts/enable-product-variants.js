const fs=require('fs');
const path=require('path');

const ROOT=process.cwd();
const DIST=path.join(ROOT,'dist');
const DATA=path.join(DIST,'data','products.json');
const PRODUCT_DIR=path.join(ROOT,'content','products');
const PAGES=['produits.html','products.html'];
const SCRIPTS=[
  '/assets/product-variants.js'
];

function refKey(v){return String(v||'').trim().toUpperCase();}
function injectBeforeLastBody(html,src){
  const tag=`\n<script defer src="${src}"></script>\n`;
  const lower=html.toLowerCase();
  const idx=lower.lastIndexOf('</body>');
  if(idx===-1) return html+tag;
  return html.slice(0,idx)+tag+html.slice(idx);
}

if(fs.existsSync(DATA) && fs.existsSync(PRODUCT_DIR)){
  const products=JSON.parse(fs.readFileSync(DATA,'utf8'));
  const byRef=new Map(products.map(p=>[refKey(p.reference),p]));
  let merged=0;
  for(const file of fs.readdirSync(PRODUCT_DIR)){
    if(!file.toLowerCase().endsWith('.json')) continue;
    try{
      const src=JSON.parse(fs.readFileSync(path.join(PRODUCT_DIR,file),'utf8'));
      const target=byRef.get(refKey(src.reference));
      if(!target) continue;
      let changed=false;
      if(Array.isArray(src.variants) && src.variants.length){
        target.variants=src.variants;
        changed=true;
      }
      if(Array.isArray(src.colors) && src.colors.length){
        target.colors=src.colors;
        changed=true;
      }
      if(Array.isArray(src.options) && src.options.length){
        target.options=src.options;
        changed=true;
      }
      if(changed) merged++;
    }catch(e){
      console.warn('Variantes produit ignorées:',file,e.message);
    }
  }
  fs.writeFileSync(DATA,JSON.stringify(products,null,2),'utf8');
  console.log(`MAGIC LIGHT variantes: ${merged} produit(s) enrichi(s) (variantes/options) dans products.json.`);
}

let injected=0;
for(const file of PAGES){
  const p=path.join(DIST,file);
  if(!fs.existsSync(p)) continue;
  let html=fs.readFileSync(p,'utf8');
  let changed=false;
  // Remove the old dimensions helper: dimensions are now handled by product-variants.js.
  html=html.replace(/\s*<script\s+defer\s+src=["']\/assets\/product-variant-dimensions\.js["']><\/script>\s*/gi,'\n');
  for(const src of SCRIPTS){
    if(html.includes(src)) continue;
    html=injectBeforeLastBody(html,src);
    changed=true;
  }
  fs.writeFileSync(p,html,'utf8');
  if(changed) injected++;
}
console.log(`MAGIC LIGHT variantes: interface générique activée sur ${PAGES.length} page(s).`);
