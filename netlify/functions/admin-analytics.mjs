import { getStore } from '@netlify/blobs';

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});

function authorized(req){
  const expected=process.env.ORDER_ADMIN_KEY;
  if(!expected) return {ok:false,setup:true};
  const provided=req.headers.get('x-admin-key')||'';
  return {ok:provided===expected,setup:false};
}
function dayString(d){return new Date(d).toISOString().slice(0,10);}
function daysBack(count){
  const out=[];const now=new Date();
  for(let i=count-1;i>=0;i--){const d=new Date(now);d.setUTCDate(d.getUTCDate()-i);out.push(dayString(d));}
  return out;
}
function inc(map,key,n=1){key=String(key||'').trim()||'Inconnu';map.set(key,(map.get(key)||0)+n);}
function setInc(map,key,session){
  key=String(key||'').trim()||'Inconnu';
  if(!map.has(key)) map.set(key,new Set());
  if(session) map.get(key).add(session);
}
function topFromMap(map,limit=12){return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([name,count])=>({name,count}));}
function topFromSetMap(map,limit=12){return [...map.entries()].map(([name,set])=>({name,count:set.size})).sort((a,b)=>b.count-a.count).slice(0,limit);}
async function readMany(store,blobs){
  const out=[];
  for(let i=0;i<blobs.length;i+=30){
    const chunk=blobs.slice(i,i+30);
    const rows=await Promise.all(chunk.map(async b=>{try{return await store.get(b.key,{type:'json',consistency:'strong'});}catch{return null;}}));
    out.push(...rows.filter(Boolean));
  }
  return out;
}

export default async req=>{
  const auth=authorized(req);
  if(auth.setup) return json({error:'ORDER_ADMIN_KEY non configurée',setupRequired:true},503);
  if(!auth.ok) return json({error:'Accès refusé'},401);
  if(req.method!=='GET') return json({error:'Method not allowed'},405);

  const url=new URL(req.url);
  const days=Math.max(1,Math.min(30,Number(url.searchParams.get('days'))||7));
  const dates=daysBack(days);
  const analytics=getStore('magic-light-analytics');
  const events=[];
  for(const day of dates){
    const {blobs}=await analytics.list({prefix:`event/${day}/`});
    events.push(...await readMany(analytics,blobs||[]));
  }

  const sessions=new Set();
  const todaySessions=new Set();
  const sources=new Map(),cities=new Map(),devices=new Map(),pages=new Map(),products=new Map(),productAdds=new Map(),campaigns=new Map();
  const daily=new Map(dates.map(d=>[d,{date:d,sessions:new Set(),pageViews:0,productViews:0,addToCart:0,leads:0,searches:0,contacts:0}]));
  const today=dayString(new Date());
  let pageViews=0,productViews=0,addToCart=0,leads=0,searches=0,contacts=0;

  for(const e of events){
    const sid=String(e.sessionId||'');
    const day=String(e.createdAt||'').slice(0,10);
    sessions.add(sid);
    if(day===today) todaySessions.add(sid);
    const d=daily.get(day);
    if(d) d.sessions.add(sid);
    setInc(sources,e.source||'Direct',sid);
    setInc(cities,e.city||'Inconnu',sid);
    inc(devices,e.device||'Inconnu');
    if(e.campaign) setInc(campaigns,e.campaign,sid);
    if(e.event==='page_view'){pageViews++;inc(pages,e.page||'/');if(d)d.pageViews++;}
    if(e.event==='view_item'){productViews++;inc(products,e.itemName||e.itemId||'Produit');if(d)d.productViews++;}
    if(e.event==='add_to_cart'){addToCart++;inc(productAdds,e.itemName||e.itemId||'Produit');if(d)d.addToCart++;}
    if(e.event==='generate_lead'){leads++;if(d)d.leads++;}
    if(e.event==='search'){searches++;if(d)d.searches++;}
    if(e.event==='contact'){contacts++;if(d)d.contacts++;}
  }

  const ordersStore=getStore('magic-light-orders');
  const {blobs:orderBlobs=[]}=await ordersStore.list({prefix:'order/'});
  const allOrders=await readMany(ordersStore,orderBlobs);
  const startDate=dates[0];
  const filteredOrders=allOrders.filter(o=>String(o.createdAt||'').slice(0,10)>=startDate && String(o.createdAt||'').slice(0,10)<=dates[dates.length-1]);
  const validOrders=filteredOrders.filter(o=>o.status!=='Annulée');
  const revenue=validOrders.reduce((sum,o)=>sum+(Number(o.total)||0),0);
  const orderCount=filteredOrders.length;
  const conversion=sessions.size?Number(((orderCount/sessions.size)*100).toFixed(2)):0;

  return json({
    ok:true,days,generatedAt:new Date().toISOString(),
    summary:{todayVisitors:todaySessions.size,visitors:sessions.size,pageViews,productViews,addToCart,leads,searches,contacts,orders:orderCount,revenue,conversion},
    sources:topFromSetMap(sources),cities:topFromSetMap(cities),campaigns:topFromSetMap(campaigns),devices:topFromMap(devices,6),pages:topFromMap(pages),products:topFromMap(products),productAdds:topFromMap(productAdds),
    daily:[...daily.values()].map(d=>({date:d.date,visitors:d.sessions.size,pageViews:d.pageViews,productViews:d.productViews,addToCart:d.addToCart,leads:d.leads,searches:d.searches,contacts:d.contacts}))
  });
};
