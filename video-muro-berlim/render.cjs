const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const dur=+process.argv[2]||23,fps=30,out=process.argv[3]||'frames',only=process.argv[4];
fs.mkdirSync(out,{recursive:true});const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+__dirname+'/index.html');await p.waitForFunction('window.ready');
const ts=only?only.split(',').map(Number):[...Array(dur*fps).keys()].map(i=>i/fps);
for(let i=0;i<ts.length;i++){await p.evaluate(t=>seek(t),ts[i]);await p.locator('canvas').screenshot({path:`${out}/${String(i).padStart(4,'0')}.png`})}
await b.close()})();
