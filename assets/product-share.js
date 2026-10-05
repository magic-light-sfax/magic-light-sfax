(()=>{
  if(location.pathname.startsWith('/admin/')) return;

  const PRODUCT_PATH='/produits.html';
  let currentProduct=null;

  function clean(v){return String(v||'').replace(/\s+/g,' ').trim();}
  function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  function productFromCard(card){
    const btn=card?.querySelector('.view-product');
    return {
      name:clean(btn?.dataset?.name||card?.querySelector('h3')?.textContent||'Produit MAGIC LIGHT'),
      ref:clean(btn?.dataset?.ref||card?.querySelector('.ref')?.textContent||''),
      desc:clean(btn?.dataset?.desc||card?.querySelector('p')?.textContent||''),
      img:btn?.dataset?.img||card?.querySelector('img')?.getAttribute('src')||''
    };
  }

  function normalizedProduct(p){
    p=p||{};
    return {
      name:clean(p.name||'Produit MAGIC LIGHT'),
      ref:clean(p.ref||''),
      desc:clean(p.desc||''),
      img:Array.isArray(p.images)?(p.images[0]||''):(p.img||'')
    };
  }

  function productUrl(p){
    const key=p.ref||p.name;
    const url=new URL(PRODUCT_PATH,location.origin);
    url.searchParams.set('share',key);
    return url.href;
  }

  function shareText(p){
    return `${p.name}${p.ref?' — '+p.ref:''}\nMAGIC LIGHT`;
  }

  function popup(url){
    const w=window.open(url,'_blank','noopener,noreferrer,width=720,height=640');
    if(!w) location.href=url;
  }

  async function copyLink(p){
    const url=productUrl(p);
    try{await navigator.clipboard.writeText(url);toast('Lien du produit copié ✓');}
    catch{
      const ta=document.createElement('textarea');ta.value=url;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();
      try{document.execCommand('copy');toast('Lien du produit copié ✓');}catch{toast('Impossible de copier le lien');}
      ta.remove();
    }
  }

  function toast(message){
    let el=document.getElementById('magicShareToast');
    if(!el){
      el=document.createElement('div');el.id='magicShareToast';
      Object.assign(el.style,{position:'fixed',left:'50%',bottom:'22px',transform:'translateX(-50%)',zIndex:'1000002',background:'#111215',color:'#fff',padding:'11px 16px',borderRadius:'999px',font:'800 13px Arial,Tahoma,sans-serif',boxShadow:'0 10px 30px rgba(0,0,0,.25)',opacity:'0',transition:'opacity .2s'});
      document.body.appendChild(el);
    }
    el.textContent=message;el.style.opacity='1';
    clearTimeout(el._t);el._t=setTimeout(()=>el.style.opacity='0',1900);
  }

  function ensureStyles(){
    if(document.getElementById('magicShareStyles')) return;
    const style=document.createElement('style');style.id='magicShareStyles';style.textContent=`
      .magic-share-trigger{white-space:nowrap}
      #magicShareSheet{position:fixed;inset:0;z-index:1000000;background:rgba(8,10,13,.62);display:none;align-items:center;justify-content:center;padding:18px}
      #magicShareSheet.open{display:flex}
      .magic-share-card{width:min(480px,100%);background:#fff;border-radius:22px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.30);font-family:Arial,Tahoma,sans-serif;color:#20242b;position:relative}
      .magic-share-head{padding-right:42px}.magic-share-head small{display:block;color:#a87925;font-weight:900;letter-spacing:.06em}.magic-share-head h3{margin:5px 0 4px;font-size:1.16rem}.magic-share-head p{margin:0;color:#727984;font-size:.82rem}
      .magic-share-close{position:absolute;right:14px;top:14px;border:0;background:#f0f1f3;width:36px;height:36px;border-radius:50%;font-size:22px;cursor:pointer}
      .magic-share-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:17px}
      .magic-share-action{min-height:48px;border:1px solid #e2e4e8;border-radius:13px;background:#fff;font-weight:900;cursor:pointer;font-size:.88rem;padding:0 10px}
      .magic-share-action.fb{background:#1877f2;color:#fff;border-color:#1877f2}.magic-share-action.wa{background:#20ad5a;color:#fff;border-color:#20ad5a}.magic-share-action.msg{background:#111215;color:#fff;border-color:#111215}.magic-share-action.copy{background:#c99a3c;color:#111;border-color:#c99a3c}
      .magic-modal-share{margin-top:9px;width:100%;min-height:44px;border:1px solid #dfe2e7;border-radius:12px;background:#fff;font-weight:900;cursor:pointer}
      @media(max-width:620px){#magicShareSheet{align-items:flex-end;padding:0}.magic-share-card{width:100%;border-radius:24px 24px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom))}.magic-share-grid{grid-template-columns:1fr 1fr}.magic-share-action{min-height:52px;font-size:.9rem}}
    `;document.head.appendChild(style);
  }

  function ensureSheet(){
    ensureStyles();
    let sheet=document.getElementById('magicShareSheet');
    if(sheet) return sheet;
    sheet=document.createElement('div');sheet.id='magicShareSheet';sheet.setAttribute('aria-hidden','true');
    sheet.innerHTML=`<div class="magic-share-card" role="dialog" aria-modal="true" aria-labelledby="magicShareTitle">
      <button class="magic-share-close" type="button" aria-label="Fermer">×</button>
      <div class="magic-share-head"><small>PARTAGER LE PRODUIT</small><h3 id="magicShareTitle">MAGIC LIGHT</h3><p id="magicShareRef"></p></div>
      <div class="magic-share-grid">
        <button class="magic-share-action fb" data-share="facebook" type="button">Facebook</button>
        <button class="magic-share-action wa" data-share="whatsapp" type="button">WhatsApp</button>
        <button class="magic-share-action msg" data-share="messenger" type="button">Messenger</button>
        <button class="magic-share-action copy" data-share="copy" type="button">Copier le lien</button>
      </div>
    </div>`;
    document.body.appendChild(sheet);
    const close=()=>{sheet.classList.remove('open');sheet.setAttribute('aria-hidden','true');};
    sheet.querySelector('.magic-share-close').onclick=close;
    sheet.addEventListener('click',e=>{if(e.target===sheet) close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sheet.classList.contains('open')) close();});
    sheet.querySelectorAll('[data-share]').forEach(btn=>btn.addEventListener('click',async()=>{
      const p=currentProduct;if(!p) return;
      const url=productUrl(p);const text=shareText(p);const action=btn.dataset.share;
      if(action==='facebook') popup('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url));
      if(action==='whatsapp') popup('https://wa.me/?text='+encodeURIComponent(text+'\n'+url));
      if(action==='copy') await copyLink(p);
      if(action==='messenger'){
        if(navigator.share){
          try{await navigator.share({title:p.name,text,url});return;}catch(err){if(err?.name==='AbortError') return;}
        }
        await copyLink(p);
        popup('https://www.facebook.com/messages/');
        toast('Lien copié — collez-le dans Messenger');
      }
    }));
    return sheet;
  }

  function openShare(product){
    currentProduct=normalizedProduct(product);
    const sheet=ensureSheet();
    sheet.querySelector('#magicShareTitle').textContent=currentProduct.name;
    sheet.querySelector('#magicShareRef').textContent=currentProduct.ref?`Référence : ${currentProduct.ref}`:'MAGIC LIGHT';
    sheet.classList.add('open');sheet.setAttribute('aria-hidden','false');
  }

  function enhanceCards(root=document){
    root.querySelectorAll?.('.card').forEach(card=>{
      if(card.dataset.magicShareReady==='1') return;
      const actions=card.querySelector('.actions');
      if(!actions) return;
      const btn=document.createElement('button');
      btn.type='button';btn.className='smallbtn magic-share-trigger';btn.textContent='↗ Partager';
      btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openShare(productFromCard(card));});
      actions.appendChild(btn);card.dataset.magicShareReady='1';
    });
  }

  function enhanceModal(){
    const copy=document.querySelector('.modal .modalcopy');
    if(!copy||document.getElementById('magicModalShare')) return;
    const btn=document.createElement('button');btn.id='magicModalShare';btn.type='button';btn.className='magic-modal-share';btn.textContent='↗ Partager ce produit';
    btn.addEventListener('click',()=>openShare(window.magicCurrentProduct||{name:document.getElementById('modalTitle')?.textContent,ref:document.getElementById('modalRef')?.textContent,desc:document.getElementById('modalDesc')?.textContent}));
    const hero=copy.querySelector('.hero-buttons');
    if(hero) hero.insertAdjacentElement('afterend',btn); else copy.appendChild(btn);
  }

  function openSharedProduct(){
    const key=clean(new URLSearchParams(location.search).get('share'));
    if(!key) return;
    const buttons=[...document.querySelectorAll('.view-product')];
    const target=buttons.find(b=>clean(b.dataset.ref).toLowerCase()===key.toLowerCase())||buttons.find(b=>clean(b.dataset.name).toLowerCase()===key.toLowerCase());
    if(!target) return;
    if(typeof window.applyMagicSearch==='function') window.applyMagicSearch(key);
    setTimeout(()=>target.click(),120);
  }

  ensureStyles();ensureSheet();enhanceCards();enhanceModal();
  const observer=new MutationObserver(muts=>{
    for(const m of muts){for(const node of m.addedNodes){if(node.nodeType===1) enhanceCards(node);}}
    enhanceModal();
  });
  observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',openSharedProduct); else openSharedProduct();
})();
