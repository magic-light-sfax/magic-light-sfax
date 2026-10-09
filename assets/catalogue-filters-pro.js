(() => {
  'use strict';
  const anchor = document.querySelector('.filterbar') || document.querySelector('.mobile-category-trigger') || document.querySelector('.section-head');
  if (!anchor) return;

  const pendingCategories = new Set(['systeme-43','systeme-45','systeme-44','schneider-electric','legrand','somef','chint','tti','siame']);
  const requestedCategory = (new URLSearchParams(location.search).get('categorie') || '').toLowerCase();
  const isPendingCategory = pendingCategories.has(requestedCategory);

  const panel = document.createElement('div');
  panel.className = 'ml-filter-panel';
  panel.innerHTML = `
    <button class="ml-filter-toggle" type="button" aria-expanded="false">
      <span>⚙️ Filtres avancés</span><span>Catégorie • Prix • Promo • Tri</span>
    </button>
    <div class="ml-filter-body">
      <div class="ml-filter-field"><label>Catégorie</label><select data-ml-filter="category"><option value="">Toutes les catégories</option></select></div>
      <div class="ml-filter-field"><label>Prix min (TND)</label><input data-ml-filter="min" type="number" min="0" step="0.001" placeholder="0"></div>
      <div class="ml-filter-field"><label>Prix max (TND)</label><input data-ml-filter="max" type="number" min="0" step="0.001" placeholder="Max"></div>
      <div class="ml-filter-field"><label>Trier par</label><select data-ml-filter="sort"><option value="default">Ordre du catalogue</option><option value="price-asc">Prix croissant</option><option value="price-desc">Prix décroissant</option><option value="name-asc">Nom A → Z</option><option value="name-desc">Nom Z → A</option></select></div>
      <div class="ml-filter-checks">
        <label class="ml-filter-check"><input data-ml-filter="promo" type="checkbox"> Promo uniquement</label>
        <label class="ml-filter-check"><input data-ml-filter="available" type="checkbox"> Disponibles</label>
      </div>
      <div class="ml-filter-actions"><button class="ml-filter-reset" type="button">Réinitialiser</button></div>
    </div>
    <div class="ml-filter-result" aria-live="polite"></div>`;
  anchor.insertAdjacentElement('afterend', panel);

  const $ = s => panel.querySelector(s);
  const category = $('[data-ml-filter="category"]');
  const min = $('[data-ml-filter="min"]');
  const max = $('[data-ml-filter="max"]');
  const promo = $('[data-ml-filter="promo"]');
  const available = $('[data-ml-filter="available"]');
  const sort = $('[data-ml-filter="sort"]');
  const result = $('.ml-filter-result');

  function cards(){ return [...document.querySelectorAll('.card[data-cat],.card[data-search]')]; }
  function btn(card){ return card.querySelector('.view-product'); }
  function info(card){
    const b = btn(card);
    const name = b?.dataset.name || card.querySelector('h3')?.textContent?.trim() || '';
    const cat = card.dataset.cat || card.querySelector('.badge')?.textContent?.trim() || 'Autres';
    const rawPrice = b?.dataset.price || card.querySelector('.new-price,.admin-price')?.textContent?.replace(/[^\d.,]/g,'').replace(',','.') || '';
    const price = rawPrice === '' ? NaN : Number(rawPrice);
    const discount = Number(b?.dataset.discount || 0) || 0;
    const isPromo = card.dataset.promo === 'true' || discount > 0 || !!card.querySelector('.promo-badge');
    const stockRaw = String(b?.dataset.stock || '').trim().toLowerCase();
    const unavailable = /rupture|épuis|epuis|indispon|out\s*of\s*stock|^0$/.test(stockRaw);
    return {card,b,name,cat,price,isPromo,available:!unavailable};
  }

  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}

  function populateCategories(){
    const current = category.value;
    const cats = [...new Set(cards().map(c=>info(c).cat).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
    category.innerHTML = '<option value="">Toutes les catégories</option>' + cats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    if(cats.includes(current)) category.value = current;
  }

  function ensureOrder(){
    document.querySelectorAll('.grid').forEach(grid=>{
      [...grid.children].filter(el=>el.classList?.contains('card')).forEach((card,i)=>{
        if(card.dataset.mlOriginalOrder === undefined || card.dataset.mlOriginalOrder === '') card.dataset.mlOriginalOrder=String(i);
      });
    });
  }

  let internalReorder=false;
  function applySort(){
    ensureOrder();
    const mode = sort.value;
    if(mode==='default') return;
    internalReorder=true;
    document.querySelectorAll('.grid').forEach(grid=>{
      const current=[...grid.children].filter(el=>el.classList?.contains('card'));
      const desired=[...current].sort((a,b)=>{
        const A=info(a), B=info(b);
        if(mode==='price-asc') return (Number.isFinite(A.price)?A.price:Infinity)-(Number.isFinite(B.price)?B.price:Infinity);
        if(mode==='price-desc') return (Number.isFinite(B.price)?B.price:-Infinity)-(Number.isFinite(A.price)?A.price:-Infinity);
        if(mode==='name-asc') return A.name.localeCompare(B.name,'fr');
        if(mode==='name-desc') return B.name.localeCompare(A.name,'fr');
        return 0;
      });
      const changed=desired.some((card,i)=>card!==current[i]);
      if(changed) desired.forEach(card=>grid.appendChild(card));
    });
    queueMicrotask(()=>{ internalReorder=false; });
  }

  function ensurePendingEmpty(){
    if(!isPendingCategory) return false;
    cards().forEach(card=>card.classList.add('ml-advanced-hidden'));
    result.textContent='0 produit dans le catalogue';
    let empty=document.getElementById('ml-category-empty');
    if(!empty){
      empty=document.createElement('div');
      empty.id='ml-category-empty';
      empty.style.cssText='max-width:900px;margin:30px auto;padding:30px 20px;text-align:center;border:1px dashed #d9dde3;border-radius:16px;background:#fff;color:#777';
      empty.innerHTML='<strong style="display:block;color:#222;font-size:1.1rem;margin-bottom:7px">Aucun produit pour le moment</strong><span>Les produits de cette catégorie seront ajoutés prochainement.</span>';
      const grid=document.getElementById('adminProductsGrid')||document.querySelector('.grid');
      if(grid&&grid.parentNode) grid.parentNode.insertBefore(empty,grid);
    }
    return true;
  }

  function apply(){
    if(ensurePendingEmpty()) return;
    const cat = category.value;
    const lo = min.value === '' ? null : Number(min.value);
    const hi = max.value === '' ? null : Number(max.value);
    const promoOnly = promo.checked;
    const availableOnly = available.checked;
    cards().forEach(card=>{
      const p=info(card);
      let ok=true;
      if(cat && p.cat!==cat) ok=false;
      if(lo!==null && (!Number.isFinite(p.price) || p.price<lo)) ok=false;
      if(hi!==null && (!Number.isFinite(p.price) || p.price>hi)) ok=false;
      if(promoOnly && !p.isPromo) ok=false;
      if(availableOnly && !p.available) ok=false;
      card.classList.toggle('ml-advanced-hidden',!ok);
    });
    applySort();
    const combined=cards().filter(c=>!c.classList.contains('ml-advanced-hidden') && c.style.display!=='none').length;
    const active=!!(cat || min.value || max.value || promoOnly || availableOnly || sort.value!=='default');
    result.textContent = active ? `${combined} produit${combined>1?'s':''} affiché${combined>1?'s':''}` : `${cards().length} produits dans le catalogue`;
  }

  panel.querySelector('.ml-filter-toggle').addEventListener('click',e=>{
    panel.classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded',panel.classList.contains('open')?'true':'false');
  });
  panel.querySelector('.ml-filter-reset').addEventListener('click',()=>{
    category.value=''; min.value=''; max.value=''; promo.checked=false; available.checked=false; sort.value='default'; apply();
  });
  [category,min,max,promo,available,sort].forEach(el=>el.addEventListener(el.tagName==='INPUT' && el.type==='number'?'input':'change',apply));

  populateCategories(); ensureOrder(); apply();

  const host=document.getElementById('adminProductsGrid');
  if(host){
    const known=new WeakSet();
    cards().forEach(card=>known.add(card));
    let pending=0;
    const observer=new MutationObserver(records=>{
      if(internalReorder) return;
      let hasNewProduct=false;
      for(const record of records){
        for(const node of record.addedNodes){
          if(!(node instanceof Element)) continue;
          const candidates=[];
          if(node.matches?.('.card[data-cat],.card[data-search]')) candidates.push(node);
          node.querySelectorAll?.('.card[data-cat],.card[data-search]').forEach(c=>candidates.push(c));
          for(const card of candidates){
            if(!known.has(card)){ known.add(card); hasNewProduct=true; }
          }
        }
      }
      if(!hasNewProduct) return;
      clearTimeout(pending);
      pending=setTimeout(()=>{populateCategories();ensureOrder();apply();},80);
    });
    observer.observe(host,{childList:true,subtree:true});
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('.filter,[data-drawer-filter]')) setTimeout(apply,20);
  });
  document.querySelector('.search input')?.addEventListener('input',()=>setTimeout(apply,130));
})();