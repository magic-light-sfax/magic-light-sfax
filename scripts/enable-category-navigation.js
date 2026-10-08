const fs=require('fs');
const path=require('path');

const dist=path.join(process.cwd(),'dist');
if(!fs.existsSync(dist)) process.exit(0);

const marker='magic-light-category-navigation-v1';
const pages=['index.html','produits.html','products.html','nouveautes.html','references.html','catalogue.html','contact.html'];

const categories=[
  ['Électricité domestique',['Protection électrique','Disjoncteurs','Interrupteurs différentiels','Appareillage domestique','Interrupteurs & prises','Tableaux & coffrets']],
  ['Électricité industrielle',['Appareillage industriel','Protection & commande','Contacteurs','Variateurs de fréquence','Connexion industrielle','Automatismes']],
  ['Éclairage',['Spots LED / GU10 / MR16','Lampes & ampoules','Lustres & suspensions','Appliques murales','Rubans & profilés LED','Panneaux LED','Éclairage extérieur','Éclairage industriel','Éclairage solaire']],
  ['Relais & temporisateurs',['Relais de protection','Compteurs électroniques','Régulateurs de température','Détecteurs mouvement / présence','Interrupteurs horaires']],
  ['Câbles, fils & conduites',['Câbles électriques','Fils électriques','Conduites & gaines','Chemins de câble & goulottes','Boîtes résine & gaine thermo']],
  ['Onduleurs & stabilisateurs',['Onduleurs','Stabilisateurs de tension']],
  ['Photovoltaïque',['Panneaux solaires','Onduleurs solaires','Protection photovoltaïque','Accessoires solaires']],
  ['Accessoires & outillage',['Outillage électrique','Accessoires de montage','Connectique']],
  ['Instruments de mesure',['Multimètres','Pinces ampèremétriques','Testeurs & mesure']],
  ['Sécurité & communication',['Caméras de surveillance','Interphones','Réseau & communication']],
  ['Bornes de recharge',['Bornes de recharge électrique','Accessoires de recharge']],
  ['Armoires & coffrets',['Armoires industrielles','Coffrets électriques','Accessoires armoires']]
];

const slug=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const href=s=>`produits.html?categorie=${encodeURIComponent(slug(s))}`;

const desktop=categories.map(([name,subs])=>`<div class="ml-cat-item"><a href="${href(name)}">${name}<span>›</span></a><div class="ml-cat-sub"><h3>${name}</h3><div class="ml-cat-subgrid">${subs.map(s=>`<a href="${href(s)}">${s}</a>`).join('')}</div></div></div>`).join('');
const mobile=categories.map(([name,subs],i)=>`<details class="ml-cat-mobile"><summary>${name}<span>+</span></summary><div>${subs.map(s=>`<a href="${href(s)}">${s}</a>`).join('')}</div></details>`).join('');

const block=`\n<style id="${marker}">
.ml-category-nav{border-bottom:1px solid #e6e8ec;background:#fff;position:relative;z-index:55}.ml-category-inner{width:min(1220px,calc(100% - 36px));margin:auto;display:flex;align-items:stretch}.ml-all-cats{position:relative;width:285px}.ml-all-cats-btn{width:100%;height:52px;border:0;background:#111215;color:#fff;font-weight:950;letter-spacing:.02em;text-align:left;padding:0 18px;cursor:pointer}.ml-all-cats-btn b{color:#f0cf83;margin-right:9px}.ml-cat-panel{display:none;position:absolute;top:100%;left:0;width:285px;background:#fff;border:1px solid #e6e8ec;box-shadow:0 18px 50px rgba(0,0,0,.13);z-index:90}.ml-all-cats:hover .ml-cat-panel,.ml-all-cats:focus-within .ml-cat-panel{display:block}.ml-cat-item>a{min-height:43px;padding:9px 13px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f0f1f3;font-size:.84rem;font-weight:800}.ml-cat-item:hover>a{color:#a87925;background:#faf8f3}.ml-cat-sub{display:none;position:absolute;left:100%;top:0;width:560px;min-height:100%;background:#fff;border:1px solid #e6e8ec;box-shadow:18px 18px 45px rgba(0,0,0,.10);padding:22px}.ml-cat-item:hover .ml-cat-sub{display:block}.ml-cat-sub h3{margin:0 0 15px;color:#a87925}.ml-cat-subgrid{display:grid;grid-template-columns:1fr 1fr;gap:4px 18px}.ml-cat-subgrid a{padding:9px 5px;border-bottom:1px solid #f1f2f4;font-size:.86rem;font-weight:750}.ml-cat-subgrid a:hover{color:#a87925}.ml-cat-shortcuts{display:flex;align-items:center;gap:6px;padding-left:12px}.ml-cat-shortcuts a{font-size:.82rem;font-weight:900;padding:8px 10px}.ml-cat-shortcuts a:hover{color:#a87925}.ml-mobile-cats{display:none}
@media(max-width:900px){.ml-category-inner{width:min(100% - 24px,1220px);display:block;padding:9px 0}.ml-all-cats,.ml-cat-shortcuts{display:none}.ml-mobile-cats{display:block}.ml-mobile-cats>details>summary{list-style:none;cursor:pointer;background:#111215;color:#fff;padding:13px 15px;border-radius:11px;font-weight:950}.ml-mobile-cats>details>summary::-webkit-details-marker{display:none}.ml-mobile-drawer{padding:8px 0 2px}.ml-cat-mobile{border-bottom:1px solid #eceef1}.ml-cat-mobile summary{list-style:none;cursor:pointer;padding:12px 7px;display:flex;justify-content:space-between;font-weight:850;font-size:.88rem}.ml-cat-mobile summary::-webkit-details-marker{display:none}.ml-cat-mobile[open] summary{color:#a87925}.ml-cat-mobile div{padding:0 8px 10px 16px}.ml-cat-mobile a{display:block;padding:8px 5px;color:#555;font-size:.84rem}.ml-cat-mobile a:hover{color:#a87925}}
</style>
<div class="ml-category-nav" aria-label="Catégories MAGIC LIGHT"><div class="ml-category-inner"><div class="ml-all-cats"><button class="ml-all-cats-btn" type="button"><b>☰</b> TOUTES NOS CATÉGORIES</button><div class="ml-cat-panel">${desktop}</div></div><div class="ml-cat-shortcuts"><a href="produits.html">Tous les produits</a><a href="nouveautes.html">Nouveautés</a><a href="produits.html?promo=1">Promotions</a></div><div class="ml-mobile-cats"><details><summary>CATÉGORIES MAGIC LIGHT <span>＋</span></summary><div class="ml-mobile-drawer">${mobile}<a href="produits.html" style="display:block;padding:13px 7px;font-weight:950;color:#a87925">Tous les produits</a></div></details></div></div></div>\n`;

for(const page of pages){
 const file=path.join(dist,page); if(!fs.existsSync(file)) continue;
 let html=fs.readFileSync(file,'utf8'); if(html.includes(marker)) continue;
 const navEnd=html.indexOf('</nav>');
 if(navEnd>=0) html=html.slice(0,navEnd+6)+block+html.slice(navEnd+6);
 else {
   const headerEnd=html.indexOf('</header>');
   if(headerEnd>=0) html=html.slice(0,headerEnd+9)+block+html.slice(headerEnd+9);
   else continue;
 }
 fs.writeFileSync(file,html,'utf8');
}
console.log('MAGIC LIGHT structured category navigation enabled.');
