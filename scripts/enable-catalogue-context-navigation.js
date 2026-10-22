const fs=require('fs');
const path=require('path');

const dist=path.join(process.cwd(),'dist');
const pages=['produits.html','products.html'];
const marker='magic-light-catalogue-context-nav-v1';

const block=`\n<style id="${marker}-style">\n.ml-context-nav{position:sticky;top:0;z-index:48;background:rgba(255,255,255,.96);backdrop-filter:blur(10px);border-bottom:1px solid #e6e8ec;box-shadow:0 4px 14px rgba(0,0,0,.05)}\n.ml-context-inner{width:min(1220px,calc(100% - 36px));margin:auto;padding:10px 0;display:flex;flex-wrap:wrap;align-items:center;gap:8px}\n.ml-context-label{font-size:.78rem;font-weight:900;color:#6b7280;margin-right:2px}\n.ml-context-link,.ml-context-action{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:7px 12px;border:1px solid #dfe3e8;border-radius:999px;background:#fff;color:#222;font-size:.82rem;font-weight:850;text-decoration:none;white-space:nowrap}\n.ml-context-link:hover,.ml-context-action:hover{border-color:#b98a35;color:#9b6c1e}\n.ml-context-link.is-active{background:#111215;color:#fff;border-color:#111215}\n.ml-context-sep{width:1px;height:28px;background:#e3e6ea;margin:0 2px}\n.ml-context-subrow{display:flex;flex-wrap:wrap;align-items:center;gap:7px;width:100%;padding-top:2px}\n@media(max-width:900px){.ml-context-nav{top:0}.ml-context-inner{width:100%;padding:9px 12px;gap:6px;overflow-x:auto;flex-wrap:nowrap;scrollbar-width:none}.ml-context-inner::-webkit-scrollbar{display:none}.ml-context-label{display:none}.ml-context-sep{flex:0 0 1px}.ml-context-link,.ml-context-action{flex:0 0 auto;font-size:.78rem;padding:7px 10px}.ml-context-subrow{display:none}}\n</style>\n<script id="${marker}">\n(function(){\n  var params=new URLSearchParams(location.search);\n  var system=(params.get('systeme')||params.get('system')||'').toLowerCase();\n  var category=(params.get('categorie')||params.get('cat')||'').toLowerCase();\n  if(!system && !category) return;\n\n  var systems=[\n    {slug:'systeme-43',label:'Système 43'},\n    {slug:'systeme-44',label:'Système 44'},\n    {slug:'systeme-45',label:'Système 45'}\n  ];\n  var children43=[\n    ['plaques-murales','Plaques murales'],\n    ['prises','Prises'],\n    ['interrupteurs','Interrupteurs'],\n    ['gamme-etanche','Gamme étanche'],\n    ['boites','Boîtes'],\n    ['montures','Montures']\n  ];\n\n  function esc(s){return String(s).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#039;'}[c]})}\n  var host=document.createElement('div');\n  host.className='ml-context-nav';\n  host.setAttribute('aria-label','Navigation rapide du catalogue');\n\n  var html='<div class="ml-context-inner">';\n  html+='<button type="button" class="ml-context-action" data-ml-open-categories>☰ Catégories</button>';
  html+='<a class="ml-context-action" href="produits.html">Tous les produits</a>';
  html+='<span class="ml-context-sep"></span><span class="ml-context-label">Systèmes</span>';
  systems.forEach(function(s){\n    html+='<a class="ml-context-link '+(system===s.slug?'is-active':'')+'" href="produits.html?systeme='+encodeURIComponent(s.slug)+'">'+esc(s.label)+'</a>';
  });\n  if(system==='systeme-43'){\n    html+='<div class="ml-context-subrow"><span class="ml-context-label">Système 43</span>';
    children43.forEach(function(c){\n      html+='<a class="ml-context-link '+(category===c[0]?'is-active':'')+'" href="produits.html?categorie='+encodeURIComponent(c[0])+'&systeme=systeme-43">'+esc(c[1])+'</a>';
    });\n    html+='</div>';
  }\n  html+='</div>';
  host.innerHTML=html;\n\n  var categoryNav=document.querySelector('.ml-category-nav');\n  if(categoryNav && categoryNav.parentNode) categoryNav.parentNode.insertBefore(host,categoryNav.nextSibling);\n  else {\n    var nav=document.querySelector('nav');\n    if(nav && nav.parentNode) nav.parentNode.insertBefore(host,nav.nextSibling);\n  }\n\n  host.querySelector('[data-ml-open-categories]')?.addEventListener('click',function(){\n    var mobile=document.querySelector('.ml-mobile-cats>details');\n    if(mobile){mobile.open=true;mobile.scrollIntoView({behavior:'smooth',block:'start'});return;}\n    var cats=document.querySelector('.ml-all-cats');\n    if(cats){cats.scrollIntoView({behavior:'smooth',block:'start'});cats.querySelector('.ml-all-cats-btn')?.focus();}\n  });\n})();\n</script>\n`;

for(const page of pages){
  const file=path.join(dist,page);
  if(!fs.existsSync(file)) continue;
  let html=fs.readFileSync(file,'utf8');
  html=html.replace(/<style id="magic-light-catalogue-context-nav-v\d+-style">[\s\S]*?<\/style>\s*<script id="magic-light-catalogue-context-nav-v\d+">[\s\S]*?<\/script>/g,'');
  const idx=html.toLowerCase().lastIndexOf('</body>');
  if(idx<0) throw new Error('catalogue context navigation: </body> missing in '+page);
  html=html.slice(0,idx)+block+html.slice(idx);
  fs.writeFileSync(file,html,'utf8');
}
console.log('MAGIC LIGHT catalogue context navigation v1 enabled.');
