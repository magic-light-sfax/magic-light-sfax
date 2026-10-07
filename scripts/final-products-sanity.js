const fs = require('fs');
const path = require('path');

const DIST = path.join(process.cwd(), 'dist');
const PAGES = ['produits.html', 'products.html'];
const MARK = 'magic-light-products-sanity-v3';

const style = `
<style id="${MARK}">
/* MAGIC LIGHT — Products mobile catalogue: 3 compact cards per row. */
@media (max-width:900px){
  html body #products > .container,
  html body #admin-catalogue > .container{
    width:calc(100% - 10px)!important;
    max-width:none!important;
    margin-left:auto!important;
    margin-right:auto!important;
  }

  html body #products > .container > .grid,
  html body #products .grid,
  html body #adminProductsGrid{
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:7px!important;
    align-items:start!important;
    grid-auto-flow:row!important;
    grid-auto-rows:max-content!important;
    width:100%!important;
    max-width:none!important;
  }

  html body #products .card,
  html body #adminProductsGrid .card{
    display:flex!important;
    flex-direction:column!important;
    min-width:0!important;
    width:100%!important;
    min-height:0!important;
    height:auto!important;
    align-self:start!important;
    overflow:hidden!important;
    border-radius:10px!important;
    border:1px solid #e5e7eb!important;
    background:#fff!important;
    box-shadow:0 2px 8px rgba(0,0,0,.055)!important;
    transform:none!important;
  }

  html body #products .card > img,
  html body #adminProductsGrid .card > img{
    display:block!important;
    width:100%!important;
    max-width:100%!important;
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
    aspect-ratio:4/5!important;
    object-fit:contain!important;
    object-position:center!important;
    padding:0!important;
    margin:0!important;
    background:#fff!important;
  }

  html body #products .card .body,
  html body #adminProductsGrid .card .body{
    display:flex!important;
    flex-direction:column!important;
    min-width:0!important;
    min-height:0!important;
    padding:6px!important;
  }

  html body #products .card .badge,
  html body #adminProductsGrid .card .badge{
    display:block!important;
    max-width:100%!important;
    padding:2px 4px!important;
    border-radius:6px!important;
    font-size:.49rem!important;
    line-height:1.08!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
  }

  html body #products .card h3,
  html body #adminProductsGrid .card h3{
    min-height:2.3em!important;
    margin:4px 0 2px!important;
    font-size:.65rem!important;
    line-height:1.15!important;
    display:-webkit-box!important;
    -webkit-line-clamp:2!important;
    -webkit-box-orient:vertical!important;
    overflow:hidden!important;
  }

  html body #products .card .ref,
  html body #adminProductsGrid .card .ref{
    font-size:.49rem!important;
    line-height:1.1!important;
  }

  html body #products .card p,
  html body #adminProductsGrid .card p{
    display:none!important;
  }

  html body #products .admin-price,
  html body #adminProductsGrid .admin-price,
  html body #products .promo-price,
  html body #adminProductsGrid .promo-price{
    margin-top:3px!important;
    font-size:.61rem!important;
    line-height:1.08!important;
  }

  html body #products .promo-price .old-price,
  html body #adminProductsGrid .promo-price .old-price{
    font-size:.49rem!important;
  }

  html body #products .promo-price .new-price,
  html body #adminProductsGrid .promo-price .new-price{
    font-size:.64rem!important;
  }

  html body #products .promo-badge,
  html body #adminProductsGrid .promo-badge{
    font-size:.45rem!important;
    padding:2px 3px!important;
  }

  html body #products .card .actions,
  html body #adminProductsGrid .card .actions{
    display:grid!important;
    grid-template-columns:1fr!important;
    gap:3px!important;
    margin-top:5px!important;
  }

  html body #products .card .actions .smallbtn,
  html body #adminProductsGrid .card .actions .smallbtn{
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
    width:100%!important;
    min-width:0!important;
    min-height:25px!important;
    padding:3px 2px!important;
    border-radius:7px!important;
    font-size:.47rem!important;
    line-height:1.03!important;
    white-space:normal!important;
    text-align:center!important;
  }
}
</style>`;

