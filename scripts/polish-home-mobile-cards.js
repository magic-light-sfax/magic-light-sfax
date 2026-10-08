const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'dist', 'index.html');
if (!fs.existsSync(file)) process.exit(0);

let html = fs.readFileSync(file, 'utf8');
const marker = 'home-mobile-cards-pro-v4';

if (!html.includes(marker)) {
  const css = `
<style id="${marker}">
/* MAGIC LIGHT • Home mobile/tablet product cards */
@media (max-width:900px){
  body .section{padding:30px 0 !important;}
  body .section .container{width:calc(100% - 18px) !important;}
  body .section-head{margin-bottom:14px !important;gap:5px !important;}
  body .section-head h2{font-size:1.34rem !important;line-height:1.15 !important;margin-top:2px !important;}
  body .section-head p{font-size:.78rem !important;line-height:1.4 !important;margin-top:3px !important;}
  body .section-head .see{font-size:.78rem !important;margin-top:2px !important;}

  body .section .grid{
    display:grid !important;
    grid-template-columns:minmax(0,1fr) !important;
    gap:14px !important;
    align-items:stretch !important;
  }
  body .section .grid .card{
    min-width:0 !important;
    border-radius:16px !important;
    overflow:hidden !important;
    border:1px solid #e1e4e8 !important;
    box-shadow:0 8px 24px rgba(17,18,21,.09) !important;
    display:flex !important;
    flex-direction:column !important;
    background:#fff !important;
  }
  body .section .grid .card > img,
  body .section .grid .card > a > img,
  body .section .grid .card img{
    width:100% !important;
    height:250px !important;
    aspect-ratio:auto !important;
    object-fit:contain !important;
    object-position:center !important;
    background:#fafafa !important;
    padding:0 !important;
    margin:0 !important;
    border-radius:0 !important;
  }
  body .section .grid .card .body{padding:13px 14px 14px !important;}
  body .section .grid .card h3{font-size:1rem !important;line-height:1.3 !important;margin:8px 0 4px !important;}
  body .section .grid .card p:not(.admin-price){font-size:.78rem !important;line-height:1.45 !important;}
  body .section .grid .card .actions{display:grid !important;grid-template-columns:1fr 1fr !important;gap:8px !important;}
  body .section .grid .card .smallbtn{min-height:40px !important;font-size:.76rem !important;}
}
</style>
`;

  const js = `
<script id="${marker}-runtime">
(function(){
  function isMobileLayout(){
    try{
      var ua=navigator.userAgent||'';
      return window.innerWidth<=900 || /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i.test(ua);
    }catch(e){ return false; }
  }
  function apply(){
    if(!isMobileLayout()) return;
    document.querySelectorAll('.section .grid').forEach(function(grid){
      if(!grid.querySelector('.card')) return;
      grid.style.setProperty('display','grid','important');
      grid.style.setProperty('grid-template-columns','minmax(0, 1fr)','important');
      grid.style.setProperty('gap','14px','important');
      grid.querySelectorAll('.card').forEach(function(card){
        card.style.setProperty('width','100%','important');
        card.style.setProperty('min-width','0','important');
        var img=card.querySelector('img');
        if(img){
          img.style.setProperty('width','100%','important');
          img.style.setProperty('height','250px','important');
          img.style.setProperty('object-fit','contain','important');
        }
      });
    });
  }
  apply();
  document.addEventListener('DOMContentLoaded',apply);
  window.addEventListener('load',apply);
  window.addEventListener('resize',apply);
  try{
    new MutationObserver(apply).observe(document.body,{childList:true,subtree:true});
  }catch(e){}
})();
</script>
`;

  html = html.replace('</head>', `${css}</head>`);
  html = html.replace('</body>', `${js}</body>`);
  fs.writeFileSync(file, html, 'utf8');
  console.log('MAGIC LIGHT Home mobile cards forced to one column v4.');
}
