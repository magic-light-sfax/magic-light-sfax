const fs = require('fs');
const path = require('path');

const DIST = path.join(process.cwd(), 'dist');
const MARK = 'magic-light-products-final-v3';

const block = `
<style id="${MARK}">
/* PRODUCTS ONLY — final mobile layout for a 1000+ item catalogue */
@media (max-width:900px){
  html body #products .grid,
  html body #adminProductsGrid{
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:7px!important;
    align-items:start!important;
    grid-auto-rows:max-content!important;
  }

  html body #products .card,
  html body #adminProductsGrid .card{
    display:flex!important;
    flex-direction:column!important;
    min-width:0!important;
    min-height:0!important;
    height:auto!important;
    align-self:start!important;
    overflow:hidden!important;
    border-radius:11px!important;
    background:#fff!important;
    box-shadow:0 3px 12px rgba(0,0,0,.055)!important;
    transform:none!important;
  }

  html body #products .card > img,
  html body #adminProductsGrid .card > img{
    display:block!important;
    width:100%!important;
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
    aspect-ratio:4/5!important;
    object-fit:contain!important;
    object-position:center!important;
    background:#fff!important;
    margin:0!important;
  }

  html body #products .card .body,
  html body #adminProductsGrid .card .body{
    display:flex!important;
    flex-direction:column!important;
    min-height:0!important;
    padding:7px!important;
  }

  html body #products .card .badge,
  html body #adminProductsGrid .card .badge{
    max-width:100%!important;
    padding:3px 5px!important;
    border-radius:7px!important;
    font-size:.53rem!important;
    line-height:1.12!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
  }

  html body #products .card h3,
  html body #adminProductsGrid .card h3{
    min-height:2.35em!important;
    margin:5px 0 3px!important;
    font-size:.69rem!important;
    line-height:1.18!important;
    display:-webkit-box!important;
    -webkit-line-clamp:2!important;
    -webkit-box-orient:vertical!important;
    overflow:hidden!important;
  }

  html body #products .card .ref,
  html body #adminProductsGrid .card .ref{
    font-size:.53rem!important;
    line-height:1.15!important;
  }

  html body #products .card p,
  html body #adminProductsGrid .card p{display:none!important}

  html body #products .admin-price,
  html body #adminProductsGrid .admin-price,
  html body #products .promo-price,
  html body #adminProductsGrid .promo-price{
    margin-top:4px!important;
    font-size:.66rem!important;
    line-height:1.15!important;
  }

  html body #products .promo-price .old-price,
  html body #adminProductsGrid .promo-price .old-price{font-size:.55rem!important}
  html body #products .promo-price .new-price,
  html body #adminProductsGrid .promo-price .new-price{font-size:.69rem!important}
  html body #products .promo-badge,
  html body #adminProductsGrid .promo-badge{font-size:.50rem!important;padding:2px 4px!important}

  html body #products .card .actions,
  html body #adminProductsGrid .card .actions{
    display:grid!important;
    grid-template-columns:1fr 1fr!important;
    gap:4px!important;
    margin-top:6px!important;
  }

  html body #products .card .actions .smallbtn,
  html body #adminProductsGrid .card .actions .smallbtn{
    width:100%!important;
    min-width:0!important;
    min-height:29px!important;
    padding:4px 3px!important;
    border-radius:8px!important;
    font-size:.51rem!important;
    line-height:1.05!important;
    white-space:normal!important;
  }

  html body #products .card .actions .smallbtn.primary,
  html body #adminProductsGrid .card .actions .smallbtn.primary{
    grid-column:1/-1!important;
  }
}

@media (max-width:315px){
  html body #products .grid,
  html body #adminProductsGrid{
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
  }
}
</style>
<script id="${MARK}-runtime">
(()=>{
  const isMobile=()=>{
    try{
      return window.innerWidth<=900 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'');
    }catch(e){ return window.innerWidth<=900; }
  };

  function lock(){
    if(!isMobile()) return;
    const grids=[document.querySelector('#products .grid'),document.getElementById('adminProductsGrid')].filter(Boolean);
    grids.forEach(g=>{
      g.style.setProperty('display','grid','important');
      g.style.setProperty('grid-template-columns','repeat(3,minmax(0,1fr))','important');
      g.style.setProperty('gap','7px','important');
      g.style.setProperty('align-items','start','important');
      g.style.setProperty('grid-auto-rows','max-content','important');
    });
    document.querySelectorAll('#products .card,#adminProductsGrid .card').forEach(card=>{
      card.style.setProperty('height','auto','important');
      card.style.setProperty('min-height','0','important');
      card.style.setProperty('align-self','start','important');
      const img=card.querySelector(':scope > img');
      if(img){
        img.style.setProperty('width','100%','important');
        img.style.setProperty('height','auto','important');
        img.style.setProperty('min-height','0','important');
        img.style.setProperty('max-height','none','important');
        img.style.setProperty('aspect-ratio','4 / 5','important');
        img.style.setProperty('object-fit','contain','important');
        img.style.setProperty('background','#fff','important');
      }
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',lock,{once:true}); else lock();
  window.addEventListener('load',lock,{once:true});
  window.addEventListener('resize',()=>{ clearTimeout(window.__mlGridTimer); window.__mlGridTimer=setTimeout(lock,80); });
  const host=document.getElementById('adminProductsGrid');
  if(host) new MutationObserver(lock).observe(host,{childList:true,subtree:true});
})();
</script>`;

function inject(file){
  const name=path.basename(file).toLowerCase();
  if(name!=='products.html' && name!=='produits.html') return false;
  let html=fs.readFileSync(file,'utf8');
  if(html.includes(`id="${MARK}"`)) return false;
  const i=html.toLowerCase().lastIndexOf('</head>');
  if(i<0) return false;
  html=html.slice(0,i)+block+'\n'+html.slice(i);
  fs.writeFileSync(file,html,'utf8');
  return true;
}

let changed=0;
for(const name of ['produits.html','products.html']){
  const file=path.join(DIST,name);
  if(fs.existsSync(file) && inject(file)) changed++;
}
console.log(`MAGIC LIGHT products final v3: ${changed} page(s) locked to compact mobile layout.`);
