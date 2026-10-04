
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
const importConfigPath=path.join(ROOT,"content","imports","products-import.json");

function normalizeHeader(v){
  return String(v ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g,"");
}
function parseBool(v, fallback=true){
  if(v===true || v===false) return v;
  if(v===null || v===undefined || String(v).trim()==="") return fallback;
  const s=String(v).trim().toLowerCase();
  if(["1","true","yes","oui","o","y","vrai","نعم"].includes(s)) return true;
  if(["0","false","no","non","n","faux","لا"].includes(s)) return false;
  return fallback;
}
function parseNumber(v){
  if(v===null || v===undefined || String(v).trim()==="") return null;
  const s=String(v).replace(/\s/g,"").replace(/tnd/ig,"").replace(/dt/ig,"").replace(/%/g,"").replace(",",".");
  const n=Number(s);
  return Number.isFinite(n) ? n : null;
}
function normalizeImage(v){
  const s=String(v ?? "").trim();
  if(!s) return "";
  if(/^https?:\/\//i.test(s) || s.startsWith("/")) return s;
  return "/assets/products/" + s.replace(/^\.?\//,"");
}
function pick(row, aliases){
  const normalized={};
  for(const [k,v] of Object.entries(row||{})) normalized[normalizeHeader(k)]=v;
  for(const key of aliases){
    const hit=normalized[normalizeHeader(key)];
    if(hit!==undefined) return hit;
  }
  return "";
}
function rowToProduct(row){
  const name=String(pick(row,["name","nom","nom du produit","produit","product"])).trim();
  const reference=String(pick(row,["reference","référence","ref","sku","code"])).trim();
  if(!name || !reference) return null;
  const discountRaw=parseNumber(pick(row,["discount","remise","remise %","discount %","promo %","promotion"]));
  const discount=discountRaw===null ? 0 : Math.max(0,Math.min(90,discountRaw));
  const promoFlag=parseBool(pick(row,["promo","en promotion","promotion active"]),discount>0);
  return {
    name,
    reference,
    category:String(pick(row,["category","catégorie","categorie","famille"]) || "Autres").trim() || "Autres",
    description:String(pick(row,["description","desc"])).trim(),
    price:(()=>{ const n=parseNumber(pick(row,["price","prix","prix normal","normal price"])); return n!==null && n>0 ? n : null; })(),
    promo:promoFlag && discount>0,
    discount,
    image:normalizeImage(pick(row,["image","photo","photo produit","image path","image url"])),
    featured:parseBool(pick(row,["featured","nouveaute","nouveauté","nouveau"]),true),
    active:parseBool(pick(row,["active","afficher","afficher sur le site","visible"]),true)
  };
}
function detectDelimiter(line){
  const candidates=[",",";","\t"];
  let best=",", bestCount=-1;
  for(const d of candidates){
    const count=(line.match(new RegExp(d==="\t" ? "\\t" : "\\"+d,"g"))||[]).length;
    if(count>bestCount){ best=d; bestCount=count; }
  }
  return best;
}
function parseCsv(text){
  text=String(text||"").replace(/^\uFEFF/,"");
  const firstLine=text.split(/\r?\n/,1)[0]||"";
  const delimiter=detectDelimiter(firstLine);
  const rows=[]; let row=[], cell="", quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"'){
      if(quoted && text[i+1]==='"'){ cell+='"'; i++; }
      else quoted=!quoted;
    }else if(ch===delimiter && !quoted){
      row.push(cell); cell="";
    }else if((ch==="\n" || ch==="\r") && !quoted){
      if(ch==="\r" && text[i+1]==="\n") i++;
      row.push(cell); cell="";
      if(row.some(v=>String(v).trim()!=="")) rows.push(row);
      row=[];
    }else cell+=ch;
  }
  row.push(cell);
  if(row.some(v=>String(v).trim()!=="")) rows.push(row);
  if(!rows.length) return [];
  const headers=rows.shift().map(h=>String(h).trim());
  return rows.map(values=>{
    const obj={};
    headers.forEach((h,i)=>{ obj[h]=values[i] ?? ""; });
    return obj;
  });
}
function resolveRepoFile(publicPath){
  const clean=String(publicPath||"").trim().replace(/^\/+/,"");
  const abs=path.resolve(ROOT,clean);
  const importsRoot=path.resolve(ROOT,"assets","imports");
  if(abs!==importsRoot && !abs.startsWith(importsRoot+path.sep)){
    throw new Error("Le fichier d’import doit être dans /assets/imports");
  }
  return abs;
}
function loadBulkImport(){
  if(!fs.existsSync(importConfigPath)) return [];
  let cfg;
  try{ cfg=JSON.parse(fs.readFileSync(importConfigPath,"utf8")); }
  catch(e){ console.warn("Import Excel/CSV ignoré: configuration invalide -",e.message); return []; }
  if(cfg.enabled!==true || !cfg.file) return [];
  let filePath;
  try{ filePath=resolveRepoFile(cfg.file); }
  catch(e){ console.warn("Import Excel/CSV ignoré:",e.message); return []; }
  if(!fs.existsSync(filePath)){ console.warn("Import Excel/CSV introuvable:",cfg.file); return []; }

  const ext=path.extname(filePath).toLowerCase();
  let rows=[];
  try{
    if(ext===".csv" || ext===".txt"){
      rows=parseCsv(fs.readFileSync(filePath,"utf8"));
    }else if(ext===".xlsx" || ext===".xls"){
      const XLSX=require("xlsx");
      const workbook=XLSX.readFile(filePath,{cellDates:false});
      const first=workbook.SheetNames[0];
      rows=first ? XLSX.utils.sheet_to_json(workbook.Sheets[first],{defval:"",raw:false}) : [];
    }else{
      console.warn("Import Excel/CSV ignoré: format non supporté",ext);
      return [];
    }
  }catch(e){
    console.warn("Import Excel/CSV ignoré:",e.message);
    return [];
  }

  const imported=[];
  for(const row of rows){
    const p=rowToProduct(row);
    if(p && p.active!==false) imported.push(p);
  }
  console.log("MAGIC LIGHT import: "+imported.length+" produit(s) lu(s) depuis "+path.basename(filePath)+".");
  return imported;
}

