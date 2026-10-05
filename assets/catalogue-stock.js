(()=>{
'use strict';

const originalFetch=window.fetch.bind(window);
const byRef=new Map();
const byName=new Map();
let ready=false;

const normRef=v=>String(v||'').trim().toUpperCase();
const normName=v=>String(v||'').trim().toLowerCase();
const finiteQty=v=>{
  if(v===null||v===undefined||v==='') return null;
  const n=Number(v); return Number.isFinite(n)?Math.max(0,Math.floor(n)):null;
};
const finiteAlert=v=>{
  const n=Number(v); return Number.isFinite(n)?Math.max(0,Math.floor(n)):3;
};
function statusOf(qty,alert){
  if(qty===null) return 'unmanaged';
  if(qty<=0) return 'out';
  if(qty<=alert) return 'low';
  return 'in';
}
function labelOf(item){
  if(!item || item.qty===null) return item?.legacy || 'Nous contacter';
  if(item.qty<=0) return 'Rupture de stock';
  if(item.qty<=item.alert) return `Stock faible — ${item.qty} restant${item.qty>1?'s':''}`;
  return `En stock — ${item.qty}`;
}
function itemFromProduct(p){
  const reference=normRef(p?.reference);
  const qty=finiteQty(p?.stockQty ?? p?.stock_quantity ?? p?.quantity);
  const alert=finiteAlert(p?.stockAlert ?? p?.stock_alert ?? 3);
  return {reference,name:String(p?.name||''),qty,alert,status:statusOf(qty,alert),legacy:String(p?.stock||p?.availability||p?.disponibilite||'').trim(),product:p};
}
function resolveByButton(btn){
  if(!btn) return null;
  const card=btn.closest('.card');
  const view=btn.matches('.view-product')?btn:card?.querySelector('.view-product');
  const ref=normRef(btn.dataset.ref||view?.dataset.ref||card?.querySelector('.ref')?.textContent||'');
  if(ref && byRef.has(ref)) return byRef.get(ref);
  const name=normName(btn.dataset.name||view?.dataset.name||card?.querySelector('h3')?.textContent||'');
  return name?byName.get(name)||null:null;
}
function cartState(){
  try{return JSON.parse(localStorage.getItem('magicLightCart')||'[]')}catch{return []}
}
function saveCart(cart){localStorage.setItem('magicLightCart',JSON.stringify(cart));window.syncMagicLightCartCount?.()}
function existingQty(item,cart=cartState()){
  return cart.filter(x=>(item.reference&&normRef(x.ref)===item.reference)||normName(x.name)===normName(item.name)).reduce((s,x)=>s+(Number(x.qty)||1),0);
}
function syncCartMetadata(){
  const cart=cartState(); let changed=false;
  cart.forEach(row=>{
    let item=row.ref?byRef.get(normRef(row.ref)):null;
    if(!item) item=byName.get(normName(row.name));
    if(!item) return;
    if(row.ref!==item.reference){row.ref=item.reference;changed=true}
    if(item.qty!==null && row.maxStock!==item.qty){row.maxStock=item.qty;changed=true}
  });
  if(changed) saveCart(cart);
}
function stockChip(card,item){
  if(!card||!item||item.qty===null) return;
  let chip=card.querySelector('.stock-chip');
  if(!chip){
    chip=document.createElement('div'); chip.className='stock-chip';
    const price=card.querySelector('.admin-price,.promo-price');
    if(price?.parentNode) price.insertAdjacentElement('afterend',chip);
    else card.querySelector('.body')?.appendChild(chip);
  }
  chip.dataset.stockStatus=item.status;
  chip.textContent=labelOf(item);
  card.dataset.stockStatus=item.status;
  card.dataset.stockQty=String(item.qty);
}
function syncCard(card){
  if(!card) return;
  const view=card.querySelector('.view-product');
  const add=card.querySelector('.add-cart');
  const item=resolveByButton(view||add);
  if(!item) return;
  const label=labelOf(item);
  [view,add].filter(Boolean).forEach(btn=>{
    btn.dataset.ref=item.reference;
    btn.dataset.stock=label;
    if(item.qty!==null){btn.dataset.stockQty=String(item.qty);btn.dataset.stockAlert=String(item.alert)}
  });
  stockChip(card,item);
  if(add && item.qty!==null){
    const out=item.qty<=0;
    add.classList.toggle('stock-disabled',out);
    add.setAttribute('aria-disabled',out?'true':'false');
    if(out) add.textContent='Rupture';
  }
}
function scanCards(){document.querySelectorAll('.card').forEach(syncCard);syncCartMetadata()}
function syncModal(btn){
  const item=resolveByButton(btn); if(!item) return;
  const modalAdd=document.getElementById('modalAddCart');
  if(modalAdd){
    modalAdd.dataset.ref=item.reference;
    modalAdd.dataset.stock=labelOf(item);
    if(item.qty!==null){modalAdd.dataset.stockQty=String(item.qty);modalAdd.dataset.stockAlert=String(item.alert)}
    const out=item.qty!==null&&item.qty<=0;
    modalAdd.classList.toggle('stock-disabled',out);
    modalAdd.setAttribute('aria-disabled',out?'true':'false');
    modalAdd.textContent=out?'Rupture de stock':'🛒 Ajouter au panier';
  }
  const spec=document.getElementById('specStock'); if(spec) spec.textContent=labelOf(item);
  const plus=document.getElementById('qtyPlus'); if(plus&&item.qty!==null) plus.dataset.stockQty=String(item.qty);
  window.magicCurrentProduct=Object.assign({},window.magicCurrentProduct||{}, {ref:item.reference,stock:labelOf(item),stockQty:item.qty,stockAlert:item.alert});
}
async function load(){
  try{
    const [catalogueRes,liveRes]=await Promise.all([
      originalFetch('/data/products.json?stock='+Date.now(),{cache:'no-store'}),
      originalFetch('/.netlify/functions/stock',{cache:'no-store'}).catch(()=>null)
    ]);
    const products=catalogueRes.ok?await catalogueRes.json():[];
    let overrides={};
    if(liveRes?.ok){try{overrides=(await liveRes.json()).overrides||{}}catch{}}
    products.forEach(p=>{
      const item=itemFromProduct(p); if(!item.reference) return;
      const live=overrides[item.reference];
      if(live){item.qty=finiteQty(live.qty);item.alert=finiteAlert(live.alert);item.status=statusOf(item.qty,item.alert)}
      byRef.set(item.reference,item); if(item.name) byName.set(normName(item.name),item);
    });
    ready=true; window.magicStockState={byRef,byName,refresh:load};
    scanCards();
    let tries=0; const timer=setInterval(()=>{scanCards();if(++tries>=15)clearInterval(timer)},400);
  }catch(e){console.warn('MAGIC LIGHT stock indisponible',e)}
}

// Enrich order payloads with product references without changing the existing checkout code.
window.fetch=async function(input,init){
  const url=typeof input==='string'?input:String(input?.url||'');
  if(url.includes('/.netlify/functions/create-order') && init?.body && typeof init.body==='string'){
    try{
      const body=JSON.parse(init.body);
      const cart=cartState();
      if(Array.isArray(body.items)) body.items=body.items.map(row=>{
        const cartRow=cart.find(x=>normName(x.name)===normName(row.name));
        const item=(cartRow?.ref&&byRef.get(normRef(cartRow.ref)))||byName.get(normName(row.name));
        return {...row,ref:item?.reference||cartRow?.ref||''};
      });
      init={...init,body:JSON.stringify(body)};
    }catch{}
  }
  const response=await originalFetch(input,init);
  if(url.includes('/.netlify/functions/create-order') && response.ok){
    try{
      const cart=cartState();
      cart.forEach(row=>{
        const item=(row.ref&&byRef.get(normRef(row.ref)))||byName.get(normName(row.name));
        if(item&&item.qty!==null){item.qty=Math.max(0,item.qty-(Number(row.qty)||1));item.status=statusOf(item.qty,item.alert)}
      });
      setTimeout(scanCards,0);
    }catch{}
  }
  return response;
};

document.addEventListener('click',e=>{
  const view=e.target.closest('.view-product');
  if(view) setTimeout(()=>syncModal(view),0);

  if(e.target.closest('#qtyPlus')){
    const q=Number(document.getElementById('modalQty')?.textContent||1);
    const max=finiteQty(document.getElementById('modalAddCart')?.dataset.stockQty);
    if(max!==null && q>=max){e.preventDefault();e.stopImmediatePropagation();alert(`Stock disponible : ${max}`);return;}
  }

  const add=e.target.closest('.add-cart');
  if(add){
    const item=resolveByButton(add);
    if(item&&item.qty!==null){
      const modalQty=document.getElementById('modalQty');
      const addQty=add.id==='modalAddCart'?Math.max(1,Number(modalQty?.textContent)||1):1;
      const current=existingQty(item);
      if(item.qty<=0 || current+addQty>item.qty){
        e.preventDefault();e.stopImmediatePropagation();
        alert(item.qty<=0?'Produit en rupture de stock':`Stock disponible : ${item.qty}. Déjà dans le panier : ${current}.`);
        return;
      }
      setTimeout(()=>{
        const cart=cartState();
        const row=cart.find(x=>normName(x.name)===normName(item.name));
        if(row){row.ref=item.reference;row.maxStock=item.qty;saveCart(cart)}
      },0);
    }
  }

  const plus=e.target.closest('[data-cart-action="plus"]');
  if(plus){
    const index=Number(plus.dataset.index); const cart=cartState(); const row=cart[index];
    if(!row) return;
    const item=(row.ref&&byRef.get(normRef(row.ref)))||byName.get(normName(row.name));
    const max=item?.qty??finiteQty(row.maxStock);
    if(max!==null && (Number(row.qty)||1)>=max){e.preventDefault();e.stopImmediatePropagation();alert(`Stock disponible : ${max}`);}
  }
},true);

load();
})();
