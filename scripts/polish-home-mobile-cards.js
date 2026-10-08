const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'dist', 'index.html');
if (!fs.existsSync(file)) process.exit(0);

let html = fs.readFileSync(file, 'utf8');
const marker = 'home-mobile-cards-pro-v3';

if (!html.includes(marker)) {
  const css = `
<style id="${marker}">
/* MAGIC LIGHT • Home mobile/tablet cards */
@media (max-width:900px){
  body .section{padding:30px 0 !important;}
  body .section .container{width:calc(100% - 18px) !important;}
  body .section-head{margin-bottom:14px !important;gap:5px !important;}
  body .section-head h2{font-size:1.34rem !important;line-height:1.15 !important;margin-top:2px !important;}
  body .section-head p{font-size:.78rem !important;line-height:1.4 !important;margin-top:3px !important;}
  body .section-head .see{font-size:.78rem !important;margin-top:2px !important;}

  body .grid{
    display:grid !important;
    grid-template-columns:1fr !important;
    gap:14px !important;
    align-items:stretch !important;
  }
  body .grid .card{
    min-width:0 !important;
    border-radius:16px !important;
    overflow:hidden !important;
    border:1px solid #e1e4e8 !important;
    box-shadow:0 8px 24px rgba(17,18,21,.09) !important;
    display:flex !important;
    flex-direction:column !important;
    background:#fff !important;
  }
  body .grid .card > img,
  body .grid .card > a > img,
  body .grid .card img{
    width:100% !important;
    height:250px !important;
    aspect-ratio:auto !important;
    object-fit:contain !important;
    object-position:center !important;
    background:#fafafa !important;
    padding:0 !important;
    margin:0 !important;
    border-radius:0 !important;
  }
  body .grid .card .body{
    padding:13px 14px 14px !important;
    display:flex !important;
    flex-direction:column !important;
    flex:1 1 auto !important;
    min-width:0 !important;
  }
  body .grid .card .badge{
    align-self:flex-start !important;
    max-width:100% !important;
    padding:4px 8px !important;
    font-size:.68rem !important;
    line-height:1.2 !important;
  }
  body .grid .card h3{
    font-size:1rem !important;
    line-height:1.3 !important;
    margin:8px 0 4px !important;
    min-height:0 !important;
    display:block !important;
    overflow:visible !important;
  }
  body .grid .card .ref{
    font-size:.68rem !important;
    line-height:1.3 !important;
  }
  body .grid .card p:not(.admin-price){
    display:-webkit-box !important;
    -webkit-line-clamp:2 !important;
    -webkit-box-orient:vertical !important;
    overflow:hidden !important;
    font-size:.78rem !important;
    line-height:1.45 !important;
    margin-top:6px !important;
  }
  body .grid .card .admin-price{
    margin:7px 0 0 !important;
    font-size:.92rem !important;
  }
  body .grid .card .actions{
    margin-top:11px !important;
    padding-top:0 !important;
    display:grid !important;
    grid-template-columns:1fr 1fr !important;
    gap:8px !important;
  }
  body .grid .card .smallbtn{
    width:100% !important;
    min-height:40px !important;
    padding:8px 10px !important;
    border-radius:10px !important;
    font-size:.76rem !important;
    line-height:1.1 !important;
  }
  body .grid .card .smallbtn:not(.primary){display:inline-flex !important;}
  body .admin-products-note{
    margin-bottom:12px !important;
    padding:10px 11px !important;
    font-size:.72rem !important;
    line-height:1.4 !important;
  }
}
</style>
`;
  html = html.replace('</head>', `${css}</head>`);
  fs.writeFileSync(file, html, 'utf8');
  console.log('MAGIC LIGHT Home mobile cards polished v3.');
}
