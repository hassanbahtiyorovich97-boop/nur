const C='qu-v6';
const A=['./','./index.html','./manifest.webmanifest'];
const CDN=['fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com','cdn.jsdelivr.net'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(u.origin===location.origin){
    // Тармоқ биринчи (янгиланишлар келсин), интернет йўқ бўлса — кеш
    e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
  } else if(CDN.includes(u.host)){
    // Қуръон матни, шрифтлар ва китоб кутубхонаси — кешдан, бўлмаса тармоқдан
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{if(n.ok||n.type==='opaque'){const c=n.clone();caches.open(C).then(x=>x.put(e.request,c))}return n})));
  }
});
