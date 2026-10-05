const fs=require('fs');
const path=require('path');

const ROOT=process.cwd();
const DIST=path.join(ROOT,'dist');
const PUBLIC_PAGES=['index.html','produits.html','products.html','nouveautes.html','references.html','catalogue.html','contact.html'];

const manifest={
  id:'/',
  name:'MAGIC LIGHT',
  short_name:'MAGIC LIGHT',
  description:'Éclairage, décoration, électricité et solutions lumineuses à Sfax.',
  lang:'fr',
  dir:'ltr',
  start_url:'/',
  scope:'/',
  display:'standalone',
  orientation:'any',
  background_color:'#ffffff',
  theme_color:'#111215',
  categories:['shopping','business','lifestyle'],
  icons:[
    {src:'/assets/pwa-icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'},
    {src:'/assets/pwa-icon.svg',sizes:'any',type:'image/svg+xml',purpose:'maskable'}
  ],
  shortcuts:[
    {name:'Produits',short_name:'Produits',url:'/produits',icons:[{src:'/assets/pwa-icon.svg',sizes:'any',type:'image/svg+xml'}]},
    {name:'Contact',short_name:'Contact',url:'/contact.html',icons:[{src:'/assets/pwa-icon.svg',sizes:'any',type:'image/svg+xml'}]}
  ]
};

const offline=`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#111215"><title>MAGIC LIGHT — Hors connexion</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#111215;color:#fff;font-family:Arial,Tahoma,sans-serif;padding:24px}.card{width:min(520px,100%);background:#fff;color:#20242b;border-radius:24px;padding:30px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.35)}img{width:104px;height:104px;object-fit:contain;margin:0 auto 16px}.gold{color:#a87925}button,a{display:inline-flex;align-items:center;justify-content:center;margin-top:16px;border:0;border-radius:999px;background:#c99a3c;color:#111;padding:12px 18px;font-weight:900;text-decoration:none;cursor:pointer}</style></head><body><main class="card"><img src="/assets/pwa-icon.svg" alt="MAGIC LIGHT"><h1>MAGIC <span class="gold">LIGHT</span></h1><p>Vous êtes hors connexion. Les pages déjà consultées peuvent rester disponibles.</p><button onclick="location.reload()">Réessayer</button></main></body></html>`;

const sw=`const CACHE='magic-light-pwa-v1';
const CORE=['/','/index.html','/produits','/produits.html','/offline.html','/assets/pwa-icon.svg','/assets/logo.jpg','/assets/pwa-install.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('magic-light-pwa-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==location.origin)return;
  if(url.pathname.startsWith('/admin/')||url.pathname.startsWith('/.netlify/functions/'))return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res}).catch(async()=>await caches.match(req)||await caches.match('/offline.html')));return;
  }
  if(url.pathname.startsWith('/assets/')){
    event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res})));return;
  }
});`;

function inject(file){
  const p=path.join(DIST,file);if(!fs.existsSync(p))return;
  let html=fs.readFileSync(p,'utf8');
  if(!html.includes('rel="manifest"')){
    const head='\n<link rel="manifest" href="/manifest.webmanifest">\n<meta name="theme-color" content="#111215">\n<meta name="application-name" content="MAGIC LIGHT">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<meta name="apple-mobile-web-app-title" content="MAGIC LIGHT">\n<link rel="apple-touch-icon" href="/assets/logo.jpg">\n';
    html=html.replace(/<\/head>/i,head+'</head>');
  }
  if(!html.includes('/assets/pwa-install.js')) html=html.replace(/<\/body>/i,'<script defer src="/assets/pwa-install.js"></script>\n</body>');
  fs.writeFileSync(p,html,'utf8');
}

if(!fs.existsSync(DIST)) throw new Error('dist introuvable: exécutez build.js avant enable-pwa.js');
fs.writeFileSync(path.join(DIST,'manifest.webmanifest'),JSON.stringify(manifest,null,2),'utf8');
fs.writeFileSync(path.join(DIST,'offline.html'),offline,'utf8');
fs.writeFileSync(path.join(DIST,'service-worker.js'),sw,'utf8');
PUBLIC_PAGES.forEach(inject);
console.log('MAGIC LIGHT PWA: manifest + service worker + install UI activés.');
