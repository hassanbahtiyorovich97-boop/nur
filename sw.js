const C='qu-v10';
const A=['./','./index.html','./app.js','./i18n.js','./content.js','./timings.json','./manifest.webmanifest'];
const CDN=['fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com','cdn.jsdelivr.net'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A.map(u=>new Request(u,{cache:'reload'})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!=='qu-audio').map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(u.host==='everyayah.com'){
    e.respondWith(caches.open('qu-audio').then(c=>c.match(u.href)).then(async m=>{
      if(!m)return fetch(e.request);
      const rg=e.request.headers.get('range');if(!rg)return m;
      const b=await m.blob(),mt=/bytes=(\d*)-(\d*)/.exec(rg)||[],st=mt[1]?+mt[1]:0,en=mt[2]?Math.min(+mt[2],b.size-1):b.size-1;
      return new Response(b.slice(st,en+1),{status:206,statusText:'Partial Content',headers:{'Content-Type':'audio/mpeg','Content-Range':`bytes ${st}-${en}/${b.size}`,'Content-Length':String(en-st+1),'Accept-Ranges':'bytes'}});
    }).catch(()=>fetch(e.request)));
    return;
  }
  if(u.origin===location.origin){
    e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{const c=r.clone();if(r.ok)caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'))));
  } else if(CDN.includes(u.host)){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{if(n.ok||n.type==='opaque'){const c=n.clone();caches.open(C).then(x=>x.put(e.request,c))}return n})));
  }
});
