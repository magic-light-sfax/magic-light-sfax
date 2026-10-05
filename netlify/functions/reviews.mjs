import { getStore } from "@netlify/blobs";
import { randomBytes } from "node:crypto";

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const clean=(v,max=500)=>String(v??"").trim().replace(/\s+/g," ").slice(0,max);
const cleanRef=v=>clean(v,120).toUpperCase();
const clampRating=v=>Math.max(1,Math.min(5,Math.round(Number(v)||0)));

export default async (req)=>{
  const store=getStore("magic-light-reviews");
  const url=new URL(req.url);

  if(req.method==="GET"){
    const ref=cleanRef(url.searchParams.get("productRef")||"");
    const { blobs }=await store.list({prefix:"review/"});
    const reviews=[];
    for(const blob of blobs){
      try{
        const item=await store.get(blob.key,{type:"json",consistency:"strong"});
        if(!item || item.status!=="Approved") continue;
        if(ref && cleanRef(item.productRef)!==ref) continue;
        reviews.push({
          id:item.id,
          productRef:item.productRef,
          productName:item.productName||"",
          name:item.name,
          rating:item.rating,
          comment:item.comment,
          createdAt:item.createdAt
        });
      }catch{}
    }
    reviews.sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
    const count=reviews.length;
    const average=count?reviews.reduce((s,r)=>s+Number(r.rating||0),0)/count:0;
    return json({ok:true,reviews,count,average:Number(average.toFixed(1))});
  }

  if(req.method!=="POST") return json({error:"Method not allowed"},405);
  let body; try{body=await req.json();}catch{return json({error:"JSON invalide"},400)}
  if(clean(body?.website,120)) return json({ok:true,pending:true},202);

  const productRef=cleanRef(body?.productRef);
  const productName=clean(body?.productName,180);
  const name=clean(body?.name,100);
  const comment=clean(body?.comment,700);
  const rating=clampRating(body?.rating);
  if(!productRef || !name || comment.length<3 || rating<1 || rating>5){
    return json({error:"Avis incomplet"},400);
  }

  const createdAt=new Date().toISOString();
  const id=`RV-${createdAt.replace(/[-:TZ.]/g,"").slice(0,14)}-${randomBytes(2).toString("hex").toUpperCase()}`;
  const review={id,productRef,productName,name,rating,comment,status:"Pending",createdAt,updatedAt:createdAt};
  await store.setJSON(`review/${id}.json`,review,{metadata:{productRef,status:"Pending",createdAt}});
  return json({ok:true,pending:true,id},201);
};
