const fs=require('fs');
const path=require('path');

const ROOT=process.cwd();
const DIST=path.join(ROOT,'dist');
const SITE='https://magic-light-sfax.netlify.app';
const TODAY=new Date().toISOString().slice(0,10);

function escHtml(v=''){
  return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escXml(v=''){
  return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}
function slug(v=''){
  const s=String(v).trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  return s||'produit';
}
function insertBeforeLast(html,tag,content){
  const needle='</'+tag+'>';
  const i=html.toLowerCase().lastIndexOf(needle);
  return i===-1?html+content:html.slice(0,i)+content+html.slice(i);
}
function upsertMeta(html,name,value){
  const re=new RegExp(`<meta\\s+name=["']${name}["'][^>]*>`,`i`);
  const tag=`<meta name="${name}" content="${escHtml(value)}">`;
  if(re.test(html)) return html.replace(re,tag);
  return insertBeforeLast(html,'head','\n'+tag+'\n');
}
function upsertCanonical(html,url){
  const re=/<link\s+rel=["']canonical["'][^>]*>/i;
  const tag=`<link rel="canonical" href="${escHtml(url)}">`;
  if(re.test(html)) return html.replace(re,tag);
  return insertBeforeLast(html,'head','\n'+tag+'\n');
}
function upsertTitle(html,title){
  const tag=`<title>${escHtml(title)}</title>`;
  if(/<title>[\s\S]*?<\/title>/i.test(html)) return html.replace(/<title>[\s\S]*?<\/title>/i,tag);
  return insertBeforeLast(html,'head','\n'+tag+'\n');
}
function addJsonLd(html,obj,key){
  if(html.includes(`data-seo-schema="${key}"`)) return html;
  const json=JSON.stringify(obj).replace(/</g,'\\u003c');
  return insertBeforeLast(html,'head',`\n<script type="application/ld+json" data-seo-schema="${key}">${json}</script>\n`);
}
function writePage(file,cfg){
  const p=path.join(DIST,file);
  if(!fs.existsSync(p)) return;
  let html=fs.readFileSync(p,'utf8');
  html=upsertTitle(html,cfg.title);
  html=upsertMeta(html,'description',cfg.description);
  html=upsertMeta(html,'robots','index,follow,max-image-preview:large');
  html=upsertCanonical(html,cfg.url);
  html=insertBeforeLast(html,'head',`\n<meta property="og:site_name" content="MAGIC LIGHT">\n<meta property="og:type" content="website">\n<meta property="og:title" content="${escHtml(cfg.title)}">\n<meta property="og:description" content="${escHtml(cfg.description)}">\n<meta property="og:url" content="${escHtml(cfg.url)}">\n`);
  fs.writeFileSync(p,html,'utf8');
}

if(!fs.existsSync(DIST)) throw new Error('dist introuvable: exécutez build.js avant enable-seo.js');

const pages={
  'index.html':{
    title:'MAGIC LIGHT Sfax | Éclairage, LED, décoration et électricité',
    description:'MAGIC LIGHT à Sfax : luminaires, LED, spots, panneaux, profils LED, solaire, électricité et décoration. Découvrez nos produits et promotions.',
    url:SITE+'/'
  },
  'produits.html':{
    title:'Produits d’éclairage et électricité | MAGIC LIGHT Sfax',
    description:'Découvrez le catalogue MAGIC LIGHT : luminaires, LED, spots, panneaux, profils LED, solaire, sécurité, décoration et accessoires électriques à Sfax.',
    url:SITE+'/produits'
  },
  'products.html':{
    title:'Produits d’éclairage et électricité | MAGIC LIGHT Sfax',
    description:'Découvrez le catalogue MAGIC LIGHT : luminaires, LED, spots, panneaux, profils LED, solaire, sécurité, décoration et accessoires électriques à Sfax.',
    url:SITE+'/produits'
  },
  'nouveautes.html':{
    title:'Nouveautés éclairage et décoration | MAGIC LIGHT Sfax',
    description:'Les nouveautés MAGIC LIGHT à Sfax : éclairage LED, luminaires, décoration, solaire et solutions électriques.',
    url:SITE+'/nouveautes.html'
  },
  'references.html':{
    title:'Références et marques | MAGIC LIGHT Sfax',
    description:'Découvrez les références, marques et solutions d’éclairage et d’électricité proposées par MAGIC LIGHT à Sfax.',
    url:SITE+'/references.html'
  },
  'catalogue.html':{
    title:'Catalogue MAGIC LIGHT Sfax | Luminaires, LED et électricité',
    description:'Parcourez le catalogue MAGIC LIGHT Sfax : luminaires, LED, panneaux, profils, spots, solaire, décoration et accessoires électriques.',
    url:SITE+'/catalogue.html'
  },
  'contact.html':{
    title:'Contact MAGIC LIGHT Sfax | 402 Avenue Majida Boulila',
    description:'Contactez MAGIC LIGHT à Sfax pour vos besoins en éclairage, luminaires, LED, décoration et électricité.',
    url:SITE+'/contact.html'
  }
};
Object.entries(pages).forEach(([file,cfg])=>writePage(file,cfg));

const home=path.join(DIST,'index.html');
if(fs.existsSync(home)){
  let html=fs.readFileSync(home,'utf8');
  html=addJsonLd(html,{
    '@context':'https://schema.org',
    '@type':'Store',
    name:'MAGIC LIGHT',
    url:SITE+'/',
    image:SITE+'/assets/logo.jpg',
    telephone:'+21622181224',
    address:{
      '@type':'PostalAddress',
      streetAddress:'402 Avenue Majida Boulila',
      addressLocality:'Sfax',
      addressCountry:'TN'
    }
  },'store');
  fs.writeFileSync(home,html,'utf8');
}

let products=[];
const productsJson=path.join(DIST,'data','products.json');
if(fs.existsSync(productsJson)){
  try{products=JSON.parse(fs.readFileSync(productsJson,'utf8'));}catch(e){console.warn('SEO: products.json invalide -',e.message);}
}

const productUrls=[];
for(const product of products){
  const key=String(product.reference||product.name||'').trim();
  if(!key) continue;
  const s=slug(key);
  const productUrl=`${SITE}/p/${s}/`;
  const p=path.join(DIST,'p',s,'index.html');
  if(!fs.existsSync(p)) continue;
  let html=fs.readFileSync(p,'utf8');
  const image=product.image?(String(product.image).startsWith('http')?product.image:SITE+'/'+String(product.image).replace(/^\.?\//,'')):SITE+'/assets/logo.jpg';
  const schema={
    '@context':'https://schema.org',
    '@type':'Product',
    name:product.name||key,
    description:product.description||`Découvrez ${product.name||key} chez MAGIC LIGHT Sfax.`,
    image:[image],
    sku:product.reference||undefined,
    category:product.category||undefined,
    url:productUrl
  };
  if(Number(product.price)>0){
    schema.offers={
      '@type':'Offer',
      url:productUrl,
      priceCurrency:'TND',
      price:Number(product.price).toFixed(3),
      seller:{'@type':'Organization',name:'MAGIC LIGHT'}
    };
  }
  html=addJsonLd(html,schema,'product');
  html=upsertMeta(html,'robots','index,follow,max-image-preview:large');
  html=upsertCanonical(html,productUrl);
  fs.writeFileSync(p,html,'utf8');
  productUrls.push(productUrl);
}

const staticUrls=[
  SITE+'/',SITE+'/produits',SITE+'/nouveautes.html',SITE+'/references.html',SITE+'/catalogue.html',SITE+'/contact.html'
];
const urls=[...staticUrls,...productUrls];
const sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
  urls.map(u=>`  <url><loc>${escXml(u)}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')+
  '\n</urlset>\n';
fs.writeFileSync(path.join(DIST,'sitemap.xml'),sitemap,'utf8');
fs.writeFileSync(path.join(DIST,'robots.txt'),`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /.netlify/functions/\n\nSitemap: ${SITE}/sitemap.xml\n`,'utf8');

console.log(`MAGIC LIGHT SEO: ${urls.length} URL(s) dans sitemap, ${productUrls.length} fiche(s) produit enrichie(s).`);
