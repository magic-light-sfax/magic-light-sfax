(function(){
  'use strict';

  const DATA_URL='/data/products.json';
  const productMap=new Map();
  let productsPromise=null;

  function key(v){return String(v||'').trim().toUpperCase();}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
  function n(v){const x=Number(v);return Number.isFinite(x)?x:null;}
  function clean(v){return String(v??'').trim();}
  function uniq(values){return [...new Set(values.map(clean).filter(Boolean))];}
  function sameLabel(a,b){return clean(a).toLocaleLowerCase('fr')===clean(b).toLocaleLowerCase('fr');}
  function canonicalLabel(label){
    const s=clean(label);
    const k=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if(['watt','watts','puissance','power'].includes(k)) return 'Puissance';
    if(['couleur','color','colour','couleur produit','couleur du produit'].includes(k)) return 'Couleur';
    if(['cct','temperature de couleur','temperature couleur','couleur d eclairage','couleur eclairage'].includes(k)) return "Couleur d'éclairage";
    if(['intensite','amperage','ampere','amperes'].includes(k)) return 'Intensité';
    if(['longueur','length'].includes(k)) return 'Longueur';
    if(['diametre','diameter'].includes(k)) return 'Diamètre';
    if(['pack','conditionnement','lot'].includes(k)) return 'Pack';
    return s;
  }
  function normalizeValueList(raw){
    if(!Array.isArray(raw)) return [];
    return uniq(raw.map(v=>{
      if(typeof v==='string' || typeof v==='number') return v;
      return v?.value ?? v?.label ?? v?.name ?? v?.color ?? '';
    }));
  }

  function legacyColors(product){
    return normalizeValueList(product?.colors);
  }

  function explicitOptionGroups(product){
    const groups=[];
    const add=(name,values)=>{
      name=canonicalLabel(name);
      values=normalizeValueList(values);
      if(!name || !values.length) return;
      const existing=groups.find(g=>sameLabel(g.name,name));
      if(existing) existing.values=uniq([...existing.values,...values]);
      else groups.push({name,values,explicit:true});
    };
    (Array.isArray(product?.options)?product.options:[]).forEach(group=>{
      if(typeof group==='string') return;
      add(group?.name ?? group?.label ?? group?.option, group?.values ?? group?.choices ?? group?.options);
    });
    const colors=legacyColors(product);
    if(colors.length) add('Couleur',colors);
    return groups;
  }

  function normalizeAttributes(variant){
    const attrs={};
    const add=(name,value)=>{
      name=canonicalLabel(name);
      value=clean(value);
      if(name && value) attrs[name]=value;
    };
    (Array.isArray(variant?.attributes)?variant.attributes:[]).forEach(pair=>{
      if(!pair || typeof pair!=='object') return;
      add(pair.name ?? pair.label ?? pair.option, pair.value ?? pair.val ?? pair.choice);
    });
    add('Puissance',variant?.watt ?? variant?.power);
    add('Couleur',variant?.color ?? variant?.couleur);
    add("Couleur d'éclairage",variant?.cct ?? variant?.temperature ?? variant?.temperatureColor);
    add('Intensité',variant?.intensity ?? variant?.amperage);
    add('Longueur',variant?.length);
    add('Diamètre',variant?.diameter);
    add('Pack',variant?.pack);
    return attrs;
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
        attributes:normalizeAttributes(v),
        price,
        reference:clean(v?.reference),
        image:clean(v?.image),
        dimensions:clean(v?.dimensions ?? v?.dimension ?? v?.diameterText),
        stockQty,
        stock:clean(v?.stock)
      };
    }).filter(Boolean);
  }

  function variantData(product){
    let variants=normalizeVariants(product);
    const explicit=explicitOptionGroups(product);
    if(!variants.length && explicit.length){
      const raw=product?.price;
      const price=(raw===null||raw===undefined||raw==='')?null:n(raw);
      variants=[{
        index:-1,
        attributes:{},
        price,
        reference:'',
        image:'',
        dimensions:clean(product?.dimensions),
        stockQty:null,
        stock:''
      }];
    }

    const groups=[];
    const addGroup=(name,values,explicitFlag=false)=>{
      name=canonicalLabel(name);
      values=uniq(values||[]);
      if(!name || !values.length) return;
      const existing=groups.find(g=>sameLabel(g.name,name));
      if(existing){
        existing.values=uniq([...existing.values,...values]);
        existing.explicit=existing.explicit||explicitFlag;
      }else groups.push({name,values,explicit:explicitFlag});
    };
    explicit.forEach(g=>addGroup(g.name,g.values,true));

    const attributeOrder=[];
    variants.forEach(v=>Object.keys(v.attributes).forEach(name=>{
      if(!attributeOrder.some(x=>sameLabel(x,name))) attributeOrder.push(name);
    }));
    const preferred=['Puissance','Couleur',"Couleur d'éclairage",'Intensité','Longueur','Diamètre','Pack'];
    attributeOrder.sort((a,b)=>{
      const ai=preferred.findIndex(x=>sameLabel(x,a));
      const bi=preferred.findIndex(x=>sameLabel(x,b));
      if(ai===-1 && bi===-1) return 0;
      if(ai===-1) return 1;
      if(bi===-1) return -1;
      return ai-bi;
    });
    attributeOrder.forEach(name=>addGroup(name,variants.map(v=>v.attributes[name]).filter(Boolean),false));

    return {variants,groups};
  }

  function pricing(product,variant){
    const original=n(variant?.price);
    if(original===null) return {original:null,discount:0,final:null};
    const discount=(product?.promo===true)?Math.max(0,Math.min(90,Number(product?.discount||0)||0)):0;
    const final=discount>0?original*(1-discount/100):original;
    return {original,discount,final};
  }

  function stockText(product,variant){
    if(variant?.stockQty!==null && variant?.stockQty!==undefined){
      const qty=Math.max(0,Math.floor(Number(variant.stockQty)||0));
      if(qty<=0) return 'Rupture de stock';
      return qty===1?'En stock (1 pièce)':`En stock (${qty} pièces)`;
    }
    if(variant?.stock) return variant.stock;
    if(product?.stockQty!==null && product?.stockQty!==undefined && product?.stockQty!==''){
      const qty=Math.max(0,Math.floor(Number(product.stockQty)||0));
      if(qty<=0) return 'Rupture de stock';
      return qty===1?'En stock (1 pièce)':`En stock (${qty} pièces)`;
    }
    return clean(product?.stock)||'Nous contacter';
  }

  function isOutOfStock(variant){
    return variant?.stockQty!==null && variant?.stockQty!==undefined && Number(variant.stockQty)<=0;
  }

  function selectedEntries(state){
    return state.groups.map(g=>[g.name,clean(state.selected[g.name])]).filter(([,v])=>v);
  }

  function variantName(product,state){
    const bits=[product?.name||'Produit'];
    selectedEntries(state).forEach(([,value])=>{
      if(value && !bits.includes(value)) bits.push(value);
    });
    return bits.join(' — ');
  }

  function variantMatchesSelection(variant,selected,ignoreGroup=''){
    for(const [name,value] of Object.entries(variant.attributes||{})){
      if(ignoreGroup && sameLabel(name,ignoreGroup)) continue;
      const selectedName=Object.keys(selected).find(k=>sameLabel(k,name));
      const chosen=selectedName?clean(selected[selectedName]):'';
      if(chosen && clean(value)!==chosen) return false;
    }
    return true;
  }

  function findCurrent(state){
    const matches=state.variants.filter(v=>variantMatchesSelection(v,state.selected));
    const pool=matches.length?matches:state.variants;
    return pool.slice().sort((a,b)=>Object.keys(b.attributes||{}).length-Object.keys(a.attributes||{}).length)[0]||null;
  }

  function valueAvailable(state,group,value){
    const constrained=state.variants.some(v=>Object.keys(v.attributes||{}).some(k=>sameLabel(k,group.name)));
    if(!constrained) return true;
    const probe={...state.selected,[group.name]:value};
    return state.variants.some(v=>{
      const attrName=Object.keys(v.attributes||{}).find(k=>sameLabel(k,group.name));
      if(attrName && clean(v.attributes[attrName])!==clean(value)) return false;
      return variantMatchesSelection(v,probe,group.name);
    });
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
      .ml-variant-selected{margin-top:12px;padding-top:10px;border-top:1px solid #e5e7ea;font-size:.82rem;color:#686f79;line-height:1.5}
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
      const btn=event.target.closest('[data-variant-group-index][data-variant-value-index]');
      if(!btn || btn.disabled || !root._state) return;
      const state=root._state;
      const group=state.groups[Number(btn.dataset.variantGroupIndex)];
      if(!group) return;
      const value=group.values[Number(btn.dataset.variantValueIndex)];
      if(value===undefined) return;
      state.selected[group.name]=value;
      resolveAndRender(state);
    });
    return root;
  }

  function optionsHtml(state,group,groupIndex){
    if(!group?.values?.length) return '';
    const chosen=clean(state.selected[group.name]);
    const buttons=group.values.map((value,i)=>{
      const active=chosen===clean(value);
      const disabled=!valueAvailable(state,group,value);
      return `<button type="button" class="ml-variant-option${active?' active':''}" data-variant-group-index="${groupIndex}" data-variant-value-index="${i}" aria-pressed="${active?'true':'false'}"${disabled?' disabled':''}>${esc(value)}</button>`;
    }).join('');
    return `<div class="ml-variant-group"><div class="ml-variant-label"><span>${esc(group.name)}</span></div><div class="ml-variant-options">${buttons}</div></div>`;
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
    }else priceEl.textContent=info.final.toFixed(3)+' TND';
    priceEl.style.setProperty('display','block','important');
    return info;
  }

  function getSelected(state,label){
    const hit=Object.keys(state.selected).find(k=>sameLabel(k,label));
    return hit?clean(state.selected[hit]):'';
  }

  function applyVariantToModal(state,variant){
    if(!variant) return;
    const product=state.product;
    const info=renderPrice(product,variant);
    const ref=variant.reference||clean(product.reference);
    const stock=stockText(product,variant);
    const dimensions=variant.dimensions||clean(product.dimensions);
    const power=getSelected(state,'Puissance')||clean(product.watt);
    const name=variantName(product,state);

    const modalRef=document.getElementById('modalRef');
    const specRef=document.getElementById('specRef');
    const specPower=document.getElementById('specPower');
    const specPowerRow=document.getElementById('specPowerRow');
    const specDimensions=document.getElementById('specDimensions');
    const specDimensionsRow=document.getElementById('specDimensionsRow');
    const specStock=document.getElementById('specStock');
    if(modalRef) modalRef.textContent=ref;
    if(specRef) specRef.textContent=ref||'—';
    if(specPower){
      specPower.textContent=power;
      if(specPowerRow) specPowerRow.hidden=!power;
    }
    if(specDimensions){
      specDimensions.textContent=dimensions;
      if(specDimensionsRow) specDimensionsRow.hidden=!dimensions;
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
      add.dataset.variantWatt=power;
      add.dataset.variantColor=getSelected(state,'Couleur');
      add.dataset.variantOptions=JSON.stringify(Object.fromEntries(selectedEntries(state)));
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
      power:power||current.power||'',
      dimensions,
      stock,
      variant:{
        reference:ref,
        options:Object.fromEntries(selectedEntries(state))
      }
    };
  }

  function resolveAndRender(state){
    const root=ensurePicker();
    if(!root) return;
    const current=findCurrent(state);
    root._state=state;
    root.hidden=false;
    const parts=state.groups.map((group,i)=>optionsHtml(state,group,i));
    const labels=selectedEntries(state).map(([name,value])=>`${esc(name)}: <strong>${esc(value)}</strong>`);
    if(labels.length) parts.push(`<div class="ml-variant-selected">Sélection : ${labels.join(' • ')}</div>`);
    root.innerHTML=parts.join('');
    applyVariantToModal(state,current);
  }

  function setupModalVariants(product){
    const root=ensurePicker();
    if(!root) return;
    const data=variantData(product);
    if(!data.variants.length || !data.groups.length){
      root.hidden=true;
      root.innerHTML='';
      root._state=null;
      return;
    }
    const first=data.variants[0];
    const selected={};
    data.groups.forEach(group=>{
      const attrName=Object.keys(first.attributes||{}).find(k=>sameLabel(k,group.name));
      selected[group.name]=attrName?first.attributes[attrName]:(group.values[0]||'');
    });
    const state={product,variants:data.variants,groups:data.groups,selected};
    resolveAndRender(state);
  }

  function cardHint(group){
    const count=group.values.length;
    if(sameLabel(group.name,'Puissance')) return count>1?`${count} puissances`:(group.values[0]||'');
    if(sameLabel(group.name,'Couleur')) return count>1?`${count} couleurs`:(group.values[0]||'');
    if(count===1) return `${group.name}: ${group.values[0]}`;
    return `${group.name}: ${count} choix`;
  }

  function decorateCard(card,product){
    const data=variantData(product);
    const hasChoices=data.groups.some(g=>g.values.length>0);
    if(!hasChoices || card.dataset.variantsReady==='1') return;
    card.dataset.variantsReady='1';
    const directAdd=card.querySelector('.add-cart');
    if(directAdd) directAdd.style.display='none';
    const basePrice=card.querySelector('.promo-price')||card.querySelector('.admin-price');
    if(basePrice) basePrice.style.display='none';

    const body=card.querySelector('.body');
    if(!body) return;
    const finals=data.variants.map(v=>pricing(product,v).final).filter(v=>v!==null && Number.isFinite(v));
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
      const bits=data.groups.map(cardHint).filter(Boolean);
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
      .then(r=>{if(!r.ok) throw new Error('HTTP '+r.status);return r.json();})
      .then(products=>{
        productMap.clear();
        (Array.isArray(products)?products:[]).forEach(p=>{if(p?.reference) productMap.set(key(p.reference),p);});
        decorateCards();
        return products;
      })
      .catch(err=>{console.warn('MAGIC LIGHT variantes indisponibles:',err);return [];});
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
