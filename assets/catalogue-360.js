(() => {
  'use strict';
  const stage=document.getElementById('productGalleryStage');
  if(!stage) return;

  const launch=document.createElement('button');
  launch.type='button';launch.className='ml-360-launch';launch.innerHTML='<span>↻</span><span>Vue 360°</span>';
  stage.appendChild(launch);

  const modal=document.createElement('div');
  modal.className='ml-360-modal';modal.setAttribute('aria-hidden','true');
  modal.innerHTML=`<div class="ml-360-box">
    <div class="ml-360-head"><div><div class="ml-360-title">Vue 360°</div><small>Glissez à gauche ou à droite pour faire tourner le produit</small></div><button type="button" class="ml-360-close" aria-label="Fermer">×</button></div>
    <div class="ml-360-stage"><img alt="Vue 360 du produit" draggable="false"><div class="ml-360-badge">360° • glisser pour tourner</div></div>
    <div class="ml-360-controls"><button type="button" data-360="prev">‹</button><button type="button" data-360="play">▶ Auto</button><span class="ml-360-frame"></span><button type="button" data-360="next">›</button></div>
  </div>`;
  document.body.appendChild(modal);

  const img=modal.querySelector('.ml-360-stage img');
  const dragStage=modal.querySelector('.ml-360-stage');
  const frameLabel=modal.querySelector('.ml-360-frame');
  const playBtn=modal.querySelector('[data-360="play"]');
  let products=new Map();
  let frames=[];
  let index=0;
  let dragging=false;
  let lastX=0;
  let carry=0;
  let timer=0;

  function normalizeList(value){
    if(!value) return [];
    const arr=Array.isArray(value)?value:String(value).split(/[|,]/);
    const out=[];
    for(const item of arr){
      const v=typeof item==='string'?item:(item?.image||item?.src||'');
      const s=String(v||'').trim();
      if(s && !out.includes(s)) out.push(s);
    }
    return out;
  }

  async function loadProducts(){
    try{
      const r=await fetch('/data/products.json?ts='+Date.now(),{cache:'no-store'});
      if(!r.ok) return;
      const list=await r.json();
      products=new Map(list.map(p=>[String(p.reference||'').trim(),p]));
      syncLaunch();
    }catch{}
  }

  function currentData(){
    const ref=String(window.magicCurrentProduct?.ref||'').trim();
    return products.get(ref) || null;
  }
  function syncLaunch(){
    const p=currentData();
    const spin=normalizeList(p?.spin360);
    launch.classList.toggle('show',spin.length>=2);
    launch.dataset.frames=spin.length?String(spin.length):'';
  }

  function render(i){
    if(!frames.length) return;
    index=(i+frames.length)%frames.length;
    img.src=frames[index];
    frameLabel.textContent=`${index+1} / ${frames.length}`;
    // Preload neighbours for smooth dragging.
    [index+1,index-1,index+2].forEach(n=>{
      const pre=new Image();pre.src=frames[(n+frames.length)%frames.length];
    });
  }
  function stopAuto(){
    clearInterval(timer);timer=0;
    playBtn.textContent='▶ Auto';
  }
  function toggleAuto(){
    if(timer){stopAuto();return;}
    playBtn.textContent='❚❚ Stop';
    timer=setInterval(()=>render(index+1),110);
  }
  function open(){
    const p=currentData();
    frames=normalizeList(p?.spin360);
    if(frames.length<2) return;
    const title=modal.querySelector('.ml-360-title');
    title.textContent=(window.magicCurrentProduct?.name||p?.name||'Produit')+' — Vue 360°';
    render(0);
    modal.classList.add('open');modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    window.magicTrack?.('view_360',{item_id:String(p?.reference||''),item_name:String(p?.name||'')});
  }
  function close(){
    stopAuto();modal.classList.remove('open');modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  }

  launch.addEventListener('click',open);
  modal.querySelector('.ml-360-close').addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal) close();});
  modal.querySelector('[data-360="prev"]').addEventListener('click',()=>{stopAuto();render(index-1)});
  modal.querySelector('[data-360="next"]').addEventListener('click',()=>{stopAuto();render(index+1)});
  playBtn.addEventListener('click',toggleAuto);

  dragStage.addEventListener('pointerdown',e=>{
    dragging=true;lastX=e.clientX;carry=0;stopAuto();dragStage.setPointerCapture?.(e.pointerId);
  });
  dragStage.addEventListener('pointermove',e=>{
    if(!dragging || frames.length<2) return;
    const dx=e.clientX-lastX;lastX=e.clientX;carry+=dx;
    const threshold=Math.max(7,Math.min(18,220/frames.length));
    while(Math.abs(carry)>=threshold){
      if(carry<0){render(index+1);carry+=threshold;}
      else {render(index-1);carry-=threshold;}
    }
  });
  const endDrag=()=>{dragging=false;carry=0;};
  dragStage.addEventListener('pointerup',endDrag);
  dragStage.addEventListener('pointercancel',endDrag);
  document.addEventListener('keydown',e=>{
    if(!modal.classList.contains('open')) return;
    if(e.key==='Escape') close();
    if(e.key==='ArrowLeft'){stopAuto();render(index-1);}
    if(e.key==='ArrowRight'){stopAuto();render(index+1);}
  });

  // Existing product code sets magicCurrentProduct when the detail modal opens.
  document.addEventListener('click',e=>{
    if(e.target.closest('.view-product')) setTimeout(syncLaunch,40);
  });
  const productModal=document.querySelector('.modal');
  if(productModal) new MutationObserver(syncLaunch).observe(productModal,{attributes:true,attributeFilter:['class']});

  loadProducts();
})();
