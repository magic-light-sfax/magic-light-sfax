const fs=require('fs');
const path=require('path');

const dist=path.join(process.cwd(),'dist');
if(!fs.existsSync(dist)) process.exit(0);

const pages=['index.html','produits.html','products.html','nouveautes.html','references.html','catalogue.html','contact.html'];
const productPages=new Set(['produits.html','products.html']);
const marker='magic-light-system-url-normalizer-v1';

const normalizer=`<script id="${marker}">(function(){try{var p=new URLSearchParams(location.search);var c=String(p.get('categorie')||p.get('cat')||'').toLowerCase();if(/^systeme-\\d+$/.test(c)&&!p.get('systeme')&&!p.get('system')){p.delete('categorie');p.delete('cat');p.set('systeme',c);var q=p.toString();location.replace(location.pathname+(q?'?'+q:'')+location.hash);}}catch(e){}})();</script>`;

for(const page of pages){
  const file=path.join(dist,page);
  if(!fs.existsSync(file)) continue;
  let html=fs.readFileSync(file,'utf8');

  html=html.replace(/href=(['"])(?:\.\/)?produits(?:\.html)?\?categorie=(systeme-\d+)\1/gi,
    (_m,q,system)=>`href=${q}produits.html?systeme=${system}${q}`);

  if(productPages.has(page)){
    html=html.replace(new RegExp(`<script id=["']${marker}["']>[\\s\\S]*?<\\/script>`,`g`),'');
    const headMatch=html.match(/<head\b[^>]*>/i);
    if(!headMatch) throw new Error('System URL normalizer: <head> not found in '+page);
    const idx=headMatch.index+headMatch[0].length;
    html=html.slice(0,idx)+'\n'+normalizer+'\n'+html.slice(idx);
  }

  fs.writeFileSync(file,html,'utf8');
}

console.log('MAGIC LIGHT system navigation URLs fixed and legacy system category URLs normalized.');
