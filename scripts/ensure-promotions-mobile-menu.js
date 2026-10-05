const fs=require('fs');
const path=require('path');

const dist=path.join(process.cwd(),'dist');
const pages=['index.html','produits.html','products.html','nouveautes.html','references.html','catalogue.html','contact.html'];
const promoLink='<a class="drawer-cat-all" href="produits.html?cat=__promo__#products" data-drawer-filter="__promo__"><span>🔥 Promotions</span><span>›</span></a>';
const allProducts='<a class="drawer-cat-all" href="produits.html#products" data-drawer-filter="all"><span>Tous les produits</span><span>›</span></a>';

let changed=0;
for(const name of pages){
  const file=path.join(dist,name);
  if(!fs.existsSync(file)) continue;
  let html=fs.readFileSync(file,'utf8');
  const panelStart=html.indexOf('class="drawer-categories-panel"');
  if(panelStart<0) continue;
  const panelEnd=html.indexOf('</div>',panelStart);
  const panelSlice=panelEnd>panelStart?html.slice(panelStart,panelEnd):html.slice(panelStart,panelStart+6000);
  if(panelSlice.includes('data-drawer-filter="__promo__"')) continue;

  if(html.includes(allProducts)){
    html=html.replace(allProducts,allProducts+'\n          '+promoLink);
  }else{
    const re=/(<a\b[^>]*class=["'][^"']*drawer-cat-all[^"']*["'][^>]*data-drawer-filter=["']all["'][^>]*>[\s\S]*?<\/a>)/i;
    if(!re.test(html)) continue;
    html=html.replace(re,'$1\n          '+promoLink);
  }

  fs.writeFileSync(file,html,'utf8');
  changed++;
}

console.log(`MAGIC LIGHT mobile menu: Promotions visible on ${changed} page(s).`);
