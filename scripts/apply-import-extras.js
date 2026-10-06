const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONFIG = path.join(ROOT,'content','imports','products-import.json');
const PRODUCTS_DIR = path.join(ROOT,'content','products');
const DIST_PRODUCTS = path.join(ROOT,'dist','data','products.json');

function normalizeHeader(v){
  return String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'');
}
function pick(row, aliases){
  const normalized={};
  for(const [k,v] of Object.entries(row||{})) normalized[normalizeHeader(k)]=v;
  for(const key of aliases){
    const value=normalized[normalizeHeader(key)];
    if(value!==undefined) return value;
  }
  return '';
}
function detectDelimiter(line){
  const candidates=[',',';','\t'];
  let best=',', bestCount=-1;
  for(const d of candidates){
    let count=0, quoted=false;
    for(let i=0;i<line.length;i++){
      if(line[i]==='"') quoted=!quoted;
      else if(!quoted && line[i]===d) count++;
    }
    if(count>bestCount){ best=d; bestCount=count; }
  }
  return best;
}
function parseCsv(text){
  text=String(text||'').replace(/^\uFEFF/,'');
  const firstLine=text.split(/\r?\n/,1)[0]||'';
  const delimiter=detectDelimiter(firstLine);
  const rows=[]; let row=[], cell='', quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"'){
      if(quoted && text[i+1]==='"'){ cell+='"'; i++; }
      else quoted=!quoted;
    }else if(ch===delimiter && !quoted){
      row.push(cell); cell='';
    }else if((ch==='\n' || ch==='\r') && !quoted){
      if(ch==='\r' && text[i+1]==='\n') i++;
      row.push(cell); cell='';
      if(row.some(v=>String(v).trim()!=='')) rows.push(row);
      row=[];
    }else cell+=ch;
  }
  row.push(cell);
  if(row.some(v=>String(v).trim()!=='')) rows.push(row);
  if(!rows.length) return [];
  const headers=rows.shift().map(h=>String(h).trim());
  return rows.map(values=>{
    const obj={};
    headers.forEach((h,i)=>{ obj[h]=values[i] ?? ''; });
    return obj;
  });
}
function readRows(filePath){
  const ext=path.extname(filePath).toLowerCase();
  if(ext==='.csv' || ext==='.txt') return parseCsv(fs.readFileSync(filePath,'utf8'));
  if(ext==='.xlsx' || ext==='.xls'){
    const XLSX=require('xlsx');
    const wb=XLSX.readFile(filePath,{cellDates:false});
    const first=wb.SheetNames[0];
    return first ? XLSX.utils.sheet_to_json(wb.Sheets[first],{defval:'',raw:false}) : [];
  }
  return [];
}
function resolveImport(publicPath){
  const clean=String(publicPath||'').trim().replace(/^\/+/, '');
  const source=path.resolve(ROOT,clean);
  const importsRoot=path.resolve(ROOT,'assets','imports');
  if(source!==importsRoot && !source.startsWith(importsRoot+path.sep)) return null;
  return source;
}
function refKey(v){ return String(v||'').trim().toUpperCase(); }
function parseIntField(v){
  if(v===null || v===undefined || String(v).trim()==='') return null;
  const n=Number(String(v).replace(/\s/g,'').replace(',','.'));
  return Number.isFinite(n) && n>=0 ? Math.floor(n) : null;
}
function textField(v){ return String(v ?? '').trim(); }

if(!fs.existsSync(CONFIG) || !fs.existsSync(DIST_PRODUCTS)) process.exit(0);
let cfg;
try{ cfg=JSON.parse(fs.readFileSync(CONFIG,'utf8')); }catch(e){ process.exit(0); }
if(cfg.enabled!==true || !cfg.file) process.exit(0);
const source=resolveImport(cfg.file);
if(!source || !fs.existsSync(source)) process.exit(0);

const rows=readRows(source);
const extrasByRef=new Map();
for(const row of rows){
  const ref=textField(pick(row,['reference','référence','ref','sku','code']));
  if(!ref) continue;
  const extra={};
  const stockQty=parseIntField(pick(row,['stockQty','stock qty','quantité en stock','quantite en stock','stock quantity','quantite']));
  const stockAlert=parseIntField(pick(row,['stockAlert','stock alert','alerte stock faible','seuil stock','stock threshold']));
  const stock=textField(pick(row,['stock','disponibilité','disponibilite','availability']));
  const watt=textField(pick(row,['watt','puissance','power']));
  const dimensions=textField(pick(row,['dimensions','dimension','taille','size']));
  if(stockQty!==null) extra.stockQty=stockQty;
  if(stockAlert!==null) extra.stockAlert=stockAlert;
  if(stock) extra.stock=stock;
  if(watt) extra.watt=watt;
  if(dimensions) extra.dimensions=dimensions;
  extrasByRef.set(refKey(ref),extra);
}

const manualRefs=new Set();
if(fs.existsSync(PRODUCTS_DIR)){
  for(const file of fs.readdirSync(PRODUCTS_DIR)){
    if(!file.toLowerCase().endsWith('.json')) continue;
    try{
      const product=JSON.parse(fs.readFileSync(path.join(PRODUCTS_DIR,file),'utf8'));
      const key=refKey(product.reference);
      if(key) manualRefs.add(key);
    }catch(e){}
  }
}

const products=JSON.parse(fs.readFileSync(DIST_PRODUCTS,'utf8'));
let enriched=0;
for(const product of products){
  const key=refKey(product.reference);
  if(!key || manualRefs.has(key)) continue;
  const extra=extrasByRef.get(key);
  if(!extra || !Object.keys(extra).length) continue;
  Object.assign(product,extra);
  enriched++;
}
fs.writeFileSync(DIST_PRODUCTS,JSON.stringify(products,null,2),'utf8');
console.log(`MAGIC LIGHT import extras: ${enriched} produit(s) enrichi(s) avec stock / watt / dimensions.`);
