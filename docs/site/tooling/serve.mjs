// Static test server with the same base path and WASM MIME type as Pages.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const prefix=process.env.DOCS_BASE||`/docs/${process.env.DOCS_VERSION||'next'}`;
const types={'.html':'text/html','.js':'text/javascript','.wasm':'application/wasm','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.md':'text/plain','.txt':'text/plain','.zip':'application/zip'};
createServer(async(req,res)=>{
 try{
  const url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!url.startsWith(prefix+'/')){res.writeHead(404).end();return}
  let file=path.resolve(root,url.slice(prefix.length+1));
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  if((await stat(file)).isDirectory())file=path.join(file,'index.html');
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
  res.setHeader('Content-Length',(await stat(file)).size);
  if(req.method==='HEAD')res.end();else createReadStream(file).pipe(res);
 }catch{res.writeHead(404).end()}
}).listen(4387,'127.0.0.1',()=>console.log('Documentation test server on http://127.0.0.1:4387'+prefix+'/'));
