const fs=require('fs');
const path=require('path');

const root=process.cwd();
const distFile=path.join(root,'dist','data','products.json');
const productDir=path.join(root,'content','products');
if(!fs.existsSync(distFile)||!fs.existsSync(productDir)) process.exit(0);

const products=JSON.parse(fs.readFileSync(distFile,'utf8'));
const byRef=new Map(products.map(p=>[String(p.reference||'').trim().toUpperCase(),p]));
const extraFields=['images','gallery','spin360','watt','dimensions','stock','brand','stockQty','stockAlert'];
let merged=0;
for(const file of fs.readdirSync(productDir)){
  if(!file.toLowerCase().endsWith('.json')) continue;
  try{
    const src=JSON.parse(fs.readFileSync(path.join(productDir,file),'utf8'));
    const ref=String(src.reference||'').trim().toUpperCase();
    const target=byRef.get(ref);
    if(!target) continue;
    let changed=false;
    for(const key of extraFields){
      if(src[key]!==undefined && src[key]!==null && src[key]!=='' ){
        target[key]=src[key]; changed=true;
      }
    }
    if(changed) merged++;
  }catch(e){ console.warn('Media/stock produit ignoré:',file,e.message); }
}
fs.writeFileSync(distFile,JSON.stringify(products,null,2),'utf8');
console.log(`MAGIC LIGHT media/stock: ${merged} fiche(s) enrichie(s) — galerie/360/specs/stock préservés.`);
