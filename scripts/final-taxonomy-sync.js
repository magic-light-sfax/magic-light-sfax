const fs=require('fs');
const path=require('path');
const pages=['produits.html','products.html'];
const dist=path.join(process.cwd(),'dist');
const marker='magic-light-final-taxonomy-sync-v1';
const patch=`\n<script id="${marker}">\n(function(){\n  var params=new URLSearchParams(location.search);\n  var active=Boolean(params.get('categorie')||params.get('cat')||params.get('systeme')||params.get('system'));\n  if(!active) return;\n  function sync(){\n    var adminGrid=document.getElementById('adminProductsGrid');\n    if(!adminGrid) return;\n    var cards=[].slice.call(adminGrid.querySelectorAll('.card'));\n    var n=cards.length;\n    var legacy=document.querySelector('#products .container > .grid');\n    if(legacy) legacy.style.display='none';\n    var adminSection=document.getElementById('admin-catalogue');\n    if(adminSection) adminSection.style.display=n?'':'none';\n    document.querySelectorAll('.ml-filter-result').forEach(function(el){\n      el.textContent=n+' produit'+(n===1?'':'s')+' dans cette catégorie';\n    });\n    var hero=document.querySelector('.pagehero p');\n    if(hero) hero.textContent=n?n+' produit'+(n===1?'':'s')+' dans cette catégorie.':'0 produit dans cette catégorie pour le moment.';\n    ['ml-category-empty','ml-system-empty'].forEach(function(id){\n      var el=document.getElementById(id);\n      if(el && n) el.remove();\n    });\n    document.documentElement.classList.remove('ml-pending-system');\n    document.body&&document.body.classList.remove('ml-pending-system');\n    cards.forEach(function(card){\n      card.classList.remove('ml-advanced-hidden');\n      card.style.removeProperty('display');\n    });\n  }\n  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',sync,{once:true}); else sync();\n  window.addEventListener('load',sync);\n  var grid=document.getElementById('adminProductsGrid');\n  if(grid) new MutationObserver(function(){setTimeout(sync,0)}).observe(grid,{childList:true,subtree:true});\n  setTimeout(sync,100); setTimeout(sync,400); setTimeout(sync,1200);\n})();\n</script>\n`;
for(const page of pages){
  const file=path.join(dist,page);
  if(!fs.existsSync(file)) continue;
  let html=fs.readFileSync(file,'utf8');
  html=html.replace(/<script id="magic-light-final-taxonomy-sync-v\d+">[\s\S]*?<\/script>/g,'');
  const idx=html.toLowerCase().lastIndexOf('</body>');
  if(idx<0) throw new Error('final-taxonomy-sync: </body> not found in '+page);
  html=html.slice(0,idx)+patch+html.slice(idx);
  fs.writeFileSync(file,html,'utf8');
}
console.log('MAGIC LIGHT final taxonomy sync enabled.');
