
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

function rm(p){ if(fs.existsSync(p)) fs.rmSync(p,{recursive:true,force:true}); }
function ensure(p){ fs.mkdirSync(p,{recursive:true}); }
function copyFile(src,dest){ ensure(path.dirname(dest)); fs.copyFileSync(src,dest); }
function copyDir(src,dest){
  if(!fs.existsSync(src)) return;
  ensure(dest);
  for(const entry of fs.readdirSync(src,{withFileTypes:true})){
    const s=path.join(src,entry.name), d=path.join(dest,entry.name);
    if(entry.isDirectory()) copyDir(s,d); else copyFile(s,d);
  }
}

rm(DIST); ensure(DIST);

for(const f of ["index.html","produits.html","nouveautes.html","references.html","catalogue.html","contact.html"]){
  copyFile(path.join(ROOT,f),path.join(DIST,f));
}

// Compatibility alias: /products serves the same canonical page as /produits.
copyFile(path.join(ROOT,"produits.html"),path.join(DIST,"products.html"));
copyDir(path.join(ROOT,"assets"),path.join(DIST,"assets"));
copyDir(path.join(ROOT,"admin"),path.join(DIST,"admin"));

const productDir=path.join(ROOT,"content","products");
const products=[];
if(fs.existsSync(productDir)){
  for(const f of fs.readdirSync(productDir)){
    if(!f.toLowerCase().endsWith(".json")) continue;
    try{
      const obj=JSON.parse(fs.readFileSync(path.join(productDir,f),"utf8"));
      if(obj.active!==false){
        products.push({
          name:obj.name||"",
          reference:obj.reference||"",
          category:obj.category||"Autres",
          description:obj.description||"",
          price:obj.price ?? null,
          image:obj.image||"",
          featured:obj.featured!==false
        });
      }
    }catch(e){ console.warn("Produit ignoré:",f,e.message); }
  }
}
products.sort((a,b)=>(a.reference||"").localeCompare(b.reference||"","fr",{numeric:true}));
ensure(path.join(DIST,"data"));
fs.writeFileSync(path.join(DIST,"data","products.json"),JSON.stringify(products,null,2),"utf8");
console.log(`MAGIC LIGHT build: ${products.length} produit(s) Admin généré(s).`);
