(() => {
  'use strict';
  const SOURCE_MARKER = 'magic-light-catalogue-source-v1';
  const anchor = document.querySelector('.filterbar') || document.querySelector('.mobile-category-trigger') || document.querySelector('.section-head');
  if (!anchor) return;

  const params = new URLSearchParams(location.search);
  const requestedCategory = (params.get('categorie') || '').toLowerCase();
  const requestedSystem = (params.get('systeme') || params.get('system') || '').toLowerCase();
  const taxonomyUrlActive = Boolean(requestedCategory || requestedSystem);

  const panel = document.createElement('div');
  panel.className = 'ml-filter-panel';
  panel.dataset.catalogueSource = SOURCE_MARKER;
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

  function sourceGrid(){
    return document.getElementById('adminProductsGrid') || document.querySelector('#products .container > .grid') || document.querySelector('#products .grid');
  }
  function sourceCards(){
    const grid = sourceGrid();
    return grid ? [...grid.children].filter(el => el.classList?.contains('card')) : [];
  }
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
    const cats = [...new Set(sourceCards().map(c=>info(c).cat).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
    category.innerHTML = '<option value="">Toutes les catégories</option>' + cats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    if(cats.includes(current)) category.value = current;
  }

  function ensureOrder(){
    sourceCards().forEach((card,i)=>{
      if(card.dataset.mlOriginalOrder === undefined || card.dataset.mlOriginalOrder === '') card.dataset.mlOriginalOrder=String(i);
    });
  }

  let internalReorder=false;
  function applySort(){
    ensureOrder();
    const mode = sort.value;
    const grid = sourceGrid();
    if(!grid) return;
    const current = sourceCards();
    let desired = [...current];
    if(mode==='default') desired.sort((a,b)=>Number(a.dataset.mlOriginalOrder||0)-Number(b.dataset.mlOriginalOrder||0));
    else desired.sort((a,b)=>{
      const A=info(a), B=info(b);
      if(mode==='price-asc') return (Number.isFinite(A.price)?A.price:Infinity)-(Number.isFinite(B.price)?B.price:Infinity);
      if(mode==='price-desc') return (Number.isFinite(B.price)?B.price:-Infinity)-(Number.isFinite(A.price)?A.price:-Infinity);
      if(mode==='name-asc') return A.name.localeCompare(B.name,'fr');
      if(mode==='name-desc') return B.name.localeCompare(A.name,'fr');
      return 0;
    });
    const changed=desired.some((card,i)=>card!==current[i]);
    if(!changed) return;
    internalReorder=true;
    desired.forEach(card=>grid.appendChild(card));
    queueMicrotask(()=>{ internalReorder=false; });
  }

  function isActuallyVisible(card){
    if(card.classList.contains('ml-advanced-hidden') || card.hidden) return false;
    let el=card;
    while(el && el!==document.documentElement){
      const style=getComputedStyle(el);
      if(style.display==='none' || style.visibility==='hidden') return false;
      el=el.parentElement;
    }
    return true;
  }

  function apply(){
    const cat = category.value;
    const lo = min.value === '' ? null : Number(min.value);
    const hi = max.value === '' ? null : Number(max.value);
    const promoOnly = promo.checked;
    const availableOnly = available.checked;
    const source = sourceCards();

    source.forEach(card=>{
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
    const combined=source.filter(isActuallyVisible).length;
    const active=!!(cat || min.value || max.value || promoOnly || availableOnly || sort.value!=='default');
    result.textContent = active
      ? `${combined} produit${combined===1?'':'s'} affiché${combined===1?'':'s'}`
      : taxonomyUrlActive
        ? `${combined} produit${combined===1?'':'s'} dans cette catégorie`
        : `${combined} produit${combined===1?'':'s'} dans le catalogue`;
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

  const host=sourceGrid();
  if(host){
    const known=new WeakSet();
    sourceCards().forEach(card=>known.add(card));
    let pending=0;
    const observer=new MutationObserver(records=>{
      if(internalReorder) return;
      let hasNewProduct=false;
      for(const record of records){
        for(const node of record.addedNodes){
          if(!(node instanceof Element)) continue;
          const candidates=[];
          if(node.matches?.('.card')) candidates.push(node);
          node.querySelectorAll?.('.card').forEach(c=>candidates.push(c));
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