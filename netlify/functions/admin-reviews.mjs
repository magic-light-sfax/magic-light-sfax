import { getStore } from "@netlify/blobs";
import { createHash,timingSafeEqual } from "node:crypto";

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const FALLBACK_ADMIN_KEY_SHA256="6ae381554ea20498d91a714df974c2d8bee2133f0b23fe6316307ac0c38cd0a7";
const sha=v=>createHash("sha256").update(String(v??""),"utf8").digest();
const safe=(a,b)=>{try{return a.length===b.length&&timingSafeEqual(a,b)}catch{return false}};
function authorized(req){
  const provided=String(req.headers.get("x-admin-key")||"").trim(); if(!provided) return false;
  const ph=sha(provided), env=String(process.env.ORDER_ADMIN_KEY||"").trim();
  return (env&&safe(ph,sha(env)))||safe(ph,Buffer.from(FALLBACK_ADMIN_KEY_SHA256,"hex"));
}
const STATUSES=["Pending","Approved","Rejected"];

export default async req=>{
  if(!authorized(req)) return json({error:"Accès refusé"},401);
  const store=getStore("magic-light-reviews");

  if(req.method==="GET"){
    const {blobs}=await store.list({prefix:"review/"});
    const reviews=[];
    for(const blob of blobs){
      try{const item=await store.get(blob.key,{type:"json",consistency:"strong"});if(item)reviews.push(item)}catch{}
    }
    reviews.sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
    return json({ok:true,reviews,statuses:STATUSES});
  }

  if(req.method==="PATCH"){
    let body; try{body=await req.json();}catch{return json({error:"JSON invalide"},400)}
    const id=String(body?.id||"").trim(); const status=String(body?.status||"").trim();
    if(!id||!STATUSES.includes(status)) return json({error:"Données invalides"},400);
    const key=`review/${id}.json`;
    const current=await store.get(key,{type:"json",consistency:"strong"});
    if(!current) return json({error:"Avis introuvable"},404);
    const updated={...current,status,updatedAt:new Date().toISOString()};
    await store.setJSON(key,updated,{metadata:{productRef:updated.productRef||"",status,createdAt:updated.createdAt||""}});
    return json({ok:true,review:updated});
  }

  if(req.method==="DELETE"){
    const id=new URL(req.url).searchParams.get("id")||"";
    if(!id) return json({error:"ID manquant"},400);
    await store.delete(`review/${id}.json`);
    return json({ok:true});
  }

  return json({error:"Method not allowed"},405);
};
