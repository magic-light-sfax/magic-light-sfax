(function(){
  'use strict';

  const DATA_URL='/data/products.json';
  const productsByRef=new Map();
  let dataPromise=null;
  let currentParentRef='';

  function key(v){return String(v||'').trim().toUpperCase();}

  function ensureData(){
    if(dataPromise) return dataPromise;
    dataPromise=fetch(DATA_URL+'?variantDimensions='+Date.now(),{cache:'no-store'})
      .then(r=>{if(!r.ok) throw new Error('HTTP '+r.status);return r.json();})
      .then(products=>{
        productsByRef.clear();
        (Array.isArray(products)?products:[]).forEach(p=>{
          if(p?.reference) productsByRef.set(key(p.reference),p);
        });
        return products;
      })
      .catch(err=>{
        console.warn('MAGIC LIGHT dimensions variantes indisponibles:',err);
        return [];
      });
    return dataPromise;
  }

  function normalizeVariants(product){
    const list=Array.isArray(product?.variants)?product.variants:[];
    return list.map(v=>({
      watt:String(v?.watt ?? v?.power ?? '').trim(),
      color:String(v?.color ?? v?.couleur ?? '').trim(),
      dimensions:String(v?.dimensions ?? v?.dimension ?? v?.diameter ?? '').trim(),
      active:v?.active!==false
    })).filter(v=>v.active);
  }

  function selectedValue(dim){
    const button=document.querySelector('.ml-variant-option.active[data-variant-dim="'+dim+'"]');
    return String(button?.textContent||'').trim();
  }

  function findVariant(product){
    const variants=normalizeVariants(product);
    if(!variants.length) return null;
    const watt=selectedValue('watt');
    const color=selectedValue('color');
    let current=null;
    if(watt && color) current=variants.find(v=>v.watt===watt && v.color===color);
    if(!current && watt) current=variants.find(v=>v.watt===watt && !v.color);
    if(!current && color) current=variants.find(v=>!v.watt && v.color===color);
    if(!current) current=variants.find(v=>!v.watt && !v.color);
    if(!current && watt) current=variants.find(v=>v.watt===watt);
    if(!current && color) current=variants.find(v=>v.color===color);
    return current||variants[0];
  }

  function applyDimensions(){
    if(!currentParentRef) return;
    const product=productsByRef.get(key(currentParentRef));
    if(!product) return;
    const variant=findVariant(product);
    const dimensions=String(variant?.dimensions || product?.dimensions || '').trim();
    const value=document.getElementById('specDimensions');
    const row=document.getElementById('specDimensionsRow');
    if(value) value.textContent=dimensions;
    if(row) row.hidden=!dimensions;
    if(window.magicCurrentProduct){
      window.magicCurrentProduct.dimensions=dimensions;
    }
  }

  function queueApply(){
    ensureData().then(()=>{
      requestAnimationFrame(applyDimensions);
      setTimeout(applyDimensions,80);
      setTimeout(applyDimensions,250);
    });
  }

  function wrapProductModal(){
    if(typeof window.openMagicProduct!=='function') return false;
    if(window.openMagicProduct.__magicVariantDimensionsWrapped) return true;
    const original=window.openMagicProduct;
    const wrapped=function(btn){
      currentParentRef=btn?.dataset?.ref||'';
      const result=original.apply(this,arguments);
      queueApply();
      return result;
    };
    wrapped.__magicVariantDimensionsWrapped=true;
    window.openMagicProduct=wrapped;
    return true;
  }

  document.addEventListener('click',event=>{
    if(event.target.closest('.ml-variant-option')) queueApply();
  });

  function boot(){
    ensureData();
    if(!wrapProductModal()){
      let tries=0;
      const timer=setInterval(()=>{
        tries++;
        if(wrapProductModal()||tries>60) clearInterval(timer);
      },100);
    }
    const observer=new MutationObserver(mutations=>{
      if(!currentParentRef) return;
      if(mutations.some(m=>m.target?.closest?.('#magicVariantPicker') || m.target?.id==='magicVariantPicker')) queueApply();
    });
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
