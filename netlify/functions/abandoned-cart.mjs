import { getStore } from "@netlify/blobs";
import { json, rateLimit, sameOriginOrNoOrigin } from "./_security.mjs";

const clean=(v,max=180)=>String(v??"").trim().replace(/\s+/g," ").slice(0,max);
const cleanId=v=>clean(v,90).replace(/[^a-zA-Z0-9_-]/g,"");
const money=v=>Number((Math.max(0,Number(v)||0)).toFixed(3));

function itemsOf(items){
  if(!Array.isArray(items)) return [];
  return items.slice(0,40).map(i=>({
    name:clean(i?.name,180),
    ref:clean(i?.ref||i?.reference,120).toUpperCase(),
    qty:Math.max(1,Math.min(99,Math.floor(Number(i?.qty)||1))),
    price:money(i?.price)
  })).filter(i=>i.name||i.ref);
}

export default async (req,context={})=>{
  if(req.method!=="POST") return json({error:"Method not allowed"},405,{allow:"POST"});
  if(!sameOriginOrNoOrigin(req)) return json({error:"Origine refusée"},403);
  const rl=await rateLimit(req,context,{scope:"abandoned-cart",limit:60,windowSeconds:900});
  if(!rl.ok) return json({error:"Trop de mises à jour"},429,{"retry-after":String(rl.retryAfter)});
  if(Number(req.headers.get("content-length")||0)>20000) return json({error:"Payload trop volumineux"},413);
  let body; try{body=await req.json();}catch{return json({error:"JSON invalide"},400);}
  const sessionId=cleanId(body?.sessionId);
  if(sessionId.length<12) return json({error:"Session invalide"},400);
  const store=getStore("magic-light-abandoned-carts");
  const key=`cart/${sessionId}.json`;
  let current=null; try{current=await store.get(key,{type:"json",consistency:"strong"});}catch{}
  const now=new Date().toISOString();
  const action=clean(body?.action||"snapshot",24).toLowerCase();
  if(action==="complete"){
    if(!current) return json({ok:true,ignored:true});
    const updated={...current,lifecycle:"converted",orderNumber:clean(body?.orderNumber,90),convertedAt:now,lastSeen:now};
    await store.setJSON(key,updated,{metadata:{lifecycle:updated.lifecycle,lastSeen:updated.lastSeen}});
    return json({ok:true});
  }
  if(action==="clear"){
    if(!current) return json({ok:true,ignored:true});
    const updated={...current,lifecycle:"cleared",items:[],estimatedSubtotal:0,clearedAt:now,lastSeen:now};
    await store.setJSON(key,updated,{metadata:{lifecycle:updated.lifecycle,lastSeen:updated.lastSeen}});
    return json({ok:true});
  }
  const items=itemsOf(body?.items);
  if(!items.length) return json({ok:true,ignored:true});
  const cart={
    sessionId,
    lifecycle:current?.lifecycle==="converted"?"converted":"active",
    followUpStatus:clean(current?.followUpStatus||"Nouveau",30),
    firstSeen:current?.firstSeen||now,
    lastSeen:now,
    page:clean(body?.page,500),
    items,
    estimatedSubtotal:money(items.reduce((s,i)=>s+i.price*i.qty,0))
  };
  await store.setJSON(key,cart,{metadata:{lifecycle:cart.lifecycle,lastSeen:cart.lastSeen}});
  return json({ok:true,savedItems:cart.items.length});
};
