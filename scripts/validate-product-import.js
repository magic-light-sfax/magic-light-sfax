const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONFIG = path.join(ROOT, 'content', 'imports', 'products-import.json');
const PRODUCTS_DIR = path.join(ROOT, 'content', 'products');

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
  throw new Error('Format non supporté: '+ext+'. Utilisez .csv, .xlsx ou .xls.');
}
function resolveImport(publicPath){
  const clean=String(publicPath||'').trim().replace(/^\/+/, '');
  const source=path.resolve(ROOT,clean);
  const importsRoot=path.resolve(ROOT,'assets','imports');
  if(source!==importsRoot && !source.startsWith(importsRoot+path.sep)) throw new Error("Le fichier d'import doit être dans /assets/imports");
  return source;
}
function refKey(v){ return String(v||'').trim().toUpperCase(); }

if(!fs.existsSync(CONFIG)){
  console.log("MAGIC LIGHT import validation: aucune configuration d'import.");
  process.exit(0);
}
const cfg=JSON.parse(fs.readFileSync(CONFIG,'utf8'));
if(cfg.enabled!==true || !cfg.file){
  console.log('MAGIC LIGHT import validation: import désactivé.');
  process.exit(0);
}

const source=resolveImport(cfg.file);
if(!fs.existsSync(source)) throw new Error('Fichier import introuvable: '+cfg.file);
const rows=readRows(source);
if(!rows.length) throw new Error("Le fichier d'import ne contient aucune ligne produit.");

const invalid=[];
const duplicates=[];
const seen=new Map();
for(let i=0;i<rows.length;i++){
  const row=rows[i];
  const name=String(pick(row,['name','nom','nom du produit','produit','product'])).trim();
  const ref=String(pick(row,['reference','référence','ref','sku','code'])).trim();
  const line=i+2;
  if(!ref || !name){
    invalid.push(`ligne ${line}: ${!ref?'reference manquante':''}${!ref&&!name?' + ':''}${!name?'nom manquant':''}`);
    continue;
  }
  const key=refKey(ref);
  if(seen.has(key)) duplicates.push(`${ref} (lignes ${seen.get(key)} et ${line})`);
  else seen.set(key,line);
}

if(invalid.length) throw new Error('Import invalide — '+invalid.slice(0,12).join(' | ')+(invalid.length>12?' | …':''));
if(duplicates.length) throw new Error('Références dupliquées dans le fichier — '+duplicates.slice(0,12).join(' | ')+(duplicates.length>12?' | …':''));

const manualRefs=new Map();
if(fs.existsSync(PRODUCTS_DIR)){
  for(const file of fs.readdirSync(PRODUCTS_DIR)){
    if(!file.toLowerCase().endsWith('.json')) continue;
    try{
      const product=JSON.parse(fs.readFileSync(path.join(PRODUCTS_DIR,file),'utf8'));
      const key=refKey(product.reference);
      if(key) manualRefs.set(key,file);
    }catch(e){
      console.warn('Fiche Admin ignorée pendant la validation:',file,e.message);
    }
  }
}
const conflicts=[];
for(const [key,line] of seen){
  if(manualRefs.has(key)) conflicts.push(`${key} (ligne ${line} → ${manualRefs.get(key)})`);
}

console.log(`MAGIC LIGHT import validation: ${rows.length} ligne(s), ${seen.size} référence(s) unique(s), 0 doublon.`);
if(conflicts.length){
  console.log(`MAGIC LIGHT import: ${conflicts.length} référence(s) existent déjà dans Admin; la fiche Admin reste prioritaire.`);
  console.log('Conflits:',conflicts.slice(0,20).join(' | ')+(conflicts.length>20?' | …':''));
}
