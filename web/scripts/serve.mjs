import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
// 로컬 미리보기: 배포(.vercel/output/config.json)와 같은 규칙 — 옛 /assets/ → /skills/ · 끝 / 붙이기 · 없는 주소 = 404.html
const root=path.resolve('dist'),port=Number(process.env.PORT||8766);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.gif':'image/gif','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
const redirect=(res,to)=>{res.writeHead(308,{Location:to});res.end()};
http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://local');const pathname=decodeURIComponent(url.pathname);
  if(/^\/assets\/?(?:index\.html)?$/.test(pathname))return redirect(res,'/skills/'+url.search);
  if(pathname==='/index.html')return redirect(res,'/'+url.search);
  if(/^\/(?:[^/]+\/)*[^/.]+$/.test(pathname))return redirect(res,url.pathname+'/'+url.search);
  try{let f=path.resolve(root,'.'+pathname);if(f!==root&&!f.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    if((await stat(f)).isDirectory())f=path.join(f,'index.html');const body=await readFile(f);res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(body);}
  catch{try{const body=await readFile(path.join(root,'404.html'));res.writeHead(404,{'Content-Type':mime['.html']});res.end(body)}catch{res.writeHead(404);res.end('Not found')}}
}).listen(port,'127.0.0.1',()=>console.log(`http://127.0.0.1:${port}`));
