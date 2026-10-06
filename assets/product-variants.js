(function(){
  'use strict';

  const DATA_URL='/data/products.json';
  const productMap=new Map();
  let productsPromise=null;

  function key(v){return String(v||'').trim().toUpperCase();}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
  function n(v){const x=Number(v);return Number.isFinite(x)?x:null;}
  function uniq(values){return [...new Set(values.map(v=>String(v||'').trim()).filter(Boolean))];}

  function productColors(product){
    const raw=Array.isArray(product?.colors)?product.colors:[];
    return uniq(raw.map(v=>{
      if(typeof v==='string') return v;
      return v?.color ?? v?.name ?? v?.label ?? '';
    }));
  }

  function normalizeVariants(product){
    const list=Array.isArray(product?.variants)?product.variants:[];
    return list.map((v,index)=>{
      if(v?.active===false) return null;
      const rawPrice=v?.price ?? product?.price;
      const price=(rawPrice===null||rawPrice===undefined||rawPrice==='')?null:n(rawPrice);
      if(price!==null && price<0) return null;
      const stockQty=(v?.stockQty===null||v?.stockQty===undefined||v?.stockQty==='')?null:n(v.stockQty);
      return {
        index,
        watt:String(v?.watt ?? v?.power ?? '').trim(),
        color:String(v?.color ?? v?.couleur ?? '').trim(),
        price,
        reference:String(v?.reference ?? '').trim(),
        image:String(v?.image ?? '').trim(),
        stockQty,
        stock:String(v?.stock ?? '').trim()
      };
    }).filter(Boolean);
  }

  function variantData(product){
    let variants=normalizeVariants(product);
    const colors=productColors(product);
    if(!variants.length && colors.length){
      const raw=product?.price;
      const price=(raw===null||raw===undefined||raw==='')?null:n(raw);
      variants=[{
        index:-1,
        watt:String(product?.watt||'').trim(),
        color:'',
        price,
        reference:'',
        image:'',
        stockQty:null,
        stock:''
      }];
    }
    return {variants,colors};
  }

  function pricing(product,variant){
    const original=n(variant?.price);
    if(original===null) return {original:null,discount:0,final:null};
    const discount=(product?.promo===true)?Math.max(0,Math.min(90,Number(product?.discount||0)||0)):0;
    const final=discount>0?original*(1-discount/100):original;
    return {original,discount,final};
  }

  function stockText(product,variant){
    if(variant.stockQty!==null){
      const qty=Math.max(0,Math.floor(Number(variant.stockQty)||0));
      if(qty<=0) return 'Rupture de stock';
      return qty===1?'En stock (1 pièce)':`En stock (${qty} pièces)`;
    }
    if(variant.stock) return variant.stock;
    if(product?.stockQty!==null && product?.stockQty!==undefined && product?.stockQty!==''){
      const qty=Math.max(0,Math.floor(Number(product.stockQty)||0));
      if(qty<=0) return 'Rupture de stock';
      return qty===1?'En stock (1 pièce)':`En stock (${qty} pièces)`;
    }
    return String(product?.stock||'').trim()||'Nous contacter';
  }

  function isOutOfStock(variant){
    return variant.stockQty!==null && Number(variant.stockQty)<=0;
  }

  function variantName(product,variant,state){
    const bits=[product?.name||'Produit'];
    const watt=state?.selectedWatt||variant?.watt||'';
    const color=state?.selectedColor||variant?.color||'';
    if(watt) bits.push(watt);
    if(color) bits.push(color);
    return bits.join(' — ');
  }

  function ensureStyle(){
    if(document.getElementById('magicVariantStyles')) return;
    const style=document.createElement('style');
    style.id='magicVariantStyles';
    style.textContent=`
      .ml-variants{margin:14px 0 16px;padding:14px;border:1px solid #e4e6ea;border-radius:14px;background:#fafafa}
      .ml-variant-group+.ml-variant-group{margin-top:13px}
      .ml-variant-label{display:flex;justify-content:space-between;gap:10px;margin-bottom:7px;font-size:.78rem;font-weight:900;color:#4d535c;text-transform:uppercase;letter-spacing:.03em}
      .ml-variant-options{display:flex;flex-wrap:wrap;gap:8px}
      .ml-variant-option{min-height:39px;padding:8px 13px;border:1px solid #cfd3d8;border-radius:10px;background:#fff;color:#20242b;font:inherit;font-weight:850;cursor:pointer;transition:.16s ease}
      .ml-variant-option:hover{border-color:#b98a31}
      .ml-variant-option.active{background:#111215;color:#fff;border-color:#111215;box-shadow:0 0 0 2px rgba(201,154,60,.18)}
      .ml-variant-option:disabled{opacity:.36;cursor:not-allowed;text-decoration:line-through}
      .ml-variant-selected{margin-top:12px;padding-top:10px;border-top:1px solid #e5e7ea;font-size:.82rem;color:#686f79}
      .ml-variant-selected strong{color:#222}
      .ml-variant-card-price{margin-top:8px;color:#a87925;font-weight:950}
      .ml-variant-card-hint{margin-top:6px;color:#6f7681;font-size:.78rem;font-weight:700}
      @media(max-width:620px){
        .ml-variants{padding:12px;margin:12px 0 14px}
        .ml-variant-option{min-height:42px;padding:9px 13px}
      }
    `;
    document.head.appendChild(style);
  }

  function ensurePicker(){
    ensureStyle();
    let root=document.getElementById('magicVariantPicker');
    if(root) return root;
    const price=document.getElementById('modalPrice');
    if(!price) return null;
    root=document.createElement('div');
    root.id='magicVariantPicker';
    root.className='ml-variants';
    root.hidden=true;
    price.insertAdjacentElement('afterend',root);
    root.addEventListener('click',event=>{
      const btn=event.target.closest('[data-variant-dim][data-variant-index]');
      if(!btn || btn.disabled || !root._state) return;
      const state=root._state;
      const dim=btn.dataset.variantDim;
      const values=dim==='watt'?state.watts:state.colors;
      const value=values[Number(btn.dataset.variantIndex)];
      if(value===undefined) return;
      if(dim==='watt'){
        state.selectedWatt=value;
        const candidates=state.variants.filter(v=>v.watt===value);
        const hasUniversal=candidates.some(v=>!v.color);
        const explicit=state.explicitColors.includes(state.selectedColor);
        if(state.colors.length && !hasUniversal && !explicit && !candidates.some(v=>v.color===state.selectedColor)){
          state.selectedColor=candidates.find(v=>v.color)?.color||state.explicitColors[0]||'';
        }
      }else{
        state.selectedColor=value;
      }
      resolveAndRender(state);
    });
    return root;
  }

  function findCurrent(state){
    const sw=state.selectedWatt||'';
    const sc=state.selectedColor||'';
    const variants=state.variants;
    let current=null;
    if(sw && sc) current=variants.find(v=>v.watt===sw && v.color===sc);
    if(!current && sw) current=variants.find(v=>v.watt===sw && !v.color);
    if(!current && sc) current=variants.find(v=>!v.watt && v.color===sc);
    if(!current) current=variants.find(v=>!v.watt && !v.color);
    if(!current && sw) current=variants.find(v=>v.watt===sw);
    if(!current && sc) current=variants.find(v=>v.color===sc);
    current=current||variants[0];
    if(current){
      if(!state.selectedWatt && current.watt) state.selectedWatt=current.watt;
      if(!state.selectedColor && current.color) state.selectedColor=current.color;
    }
    return current;
  }

  function optionsHtml(state,dim,values,label){
    if(!values.length) return '';
    return `<div class="ml-variant-group"><div class="ml-variant-label"><span>${esc(label)}</span></div><div class="ml-variant-options">${values.map((value,i)=>{
      const active=(dim==='watt'?state.selectedWatt:state.selectedColor)===value;
      let disabled=false;
      if(dim==='color' && state.watts.length && state.selectedWatt && !state.explicitColors.includes(value)){
        const universalColor=state.variants.some(v=>!v.watt && v.color===value);
        const universalWatt=state.variants.some(v=>v.watt===state.selectedWatt && !v.color);
        const exact=state.variants.some(v=>v.watt===state.selectedWatt && v.color===value);
        disabled=!(universalColor||universalWatt||exact);
      }
      return `<button type="button" class="ml-variant-option${active?' active':''}" data-variant-dim="${dim}" data-variant-index="${i}" aria-pressed="${active?'true':'false'}"${disabled?' disabled':''}>${esc(value)}</button>`;
    }).join('')}</div></div>`;
  }

  function renderPrice(product,variant){
    const priceEl=document.getElementById('modalPrice');
    const info=pricing(product,variant);
    if(!priceEl) return info;
    if(info.final===null){
      priceEl.textContent='';
      priceEl.style.setProperty('display','none','important');
      return info;
    }
    if(info.discount>0){
      priceEl.innerHTML=`<div class="promo-price"><span class="old-price">${info.original.toFixed(3)} TND</span><span class="new-price">${info.final.toFixed(3)} TND</span><span class="promo-badge">-${info.discount}%</span></div>`;
    }else{
      priceEl.textContent=info.final.toFixed(3)+' TND';
    }
    priceEl.style.setProperty('display','block','important');
    return info;
  }

  function applyVariantToModal(state,variant){
    if(!variant) return;
    const product=state.product;
    const info=renderPrice(product,variant);
    const ref=variant.reference||String(product.reference||'').trim();
    const stock=stockText(product,variant);
    const name=variantName(product,variant,state);

    const modalRef=document.getElementById('modalRef');
    const specRef=document.getElementById('specRef');
    const specPower=document.getElementById('specPower');
    const specPowerRow=document.getElementById('specPowerRow');
    const specStock=document.getElementById('specStock');
    if(modalRef) modalRef.textContent=ref;
    if(specRef) specRef.textContent=ref||'—';
    if(specPower){
      specPower.textContent=state.selectedWatt||variant.watt||String(product.watt||'');
      if(specPowerRow) specPowerRow.hidden=!specPower.textContent;
    }
    if(specStock) specStock.textContent=stock;

    const img=document.getElementById('modalImg');
    if(img && variant.image) img.src=variant.image;

    const add=document.getElementById('modalAddCart');
    const hasPrice=info.final!==null;
    if(add){
      add.dataset.name=name;
      add.dataset.price=hasPrice?info.final.toFixed(3):'';
      add.dataset.originalPrice=hasPrice?info.original.toFixed(3):'';
      add.dataset.discount=String(info.discount||0);
      add.dataset.ref=ref;
      add.dataset.variantWatt=state.selectedWatt||variant.watt||'';
      add.dataset.variantColor=state.selectedColor||variant.color||'';
      const unavailable=isOutOfStock(variant);
      add.disabled=unavailable||!hasPrice;
      add.textContent=unavailable?'Rupture de stock':'🛒 Ajouter au panier';
      add.style.opacity=(unavailable||!hasPrice)?'.55':'1';
      add.style.cursor=(unavailable||!hasPrice)?'not-allowed':'pointer';
    }
    const controls=document.getElementById('modalCartControls');
    if(controls) controls.style.setProperty('display',hasPrice?'grid':'none','important');

    const wa=document.getElementById('modalWhatsApp');
    if(wa){
      const priceText=hasPrice?' - '+info.final.toFixed(3)+' TND':'';
      const message=`Bonjour MAGIC LIGHT, je souhaite des informations sur : ${name}${ref?' ('+ref+')':''}${priceText}`;
      wa.href='https://wa.me/21622181224?text='+encodeURIComponent(message);
    }

    const current=window.magicCurrentProduct||{};
    window.magicCurrentProduct={
      ...current,
      name,
      ref,
      price:hasPrice?info.final:0,
      originalPrice:hasPrice?info.original:0,
      discount:info.discount,
      power:state.selectedWatt||variant.watt||current.power||'',
      stock,
      variant:{watt:state.selectedWatt||variant.watt||'',color:state.selectedColor||variant.color||'',reference:ref}
    };
  }

  function resolveAndRender(state){
    const root=ensurePicker();
    if(!root) return;
    const current=findCurrent(state);
    root._state=state;
    root.hidden=false;
    const parts=[];
    parts.push(optionsHtml(state,'watt',state.watts,'Puissance'));
    parts.push(optionsHtml(state,'color',state.colors,'Couleur'));
    const labels=[];
    if(current?.watt) labels.push(current.watt);
    if(current?.color) labels.push(current.color);
    if(labels.length) parts.push(`<div class="ml-variant-selected">Sélection : <strong>${esc(labels.join(' • '))}</strong></div>`);
    root.innerHTML=parts.join('');
    applyVariantToModal(state,current);
  }

  function setupModalVariants(product){
    const root=ensurePicker();
    if(!root) return;
    const data=variantData(product);
    const variants=data.variants;
    if(!variants.length){
      root.hidden=true;
      root.innerHTML='';
      root._state=null;
      return;
    }
    const watts=uniq(variants.map(v=>v.watt));
    const colors=uniq([...variants.map(v=>v.color),...data.colors]);
    const first=variants[0];
    const state={
      product,
      variants,
      watts,
      colors,
      explicitColors:data.colors,
      selectedWatt:first.watt||'',
      selectedColor:first.color||data.colors[0]||''
    };
    resolveAndRender(state);
  }

  function decorateCard(card,product){
    const data=variantData(product);
    const variants=data.variants;
    const colors=uniq([...variants.map(v=>v.color),...data.colors]);
    const watts=uniq(variants.map(v=>v.watt));
    const hasChoices=variants.length>1 || watts.length>1 || colors.length>0;
    if(!hasChoices || card.dataset.variantsReady==='1') return;
    card.dataset.variantsReady='1';
    const directAdd=card.querySelector('.add-cart');
    if(directAdd) directAdd.style.display='none';
    const basePrice=card.querySelector('.promo-price')||card.querySelector('.admin-price');
    if(basePrice) basePrice.style.display='none';

    const body=card.querySelector('.body');
    if(!body) return;
    const finals=variants.map(v=>pricing(product,v).final).filter(v=>v!==null && Number.isFinite(v));
    const min=finals.length?Math.min(...finals):null;
    const prices=uniq(finals.map(v=>Number(v).toFixed(3)));
    if(min!==null && !body.querySelector('.ml-variant-card-price')){
      const el=document.createElement('div');
      el.className='ml-variant-card-price';
      el.textContent=(prices.length>1?'À partir de ':'')+min.toFixed(3)+' TND';
      const desc=body.querySelector('p');
      (desc||body.querySelector('.ref'))?.insertAdjacentElement('afterend',el);
    }
    if(!body.querySelector('.ml-variant-card-hint')){
      const bits=[];
      if(watts.length>1) bits.push(`${watts.length} puissances`);
      else if(watts.length===1) bits.push(watts[0]);
      if(colors.length) bits.push(`${colors.length} couleur${colors.length>1?'s':''}`);
      if(bits.length){
        const el=document.createElement('div');
        el.className='ml-variant-card-hint';
        el.textContent='Choix disponibles : '+bits.join(' • ');
        const price=body.querySelector('.ml-variant-card-price');
        (price||body.querySelector('p')||body.querySelector('.ref'))?.insertAdjacentElement('afterend',el);
      }
    }
  }

  function decorateCards(){
    if(!productMap.size) return;
    document.querySelectorAll('.admin-product-card').forEach(card=>{
      const ref=card.querySelector('.view-product')?.dataset?.ref || card.querySelector('.ref')?.textContent || '';
      const product=productMap.get(key(ref));
      if(product) decorateCard(card,product);
    });
  }

  function ensureProducts(){
    if(productsPromise) return productsPromise;
    productsPromise=fetch(DATA_URL+'?variants='+Date.now(),{cache:'no-store'})
      .then(r=>{if(!r.ok) throw new Error('HTTP '+r.status); return r.json();})
      .then(products=>{
        productMap.clear();
        (Array.isArray(products)?products:[]).forEach(p=>{if(p?.reference) productMap.set(key(p.reference),p);});
        decorateCards();
        return products;
      })
      .catch(err=>{console.warn('MAGIC LIGHT variantes indisponibles:',err); return [];});
    return productsPromise;
  }

  function wrapProductModal(){
    if(typeof window.openMagicProduct!=='function') return false;
    if(window.openMagicProduct.__magicVariantsWrapped) return true;
    const original=window.openMagicProduct;
    const wrapped=function(btn){
      const result=original.apply(this,arguments);
      const ref=btn?.dataset?.ref||'';
      ensureProducts().then(()=>{
        const product=productMap.get(key(ref));
        if(product) setupModalVariants(product);
        else{
          const root=ensurePicker();
          if(root){root.hidden=true;root.innerHTML='';root._state=null;}
        }
      });
      return result;
    };
    wrapped.__magicVariantsWrapped=true;
    window.openMagicProduct=wrapped;
    return true;
  }

  function boot(){
    ensureStyle();
    ensureProducts();
    if(!wrapProductModal()){
      let tries=0;
      const timer=setInterval(()=>{tries++;if(wrapProductModal()||tries>50)clearInterval(timer);},100);
    }
    const grid=document.getElementById('adminProductsGrid');
    if(grid) new MutationObserver(()=>decorateCards()).observe(grid,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
