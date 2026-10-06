const fs=require('fs');
const path=require('path');

const DIST=path.join(process.cwd(),'dist');
const MARK='magic-light-abandoned-cart-recovery';

const runtime=`<script id="${MARK}">
(()=>{
  if(window.__magicLightAbandonedCartRecovery)return;
  window.__magicLightAbandonedCartRecovery=true;
  const CART_KEY='magicLightCart';
  const ID_KEY='magicLightCartSessionId';
  const ACTIVITY_KEY='magicLightCartLastActivity';
  const ENDPOINT='/.netlify/functions/abandoned-cart';
  const nativeFetch=window.fetch.bind(window);
  const getCart=()=>{try{const c=JSON.parse(localStorage.getItem(CART_KEY)||'[]');return Array.isArray(c)?c:[]}catch{return []}};
  const getId=()=>{let id='';try{id=localStorage.getItem(ID_KEY)||''}catch{}if(!id){id=(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9_-]/g,'');try{localStorage.setItem(ID_KEY,id)}catch{}}return id};
  const touch=()=>{try{localStorage.setItem(ACTIVITY_KEY,String(Date.now()))}catch{}};
  const lastActivity=()=>{try{return Number(localStorage.getItem(ACTIVITY_KEY)||0)||0}catch{return 0}};
  const send=(action='snapshot',extra={})=>{
    const items=getCart();
    if(action==='snapshot'&&!items.length)return Promise.resolve();
    return nativeFetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',keepalive:true,body:JSON.stringify({sessionId:getId(),action,items,page:location.pathname+location.search,...extra})}).catch(()=>{});
  };
  const count=cart=>cart.reduce((s,i)=>s+(Number(i.qty)||1),0);
  const total=cart=>cart.reduce((s,i)=>s+(Number(i.price)||0)*(Number(i.qty)||1),0);
  const refreshRecoveryBanner=()=>{
    const box=document.getElementById('magicLightCartRecoveryBanner');
    if(!box)return;
    const cart=getCart();
    if(!cart.length){box.remove();return;}
    const summary=box.querySelector('[data-recovery-summary]');
    if(summary)summary.textContent=count(cart)+' article(s) · '+total(cart).toFixed(3)+' TND';
  };
  let lastSignature='';
  const sync=(reason='cart')=>{
    const cart=getCart();
    const sig=JSON.stringify(cart);
    if(sig===lastSignature){refreshRecoveryBanner();return;}
    const had=!!lastSignature&&lastSignature!=='[]';
    lastSignature=sig;
    refreshRecoveryBanner();
    if(cart.length){touch();send('snapshot',{reason})}
    else if(had)send('clear');
  };
  const openCart=()=>{
    const btn=document.getElementById('cartBtn')||document.querySelector('[href="#panier"],.mobile-cart,[data-cart-open]');
    if(btn){btn.click();return}
    location.href='/produits';
  };
  const showRecovery=()=>{
    const cart=getCart();
    const existing=document.getElementById('magicLightCartRecoveryBanner');
    if(!cart.length){if(existing)existing.remove();return;}
    const age=Date.now()-lastActivity();
    if(!lastActivity()||age<30*60*1000||age>7*24*60*60*1000)return;
    if(existing){refreshRecoveryBanner();return;}
    const box=document.createElement('div');
    box.id='magicLightCartRecoveryBanner';
    box.setAttribute('role','status');
    box.innerHTML='<div style="font-weight:900;font-size:15px">🛒 Votre panier vous attend</div><div data-recovery-summary style="font-size:13px;opacity:.82;margin-top:3px">'+count(cart)+' article(s) · '+total(cart).toFixed(3)+' TND</div><div style="display:flex;gap:8px;margin-top:10px"><button type="button" data-recover style="border:0;border-radius:999px;padding:10px 14px;background:#c99a3c;font-weight:900;cursor:pointer">Reprendre mon panier</button><button type="button" data-close style="border:1px solid #ddd;border-radius:999px;padding:10px 12px;background:#fff;font-weight:800;cursor:pointer">Plus tard</button></div>';
    box.style.cssText='position:fixed;left:16px;right:16px;bottom:18px;z-index:2147483000;max-width:520px;margin:auto;background:#fff;color:#20242b;border:1px solid #e5e7eb;border-radius:18px;padding:15px 16px;box-shadow:0 18px 55px rgba(0,0,0,.22);font-family:Arial,Tahoma,sans-serif';
    box.querySelector('[data-recover]').onclick=()=>{box.remove();openCart();send('snapshot',{reason:'recovered'})};
    box.querySelector('[data-close]').onclick=()=>box.remove();
    document.body.appendChild(box);
  };
  document.addEventListener('click',e=>{if(e.target.closest('[data-add-cart],#addToCart,.add-cart,[data-cart-action]'))setTimeout(()=>sync('interaction'),80)},true);
  window.addEventListener('storage',e=>{if(e.key===CART_KEY)sync('storage')});
  setInterval(()=>sync('poll'),5000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&getCart().length)send('snapshot',{reason:'leave'})});
  window.fetch=async(...args)=>{
    const res=await nativeFetch(...args);
    try{
      const url=String(typeof args[0]==='string'?args[0]:args[0]?.url||'');
      if(res.ok&&url.includes('/.netlify/functions/create-order')){
        const data=await res.clone().json().catch(()=>({}));
        await send('complete',{orderNumber:data?.orderNumber||''});
        try{localStorage.removeItem(ACTIVITY_KEY)}catch{}
        const box=document.getElementById('magicLightCartRecoveryBanner');
        if(box)box.remove();
      }
    }catch{}
    return res;
  };
  lastSignature=JSON.stringify(getCart());
  if(getCart().length&&!lastActivity())touch();
  if(getCart().length)send('snapshot',{reason:'page-load'});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',showRecovery,{once:true});else showRecovery();
})();
</script>`;

function inject(file){
  let html=fs.readFileSync(file,'utf8');
  if(html.includes(`id="${MARK}"`))return false;
  const lower=html.toLowerCase();
  const i=lower.lastIndexOf('</body>');
  html=i>=0?html.slice(0,i)+runtime+'\n'+html.slice(i):html+runtime;
  fs.writeFileSync(file,html,'utf8');
  return true;
}

function walk(dir){
  if(!fs.existsSync(dir))return 0;
  let changed=0;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.name==='admin')continue;
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()) changed+=walk(p);
    else if(entry.isFile()&&entry.name.endsWith('.html')) changed+=inject(p)?1:0;
  }
  return changed;
}

const changed=walk(DIST);
console.log(`MAGIC LIGHT abandoned cart recovery: ${changed} page(s) enhanced.`);
