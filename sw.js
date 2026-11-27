const C='qu-v33';
const A=['./','./index.html','./app.js','./i18n.js','./content.js','./content2.js','./tajweed.js','./fonts/UthmanicHafs1Ver18.woff2','./timings.json','./pidx.json','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const CDN=['fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com','cdn.jsdelivr.net','raw.githubusercontent.com'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A.map(u=>new Request(u,{cache:'reload'})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!=='qu-audio'&&x!=='qu-state'&&x!=='qu-qcf').map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
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
  if(u.host==='raw.githubusercontent.com'){e.respondWith(caches.open('qu-qcf').then(c=>c.match(e.request).then(m=>m||fetch(e.request).then(n=>{if(n.ok)c.put(e.request,n.clone());return n}))));return}
  if(u.origin===location.origin){
    e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{const c=r.clone();if(r.ok)caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'))));
  } else if(CDN.includes(u.host)){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{if(n.ok||n.type==='opaque'){const c=n.clone();caches.open(C).then(x=>x.put(e.request,c))}return n})));
  }
});

// Кунлик эслатма (Android, ўрнатилган PWA: periodic background sync)
async function quRemind(){try{const c=await caches.open('qu-state'),r=await c.match('./__state');if(!r)return;const st=await r.json(),now=new Date(),td=now.toISOString().slice(0,10);
 if(st.last===td)return;const [hh,mm]=(st.time||'20:00').split(':').map(Number);if(now.getHours()*60+now.getMinutes()<hh*60+mm)return;
 const sent=await c.match('./__sent');if(sent&&(await sent.text())===td)return;
 const days=st.last?Math.max(1,Math.round((new Date(td)-new Date(st.last))/864e5)-1):1,lv=Math.min(4,Math.max(1,st.lv||1));
 const body=(st.msg&&st.msg[lv-1]||'').replace('{n}',days);
 await self.registration.showNotification(st.title||'Nurul Qur’on',{body,icon:'icon-192.png',badge:'icon-192.png',tag:'qu-daily',renotify:true,requireInteraction:lv>=3});
 await c.put('./__sent',new Response(td))}catch(e){}}
self.addEventListener('periodicsync',e=>{if(e.tag==='qu-daily')e.waitUntil(quRemind())});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window'}).then(cs=>{for(const c of cs){if('focus' in c)return c.focus()}return self.clients.openWindow('./#darslar')}))});
