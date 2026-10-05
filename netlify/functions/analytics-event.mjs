import { getStore } from '@netlify/blobs';
import { randomBytes } from 'node:crypto';
import { json, rateLimit, sameOriginOrNoOrigin, secureHeaders } from './_security.mjs';

const clean=(v,max=180)=>String(v??'').trim().slice(0,max);
const ALLOWED_EVENTS=new Set([
  'page_view','view_item','add_to_cart','remove_from_cart','begin_checkout','purchase',
  'generate_lead','search','contact','whatsapp_click','call_click','share'
]);

function geoValue(geo,key){
  const v=geo?.[key];
  if(v&&typeof v==='object') return clean(v.name||v.code||'',100);
  return clean(v,100);
}
function deviceFromUA(ua){
  const s=String(ua||'').toLowerCase();
  if(/ipad|tablet/.test(s)) return 'Tablet';
  if(/mobile|android|iphone/.test(s)) return 'Mobile';
  return 'Desktop';
}

export default async (req,context={})=>{
  if(req.method!=='POST') return json({error:'Method not allowed'},405,{allow:'POST'});
  if(!sameOriginOrNoOrigin(req)) return json({error:'Origine refusée'},403);

  const rl=await rateLimit(req,context,{scope:'analytics-event',limit:240,windowSeconds:600});
  if(!rl.ok) return json({error:'Rate limit'},429,{'retry-after':String(rl.retryAfter)});

  const len=Number(req.headers.get('content-length')||0);
  if(len>12000) return json({error:'Payload too large'},413);

  let body;
  try{body=await req.json();}catch{return json({error:'JSON invalide'},400);}
  const event=clean(body?.event,40);
  const sessionId=clean(body?.sessionId,80);
  if(!ALLOWED_EVENTS.has(event)||!sessionId||!/^[A-Za-z0-9._:-]{6,80}$/.test(sessionId)) return json({error:'Données invalides'},400);

  const now=new Date();
  const day=now.toISOString().slice(0,10);
  const geo=context?.geo||{};
  const ua=req.headers.get('user-agent')||'';
  const record={
    event,
    sessionId,
    createdAt:now.toISOString(),
    page:clean(body?.page,180),
    title:clean(body?.title,160),
    source:clean(body?.source,80)||'Direct',
    medium:clean(body?.medium,80),
    campaign:clean(body?.campaign,120),
    referrerHost:clean(body?.referrerHost,120),
    itemId:clean(body?.itemId,120),
    itemName:clean(body?.itemName,180),
    searchTerm:clean(body?.searchTerm,120),
    orderId:clean(body?.orderId,120),
    value:Number.isFinite(Number(body?.value))?Math.max(0,Math.min(1000000,Number(body.value))):null,
    quantity:Number.isFinite(Number(body?.quantity))?Math.max(0,Math.min(999,Math.floor(Number(body.quantity)))):null,
    city:geoValue(geo,'city'),
    country:geoValue(geo,'country'),
    device:deviceFromUA(ua)
  };

  const store=getStore('magic-light-analytics');
  const suffix=randomBytes(6).toString('hex');
  const key=`event/${day}/${now.getTime()}-${suffix}.json`;
  await store.setJSON(key,record,{metadata:{event,day,source:record.source,city:record.city}});
  return new Response(null,{status:204,headers:secureHeaders()});
};
