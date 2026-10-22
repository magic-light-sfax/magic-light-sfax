const fs=require('fs');
const path=require('path');

const ROOT=process.cwd();
const file=path.join(ROOT,'dist','data','products.json');
if(!fs.existsSync(file)) process.exit(0);

const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const has=(t,...words)=>words.some(w=>t.includes(norm(w)));
const firstBrand=t=>{
  const brands=[
    ['Schneider Electric',['schneider']],['Legrand',['legrand']],['Hager',['hager']],['SOMEF',['somef']],
    ['CHINT',['chint']],['TTI',['tti']],['SIAME',['siame']],['Tiandy',['tiandy']],['IMOU',['imou']],
    ['Akuvox',['akuvox']],['EKOLED',['ekoled']],['Novalux',['novalux']],['Intex',['intex']],['GAFO',['gafo']]
  ];
  for(const [name,keys] of brands) if(keys.some(k=>t.includes(k))) return name;
  return '';
};

function classify(p){
  const oldCategory=String(p.category||'').trim();
  const oldSub=String(p.sous_categorie||p.sousCategorie||'').trim();
  const oldFamily=String(p.famille||p.family||'').trim();
  const oldSystem=String(p.systeme||p.system||'').trim();
  const text=norm([p.name,p.reference,oldCategory,oldSub,oldFamily,p.description,p.image].filter(Boolean).join(' '));
  const out={famille:oldFamily||oldCategory||'À classer',sous_categorie:'',category:oldCategory||oldFamily||'À classer',systeme:oldSystem,marque:firstBrand(text)};
  const set=(family,category=family,system)=>{
    out.famille=family;
    out.sous_categorie='';
    out.category=category;
    if(system!==undefined) out.systeme=system||'';
  };

  // Cameras: each real type stays separate.
  if(has(text,'camera','cameras','surveillance','ptz','dome')){
    if(has(text,'solaire') && has(text,'4g')) set('Caméras solaires 4G');
    else if(has(text,'solaire') && has(text,'wifi')) set('Caméras solaires Wi‑Fi');
    else if(has(text,'solaire')) set('Caméras solaires');
    else if(has(text,'wifi') && has(text,'exterieur')) set('Caméras Wi‑Fi extérieures');
    else if(has(text,'wifi') && has(text,'interieur')) set('Caméras Wi‑Fi intérieures');
    else if(has(text,'wifi')) set('Caméras Wi‑Fi');
    else if(has(text,'exterieur')) set('Caméras extérieures');
    else if(has(text,'interieur','dome')) set('Caméras intérieures');
    else set('Caméras de surveillance');
    return out;
  }

  // Interphones / video door entry.
  if(has(text,'visiophone')){ set('Visiophones'); return out; }
  if(has(text,'interphone video','video doorbell','intercom video')){ set('Interphones vidéo'); return out; }
  if(has(text,'interphone','doorbell','intercom','akuvox')){ set('Interphones'); return out; }

  // Solar lighting: no mixing with normal projectors/spots/appliques.
  if(has(text,'projecteur solaire')){ set('Projecteurs solaires'); return out; }
  if(has(text,'lampadaire solaire')){ set('Lampadaires solaires'); return out; }
  if(has(text,'spot solaire')){ set('Spots solaires'); return out; }
  if(has(text,'applique solaire','lampe solaire murale')){ set('Appliques solaires'); return out; }
  if(has(text,'lampe solaire') && has(text,'camping','peche')){ set('Lampes solaires camping'); return out; }

  // Projectors stay separate from other outdoor lighting.
  if(has(text,'projecteur','projecteurs')){
    if(has(text,'portable','rechargeable')) set('Projecteurs portables rechargeables');
    else if(has(text,'professionnel')) set('Projecteurs LED professionnels');
    else if(has(text,'exterieur','ip65','ip66')) set('Projecteurs LED extérieurs');
    else set('Projecteurs LED');
    return out;
  }

  // Suspensions are their own family.
  if(has(text,'suspension','suspendu','suspendue')){ set('Suspensions'); return out; }

  // Lustres are not suspensions.
  if(has(text,'lustre','lustres')){ set('Lustres'); return out; }

  // Wall lights: exact separation indoor/outdoor when the product says so.
  if(has(text,'applique','appliques')){
    if(has(text,'exterieur','ip65','ip66','lanterne')) set('Appliques murales extérieures');
    else if(has(text,'chevet','interieur')) set('Appliques murales intérieures');
    else set('Appliques murales');
    return out;
  }

  // Outdoor lighting that is neither projector nor applique nor solar.
  if(has(text,'eclairage exterieur','luminaire exterieur','luminaires exterieurs')){ set('Éclairage extérieur'); return out; }

  // Fibre optic lighting only exists if an actual matching product exists.
  if(has(text,'fibre optique','fiber optic')){ set('Éclairage fibre optique'); return out; }

  // Panels / Eblue: 3D panel is never a plafonnier.
  if(has(text,'panneau led 3d','panel led 3d','panneaux led 3d','eblue')){ set('Eblue'); return out; }
  if(has(text,'panel led','panels led','panneau led','panneaux led')){ set('Panneaux LED'); return out; }

  // Plafonniers only when the product explicitly says plafonnier.
  if(has(text,'plafonnier','plafonniers')){ set('Plafonniers LED'); return out; }

  // Spots: keep actual spot type separate.
  if(has(text,'spot','downlight','cob')){
    if(has(text,'rail')) set('Spots sur rail');
    else if(has(text,'gu10')) set('Spots GU10');
    else if(has(text,'mr16')) set('Spots MR16');
    else if(has(text,'piscine')) set('Spots piscine');
    else if(has(text,'meuble','placard')) set('Spots meubles');
    else if(has(text,'jardin','piquet','exterieur')) set('Spots extérieurs');
    else if(has(text,'encastr','downlight','cob')) set('Spots encastrables');
    else set('Spots');
    return out;
  }

  // LED strips / neon stay together only with the exact corresponding product type.
  if(has(text,'ruban led','rubans led')){
    if(has(text,'cob')) set('Rubans LED COB');
    else if(has(text,'220v')) set('Rubans LED 220V');
    else if(has(text,'24v')) set('Rubans LED 24V');
    else if(has(text,'12v')) set('Rubans LED 12V');
    else set('Rubans LED');
    return out;
  }
  if(has(text,'flex led neon','neon flexible')){ set('Néon LED flexible'); return out; }

  // Profiles stay separate from strips.
  if(has(text,'profil aluminium','profils aluminium')){ set('Profilés aluminium LED'); return out; }
  if(has(text,'profil silicone','profils silicone')){ set('Profilés silicone LED'); return out; }

  // Bulbs separated by socket/type when explicitly known.
  if(has(text,'ampoule','ampoules','e27','e14','b22','mr16','gu10','g4')){
    if(has(text,'gu10')) set('Ampoules GU10');
    else if(has(text,'mr16')) set('Ampoules MR16');
    else if(has(text,'e14')) set('Ampoules E14');
    else if(has(text,'b22')) set('Ampoules B22');
    else if(has(text,'g4')) set('Ampoules G4');
    else if(has(text,'filament')) set('Ampoules filament');
    else if(has(text,'e27')) set('Ampoules E27');
    else if(has(text,'rgb')) set('Ampoules RGB');
    else set('Ampoules LED');
    return out;
  }

  // Table/desk/decorative lamps: exact own families.
  if(has(text,'lampe de bureau','lampes de bureau')){ set('Lampes de bureau'); return out; }
  if(has(text,'lampe de table','lampes de table')){ set('Lampes de table'); return out; }
  if(has(text,'lampe decorative','lanterne led decorative')){ set('Lampes décoratives'); return out; }

  if(has(text,'reglette led')){ set(has(text,'etanche')?'Réglettes LED étanches':'Réglettes LED'); return out; }
  if(has(text,'guirlande','rideau led','rideaux led')){ set('Guirlandes & rideaux LED'); return out; }
  if(has(text,'par led','evenementiel')){ set('Éclairage événementiel'); return out; }
  if(has(text,'lampe uv','eclairage uv')){ set('Éclairage UV'); return out; }
  if(has(text,'lampe de secours','spot secours','secours led')){ set('Éclairage de secours'); return out; }
  if(has(text,'step light','eclairage escalier','escalier')){ set('Éclairage d’escalier'); return out; }
  if(has(text,'luminaire led industriel','luminaire industriel')){ set('Luminaires industriels'); return out; }

  // Electrical products: each family is direct.
  if(has(text,'prise etanche','gamme etanche','ip55') && has(text,'somef')){ set('Prises étanches SOMEF','Prises étanches SOMEF','Système 43'); return out; }
  if(has(text,'disjoncteur','disjoncteurs')){ set('Disjoncteurs'); return out; }
  if(has(text,'coffret hager','coffret electrique','tableau electrique')){ set('Coffrets électriques'); return out; }
  if(has(text,'fil rigide','h07vu')){ set('Fils électriques rigides'); return out; }
  if(has(text,'fil electrique','fils electriques')){ set('Fils électriques'); return out; }
  if(has(text,'cable electrique','cables electriques')){ set('Câbles électriques'); return out; }
  if(has(text,'gaine','conduite')){ set('Gaines & conduites'); return out; }
  if(has(text,'detecteur de mouvement','detecteur mouvement','detecteur presence')){ set('Détecteurs de mouvement'); return out; }
  if(has(text,'interrupteurs prises','interrupteur et prise','interrupteurs et prises')){ set('Interrupteurs & prises', 'Interrupteurs & prises', oldSystem); return out; }
  if(has(text,'prise de sol','prises de sol')){ set('Prises de sol'); return out; }
  if(has(text,'maison connectee')){ set('Maison connectée'); return out; }
  if(has(text,'controleur protecteur','protecteur electrique')){ set('Protecteurs électriques'); return out; }
  if(has(text,'contacteur')){ set('Contacteurs'); return out; }
  if(has(text,'variateur de frequence')){ set('Variateurs de fréquence'); return out; }

  // Photovoltaic products, separate from solar lighting.
  if(has(text,'panneau solaire','panneaux solaires')){ set('Panneaux solaires'); return out; }
  if(has(text,'onduleur solaire')){ set('Onduleurs solaires'); return out; }
  if(has(text,'chargeur solaire')){ set('Chargeurs solaires'); return out; }

  // Decoration / gift / home items remain exact, never merged with lighting.
  if(has(text,'horloge murale','horloge decorative')){ set('Horloges murales décoratives'); return out; }
  if(has(text,'cadre photo','cadres photo')){ set('Cadres photo'); return out; }
  if(has(text,'statue')){ set('Statues décoratives'); return out; }
  if(has(text,'rhinoceros','objet decoratif','decoration rhinoceros')){ set('Objets décoratifs'); return out; }
  if(has(text,'meuble decoratif','tiroirs fleuris','rangement decoratif')){ set('Rangements décoratifs'); return out; }
  if(has(text,'humidificateur','diffuseur d aromes','aromatherapie')){ set('Humidificateurs & diffuseurs'); return out; }
  if(has(text,'ventilateur')){ set('Ventilateurs'); return out; }
  if(has(text,'matelas gonflable','dura beam')){ set('Matelas gonflables'); return out; }

  // Preserve an existing meaningful product category instead of inventing a broad family.
  if(oldCategory && oldCategory!=='Autres') set(oldCategory,oldCategory,oldSystem);
  else if(oldFamily && oldFamily!=='Autres') set(oldFamily,oldFamily,oldSystem);
  else set('À classer');
  return out;
}

