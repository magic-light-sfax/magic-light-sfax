const fs=require('fs');
const path=require('path');
const file=path.join(process.cwd(),'dist','produits.html');
if(!fs.existsSync(file)) process.exit(0);
let html=fs.readFileSync(file,'utf8');
const marker='magic-light-taxonomy-v3';
const js=`(function(){
 const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const q=new URLSearchParams(location.search),requested=norm(q.get('categorie')),system=norm(q.get('systeme'));if(!requested)return;
 const fields=['category','categorie','famille','family','systeme','system','sous_categorie','sousCategorie','subcategory','sub_category','type','gamme'];
 const vals=p=>fields.flatMap(k=>Array.isArray(p&&p[k])?p[k]:[p&&p[k]]).filter(Boolean).map(norm);
 const matches=p=>{const v=vals(p);return (!system||v.includes(system))&&v.includes(requested)};
 function updateText(n){document.querySelectorAll('.ml-filter-result').forEach(el=>el.textContent=n+' produit'+(n===1?'':'s')+' dans cette catégorie');const hero=document.querySelector('.pagehero p');if(hero)hero.textContent=n?n+' produit'+(n===1?'':'s')+' dans cette catégorie.':'0 produit dans cette catégorie pour le moment.'}
 function empty(n){let e=document.getElementById('ml-taxonomy-empty');if(n){if(e)e.remove();return}if(e)return;const grid=document.getElementById('adminProductsGrid')||document.querySelector('#products .grid');if(!grid)return;e=document.createElement('div');e.id='ml-taxonomy-empty';e.className='admin-empty';e.style.cssText='max-width:900px;margin:28px auto;padding:28px 18px;text-align:center;border:1px dashed #d9dde3;border-radius:16px;background:#fff;color:#777';e.innerHTML='<strong style="display:block;color:#222;margin-bottom:7px">0 produit dans cette catégorie pour le moment.</strong>';grid.parentNode.insertBefore(e,grid)}
 async function render(){const host=document.getElementById('adminProductsGrid');if(!host)return;try{const r=await fetch('/data/products.json?ts='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const all=await r.json(),products=all.filter(matches);updateText(products.length);empty(products.length);if(!products.length){host.innerHTML='';return}if(typeof card==='function')host.innerHTML=products.map(card).join('')}catch(e){console.error('MAGIC LIGHT taxonomy',e)}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();window.addEventListener('load',()=>setTimeout(render,50),{once:true});
})();`;
// Remove every previous taxonomy injection first.
html=html.replace(/<script id="magic-light-taxonomy-v\d+">[\s\S]*?<\/script>/g,'');
// Inject before the LAST closing body tag. Using lastIndexOf avoids inserting inside
// JavaScript/template strings that may contain the literal text </body>.
const lower=html.toLowerCase();
const pos=lower.lastIndexOf('</body>');
if(pos<0) throw new Error('produits.html has no closing body tag');
const script='\n<script id="'+marker+'">'+js+'<\/script>\n';
html=html.slice(0,pos)+script+html.slice(pos);
fs.writeFileSync(file,html,'utf8');
console.log('Scalable catalogue taxonomy v3 safely injected at final body boundary.');
