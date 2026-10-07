const fs=require('fs');
const path=require('path');

const file=path.join(process.cwd(),'dist','service-worker.js');
if(fs.existsSync(file)){
  let sw=fs.readFileSync(file,'utf8');
  sw=sw.replace(/const CACHE='magic-light-pwa-v\d+';/,"const CACHE='magic-light-pwa-v6';");
  if(!sw.includes('products-3col-images-20261007')) sw+='\n// products-3col-images-20261007\n';
  fs.writeFileSync(file,sw,'utf8');
  console.log('MAGIC LIGHT PWA cache refreshed to v6 for Products 3-column layout.');
}
