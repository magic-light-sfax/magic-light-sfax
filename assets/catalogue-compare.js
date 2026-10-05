(() => {
  'use strict';
  const STORAGE='magicLightCompareV1';
  const MAX=4;

  const load=()=>{try{return JSON.parse(localStorage.getItem(STORAGE)||'[]').map(String).slice(0,MAX)}catch{return []}};
  let selected=load();
  const save=()=>localStorage.setItem(STORAGE,JSON.stringify(selected));

  const bar=document.createElement('div');
  bar.className='ml-compare-bar';
  bar.innerHTML='<div class="ml-compare-summary"></div><div class="ml-compare-actions"><button type="button" class="ml-compare-open">Comparer</button><button type="button" class="ml-compare-clear">Effacer</button></div>';
  document.body.appendChild(bar);
  const summary=bar.querySelector('.ml-compare-summary');
  const openBtn=bar.querySelector('.ml-compare-open');

  const modal=document.createElement('div');
  modal.className='ml-compare-modal';
  modal.setAttribute('aria-hidden','true');
  modal.innerHTML='<div class="ml-compare-dialog"><div class="ml-compare-head"><h3>Comparer les produits</h3><button type="button" class="ml-compare-close" aria-label="Fermer">×</button></div><div class="ml-compare-table-wrap"></div></div>';
  document.body.appendChild(modal);
  const tableWrap=modal.querySelector('.ml-compare-table-wrap');

  function key(card){
    const b=card.querySelector('.view-product');
    return String(b?.dataset.ref || card.querySelector('.ref')?.textContent?.trim() || b?.dataset.name || card.querySelector('h3')?.textContent?.trim() || '').trim();
  }
  function data(card){
    const b=card.querySelector('.view-product');
    const name=b?.dataset.name || card.querySelector('h3')?.textContent?.trim() || 'Produit';
    const ref=b?.dataset.ref || card.querySelector('.ref')?.textContent?.trim() || '';
    const category=card.dataset.cat || card.querySelector('.badge')?.textContent?.trim() || '—';
    const raw=b?.dataset.price || card.querySelector('.new-price,.admin-price')?.textContent?.replace(/[^\d.,]/g,'').replace(',','.') || '';
    const price=raw && Number.isFinite(Number(raw)) ? Number(raw).toFixed(3)+' TND' : 'Sur demande';
    const original=b?.dataset.originalPrice && Number(b.dataset.originalPrice)>Number(raw) ? Number(b.dataset.originalPrice).toFixed(3)+' TND' : '';
    const discount=Number(b?.dataset.discount||0)||0;
    const power=b?.dataset.watt || '—';
    const dimensions=b?.dataset.dimensions || '—';
    const stock=b?.dataset.stock || 'Nous contacter';
    const img=card.querySelector('img')?.src || b?.dataset.img || '';
    return {card,key:key(card),name,ref,category,price,original,discount,power,dimensions,stock,img};
  }
  function cardList(root=document){
    const out=[];
    if(root instanceof Element && root.matches('.card[data-cat],.card[data-search]')) out.push(root);
    root.querySelectorAll?.('.card[data-cat],.card[data-search]').forEach(card=>out.push(card));
    return out;
  }
  function all(){return cardList(document).map(data).filter(x=>x.key)};
  function addButton(card){
    const k=key(card); if(!k || card.querySelector('.ml-compare-btn')) return false;
    const b=document.createElement('button');
    b.type='button';b.className='ml-compare-btn';b.dataset.compareKey=k;
    b.innerHTML='<span>⇄</span><span class="txt">Comparer</span>';
    b.setAttribute('aria-label','Ajouter à la comparaison');
    card.appendChild(b);
    return true;
  }
  function ensureButtons(root=document){cardList(root).forEach(addButton);sync();}

  function sync(){
    const existingKeys=new Set(all().map(x=>x.key));
    selected=selected.filter(k=>existingKeys.has(k));
    save();
    document.querySelectorAll('.ml-compare-btn').forEach(btn=>{
      const active=selected.includes(btn.dataset.compareKey);
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-label',active?'Retirer de la comparaison':'Ajouter à la comparaison');
      const txt=btn.querySelector('.txt');if(txt) txt.textContent=active?'Ajouté':'Comparer';
    });
    bar.classList.toggle('show',selected.length>0);
    summary.textContent=selected.length ? `${selected.length}/${MAX} produit${selected.length>1?'s':''} sélectionné${selected.length>1?'s':''}` : '';
    openBtn.disabled=selected.length<2;
  }

  function renderTable(){
    const map=new Map(all().map(x=>[x.key,x]));
    const list=selected.map(k=>map.get(k)).filter(Boolean);
    if(list.length<2){tableWrap.innerHTML='<div style="padding:20px">Sélectionnez au moins 2 produits.</div>';return;}
    const head=list.map(p=>`<th><div class="ml-compare-prod"><img src="${esc(p.img)}" alt=""><strong>${esc(p.name)}</strong><small>${esc(p.ref)}</small><button type="button" class="ml-compare-remove" data-remove="${esc(p.key)}">Retirer</button></div></th>`).join('');
    const row=(label,fn)=>`<tr><td>${label}</td>${list.map(p=>`<td>${fn(p)}</td>`).join('')}</tr>`;
    tableWrap.innerHTML=`<table class="ml-compare-table"><thead><tr><th>Critère</th>${head}</tr></thead><tbody>
      ${row('Catégorie',p=>esc(p.category))}
      ${row('Prix',p=>`${p.original?`<div><s>${esc(p.original)}</s></div>`:''}<strong>${esc(p.price)}</strong>${p.discount?` <span class="promo-badge">-${p.discount}%</span>`:''}`)}
      ${row('Référence',p=>esc(p.ref||'—'))}
      ${row('Puissance',p=>esc(p.power||'—'))}
      ${row('Dimensions',p=>esc(p.dimensions||'—'))}
      ${row('Disponibilité',p=>esc(p.stock||'—'))}
    </tbody></table>`;
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}

  document.addEventListener('click',e=>{
    const btn=e.target.closest('.ml-compare-btn');
    if(!btn) return;
    e.preventDefault();e.stopPropagation();
    const k=btn.dataset.compareKey;
    if(selected.includes(k)) selected=selected.filter(x=>x!==k);
    else {
      if(selected.length>=MAX){alert('Vous pouvez comparer jusqu’à 4 produits.');return;}
      selected.push(k);
      const item=all().find(x=>x.key===k);
      window.magicTrack?.('compare_add',{item_id:k,item_name:item?.name||''});
    }
    save();sync();
  });

  bar.querySelector('.ml-compare-clear').addEventListener('click',()=>{selected=[];save();sync();modal.classList.remove('open');});
  openBtn.addEventListener('click',()=>{renderTable();modal.classList.add('open');modal.setAttribute('aria-hidden','false');});
  modal.querySelector('.ml-compare-close').addEventListener('click',()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');});
  modal.addEventListener('click',e=>{if(e.target===modal){modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}});
  tableWrap.addEventListener('click',e=>{
    const b=e.target.closest('[data-remove]');if(!b) return;
    selected=selected.filter(x=>x!==b.dataset.remove);save();sync();renderTable();
    if(selected.length<2){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');}
  });
  window.addEventListener('storage',e=>{if(e.key===STORAGE){selected=load();sync();}});

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