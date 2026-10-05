(()=>{
  const isAdmin=location.pathname.startsWith('/admin/');
  const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const ua=navigator.userAgent||'';
  const isIOS=/iphone|ipad|ipod/i.test(ua);
  const isIOSInApp=isIOS&&/FBAN|FBAV|FBIOS|Messenger|Instagram|WhatsApp|Line|Twitter/i.test(ua);
  const isSafari=isIOS&&/safari/i.test(ua)&&!isIOSInApp&&!/crios|fxios|edgios|opios|duckduckgo/i.test(ua);
  const isMobile=()=>window.matchMedia('(max-width:700px)').matches;

  // The install helper must still appear on iPhone even if the current browser
  // does not expose Service Worker / beforeinstallprompt APIs.
  if(!isAdmin&&('serviceWorker' in navigator)){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('/service-worker.js',{scope:'/'}).catch(()=>{});
    });
  }

  let deferredPrompt=null;

  function makeButton(){
    if(isAdmin||isStandalone()||document.getElementById('magicPwaInstall')) return null;
    const btn=document.createElement('button');
    btn.id='magicPwaInstall';
    btn.type='button';
    if(isIOSInApp){
      btn.textContent='🧭 Ouvrir dans Safari pour installer MAGIC LIGHT';
      btn.setAttribute('aria-label','Ouvrir MAGIC LIGHT dans Safari pour l’installer');
    }else if(isIOS){
      btn.textContent='📲 Installer MAGIC LIGHT sur iPhone';
      btn.setAttribute('aria-label','Installer MAGIC LIGHT sur iPhone ou iPad');
    }else{
      btn.textContent='📲 Installer l’application MAGIC LIGHT';
      btn.setAttribute('aria-label','Installer MAGIC LIGHT comme application');
    }

    if(isMobile()){
      Object.assign(btn.style,{
        width:'calc(100% - 24px)',maxWidth:'520px',minHeight:'58px',margin:'12px auto',
        border:'0',borderRadius:'16px',background:'#111215',color:'#fff',padding:'15px 20px',
        font:'900 16px Arial,Tahoma,sans-serif',letterSpacing:'.01em',
        boxShadow:'0 10px 28px rgba(0,0,0,.20)',cursor:'pointer',display:'none',zIndex:'9999'
      });
      const header=document.querySelector('.header');
      if(header&&header.parentNode) header.insertAdjacentElement('afterend',btn);
      else document.body.insertBefore(btn,document.body.firstChild);
    }else{
      Object.assign(btn.style,{
        position:'fixed',right:'18px',bottom:'18px',zIndex:'9999',border:'0',borderRadius:'999px',
        background:'#111215',color:'#fff',padding:'15px 20px',minHeight:'52px',
        font:'900 15px Arial,Tahoma,sans-serif',boxShadow:'0 10px 28px rgba(0,0,0,.22)',
        cursor:'pointer',display:'none'
      });
      document.body.appendChild(btn);
    }
    return btn;
  }

  const btn=makeButton();
  if(!btn) return;

  function showIOSHelp(){
    let box=document.getElementById('magicPwaHelp');
    if(box){box.remove();return;}
    box=document.createElement('div');
    box.id='magicPwaHelp';
    box.setAttribute('role','dialog');
    box.setAttribute('aria-label','Installer MAGIC LIGHT sur iPhone');

    if(isIOSInApp){
      box.innerHTML='<div style="font-weight:950;font-size:18px;margin-bottom:12px">🧭 Installer MAGIC LIGHT sur iPhone</div>'+ 
        '<div style="margin-bottom:10px"><b>1.</b> Vous êtes dans le navigateur intégré de Messenger/Facebook/Instagram.</div>'+ 
        '<div style="margin-bottom:10px"><b>2.</b> Appuyez sur <b>•••</b> puis choisissez <b>Ouvrir dans Safari</b>.</div>'+ 
        '<div style="margin-bottom:10px"><b>3.</b> Dans Safari, appuyez sur <b>Partager</b> <span style="font-size:20px">⬆️</span>.</div>'+ 
        '<div style="margin-bottom:10px"><b>4.</b> Choisissez <b>Sur l’écran d’accueil</b>, puis <b>Ajouter</b>.</div>'+ 
        '<div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:#fff8e8;color:#76571f;font-size:13px;line-height:1.4">Apple n’autorise pas l’installation directe depuis le navigateur intégré de Messenger/Facebook/Instagram.</div>'+ 
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px">'+
          '<button data-copy-link type="button" style="border:0;border-radius:12px;background:#111215;color:#fff;padding:12px 10px;font-weight:950;cursor:pointer">Copier le lien</button>'+ 
          '<button data-close-help type="button" style="border:0;border-radius:12px;background:#c99a3c;color:#111;padding:12px 10px;font-weight:950;cursor:pointer">Compris</button>'+ 
        '</div>';
    }else{
      const firstStep=isSafari
        ? ''
        : '<div style="margin-bottom:9px"><b>1.</b> Ouvrez ce site dans <b>Safari</b>.</div>';
      const n=isSafari?1:2;
      box.innerHTML='<div style="font-weight:950;font-size:18px;margin-bottom:12px">📱 Installer MAGIC LIGHT sur iPhone</div>'+firstStep+
        '<div style="margin-bottom:9px"><b>'+n+'.</b> Appuyez sur <b>Partager</b> <span style="font-size:20px">⬆️</span> en bas de Safari.</div>'+ 
        '<div style="margin-bottom:9px"><b>'+(n+1)+'.</b> Choisissez <b>Sur l’écran d’accueil</b>.</div>'+ 
        '<div><b>'+(n+2)+'.</b> Appuyez sur <b>Ajouter</b>.</div>'+ 
        '<div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:#fff8e8;color:#76571f;font-size:13px;line-height:1.4">Sur iPhone, Apple ne montre pas la même fenêtre d’installation automatique qu’Android. L’installation se fait avec le menu Partager.</div>'+ 
        '<button data-close-help type="button" style="width:100%;margin-top:14px;border:0;border-radius:12px;background:#c99a3c;color:#111;padding:12px 14px;font-weight:950;cursor:pointer">Compris</button>';
    }

    Object.assign(box.style,{
      position:'fixed',left:'12px',right:'12px',top:'max(16px,env(safe-area-inset-top))',zIndex:'10000',background:'#fff',color:'#20242b',
      border:'1px solid #e5e7eb',borderRadius:'18px',padding:'18px',boxShadow:'0 18px 50px rgba(0,0,0,.25)',fontFamily:'Arial,Tahoma,sans-serif',
      width:'auto',maxWidth:'520px',margin:'0 auto',lineHeight:'1.45'
    });
    document.body.appendChild(box);
    box.querySelector('[data-close-help]')?.addEventListener('click',()=>box.remove());
    box.querySelector('[data-copy-link]')?.addEventListener('click',async e=>{
      const copyBtn=e.currentTarget;
      try{
        await navigator.clipboard.writeText(location.href);
        copyBtn.textContent='Lien copié ✓';
      }catch{
        const ta=document.createElement('textarea');
        ta.value=location.href;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();
        try{document.execCommand('copy');copyBtn.textContent='Lien copié ✓';}catch{copyBtn.textContent='Copie impossible';}
        ta.remove();
      }
    });
  }

  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();
    deferredPrompt=e;
    btn.style.display='block';
  });

  // iOS has no Android-style beforeinstallprompt. Always expose our helper.
  if(isIOS&&!isStandalone()) btn.style.display='block';

  btn.addEventListener('click',async()=>{
    if(isIOS){showIOSHelp();return;}
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    try{await deferredPrompt.userChoice;}catch{}
    deferredPrompt=null;
    btn.style.display='none';
  });

  window.addEventListener('appinstalled',()=>{
    deferredPrompt=null;
    btn.style.display='none';
    const help=document.getElementById('magicPwaHelp');if(help)help.remove();
  });
})();