const productsByRef=new Map();
const refKey=v=>String(v||"").trim().toUpperCase();
for(const obj of loadBulkImport()){
  productsByRef.set(refKey(obj.reference),obj);
}

let manualCount=0;
if(fs.existsSync(productDir)){
  for(const f of fs.readdirSync(productDir)){
    if(!f.toLowerCase().endsWith(".json")) continue;
    try{
      const obj=JSON.parse(fs.readFileSync(path.join(productDir,f),"utf8"));
      if(obj.active!==false){
        const product={
          name:obj.name||"",
          reference:obj.reference||"",
          category:obj.category||"Autres",
          description:obj.description||"",
          price:obj.price ?? null,
          promo:obj.promo===true,
          discount:Number.isFinite(Number(obj.discount)) ? Math.max(0,Math.min(90,Number(obj.discount))) : 0,
          image:obj.image||"",
          featured:obj.featured!==false,
          active:true
        };
        if(product.reference){
          productsByRef.set(refKey(product.reference),product);
          manualCount++;
        }
      }
    }catch(e){ console.warn("Produit ignoré:",f,e.message); }
  }
}

const products=Array.from(productsByRef.values())
  .filter(p=>p.active!==false)
  .map(({active,...p})=>p)
  .sort((a,b)=>(a.reference||"").localeCompare(b.reference||"","fr",{numeric:true}));

ensure(path.join(DIST,"data"));
fs.writeFileSync(path.join(DIST,"data","products.json"),JSON.stringify(products,null,2),"utf8");
console.log("MAGIC LIGHT build: "+products.length+" produit(s) généré(s), dont "+manualCount+" fiche(s) individuelle(s) Admin.");
