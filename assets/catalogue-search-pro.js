(() => {
  'use strict';
  const form = document.querySelector('.search');
  const input = form?.querySelector('input');
  if (!form || !input) return;

  form.classList.add('ml-search-wrap');
  input.setAttribute('autocomplete','off');
  input.setAttribute('spellcheck','false');
  input.setAttribute('aria-autocomplete','list');

  const clear = document.createElement('button');
  clear.type='button'; clear.className='ml-search-clear'; clear.setAttribute('aria-label','Effacer la recherche'); clear.textContent='×';
  form.appendChild(clear);

  const suggest = document.createElement('div');
  suggest.className='ml-search-suggest'; suggest.setAttribute('role','listbox');
  form.appendChild(suggest);

  const productsSection=document.getElementById('products');
  const count=document.createElement('div');
  count.className='ml-search-count';
  const filterbar=productsSection?.querySelector('.filterbar');
  if(filterbar) filterbar.insertAdjacentElement('afterend',count);

  let hits=[];
  let active=-1;
  let timer=0;

  const normalize=(value)=>String(value||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

  function productFromCard(card){
    const btn=card.querySelector('.view-product');
    const img=card.querySelector('img');
    const name=btn?.dataset.name || card.querySelector('h3')?.textContent?.trim() || '';
    const ref=btn?.dataset.ref || card.querySelector('.ref')?.textContent?.trim() || '';
    const category=card.dataset.cat || card.querySelector('.badge')?.textContent?.trim() || '';
    const desc=btn?.dataset.desc || card.querySelector('p')?.textContent?.trim() || '';
    const rawPrice=btn?.dataset.price || card.querySelector('.admin-price,.new-price')?.textContent?.replace(/[^\d.,]/g,'').replace(',','.') || '';
    const hay=normalize(`${name} ${ref} ${category} ${desc} ${card.dataset.search||''}`);
    return {card,btn,img:img?.src||'',name,ref,category,desc,price:rawPrice,hay,refNorm:normalize(ref)};
  }

  function allProducts(){
    const seen=new Set();
    return [...document.querySelectorAll('.card[data-search],.card[data-cat]')].map(productFromCard).filter(p=>{
      const key=p.ref || p.name;
      if(!key || seen.has(key)) return false;
      seen.add(key); return true;
    });
  }

  function score(p,q,tokens){
    if(!q) return 0;
    const name=normalize(p.name), ref=p.refNorm, cat=normalize(p.category), desc=normalize(p.desc);
    let s=0;
    if(ref===q) s+=120;
    else if(ref.startsWith(q)) s+=90;
    else if(ref.includes(q)) s+=70;
    if(name===q) s+=100;
    else if(name.startsWith(q)) s+=70;
    else if(name.includes(q)) s+=55;
    if(cat.includes(q)) s+=25;
    if(desc.includes(q)) s+=12;
    for(const t of tokens){
      if(ref.includes(t)) s+=20;
      if(name.includes(t)) s+=14;
      if(cat.includes(t)) s+=7;
      if(desc.includes(t)) s+=3;
    }
    return s;
  }

  function renderSuggestions(results,q){
    hits=results.slice(0,8); active=-1;
    if(!q){suggest.classList.remove('open'); suggest.innerHTML=''; return;}
    const total=results.length;
    if(!total){
      suggest.innerHTML=`<div class="ml-search-status">0 résultat</div><div class="ml-search-empty">Aucun produit trouvé pour « ${escapeHtml(input.value.trim())} »</div>`;
      suggest.classList.add('open'); return;
    }
    suggest.innerHTML=`<div class="ml-search-status">${total} résultat${total>1?'s':''} • Entrée pour ouvrir le meilleur résultat</div>` + hits.map((p,i)=>{
      const price=p.price && Number.isFinite(Number(p.price)) ? `${Number(p.price).toFixed(3)} TND` : '';
      return `<button type="button" class="ml-search-hit" role="option" data-i="${i}"><img src="${escapeAttr(p.img)}" alt=""><span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.ref)}${p.category?' • '+escapeHtml(p.category):''}</small></span><span class="price">${price}</span></button>`;
    }).join('');
    suggest.classList.add('open');
  }

  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  const escapeAttr=escapeHtml;

  function reveal(p){
    if(!p) return;
    suggest.classList.remove('open');
    if(p.btn && window.openMagicProduct){ window.openMagicProduct(p.btn); return; }
    p.card.scrollIntoView({behavior:'smooth',block:'center'});
    p.card.animate?.([{transform:'scale(1)'},{transform:'scale(1.02)'},{transform:'scale(1)'}],{duration:420});
  }

  function perform(raw){
    const q=normalize(raw);
    clear.classList.toggle('show',!!q);
    const products=allProducts();
    if(!q){
      products.forEach(p=>p.card.style.display='');
      count.classList.remove('show'); count.textContent='';
      renderSuggestions([],q);
      if(window.magicActiveCategoryFilter && window.magicActiveCategoryFilter!=='all') window.applyMagicCategoryFilter?.(window.magicActiveCategoryFilter);
      return;
    }
    const tokens=q.split(/\s+/).filter(Boolean);
    const ranked=products.map(p=>({p,s:score(p,q,tokens)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s || a.p.name.localeCompare(b.p.name,'fr')).map(x=>x.p);
    const visible=new Set(ranked.map(x=>x.card));
    products.forEach(p=>p.card.style.display=visible.has(p.card)?'':'none');
    count.textContent=`Recherche « ${raw.trim()} » : ${ranked.length} produit${ranked.length>1?'s':''} trouvé${ranked.length>1?'s':''}`;
    count.classList.add('show');
    renderSuggestions(ranked,q);
    if(productsSection) productsSection.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function schedule(){ clearTimeout(timer); timer=setTimeout(()=>perform(input.value),90); }
  input.addEventListener('input',schedule);
  input.addEventListener('focus',()=>{ if(input.value.trim()) schedule(); });
  form.addEventListener('submit',e=>{
    e.preventDefault();
    perform(input.value);
    window.magicTrack?.('search',{search_term:input.value.trim()});
    if(hits[0]) reveal(hits[0]);
  });
  clear.addEventListener('click',()=>{ input.value=''; perform(''); input.focus(); });
  suggest.addEventListener('click',e=>{ const b=e.target.closest('[data-i]'); if(b) reveal(hits[Number(b.dataset.i)]); });
  input.addEventListener('keydown',e=>{
    if(!suggest.classList.contains('open') || !hits.length) return;
    if(e.key==='ArrowDown'){e.preventDefault(); active=Math.min(hits.length-1,active+1);}
    else if(e.key==='ArrowUp'){e.preventDefault(); active=Math.max(0,active-1);}
    else if(e.key==='Enter' && active>=0){e.preventDefault(); reveal(hits[active]); return;}
    else if(e.key==='Escape'){suggest.classList.remove('open'); return;}
    else return;
    [...suggest.querySelectorAll('.ml-search-hit')].forEach((el,i)=>el.classList.toggle('active',i===active));
    suggest.querySelector('.ml-search-hit.active')?.scrollIntoView({block:'nearest'});
  });
  document.addEventListener('click',e=>{if(!form.contains(e.target)) suggest.classList.remove('open');});

  // Re-run an active query after Admin products are loaded dynamically.
  const host=document.getElementById('adminProductsGrid');
  if(host){
    new MutationObserver(()=>{ if(input.value.trim()) schedule(); }).observe(host,{childList:true,subtree:true});
  }

  const initial=new URLSearchParams(location.search).get('q');
  if(initial){input.value=initial; setTimeout(()=>perform(initial),250);}
})();
