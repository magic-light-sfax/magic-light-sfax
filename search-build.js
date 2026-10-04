const fs=require('fs');
const path=require('path');

const dist=path.join(process.cwd(),'dist');
const marker='MAGIC LIGHT search pro';
const css='\n<!-- '+marker+' -->\n<link rel="stylesheet" href="/assets/product-search-pro.css">\n';
const js='\n<!-- '+marker+' -->\n<script src="/assets/product-search-pro.js" defer></script>\n';

for(const file of ['produits.html','products.html']){
  const target=path.join(dist,file);
  if(!fs.existsSync(target)) continue;
  let html=fs.readFileSync(target,'utf8');
  if(!html.includes(marker)){
    html=html.replace(/<\/head>/i,css+'</head>');
    html=html.replace(/<\/body>/i,js+'</body>');
    fs.writeFileSync(target,html,'utf8');
  }
}
console.log('MAGIC LIGHT: recherche produits PRO injectée.');
