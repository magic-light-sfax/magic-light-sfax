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

/* Header: true compact mobile header, including browsers using desktop-like viewport */
html.ml-mobile-device .header{position:sticky!important;top:0!important;z-index:1000!important;background:#fff!important;box-shadow:0 5px 20px rgba(17,18,21,.08)!important}
html.ml-mobile-device .header .top{
  min-height:0!important;
  display:grid!important;
  grid-template-columns:46px minmax(0,1fr) 46px!important;
  grid-template-areas:"menu logo cart" "search search search"!important;
  align-items:center!important;
  gap:8px 10px!important;
  padding:8px 0 10px!important;
}
html.ml-mobile-device .header .menu{grid-area:menu!important;display:grid!important;place-items:center!important;width:42px!important;height:42px!important;padding:0!important;border-radius:12px!important;font-size:1.35rem!important;justify-self:start!important}
html.ml-mobile-device .header .logo{grid-area:logo!important;justify-self:start!important;min-width:0!important;gap:8px!important}
html.ml-mobile-device .header .logo img{width:46px!important;height:46px!important;flex:0 0 46px!important;border-width:1px!important}
html.ml-mobile-device .header .logo>div{min-width:0!important}
html.ml-mobile-device .header .logo strong{font-size:1.04rem!important;line-height:1.05!important;white-space:nowrap!important}
html.ml-mobile-device .header .logo small{font-size:.68rem!important;line-height:1.15!important;margin-top:2px!important;white-space:nowrap!important}
html.ml-mobile-device .header .call,html.ml-mobile-device .header .lang{display:none!important}
html.ml-mobile-device .header .search{grid-area:search!important;width:100%!important;max-width:none!important;grid-template-columns:minmax(0,1fr) 48px!important;border-radius:14px!important;box-shadow:0 3px 12px rgba(0,0,0,.035)!important}
html.ml-mobile-device .header .search input{height:44px!important;font-size:16px!important;min-width:0!important;padding:0 14px!important}
html.ml-mobile-device .header .search button{width:48px!important;min-width:48px!important}
html.ml-mobile-device .mobile-cart{grid-area:cart!important;display:grid!important;place-items:center!important;position:relative!important;width:42px!important;height:42px!important;border-radius:12px!important;background:#111215!important;color:#fff!important;font-size:1.08rem!important;line-height:1!important;justify-self:end!important}
html.ml-mobile-device .mobile-cart-count{position:absolute!important;right:-5px!important;top:-6px!important;min-width:20px!important;height:20px!important;padding:0 5px!important;display:grid!important;place-items:center!important;border-radius:999px!important;background:#d83a3a!important;color:#fff!important;border:2px solid #fff!important;font-size:.66rem!important;font-weight:900!important;line-height:1!important}
html.ml-mobile-device .header .nav{height:0!important;border:0!important}
html.ml-mobile-device .header .navrow{min-height:0!important;height:0!important;position:static!important}
html.ml-mobile-device .header .social-mini{display:none!important}
html.ml-mobile-device .header .links{
  display:flex!important;
  position:fixed!important;
  z-index:1003!important;
  top:0!important;bottom:0!important;left:0!important;right:auto!important;
  width:min(86vw,380px)!important;height:100dvh!important;
  padding:0 18px 28px!important;
  flex-flow:column nowrap!important;align-items:stretch!important;gap:0!important;
  overflow-y:auto!important;overflow-x:hidden!important;
  background:#fff!important;border:0!important;border-radius:0 22px 22px 0!important;
  box-shadow:20px 0 50px rgba(0,0,0,.18)!important;
  transform:translateX(-105%)!important;
  transition:transform .28s ease!important;
  visibility:hidden!important;pointer-events:none!important;
}
html.ml-mobile-device .header .links.open{transform:translateX(0)!important;visibility:visible!important;pointer-events:auto!important}
html.ml-mobile-device .header .link{width:100%!important;padding:12px 10px!important;font-size:.93rem!important;border-radius:0!important}
html.ml-mobile-device .menu-overlay{display:block!important;position:fixed!important;inset:0!important;z-index:1002!important;background:rgba(0,0,0,.48)!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important}
html.ml-mobile-device .menu-overlay.open{opacity:1!important;visibility:visible!important;pointer-events:auto!important}
html.ml-mobile-device body.menu-open{overflow:hidden!important}

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
html.ml-mobile-device .card p{font-size:.79rem!important;line-height:1.4!important;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
html.ml-mobile-device .card .badge{font-size:.68rem!important;padding:4px 8px!important}
html.ml-mobile-device .card .actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;margin-top:11px!important}
html.ml-mobile-device .card .actions .smallbtn{min-width:0!important;width:100%!important;padding:8px 6px!important;font-size:.74rem!important;white-space:normal!important;line-height:1.15!important}
html.ml-mobile-device .card .actions .smallbtn.primary{grid-column:1/-1!important}
html.ml-mobile-device .admin-price{font-size:.92rem!important}

/* References / visual galleries */
html.ml-mobile-device .refgrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}
html.ml-mobile-device .refitem{min-height:260px!important;border-radius:15px!important}

/* Catalogue */
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

/* Footer */
html.ml-mobile-device .footer{padding:36px 0 calc(20px + env(safe-area-inset-bottom))!important}
html.ml-mobile-device .footergrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:24px 18px!important}
html.ml-mobile-device .footer h4{font-size:.92rem!important}
html.ml-mobile-device .footer p,html.ml-mobile-device .footer li{font-size:.8rem!important;line-height:1.55!important}

/* Product modal and cart: use the phone width, not a narrow desktop card */
html.ml-mobile-device .modal{padding:6px!important;align-items:center!important;justify-content:center!important}
html.ml-mobile-device .modalbox{width:calc(100vw - 12px)!important;max-width:none!important;max-height:calc(100dvh - 12px)!important;grid-template-columns:1fr!important;border-radius:18px!important}
html.ml-mobile-device .modalbox>img,html.ml-mobile-device #productGalleryStage{max-height:45dvh!important}
html.ml-mobile-device #modalImg{max-height:45dvh!important;object-fit:contain!important}
html.ml-mobile-device .modalcopy{padding:16px!important}
html.ml-mobile-device .close{width:42px!important;height:42px!important;right:10px!important;top:10px!important}
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

/* Standard mobile viewports */
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
