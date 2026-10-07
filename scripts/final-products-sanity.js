const fs = require('fs');
const path = require('path');

const DIST = path.join(process.cwd(), 'dist');
const PAGES = ['produits.html', 'products.html'];
const MARK = 'magic-light-products-sanity-v1';

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

  // Never allow a real SCRIPT element inside the printable HTML template.
  // A closing </script> token there would terminate the page's main script
  // in the HTML parser and expose the remaining JavaScript as visible text.
  printable = printable.replace(/\s*<script\b[^>]*>[\s\S]*?<\/script>\s*/gi, '\n');

  return before + printable + after;
}

const style = `
<style id="${MARK}">
/* PRODUCTS ONLY — compact professional mobile grid for a very large catalogue. */
html.ml-mobile-device #products .grid,
html.ml-mobile-device #adminProductsGrid{
  display:grid!important;
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  gap:8px!important;
  align-items:start!important;
  grid-auto-rows:max-content!important;
}

html.ml-mobile-device #products .card,
html.ml-mobile-device #adminProductsGrid .card{
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

html.ml-mobile-device #products .card > img,
html.ml-mobile-device #adminProductsGrid .card > img{
  display:block!important;
  width:100%!important;
  height:auto!important;
  min-height:0!important;
  max-height:none!important;
  aspect-ratio:auto!important;
  object-fit:contain!important;
  object-position:center!important;
  background:#fff!important;
  margin:0!important;
}

html.ml-mobile-device #products .card .body,
html.ml-mobile-device #adminProductsGrid .card .body{
  padding:7px!important;
  min-height:0!important;
}

html.ml-mobile-device #products .card h3,
html.ml-mobile-device #adminProductsGrid .card h3{
  min-height:2.3em!important;
  margin:5px 0 3px!important;
  font-size:.69rem!important;
  line-height:1.16!important;
  display:-webkit-box!important;
  -webkit-line-clamp:2!important;
  -webkit-box-orient:vertical!important;
  overflow:hidden!important;
}

html.ml-mobile-device #products .card p,
html.ml-mobile-device #adminProductsGrid .card p{display:none!important}

html.ml-mobile-device #products .card .badge,
html.ml-mobile-device #adminProductsGrid .card .badge{
  max-width:100%!important;
  font-size:.53rem!important;
  line-height:1.1!important;
  padding:3px 5px!important;
  overflow:hidden!important;
  white-space:nowrap!important;
  text-overflow:ellipsis!important;
}

html.ml-mobile-device #products .card .ref,
html.ml-mobile-device #adminProductsGrid .card .ref{font-size:.53rem!important;line-height:1.12!important}

html.ml-mobile-device #products .admin-price,
html.ml-mobile-device #adminProductsGrid .admin-price,
html.ml-mobile-device #products .promo-price,
html.ml-mobile-device #adminProductsGrid .promo-price{
  margin-top:4px!important;
  font-size:.66rem!important;
  line-height:1.12!important;
}

html.ml-mobile-device #products .promo-price .old-price,
html.ml-mobile-device #adminProductsGrid .promo-price .old-price{font-size:.54rem!important}
html.ml-mobile-device #products .promo-price .new-price,
html.ml-mobile-device #adminProductsGrid .promo-price .new-price{font-size:.68rem!important}
html.ml-mobile-device #products .promo-badge,
html.ml-mobile-device #adminProductsGrid .promo-badge{font-size:.49rem!important;padding:2px 4px!important}

html.ml-mobile-device #products .card .actions,
html.ml-mobile-device #adminProductsGrid .card .actions{
  display:grid!important;
  grid-template-columns:1fr 1fr!important;
  gap:4px!important;
  margin-top:6px!important;
}

html.ml-mobile-device #products .card .actions .smallbtn,
html.ml-mobile-device #adminProductsGrid .card .actions .smallbtn{
  width:100%!important;
  min-width:0!important;
  min-height:29px!important;
  padding:4px 3px!important;
  border-radius:8px!important;
  font-size:.50rem!important;
  line-height:1.05!important;
  white-space:normal!important;
}

html.ml-mobile-device #products .card .actions .smallbtn.primary,
html.ml-mobile-device #adminProductsGrid .card .actions .smallbtn.primary{grid-column:1/-1!important}

html.ml-mobile-device.ml-mobile-narrow #products .grid,
html.ml-mobile-device.ml-mobile-narrow #adminProductsGrid{
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
}
</style>`;

