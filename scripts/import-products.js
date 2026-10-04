const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const CONFIG = path.join(ROOT, "content", "imports", "products-import.json");
const PRODUCTS_DIR = path.join(ROOT, "content", "products");

function ensure(p){ fs.mkdirSync(p,{recursive:true}); }

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
function slugify(v){
  const s=String(v||"").trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"");
  return s || "produit";
}
function refKey(v){ return String(v||"").trim().toUpperCase(); }

function rowToProduct(row){
  const name=String(pick(row,["name","nom","nom du produit","produit","product"])).trim();
  const reference=String(pick(row,["reference","référence","ref","sku","code"])).trim();
  if(!name || !reference) return null;

  const discountRaw=parseNumber(pick(row,["discount","remise","remise %","discount %","promo %","promotion"]));
  const discount=discountRaw===null ? 0 : Math.max(0,Math.min(90,discountRaw));
  const promoFlag=parseBool(pick(row,["promo","en promotion","promotion active"]),discount>0);
  const priceRaw=parseNumber(pick(row,["price","prix","prix normal","normal price"]));
  const price=priceRaw!==null && priceRaw>0 ? priceRaw : null;

  return {
    name,
    reference,
    category:String(pick(row,["category","catégorie","categorie","famille"]) || "Autres").trim() || "Autres",
    description:String(pick(row,["description","desc"])).trim(),
    price,
    promo:promoFlag && discount>0,
    discount,
    image:normalizeImage(pick(row,["image","photo","photo produit","image path","image url"])),
    featured:parseBool(pick(row,["featured","nouveaute","nouveauté","nouveau"]),true),
    active:parseBool(pick(row,["active","afficher","afficher sur le site","visible"]),true)
  };
}

function readRows(filePath){
  const ext=path.extname(filePath).toLowerCase();
  if(ext===".csv" || ext===".txt"){
    return parseCsv(fs.readFileSync(filePath,"utf8"));
  }
  if(ext===".xlsx" || ext===".xls"){
    const XLSX=require("xlsx");
    const wb=XLSX.readFile(filePath,{cellDates:false});
    const first=wb.SheetNames[0];
    return first ? XLSX.utils.sheet_to_json(wb.Sheets[first],{defval:"",raw:false}) : [];
  }
  throw new Error("Format non supporté: "+ext);
}

if(!fs.existsSync(CONFIG)){
  console.log("Aucune configuration d'import. Rien à faire.");
  process.exit(0);
}
const cfg=JSON.parse(fs.readFileSync(CONFIG,"utf8"));
if(cfg.enabled!==true || !cfg.file){
  console.log("Import désactivé ou fichier absent. Rien à faire.");
  process.exit(0);
}

const clean=String(cfg.file).trim().replace(/^\/+/, "");
const source=path.resolve(ROOT, clean);
const importsRoot=path.resolve(ROOT, "assets", "imports");
if(source!==importsRoot && !source.startsWith(importsRoot+path.sep)){
  throw new Error("Le fichier d'import doit être dans /assets/imports");
}
if(!fs.existsSync(source)) throw new Error("Fichier import introuvable: "+cfg.file);

ensure(PRODUCTS_DIR);

const existingByRef=new Map();
for(const f of fs.readdirSync(PRODUCTS_DIR)){
  if(!f.toLowerCase().endsWith(".json")) continue;
  try{
    const obj=JSON.parse(fs.readFileSync(path.join(PRODUCTS_DIR,f),"utf8"));
    if(obj && obj.reference) existingByRef.set(refKey(obj.reference),f);
  }catch(e){
    console.warn("Fiche ignorée:",f,e.message);
  }
}

const rows=readRows(source);
let created=0, skipped=0, invalid=0;
const seen=new Set();

for(const row of rows){
  const p=rowToProduct(row);
  if(!p){ invalid++; continue; }

  const key=refKey(p.reference);
  if(seen.has(key)){ skipped++; continue; }
  seen.add(key);

  if(existingByRef.has(key)){
    // Important: ne jamais écraser une fiche déjà éditable dans Admin.
    skipped++;
    continue;
  }

  let base=slugify(p.reference);
  let filename=base+".json";
  let n=2;
  while(fs.existsSync(path.join(PRODUCTS_DIR,filename))){
    filename=base+"-"+n+".json";
    n++;
  }

  fs.writeFileSync(path.join(PRODUCTS_DIR,filename),JSON.stringify(p,null,2)+"\n","utf8");
  existingByRef.set(key,filename);
  created++;
}

console.log("MAGIC LIGHT import -> fiches Admin");
console.log("Fichier:", path.basename(source));
console.log("Lignes lues:", rows.length);
console.log("Créées:", created);
console.log("Ignorées (déjà présentes/doublons):", skipped);
console.log("Invalides:", invalid);
