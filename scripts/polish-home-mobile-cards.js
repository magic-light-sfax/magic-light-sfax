const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'dist', 'index.html');
if (!fs.existsSync(file)) process.exit(0);

let html = fs.readFileSync(file, 'utf8');
const marker = 'home-mobile-cards-pro-v1';

if (!html.includes(marker)) {
  const css = `
<style id="${marker}">
/* MAGIC LIGHT • professional mobile cards on Home only */
@media (max-width:620px){
  body .section{padding:34px 0 !important;}
  body .section .container{width:calc(100% - 16px) !important;}
  body .section-head{margin-bottom:14px !important;gap:5px !important;}
  body .section-head h2{font-size:1.28rem !important;line-height:1.15 !important;margin-top:2px !important;}
  body .section-head p{font-size:.76rem !important;line-height:1.35 !important;margin-top:3px !important;}
  body .section-head .see{font-size:.76rem !important;margin-top:2px !important;}

  body .grid{
    display:grid !important;
    grid-template-columns:repeat(2,minmax(0,1fr)) !important;
    gap:10px !important;
    align-items:stretch !important;
  }
  body .grid .card{
    min-width:0 !important;
    border-radius:13px !important;
    overflow:hidden !important;
    border:1px solid #e3e5e8 !important;
    box-shadow:0 5px 16px rgba(17,18,21,.07) !important;
    display:flex !important;
    flex-direction:column !important;
    background:#fff !important;
  }
  body .grid .card > img,
  body .grid .card > a > img,
  body .grid .card img{
    width:100% !important;
    height:auto !important;
    aspect-ratio:1 / 1.12 !important;
    object-fit:contain !important;
    object-position:center !important;
    background:#f7f7f7 !important;
    padding:0 !important;
    margin:0 !important;
    border-radius:0 !important;
  }
  body .grid .card .body{
    padding:9px 9px 10px !important;
    display:flex !important;
    flex-direction:column !important;
    flex:1 1 auto !important;
    min-width:0 !important;
  }
  body .grid .card .badge{
    align-self:flex-start !important;
    max-width:100% !important;
    padding:3px 7px !important;
    font-size:.60rem !important;
    line-height:1.2 !important;
    white-space:nowrap !important;
    overflow:hidden !important;
    text-overflow:ellipsis !important;
  }
  body .grid .card h3{
    font-size:.78rem !important;
    line-height:1.28 !important;
    margin:7px 0 3px !important;
    min-height:2.05em !important;
    display:-webkit-box !important;
    -webkit-line-clamp:2 !important;
    -webkit-box-orient:vertical !important;
    overflow:hidden !important;
  }
  body .grid .card .ref{
    font-size:.59rem !important;
    line-height:1.2 !important;
    overflow:hidden !important;
    text-overflow:ellipsis !important;
    white-space:nowrap !important;
  }
  body .grid .card p:not(.admin-price){display:none !important;}
  body .grid .card .admin-price{
    margin:5px 0 0 !important;
    font-size:.76rem !important;
  }
  body .grid .card .actions{
    margin-top:auto !important;
    padding-top:8px !important;
    display:grid !important;
    grid-template-columns:1fr !important;
    gap:5px !important;
  }
  body .grid .card .smallbtn{
    width:100% !important;
    min-height:34px !important;
    padding:6px 8px !important;
    border-radius:9px !important;
    font-size:.66rem !important;
    line-height:1.1 !important;
  }
  body .grid .card .smallbtn:not(.primary){display:none !important;}
  body .admin-products-note{
    margin-bottom:12px !important;
    padding:9px 10px !important;
    font-size:.68rem !important;
    line-height:1.35 !important;
  }
}
</style>
`;
  html = html.replace('</head>', `${css}</head>`);
  fs.writeFileSync(file, html, 'utf8');
  console.log('MAGIC LIGHT Home mobile cards polished.');
}
