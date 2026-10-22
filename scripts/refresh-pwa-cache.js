const fs=require('fs');
const path=require('path');

const file=path.join(process.cwd(),'dist','service-worker.js');
if(fs.existsSync(file)){
  let sw=fs.readFileSync(file,'utf8');
  sw=sw.replace(/const CACHE='magic-light-pwa-v\d+';/,"const CACHE='magic-light-pwa-v17';");
  if(!sw.includes('catalogue-taxonomy-safe-v17-20261022')) sw+='\n// catalogue-taxonomy-safe-v17-20261022\n';
  fs.writeFileSync(file,sw,'utf8');
  console.log('MAGIC LIGHT PWA cache refreshed to v17 after catalogue and cache fixes.');
}
