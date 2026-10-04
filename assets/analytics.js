(function(){
  if(window.__magicFirstPartyAnalytics) return;
  window.__magicFirstPartyAnalytics=true;

  const ENDPOINT='/.netlify/functions/analytics-event';
  const SESSION_KEY='magicLightAnalyticsSession';
  const safeString=(v,max=160)=>String(v??'').trim().slice(0,max);
  const params=new URLSearchParams(location.search);

  function randomId(){
    try{return crypto.randomUUID();}catch(e){return 's-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);}
  }
  let sessionId='';
  try{
    sessionId=sessionStorage.getItem(SESSION_KEY)||'';
    if(!sessionId){sessionId=randomId();sessionStorage.setItem(SESSION_KEY,sessionId);}
  }catch(e){sessionId=randomId();}

  function referrerHost(){
    try{return document.referrer?new URL(document.referrer).hostname.replace(/^www\./,''):'';}catch(e){return '';}
  }
  function sourceName(){
    const utm=safeString(params.get('utm_source'),80);
    if(utm) return utm;
    const host=referrerHost().toLowerCase();
    if(!host) return 'Direct';
    if(host.includes('facebook.com')||host.includes('fb.com')) return 'Facebook';
    if(host.includes('instagram.com')) return 'Instagram';
    if(host.includes('google.')) return 'Google';
    if(host.includes('tiktok.com')) return 'TikTok';
    return host;
  }
  function payloadFor(eventName,p){
    p=p||{};
    return {
      event:safeString(eventName,40),
      sessionId:safeString(sessionId,80),
      page:safeString(location.pathname,180),
      title:safeString(document.title,160),
      source:safeString(sourceName(),80),
      medium:safeString(params.get('utm_medium'),80),
      campaign:safeString(params.get('utm_campaign'),120),
      referrerHost:safeString(referrerHost(),120),
      itemId:safeString(p.item_id||p.itemId,120),
      itemName:safeString(p.item_name||p.itemName,180),
      searchTerm:safeString(p.search_term||p.searchTerm,120),
      orderId:safeString(p.order_id||p.orderId,120),
      value:Number.isFinite(Number(p.value))?Number(p.value):null,
      quantity:Number.isFinite(Number(p.quantity))?Number(p.quantity):null
    };
  }
  function send(eventName,p){
    try{
      const body=JSON.stringify(payloadFor(eventName,p));
      fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body,keepalive:true,credentials:'same-origin'}).catch(()=>{});
    }catch(e){}
  }

  const original=typeof window.magicTrack==='function'?window.magicTrack:null;
  window.magicTrack=function(eventName,p){
    try{original?.(eventName,p);}catch(e){}
    send(eventName,p);
  };

  const pageView=()=>send('page_view',{title:document.title});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',pageView,{once:true});
  else pageView();
})();
