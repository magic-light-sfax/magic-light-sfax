const fs=require('fs');
const path=require('path');

const root=process.cwd();
const dataFile=path.join(root,'dist','data','products.json');
const contentDir=path.join(root,'content','products');
if(!fs.existsSync(dataFile)){
  console.error('Product media enrichment failed: dist/data/products.json not found');
  process.exit(1);
}

const products=JSON.parse(fs.readFileSync(dataFile,'utf8'));
const byRef=new Map(products.map((p,i)=>[String(p.reference||'').trim().toUpperCase(),i]));

function listImages(value){
  if(!value) return [];
  const arr=Array.isArray(value)?value:String(value).split(/[|,]/);
  const out=[];
  for(const item of arr){
    const v=typeof item==='string'?item:(item?.image||item?.src||'');
    const s=String(v||'').trim();
    if(s && !out.includes(s)) out.push(s);
  }
  return out;
}

let enriched=0;
if(fs.existsSync(contentDir)){
  for(const name of fs.readdirSync(contentDir)){
    if(!name.toLowerCase().endsWith('.json')) continue;
    try{
      const src=JSON.parse(fs.readFileSync(path.join(contentDir,name),'utf8'));
      const key=String(src.reference||'').trim().toUpperCase();
      if(!key || !byRef.has(key)) continue;
      const p=products[byRef.get(key)];
      const images=listImages(src.images||src.gallery);
      const spin360=listImages(src.spin360||src.spin_360||src.frames360);
      if(images.length) p.images=images;
      if(spin360.length) p.spin360=spin360;
      if(src.watt!==undefined) p.watt=src.watt;
      else if(src.power!==undefined) p.watt=src.power;
      else if(src.puissance!==undefined) p.watt=src.puissance;
      if(src.dimensions!==undefined) p.dimensions=src.dimensions;
      else if(src.dimension!==undefined) p.dimensions=src.dimension;
      else if(src.size!==undefined) p.dimensions=src.size;
      if(src.stock!==undefined) p.stock=src.stock;
      else if(src.availability!==undefined) p.stock=src.availability;
      else if(src.disponibilite!==undefined) p.stock=src.disponibilite;
      [2,3,4,5].forEach(n=>{if(src['image'+n]) p['image'+n]=src['image'+n];});
      enriched++;
    }catch(e){
      console.warn('Product media enrichment ignored:',name,e.message);
    }
  }
}

fs.writeFileSync(dataFile,JSON.stringify(products,null,2),'utf8');
console.log(`MAGIC LIGHT product media: ${enriched} Admin product(s) enriched.`);
