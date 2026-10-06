const fs=require('fs');
const path=require('path');

const DIST=path.join(process.cwd(),'dist');
const MARK='magic-light-gallery-polish-v1';

const style=`<style id="${MARK}">
#productGalleryStage{position:relative;touch-action:pan-y}
.magic-gallery-counter{position:absolute;left:12px;bottom:12px;z-index:6;background:rgba(17,18,21,.78);color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:999px;padding:5px 9px;font:800 12px/1 Arial,Tahoma,sans-serif;backdrop-filter:blur(8px);display:none;pointer-events:none}
.magic-gallery-swipe-hint{display:none}
@media(max-width:620px){
  .magic-gallery-counter{left:10px;bottom:10px;font-size:11px;padding:5px 8px}
  .magic-gallery-swipe-hint{position:absolute;left:50%;bottom:11px;transform:translateX(-50%);z-index:5;color:#fff;background:rgba(17,18,21,.58);border-radius:999px;padding:5px 9px;font:700 10px/1 Arial,Tahoma,sans-serif;pointer-events:none;display:none}
  #productGalleryStage[data-multi-gallery="true"] .magic-gallery-swipe-hint{display:block}
}
</style>`;

const runtime=`<script id="${MARK}-runtime">
(()=>{
  if(window.__magicLightGalleryPolish)return;
  window.__magicLightGalleryPolish=true;

  const install=()=>{
    const stage=document.getElementById('productGalleryStage');
    const img=document.getElementById('modalImg');
    const thumbs=document.getElementById('galleryThumbs');
    const prev=document.getElementById('galleryPrev');
    const next=document.getElementById('galleryNext');
    const modal=document.querySelector('.modal');
    if(!stage||!img)return;

    let counter=stage.querySelector('.magic-gallery-counter');
    if(!counter){counter=document.createElement('div');counter.className='magic-gallery-counter';counter.setAttribute('aria-hidden','true');stage.appendChild(counter)}
    let hint=stage.querySelector('.magic-gallery-swipe-hint');
    if(!hint){hint=document.createElement('div');hint.className='magic-gallery-swipe-hint';hint.textContent='Glissez pour voir les photos';stage.appendChild(hint)}

    const getThumbs=()=>Array.from(thumbs?.querySelectorAll('[data-gallery-index]')||[]);
    const update=()=>{
      const list=getThumbs();
      const total=list.length||1;
      const active=list.findIndex(b=>b.classList.contains('active'));
      const current=active>=0?active+1:1;
      const multi=total>1;
      stage.dataset.multiGallery=multi?'true':'false';
      counter.style.display=multi?'block':'none';
      counter.textContent=current+' / '+total;
      hint.style.display='';
      if(multi){
        const nextIndex=(current)%total;
        const prevIndex=(current-2+total)%total;
        [list[nextIndex],list[prevIndex]].forEach(b=>{const src=b?.querySelector('img')?.src;if(src){const p=new Image();p.decoding='async';p.src=src;}});
      }
    };

    const obs=new MutationObserver(()=>requestAnimationFrame(update));
    if(thumbs)obs.observe(thumbs,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    obs.observe(img,{attributes:true,attributeFilter:['src']});

    let sx=0,sy=0,active=false;
    stage.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;active=true;sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
    stage.addEventListener('touchend',e=>{
      if(!active||!e.changedTouches.length)return;active=false;
      const dx=e.changedTouches[0].clientX-sx;
      const dy=e.changedTouches[0].clientY-sy;
      if(Math.abs(dx)<45||Math.abs(dx)<=Math.abs(dy))return;
      if(dx<0)next?.click();else prev?.click();
    },{passive:true});

    document.addEventListener('keydown',e=>{
      if(!modal?.classList.contains('open'))return;
      if(e.key==='ArrowRight'){next?.click();e.preventDefault()}
      if(e.key==='ArrowLeft'){prev?.click();e.preventDefault()}
    });

    ['click','pointerup'].forEach(type=>stage.addEventListener(type,()=>setTimeout(update,0),{passive:true}));
    update();
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
</script>`;

function inject(file){
  let html=fs.readFileSync(file,'utf8');
  if(!html.includes('id="productGalleryStage"'))return false;
  if(html.includes(`id="${MARK}"`))return false;
  const headEnd=html.toLowerCase().indexOf('</head>');
  html=headEnd>=0?html.slice(0,headEnd)+style+'\n'+html.slice(headEnd):style+'\n'+html;
  const bodyEnd=html.toLowerCase().lastIndexOf('</body>');
  html=bodyEnd>=0?html.slice(0,bodyEnd)+runtime+'\n'+html.slice(bodyEnd):html+runtime;
  fs.writeFileSync(file,html,'utf8');
  return true;
}

function walk(dir){
  if(!fs.existsSync(dir))return 0;
  let changed=0;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.name==='admin')continue;
    const p=path.join(dir,entry.name);
    if(entry.isDirectory())changed+=walk(p);
    else if(entry.isFile()&&entry.name.endsWith('.html'))changed+=inject(p)?1:0;
  }
  return changed;
}

const changed=walk(DIST);
console.log(`MAGIC LIGHT gallery polish: ${changed} page(s) enhanced.`);
