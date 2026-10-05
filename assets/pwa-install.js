(()=>{
  const isAdmin=location.pathname.startsWith('/admin/');
  const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const ua=navigator.userAgent||'';
  const isIOS=/iphone|ipad|ipod/i.test(ua);
  const isIOSInApp=isIOS&&/FBAN|FBAV|FBIOS|Messenger|Instagram|WhatsApp|Line|Twitter/i.test(ua);
  const isSafari=isIOS&&/safari/i.test(ua)&&!isIOSInApp&&!/crios|fxios|edgios|opios|duckduckgo/i.test(ua);
  const isMobile=()=>window.matchMedia('(max-width:700px)').matches;

  if(!isAdmin&&('serviceWorker' in navigator)){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('/service-worker.js',{scope:'/'}).catch(()=>{});
    });
  }

  let deferredPrompt=null;

  function makeButton(){
    if(isAdmin||isStandalone()||document.getElementById('magicPwaInstall')) return null;
    const wrap=document.createElement('div');
    wrap.id='magicPwaInstallWrap';
    const btn=document.createElement('button');
    btn.id='magicPwaInstall';
    btn.type='button';
    const close=document.createElement('button');
    close.type='button';
    close.setAttribute('aria-label','Masquer');
    close.textContent='×';

    if(isIOSInApp){
      btn.innerHTML='<span style="font-size:20px">🧭</span><span><b>Installer MAGIC LIGHT</b><small>Ouvrir avec Safari</small></span>';
      btn.setAttribute('aria-label','Ouvrir MAGIC LIGHT dans Safari pour l’installer');
    }else if(isIOS){
      btn.innerHTML='<span style="font-size:20px">📲</span><span><b>Installer MAGIC LIGHT</b><small>Sur votre iPhone</small></span>';
      btn.setAttribute('aria-label','Installer MAGIC LIGHT sur iPhone ou iPad');
    }else{
      btn.innerHTML='<span style="font-size:20px">📲</span><span><b>Installer MAGIC LIGHT</b><small>Application rapide</small></span>';
      btn.setAttribute('aria-label','Installer MAGIC LIGHT comme application');
    }

    Object.assign(wrap.style,{
      display:'none',alignItems:'center',gap:'8px',zIndex:'9999'
    });
    Object.assign(btn.style,{
      border:'0',background:'#111215',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:'10px',
      textAlign:'left',font:'700 14px Arial,Tahoma,sans-serif',boxShadow:'0 10px 28px rgba(0,0,0,.18)'
    });
    btn.querySelector('small').style.cssText='display:block;font-size:11px;font-weight:600;opacity:.72;margin-top:2px';
    Object.assign(close.style,{
      border:'1px solid #e5e7eb',background:'#fff',color:'#555',cursor:'pointer',font:'700 18px Arial',lineHeight:'1'
    });

    if(isMobile()){
      Object.assign(wrap.style,{
        position:'fixed',left:'12px',right:'12px',bottom:'calc(12px + env(safe-area-inset-bottom))',
        justifyContent:'center'
      });
      Object.assign(btn.style,{flex:'1',maxWidth:'430px',minHeight:'50px',padding:'10px 14px',borderRadius:'14px'});
      Object.assign(close.style,{width:'42px',height:'42px',borderRadius:'50%',flex:'0 0 auto'});
      document.body.appendChild(wrap);
    }else{
      Object.assign(wrap.style,{position:'fixed',right:'18px',bottom:'18px'});
      Object.assign(btn.style,{minHeight:'52px',padding:'11px 16px',borderRadius:'999px'});
      Object.assign(close.style,{width:'38px',height:'38px',borderRadius:'50%'});
      document.body.appendChild(wrap);
    }
    wrap.appendChild(btn);wrap.appendChild(close);
    close.addEventListener('click',()=>wrap.remove());
    return {btn,wrap};
  }

  const controls=makeButton();
  if(!controls) return;
  const {btn,wrap}=controls;

  function showIOSHelp(){
    let old=document.getElementById('magicPwaHelp');
    if(old){old.remove();return;}

    const overlay=document.createElement('div');
    overlay.id='magicPwaHelp';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Installer MAGIC LIGHT sur iPhone');

    const sheet=document.createElement('div');
    const title=isIOSInApp?'Ouvrir dans Safari':'Installer sur iPhone';
    const steps=isIOSInApp
      ? [
          '<b>1.</b> Appuyez sur <b>•••</b> dans le navigateur.',
          '<b>2.</b> Choisissez <b>Ouvrir dans Safari</b>.',
          '<b>3.</b> Dans Safari : <b>Partager → Sur l’écran d’accueil → Ajouter</b>.'
        ]
      : [
          ...(isSafari?[]:['<b>1.</b> Ouvrez cette page dans <b>Safari</b>.']),
          `<b>${isSafari?1:2}.</b> Appuyez sur <b>Partager ⬆️</b>.`,
          `<b>${isSafari?2:3}.</b> Choisissez <b>Sur l’écran d’accueil</b>.`,
          `<b>${isSafari?3:4}.</b> Appuyez sur <b>Ajouter</b>.`
        ];

    sheet.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px">📲</span><div><div style="font-weight:950;font-size:18px">${title}</div><div style="font-size:12px;color:#737a84;margin-top:2px">MAGIC LIGHT</div></div></div>
        <button type="button" data-close-help aria-label="Fermer" style="width:36px;height:36px;border:1px solid #e5e7eb;border-radius:50%;background:#fff;font-size:20px;cursor:pointer">×</button>
      </div>
      <div style="display:grid;gap:8px;font-size:14px;line-height:1.45">${steps.map(s=>`<div style="padding:9px 10px;background:#f7f8fa;border-radius:10px">${s}</div>`).join('')}</div>
      ${isIOSInApp?'<button data-copy-link type="button" style="width:100%;margin-top:12px;border:0;border-radius:12px;background:#111215;color:#fff;padding:12px 14px;font-weight:900;cursor:pointer">Copier le lien</button>':''}
      <div style="margin-top:10px;font-size:11px;color:#8b919a;text-align:center">Apple impose cette méthode sur iPhone.</div>`;

    Object.assign(overlay.style,{
      position:'fixed',inset:'0',zIndex:'10000',background:'rgba(17,18,21,.38)',display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'12px'
    });
    Object.assign(sheet.style,{
      width:'min(520px,100%)',background:'#fff',color:'#20242b',borderRadius:'20px',padding:'16px',
      boxShadow:'0 24px 70px rgba(0,0,0,.30)',fontFamily:'Arial,Tahoma,sans-serif',marginBottom:'max(0px,env(safe-area-inset-bottom))'
    });
    overlay.appendChild(sheet);document.body.appendChild(overlay);

    const close=()=>overlay.remove();
    sheet.querySelector('[data-close-help]')?.addEventListener('click',close);
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    sheet.querySelector('[data-copy-link]')?.addEventListener('click',async e=>{
      const copyBtn=e.currentTarget;
      try{
        await navigator.clipboard.writeText(location.href);
        copyBtn.textContent='Lien copié ✓';
      }catch{
        const ta=document.createElement('textarea');ta.value=location.href;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();
        try{document.execCommand('copy');copyBtn.textContent='Lien copié ✓';}catch{copyBtn.textContent='Copie impossible';}
        ta.remove();
      }
    });
  }

  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();deferredPrompt=e;wrap.style.display='flex';
  });

  if(isIOS&&!isStandalone()) wrap.style.display='flex';

  btn.addEventListener('click',async()=>{
    if(isIOS){showIOSHelp();return;}
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    try{await deferredPrompt.userChoice;}catch{}
    deferredPrompt=null;wrap.style.display='none';
  });

  window.addEventListener('appinstalled',()=>{
    deferredPrompt=null;wrap.style.display='none';
    const help=document.getElementById('magicPwaHelp');if(help)help.remove();
  });
})();
