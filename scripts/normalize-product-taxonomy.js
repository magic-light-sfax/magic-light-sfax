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
  const out={famille:oldFamily,sous_categorie:oldSub,category:oldCategory,systeme:oldSystem,marque:firstBrand(text)};
  const set=(fam,sub,cat,system)=>{
    out.famille=fam||''; out.sous_categorie=sub||''; out.category=cat||sub||fam||'Autres';
    if(system!==undefined) out.systeme=system||'';
  };

  // Keep the known SOMEF Système 43 waterproof range exact.
  if((has(text,'prise etanche','gamme etanche') || has(text,'ip55')) && has(text,'somef')){
    set('Électricité domestique','Interrupteurs & prises','Gamme étanche','Système 43'); return out;
  }

  // SECURITY & COMMUNICATION — before solar/lighting rules.
  if(has(text,'camera','cameras','surveillance','ptz','dome')){
    set('Sécurité & communication','Caméras de surveillance',has(text,'solaire')?'Caméras solaires':has(text,'wifi')?'Caméras WiFi':'Caméras de surveillance'); return out;
  }
  if(has(text,'interphone','visiophone','video doorbell','doorbell','intercom','akuvox')){
    set('Sécurité & communication','Interphones',has(text,'visiophone','video','ecran')?'Interphone vidéo':'Interphones'); return out;
  }

  // SPORT / LEISURE / CAMPING.
  if(has(text,'matelas gonflable','dura beam')){
    set('Sport & loisirs','Camping & plein air','Matelas gonflables'); return out;
  }
  if(has(text,'camping','peche') && has(text,'lampe','eclairage','rgb','solaire')){
    set('Sport & loisirs','Camping & plein air','Éclairage camping'); return out;
  }

  // DECORATION / GIFTS / WELLNESS.
  if(has(text,'horloge murale','horloge decorative')){
    set('Décoration & cadeaux','Horloges décoratives','Horloges décoratives'); return out;
  }
  if(has(text,'cadre photo','cadres photo')){
    set('Décoration & cadeaux','Cadres photo','Cadres photo'); return out;
  }
  if(has(text,'statue','rhinoceros','objet decoratif','decoration rhinoceros')){
    set('Décoration & cadeaux','Statues & objets déco','Statues & objets déco'); return out;
  }
  if(has(text,'meuble decoratif','tiroirs fleuris','rangement decoratif')){
    set('Décoration & cadeaux','Rangements décoratifs','Rangements décoratifs'); return out;
  }
  if(has(text,'humidificateur','diffuseur d aromes','aromatherapie')){
    set('Bien-être & maison','Humidificateurs & diffuseurs','Humidificateurs & diffuseurs'); return out;
  }
  if(has(text,'ventilateur')){
    set('Bien-être & maison','Ventilateurs','Ventilateurs'); return out;
  }

  // ELECTRICITY.
  if(has(text,'fil rigide','h07vu','fil electrique','fils electriques')){
    set('Câbles, fils & conduites','Fils électriques','Fils rigides'); return out;
  }
  if(has(text,'cable electrique','cables electriques')){
    set('Câbles, fils & conduites','Câbles électriques','Câbles électriques'); return out;
  }
  if(has(text,'gaine','conduite')){
    set('Câbles, fils & conduites','Conduites & gaines','Conduites & gaines'); return out;
  }
  if(has(text,'disjoncteur','disjoncteurs')){
    set('Électricité domestique','Protection électrique','Disjoncteurs'); return out;
  }
  if(has(text,'coffret hager','coffret electrique','tableau electrique','tableaux coffrets')){
    set('Électricité domestique','Tableaux & coffrets','Coffrets électriques'); return out;
  }
  if(has(text,'controleur protecteur','protecteur electrique','protection commande')){
    set('Électricité industrielle','Protection & commande','Protection & commande'); return out;
  }
  if(has(text,'contacteur')){
    set('Électricité industrielle','Contacteurs','Contacteurs'); return out;
  }
  if(has(text,'variateur de frequence')){
    set('Électricité industrielle','Variateurs de fréquence','Variateurs de fréquence'); return out;
  }
  if(has(text,'detecteur de mouvement','detecteur mouvement','detecteur presence')){
    set('Relais & temporisateurs','Détecteurs mouvement / présence','Détecteur de mouvement'); return out;
  }
  if(has(text,'maison connectee')){
    set('Électricité domestique','Appareillage domestique','Maison connectée'); return out;
  }
  if(has(text,'interrupteurs prises','interrupteur et prise','interrupteurs et prises')){
    set('Électricité domestique','Interrupteurs & prises','Interrupteurs & prises',oldSystem); return out;
  }
  if(has(text,'prise de sol','prises de sol','colonnes somef')){
    set('Électricité domestique','Interrupteurs & prises','Prises'); return out;
  }

  // PHOTOVOLTAIC (not lighting/cameras).
  if(has(text,'panneau solaire','panneaux solaires')){
    set('Photovoltaïque','Panneaux solaires','Panneaux solaires'); return out;
  }
  if(has(text,'onduleur solaire')){
    set('Photovoltaïque','Onduleurs solaires','Onduleurs solaires'); return out;
  }
  if(has(text,'chargeur solaire')){
    set('Photovoltaïque','Accessoires solaires','Chargeurs solaires'); return out;
  }

  // LIGHTING — specific rules before generic lamp/LED rules.
  if(has(text,'lampadaire solaire','lampe solaire murale','spot solaire jardin','spot solaire','eclairage solaire')){
    set('Éclairage','Éclairage solaire',has(text,'lampadaire')?'Lampadaires solaires':has(text,'spot')?'Spots solaires':'Appliques solaires'); return out;
  }
  if(has(text,'par led','evenementiel','uv eclairage','lampe uv')){
    set('Éclairage','Éclairage événementiel',has(text,'par led')?'PAR LED':'Éclairage événementiel'); return out;
  }
  if(has(text,'lampe de secours','spot secours','secours led')){
    set('Éclairage','Éclairage de secours','Éclairage de secours'); return out;
  }
  if(has(text,'step light','escalier','meubles placards','spot meuble')){
    set('Éclairage','Éclairage meuble & escalier',has(text,'step','escalier')?'Éclairage d’escalier':'Éclairage meuble'); return out;
  }
  if(has(text,'luminaire led industriel','luminaire industriel')){
    set('Éclairage','Luminaires industriels','Luminaires industriels'); return out;
  }
  if(has(text,'projecteur','projecteurs')){
    set('Éclairage','Projecteurs LED',has(text,'portable','rechargeable')?'Projecteurs portables':has(text,'professionnel')?'Projecteurs professionnels':'Projecteurs extérieurs'); return out;
  }
  if(has(text,'plafonnier','plafonniers')){
    set('Éclairage','Plafonniers LED','Plafonniers LED'); return out;
  }
  if(has(text,'panel led','panels led','panneau led','panneaux led')){
    set('Éclairage','Panneaux LED','Panneaux LED'); return out;
  }
  if(has(text,'lustre','lustres')){
    set('Éclairage','Lustres','Lustres'); return out;
  }
  if(has(text,'suspension','suspendu','suspendue')){
    set('Éclairage','Suspensions','Suspensions'); return out;
  }
  if(has(text,'applique','appliques')){
    const cat=has(text,'exterieur','ip65','ip66','lanterne')?'Applique extérieure':has(text,'chevet')?'Applique intérieure':'Applique moderne';
    set('Éclairage','Appliques',cat); return out;
  }
  if(has(text,'guirlande','rideau led','rideaux led')){
    set('Éclairage','Guirlandes & rideaux LED','Guirlandes & rideaux LED'); return out;
  }
  if(has(text,'profil aluminium','profils aluminium','profile led','profils led','profil led')){
    set('Éclairage','Profilés LED',has(text,'silicone')?'Profilé silicone':'Profilé aluminium'); return out;
  }
  if(has(text,'ruban led','rubans led','flex led neon','neon flexible')){
    set('Éclairage','Ruban LED',has(text,'220v')?'Ruban LED 220V':has(text,'24v')?'Ruban LED 24V':has(text,'12v')?'Ruban LED 12V':'Ruban LED'); return out;
  }
  if(has(text,'spot','downlight','cob')){
    const cat=has(text,'rail')?'Spot sur rail':has(text,'gu10')?'Spot GU10':has(text,'mr16')?'Spot MR16':has(text,'piscine')?'Spot piscine':has(text,'meuble')?'Spot meuble':has(text,'exterieur','jardin','piquet')?'Spot extérieur':has(text,'encastr','downlight','cob')?'Spot encastré':'Spot LED apparent';
    set('Éclairage','Spots',cat); return out;
  }
  if(has(text,'ampoule','ampoules','e27','e14','b22','mr16','gu10','g4')){
    const cat=has(text,'gu10')?'GU10':has(text,'mr16')?'MR16':has(text,'e14')?'E14':has(text,'b22')?'B22':has(text,'g4')?'G4':has(text,'filament')?'Filament':has(text,'e27')?'E27':has(text,'rgb')?'Ampoule RGB':'Ampoules LED';
    set('Éclairage','Lampes / Ampoules',cat); return out;
  }
  if(has(text,'lampe de table','lampes de table','lampe de bureau','lampes de bureau')){
    set('Éclairage','Lampes décoratives',has(text,'bureau')?'Lampe de bureau':'Lampe de table'); return out;
  }
  if(has(text,'lampe decorative','lanterne led decorative')){
    set('Éclairage','Lampes décoratives','Lampe décorative'); return out;
  }
  if(has(text,'reglette led')){
    set('Éclairage','Réglettes LED',has(text,'etanche')?'Réglette LED étanche':'Réglettes LED'); return out;
  }

  // Generic category fallbacks.
  if(has(text,'decoration interieure','decoration bien etre')) set('Décoration & cadeaux','Objets déco','Objets déco');
  else if(has(text,'ampoules lampes','eclairage','led','luminaire')) set('Éclairage','Autres éclairages','Autres éclairages');
  else if(has(text,'accessoires electriques')) set('Accessoires & outillage','Accessoires de montage','Accessoires électriques');
  else if(has(text,'solaire','photovoltaique')) set('Photovoltaïque','Accessoires solaires','Accessoires solaires');
  else set(oldFamily||'Autres',oldSub||'',oldCategory&&oldCategory!=='Autres'?oldCategory:'Autres',oldSystem);
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
  p.sous_categorie=c.sous_categorie;
  p.category=c.category;
  p.systeme=c.systeme;
  if(c.marque) p.marque=c.marque;
  const after=JSON.stringify([p.famille||'',p.sous_categorie||'',p.category||'',p.systeme||'',p.marque||'']);
  if(before!==after) changed++;
  counts[p.famille]=(counts[p.famille]||0)+1;
  if(!p.famille || p.famille==='Autres' || !p.category || p.category==='Autres') unknown++;
}

fs.writeFileSync(file,JSON.stringify(products,null,2),'utf8');
const report={generatedAt:new Date().toISOString(),total:products.length,changed,unknown,byFamily:Object.fromEntries(Object.entries(counts).sort((a,b)=>b[1]-a[1]))};
fs.writeFileSync(path.join(path.dirname(file),'product-taxonomy-summary.json'),JSON.stringify(report,null,2),'utf8');
console.log('MAGIC LIGHT taxonomy normalization: '+products.length+' produits, '+changed+' reclassés, '+unknown+' à revoir.');
console.log('Familles:',report.byFamily);
