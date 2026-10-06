const fs = require('fs');
const path = require('path');

const DIST = path.join(process.cwd(), 'dist');
const MARK = 'magic-light-final-mobile-product-grid-v2';
const PRODUCT_MARK = 'magic-light-products-page-compact-v2';

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
    grid-auto-rows:max-content!important;
  }

  .card{
    min-width:0!important;
    min-height:0!important;
    height:auto!important;
    align-self:start!important;
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
    margin:0!important;
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
  grid-auto-rows:max-content!important;
}
html.ml-mobile-device .card{
  min-height:0!important;
  height:auto!important;
  align-self:start!important;
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
  margin:0!important;
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

/* Products page only: remove the large empty card feel and keep the image dominant. */
const productCss = `
<style id="${PRODUCT_MARK}">
@media (max-width:900px){
  #products .grid,
  #adminProductsGrid{
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:7px!important;
    align-items:start!important;
    grid-auto-rows:max-content!important;
  }

  #products .card,
  #adminProductsGrid .card{
    display:flex!important;
    flex-direction:column!important;
    justify-content:flex-start!important;
    min-height:0!important;
    height:auto!important;
    align-self:start!important;
    border-radius:11px!important;
    background:#fff!important;
    overflow:hidden!important;
  }

  #products .card > img,
  #adminProductsGrid .card > img{
    display:block!important;
    width:100%!important;
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
    object-fit:contain!important;
    object-position:center!important;
    background:#fff!important;
    margin:0!important;
  }

  #products .card .body,
  #adminProductsGrid .card .body{
    display:flex!important;
    flex-direction:column!important;
    padding:6px 7px 7px!important;
    min-height:0!important;
  }

  #products .card h3,
  #adminProductsGrid .card h3{
    min-height:0!important;
    margin:5px 0 3px!important;
    font-size:.70rem!important;
    line-height:1.18!important;
    -webkit-line-clamp:2!important;
  }

  #products .card .badge,
  #adminProductsGrid .card .badge{
    font-size:.55rem!important;
    padding:3px 5px!important;
  }

  #products .card .ref,
  #adminProductsGrid .card .ref{font-size:.54rem!important}

  #products .admin-price,
  #adminProductsGrid .admin-price{
    font-size:.68rem!important;
    margin-top:4px!important;
  }

  #products .card .actions,
  #adminProductsGrid .card .actions{
    margin-top:6px!important;
    gap:4px!important;
  }

  #products .card .actions .smallbtn,
  #adminProductsGrid .card .actions .smallbtn{
    min-height:29px!important;
    padding:4px 3px!important;
    font-size:.53rem!important;
  }
}

@media (max-width:315px){
  #products .grid,#adminProductsGrid{
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
  }
}
</style>`;

function inject(file) {
  let html = fs.readFileSync(file, 'utf8');
  const isProductsPage = ['products.html', 'produits.html'].includes(path.basename(file).toLowerCase());
  let changed = false;

  if (!html.includes(`id="${MARK}"`)) {
    const i = html.toLowerCase().lastIndexOf('</head>');
    if (i < 0) return false;
    html = html.slice(0, i) + css + '\n' + html.slice(i);
    changed = true;
  }

  if (isProductsPage && !html.includes(`id="${PRODUCT_MARK}"`)) {
    const i = html.toLowerCase().lastIndexOf('</head>');
    if (i < 0) return changed;
    html = html.slice(0, i) + productCss + '\n' + html.slice(i);
    changed = true;
  }

  if (changed) fs.writeFileSync(file, html, 'utf8');
  return changed;
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
