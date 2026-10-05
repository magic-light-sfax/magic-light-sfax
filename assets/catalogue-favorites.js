(() => {
  'use strict';
  const STORAGE='magicLightFavoritesV1';
  const load=()=>{try{return new Set(JSON.parse(localStorage.getItem(STORAGE)||'[]').map(String));}catch{return new Set();}};
  const save=set=>localStorage.setItem(STORAGE,JSON.stringify([...set]));
  let favorites=load();
  let favoritesOnly=false;

  const toolbar=document.createElement('div');
  toolbar.className='ml-fav-toolbar';
  toolbar.innerHTML='<strong>❤️ Mes favoris : <span data-fav-count>0</span></strong><button type="button" class="ml-fav-show">Afficher mes favoris</button>';
  const insertAfter=document.querySelector('.ml-filter-panel') || document.querySelector('.filterbar') || document.querySelector('.mobile-category-trigger') || document.querySelector('.section-head');
  if(insertAfter) insertAfter.insertAdjacentElement('afterend',toolbar);
  else document.body.prepend(toolbar);
  const countEl=toolbar.querySelector('[data-fav-count]');
  const showBtn=toolbar.querySelector('.ml-fav-show');

  function productKey(card){
    const b=card.querySelector('.view-product');
    return String(b?.dataset.ref || card.querySelector('.ref')?.textContent?.trim() || b?.dataset.name || card.querySelector('h3')?.textContent?.trim() || '').trim();
  }
  function productName(card){
    const b=card.querySelector('.view-product');
    return b?.dataset.name || card.querySelector('h3')?.textContent?.trim() || 'Produit';
  }
  function cardList(root=document){
    const out=[];
    if(root instanceof Element && root.matches('.card[data-cat],.card[data-search]')) out.push(root);
    root.querySelectorAll?.('.card[data-cat],.card[data-search]').forEach(card=>out.push(card));
    return out;
  }
  function addButton(card){
    const key=productKey(card);
    if(!key || card.querySelector('.ml-fav-btn')) return false;
    const btn=document.createElement('button');
    btn.type='button';btn.className='ml-fav-btn';btn.dataset.favKey=key;
    btn.setAttribute('aria-label','Ajouter aux favoris');
    btn.innerHTML='<span aria-hidden="true">♡</span>';
    card.appendChild(btn);
    return true;
  }
  function ensureButtons(root=document){cardList(root).forEach(addButton);sync();}
  function sync(){
    document.querySelectorAll('.ml-fav-btn').forEach(btn=>{
      const active=favorites.has(btn.dataset.favKey);
      btn.classList.toggle('active',active);
      btn.innerHTML=`<span aria-hidden="true">${active?'♥':'♡'}</span>`;
      btn.setAttribute('aria-label',active?'Retirer des favoris':'Ajouter aux favoris');
    });
    if(countEl) countEl.textContent=String(favorites.size);
    document.querySelectorAll('.card[data-cat],.card[data-search]').forEach(card=>{
      card.classList.toggle('ml-favorite-hidden',favoritesOnly && !favorites.has(productKey(card)));
    });
    showBtn?.classList.toggle('active',favoritesOnly);
    if(showBtn) showBtn.textContent=favoritesOnly?'Afficher tous les produits':'Afficher mes favoris';
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest('.ml-fav-btn');
    if(!btn) return;
    e.preventDefault();e.stopPropagation();
    const key=btn.dataset.favKey;
    if(favorites.has(key)) favorites.delete(key);
    else {
      favorites.add(key);
      const card=btn.closest('.card');
      window.magicTrack?.('favorite_add',{item_id:key,item_name:productName(card)});
    }
    save(favorites);sync();
  });
  showBtn?.addEventListener('click',()=>{favoritesOnly=!favoritesOnly;sync();});
  window.addEventListener('storage',e=>{if(e.key===STORAGE){favorites=load();sync();}});

  ensureButtons();
  const host=document.getElementById('adminProductsGrid');
  if(host){
    const known=new WeakSet(cardList(document));
    new MutationObserver(records=>{
      let changed=false;
      for(const record of records){
        for(const node of record.addedNodes){
          if(!(node instanceof Element)) continue;
          for(const card of cardList(node)){
            if(known.has(card)) continue;
            known.add(card);
            if(addButton(card)) changed=true;
          }
        }
      }
      if(changed) sync();
    }).observe(host,{childList:true,subtree:true});
  }
})();