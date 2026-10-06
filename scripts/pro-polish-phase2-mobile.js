const fs=require('fs');
const path=require('path');

const DIST=path.join(process.cwd(),'dist');
const MARK='magic-light-pro-polish-phase2-mobile';

const detect=`<script id="${MARK}-detect">\n(()=>{\n  try{\n    const ua=navigator.userAgent||'';\n    const mobileUA=/Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(ua);\n    const coarse=window.matchMedia&&matchMedia('(pointer:coarse)').matches;\n    const portrait=window.matchMedia&&matchMedia('(orientation:portrait)').matches;\n    const physical=Math.min(screen.width||9999,screen.height||9999);\n    const touch=(navigator.maxTouchPoints||0)>1||coarse;\n    if(mobileUA||physical<=900||(touch&&portrait&&window.innerWidth<=1200)){\n      document.documentElement.classList.add('ml-mobile-device');\n      if(physical<=350)document.documentElement.classList.add('ml-mobile-narrow');\n    }\n  }catch(e){}\n})();\n</script>`;

const style=`<style id="${MARK}">
/* MAGIC LIGHT • PROFESSIONAL MOBILE UX */
html.ml-mobile-device,html.ml-mobile-device body{max-width:100%;overflow-x:hidden}
html.ml-mobile-device body{-webkit-text-size-adjust:100%;text-size-adjust:100%;font-size:16px}
html.ml-mobile-device .container{width:calc(100% - 24px)!important;max-width:none!important}
html.ml-mobile-device .section{padding:38px 0!important}
html.ml-mobile-device .pagehero{padding:34px 0!important}
html.ml-mobile-device .pagehero h1{font-size:clamp(1.9rem,6vw,2.45rem)!important;line-height:1.08!important}
html.ml-mobile-device .section-head{gap:8px!important;margin-bottom:18px!important}
html.ml-mobile-device .section-head h2{font-size:1.65rem!important}
html.ml-mobile-device button,html.ml-mobile-device .btn,html.ml-mobile-device .smallbtn,html.ml-mobile-device a.btn{min-height:42px}

/* Header: compact, readable and touch-friendly even if browser requests desktop site */
html.ml-mobile-device .header{position:sticky!important;top:0!important;z-index:1000!important;box-shadow:0 5px 20px rgba(17,18,21,.08)!important}
html.ml-mobile-device .header .top{min-height:0!important;display:grid!important;grid-template-columns:1fr!important;gap:9px!important;padding:10px 0!important}
html.ml-mobile-device .header .logo{justify-self:start!important;gap:9px!important}
html.ml-mobile-device .header .logo img{width:52px!important;height:52px!important;flex:0 0 52px!important}
html.ml-mobile-device .header .logo strong{font-size:1.12rem!important;line-height:1.05!important}
html.ml-mobile-device .header .logo small{font-size:.68rem!important}
html.ml-mobile-device .header .call,html.ml-mobile-device .header .lang{display:none!important}
html.ml-mobile-device .header .search{width:100%!important;max-width:none!important;grid-template-columns:minmax(0,1fr) 48px!important}
html.ml-mobile-device .header .search input{height:44px!important;font-size:16px!important;min-width:0!important}
html.ml-mobile-device .header .search button{width:48px!important}
html.ml-mobile-device .header .navrow{min-height:52px!important;position:relative!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important}
html.ml-mobile-device .header .menu{display:grid!important;place-items:center!important;width:44px!important;height:44px!important;border-radius:12px!important}
html.ml-mobile-device .header .links{display:none!important;position:absolute!important;left:0!important;right:0!important;top:calc(100% + 6px)!important;z-index:1100!important;background:#fff!important;border:1px solid #e6e8ec!important;border-radius:16px!important;box-shadow:0 18px 50px rgba(0,0,0,.13)!important;padding:9px!important;flex-direction:column!important;align-items:stretch!important;gap:2px!important;max-height:72vh!important;overflow:auto!important}
html.ml-mobile-device .header .links.open{display:flex!important}
html.ml-mobile-device .header .link{padding:12px 13px!important;font-size:.92rem!important;border-radius:10px!important}
html.ml-mobile-device .header .link:active{background:#f6f1e7!important}
html.ml-mobile-device .header .social-mini{margin-left:auto!important}
html.ml-mobile-device .header .social-mini a{width:38px!important;height:38px!important}
html.ml-mobile-device .mobile-cart{display:grid!important}

/* Product listing: 2 comfortable columns, readable content */
html.ml-mobile-device .grid,
html.ml-mobile-device #adminProductsGrid,
html.ml-mobile-device .products-grid,
html.ml-mobile-device .product-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}
html.ml-mobile-device .card{border-radius:15px!important;box-shadow:0 7px 22px rgba(0,0,0,.055)!important;min-width:0!important}
html.ml-mobile-device .card img{width:100%!important;height:auto!important;aspect-ratio:1/1!important;object-fit:cover!important}
html.ml-mobile-device .card .body{padding:12px!important}
html.ml-mobile-device .card h3{font-size:.95rem!important;line-height:1.28!important;margin:8px 0 4px!important}
html.ml-mobile-device .card .ref{font-size:.7rem!important}
html.ml-mobile-device .card p{font-size:.79rem!important;line-height:1.42!important;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
html.ml-mobile-device .card .badge{font-size:.68rem!important;padding:4px 8px!important}
html.ml-mobile-device .card .actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;margin-top:11px!important}
html.ml-mobile-device .card .actions .smallbtn{min-width:0!important;width:100%!important;padding:8px 6px!important;font-size:.74rem!important;white-space:normal!important;line-height:1.15!important}
html.ml-mobile-device .card .actions .smallbtn.primary{grid-column:1/-1!important}
html.ml-mobile-device .admin-price{font-size:.92rem!important}

/* References / visual galleries */
html.ml-mobile-device .refgrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}
html.ml-mobile-device .refitem{min-height:260px!important;border-radius:15px!important}

/* Catalogue: one spread per row instead of four tiny columns */
html.ml-mobile-device .catalog{grid-template-columns:1fr!important;gap:14px!important}
html.ml-mobile-device .catalog .spread{grid-template-columns:44% 56%!important;border-radius:16px!important}
html.ml-mobile-device .catalog .spread img{height:100%!important;min-height:260px!important;object-fit:cover!important}
html.ml-mobile-device .catalog .copy{padding:18px!important}
html.ml-mobile-device .catalog .copy h3{font-size:1.05rem!important;line-height:1.25!important}
html.ml-mobile-device .catalog .copy p{font-size:.86rem!important}

/* Contact */
html.ml-mobile-device .contactgrid{grid-template-columns:1fr!important;gap:14px!important}
html.ml-mobile-device .contactgrid .box{padding:18px!important;border-radius:16px!important}
html.ml-mobile-device .map-live iframe,html.ml-mobile-device .map iframe{height:290px!important;min-height:290px!important}
html.ml-mobile-device .location-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;padding:12px!important}
html.ml-mobile-device .location-actions .btn{width:100%!important;min-width:0!important;padding:0 10px!important;font-size:.82rem!important}

/* Footer: readable 2x2 instead of four squeezed columns */
html.ml-mobile-device .footer{padding:36px 0 calc(20px + env(safe-area-inset-bottom))!important}
html.ml-mobile-device .footergrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:24px 18px!important}
html.ml-mobile-device .footer h4{font-size:.92rem!important}
html.ml-mobile-device .footer p,html.ml-mobile-device .footer li{font-size:.8rem!important;line-height:1.55!important}

/* Product modal and cart */
html.ml-mobile-device .modal{padding:8px!important;align-items:center!important}
html.ml-mobile-device .modalbox{width:100%!important;max-width:720px!important;max-height:calc(100dvh - 16px)!important;grid-template-columns:1fr!important;border-radius:18px!important}
html.ml-mobile-device .modalbox>img,html.ml-mobile-device #productGalleryStage{max-height:46dvh!important}
html.ml-mobile-device #modalImg{max-height:46dvh!important;object-fit:contain!important}
html.ml-mobile-device .modalcopy{padding:18px!important}
html.ml-mobile-device .close{width:42px!important;height:42px!important}
html.ml-mobile-device #cartModal{padding:0!important;align-items:flex-end!important}
html.ml-mobile-device #cartModal .cart-panel{width:100%!important;max-width:none!important;max-height:94dvh!important;border-radius:22px 22px 0 0!important;overflow-x:hidden!important}
html.ml-mobile-device #cartModal input{font-size:16px!important}

/* Filters and forms */
html.ml-mobile-device input,html.ml-mobile-device select,html.ml-mobile-device textarea{max-width:100%!important}
html.ml-mobile-device .filterbar{gap:7px!important}
html.ml-mobile-device .filter{font-size:.82rem!important;padding:8px 11px!important}

/* Narrow phones */
html.ml-mobile-device.ml-mobile-narrow .grid,
html.ml-mobile-device.ml-mobile-narrow #adminProductsGrid,
html.ml-mobile-device.ml-mobile-narrow .products-grid,
html.ml-mobile-device.ml-mobile-narrow .product-grid,
html.ml-mobile-device.ml-mobile-narrow .refgrid,
html.ml-mobile-device.ml-mobile-narrow .footergrid{grid-template-columns:1fr!important}
html.ml-mobile-device.ml-mobile-narrow .catalog .spread{grid-template-columns:1fr!important}
html.ml-mobile-device.ml-mobile-narrow .catalog .spread img{min-height:220px!important}

/* Also apply the same layout on normal mobile viewports */
@media(max-width:900px){
  .grid,#adminProductsGrid,.products-grid,.product-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}
  .contactgrid{grid-template-columns:1fr!important}
  .catalog{grid-template-columns:1fr!important}
  .footergrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
}
@media(max-width:350px){
  .grid,#adminProductsGrid,.products-grid,.product-grid,.refgrid,.footergrid{grid-template-columns:1fr!important}
}
</style>`;

function inject(file){
  let html=fs.readFileSync(file,'utf8');
  if(html.includes(`id="${MARK}"`))return false;
  const headEnd=html.toLowerCase().indexOf('</head>');
  if(headEnd<0)return false;
  html=html.slice(0,headEnd)+detect+'\n'+style+'\n'+html.slice(headEnd);
  fs.writeFileSync(file,html,'utf8');
  return true;
}

function walk(dir){
  if(!fs.existsSync(dir))return 0;
  let changed=0;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.name==='admin')continue;
    const p=path.join(dir,entry.name);
    if(entry.isDirectory())changed+=walk(p);
    else if(entry.isFile()&&entry.name.endsWith('.html'))changed+=inject(p)?1:0;
  }
  return changed;
}

const changed=walk(DIST);
console.log(`MAGIC LIGHT pro mobile polish phase 2: ${changed} page(s) enhanced.`);
