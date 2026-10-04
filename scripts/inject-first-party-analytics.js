const fs=require('fs');
const path=require('path');
const dist=path.join(process.cwd(),'dist');
const pages=['index.html','produits.html','products.html','nouveautes.html','references.html','catalogue.html','contact.html'];
const tag='<script src="/assets/analytics.js" defer></script>';
for(const file of pages){
  const p=path.join(dist,file);
  if(!fs.existsSync(p)) continue;
  let html=fs.readFileSync(p,'utf8');
  if(html.includes('/assets/analytics.js')) continue;
  html=html.replace(/<\/head>/i,tag+'\n</head>');
  fs.writeFileSync(p,html,'utf8');
}
console.log('MAGIC LIGHT first-party analytics injected.');
