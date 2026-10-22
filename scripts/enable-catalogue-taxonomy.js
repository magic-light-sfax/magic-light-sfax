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
      const taxonomyRequested=taxonomyNorm(taxonomyParams.get('categorie')||taxonomyParams.get('cat'));
      const taxonomySystemRaw=taxonomyNorm(taxonomyParams.get('systeme')||taxonomyParams.get('system'));
      const taxonomySystemSuffix=taxonomyRequested.startsWith('systeme-')?taxonomyRequested.slice(8):'';
      const taxonomyIsSystemRequest=taxonomySystemSuffix!=='' && [...taxonomySystemSuffix].every(ch=>ch>='0'&&ch<='9');
      const taxonomySystem=taxonomySystemRaw || (taxonomyIsSystemRequest?taxonomyRequested:'');
      const taxonomyLeaf=taxonomyIsSystemRequest?'':taxonomyRequested;
      const taxonomyActive=Boolean(taxonomyRequested||taxonomySystemRaw);
      const taxonomySystemAliases=v=>{
        const n=taxonomyNorm(v);
        if(!n) return [];
        const out=[n];
        const suffix=n.startsWith('systeme-')?n.slice(8):n;
        if(suffix && [...suffix].every(ch=>ch>='0'&&ch<='9')) out.push(suffix,'systeme-'+suffix);
        return [...new Set(out)];
      };
      const taxonomyValueAliases=v=>{
        const n=taxonomyNorm(v);
        return n?[n]:[];
      };
      if(taxonomyActive){
        products=products.filter(p=>{
          const systemValues=[p&&p.systeme,p&&p.system].flatMap(taxonomySystemAliases);
          const leafValues=[
            p&&p.category,p&&p.categorie,p&&p.famille,p&&p.family,
            p&&p.sous_categorie,p&&p.sousCategorie,p&&p.subcategory,p&&p.sub_category,
            p&&p.type,p&&p.gamme
          ].flatMap(taxonomyValueAliases);
          const wantedSystems=taxonomySystemAliases(taxonomySystem);
          const systemOk=!taxonomySystem || wantedSystems.some(v=>systemValues.includes(v));
          const leafOk=!taxonomyLeaf || leafValues.includes(taxonomyLeaf);
          return systemOk && leafOk;
        });
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
console.log('MAGIC LIGHT taxonomy v7 enabled: robust direct system, category and subcategory filtering.');