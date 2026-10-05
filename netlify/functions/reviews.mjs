import { getStore } from "@netlify/blobs";
import { randomBytes } from "node:crypto";
import { json, rateLimit, sameOriginOrNoOrigin } from "./_security.mjs";

const clean=(v,max=500)=>String(v??"").trim().replace(/\s+/g," ").slice(0,max);
const cleanRef=v=>clean(v,120).toUpperCase();
const clampRating=v=>Math.max(1,Math.min(5,Math.round(Number(v)||0)));

async function findProduct(req, ref){
  try{
    const res=await fetch(new URL('/data/products.json',req.url),{cache:'no-store'});
    if(!res.ok) return null;
    const products=await res.json();
    return (Array.isArray(products)?products:[]).find(p=>cleanRef(p?.reference)===ref && p?.active!==false)||null;
  }catch{return null;}
}

export default async (req,context={})=>{
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

  if(req.method!=="POST") return json({error:"Method not allowed"},405,{allow:"GET, POST"});
  if(!sameOriginOrNoOrigin(req)) return json({error:"Origine refusée"},403);

  const rl=await rateLimit(req,context,{scope:"reviews-submit",limit:6,windowSeconds:3600});
  if(!rl.ok) return json({error:"Trop d’avis envoyés. Réessayez plus tard."},429,{"retry-after":String(rl.retryAfter)});

  const len=Number(req.headers.get('content-length')||0);
  if(len>12000) return json({error:"Payload trop volumineux"},413);

  let body; try{body=await req.json();}catch{return json({error:"JSON invalide"},400)}
  if(clean(body?.website,120)) return json({ok:true,pending:true},202);

  const productRef=cleanRef(body?.productRef);
  const name=clean(body?.name,100);
  const comment=clean(body?.comment,700);
  const rating=clampRating(body?.rating);
  if(!productRef || name.length<2 || comment.length<3 || rating<1 || rating>5){
    return json({error:"Avis incomplet"},400);
  }

  const product=await findProduct(req,productRef);
  if(!product) return json({error:"Produit introuvable"},404);
  const productName=clean(product.name,180);

  const createdAt=new Date().toISOString();
  const id=`RV-${createdAt.replace(/[-:TZ.]/g,"").slice(0,14)}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const review={id,productRef,productName,name,rating,comment,status:"Pending",createdAt,updatedAt:createdAt};
  await store.setJSON(`review/${id}.json`,review,{metadata:{productRef,status:"Pending",createdAt}});
  return json({ok:true,pending:true,id},201);
};
