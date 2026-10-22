const fs=require('fs');
const path=require('path');

const dist=path.join(process.cwd(),'dist');
if(!fs.existsSync(dist)) process.exit(0);

const marker='magic-light-category-navigation-v6-real-families';
const pages=['index.html','produits.html','products.html','nouveautes.html','references.html','catalogue.html','contact.html'];
const productsFile=path.join(dist,'data','products.json');
if(!fs.existsSync(productsFile)) process.exit(0);

let products=[];
try{ products=JSON.parse(fs.readFileSync(productsFile,'utf8')); }catch(e){ throw new Error('Category navigation: invalid products.json'); }
if(!Array.isArray(products)) products=[];

const slug=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// IMPORTANT: menu entries come only from families that actually have active products.
const counts=new Map();
for(const p of products){
  const family=String(p&&p.famille||'').trim();
  if(!family || family==='À classer') continue;
  counts.set(family,(counts.get(family)||0)+1);
}
const families=[...counts.entries()].sort((a,b)=>a[0].localeCompare(b[0],'fr',{sensitivity:'base',numeric:true}));

const familyLink=(name,count,compact=false)=>{
  const label=esc(name);
  const href=`produits.html?categorie=${encodeURIComponent(slug(name))}`;
  return `<a class="ml-real-family-link" href="${href}"><span>${label}</span>${compact?'':`<small>${count}</small>`}</a>`;
};

const desktop=families.map(([name,count])=>familyLink(name,count,false)).join('');
const mobile=families.map(([name,count])=>familyLink(name,count,true)).join('');

const block=`\n<style id="${marker}">
.ml-category-nav{border-bottom:1px solid #e6e8ec;background:#fff;position:relative;z-index:55}
.ml-category-inner{width:min(1220px,calc(100% - 36px));margin:auto;display:flex;align-items:stretch}
.ml-all-cats{position:relative;width:315px}.ml-all-cats-btn{width:100%;height:52px;border:0;background:#111215;color:#fff;font-weight:950;letter-spacing:.02em;text-align:left;padding:0 18px;cursor:pointer}.ml-all-cats-btn b{color:#f0cf83;margin-right:9px}
.ml-cat-panel{display:none;position:absolute;top:100%;left:0;width:360px;background:#fff;border:1px solid #e6e8ec;box-shadow:0 18px 50px rgba(0,0,0,.13);z-index:90;max-height:72vh;overflow-y:auto;padding:7px}
.ml-all-cats:hover .ml-cat-panel,.ml-all-cats:focus-within .ml-cat-panel{display:block}
.ml-real-family-link{min-height:42px;padding:9px 11px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f0f1f3;font-size:.84rem;font-weight:850;gap:14px}
.ml-real-family-link:hover{color:#a87925;background:#faf8f3}.ml-real-family-link small{min-width:28px;text-align:center;background:#f2f3f5;border-radius:999px;padding:3px 7px;color:#666;font-size:.72rem;font-weight:900}
.ml-cat-shortcuts{display:flex;align-items:center;gap:6px;padding-left:12px}.ml-cat-shortcuts a{font-size:.82rem;font-weight:900;padding:8px 10px}.ml-cat-shortcuts a:hover{color:#a87925}.ml-mobile-cats{display:none}
@media(max-width:900px){.ml-category-inner{width:min(100% - 24px,1220px);display:block;padding:9px 0}.ml-all-cats,.ml-cat-shortcuts{display:none}.ml-mobile-cats{display:block}.ml-mobile-cats>details>summary{list-style:none;cursor:pointer;background:#111215;color:#fff;padding:13px 15px;border-radius:11px;font-weight:950}.ml-mobile-cats summary::-webkit-details-marker{display:none}.ml-mobile-drawer{padding:8px 0 2px}.ml-mobile-drawer .ml-real-family-link{padding:10px 6px;color:#444}.ml-mobile-drawer .ml-real-family-link:hover{color:#a87925}}
</style>
<div class="ml-category-nav" aria-label="Familles produits MAGIC LIGHT"><div class="ml-category-inner"><div class="ml-all-cats"><button class="ml-all-cats-btn" type="button"><b>☰</b> TOUTES NOS FAMILLES</button><div class="ml-cat-panel">${desktop}</div></div><div class="ml-cat-shortcuts"><a href="produits.html">Tous les produits</a><a href="nouveautes.html">Nouveautés</a><a href="produits.html?promo=1">Promotions</a></div><div class="ml-mobile-cats"><details><summary>FAMILLES MAGIC LIGHT <span>＋</span></summary><div class="ml-mobile-drawer">${mobile}<a href="produits.html" style="display:block;padding:13px 7px;font-weight:950;color:#a87925">Tous les produits</a></div></details></div></div></div>\n`;

for(const page of pages){
  const file=path.join(dist,page); if(!fs.existsSync(file)) continue;
  let html=fs.readFileSync(file,'utf8');
  html=html.replace(/\n?<style id="magic-light-category-navigation-v[^\"]*">[\s\S]*?<\/style>\s*<div class="ml-category-nav"[\s\S]*?<\/div><\/div><\/div>\s*/,'\n');
  if(html.includes(marker)) continue;
  const navEnd=html.indexOf('</nav>');
  if(navEnd>=0) html=html.slice(0,navEnd+6)+block+html.slice(navEnd+6);
  else { const headerEnd=html.indexOf('</header>'); if(headerEnd>=0) html=html.slice(0,headerEnd+9)+block+html.slice(headerEnd+9); else continue; }
  fs.writeFileSync(file,html,'utf8');
}
console.log(`MAGIC LIGHT real-family navigation: ${families.length} familles réellement présentes.`);
