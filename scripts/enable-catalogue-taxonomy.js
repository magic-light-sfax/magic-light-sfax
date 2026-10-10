const fs=require('fs');
const path=require('path');
const file=path.join(process.cwd(),'dist','produits.html');
if(!fs.existsSync(file)) process.exit(0);
let html=fs.readFileSync(file,'utf8');
const marker='magic-light-taxonomy-v2';
const script=`<script id="${marker}">(function(){
 const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const q=new URLSearchParams(location.search);
 const requested=norm(q.get('categorie'));
 const system=norm(q.get('systeme'));
 if(!requested)return;
 const fields=['category','categorie','famille','family','systeme','system','sous_categorie','sousCategorie','subcategory','sub_category','type','gamme'];
 const vals=p=>fields.flatMap(k=>Array.isArray(p?.[k])?p[k]:[p?.[k]]).filter(Boolean).map(norm);
 const matches=p=>{
   const v=vals(p);
   if(system&&!v.includes(system))return false;
   return v.includes(requested);
 };
 function updateText(n){
   document.querySelectorAll('.ml-filter-result').forEach(el=>el.textContent=n+' produit'+(n===1?'':'s')+' dans cette catégorie');
   const hero=document.querySelector('.pagehero p');if(hero)hero.textContent=n? n+' produit'+(n===1?'':'s')+' dans cette catégorie.':'0 produit dans cette catégorie pour le moment.';
 }
 function empty(n){
   let e=document.getElementById('ml-taxonomy-empty');
   if(n){if(e)e.remove();return;}
   if(e)return;
   const grid=document.getElementById('adminProductsGrid')||document.querySelector('#products .grid');if(!grid)return;
   e=document.createElement('div');e.id='ml-taxonomy-empty';e.className='admin-empty';e.style.cssText='max-width:900px;margin:28px auto;padding:28px 18px;text-align:center;border:1px dashed #d9dde3;border-radius:16px;background:#fff;color:#777';e.innerHTML='<strong style="display:block;color:#222;margin-bottom:7px">0 produit dans cette catégorie pour le moment.</strong>';
   grid.parentNode.insertBefore(e,grid);
 }
 async function render(){
   const host=document.getElementById('adminProductsGrid');if(!host)return;
   try{
     const r=await fetch('/data/products.json?ts='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);
     const all=await r.json();const products=all.filter(matches);
     updateText(products.length);empty(products.length);
     if(!products.length){host.innerHTML='';return;}
     if(typeof card==='function'){host.innerHTML=products.map(card).join('');return;}
     const old=[...host.querySelectorAll('.card')];old.forEach(c=>c.style.display='none');
   }catch(e){console.error('MAGIC LIGHT taxonomy',e);}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
 window.addEventListener('load',()=>setTimeout(render,50),{once:true});
})();</script>`;
html=html.replace(/<script id="magic-light-taxonomy-v[12]">[\s\S]*?<\/script>/g,'');
html=html.replace(/<\/body>/i,script+'\n</body>');
fs.writeFileSync(file,html,'utf8');
console.log('Scalable catalogue taxonomy v2 enabled from product data.');
