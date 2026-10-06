const fs=require('fs');
const path=require('path');

const ROOT=process.cwd();
const DIST=path.join(ROOT,'dist');
const DATA=path.join(DIST,'data','products.json');
const PRODUCT_DIR=path.join(ROOT,'content','products');
const PAGES=['produits.html','products.html'];
const SCRIPT='\n<script defer src="/assets/product-variants.js"></script>\n';

function refKey(v){return String(v||'').trim().toUpperCase();}
function injectBeforeLastBody(html){
  const lower=html.toLowerCase();
  const idx=lower.lastIndexOf('</body>');
  if(idx===-1) return html+SCRIPT;
  return html.slice(0,idx)+SCRIPT+html.slice(idx);
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
      if(changed) merged++;
    }catch(e){
      console.warn('Variantes produit ignorées:',file,e.message);
    }
  }
  fs.writeFileSync(DATA,JSON.stringify(products,null,2),'utf8');
  console.log(`MAGIC LIGHT variantes: ${merged} produit(s) enrichi(s) (variantes/couleurs) dans products.json.`);
}

let injected=0;
for(const file of PAGES){
  const p=path.join(DIST,file);
  if(!fs.existsSync(p)) continue;
  let html=fs.readFileSync(p,'utf8');
  if(html.includes('/assets/product-variants.js')) continue;
  html=injectBeforeLastBody(html);
  fs.writeFileSync(p,html,'utf8');
  injected++;
}
console.log(`MAGIC LIGHT variantes: interface activée sur ${injected} page(s).`);
