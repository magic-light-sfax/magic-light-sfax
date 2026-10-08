const fs=require('fs');
const path=require('path');

const file=path.join(process.cwd(),'dist','service-worker.js');
if(fs.existsSync(file)){
  let sw=fs.readFileSync(file,'utf8');
  sw=sw.replace(/const CACHE='magic-light-pwa-v\d+';/,"const CACHE='magic-light-pwa-v12';");
  if(!sw.includes('home-mobile-cards-pro-v4-20261008')) sw+='\n// home-mobile-cards-pro-v4-20261008\n';
  fs.writeFileSync(file,sw,'utf8');
  console.log('MAGIC LIGHT PWA cache refreshed to v12 for forced Home mobile cards v4.');
}
