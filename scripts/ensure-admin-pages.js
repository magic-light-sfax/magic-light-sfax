const fs = require('fs');
const path = require('path');

const root = process.cwd();
const dist = path.join(root, 'dist');

const requiredPages = [
  ['admin/orders.html', 'admin/orders.html'],
  ['admin/analytics.html', 'admin/analytics.html'],
  ['admin/index.html', 'admin/index.html']
];

function copyRequired(srcRel, destRel) {
  const src = path.join(root, srcRel);
  const dest = path.join(dist, destRel);
  if (!fs.existsSync(src)) {
    throw new Error(`Required admin source missing: ${srcRel}`);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  if (!fs.existsSync(dest) || fs.statSync(dest).size === 0) {
    throw new Error(`Failed to publish admin page: ${destRel}`);
  }
  console.log(`Admin page ready: /${destRel}`);
}

for (const [src, dest] of requiredPages) copyRequired(src, dest);

// Convenience aliases so both clean and .html URLs work.
const redirects = [
  '/admin/orders /admin/orders.html 200',
  '/admin/analytics /admin/analytics.html 200'
].join('\n') + '\n';
fs.writeFileSync(path.join(dist, '_redirects'), redirects, 'utf8');

console.log('MAGIC LIGHT admin pages verified.');
