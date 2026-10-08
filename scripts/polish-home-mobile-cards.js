const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'dist', 'index.html');
if (!fs.existsSync(file)) process.exit(0);

let html = fs.readFileSync(file, 'utf8');
const marker = 'home-mobile-cards-pro-v7';

if (!html.includes(marker)) {
  const css = `
<style id="${marker}">
/* MAGIC LIGHT • Home mobile: two clear product cards per row */
@media (max-width:900px), ((max-width:1400px) and (any-pointer:coarse)){
  body .section{padding:22px 0 !important;}
  body .section .container{width:calc(100% - 14px) !important;}
  body .section-head{margin-bottom:10px !important;gap:4px !important;}
  body .section-head h2{font-size:1.16rem !important;line-height:1.15 !important;margin-top:2px !important;}
  body .section-head p{font-size:.70rem !important;line-height:1.32 !important;margin-top:2px !important;}
  body .section-head .see{font-size:.70rem !important;margin-top:1px !important;}

  body .section .grid{
    display:grid !important;
    grid-template-columns:repeat(2,minmax(0,1fr)) !important;
    gap:8px !important;
    align-items:stretch !important;
  }
  body .section .grid .card{
    min-width:0 !important;
    width:100% !important;
    border-radius:12px !important;
    overflow:hidden !important;
    border:1px solid #e3e5e9 !important;
    box-shadow:0 4px 13px rgba(17,18,21,.07) !important;
    display:flex !important;
    flex-direction:column !important;
    background:#fff !important;
  }
  body .section .grid .card img{
    width:100% !important;
    height:auto !important;
    aspect-ratio:1/1 !important;
    object-fit:contain !important;
    object-position:center !important;
    background:#fafafa !important;
    padding:0 !important;
    margin:0 !important;
    border-radius:0 !important;
  }
  body .section .grid .card .body{padding:8px 8px 9px !important;}
  body .section .grid .card .badge{padding:2px 5px !important;font-size:.55rem !important;line-height:1.1 !important;}
  body .section .grid .card h3{font-size:.76rem !important;line-height:1.22 !important;margin:5px 0 2px !important;}
  body .section .grid .card .ref{font-size:.54rem !important;line-height:1.2 !important;}
  body .section .grid .card p:not(.admin-price){
    display:-webkit-box !important;
    -webkit-line-clamp:2 !important;
    -webkit-box-orient:vertical !important;
    overflow:hidden !important;
    font-size:.60rem !important;
    line-height:1.28 !important;
    margin:4px 0 0 !important;
  }
  body .section .grid .card .admin-price{margin:4px 0 0 !important;font-size:.70rem !important;}
  body .section .grid .card .actions{
    margin-top:7px !important;
    padding-top:0 !important;
    display:grid !important;
    grid-template-columns:1fr !important;
    gap:4px !important;
  }
  body .section .grid .card .smallbtn{
    width:100% !important;
    min-height:30px !important;
    padding:5px 4px !important;
    border-radius:8px !important;
    font-size:.59rem !important;
    line-height:1.05 !important;
  }
  body .admin-products-note{margin-bottom:9px !important;padding:7px 8px !important;font-size:.62rem !important;line-height:1.3 !important;}
}
html.ml-mobile-device body .section .grid{
  display:grid !important;
  grid-template-columns:repeat(2,minmax(0,1fr)) !important;
  gap:8px !important;
}
html.ml-mobile-device body .section .grid .card{width:100% !important;min-width:0 !important;}
html.ml-mobile-device body .section .grid .card img{width:100% !important;height:auto !important;aspect-ratio:1/1 !important;object-fit:contain !important;}
</style>
`;

  const js = `
<script id="${marker}-runtime">
(function(){
  function isMobileLayout(){
    try{
      var ua=navigator.userAgent||'';
      var coarse=!!(window.matchMedia&&window.matchMedia('(any-pointer:coarse)').matches);
      return document.documentElement.classList.contains('ml-mobile-device') || coarse || window.innerWidth<=900 || /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i.test(ua);
    }catch(e){ return false; }
  }
  function apply(){
    if(!isMobileLayout()) return;
    document.documentElement.classList.add('ml-mobile-device');
    document.querySelectorAll('.section .grid').forEach(function(grid){
      if(!grid.querySelector('.card')) return;
      grid.style.setProperty('display','grid','important');
      grid.style.setProperty('grid-template-columns','repeat(2, minmax(0, 1fr))','important');
      grid.style.setProperty('gap','8px','important');
      grid.querySelectorAll('.card').forEach(function(card){
        card.style.setProperty('width','100%','important');
        card.style.setProperty('min-width','0','important');
        var img=card.querySelector('img');
        if(img){
          img.style.setProperty('width','100%','important');
          img.style.setProperty('height','auto','important');
          img.style.setProperty('aspect-ratio','1 / 1','important');
          img.style.setProperty('object-fit','contain','important');
        }
      });
    });
  }
  apply();
  document.addEventListener('DOMContentLoaded',apply);
  window.addEventListener('load',apply);
  window.addEventListener('resize',apply);
  setTimeout(apply,250);
  setTimeout(apply,1000);
  try{ new MutationObserver(apply).observe(document.body,{childList:true,subtree:true}); }catch(e){}
})();
</script>
`;

  html = html.replace('</head>', `${css}</head>`);
  html = html.replace('</body>', `${js}</body>`);
  fs.writeFileSync(file, html, 'utf8');
  console.log('MAGIC LIGHT Home mobile cards set to two columns v7.');
}
