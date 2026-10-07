const fs = require('fs');
const path = require('path');

const DIST = path.join(process.cwd(), 'dist');
const PAGES = ['produits.html', 'products.html'];
const MARK = 'magic-light-products-sanity-v2';

function sanitizePrintableTemplate(html) {
  const startToken = 'printWindow.document.write(`';
  const start = html.indexOf(startToken);
  if (start < 0) return html;

  const closeMarker = '`);\n        printWindow.document.close();';
  const end = html.indexOf(closeMarker, start + startToken.length);
  if (end < 0) return html;

  const before = html.slice(0, start);
  let printable = html.slice(start, end);
  const after = html.slice(end);

  printable = printable.replace(/\s*<script\b[^>]*>[\s\S]*?<\/script>\s*/gi, '\n');
  return before + printable + after;
}

const style = `
<style id="${MARK}">
/* PRODUCTS ONLY — always 3 cards per row on phones, with the photo dominant. */
@media (max-width:900px){
  html body #products > .container,
  html body #admin-catalogue > .container{
    width:calc(100% - 12px)!important;
    max-width:none!important;
  }

  html body #products .grid,
  html body #adminProductsGrid{
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:6px!important;
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
    border-radius:10px!important;
    border:1px solid #e7e9ed!important;
    background:#fff!important;
    box-shadow:0 2px 9px rgba(0,0,0,.05)!important;
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
    display:flex!important;
    flex-direction:column!important;
    min-height:0!important;
    padding:5px 5px 6px!important;
  }

  html body #products .card .badge,
  html body #adminProductsGrid .card .badge{
    max-width:100%!important;
    padding:2px 4px!important;
    border-radius:6px!important;
    font-size:.48rem!important;
    line-height:1.08!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
  }

  html body #products .card h3,
  html body #adminProductsGrid .card h3{
    min-height:2.25em!important;
    margin:4px 0 2px!important;
    font-size:.64rem!important;
    line-height:1.14!important;
    display:-webkit-box!important;
    -webkit-line-clamp:2!important;
    -webkit-box-orient:vertical!important;
    overflow:hidden!important;
  }

  html body #products .card .ref,
  html body #adminProductsGrid .card .ref{
    font-size:.48rem!important;
    line-height:1.08!important;
  }

  html body #products .card p,
  html body #adminProductsGrid .card p{display:none!important}

  html body #products .admin-price,
  html body #adminProductsGrid .admin-price,
  html body #products .promo-price,
  html body #adminProductsGrid .promo-price{
    margin-top:3px!important;
    font-size:.61rem!important;
    line-height:1.08!important;
  }

  html body #products .promo-price .old-price,
  html body #adminProductsGrid .promo-price .old-price{font-size:.49rem!important}
  html body #products .promo-price .new-price,
  html body #adminProductsGrid .promo-price .new-price{font-size:.64rem!important}
  html body #products .promo-badge,
  html body #adminProductsGrid .promo-badge{font-size:.45rem!important;padding:2px 3px!important}

  html body #products .card .actions,
  html body #adminProductsGrid .card .actions{
    display:grid!important;
    grid-template-columns:1fr!important;
    gap:3px!important;
    margin-top:4px!important;
  }

  html body #products .card .actions .smallbtn,
  html body #adminProductsGrid .card .actions .smallbtn{
    width:100%!important;
    min-width:0!important;
    min-height:25px!important;
    padding:3px 2px!important;
    border-radius:7px!important;
    font-size:.47rem!important;
    line-height:1.02!important;
    white-space:normal!important;
  }

  html body #products .card .actions .smallbtn.primary,
  html body #adminProductsGrid .card .actions .smallbtn.primary{grid-column:1!important}
}

/* Only impossibly tiny legacy viewports fall back to 2 columns. */
@media (max-width:260px){
  html body #products .grid,
  html body #adminProductsGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
}
</style>`;

