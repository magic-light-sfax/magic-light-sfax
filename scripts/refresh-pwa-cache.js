const fs=require('fs');
const path=require('path');

const file=path.join(process.cwd(),'dist','service-worker.js');
if(fs.existsSync(file)){
  let sw=fs.readFileSync(file,'utf8');
  sw=sw.replace(/const CACHE='magic-light-pwa-v\d+';/,"const CACHE='magic-light-pwa-v16';");
  if(!sw.includes('catalogue-taxonomy-safe-v16-20261010')) sw+='\n// catalogue-taxonomy-safe-v16-20261010\n';
  fs.writeFileSync(file,sw,'utf8');
  console.log('MAGIC LIGHT PWA cache refreshed to v16 after safe catalogue taxonomy fix.');
}
