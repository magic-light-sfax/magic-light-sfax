const fs=require('fs');
const path=require('path');

const DIST=path.join(process.cwd(),'dist');
const PAGES=['produits.html','products.html'];
const MARK='magic-light-products-3col-v4';

const style=`
<style id="${MARK}">
/* Final authority for the mobile Products catalogue. */
@media (max-width:900px){
  html body #products > .container,
  html body #admin-catalogue > .container{
    width:calc(100% - 10px)!important;
    max-width:none!important;
    margin-left:auto!important;
    margin-right:auto!important;
  }

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
    width:100%!important;
    min-width:0!important;
    height:auto!important;
    min-height:0!important;
    align-self:start!important;
    overflow:hidden!important;
    border-radius:10px!important;
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
    aspect-ratio:auto!important;
    object-fit:contain!important;
    object-position:center!important;
    padding:0!important;
    margin:0!important;
    background:#fff!important;
  }

  html body #products .card .body,
  html body #adminProductsGrid .card .body{
    min-width:0!important;
    padding:6px!important;
  }

  html body #products .card p,
  html body #adminProductsGrid .card p{
    display:none!important;
  }
}
</style>`;

const runtime=`
<script id="${MARK}-runtime">
(()=>{
  function mobile(){
    return window.innerWidth<=900 || document.documentElement.classList.contains('ml-mobile-device');
  }

  function apply(){
    if(!mobile()) return;

    document.querySelectorAll('#products > .container,#admin-catalogue > .container').forEach(c=>{
      c.style.setProperty('width','calc(100% - 10px)','important');
      c.style.setProperty('max-width','none','important');
      c.style.setProperty('margin-left','auto','important');
      c.style.setProperty('margin-right','auto','important');
    });

    document.querySelectorAll('#products .grid,#adminProductsGrid').forEach(g=>{
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

        const img=card.querySelector(':scope > img');
        if(img){
          img.style.setProperty('display','block','important');
          img.style.setProperty('width','100%','important');
          img.style.setProperty('max-width','100%','important');
          img.style.setProperty('height','auto','important');
          img.style.setProperty('min-height','0','important');
          img.style.setProperty('max-height','none','important');
          img.style.setProperty('aspect-ratio','auto','important');
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
    const hosts=[document.getElementById('products'),document.getElementById('admin-catalogue')].filter(Boolean);
    const observer=new MutationObserver(()=>requestAnimationFrame(apply));
    hosts.forEach(host=>observer.observe(host,{childList:true,subtree:true}));
    [60,180,400,800,1500,3000,6000,10000].forEach(ms=>setTimeout(apply,ms));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();

  window.addEventListener('load',apply,{once:true});
  window.addEventListener('pageshow',apply);
  window.addEventListener('orientationchange',()=>setTimeout(apply,120));
  window.addEventListener('resize',()=>{
    clearTimeout(window.__mlProducts3ColLock);
    window.__mlProducts3ColLock=setTimeout(apply,80);
  });
})();
</script>`;

function strip(html){
  const styleRe=new RegExp('\\n?<style id="'+MARK+'">[\\s\\S]*?<\\/style>\\s*','g');
  const scriptRe=new RegExp('\\n?<script id="'+MARK+'-runtime">[\\s\\S]*?<\\/script>\\s*','g');
  return html.replace(styleRe,'\n').replace(scriptRe,'\n');
}

function inject(file){
  let html=strip(fs.readFileSync(file,'utf8'));

  const headEnd=html.toLowerCase().indexOf('</head>');
  if(headEnd<0) throw new Error(`${path.basename(file)}: real </head> not found`);
  html=html.slice(0,headEnd)+style+'\n'+html.slice(headEnd);

  const bodyEnd=html.toLowerCase().lastIndexOf('</body>');
  if(bodyEnd<0) throw new Error(`${path.basename(file)}: final </body> not found`);
  html=html.slice(0,bodyEnd)+runtime+'\n'+html.slice(bodyEnd);

  fs.writeFileSync(file,html,'utf8');
}

for(const name of PAGES){
  const file=path.join(DIST,name);
  if(fs.existsSync(file)) inject(file);
}

console.log('MAGIC LIGHT Products v4: 3 mobile columns locked; images use their natural full width.');