const runtime = `
<script id="${MARK}-runtime">
(()=>{
  const MOBILE_MAX=900;

  function allProductGrids(){
    const list=[];
    document.querySelectorAll('#products .grid,#adminProductsGrid').forEach(g=>{
      if(g && !list.includes(g)) list.push(g);
    });
    return list;
  }

  function apply(){
    if(window.innerWidth>MOBILE_MAX) return;

    document.querySelectorAll('#products > .container,#admin-catalogue > .container').forEach(c=>{
      c.style.setProperty('width','calc(100% - 10px)','important');
      c.style.setProperty('max-width','none','important');
      c.style.setProperty('margin-left','auto','important');
      c.style.setProperty('margin-right','auto','important');
    });

    allProductGrids().forEach(g=>{
      g.dataset.magicLightColumns='3';
      g.style.setProperty('display','grid','important');
      g.style.setProperty('grid-template-columns','repeat(3,minmax(0,1fr))','important');
      g.style.setProperty('gap','7px','important');
      g.style.setProperty('align-items','start','important');
      g.style.setProperty('grid-auto-flow','row','important');
      g.style.setProperty('grid-auto-rows','max-content','important');
      g.style.setProperty('width','100%','important');
      g.style.setProperty('max-width','none','important');

      g.querySelectorAll(':scope > .card').forEach(card=>{
        card.style.setProperty('display','flex','important');
        card.style.setProperty('flex-direction','column','important');
        card.style.setProperty('width','100%','important');
        card.style.setProperty('min-width','0','important');
        card.style.setProperty('height','auto','important');
        card.style.setProperty('min-height','0','important');
        card.style.setProperty('align-self','start','important');
        card.style.setProperty('overflow','hidden','important');

        const img=card.querySelector(':scope > img');
        if(img){
          img.style.setProperty('display','block','important');
          img.style.setProperty('width','100%','important');
          img.style.setProperty('max-width','100%','important');
          img.style.setProperty('height','auto','important');
          img.style.setProperty('min-height','0','important');
          img.style.setProperty('max-height','none','important');
          img.style.setProperty('aspect-ratio','4 / 5','important');
          img.style.setProperty('object-fit','contain','important');
          img.style.setProperty('object-position','center','important');
          img.style.setProperty('padding','0','important');
          img.style.setProperty('margin','0','important');
          img.style.setProperty('background','#fff','important');
        }
      });
    });
  }

  function start(){
    apply();
    const observer=new MutationObserver(()=>requestAnimationFrame(apply));
    document.querySelectorAll('#products,#admin-catalogue').forEach(host=>{
      observer.observe(host,{childList:true,subtree:true});
    });
    [80,250,600,1200,2500,5000].forEach(ms=>setTimeout(apply,ms));
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',start,{once:true});
  }else{
    start();
  }

  window.addEventListener('load',apply,{once:true});
  window.addEventListener('pageshow',apply);
  window.addEventListener('resize',()=>{
    clearTimeout(window.__magicLightProducts3ColsTimer);
    window.__magicLightProducts3ColsTimer=setTimeout(apply,80);
  });
})();
</script>`;

function stripInjectedPass(html, mark){
  const styleRe = new RegExp('\\n?<style id="'+mark+'">[\\s\\S]*?<\\/style>\\s*','g');
  const scriptRe = new RegExp('\\n?<script id="'+mark+'-runtime">[\\s\\S]*?<\\/script>\\s*','g');
  return html.replace(styleRe,'\n').replace(scriptRe,'\n');
}

function inject(file){
  let html=fs.readFileSync(file,'utf8');

  for(const oldMark of [
    'magic-light-products-final-v3',
    'magic-light-products-sanity-v1',
    'magic-light-products-sanity-v2',
    'magic-light-products-sanity-v3'
  ]){
    html=stripInjectedPass(html,oldMark);
  }

  /* IMPORTANT: use the FIRST real </head>. The page contains another </head>
     inside the printable cart template later in the body. */
  const lower=html.toLowerCase();
  const headEnd=lower.indexOf('</head>');
  if(headEnd<0) throw new Error(`${path.basename(file)}: </head> introuvable`);
  html=html.slice(0,headEnd)+style+'\n'+html.slice(headEnd);

  const bodyEnd=html.toLowerCase().lastIndexOf('</body>');
  if(bodyEnd<0) throw new Error(`${path.basename(file)}: </body> final introuvable`);
  html=html.slice(0,bodyEnd)+runtime+'\n'+html.slice(bodyEnd);

  fs.writeFileSync(file,html,'utf8');
}

for(const name of PAGES){
  const file=path.join(DIST,name);
  if(fs.existsSync(file)) inject(file);
}

console.log('MAGIC LIGHT Products sanity v3: real-head CSS + forced 3-column mobile grid.');
