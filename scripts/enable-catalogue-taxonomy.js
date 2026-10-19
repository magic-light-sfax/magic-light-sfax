const fs=require('fs');
const path=require('path');
const file=path.join(process.cwd(),'dist','produits.html');
if(!fs.existsSync(file)) process.exit(0);
let html=fs.readFileSync(file,'utf8');

const loadNeedle='      let products=await r.json();';
if(!html.includes(loadNeedle)) throw new Error('Taxonomy patch target not found: products load');

const loadReplacement=`      let products=await r.json();
      const taxonomyNorm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      const taxonomyParams=new URLSearchParams(location.search);
      const taxonomyRequested=taxonomyNorm(taxonomyParams.get('categorie'));
      const taxonomySystem=taxonomyNorm(taxonomyParams.get('systeme'));
      const taxonomyActive=Boolean(taxonomyRequested);
      if(taxonomyActive){
        const taxonomyFields=['category','categorie','famille','family','systeme','system','sous_categorie','sousCategorie','subcategory','sub_category','type','gamme'];
        const taxonomyVals=p=>taxonomyFields.flatMap(k=>Array.isArray(p&&p[k])?p[k]:[p&&p[k]]).filter(Boolean).map(taxonomyNorm);
        products=products.filter(p=>{const v=taxonomyVals(p);return (!taxonomySystem||v.includes(taxonomySystem))&&v.includes(taxonomyRequested)});
        const legacyGrid=document.querySelector('#products .container > .grid');
        if(legacyGrid) legacyGrid.style.display='none';
        const n=products.length;
        document.querySelectorAll('.ml-filter-result').forEach(el=>el.textContent=n+' produit'+(n===1?'':'s')+' dans cette catégorie');
        const hero=document.querySelector('.pagehero p');
        if(hero) hero.textContent=n?n+' produit'+(n===1?'':'s')+' dans cette catégorie.':'0 produit dans cette catégorie pour le moment.';
      }`;
html=html.replace(loadNeedle,loadReplacement);

const emptyNeedle=`      if(!products.length){
        host.innerHTML='<div class="admin-empty">Les nouveaux produits ajoutés depuis Admin apparaîtront ici.</div>';
        return;
      }`;
if(!html.includes(emptyNeedle)) throw new Error('Taxonomy patch target not found: empty state');
const emptyReplacement=`      if(!products.length){
        host.innerHTML=taxonomyActive
          ? '<div class="admin-empty"><strong style="display:block;color:#222;margin-bottom:7px">0 produit dans cette catégorie pour le moment.</strong></div>'
          : '<div class="admin-empty">Les nouveaux produits ajoutés depuis Admin apparaîtront ici.</div>';
        return;
      }`;
html=html.replace(emptyNeedle,emptyReplacement);

fs.writeFileSync(file,html,'utf8');
console.log('MAGIC LIGHT taxonomy v5 enabled inside the primary product load: one fetch, one render, no race.');
