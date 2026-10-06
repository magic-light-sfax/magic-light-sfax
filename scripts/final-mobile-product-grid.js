const fs = require('fs');
const path = require('path');

const DIST = path.join(process.cwd(), 'dist');
const MARK = 'magic-light-final-mobile-product-grid';

const css = `
<style id="${MARK}">
/* MAGIC LIGHT — final compact mobile product grid for large catalogues */
@media (max-width:900px){
  .grid,
  #adminProductsGrid,
  .products-grid,
  .product-grid{
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:8px!important;
    align-items:start!important;
  }

  .card{
    min-width:0!important;
    border-radius:12px!important;
    overflow:hidden!important;
    box-shadow:0 4px 14px rgba(0,0,0,.045)!important;
  }

  .card img{
    display:block!important;
    width:100%!important;
    height:auto!important;
    max-height:none!important;
    min-height:0!important;
    aspect-ratio:auto!important;
    object-fit:contain!important;
    object-position:center!important;
    background:#fff!important;
  }

  .card .body{padding:8px!important}
  .card .badge{
    max-width:100%!important;
    padding:3px 6px!important;
    font-size:.56rem!important;
    line-height:1.15!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
  }
  .card h3{
    min-height:2.35em!important;
    margin:6px 0 3px!important;
    font-size:.68rem!important;
    line-height:1.18!important;
    display:-webkit-box!important;
    -webkit-line-clamp:2!important;
    -webkit-box-orient:vertical!important;
    overflow:hidden!important;
  }
  .card .ref{font-size:.53rem!important;line-height:1.15!important}
  .card p{display:none!important}
  .admin-price{
    margin-top:4px!important;
    font-size:.66rem!important;
    line-height:1.15!important;
  }
  .card .actions{
    display:grid!important;
    grid-template-columns:1fr 1fr!important;
    gap:4px!important;
    margin-top:6px!important;
  }
  .card .actions .smallbtn{
    width:100%!important;
    min-width:0!important;
    min-height:29px!important;
    padding:4px 3px!important;
    border-radius:8px!important;
    font-size:.52rem!important;
    line-height:1.05!important;
    white-space:normal!important;
  }
  .card .actions .smallbtn.primary{grid-column:1/-1!important}
}

/* Some phones are detected by device class even when the browser reports a wider viewport. */
html.ml-mobile-device .grid,
html.ml-mobile-device #adminProductsGrid,
html.ml-mobile-device .products-grid,
html.ml-mobile-device .product-grid{
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  gap:8px!important;
  align-items:start!important;
}
html.ml-mobile-device .card img{
  display:block!important;
  width:100%!important;
  height:auto!important;
  max-height:none!important;
  min-height:0!important;
  aspect-ratio:auto!important;
  object-fit:contain!important;
  object-position:center!important;
  background:#fff!important;
}
html.ml-mobile-device .card .body{padding:8px!important}
html.ml-mobile-device .card h3{font-size:.68rem!important;line-height:1.18!important;margin:6px 0 3px!important}
html.ml-mobile-device .card .ref{font-size:.53rem!important}
html.ml-mobile-device .card .badge{font-size:.56rem!important;padding:3px 6px!important}
html.ml-mobile-device .card p{display:none!important}
html.ml-mobile-device .admin-price{font-size:.66rem!important;margin-top:4px!important}
html.ml-mobile-device .card .actions{gap:4px!important;margin-top:6px!important}
html.ml-mobile-device .card .actions .smallbtn{min-height:29px!important;padding:4px 3px!important;font-size:.52rem!important;border-radius:8px!important}

/* Only exceptionally narrow screens fall back to two columns. */
@media (max-width:315px){
  .grid,#adminProductsGrid,.products-grid,.product-grid{
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
  }
}
</style>`;

function inject(file) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes(`id="${MARK}"`)) return false;
  const i = html.toLowerCase().lastIndexOf('</head>');
  if (i < 0) return false;
  html = html.slice(0, i) + css + '\n' + html.slice(i);
  fs.writeFileSync(file, html, 'utf8');
  return true;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return 0;
  let changed = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'admin') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) changed += walk(p);
    else if (entry.isFile() && entry.name.endsWith('.html')) changed += inject(p) ? 1 : 0;
  }
  return changed;
}

const changed = walk(DIST);
console.log(`MAGIC LIGHT final mobile product grid: ${changed} page(s) updated.`);
