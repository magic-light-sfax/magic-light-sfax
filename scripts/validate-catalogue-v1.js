const fs=require('fs');
const path=require('path');

const dist=path.join(process.cwd(),'dist');
const pages=['produits.html','products.html'];
const failures=[];

for(const page of pages){
  const file=path.join(dist,page);
  if(!fs.existsSync(file)){failures.push(page+': missing');continue;}
  const html=fs.readFileSync(file,'utf8');

  if(/produits(?:\.html)?\?categorie=systeme-\d+/i.test(html)){
    failures.push(page+': legacy system URL still present');
  }

  const layoutMarkers=[
    'magic-light-products-final-v3',
    'magic-light-products-sanity-v3',
    'magic-light-products-3col-v4'
  ].filter(mark=>html.includes(mark));
  if(layoutMarkers.length!==1 || layoutMarkers[0]!=='magic-light-products-3col-v4'){
    failures.push(page+': expected one mobile layout authority (magic-light-products-3col-v4), found '+layoutMarkers.join(', '));
  }

  const taxonomyScripts=(html.match(/<script id=["']magic-light-final-taxonomy-sync-v\d+["']/g)||[]);
  if(taxonomyScripts.length!==1 || !taxonomyScripts[0].includes('magic-light-final-taxonomy-sync-v4')){
    failures.push(page+': taxonomy finalizer mismatch: '+taxonomyScripts.join(', '));
  }

  if(!html.includes('magic-light-system-url-normalizer-v1')){
    failures.push(page+': system URL normalizer missing');
  }
}

if(failures.length){
  console.error('Nettoyage Catalogue V1 validation FAILED');
  failures.forEach(x=>console.error('- '+x));
  process.exit(1);
}

console.log('Nettoyage Catalogue V1 validation OK: one mobile layout authority, normalized system URLs, one taxonomy finalizer v4.');
