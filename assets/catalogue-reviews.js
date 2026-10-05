(()=>{
  const API='/.netlify/functions/reviews';
  const modal=document.querySelector('.modal');
  const modalCopy=document.querySelector('.modalcopy');
  const modalRef=document.getElementById('modalRef');
  const modalTitle=document.getElementById('modalTitle');
  if(!modal || !modalCopy || !modalRef) return;

  const wrap=document.createElement('section');
  wrap.className='magic-reviews';
  wrap.innerHTML=`
    <div class="magic-reviews-head">
      <h3>Avis clients ⭐</h3>
      <div class="magic-review-summary"><span class="magic-stars" id="magicReviewStars">☆☆☆☆☆</span><span class="magic-review-count" id="magicReviewCount">0 avis</span></div>
    </div>
    <div class="magic-review-list" id="magicReviewList"><div class="magic-review-empty">Chargement des avis...</div></div>
    <button class="magic-review-toggle" id="magicReviewToggle" type="button">Donner votre avis</button>
    <form class="magic-review-form" id="magicReviewForm">
      <label>Votre note</label>
      <div class="magic-review-stars" id="magicReviewRating" aria-label="Note de 1 à 5 étoiles">
        <button class="magic-review-star" type="button" data-rating="1" aria-label="1 étoile">★</button>
        <button class="magic-review-star" type="button" data-rating="2" aria-label="2 étoiles">★</button>
        <button class="magic-review-star" type="button" data-rating="3" aria-label="3 étoiles">★</button>
        <button class="magic-review-star" type="button" data-rating="4" aria-label="4 étoiles">★</button>
        <button class="magic-review-star" type="button" data-rating="5" aria-label="5 étoiles">★</button>
      </div>
      <input id="magicReviewName" name="name" maxlength="100" placeholder="Votre nom *" required>
      <textarea id="magicReviewComment" name="comment" maxlength="700" placeholder="Votre avis *" required></textarea>
      <input class="magic-review-hp" id="magicReviewWebsite" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="magic-review-submit" type="submit">Envoyer l’avis</button>
      <div class="magic-review-message" id="magicReviewMessage"></div>
    </form>`;
  modalCopy.appendChild(wrap);

  const starsEl=document.getElementById('magicReviewStars');
  const countEl=document.getElementById('magicReviewCount');
  const listEl=document.getElementById('magicReviewList');
  const toggle=document.getElementById('magicReviewToggle');
  const form=document.getElementById('magicReviewForm');
  const msg=document.getElementById('magicReviewMessage');
  const nameInput=document.getElementById('magicReviewName');
  const commentInput=document.getElementById('magicReviewComment');
  const websiteInput=document.getElementById('magicReviewWebsite');
  const ratingButtons=[...document.querySelectorAll('.magic-review-star')];
  let rating=5;
  let currentRef='';
  let currentName='';

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate=v=>{try{return new Date(v).toLocaleDateString('fr-TN')}catch{return''}};
  const starString=n=>{
    const rounded=Math.max(0,Math.min(5,Math.round(Number(n)||0)));
    return '★'.repeat(rounded)+'☆'.repeat(5-rounded);
  };
  function setRating(n){
    rating=Math.max(1,Math.min(5,Number(n)||5));
    ratingButtons.forEach(btn=>btn.classList.toggle('active',Number(btn.dataset.rating)<=rating));
  }
  setRating(5);

  async function loadReviews(){
    const ref=String(modalRef.textContent||'').trim();
    if(!ref){return}
    currentRef=ref.toUpperCase();
    currentName=String(modalTitle?.textContent||'').trim();
    listEl.innerHTML='<div class="magic-review-empty">Chargement des avis...</div>';
    try{
      const r=await fetch(`${API}?productRef=${encodeURIComponent(currentRef)}&ts=${Date.now()}`,{cache:'no-store'});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||'Erreur avis');
      starsEl.textContent=starString(d.average||0);
      countEl.textContent=d.count?`${d.average}/5 · ${d.count} avis`:'0 avis';
      if(!d.reviews?.length){
        listEl.innerHTML='<div class="magic-review-empty">Aucun avis pour ce produit. Soyez le premier à donner votre avis.</div>';
        return;
      }
      listEl.innerHTML=d.reviews.slice(0,8).map(rv=>`<article class="magic-review-card"><div class="magic-review-top"><div><div class="magic-review-name">${esc(rv.name)}</div><div class="magic-stars">${starString(rv.rating)}</div></div><div class="magic-review-date">${esc(fmtDate(rv.createdAt))}</div></div><p class="magic-review-text">${esc(rv.comment)}</p></article>`).join('');
    }catch(e){
      listEl.innerHTML='<div class="magic-review-empty">Les avis sont momentanément indisponibles.</div>';
    }
  }

  toggle.addEventListener('click',()=>{
    form.classList.toggle('open');
    if(form.classList.contains('open')) nameInput.focus();
  });
  ratingButtons.forEach(btn=>btn.addEventListener('click',()=>setRating(btn.dataset.rating)));
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    msg.className='magic-review-message';
    msg.textContent='Envoi...';
    const payload={
      productRef:currentRef||String(modalRef.textContent||'').trim(),
      productName:currentName||String(modalTitle?.textContent||'').trim(),
      name:nameInput.value.trim(),
      rating,
      comment:commentInput.value.trim(),
      website:websiteInput.value
    };
    if(!payload.productRef||!payload.name||payload.comment.length<3){
      msg.classList.add('error');msg.textContent='Merci de remplir le nom, la note et votre avis.';return;
    }
    const submit=form.querySelector('.magic-review-submit'); submit.disabled=true;
    try{
      const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
      const d=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.error||'Erreur');
      msg.classList.add('ok');
      msg.textContent='Merci ⭐ Votre avis a été envoyé et sera visible après validation par MAGIC LIGHT.';
      commentInput.value=''; setRating(5);
      if(typeof window.magicTrack==='function') window.magicTrack('review_submit',{item_id:payload.productRef,item_name:payload.productName,rating:payload.rating});
    }catch(err){
      msg.classList.add('error');msg.textContent='Impossible d’envoyer l’avis pour le moment.';
    }finally{submit.disabled=false}
  });

  document.addEventListener('click',e=>{
    if(e.target.closest('.view-product')) setTimeout(loadReviews,80);
  });
  const observer=new MutationObserver(()=>{
    if(String(modalRef.textContent||'').trim() && String(modalRef.textContent||'').trim().toUpperCase()!==currentRef) setTimeout(loadReviews,30);
  });
  observer.observe(modalRef,{childList:true,subtree:true,characterData:true});
})();
