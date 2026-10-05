const fs=require('fs');
const path=require('path');

const DIST=path.join(process.cwd(),'dist');
const PAGES=['products.html','produits.html'];
const SCRIPT='\n<script defer src="/assets/product-share.js"></script>\n';

function insertBeforeLastBody(html){
  const lower=html.toLowerCase();
  const idx=lower.lastIndexOf('</body>');
  if(idx===-1) return html+SCRIPT;
  return html.slice(0,idx)+SCRIPT+html.slice(idx);
}

if(!fs.existsSync(DIST)) throw new Error('dist introuvable: exécutez build.js avant enable-product-sharing.js');
let changed=0;
for(const file of PAGES){
  const p=path.join(DIST,file);
  if(!fs.existsSync(p)) continue;
  let html=fs.readFileSync(p,'utf8');
  if(html.includes('/assets/product-share.js')) continue;
  html=insertBeforeLastBody(html);
  fs.writeFileSync(p,html,'utf8');
  changed++;
}
console.log(`MAGIC LIGHT partage produits: ${changed} page(s) activée(s).`);
