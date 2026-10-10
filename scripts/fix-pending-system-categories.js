const fs=require('fs');
const path=require('path');
const dist=path.join(process.cwd(),'dist');
const pages=['produits.html','products.html'];
const marker='magic-light-pending-systems-v1';
const patch=`
<style id="${marker}-style">
body.ml-pending-system #products .card[data-cat],
body.ml-pending-system #adminProductsGrid .card,
body.ml-pending-system .favorites-section,
body.ml-pending-system [class*="favorite"]{display:none!important}
body.ml-pending-system #ml-system-empty{display:block!important}
#ml-system-empty{display:none;max-width:900px;margin:24px auto;padding:30px 20px;text-align:center;border:1px dashed #d9dde3;border-radius:16px;background:#fff;color:#777}
#ml-system-empty strong{display:block;color:#222;font-size:1.1rem;margin-bottom:7px}
</style>
<script id="${marker}">
(function(){
  var q=new URLSearchParams(location.search);
  var c=(q.get('categorie')||'').toLowerCase();
  if(['systeme-43','systeme-45','systeme-44'].indexOf(c)===-1)return;
  document.documentElement.classList.add('ml-pending-system');
  function enforce(){
    if(!document.body)return;
    document.body.classList.add('ml-pending-system');
    document.querySelectorAll('#products .card[data-cat],#adminProductsGrid .card').forEach(function(card){card.style.setProperty('display','none','important')});
    var result=document.querySelector('.ml-filter-result');
    if(result)result.textContent='0 produit dans le catalogue';
    var hero=document.querySelector('.pagehero p');
    if(hero)hero.textContent='0 produit dans cette catégorie pour le moment.';
    var host=document.querySelector('#products .container');
    if(host&&!document.getElementById('ml-system-empty')){
      var empty=document.createElement('div');
      empty.id='ml-system-empty';
      empty.innerHTML='<strong>Aucun produit pour le moment</strong><span>Les produits de cette catégorie seront ajoutés prochainement.</span>';
      var grid=document.querySelector('#products .grid');
      if(grid&&grid.parentNode)grid.parentNode.insertBefore(empty,grid);else host.appendChild(empty);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enforce);else enforce();
  window.addEventListener('load',enforce);
  var observer=new MutationObserver(enforce);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(enforce,100);setTimeout(enforce,500);setTimeout(enforce,1500);
})();
</script>`;
for(const page of pages){
  const file=path.join(dist,page);
  if(!fs.existsSync(file))continue;
  let html=fs.readFileSync(file,'utf8');
  html=html.replace(new RegExp('<style id="'+marker+'-style">[\\s\\S]*?<\\/style>','g'),'');
  html=html.replace(new RegExp('<script id="'+marker+'">[\\s\\S]*?<\\/script>','g'),'');
  html=html.replace(/<\/body>/i,patch+'\n</body>');
  fs.writeFileSync(file,html,'utf8');
}
console.log('MAGIC LIGHT pending systems: System 43/45/44 forced to zero products at render level.');