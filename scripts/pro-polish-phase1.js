const fs=require('fs');
const path=require('path');

const DIST=path.join(process.cwd(),'dist');
const MARK='magic-light-pro-polish-phase1';

const style=`<style id="${MARK}">
/* MAGIC LIGHT • PRO POLISH PHASE 1 */
.product-trust-pro{margin:16px 0 0;border:1px solid #e7e8eb;border-radius:16px;overflow:hidden;background:#fff}
.product-trust-pro .trust-row{display:grid;grid-template-columns:38px 1fr;gap:10px;padding:12px 14px;border-top:1px solid #eef0f2;align-items:start}
.product-trust-pro .trust-row:first-child{border-top:0}
.product-trust-pro .trust-ico{width:34px;height:34px;border-radius:10px;background:#f7edd9;display:grid;place-items:center;font-size:18px}
.product-trust-pro strong{display:block;font-size:.88rem;color:#20242b}
.product-trust-pro small{display:block;margin-top:2px;color:#6f7681;line-height:1.35}
@media(max-width:620px){
  #cartModal{padding:0 !important;align-items:flex-end !important;justify-content:center !important}
  #cartModal .cart-panel{width:100% !important;max-width:none !important;height:auto !important;max-height:94dvh !important;border-radius:22px 22px 0 0 !important;padding:18px 14px calc(16px + env(safe-area-inset-bottom)) !important;overflow-x:hidden !important;overscroll-behavior:contain}
  #cartModal .cart-panel *{box-sizing:border-box}
  #cartModal .cart-client{padding:14px !important;border-radius:14px !important}
  #cartModal .cart-client input{min-height:48px !important;font-size:16px !important;margin:5px 0 !important}
  #cartModal .cart-actions{position:sticky !important;bottom:-16px !important;z-index:5 !important;background:#fff !important;padding:12px 0 6px !important;margin-top:14px !important;display:grid !important;grid-template-columns:1fr 1fr !important;gap:8px !important;border-top:1px solid #eceef1 !important}
  #cartModal .cart-actions .btn{width:100% !important;min-width:0 !important;white-space:normal !important;line-height:1.2 !important;padding:10px 8px !important;border-radius:12px !important;font-size:.8rem !important}
  #cartPrint{grid-column:1 !important}
  #cartPdf{grid-column:2 !important}
  #cartWhatsApp{grid-column:1 / -1 !important;min-height:50px !important;background:#20ad5a !important;color:#fff !important}
  #cartOk{grid-column:1 / -1 !important;min-height:42px !important;background:#fff !important;color:#222 !important;border:1px solid #dfe2e7 !important}
  #cartList,#cartModal .cart-list{overflow-wrap:anywhere;word-break:normal}
  #cartModal h2,#cartModal h3{margin-right:46px}
}
</style>`;

const runtime=`<script id="${MARK}-runtime">
(()=>{
  const installTrust=()=>{
    if(document.getElementById('productTrustPro'))return;
    const wa=document.getElementById('modalWhatsApp');
    const actions=wa?.closest('.hero-buttons');
    if(!actions)return;
    const box=document.createElement('div');
    box.id='productTrustPro';
    box.className='product-trust-pro';
    box.innerHTML='\
      <div class="trust-row"><div class="trust-ico">🚚</div><div><strong>Livraison en Tunisie</strong><small>Livraison disponible partout en Tunisie.</small></div></div>\
      <div class="trust-row"><div class="trust-ico">↩️</div><div><strong>Retour sous 5 jours</strong><small>Article retourné dans son état et emballage d’origine.</small></div></div>\
      <div class="trust-row"><div class="trust-ico">☎️</div><div><strong>Service client</strong><small>Pour initier un retour ou demander de l’aide : 28 803 803.</small></div></div>';
    actions.insertAdjacentElement('afterend',box);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installTrust,{once:true});else installTrust();
})();
</script>`;

function inject(file){
  let html=fs.readFileSync(file,'utf8');
  if(!html.includes('id="modalAddCart"')&&!html.includes('id="cartModal"'))return false;
  if(html.includes(`id="${MARK}"`))return false;
  const lower=html.toLowerCase();
  const headEnd=lower.indexOf('</head>');
  if(headEnd>=0) html=html.slice(0,headEnd)+style+'\n'+html.slice(headEnd);
  else html=style+'\n'+html;
  const bodyEnd=html.toLowerCase().lastIndexOf('</body>');
  html=bodyEnd>=0?html.slice(0,bodyEnd)+runtime+'\n'+html.slice(bodyEnd):html+runtime;
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
console.log(`MAGIC LIGHT pro polish phase 1: ${changed} page(s) enhanced.`);
