const fs=require('fs');
const path=require('path');
const zlib=require('zlib');

const OUT=path.join(process.cwd(),'dist','assets','pwa-icon-512.png');
const W=512,H=512;
const pixels=Buffer.alloc(W*H*4);

const BG=[17,18,21,255];
const GOLD=[201,154,60,255];
const GOLD2=[242,213,142,255];
const WHITE=[255,255,255,255];

function px(x,y,c){
  x=Math.round(x);y=Math.round(y);
  if(x<0||y<0||x>=W||y>=H)return;
  const i=(y*W+x)*4;
  pixels[i]=c[0];pixels[i+1]=c[1];pixels[i+2]=c[2];pixels[i+3]=c[3];
}
function fill(c){
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)px(x,y,c);
}
function fillCircle(cx,cy,r,c){
  const r2=r*r;
  for(let y=Math.max(0,Math.floor(cy-r));y<=Math.min(H-1,Math.ceil(cy+r));y++){
    for(let x=Math.max(0,Math.floor(cx-r));x<=Math.min(W-1,Math.ceil(cx+r));x++){
      const dx=x-cx,dy=y-cy;
      if(dx*dx+dy*dy<=r2)px(x,y,c);
    }
  }
}
function strokeCircle(cx,cy,r,w,c){
  const ro=r+w/2,ri=Math.max(0,r-w/2),ro2=ro*ro,ri2=ri*ri;
  for(let y=Math.max(0,Math.floor(cy-ro));y<=Math.min(H-1,Math.ceil(cy+ro));y++){
    for(let x=Math.max(0,Math.floor(cx-ro));x<=Math.min(W-1,Math.ceil(cx+ro));x++){
      const dx=x-cx,dy=y-cy,d=dx*dx+dy*dy;
      if(d<=ro2&&d>=ri2)px(x,y,c);
    }
  }
}
function strokeLine(x1,y1,x2,y2,w,c){
  const half=w/2,minX=Math.max(0,Math.floor(Math.min(x1,x2)-half)),maxX=Math.min(W-1,Math.ceil(Math.max(x1,x2)+half));
  const minY=Math.max(0,Math.floor(Math.min(y1,y2)-half)),maxY=Math.min(H-1,Math.ceil(Math.max(y1,y2)+half));
  const vx=x2-x1,vy=y2-y1,len2=vx*vx+vy*vy||1,r2=half*half;
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
    let t=((x-x1)*vx+(y-y1)*vy)/len2;t=Math.max(0,Math.min(1,t));
    const qx=x1+t*vx,qy=y1+t*vy,dx=x-qx,dy=y-qy;
    if(dx*dx+dy*dy<=r2)px(x,y,c);
  }
  fillCircle(x1,y1,half,c);fillCircle(x2,y2,half,c);
}
function crc32(buf){
  let c=0xffffffff;
  for(const b of buf){
    c^=b;
    for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);
  }
  return (c^0xffffffff)>>>0;
}
function chunk(type,data){
  const t=Buffer.from(type,'ascii');
  const len=Buffer.alloc(4);len.writeUInt32BE(data.length,0);
  const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([t,data])),0);
  return Buffer.concat([len,t,data,crc]);
}

fill(BG);
strokeCircle(256,256,190,12,GOLD);
strokeCircle(256,235,132,18,GOLD);
strokeLine(191,350,321,350,18,GOLD);
strokeLine(199,382,313,382,16,GOLD);
strokeLine(211,414,301,414,14,GOLD);

strokeLine(190,255,190,193,20,WHITE);
strokeLine(190,193,256,287,20,WHITE);
strokeLine(256,287,322,193,20,WHITE);
strokeLine(322,193,322,315,20,WHITE);

fillCircle(256,94,10,GOLD2);
strokeLine(256,58,256,24,12,GOLD2);
strokeLine(170,89,148,61,12,GOLD2);
strokeLine(342,89,364,61,12,GOLD2);
strokeLine(126,166,92,154,12,GOLD2);
strokeLine(386,166,420,154,12,GOLD2);

const raw=Buffer.alloc((W*4+1)*H);
for(let y=0;y<H;y++){
  const row=y*(W*4+1);raw[row]=0;
  pixels.copy(raw,row+1,y*W*4,(y+1)*W*4);
}
const ihdr=Buffer.alloc(13);
ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);
ihdr[8]=8;ihdr[9]=6;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
const png=Buffer.concat([
  Buffer.from([137,80,78,71,13,10,26,10]),
  chunk('IHDR',ihdr),
  chunk('IDAT',zlib.deflateSync(raw,{level:9})),
  chunk('IEND',Buffer.alloc(0))
]);
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,png);
console.log(`MAGIC LIGHT PWA icon: ${OUT} (${png.length} bytes, 512x512 PNG).`);
