const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'dist', 'index.html');
if (!fs.existsSync(file)) process.exit(0);

let html = fs.readFileSync(file, 'utf8');
const marker = 'desktop-home-hero-polish-v1';

if (!html.includes(marker)) {
  const css = `\n<style id="${marker}">\n/* MAGIC LIGHT • desktop home hero polish */\n@media (min-width:901px){\n  .hero-copy{\n    max-width:445px !important;\n    padding:24px 28px 25px !important;\n    border-radius:20px !important;\n    background:linear-gradient(90deg,rgba(8,10,13,.62) 0%,rgba(8,10,13,.42) 70%,rgba(8,10,13,.12) 100%) !important;\n    box-shadow:0 18px 46px rgba(0,0,0,.16) !important;\n    backdrop-filter:blur(1.5px);\n    -webkit-backdrop-filter:blur(1.5px);\n  }\n  .hero-copy .eyebrow{\n    font-size:.82rem !important;\n    letter-spacing:.10em !important;\n  }\n  .hero-copy h1{\n    font-size:clamp(2.35rem,3.5vw,3.85rem) !important;\n    line-height:1.03 !important;\n    margin:8px 0 13px !important;\n    max-width:420px !important;\n    text-wrap:balance;\n  }\n  .hero-copy p{\n    max-width:405px !important;\n    margin:0 !important;\n    font-size:.96rem !important;\n    line-height:1.48 !important;\n    color:#f2f2f2 !important;\n  }\n  .hero-buttons{\n    margin-top:17px !important;\n  }\n  .slide:after{\n    background:linear-gradient(90deg,rgba(0,0,0,.48) 0%,rgba(0,0,0,.20) 42%,rgba(0,0,0,.03) 68%,rgba(0,0,0,.06) 100%) !important;\n  }\n}\n</style>\n`;

  html = html.replace('</head>', `${css}</head>`);
  fs.writeFileSync(file, html, 'utf8');
  console.log('MAGIC LIGHT desktop home hero polished.');
}
