const fs=require('fs');
const path=require('path');
const file=path.join(process.cwd(),'dist','produits.html');
if(!fs.existsSync(file)) process.exit(0);
let html=fs.readFileSync(file,'utf8');
const marker='magic-light-taxonomy-v1';
const script=`<script id="${marker}">(function(){
  const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const params=new URLSearchParams(location.search);
  const requested=norm(params.get('categorie')||'');
  if(!requested) return;
  const legacyPending=new Set(['systeme-43','systeme-45','systeme-44']);
  function productPaths(card){
    const btn=card.querySelector('.view-product');
    const values=[
      card.dataset.categorie,card.dataset.category,card.dataset.cat,
      card.dataset.famille,card.dataset.systeme,card.dataset.sousCategorie,card.dataset.subcategory,
      btn?.dataset.categorie,btn?.dataset.category,btn?.dataset.famille,btn?.dataset.systeme,btn?.dataset.sousCategorie,btn?.dataset.subcategory
    ].filter(Boolean);
    return values.map(norm);
  }
  function apply(){
    const cards=[...document.querySelectorAll('.card[data-cat],.admin-product-card')];
    let count=0;
    cards.forEach(card=>{
      const paths=productPaths(card);
      const match=paths.includes(requested);
      card.style.setProperty('display',match?'':'none',match?'':'important');
      if(match) count++;
    });
    document.querySelectorAll('.ml-filter-result').forEach(el=>el.textContent=count+' produit'+(count===1?'':'s')+' dans cette catégorie');
    let empty=document.getElementById('ml-taxonomy-empty');
    if(count===0){
      if(!empty){
        empty=document.createElement('div');empty.id='ml-taxonomy-empty';empty.className='admin-empty';
        empty.style.cssText='max-width:900px;margin:28px auto;padding:28px 18px;text-align:center;border:1px dashed #d9dde3;border-radius:16px;background:#fff;color:#777';
        empty.innerHTML='<strong style="display:block;color:#222;margin-bottom:7px">0 produit dans cette catégorie pour le moment.</strong>';
        const grid=document.getElementById('adminProductsGrid')||document.querySelector('#products .grid');
        if(grid&&grid.parentNode) grid.parentNode.insertBefore(empty,grid);
      }
    } else if(empty) empty.remove();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply); else apply();
  const host=document.getElementById('adminProductsGrid');
  if(host) new MutationObserver(()=>requestAnimationFrame(apply)).observe(host,{childList:true,subtree:true});
  setTimeout(apply,250);setTimeout(apply,900);
})();</script>`;
html=html.replace(new RegExp('<script id="'+marker+'">[\\s\\S]*?<\\/script>','g'),'');
html=html.replace(/<\/body>/i,script+'\n</body>');
fs.writeFileSync(file,html,'utf8');
console.log('Scalable catalogue taxonomy filtering enabled.');
