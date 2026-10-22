const fs=require('fs');
const path=require('path');

const dist=path.join(process.cwd(),'dist');
const pages=['produits.html','products.html'];
const failures=[];

const requiredCatalogueAssets=[
  'assets/catalogue-search-pro.js',
  'assets/catalogue-filters-pro.js',
  'assets/catalogue-favorites.js',
  'assets/catalogue-compare.js',
  'assets/catalogue-stock.js',
  'assets/catalogue-reviews.js'
];

function countLiteral(haystack,needle){
  if(!needle) return 0;
  return haystack.split(needle).length-1;
}

for(const page of pages){
  const file=path.join(dist,page);
  if(!fs.existsSync(file)){failures.push(page+': missing');continue;}
  const html=fs.readFileSync(file,'utf8');

  if(/produits(?:\.html)?\?categorie=systeme-\d+/i.test(html)) failures.push(page+': legacy system URL still present');

  const layoutMarkers=['magic-light-products-final-v3','magic-light-products-sanity-v3','magic-light-products-3col-v4'].filter(mark=>html.includes(mark));
  if(layoutMarkers.length!==1 || layoutMarkers[0]!=='magic-light-products-3col-v4') failures.push(page+': expected one mobile layout authority (magic-light-products-3col-v4), found '+layoutMarkers.join(', '));

  const taxonomyScripts=(html.match(/<script id=["']magic-light-final-taxonomy-sync-v\d+["']/g)||[]);
  if(taxonomyScripts.length!==1 || !taxonomyScripts[0].includes('magic-light-final-taxonomy-sync-v6')) failures.push(page+': taxonomy finalizer mismatch: '+taxonomyScripts.join(', '));
  if(!html.includes("legacy.style.setProperty('display','none','important')")) failures.push(page+': taxonomy legacy-grid mobile protection missing');

  if(!html.includes('magic-light-system-url-normalizer-v1')) failures.push(page+': system URL normalizer missing');
  if(!html.includes('magic-light-category-navigation-v5')) failures.push(page+': category navigation v5 missing');
  if(!html.includes('magic-light-catalogue-context-nav-v5')) failures.push(page+': polished universal contextual catalogue navigation v5 missing');
  if(!html.includes('Parcourir le catalogue')) failures.push(page+': mobile catalogue trigger missing');

  for(const system of ['43','44','45']){
    if(!html.includes('produits.html?systeme=systeme-'+system)) failures.push(page+': direct Système '+system+' URL missing');
  }
  if(!html.includes('produits.html?categorie=gamme-etanche&systeme=systeme-43')) failures.push(page+': Système 43 / Gamme étanche child URL missing');

  for(const asset of requiredCatalogueAssets){
    const count=countLiteral(html,asset);
    if(count!==1) failures.push(page+': expected '+asset+' exactly once, found '+count);
  }
}

const filterFile=path.join(dist,'assets','catalogue-filters-pro.js');
if(!fs.existsSync(filterFile)) failures.push('assets/catalogue-filters-pro.js: missing');
else{
  const filters=fs.readFileSync(filterFile,'utf8');
  if(!filters.includes('magic-light-catalogue-source-v1')) failures.push('catalogue filters: single-source marker missing');
  if(filters.includes('pendingCategories') || filters.includes('function taxonomyCards()')) failures.push('catalogue filters: legacy multi-source/pending logic still present');
  for(const token of ['data-ml-filter="min"','data-ml-filter="max"','data-ml-filter="promo"','data-ml-filter="available"','data-ml-filter="sort"','price-asc','price-desc','name-asc','name-desc']) if(!filters.includes(token)) failures.push('catalogue filters: missing '+token);
}

const searchFile=path.join(dist,'assets','catalogue-search-pro.js');
if(!fs.existsSync(searchFile) || fs.statSync(searchFile).size<100) failures.push('catalogue search: missing or unexpectedly empty');
const favoritesFile=path.join(dist,'assets','catalogue-favorites.js');
if(!fs.existsSync(favoritesFile) || fs.statSync(favoritesFile).size<100) failures.push('catalogue favorites: missing or unexpectedly empty');

const productsJson=path.join(dist,'data','products.json');
if(!fs.existsSync(productsJson)) failures.push('data/products.json: missing');
else{
  try{
    const products=JSON.parse(fs.readFileSync(productsJson,'utf8'));
    if(!Array.isArray(products) || products.length===0) failures.push('data/products.json: no products');
    const refs=new Set();
    for(const product of Array.isArray(products)?products:[]){
      const ref=String(product.reference||'').trim();
      if(!ref) continue;
      if(refs.has(ref)) failures.push('data/products.json: duplicate reference '+ref);
      refs.add(ref);
    }
  }catch(e){ failures.push('data/products.json: invalid JSON - '+e.message); }
}

if(failures.length){
  console.error('Nettoyage Catalogue V1 validation FAILED');
  failures.forEach(x=>console.error('- '+x));
  process.exit(1);
}

console.log('Nettoyage Catalogue V1 FINAL validation OK: taxonomy v6 protects mobile pages from the legacy all-products grid, one product source, one mobile layout authority, universal catalogue navigation v5, catalogue assets valid, product data readable and references unique.');
