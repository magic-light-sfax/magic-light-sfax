const fs = require('fs');
const path = require('path');

const DIST = path.join(process.cwd(), 'dist');
const MARK = 'magic-light-responsive-device-guard-v1';

const guard = `
<script id="${MARK}">
(() => {
  try {
    const ua = navigator.userAgent || '';
    const mobileUA = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i.test(ua);
    const coarse = !!(window.matchMedia && window.matchMedia('(pointer:coarse)').matches);
    const touchPoints = Number(navigator.maxTouchPoints || 0);
    const touchDevice = coarse || touchPoints > 1;
    const viewport = Math.min(
      Number(window.innerWidth || 9999),
      Number(document.documentElement.clientWidth || 9999)
    );

    /*
      IMPORTANT:
      Never classify a normal Windows/Mac desktop as mobile just because the
      physical screen height is 768/800/900px. The previous detector used the
      smallest screen dimension, which made common desktop monitors receive
      the mobile CSS and caused tiny product images, oversized white cards,
      a mobile header and 3-column mobile catalogue rules on desktop.
    */
    const shouldUseMobileDeviceCSS = mobileUA || (touchDevice && viewport <= 1100);

    if (shouldUseMobileDeviceCSS) {
      document.documentElement.classList.add('ml-mobile-device');
      document.documentElement.classList.toggle('ml-mobile-narrow', viewport <= 350);
    } else {
      document.documentElement.classList.remove('ml-mobile-device', 'ml-mobile-narrow');
      document.documentElement.classList.add('ml-desktop-device');
    }
  } catch (e) {
    /* Normal responsive @media rules remain the fallback. */
  }
})();
</script>`;

function stripOld(html) {
  const re = new RegExp('\\n?<script id="' + MARK + '">[\\s\\S]*?<\\/script>\\s*', 'g');
  return html.replace(re, '\n');
}

function inject(file) {
  let html = stripOld(fs.readFileSync(file, 'utf8'));
  const headEnd = html.toLowerCase().indexOf('</head>');
  if (headEnd < 0) return false;
  html = html.slice(0, headEnd) + guard + '\n' + html.slice(headEnd);
  fs.writeFileSync(file, html, 'utf8');
  return true;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return 0;
  let changed = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'admin') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) changed += walk(full);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      if (inject(full)) changed++;
    }
  }
  return changed;
}

const changed = walk(DIST);
console.log(`MAGIC LIGHT responsive device guard: fixed desktop/mobile detection on ${changed} page(s).`);