const runtime = `
<script id="${MARK}-runtime">
(()=>{
  const isMobile=()=>{
    try{return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'')||window.innerWidth<=900}catch(e){return window.innerWidth<=900}
  };

  const apply=()=>{
    if(!isMobile())return;
    const narrow=document.documentElement.classList.contains('ml-mobile-narrow') || Math.min(screen.width||9999,screen.height||9999)<=330;
    const cols=narrow?'repeat(2,minmax(0,1fr))':'repeat(3,minmax(0,1fr))';
    const grids=[document.querySelector('#products .grid'),document.getElementById('adminProductsGrid')].filter(Boolean);
    grids.forEach(g=>{
      g.style.setProperty('display','grid','important');
      g.style.setProperty('grid-template-columns',cols,'important');
      g.style.setProperty('gap','8px','important');
      g.style.setProperty('align-items','start','important');
      g.style.setProperty('grid-auto-rows','max-content','important');
    });
    document.querySelectorAll('#products .card,#adminProductsGrid .card').forEach(card=>{
      card.style.setProperty('height','auto','important');
      card.style.setProperty('min-height','0','important');
      card.style.setProperty('align-self','start','important');
      const img=card.querySelector(':scope > img');
      if(img){
        img.style.setProperty('display','block','important');
        img.style.setProperty('width','100%','important');
        img.style.setProperty('height','auto','important');
        img.style.setProperty('min-height','0','important');
        img.style.setProperty('max-height','none','important');
        img.style.setProperty('aspect-ratio','auto','important');
        img.style.setProperty('object-fit','contain','important');
        img.style.setProperty('margin','0','important');
      }
    });
  };

  const start=()=>{
    apply();
    [document.querySelector('#products .grid'),document.getElementById('adminProductsGrid')].filter(Boolean).forEach(g=>{
      new MutationObserver(()=>requestAnimationFrame(apply)).observe(g,{childList:true,subtree:true});
    });
    setTimeout(apply,150);
    setTimeout(apply,700);
    setTimeout(apply,1600);
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('load',apply,{once:true});
  window.addEventListener('resize',()=>{clearTimeout(window.__mlProductsSanityTimer);window.__mlProductsSanityTimer=setTimeout(apply,80)});
})();
</script>`;

function inject(file) {
  let html = fs.readFileSync(file, 'utf8');
  html = sanitizePrintableTemplate(html);

  // Drop earlier copies of this final pass so rebuilding stays deterministic.
  html = html.replace(new RegExp('\\n?<style id="' + MARK + '">[\\s\\S]*?<\\/style>\\s*', 'g'), '\n');
  html = html.replace(new RegExp('\\n?<script id="' + MARK + '-runtime">[\\s\\S]*?<\\/script>\\s*', 'g'), '\n');

  const headEnd = html.toLowerCase().lastIndexOf('</head>');
  if (headEnd < 0) throw new Error(`${path.basename(file)}: </head> introuvable`);
  html = html.slice(0, headEnd) + style + '\n' + html.slice(headEnd);

  const bodyEnd = html.toLowerCase().lastIndexOf('</body>');
  if (bodyEnd < 0) throw new Error(`${path.basename(file)}: </body> final introuvable`);
  html = html.slice(0, bodyEnd) + runtime + '\n' + html.slice(bodyEnd);

  // Final safety check: the printable document template must never contain a
  // real script element, otherwise the browser can expose JS source as text.
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

console.log('MAGIC LIGHT Products sanity: 3-column mobile grid + printable-template safety applied.');
