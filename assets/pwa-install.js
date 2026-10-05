(()=>{
  if(!('serviceWorker' in navigator)) return;

  const isAdmin=location.pathname.startsWith('/admin/');
  if(!isAdmin){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('/service-worker.js',{scope:'/'}).catch(()=>{});
    });
  }

  let deferredPrompt=null;
  const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);

  function makeButton(){
    if(isAdmin||isStandalone()||document.getElementById('magicPwaInstall')) return null;
    const btn=document.createElement('button');
    btn.id='magicPwaInstall';
    btn.type='button';
    btn.textContent='📲 Installer MAGIC LIGHT';
    btn.setAttribute('aria-label','Installer MAGIC LIGHT comme application');
    Object.assign(btn.style,{
      position:'fixed',right:'16px',bottom:'16px',zIndex:'9999',border:'0',borderRadius:'999px',
      background:'#111215',color:'#fff',padding:'12px 16px',font:'800 14px Arial,Tahoma,sans-serif',
      boxShadow:'0 10px 28px rgba(0,0,0,.22)',cursor:'pointer',display:'none'
    });
    document.body.appendChild(btn);
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
    box.setAttribute('aria-label','Installer MAGIC LIGHT');
    box.innerHTML='<div style="font-weight:900;font-size:16px;margin-bottom:7px">Installer MAGIC LIGHT</div><div style="font-size:14px;line-height:1.5">Sur iPhone/iPad : ouvrez le menu de partage <b>Partager</b>, puis choisissez <b>Sur l’écran d’accueil</b>.</div><button type="button" style="margin-top:12px;border:0;border-radius:10px;background:#c99a3c;color:#111;padding:9px 14px;font-weight:900;cursor:pointer">Compris</button>';
    Object.assign(box.style,{position:'fixed',right:'16px',bottom:'70px',zIndex:'10000',width:'min(340px,calc(100vw - 32px))',background:'#fff',color:'#20242b',border:'1px solid #e5e7eb',borderRadius:'16px',padding:'16px',boxShadow:'0 18px 50px rgba(0,0,0,.22)',fontFamily:'Arial,Tahoma,sans-serif'});
    document.body.appendChild(box);
    box.querySelector('button').onclick=()=>box.remove();
  }

  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();
    deferredPrompt=e;
    btn.style.display='block';
  });

  if(isIOS && !isStandalone()) btn.style.display='block';

  btn.addEventListener('click',async()=>{
    if(isIOS && !deferredPrompt){showIOSHelp();return;}
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