const runtime = `
<script id="${MARK}-runtime">
(()=>{
  const isMobile=()=>{
    try{return window.innerWidth<=900 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'')}catch(e){return window.innerWidth<=900}
  };

  const apply=()=>{
    if(!isMobile()) return;
    const cols=window.innerWidth<=260?'repeat(2,minmax(0,1fr))':'repeat(3,minmax(0,1fr))';

    [document.querySelector('#products > .container'),document.querySelector('#admin-catalogue > .container')]
      .filter(Boolean)
      .forEach(c=>{
        c.style.setProperty('width','calc(100% - 12px)','important');
        c.style.setProperty('max-width','none','important');
      });

    const grids=[document.querySelector('#products .grid'),document.getElementById('adminProductsGrid')].filter(Boolean);
    grids.forEach(g=>{
      g.style.setProperty('display','grid','important');
      g.style.setProperty('grid-template-columns',cols,'important');
      g.style.setProperty('gap','6px','important');
      g.style.setProperty('align-items','start','important');
      g.style.setProperty('grid-auto-rows','max-content','important');
    });

    document.querySelectorAll('#products .card,#adminProductsGrid .card').forEach(card=>{
      card.style.setProperty('display','flex','important');
      card.style.setProperty('flex-direction','column','important');
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
        img.style.setProperty('aspect-ratio','auto','important');
        img.style.setProperty('object-fit','contain','important');
        img.style.setProperty('padding','0','important');
        img.style.setProperty('margin','0','important');
      }
    });
  };

  const start=()=>{
    apply();
    [document.querySelector('#products .grid'),document.getElementById('adminProductsGrid')].filter(Boolean).forEach(g=>{
      new MutationObserver(()=>requestAnimationFrame(apply)).observe(g,{childList:true,subtree:true});
    });
    [120,450,1000,2200].forEach(ms=>setTimeout(apply,ms));
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('load',apply,{once:true});
  window.addEventListener('pageshow',apply);
  window.addEventListener('resize',()=>{clearTimeout(window.__mlProductsSanityTimer);window.__mlProductsSanityTimer=setTimeout(apply,80)});
})();
</script>`;

function stripOldPasses(html){
  for(const oldMark of ['magic-light-products-sanity-v1','magic-light-products-sanity-v2']){
    html=html.replace(new RegExp('\\n?<style id="'+oldMark+'">[\\s\\S]*?<\\/style>\\s*','g'),'\n');
    html=html.replace(new RegExp('\\n?<script id="'+oldMark+'-runtime">[\\s\\S]*?<\\/script>\\s*','g'),'\n');
  }
  return html;
}

function inject(file) {
  let html = fs.readFileSync(file, 'utf8');
  html = sanitizePrintableTemplate(html);
  html = stripOldPasses(html);

  const headEnd = html.toLowerCase().lastIndexOf('</head>');
  if (headEnd < 0) throw new Error(`${path.basename(file)}: </head> introuvable`);
  html = html.slice(0, headEnd) + style + '\n' + html.slice(headEnd);

  const bodyEnd = html.toLowerCase().lastIndexOf('</body>');
  if (bodyEnd < 0) throw new Error(`${path.basename(file)}: </body> final introuvable`);
  html = html.slice(0, bodyEnd) + runtime + '\n' + html.slice(bodyEnd);

  const start = html.indexOf('printWindow.document.write(`');
  if (start >= 0) {
    const end = html.indexOf('`);\n        printWindow.document.close();', start);
    if (end > start) {
      const printable = html.slice(start, end);
      if (/<script\b/i.test(printable) || /<\/script>/i.test(printable)) {
        throw new Error(`${path.basename(file)}: SCRIPT interdit dans le template d'impression`);
      }
    }
  }

  fs.writeFileSync(file, html, 'utf8');
}

for (const name of PAGES) {
  const file = path.join(DIST, name);
  if (fs.existsSync(file)) inject(file);
}

console.log('MAGIC LIGHT Products sanity v2: forced 3-column mobile grid with full-width dominant images.');
