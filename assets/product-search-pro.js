/* MAGIC LIGHT — Recherche Produits PRO */
(()=>{
  'use strict';
  const form=document.querySelector('form.search');
  const input=form?.querySelector('input[type="search"],input[name="q"]');
  const productsSection=document.getElementById('products');
  if(!form || !input || !productsSection) return;

  form.classList.add('magic-search-ready');
  input.setAttribute('aria-autocomplete','list');
  input.setAttribute('aria-expanded','false');
  input.setAttribute('spellcheck','false');

  const dropdown=document.createElement('div');
  dropdown.className='magic-search-dropdown';
  dropdown.setAttribute('role','listbox');
  dropdown.id='magicSearchDropdown';
  input.setAttribute('aria-controls',dropdown.id);
  form.appendChild(dropdown);

  const status=document.createElement('div');
  status.className='magic-search-status';
  const firstGrid=productsSection.querySelector('.grid');
  const container=productsSection.querySelector('.container')||productsSection;
  if(firstGrid) firstGrid.parentNode.insertBefore(status,firstGrid);
  else container.appendChild(status);

  let activeIndex=-1;
  let currentMatches=[];
  let inputTimer=0;

  const normalize=value=>String(value??'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[’'`´]/g,' ')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();

  const getText=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();

  function cardInfo(card){
    const name=getText(card.querySelector('h3'));
    const reference=getText(card.querySelector('.ref'));
    const category=card.dataset.cat||getText(card.querySelector('.badge'));
    const description=getText(card.querySelector('p'));
    const raw=card.dataset.search||`${name} ${reference} ${category} ${description}`;
    const image=card.querySelector('img')?.getAttribute('src')||'';
    const price=getText(card.querySelector('.new-price,.admin-price,.old-price'));
    return {
      card,name,reference,category,description,image,price,
      nameN:normalize(name),refN:normalize(reference),catN:normalize(category),textN:normalize(raw)
    };
  }

  function tokenScore(info,token){
    if(!token) return 0;
    if(info.refN===token) return 900;
    if(info.nameN===token) return 850;
    if(info.refN.startsWith(token)) return 520;
    if(info.nameN.startsWith(token)) return 470;
    if(info.nameN.includes(token)) return 360;
    if(info.refN.includes(token)) return 330;
    if(info.catN.includes(token)) return 220;
    if(info.textN.includes(token)) return 140;
    const words=info.textN.split(' ');
    if(token.length>=3 && words.some(w=>w.startsWith(token))) return 90;
    return -1;
  }

  function score(info,query){
    const q=normalize(query);
    if(!q) return 1;
    const tokens=q.split(' ').filter(Boolean);
    let total=0;
    for(const token of tokens){
      const s=tokenScore(info,token);
      if(s<0) return -1;
      total+=s;
    }
    if(info.nameN===q) total+=1000;
    else if(info.nameN.startsWith(q)) total+=650;
    else if(info.nameN.includes(q)) total+=350;
    if(info.refN===q) total+=1200;
    else if(info.refN.startsWith(q)) total+=700;
    return total;
  }

  function isPromo(card){ return !!card.querySelector('.promo-badge'); }
  function currentCategoryMatches(card){
    const wanted=window.magicActiveCategoryFilter||document.querySelector('.filter.active')?.dataset.filter||'all';
    if(!wanted || wanted==='all') return true;
    if(wanted==='__promo__') return isPromo(card);
    return String(card.dataset.cat||'')===String(wanted);
  }

  function allCards(){ return [...document.querySelectorAll('.card[data-search],.card[data-cat]')]; }

  function setOpen(open){
    form.classList.toggle('magic-search-open',!!open);
    input.setAttribute('aria-expanded',open?'true':'false');
    if(!open) activeIndex=-1;
  }

  function renderStatus(raw,count){
    const q=String(raw||'').trim();
    if(!q){ status.classList.remove('show'); status.innerHTML=''; return; }
    status.classList.add('show');
    status.innerHTML='';
    const text=document.createElement('div');
    const strong=document.createElement('strong');
    strong.textContent=`${count} produit${count===1?'':'s'} trouvé${count===1?'':'s'}`;
    text.appendChild(strong);
    text.appendChild(document.createTextNode(` pour « ${q} »`));
    const clear=document.createElement('button');
    clear.type='button'; clear.className='magic-search-clear'; clear.textContent='Effacer';
    clear.addEventListener('click',()=>{ input.value=''; runSearch('',{updateUrl:true}); input.focus(); });
    status.append(text,clear);
  }

  function focusCard(info){
    setOpen(false);
    info.card.style.display='';
    info.card.scrollIntoView({behavior:'smooth',block:'center'});
    info.card.classList.add('magic-search-highlight');
    setTimeout(()=>info.card.classList.remove('magic-search-highlight'),1600);
    const details=info.card.querySelector('.smallbtn.primary,button[data-title],button');
    if(details) setTimeout(()=>details.click(),380);
  }

  function renderDropdown(matches,raw){
    dropdown.innerHTML='';
    activeIndex=-1;
    const q=String(raw||'').trim();
    if(!q){ setOpen(false); return; }

    const head=document.createElement('div');
    head.className='magic-search-head';
    const left=document.createElement('span'); left.textContent='Résultats rapides';
    const right=document.createElement('b'); right.textContent=`${matches.length}`;
    head.append(left,right); dropdown.appendChild(head);

    if(!matches.length){
      const empty=document.createElement('div');
      empty.className='magic-search-empty';
      empty.textContent='Aucun produit trouvé. Essayez un nom, une référence ou une catégorie.';
      dropdown.appendChild(empty); setOpen(true); return;
    }

    matches.slice(0,7).forEach((info,index)=>{
      const row=document.createElement('button');
      row.type='button'; row.className='magic-search-item'; row.setAttribute('role','option');
      row.dataset.index=String(index);

      const img=document.createElement('img');
      img.className='magic-search-thumb'; img.alt=''; img.loading='lazy'; img.src=info.image||'/assets/logo.jpg';
      const copy=document.createElement('span'); copy.className='magic-search-copy';
      const name=document.createElement('span'); name.className='magic-search-name'; name.textContent=info.name||'Produit';
      const meta=document.createElement('span'); meta.className='magic-search-meta'; meta.textContent=[info.reference,info.category].filter(Boolean).join(' • ');
      copy.append(name,meta);
      const price=document.createElement('span'); price.className='magic-search-price'; price.textContent=info.price||'';
      row.append(img,copy,price);
      row.addEventListener('click',()=>focusCard(info));
      dropdown.appendChild(row);
    });
    setOpen(true);
  }

  function updateUrl(raw){
    try{
      const url=new URL(location.href);
      const q=String(raw||'').trim();
      if(q) url.searchParams.set('q',q); else url.searchParams.delete('q');
      history.replaceState(null,'',url.pathname+url.search+location.hash);
    }catch(e){}
  }

  function runSearch(raw,options={}){
    const q=String(raw||'');
    const infos=allCards().map(cardInfo);
    const ranked=[];
    infos.forEach(info=>{
      const s=score(info,q);
      const visible=(!normalize(q) || s>=0) && currentCategoryMatches(info.card);
      info.card.style.display=visible?'':'none';
      if(visible && normalize(q)) ranked.push({...info,score:s});
    });
    ranked.sort((a,b)=>b.score-a.score || a.name.localeCompare(b.name,'fr'));
    currentMatches=ranked;
    renderStatus(q,ranked.length);
    renderDropdown(ranked,q);
    if(options.updateUrl) updateUrl(q);
    if(options.track && q.trim()) window.magicTrack?.('search',{search_term:q.trim(),results_count:ranked.length});
    if(options.scroll && q.trim()) productsSection.scrollIntoView({behavior:'smooth',block:'start'});
    return ranked;
  }

  input.addEventListener('input',()=>{
    clearTimeout(inputTimer);
    inputTimer=setTimeout(()=>runSearch(input.value),70);
  });
  input.addEventListener('focus',()=>{ if(input.value.trim()) runSearch(input.value); });

  form.addEventListener('submit',e=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    runSearch(input.value,{updateUrl:true,track:true,scroll:true});
  },true);

  input.addEventListener('keydown',e=>{
    const rows=[...dropdown.querySelectorAll('.magic-search-item')];
    if(e.key==='Escape'){ setOpen(false); return; }
    if(!rows.length) return;
    if(e.key==='ArrowDown' || e.key==='ArrowUp'){
      e.preventDefault();
      activeIndex=e.key==='ArrowDown' ? Math.min(activeIndex+1,rows.length-1) : Math.max(activeIndex-1,0);
      rows.forEach((r,i)=>r.classList.toggle('active',i===activeIndex));
      rows[activeIndex]?.scrollIntoView({block:'nearest'});
    }else if(e.key==='Enter' && activeIndex>=0){
      e.preventDefault(); e.stopImmediatePropagation(); rows[activeIndex]?.click();
    }
  });

  document.addEventListener('click',e=>{
    if(!form.contains(e.target)) setOpen(false);
    if(e.target.closest('.filter')) setTimeout(()=>runSearch(input.value),0);
  });

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>m.addedNodes.length || m.removedNodes.length)){
      clearTimeout(inputTimer);
      inputTimer=setTimeout(()=>runSearch(input.value),50);
    }
  });
  observer.observe(productsSection,{childList:true,subtree:true});

  const initial=new URLSearchParams(location.search).get('q')||input.value||'';
  if(initial){ input.value=initial; setTimeout(()=>runSearch(initial),80); }

  window.magicProfessionalSearch=runSearch;
})();
