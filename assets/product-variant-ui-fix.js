(function(){
  'use strict';

  function ensureDimensionsRow(){
    const current=window.magicCurrentProduct||{};
    const dimensions=String(current.dimensions||'').trim();
    const specRef=document.getElementById('specRef');
    const specs=specRef?.closest('.product-specs') || document.querySelector('.product-specs');
    if(!specs) return;

    let row=document.getElementById('specDimensionsRow');
    let value=document.getElementById('specDimensions');

    if(!row){
      row=document.createElement('div');
      row.className='product-spec';
      row.id='specDimensionsRow';
      row.innerHTML='<span>Dimensions</span><strong id="specDimensions"></strong>';
      const stock=document.getElementById('specStock')?.closest('.product-spec');
      if(stock && stock.parentElement===specs) specs.insertBefore(row,stock);
      else specs.appendChild(row);
      value=row.querySelector('#specDimensions');
    }

    if(!value) value=row.querySelector('strong');
    if(value) value.textContent=dimensions;
    row.hidden=!dimensions;
  }

  function schedule(){
    requestAnimationFrame(ensureDimensionsRow);
    setTimeout(ensureDimensionsRow,60);
    setTimeout(ensureDimensionsRow,180);
    setTimeout(ensureDimensionsRow,400);
  }

  document.addEventListener('click',event=>{
    if(event.target.closest('.view-product,.ml-variant-option')) schedule();
  });

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>m.target?.id==='magicVariantPicker' || m.target?.closest?.('#magicVariantPicker') || m.addedNodes?.length)){
      schedule();
    }
  });

  function boot(){
    schedule();
    if(document.body) observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
