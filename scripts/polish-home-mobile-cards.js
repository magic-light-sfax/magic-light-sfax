const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'dist', 'index.html');
if (!fs.existsSync(file)) process.exit(0);

let html = fs.readFileSync(file, 'utf8');
const marker = 'home-mobile-cards-pro-v6';

if (!html.includes(marker)) {
  const css = `
<style id="${marker}">
/* MAGIC LIGHT • compact professional Home mobile cards */
@media (max-width:900px), ((max-width:1400px) and (any-pointer:coarse)){
  body .section{padding:24px 0 !important;}
  body .section .container{width:calc(100% - 18px) !important;}
  body .section-head{margin-bottom:11px !important;gap:4px !important;}
  body .section-head h2{font-size:1.22rem !important;line-height:1.15 !important;margin-top:2px !important;}
  body .section-head p{font-size:.74rem !important;line-height:1.35 !important;margin-top:2px !important;}
  body .section-head .see{font-size:.74rem !important;margin-top:1px !important;}

  body .section .grid{
    display:grid !important;
    grid-template-columns:minmax(0,1fr) !important;
    gap:10px !important;
    align-items:stretch !important;
  }
  body .section .grid .card{
    min-width:0 !important;
    width:100% !important;
    border-radius:14px !important;
    overflow:hidden !important;
    border:1px solid #e3e5e9 !important;
    box-shadow:0 5px 16px rgba(17,18,21,.07) !important;
    display:flex !important;
    flex-direction:column !important;
    background:#fff !important;
  }
  body .section .grid .card img{
    width:100% !important;
    height:210px !important;
    aspect-ratio:auto !important;
    object-fit:contain !important;
    object-position:center !important;
    background:#fafafa !important;
    padding:0 !important;
    margin:0 !important;
    border-radius:0 !important;
  }
  body .section .grid .card .body{
    padding:10px 12px 11px !important;
  }
  body .section .grid .card .badge{
    padding:3px 7px !important;
    font-size:.63rem !important;
    line-height:1.15 !important;
  }
  body .section .grid .card h3{
    font-size:.92rem !important;
    line-height:1.25 !important;
    margin:6px 0 3px !important;
  }
  body .section .grid .card .ref{
    font-size:.62rem !important;
    line-height:1.25 !important;
  }
  body .section .grid .card p:not(.admin-price){
    display:-webkit-box !important;
    -webkit-line-clamp:2 !important;
    -webkit-box-orient:vertical !important;
    overflow:hidden !important;
    font-size:.72rem !important;
    line-height:1.35 !important;
    margin:5px 0 0 !important;
  }
  body .section .grid .card .admin-price{
    margin:5px 0 0 !important;
    font-size:.84rem !important;
  }
  body .section .grid .card .actions{
    margin-top:8px !important;
    padding-top:0 !important;
    display:grid !important;
    grid-template-columns:1fr 1fr !important;
    gap:6px !important;
  }
  body .section .grid .card .smallbtn{
    width:100% !important;
    min-height:36px !important;
    padding:6px 8px !important;
    border-radius:9px !important;
    font-size:.70rem !important;
    line-height:1.1 !important;
  }
  body .admin-products-note{
    margin-bottom:10px !important;
    padding:8px 10px !important;
    font-size:.68rem !important;
    line-height:1.35 !important;
  }
}

/* Phones using a wide/desktop viewport still get the same compact mobile cards. */
html.ml-mobile-device body .section .grid{
  display:grid !important;
  grid-template-columns:minmax(0,1fr) !important;
  gap:10px !important;
}
html.ml-mobile-device body .section .grid .card{
  width:100% !important;
  min-width:0 !important;
}
html.ml-mobile-device body .section .grid .card img{
  width:100% !important;
  height:210px !important;
  object-fit:contain !important;
}
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
      grid.style.setProperty('grid-template-columns','minmax(0, 1fr)','important');
      grid.style.setProperty('gap','10px','important');
      grid.querySelectorAll('.card').forEach(function(card){
        card.style.setProperty('width','100%','important');
        card.style.setProperty('min-width','0','important');
        var img=card.querySelector('img');
        if(img){
          img.style.setProperty('width','100%','important');
          img.style.setProperty('height','210px','important');
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
  console.log('MAGIC LIGHT Home mobile cards compacted v6.');
}