let products;
try{ products=JSON.parse(fs.readFileSync(file,'utf8')); }
catch(e){ throw new Error('normalize-product-taxonomy: invalid products.json - '+e.message); }
if(!Array.isArray(products)) throw new Error('normalize-product-taxonomy: products.json must be an array');

const counts={};
let changed=0,unknown=0;
for(const p of products){
  const before=JSON.stringify([p.famille||'',p.sous_categorie||'',p.category||'',p.systeme||'',p.marque||'']);
  const c=classify(p);
  p.famille=c.famille;
  p.sous_categorie='';
  p.category=c.category;
  p.systeme=c.systeme;
  if(c.marque) p.marque=c.marque;
  const after=JSON.stringify([p.famille||'',p.sous_categorie||'',p.category||'',p.systeme||'',p.marque||'']);
  if(before!==after) changed++;
  counts[p.famille]=(counts[p.famille]||0)+1;
  if(!p.famille || p.famille==='À classer') unknown++;
}

fs.writeFileSync(file,JSON.stringify(products,null,2),'utf8');
const report={generatedAt:new Date().toISOString(),total:products.length,changed,unknown,byFamily:Object.fromEntries(Object.entries(counts).sort((a,b)=>a[0].localeCompare(b[0],'fr')))};
fs.writeFileSync(path.join(path.dirname(file),'product-taxonomy-summary.json'),JSON.stringify(report,null,2),'utf8');
console.log('MAGIC LIGHT strict product families: '+products.length+' produits, '+changed+' reclassés, '+unknown+' à revoir.');
console.log('Familles réelles:',report.byFamily);
