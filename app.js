{
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,d){try{const v=localStorage.getItem('qu_'+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem('qu_'+k,JSON.stringify(v))}catch(e){}}};
const {T,LANGS,lat}=window.I18N;
let prof=store.get('prof',{});
const lang=()=>prof.lang||'uz';
const li=()=>LANGS[lang()]||0;
const t=(k,vars)=>{const a=T[k];let s=a?a[li()]:k;if(lang()==='uzl')s=lat(s);if(vars)for(const v in vars)s=s.split('{'+v+'}').join(vars[v]);return s};
const tx=o=>{if(o==null)return'';let s=typeof o==='string'?o:(o[['uz','ru','tg'][li()]]||o.uz);return lang()==='uzl'?lat(s):s};
const pad=n=>String(n).padStart(3,'0');
const R=C.R;let Q=null,TM=null;
const rec=()=>R.find(r=>r.id===store.get('rec','husary-m'))||R[0];
const audioURL=(r,s,a)=>{const x=r&&r.f?r:R[0];return `https://everyayah.com/data/${x.f}/${pad(s)}${pad(a)}.mp3`};
const today=()=>new Date().toISOString().slice(0,10);

// ---------- Профиль, кунлик вақт, кетма-кет кунлар ----------
function saveProf(){store.set('prof',prof);applyProf()}
function applyProf(){const r=document.documentElement;r.lang=lang()==='ru'?'ru':lang()==='tg'?'tg':'uz';
 if(prof.theme==='light'||prof.theme==='dark'||prof.theme==='sepia')r.dataset.theme=prof.theme;else delete r.dataset.theme;
 r.style.setProperty('--arz',[1,1.2,1.42,1.7][prof.font||0]);document.body.classList.toggle('kids',!!prof.kids);document.title=t('app')}
const days=()=>store.get('days',{});
function addTime(sec){const d=days(),k=today();d[k]=(d[k]||0)+sec;store.set('days',d)}
function markActive(){const d=days(),k=today();if((d[k]||0)<60){d[k]=60;store.set('days',d)}}
function streak(){const d=days();let n=0,dt=new Date();if(!(d[today()]>=60))dt.setDate(dt.getDate()-1);for(;;){const k=dt.toISOString().slice(0,10);if(d[k]>=60){n++;dt.setDate(dt.getDate()-1)}else break}return n}
setInterval(()=>{if(document.visibilityState==='visible'){addTime(20);const e=$('#todayMin');if(e)e.textContent=Math.floor((days()[today()]||0)/60)}},20000);

// ---------- Аудио: умумий плеер (оятлар) ----------
const P={a:new Audio(),list:[],i:0,left:1,err:'',ov:null};P.a.preload='auto';
const pl=a=>{try{const x=a.play();x&&x.catch&&x.catch(()=>{})}catch(e){}};
const prec=()=>{const r=P.ov||rec();return r.f?r:R[0]};
const curK=()=>P.list.length?P.list[P.i].join(':'):'';
let kRAF=0;
function karaoke(){cancelAnimationFrame(kRAF);const k=curK(),tm=TM&&TM.t[k];document.querySelectorAll('.w.kw').forEach(e=>e.classList.remove('kw'));
 if(!tm||prec().id!=='husary-m'||P.a.paused)return;const ms=P.a.currentTime*1000,seg=tm.find(g=>ms>=g[1]&&ms<g[2]);
 if(seg){const e=document.querySelector(`[data-a="${k}"] .w[data-w="${seg[0]}"]`);if(e)e.classList.add('kw')}kRAF=requestAnimationFrame(karaoke)}
function bar(){const p=$('#pl');if(!P.list.length){p.classList.add('hidden');return}p.classList.remove('hidden');const [s,a]=P.list[P.i],x=prec();
 $('#plt').textContent=P.err||`${s}:${a}${Q?' · '+Q[s-1].tr:''} — ${x.n.split(' (')[0]}${P.left>1?' · '+t('again')+' '+(P.left-1):''}`;$('#pplay').textContent=P.a.paused?'▶':'⏸';
 $('#prep').value=String(store.get('rep',1));$('#prate').value=String(store.get('rate',1));
 document.querySelectorAll('[data-a]').forEach(e=>e.classList.toggle('now',e.dataset.a===curK()))}
function startCur(){stopSeg();const [s,a]=P.list[P.i];P.err='';P.a.src=audioURL(prec(),s,a);P.a.playbackRate=+store.get('rate',1);pl(P.a);bar();
 const el=document.querySelector(`[data-a="${s}:${a}"]`);if(el&&el.scrollIntoView&&P.list.length>1)el.scrollIntoView({block:'center',behavior:'smooth'})}
function playList(list,i){P.ov=null;P.list=list;P.i=i||0;P.left=+store.get('rep',1);startCur()}
P.a.addEventListener('ended',()=>{if(--P.left>0){P.a.currentTime=0;pl(P.a);bar();return}if(P.i<P.list.length-1){P.i++;P.left=+store.get('rep',1);startCur()}else bar()});
P.a.addEventListener('play',()=>{bar();karaoke();markActive()});P.a.addEventListener('pause',()=>{bar();karaoke()});
P.a.addEventListener('error',()=>{if(!P.list.length)return;P.err=t('audio_fail');bar()});

// ---------- Аудио: сўз/қисм (Ҳусорий муаллим вақтлари бўйича) ----------
const S=new Audio();S.preload='auto';let sRAF=0,sEnd=0,sOnEnd=null,sOnTick=null,sPend=null;
function stopSeg(){cancelAnimationFrame(sRAF);if(!S.paused)S.pause();const f=sOnEnd;sOnEnd=null;sOnTick=null;f&&f()}
function playSeg(s,a,st,en,onTick,onEnd){P.a.pause();stopSeg();const url=audioURL(R[0],s,a);sEnd=en;sOnEnd=onEnd;sOnTick=onTick;
 const go=()=>{S.currentTime=st/1000};S.muted=true;
 if(S.src!==url){S.src=url;sPend=go;cacheAudio(url)}else go();
 pl(S);markActive()}
S.addEventListener('loadedmetadata',()=>{if(sPend){const f=sPend;sPend=null;f()}});
S.addEventListener('seeked',()=>{S.muted=false;cancelAnimationFrame(sRAF);const tick=()=>{const ms=S.currentTime*1000;sOnTick&&sOnTick(ms);if(ms>=sEnd||S.paused||S.ended){S.pause();const f=sOnEnd;sOnEnd=null;sOnTick=null;f&&f();return}sRAF=requestAnimationFrame(tick)};sRAF=requestAnimationFrame(tick)});
S.addEventListener('error',()=>{const c=$('#stgCap');if(c)c.textContent=t('audio_fail')});
const seg=(s,a,w)=>{const tm=TM&&TM.t[s+':'+a];return tm?tm.filter(g=>w.includes(g[0])):[]};
function playWords(s,a,w,onTick,onEnd){const g=seg(s,a,w);if(!g.length)return false;playSeg(s,a,Math.max(0,g[0][1]-60),g[g.length-1][2]+120,onTick,onEnd);return g}
function playAyahK(s,a){const tm=TM&&TM.t[s+':'+a];if(!tm)return false;const box=document.querySelector(`.ex[data-ref="${s}:${a}"]`);
 playSeg(s,a,0,tm[tm.length-1][2]+300,ms=>{const g=tm.find(x=>ms>=x[1]&&ms<x[2]);if(box)box.querySelectorAll('.w').forEach(e=>e.classList.toggle('kw',!!g&&+e.dataset.w===g[0]))},()=>{if(box)box.querySelectorAll('.w.kw').forEach(e=>e.classList.remove('kw'))});return true}

// ---------- Бош кесими схемаси ва анимация ----------
const PTS={jawf:[118,150],throat1:[187,150],throat2:[190,180],throat3:[192,210],tongueRoot:[166,132],tongueRoot2:[152,127],tongueMid:[128,124],tongueSide:[108,136],tongueTip:[86,128],tongueTip2:[76,127],tongueTip3:[70,146],tongueTip4:[64,136],lip1:[52,141],lips:[46,146],nose:[110,104]};
const ZN=[['khay','الخيشوم',36,50,110,104],['shaf','الشفتان',34,206,48,146],['lis','اللسان',130,58,120,124],['halq','الحلق',266,116,190,170],['jawf','الجوف',262,244,150,160]];
function headSVG(id){const u=id||'head';return `<svg class="head h2" id="${u}" viewBox="0 6 300 258" role="img" aria-label="${t('scheme')}">
<defs>
<linearGradient id="${u}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f2a4a"/><stop offset="1" stop-color="#173f3a"/></linearGradient>
<linearGradient id="${u}sk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde9d6"/><stop offset=".6" stop-color="#f2cfae"/><stop offset="1" stop-color="#d9a982"/></linearGradient>
<radialGradient id="${u}cv" cx=".4" cy=".4" r=".8"><stop offset="0" stop-color="#ffd6dc"/><stop offset="1" stop-color="#c9606f"/></radialGradient>
<linearGradient id="${u}tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f08a98"/><stop offset="1" stop-color="#b94459"/></linearGradient>
<filter id="${u}gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<pattern id="${u}st" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M13 3l2.6 7.4L23 13l-7.4 2.6L13 23l-2.6-7.4L3 13l7.4-2.6z" fill="none" stroke="#d4af37" stroke-opacity=".13" stroke-width=".8"/></pattern>
</defs>
<rect x="0" y="6" width="300" height="258" rx="18" fill="url(#${u}bg)"/><rect x="0" y="6" width="300" height="258" rx="18" fill="url(#${u}st)"/>
<g class="sparks">${[[40,30],[70,22],[262,40],[236,24],[30,230],[268,200],[150,18]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i%2?1:1.5}" fill="#fff" style="animation-delay:${i*.4}s"/>`).join('')}</g>
<path class="skin" fill="url(#${u}sk)" d="M78 26 C120 4 220 10 250 60 C272 100 262 150 236 176 L232 250 L118 250 L116 222 C96 214 74 204 68 190 C60 176 66 168 60 160 L50 158 C44 156 44 150 50 148 L48 142 C42 140 42 134 48 132 L54 128 C48 124 44 120 40 112 C34 104 40 98 50 96 C56 92 60 84 62 74 C64 50 66 36 78 26Z"/>
<path d="M88 30 C130 14 206 22 236 62" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>
<path class="cav zs zs-khay" id="noseCav" fill="url(#${u}cv)" d="M60 100 C80 92 130 92 160 98 C176 102 182 110 182 118 C160 112 120 110 64 112Z"/>
<path class="cav zs zs-lis zs-jawf" id="mouthCav" fill="url(#${u}cv)" d="M62 128 C90 118 150 114 178 128 C186 150 186 178 196 200 L184 200 C176 176 168 156 150 150 C120 144 90 150 66 150Z"/>
<path class="cav zs zs-halq zs-jawf" id="throat" fill="url(#${u}cv)" d="M178 128 C190 160 194 200 196 250 L214 250 C212 200 206 160 194 120Z"/>
<path class="air" d="M205 250 C202 200 196 160 184 134 C150 120 100 124 56 140"/>
<path class="air nas" d="M184 134 C176 112 140 104 60 104"/>
<path class="tongue" id="tongue" fill="url(#${u}tg)" d="M66 148 C76 134 104 128 132 128 C156 128 170 136 176 156 C180 172 184 186 190 200 L172 206 C166 186 156 168 140 160 C110 152 86 154 66 152Z"/>
<path d="M80 140 C100 134 130 133 152 138" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>
<path class="tooth" d="M59 126 h10 v6 q-5 3 -10 0z"/><path class="tooth" d="M59 153 h10 v-6 q-5 -3 -10 0z"/>
<path class="lip zs zs-shaf" id="lipU" d="M46 134 C52 130 58 130 60 134 L58 140 C54 141 48 140 46 138Z"/>
<path class="lip zs zs-shaf" id="lipL" d="M46 152 C52 156 58 156 60 152 L58 146 C54 145 48 146 46 148Z"/>
<circle class="glow" id="noseGlow" cx="110" cy="104" r="30" filter="url(#${u}gl)"/>
${ZN.map(([z,ar,lx,ly,px,py])=>`<g class="zl zl-${z}"><path d="M${lx} ${ly+(ly<px?4:-4)} Q${(lx+px)/2} ${(ly+py)/2-10} ${px} ${py}" class="lead"/><rect x="${lx-26}" y="${ly-10}" width="52" height="18" rx="9"/><text x="${lx}" y="${ly+3.5}" text-anchor="middle">${ar}</text></g>`).join('')}
${Object.entries(PTS).map(([k,[x,y]])=>`<g class="pt" data-p="${k}"><circle cx="${x}" cy="${y}" r="9" class="wave"/><circle cx="${x}" cy="${y}" r="9" class="wave w2"/><circle cx="${x}" cy="${y}" r="8" class="ring"/><circle cx="${x}" cy="${y}" r="4" class="dot"/></g>`).join('')}
<g class="stop" transform="translate(222,34)"><polygon points="-14,-34 14,-34 34,-14 34,14 14,34 -14,34 -34,14 -34,-14"/><text y="6" text-anchor="middle">STOP</text></g>
</svg>`}
function stageHTML(){return `<div class="card stage" id="stage"><div class="row" style="justify-content:space-between"><b>${t('stage_title')}</b><span class="small">${t('scheme')}</span></div>
<div class="stg-body">${headSVG()}<div class="stg-side"><div class="stg-big ar" id="stgBig"></div><div class="small" id="stgCap">${t('stage_hint')}</div><div class="meter hidden" id="meter"><b></b></div><div class="small" id="meterLbl"></div></div></div></div>`}
const KIND_PTS={izhar:['throat2'],idgham:['nose'],iqlab:['lips','nose'],ikhfa:['nose'],shafawi:['lips'],ghunna:['nose'],madd2:['jawf'],madd4:['jawf'],madd6:['jawf'],qalqala:['tongueRoot'],tafkhim:['tongueRoot'],waqf:[]};
const KIND_N={madd2:2,madd4:4,madd6:6,ghunna:2,ikhfa:2,iqlab:2,idgham:2};
function animate(kind,ms,big,cap){const st=$('#stage');if(!st)return;st.className='card stage on k-'+kind;
 st.querySelectorAll('.pt').forEach(p=>p.classList.toggle('hot',(KIND_PTS[kind]||[]).includes(p.dataset.p)));
 $('#stgBig').textContent=big||'';$('#stgCap').innerHTML=cap||'';const n=KIND_N[kind],m=$('#meter'),lbl=$('#meterLbl');
 if(n){m.classList.remove('hidden');m.innerHTML='<b></b>'+Array.from({length:n-1},(_,i)=>`<i style="left:${(i+1)/n*100}%"></i>`).join('');const b=m.querySelector('b');b.style.transition='none';b.style.width='0';void b.offsetWidth;b.style.transition=`width ${ms}ms linear`;b.style.width='100%';lbl.textContent=`≈ ${n}${kind==='madd4'?'–5':''} ${t('harakat')}`}
 else{m.classList.add('hidden');lbl.textContent=''}
 clearTimeout(animate.t);animate.t=setTimeout(()=>st.classList.remove('on'),ms+400)}
function stagePoints(pts){const st=$('#stage')||document;st.querySelectorAll('.pt').forEach(p=>p.classList.toggle('hot',pts.includes(p.dataset.p)))}

// ---------- Матн ёрдамчилари ----------
function ayahHTML(ref,hl){const [s,a]=ref.split(':').map(Number);if(!Q)return `<p class="small">${t('loading')}</p>`;const w=Q[s-1].v[a-1].split(' ');
 return `<div class="ar">${w.map((x,i)=>`<span class="w${hl&&hl.includes(i)?' hl':''}" data-w="${i}" data-s="${s}" data-a2="${a}">${esc(x)}</span>`).join(' ')} <span class="mark">${a}</span></div>`}
const sname=s=>Q?Q[s-1].tr:'';
const listen=(s,a,chk)=>{const x=prec();return `<button class="btn p" data-play="${s}:${a}">▶ ${esc(x.n.split(' (')[0])}</button><button class="btn" data-cmp="${s}:${a}">🎧 ${t('cmp_b')}</button>${chk?`<button class="btn" data-recref="${s}:${a}">${t('check_me')}</button>`:''}`};
function stars(el){if(!document.body.classList.contains('kids')||!el)return;const r=el.getBoundingClientRect();for(let i=0;i<6;i++){const s=document.createElement('span');s.className='star';s.textContent='⭐';s.style.left=(r.left+r.width/2)+'px';s.style.top=(r.top+window.scrollY)+'px';s.style.setProperty('--dx',(Math.random()*160-80)+'px');s.style.setProperty('--dy',(-60-Math.random()*90)+'px');document.body.appendChild(s);setTimeout(()=>s.remove(),900)}}

// ---------- Навигация ----------
const ico={bosh:'<path d="M3 11l9-7 9 7v9H3z"/><path d="M9 20v-6h6v6"/>',darslar:'<path d="M4 5h7a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H4zM20 5h-5a3 3 0 0 0-3 3"/>',mushaf:'<path d="M5 4h11l3 3v13H5z"/><path d="M9 10h6M9 14h6"/>',mahraj:'<path d="M7 9a5 5 0 0 1 10 0v3a5 5 0 0 1-10 0z"/><path d="M12 17v3"/>',kitob:'<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',tekshiruv:'<path d="M3 12h3l2-6 4 12 3-9 2 3h4"/>',qoidalar:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h1M4 12h1M4 18h1"/>'};
const TABS=[['bosh','tab_home'],['darslar','tab_lessons'],['qoidalar','tab_rules'],['mushaf','tab_mushaf'],['mahraj','tab_makhraj'],['kitob','tab_book'],['tekshiruv','tab_check']];
function navi(cur){$('#nav').innerHTML=TABS.map(([h,k])=>`<a href="#${h}" class="${cur===h?'on':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ico[h]}</svg>${t(k)}</a>`).join('');
 $('#hdr').innerHTML=`<div><h1>${/^#?(bosh)?$/.test(location.hash)?t('salam')+(prof.name?', '+esc(prof.name):''):t('app')}</h1><div class="sub">${esc(hdrDate())}</div></div><div class="row"><a class="hb" href="#ustozlar" aria-label="${t('reciters')}">🎙</a><a class="hb" href="#sozlama" aria-label="${t('settings')}">⚙</a></div>`}

// ---------- Курслар ----------
const done=()=>store.get('done',{}),doneA=()=>store.get('adone',{}),memo=()=>store.get('memo',{}),certs=()=>store.get('certs',{});
const AL=[...C.GR.map(g=>({t:{uz:'Ҳарфлар: '+g,ru:'Буквы: '+g,tg:'Ҳарфҳо: '+g},g:g.split(' ')})),...C.HB];
const LF=c=>C.LT.find(x=>x[0]===c);

function vBosh(){const g=store.get('gift',null),nl=nextLesson(),st=streak(),mins=Math.floor((days()[today()]||0)/60),goal=prof.goal||10,pc=Math.min(100,Math.round(mins/goal*100));
 const a=Object.keys(doneA()).length,d=Object.keys(done()).length,ms=Object.keys(store.get('bkdone',{})).length,MSN=bkBuild()?BK.length:60,m=Object.keys(memo()).length,cs=certs();
 const bar_=(n,tot)=>`<div class="pbar"><b style="width:${Math.round(n/tot*100)}%"></b></div>`;
 return `${homeTop()}
 ${coachCard()}${pathCard()}
 ${g&&g.from?`<div class="card gift"><div class="gift-ic">🎁</div><div><b>${esc(t('gift_from',{from:g.from}))}</b><div class="small">${t('dua')}</div></div></div>`:''}
 <div class="grid3"><div class="card kpi"><div class="kv">🔥 ${st}</div><div class="small">${t('streak')}</div></div>
 <div class="card kpi"><div class="kv"><span id="todayMin">${mins}</span>/${goal} ${t('min')}</div><div class="pbar"><b style="width:${pc}%"></b></div><div class="small">${t('today')}</div></div>
 <div class="card kpi"><div class="kv">${m}</div><div class="small">${t('memorized_n')}</div></div></div>
 <div class="card"><b>${t('progress')}</b>
 <div class="prow"><span>${t('course_alif')}</span><span>${a}/${AL.length}</span></div>${bar_(a,AL.length)}
 <div class="prow"><span>${t('course_tajwid')}</span><span>${d}/${C.L.length}</span></div>${bar_(d,C.L.length)}
 <div class="prow"><span>${t('book_title')}</span><span>${ms}/${MSN}</span></div>${bar_(ms,MSN)}
 <div class="prow"><span><a href="#qoidalar">${t('gl_title')}</a></span><span>${Object.keys(glk()).length}/${GLA.length}</span></div>${bar_(Object.keys(glk()).length,GLA.length)}
 ${Object.keys(cs).length?`<div class="links">${Object.keys(cs).map(k=>`<a class="btn" href="#sertifikat-${k}">🏅 ${t('certificate')}: ${t(k==='alif'?'course_alif':'course_tajwid')}</a>`).join('')}</div>`:''}</div>`}

function pathCard(){const c=curStep(),L=PATH.filter(stepReq),n=L.filter(stepDone).length,due=srsDue().length,bkOK=lvl()>=1||doneA()[8];
 return `<div class="card plan pathc"><div class="row" style="justify-content:space-between"><b>🧭 ${t('pt_way')}</b><span class="small">${n}/${L.length}</span></div><div class="pbar"><b style="width:${Math.round(n/L.length*100)}%"></b></div>
 ${c?`<div class="small" style="margin-top:8px">${c.k==='r'?t('sx_ret_why'):t(c.s===1?'st1':'st2')+' · '+t('pt_step',{n:pathNo(c.h)})}</div><a class="btn p lg" href="#${c.h}">▶ ${esc(stepTitle(c))}</a>`:`<p>🌟 ${t('pt_all')}</p><a class="btn p lg" href="#hifz">🧠 ${t('hf2_title')}</a>`}
 ${due?`<a class="btn lg tkbtn" href="#takror">🔁 ${t('tk_due',{n:due})}</a>`:''}
 ${bkOK?`<a class="btn lg" href="#kitob-ms">📗 ${t('book_title')} · ${store.get('bkpg',1)}/${BK?BK.length:'…'}</a>`:''}
 <a class="small" href="#darslar">🗺 ${t('pt_map')}</a></div>`}
function vDarslar(){const c=curStep(),cs=certs(),srsN=Object.keys(srsSync()).length;
 const step=(p,no)=>{const ok=stepDone(p),open=stepOpen(p.h),cur=c&&c.h===p.h,opt=!stepReq(p);const ic=p.k==='xa'||p.k==='xt'?'🏅':p.k==='m'?'👄':'';
  return `<a class="pstep${ok?' ok':''}${cur?' cur':''}${!open?' lk':''}${opt?' opt':''}" href="#${p.h}"><span class="pn">${ok?'✓':!open?'🔒':no}</span><span class="pstx"><b>${ic?ic+' ':''}${esc(stepTitle(p))}</b>${p.k==='d'?`<span class="small">${esc(tx(C.L[p.i].k))}</span>`:p.k==='a'?`<span class="small">${AL[p.i].g?t('letters'):t('reading_rule')}</span>`:''}${cur?`<span class="pshere">${t('pt_here')}</span>`:''}</span></a>`};
 let no=0;const st=sx=>PATH.filter(p=>p.s===sx).map(p=>step(p,stepReq(p)?++no:'·')).join('');
 return `<h2>🗺 ${t('pt_map')}</h2><div class="note">${t('pt_intro')}</div>
 ${c?`<a class="btn p lg" style="width:100%;margin:6px 0 14px" href="#${c.h}">▶ ${t('pt_cont')}: ${esc(stepTitle(c))}</a>`:''}
 <div class="pstage"><h3>1. ${t('st1')}</h3><p class="small">${t('st1_d')}</p>${lvl()>=1?`<div class="small optn">${t('st1_opt')}</div>`:''}<div class="ppath">${st(1)}</div></div>
 <div class="pstage"><h3>2. ${t('st2')}</h3><p class="small">${t('st2_d')}</p><div class="ppath">${st(2)}</div></div>
 <div class="pstage"><h3>🔁 ${t('tk_title')}</h3><p class="small">${t('tk_note')}</p><a class="btn" href="#takror">${t('tk_open',{n:srsN})}</a></div>
 <div class="pstage"><h3>3. ${t('st3')}</h3><p class="small">${t('st3_d')}</p><div class="links"><a class="btn" href="#kitob-ms">📗 ${t('book_title')}</a><a class="btn" href="#mushaf">📖 ${t('tab_mushaf')}</a><a class="btn" href="#hifz">🧠 ${t('hf2_title')}</a>${cs.alif?`<a class="btn" href="#sertifikat-alif">🏅 ${t('course_alif')}</a>`:''}${cs.tajwid?`<a class="btn" href="#sertifikat-tajwid">🏅 ${t('course_tajwid')}</a>`:''}</div></div>`}

function quizHTML(qs){return qs.map((q,qi)=>`<div class="card" data-q="${qi}"><b>${esc(tx(q[0]))}</b>${q[1].map((o,oi)=>`<button class="btn opt" data-qi="${qi}" data-oi="${oi}">${esc(tx(o))}</button>`).join('')}<div class="small qres"></div></div>`).join('')}

function vDars(i){const l=C.L[i];if(!l)return vDarslar();const d=done();
 return `<p><a href="#darslar">${t('all_lessons')}</a></p><h2>${i+1}. ${esc(tx(l.t))}</h2><div class="small">${esc(tx(l.k))}</div>
 <div class="card"><div class="letters">${esc(l.lt)}</div><p>${tx(l.r)}</p></div>
 ${stageHTML()}
 <h3>${t('examples')}</h3><p class="small">${t('tap_word')}</p>
 ${l.ex.map(([ref,hl,n],ei)=>{const [s,a]=ref.split(':');return `<div class="card ex" data-ref="${ref}"><div class="ref">${ref} · ${esc(sname(+s))}</div>${ayahHTML(ref,hl)}<div>${esc(tx(n))}</div>
 <div class="links"><button class="btn p" data-rule="${i}:${ei}">${t('play_rule')}</button><button class="btn" data-ayk="${ref}">${t('play_ayah')}</button>${rec().id!=='husary-m'?listen(+s,+a):`<button class="btn" data-cmp="${ref}">🎧 ${t('cmp_b')}</button>`}<button class="btn" data-recref="${ref}">${t('check_me')}</button></div></div>`}).join('')}
 <h3>${t('test')}</h3>${quizHTML(l.q)}
 <h3>${t('homework')}</h3><div class="note">${esc(tx(l.hw))}</div>
 <div class="row" style="margin-top:14px">${examBtn('dars-'+(i+1))}${nextBtn('dars-'+(i+1))}</div>`}

function vAlif(i){const l=AL[i];if(!l)return vDarslar();const d=doneA(),F=t('forms').split('|');let h=`<p><a href="#darslar">${t('all_lessons')}</a></p><h2>${i+1}. ${esc(tx(l.t))}</h2><p class="small">${t('phone_voice')}</p>`;
 if(l.g){h+=stageHTML()+l.g.map(c=>{const x=LF(c),j=x[4],fm=j?[c,c+'‍','‍'+c+'‍','‍'+c]:[c,'—','—','‍'+c],mq=C.MQ[c],lw=TM&&TM.lw[c];
  return `<div class="card"><div class="big">${c}</div><div style="text-align:center"><b style="font-size:20px">${esc(tx(x[2]))}</b> <span class="ar" style="font-size:22px;line-height:1">${x[1]}</span></div><p>${esc(tx(x[3]))}</p>
  <div class="forms">${F.map((nm,k)=>`<div><div class="g">${esc(fm[k])}</div><span class="small">${nm}</span></div>`).join('')}</div>${j?'':`<p class="small">${t('no_join')}</p>`}
  <div class="links">${lw?`<button class="btn p" data-lw="${c}">▶ ${t('teacher')}: ${esc(Q?Q[lw[0]-1].v[lw[1]-1].split(' ')[lw[2]]:'')}</button>`:''}${mq?`<button class="btn" data-play="${mq}">▶ ${t('in_quran')} (${mq})</button>`:''}<button class="btn" data-say="${x[1]}">🔊 ${t('its_name')}</button><button class="btn" data-say="${c}َ ${c}ِ ${c}ُ">🔊 ${c}َ ${c}ِ ${c}ُ</button></div></div>`}).join('');
  const qs=l.g.map(c=>{const o=[c,...C.LT.map(x=>x[0]).filter(x=>x!==c).sort(()=>Math.random()-.5).slice(0,3)].sort(()=>Math.random()-.5);return [c,o]});
  h+=`<h3>${t('test')}</h3>${qs.map(([c,o])=>`<div class="card"><b>${esc(t('find_letter',{x:tx(LF(c)[2])}))}</b><div class="syl" style="margin-top:6px">${o.map(x=>`<button class="btn aq" data-ans="${x===c?1:0}">${x}</button>`).join('')}</div><div class="small qres"></div></div>`).join('')}`}
 else{h+=`<div class="card"><p>${tx(l.r)}</p></div>`;
  if(l.syl)h+=`<p class="small">${t('spelling_note')}</p><div class="card"><div class="syl">${[...l.syl].flatMap(c=>l.h.map((m,k)=>`<button class="btn" data-say="${c+m}">${c+m}<small>${esc(tx((C.CT[c]||'')+l.ht[k]))}</small></button>`)).join('')}</div></div>`;
  h+=`<h3>${t('words')}</h3>${l.w.map(([a,b,c])=>`<div class="card"><div class="row" style="justify-content:space-between"><span class="big" style="font-size:calc(52px*var(--arz))">${a}</span><button class="btn" data-say="${a}">🔊</button></div><div><b>${esc(tx(c))}</b>${b?` · <span class="small">${esc(b)}</span>`:''}</div></div>`).join('')}`}
 h+=`<div class="row" style="margin-top:14px">${examBtn('alif-'+(i+1))}${nextBtn('alif-'+(i+1))}</div>`;return h}

// ---------- Мусҳаф ----------
function vMushaf(){const s=store.get('sura',1),hide=store.get('hide',false),m=memo(),cnt=store.get('cnt',{});if(!Q)return `<p class="small">${t('loading')}</p>`;const S_=Q[s-1];
 return `<h2>${t('mushaf_title')}</h2><div class="row"><select id="sura" aria-label="${t('tab_mushaf')}">${Q.map(x=>`<option value="${x.n}"${x.n===s?' selected':''}>${x.n}. ${esc(x.tr)} — ${esc(x.ar)}</option>`).join('')}</select>
 <button class="btn p" data-playsura="${s}">${t('play_sura')}</button><label class="row"><input type="checkbox" id="hide"${hide?' checked':''} style="width:22px;height:22px"> ${t('hide_mode')}</label></div>
 <p class="small">${t('mushaf_note')} ${t('karaoke')} ${t('tap_word')}</p>${trBar()}
 <div class="${hide?'hide':''}">${S_.v.map((tt,i)=>{const k=s+':'+(i+1),c=cnt[k]||0;return `<div class="ayah" data-a="${k}"><div class="ar" data-k="${k}">${tt.split(' ').map((w,wi)=>`<span class="w" data-w="${wi}" data-s="${s}" data-a2="${i+1}">${esc(w)}</span>`).join(' ')} <span class="mark">${i+1}</span></div>${trOn()&&!hide?`<div class="trn" data-tr="${i+1}"></div>`:''}<div class="links">${listen(s,i+1,1)}<button class="btn" data-c="${k}">+1 · ${c}/10</button><button class="btn${m[k]?' p':''}" data-m="${k}">${m[k]?'✓ ':''}${t('memorized')}</button></div></div>`}).join('')}</div>${trOn()&&!hide?trCredit():''}`}

// ---------- Устозлар ----------
function vUstozlar(){const cur=rec().id,f=store.get('rcf','all'),L=R.filter(r=>f==='all'||r.sp===f);
 return `<h2>${t('reciters')}</h2><div class="note">${t('rec_note')}</div><p class="small">${t('rc_count',{n:R.filter(r=>r.f).length})}</p>
 <div class="seg rcf">${['all','slow','mid','fast','mujawwad'].map(x=>`<button class="${f===x?'on':''}" data-rcf="${x}">${x==='all'?t('rc_all'):t('sp_'+x)} <small>${x==='all'?R.length:R.filter(r=>r.sp===x).length}</small></button>`).join('')}</div>
 <div class="grid">${L.map(r=>`<div class="card"><b>${esc(r.n)}</b>${r.x?` <span class="tag new">${t('rc_new')}</span>`:''}<div><span class="tag">${esc(tx(r.c))}</span><span class="tag">${t('sp_'+r.sp)}</span></div><p class="small">${esc(tx(r.why))}</p><p><b>${t('when')}:</b> ${esc(tx(r.use))}</p>
 <div class="links">${r.f?`<button class="btn${cur===r.id?' p':''}" data-r="${r.id}">${cur===r.id?t('chosen'):t('choose')}</button><button class="btn" data-sample="${r.id}">${t('sample')}</button>`:`<span class="small">${t('no_audio')}</span>`}${r.q?`<a class="btn" href="https://www.youtube.com/results?search_query=${encodeURIComponent(r.q)}" target="_blank" rel="noopener">${t('videos')}</a>`:''}</div></div>`).join('')}</div>`}
function cmpSheet(k){const [s,a]=k.split(':').map(Number),cur=rec().id,G=['slow','mid','mujawwad','fast'];
 sheet(`<h3 style="margin-top:0">🎧 ${t('cmp_t')}</h3><p class="small">${esc(sname(s))} ${k} — ${t('cmp_d')}</p>${G.map(g=>{const L=R.filter(r=>r.f&&r.sp===g);return L.length?`<div class="small" style="margin:10px 0 4px"><b>${t('sp_'+g)}</b></div><div class="cmpl">${L.map(r=>`<div class="cmpr${cur===r.id?' on':''}"><button class="btn sm p" data-playr="${k}|${r.id}" aria-label="play">▶</button><span>${esc(r.n)}<small> · ${esc(tx(r.c))}</small></span><button class="btn sm" data-r="${r.id}">${cur===r.id?'✓':t('choose')}</button></div>`).join('')}</div>`:''}).join('')}`,'cmp')}

// ---------- Махраж ----------
function vMahraj(){return `<h2>${t('mk_title')}</h2><div class="note">${t('mk_note')}</div>
 <div class="mkwrap"><div class="card stage" id="stage">${headSVG()}<div class="stg-big ar" id="stgBig"></div><div class="small" id="stgCap"></div></div>
 <div>${C.MK.map(([g,rows])=>`<div class="card"><b>${esc(tx(g))}</b>${rows.map(([a,p,d])=>`<button class="mk" data-mk="${p}" data-letters="${a}"><span class="ar">${esc(a)}</span><span>${esc(tx(d))}</span></button>`).join('')}</div>`).join('')}</div></div>
 <h3>${t('pairs')}</h3><div class="card"><div class="letters">ث–س–ص · ذ–ز–ظ · ت–ط · ح–ه · ع–ء · ق–ك · د–ض</div></div>
 ${stepOpen('mahraj')?`<div class="row" style="margin-top:14px">${examBtn('mahraj')}${nextBtn('mahraj')}</div>`:''}`}

// ---------- Имтиҳон ----------
let EX=null;const shuffle=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
function alifQ(n){const qs=[],LT=C.LT.filter(x=>x[0]!=='ء');for(let k=0;k<n;k++){const x=LT[Math.floor(Math.random()*LT.length)],ty=k%4,others=shuffle(LT.filter(y=>y[0]!==x[0])).slice(0,3);
 if(ty===0)qs.push({q:t('find_letter',{x:tx(x[2])}),o:shuffle([x,...others]).map(y=>y[0]),a:x[0],ar:1});
 else if(ty===1)qs.push({q:t('name_of'),big:x[0],o:shuffle([x,...others]).map(y=>tx(y[2])),a:tx(x[2])});
 else if(ty===2&&TM&&TM.lw[x[0]]&&x[0]!=='ا')qs.push({q:t('listen_letter'),lw:x[0],o:shuffle([x,...others]).map(y=>y[0]),a:x[0],ar:1});
 else{const hs=['َ','ِ','ُ'],ht=['а','и','у'],hi=Math.floor(Math.random()*3),c=C.CT[x[0]]?x[0]:'ب',base=C.CT[c];qs.push({q:t('read_syl'),big:c+hs[hi],o:shuffle([0,1,2].map(j=>tx(base+ht[j]))),a:tx(base+ht[hi])})}}return qs}
function tajQ(n,only){const pool=[],lis=[];C.L.forEach((l,i)=>{if(only&&!only[i])return;l.q.forEach(q=>pool.push({q:tx(q[0]),o:q[1].map(tx),a:tx(q[1][q[2]])}));
 if(l.anim!=='waqf')l.ex.forEach(([ref,hl,,c])=>{if(!c)lis.push({li:i,ref,hl})})});
 const titles=[...new Set(C.L.map(l=>tx(l.t)))];const out=shuffle(pool).slice(0,Math.max(1,n-Math.floor(n/3)));
 shuffle(lis).slice(0,Math.floor(n/3)).forEach(x=>{const c=tx(C.L[x.li].t);out.push({q:t('listen_q'),rule:x,o:shuffle([c,...shuffle(titles.filter(y=>y!==c)).slice(0,3)]),a:c})});return shuffle(out).slice(0,n)}
function startExam(kind){let qs;if(kind==='alif')qs=alifQ(20);else if(kind==='tajwid')qs=tajQ(20);else{const d=done();qs=Object.keys(d).length?tajQ(5,d):alifQ(5)}EX={kind,qs,i:0,score:0,ans:false}}
function vExam(kind){if(!EX||EX.kind!==kind)startExam(kind);const q=EX.qs[EX.i],ttl=kind==='alif'?t('exam_alif'):kind==='tajwid'?t('exam_tajwid'):t('review');
 if(!q)return vExamEnd();
 return `<p><a href="#darslar">${t('back')}</a></p><h2>${ttl}</h2><div class="prow"><span>${t('question')} ${EX.i+1} ${t('of')} ${EX.qs.length}</span><span>✓ ${EX.score}</span></div><div class="pbar"><b style="width:${EX.i/EX.qs.length*100}%"></b></div>
 <div class="card exq"><b>${esc(q.q)}</b>${q.big?`<div class="big">${esc(q.big)}</div>`:''}${q.lw||q.rule?`<div class="links"><button class="btn p lg" id="exPlay">${t('play')}</button></div>`:''}
 <div class="${q.ar?'syl':''}">${q.o.map(o=>`<button class="btn opt exo${q.ar?' ar':''}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div><div class="small qres"></div>
 <div class="row" style="margin-top:10px"><button class="btn p hidden" id="exNext">${EX.i<EX.qs.length-1?t('next'):t('finish')}</button></div></div>`}
function vExamEnd(){const pct=Math.round(EX.score/EX.qs.length*100),pass=pct>=SP().p,k=EX.kind;
 if(pass&&k!=='review'){const c=certs();if(!c[k]||c[k].score<pct){c[k]={score:pct,date:today()};store.set('certs',c)}}
 return `<h2>${t('result')}: ${pct}%</h2><div class="card"><p><b>${pass?t('passed'):t('failed')}</b></p><div class="pbar"><b style="width:${pct}%"></b></div>
 <div class="links">${pass&&k!=='review'?`<a class="btn p" href="#sertifikat-${k}">🏅 ${t('certificate')}</a>`:''}<button class="btn" id="exRetry">${t('retry')}</button><a class="btn" href="#bosh">${t('tab_home')}</a></div></div>`}

// ---------- Сертификат ----------
function drawCert(cv,k){const c=certs()[k];if(!c)return;const g=cv.getContext('2d'),W=1200,H=850;cv.width=W;cv.height=H;
 g.fillStyle='#fffdf7';g.fillRect(0,0,W,H);g.strokeStyle='#1f3a93';g.lineWidth=26;g.strokeRect(13,13,W-26,H-26);g.strokeStyle='#b08a2e';g.lineWidth=3;g.strokeRect(44,44,W-88,H-88);
 const star=(x,y,r)=>{g.save();g.translate(x,y);g.strokeStyle='#b08a2e';g.lineWidth=2.5;for(const rot of [0,Math.PI/4]){g.beginPath();for(let i=0;i<4;i++){const a=rot+i*Math.PI/2+Math.PI/4;g[i?'lineTo':'moveTo'](r*Math.cos(a),r*Math.sin(a))}g.closePath();g.stroke()}g.beginPath();g.arc(0,0,r*.35,0,7);g.strokeStyle='#0b8f8a';g.stroke();g.restore()};
 [[90,90],[W-90,90],[90,H-90],[W-90,H-90]].forEach(([x,y])=>star(x,y,34));star(W/2,150,46);
 g.textAlign='center';g.fillStyle='#1f3a93';g.font='800 64px "Noto Sans",sans-serif';g.fillText(t('cert_title'),W/2,268);
 g.fillStyle='#0f172a';g.font='700 56px "Noto Sans",sans-serif';g.fillText(prof.name||'—',W/2,390);
 g.font='30px "Noto Sans",sans-serif';g.fillStyle='#334155';g.fillText('«'+t('app')+'» — '+t(k==='alif'?'course_alif':'course_tajwid'),W/2,460);g.fillText(t('cert_line'),W/2,505);
 g.fillStyle='#1f3a93';g.font='700 40px "Noto Sans",sans-serif';g.fillText(t('score')+': '+c.score+'%',W/2,590);
 g.fillStyle='#55607a';g.font='26px "Noto Sans",sans-serif';g.fillText(c.date,W/2,640);g.font='22px "Noto Sans",sans-serif';g.fillText(t('cert_note'),W/2,735);
 g.fillStyle='#b08a2e';g.font='40px "Amiri","Amiri Quran",serif';g.fillText('رَّبِّ زِدْنِي عِلْمًا',W/2,690)}
function vCert(k){if(!certs()[k])return vDarslar();return `<p><a href="#bosh">${t('back')}</a></p><h2>🏅 ${t('certificate')}</h2><div class="card"><canvas id="cert" style="width:100%;height:auto;border-radius:8px"></canvas>
 <div class="links"><a class="btn p" id="certSave" download="sertifikat.png">${t('save_img')}</a><button class="btn" id="certShare">${t('share')}</button></div></div>`}

// ---------- Созламалар ----------
function vSozlama(){const L4=[['uz','Ўзбекча'],['uzl','O‘zbekcha'],['tg','Тоҷикӣ'],['ru','Русский']],gl=store.get('giftName',prof.name||'');
 const seg=(id,opts,cur)=>`<div class="segc">${opts.map(([v,l])=>`<button class="btn${String(cur)===String(v)?' p':''}" data-set="${id}" data-v="${v}">${l}</button>`).join('')}</div>`;
 return `<h2>${t('settings')}</h2>
 <div class="card"><b>${t('s_lang')}</b>${seg('lang',L4,lang())}</div>
 ${remindHTML()}<div class="card"><b>${t('ob_level')}</b><div class="segc" style="flex-direction:column">${[0,1,2].map(v=>`<button class="btn${(prof.level||0)===v?' p':''}" data-set="level" data-v="${v}">${t('lv'+v)}</button>`).join('')}</div></div>
 <div class="card"><b>${t('s_name')}</b><input id="sName" class="inp" value="${esc(prof.name||'')}" placeholder="${t('ob_name_ph')}"></div>
 <div class="card"><b>${t('s_font')}</b>${seg('font',[[0,'A'],[1,'A+'],[2,'A++'],[3,'A+++']],prof.font||0)}<div class="ar" style="text-align:center">بِسْمِ ٱللَّهِ</div></div>
 <div class="card"><b>${t('s_theme')}</b>${seg('theme',[['auto',t('th_auto')],['light',t('th_light')],['sepia',t('th_sepia')],['dark',t('th_dark')]],prof.theme||'auto')}</div>
 <div class="card"><b>${t('s_goal')}</b>${seg('goal',[[5,'5 '+t('min')],[10,'10 '+t('min')],[20,'20 '+t('min')],[30,'30 '+t('min')]],prof.goal||10)}</div>
 <div class="card"><label class="row"><input type="checkbox" id="sKids"${prof.kids?' checked':''} style="width:24px;height:24px"> ${t('s_kids')}</label></div>
 <div class="card"><b>🎁 ${t('gift_make')}</b><p class="small">${t('gift_note')}</p><input id="gName" class="inp" value="${esc(gl)}" placeholder="${t('your_name')}">
 <div class="inp ltr" id="gLink" style="margin-top:8px;word-break:break-all">${esc(giftLink(gl))}</div><div class="links"><button class="btn p" id="gShare">${t('share')}</button><button class="btn" id="gCopy">${t('copy')}</button></div></div>
 <div class="card"><b>${t('about')}</b><p class="small">${t('about_t')}</p></div>
 <div class="card"><button class="btn" id="rst">${t('reset')}</button><div id="rstq"></div></div>`}
function giftLink(n){return location.origin+location.pathname+(n?'?from='+encodeURIComponent(n):'')}

// ---------- Онбординг ----------
let OB=0;
function obHTML(){const g=store.get('gift',null);const step=[
 ()=>`<h2>${t('ob_lang')}</h2>${[['uz','Ўзбекча'],['uzl','O‘zbekcha'],['tg','Тоҷикӣ'],['ru','Русский']].map(([v,l])=>`<button class="btn lg opt${lang()===v?' p':''}" data-ob="lang" data-v="${v}">${l}</button>`).join('')}`,
 ()=>`<h2>${t('ob_name')}</h2><input id="obName" class="inp" value="${esc(prof.name||'')}" placeholder="${t('ob_name_ph')}" autocomplete="given-name"><button class="btn p lg" data-ob="name" style="margin-top:12px">${t('next')}</button>`,
 ()=>`<h2>${t('ob_level')}</h2>${[0,1,2].map(v=>`<button class="btn lg opt" data-ob="level" data-v="${v}">${t('lv'+v)}</button>`).join('')}`,
 ()=>`<h2>${t('ob_goal')}</h2>${[5,10,20].map(v=>`<button class="btn lg opt" data-ob="goal" data-v="${v}">${v} ${t('min')}</button>`).join('')}`][OB]();
 return `<div class="ob"><div class="obc">${g&&g.from?`<div class="gift"><div class="gift-ic">🎁</div><div><b>${esc(t('gift_from',{from:g.from}))}</b><div class="small">${t('dua')}</div></div></div>`:`<div class="band-sm"></div>`}${step}<div class="dots">${[0,1,2,3].map(i=>`<i class="${i===OB?'on':''}"></i>`).join('')}</div></div></div>`}

// ---------- Текширув ----------
function vTek(){const tr=store.get('tref','1:1'),[s0,a0]=tr.split(':').map(Number),st=t('chk_steps').split('|');
 return `<h2>${t('chk_title')}</h2><div class="card"><b>${t('ayah')}</b><div class="row" style="margin-top:6px"><select id="ts">${Q?Q.map(x=>`<option value="${x.n}"${x.n===s0?' selected':''}>${x.n}. ${esc(x.tr)}</option>`).join(''):''}</select><select id="ta">${Q?Q[s0-1].v.map((_,i)=>`<option value="${i+1}"${i+1===a0?' selected':''}>${esc(t('ayah_n',{n:i+1}))}</option>`).join(''):''}</select></div>
 <div class="ex" data-ref="${s0}:${a0}">${Q?ayahHTML(s0+':'+a0):''}</div><div class="links">${listen(s0,a0)}${TM&&TM.t[s0+':'+a0]?`<button class="btn" data-ayk="${s0}:${a0}">${t('play_ayah')} (${t('teacher')})</button>`:''}</div>
 <ol class="small" style="padding-left:18px">${st.map(x=>`<li>${x}</li>`).join('')}</ol>
 <div class="row"><button class="btn p lg" id="rec">${t('record')}</button><span class="small" id="st"></span></div><div id="mine"></div>
 <details style="margin-top:10px"><summary class="small">${t('or_upload')}</summary><div style="margin-top:8px"><span class="small">${t('your_rec')}:</span><br><input type="file" id="f1" accept="audio/*"><br><span class="small">${t('ref_rec')}:</span><br><input type="file" id="f2" accept="audio/*"><br><button class="btn" id="go" style="margin-top:8px">${t('analyze')}</button></div></details></div>
 <div id="res"></div><div class="card small">${t('measured')}</div>`}

function analyze(buf){
 const ch=buf.numberOfChannels,n0=buf.length,sr0=buf.sampleRate,fac=Math.max(1,Math.round(sr0/11025)),sr=sr0/fac,N=Math.floor(n0/fac),x=new Float32Array(N);
 const chans=[];for(let c=0;c<ch;c++)chans.push(buf.getChannelData(c));
 for(let i=0;i<N;i++){let s=0;for(let c=0;c<ch;c++)for(let j=0;j<fac;j++)s+=chans[c][i*fac+j]||0;x[i]=s/(ch*fac)}
 const hop=Math.round(sr*0.01),win=Math.round(sr*0.03),F=Math.max(0,Math.floor((N-win)/hop)),db=new Float32Array(F),vo=new Uint8Array(F);
 for(let f=0;f<F;f++){let e=0;const o=f*hop;for(let i=0;i<win;i++)e+=x[o+i]*x[o+i];db[f]=10*Math.log10(e/win+1e-12)}
 const srt=Array.from(db).sort((a,b)=>a-b),top=srt[Math.floor(F*0.95)]||0,lo=Math.round(sr/400),hi=Math.round(sr/70);
 for(let f=0;f<F;f++){if(db[f]<top-30)continue;const o=f*hop;let e0=0;for(let i=0;i<win;i++)e0+=x[o+i]*x[o+i];let best=0;
  for(let L2=lo;L2<=hi;L2++){let s=0,e1=0;for(let i=0;i<win-L2;i++){s+=x[o+i]*x[o+i+L2];e1+=x[o+i+L2]*x[o+i+L2]}const r=s/Math.sqrt(e0*e1+1e-12);if(r>best)best=r}
  vo[f]=best>0.5?1:0}
 const sm=new Float32Array(F);for(let f=0;f<F;f++){let s=0,k=0;for(let j=-2;j<=2;j++)if(db[f+j]!==undefined){s+=db[f+j];k++}sm[f]=s/k}
 const sil=f=>sm[f]<top-28&&!vo[f];let first=0,last=F-1;while(first<F&&sil(first))first++;while(last>0&&sil(last))last--;
 const pauses=[];for(let f=first;f<=last;){if(sil(f)){let g=f;while(g<=last&&sil(g))g++;if(g-f>=25)pauses.push([f,g]);f=g}else f++}
 const nuc=[];let f=first;while(f<=last){if(vo[f]&&sm[f]>top-22&&(f===0||sm[f]>=sm[f-1])&&sm[f]>=(sm[f+1]??-1e9)){const p=sm[f];let a=f,b=f;while(a>first&&vo[a-1]&&sm[a-1]>p-4)a--;while(b<last&&vo[b+1]&&sm[b+1]>p-4)b++;const pr=nuc[nuc.length-1];if(pr&&a<=pr[1]){pr[1]=Math.max(pr[1],b)}else nuc.push([a,b]);f=b+1}else f++}
 const durs=nuc.map(([a,b])=>((b-a+1)*10+10)).filter(d=>d>=40),ds=[...durs].sort((a,b)=>a-b),unit=Math.max(70,ds[Math.floor(ds.length*0.3)]||120);
 const speak=(last-first+1)*10/1000-pauses.reduce((s,[a,b])=>s+(b-a)*10/1000,0);
 const long=nuc.map(([a,b])=>({t:a/100,d:((b-a+1)*10+10)})).filter(o=>o.d>=1.7*unit).map(o=>({...o,h:Math.round(o.d/unit*2)/2}));
 return {db:sm,vo,top,F,first,last,pauses,nuc,unit,long,dur:n0/sr0,rate:durs.length/Math.max(speak,0.1),speak}}

function plot(cv,A){const W=cv.clientWidth,H=cv.clientHeight,d=window.devicePixelRatio||1;cv.width=W*d;cv.height=H*d;const g=cv.getContext('2d');g.scale(d,d);const cs=getComputedStyle(document.documentElement);
 const c=v=>cs.getPropertyValue(v).trim()||'#888';g.clearRect(0,0,W,H);const X=f=>f/A.F*W,Y=v=>H-8-Math.max(0,(v-(A.top-40))/45)*(H-16);
 g.fillStyle=c('--line');A.pauses.forEach(([a,b])=>g.fillRect(X(a),0,X(b)-X(a),H));
 A.nuc.forEach(([a,b])=>{const dd=((b-a+1)*10+10);g.fillStyle=dd>=1.7*A.unit?c('--gold'):c('--lapisbg');g.fillRect(X(a),H-26,Math.max(1,X(b+1)-X(a)),18)});
 g.strokeStyle=c('--lapis');g.lineWidth=1.5;g.beginPath();for(let f=0;f<A.F;f++){const y=Y(A.db[f]);f?g.lineTo(X(f),y):g.moveTo(X(f),y)}g.stroke()}

function resHTML(A,B){const row=(k,a,b)=>`<tr><td>${k}</td><td>${a}</td>${B?`<td>${b}</td>`:''}</tr>`;
 const tbl=`<div class="scroll"><table><thead><tr><th>${t('metric')}</th><th>${t('you')}</th>${B?`<th>${t('teacher')}</th>`:''}</tr></thead><tbody>
 ${row(t('duration'),A.dur.toFixed(1)+' s',B&&B.dur.toFixed(1)+' s')}${row(t('speed'),A.rate.toFixed(1),B&&B.rate.toFixed(1))}
 ${row(t('one_h'),Math.round(A.unit)+' ms',B&&Math.round(B.unit)+' ms')}${row(t('pauses'),A.pauses.length,B&&B.pauses.length)}${row(t('longs'),A.long.length,B&&B.long.length)}</tbody></table></div>`;
 const list=(Z,tt)=>`<div class="card"><b>${tt}: ${t('longs_t')}</b><div class="scroll"><table><thead><tr><th>#</th><th>${t('time')}</th><th>${t('length')}</th><th>≈ ${t('harakat')}</th></tr></thead><tbody>${Z.long.map((o,i)=>`<tr><td>${i+1}</td><td>${o.t.toFixed(2)} s</td><td>${o.d} ms</td><td>${o.h}</td></tr>`).join('')||`<tr><td colspan="4">${t('none')}</td></tr>`}</tbody></table></div></div>`;
 const adv=[];if(B){const r=A.rate/B.rate;if(r>1.25)adv.push(t('adv_fast',{x:r.toFixed(1)}));if(A.long.length<B.long.length-1)adv.push(t('adv_fewlong',{a:A.long.length,b:B.long.length}));
  const am=A.long.length?Math.max(...A.long.map(o=>o.h)):0,bm=B.long.length?Math.max(...B.long.map(o=>o.h)):0;if(bm>=4&&am<bm-1.5)adv.push(t('adv_maxlong',{a:am,b:bm}))}
 else{const mx=A.long.length?Math.max(...A.long.map(o=>o.h)):0;adv.push(mx?t('adv_solo',{a:mx}):t('adv_nolong'))}
 return `<div class="card"><b>${t('result')}</b>${tbl}<div class="fig"><canvas id="cv1"></canvas></div><p class="small">${t('legend')}</p>${adv.length?`<div class="note">${adv.map(esc).join('<br>')}</div>`:''}</div>${list(A,t('you'))}${B?list(B,t('teacher')):''}`}
async function decode(file){if(file&&file.getChannelData)return file;const ac=new (window.AudioContext||window.webkitAudioContext)();const ab=await file.arrayBuffer();try{return await new Promise((ok,no)=>{const p=ac.decodeAudioData(ab,ok,no);if(p&&p.then)p.then(ok,no)})}finally{ac.close&&ac.close()}}

let lastA=null,mr=null,chunks=[],recT=0,recI=null;const st=m=>{const e=$('#st');if(e)e.textContent=m};
async function refBuffer(){const [s,a]=store.get('tref','1:1').split(':').map(Number);const res=await fetch(audioURL(prec(),s,a),{mode:'cors'});if(!res.ok)throw 0;return decode(await res.blob())}
async function run(blob,sr){const f1=blob||($('#f1')&&$('#f1').files[0]),f2=$('#f2')&&$('#f2').files[0];if(!f1){st(t('need_rec'));return}st(t('analyzing'));await new Promise(r=>setTimeout(r,30));
 let A;try{A=analyze(await decode(f1))}catch(e){st(t('bad_file'));return}let B=null,note='';const book=location.hash==='#kitob';
 if(!book){try{B=analyze(await decode(f2||await refBuffer()))}catch(e){B=null;note=t('ref_fail')}}else note=t('book_note');
 lastA=A;const [s_,a_]=store.get('tref','1:1').split(':').map(Number);$('#res').innerHTML=(book?'':teacherHTML(s_,a_,A,B,sr))+`<details class="card"${book?' open':''}><summary class="small">${t('tf_details')}</summary>`+resHTML(A,B)+'</details>'+(note?`<div class="note small">${esc(note)}</div>`:'');plot($('#cv1'),A);st(t('ready'));markActive();const tb=$('.tfbox');if(tb)tb.scrollIntoView({behavior:'smooth',block:'start'});if(!book)tajRun(f1,s_,a_)}
async function recToggle(){const b=$('#rec');if(mr&&mr.state==='recording'){mr.stop();return}
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.MediaRecorder){st(t('no_mic'));return}P.a.pause();stopSeg();
 let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}})}catch(e){st(t('mic_denied'));return}
 const mt=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(x=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(x));mr=new MediaRecorder(stream,mt?{mimeType:mt}:undefined);chunks=[];
 mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
 mr.onstop=async()=>{stream.getTracks().forEach(x=>x.stop());clearInterval(recI);b.textContent=t('rerecord');b.classList.add('p');const blob=new Blob(chunks,{type:mr.mimeType||'audio/mp4'});$('#mine').innerHTML=`<p class="small" style="margin:10px 0 4px">${t('your_rec')}:</p><audio controls src="${URL.createObjectURL(blob)}" style="width:100%"></audio>`;st(t('tf_listening'));const sr=await srStop();run(blob,sr)};
 mr.start();srStart();recT=Date.now();b.textContent=t('stop');b.classList.remove('p');$('#res').innerHTML='';recI=setInterval(()=>{const e=$('#st');if(e)e.innerHTML=`<span class="recdot"></span>${t('recording')} ${((Date.now()-recT)/1000).toFixed(0)} s`},300)}

// ---------- Китоб (Муаллими соний) ----------
const idb=(()=>{let p;const db=()=>p||(p=new Promise((ok,no)=>{const r=indexedDB.open('qu',1);r.onupgradeneeded=()=>r.result.createObjectStore('f');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}));
 return{get:k=>db().then(d=>new Promise((ok,no)=>{const q=d.transaction('f').objectStore('f').get(k);q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)})),
 set:(k,v)=>db().then(d=>new Promise((ok,no)=>{const t=d.transaction('f','readwrite');t.objectStore('f').put(v,k);t.oncomplete=()=>ok();t.onerror=()=>no(t.error)}))}})();

let PDF=null,drawTok=0;
const loadLib=()=>window.pdfjsLib?Promise.resolve():new Promise((ok,no)=>{const sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';sc.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';ok()};sc.onerror=no;document.head.appendChild(sc)});

async function openPdf(buf){await loadLib();PDF=await window.pdfjsLib.getDocument({data:new Uint8Array(buf.slice(0))}).promise}

function kbPicker(msg){const kb=$('#kb');if(!kb)return;kb.innerHTML=`<div class="card"><p>${msg||t('book_pick')}</p><input type="file" id="mspdf" accept="application/pdf,.pdf"><p class="small" id="kst"></p></div>`}
function kbUI(){const kb=$('#kb');if(!kb||!PDF)return;const N=PDF.numPages,n=Math.min(store.get('mspg',1),N),dn=store.get('msdone',{});
 const su=(C.MSS[n]||[]).map(([s0,f,e])=>`<button class="btn p" data-range="${s0}:${f||1}:${e||(Q?Q[s0-1].v.length:1)}">▶ ${esc(Q?Q[s0-1].tr:s0)}${f?` ${f}–${e}`:''}</button>`).join('');
 kb.innerHTML=`<div class="row"><button class="btn" id="msprev" aria-label="←">←</button><select id="mspg">${Array.from({length:N},(_,i)=>`<option value="${i+1}"${i+1===n?' selected':''}>${dn[i+1]?'✓ ':''}${i+1}. ${esc(tx(C.MS[i+1]||''))}</option>`).join('')}</select><button class="btn" id="msnext" aria-label="→">→</button><button class="btn" id="mszoom">${store.get('msz',1)>1?'−':'+'} ${t('zoom')}</button></div>
 ${C.MSL[n]?`<div class="note small" style="margin-top:8px"><a href="#dars-${C.MSL[n]}">${esc(t('links_lesson',{n:C.MSL[n]}))}</a></div>`:''}
 <div class="links">${su}<button class="btn${su?'':' p'}" id="rec">${t('record')}</button><button class="btn" id="msok">${dn[n]?t('page_done2'):t('page_done')}</button></div><div class="small" id="st"></div><div id="mine"></div><div id="res"></div>
 <div class="card" id="pgbox"><canvas id="pgcv"></canvas></div><details class="small"><summary>${t('other_pdf')}</summary><input type="file" id="mspdf" accept="application/pdf,.pdf"></details>`;drawPage().catch(()=>{})}
async function drawPage(){const tok=++drawTok,n=Math.min(store.get('mspg',1),PDF.numPages),page=await PDF.getPage(n),box=$('#pgbox');if(!box||tok!==drawTok)return;
 const z=store.get('msz',1),w=box.clientWidth*z,v0=page.getViewport({scale:1}),d=window.devicePixelRatio||1,vp=page.getViewport({scale:w/v0.width*d}),cv=$('#pgcv');
 cv.width=vp.width;cv.height=vp.height;cv.style.width=vp.width/d+'px';cv.style.height=vp.height/d+'px';await page.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise}

async function bookInit(){try{if(!PDF){const b=await idb.get('ms');if(!b){kbPicker();return}await openPdf(b)}kbUI()}catch(e){kbPicker(t('book_fail'))}}
async function setPdf(f){const k=$('#kst')||$('#st');if(k)k.textContent=t('saving');try{const buf=await f.arrayBuffer();await openPdf(buf);await idb.set('ms',buf);store.set('mspg',1);kbUI()}catch(e){if(k)k.textContent=t('not_pdf')}}
const goPage=n=>{if(!PDF)return;store.set('mspg',Math.max(1,Math.min(PDF.numPages,n)));kbUI();window.scrollTo(0,0)};

// ---------- Рендер ----------


// ---------- Китоб: «Муаллими соний» усулида (ички мазмун, PDF керак эмас) ----------
const L28=['ا','ر','ز','م','ت','ن','ي','ب','ك','ل','و','ه','ف','ق','ش','س','ث','ص','ط','ج','خ','ح','غ','ع','د','ض','ذ','ظ'];
const BKMAP={'ٱ':'ا','أ':'ا','إ':'ا','آ':'ا','ء':'ا','ى':'ي','ة':'ت','ؤ':'وا','ئ':'يا'};
const bkLets=w=>{const o=new Set();for(const ch of w){const c=BKMAP[ch]||(/[ا-ي]/.test(ch)?ch:'');for(const x of c)o.add(x)}return o};
const BKS=[1,2,...Array.from({length:24},(_,i)=>91+i)];
const bkAy=s=>s===2?5:(Q?Q[s-1].v.length:0);
const BKSN={1:{uz:'Фотиҳа',tg:'Фотиҳа',ru:'Аль-Фатиха'},2:{uz:'Бақара',tg:'Бақара',ru:'Аль-Бакара'},91:{uz:'Шамс',tg:'Шамс',ru:'Аш-Шамс'},92:{uz:'Лайл',tg:'Лайл',ru:'Аль-Ляйль'},93:{uz:'Зуҳо',tg:'Зуҳо',ru:'Ад-Духа'},94:{uz:'Шарҳ',tg:'Шарҳ',ru:'Аш-Шарх'},95:{uz:'Тийн',tg:'Тийн',ru:'Ат-Тин'},96:{uz:'Алақ',tg:'Алақ',ru:'Аль-Аляк'},97:{uz:'Қадр',tg:'Қадр',ru:'Аль-Кадр'},98:{uz:'Баййина',tg:'Баййина',ru:'Аль-Баййина'},99:{uz:'Залзала',tg:'Залзала',ru:'Аз-Зальзаля'},100:{uz:'Одиёт',tg:'Одиёт',ru:'Аль-Адият'},101:{uz:'Қориъа',tg:'Қориъа',ru:'Аль-Кариа'},102:{uz:'Такосур',tg:'Такосур',ru:'Ат-Такасур'},103:{uz:'Аср',tg:'Аср',ru:'Аль-Аср'},104:{uz:'Ҳумаза',tg:'Ҳумаза',ru:'Аль-Хумаза'},105:{uz:'Фил',tg:'Фил',ru:'Аль-Филь'},106:{uz:'Қурайш',tg:'Қурайш',ru:'Курайш'},107:{uz:'Моъун',tg:'Моъун',ru:'Аль-Маун'},108:{uz:'Кавсар',tg:'Кавсар',ru:'Аль-Каусар'},109:{uz:'Кофирун',tg:'Кофирун',ru:'Аль-Кафирун'},110:{uz:'Наср',tg:'Наср',ru:'Ан-Наср'},111:{uz:'Масад',tg:'Масад',ru:'Аль-Масад'},112:{uz:'Ихлос',tg:'Ихлос',ru:'Аль-Ихлас'},113:{uz:'Фалақ',tg:'Фалақ',ru:'Аль-Фаляк'},114:{uz:'Нос',tg:'Нос',ru:'Ан-Нас'}};
let BK=null,BKW=null;
function bkBuild(){if(BK||!Q||!TM)return BK;const W=[];
 for(const s of BKS)for(let a=1;a<=bkAy(s);a++){if(s===2&&a===1)continue;const tm=TM.t[s+':'+a];if(!tm)continue;Q[s-1].v[a-1].split(' ').forEach((w,i)=>{if(tm.some(g=>g[0]===i))W.push({s,a,i,w,L:bkLets(w)})})}
 BKW=W;const uniq=(arr,n)=>{const seen=new Set();return arr.filter(x=>{if(seen.has(x.w))return false;seen.add(x.w);return true}).slice(0,n)};
 const P=[{k:'ov'}];
 L28.forEach((c,k)=>{const kn=new Set(L28.slice(0,k+1));P.push({k:'l',c,idx:k,w:uniq(W.filter(x=>x.L.has(c)&&[...x.L].every(l=>kn.has(l))).sort((a,b)=>a.w.length-b.w.length),10)})});
 const byLen=(re,n)=>uniq(W.filter(x=>re.test(x.w)).sort((a,b)=>a.w.length-b.w.length),n);
 P.push({k:'t',ttl:'bk_madd',gl:['madharf','maddt'],w:byLen(/َا|ٰ|ُو|ِي/,12)});
 P.push({k:'t',ttl:'bk_shadda',gl:['shadda','ghunna'],w:byLen(/ّ/,12)});
 P.push({k:'t',ttl:'bk_tanwin',gl:['tanwin'],w:byLen(/[ً-ࣰٍٖٗٞ-ࣲ]/,12)});
 P.push({k:'t',ttl:'bk_waqf',gl:['waqf','waqfs'],w:[]});
 P.push({k:'t',ttl:'bk_idgham',gl:['idgham','idghamb','iqlab'],w:[]});
 BKS.forEach(s=>P.push({k:'s',s}));BK=P;return P}
const bkRefs=()=>{const o=new Set();if(!bkBuild())return [];BK.forEach(p=>{(p.w||[]).forEach(x=>o.add(x.s+':'+x.a));if(p.k==='s')for(let a=1;a<=bkAy(p.s);a++)o.add(p.s+':'+a)});return [...o]};
const bkTitle=p=>p.k==='ov'?t('bk_overview'):p.k==='l'?t('bk_letter',{x:tx(LF(p.c)[2])}):p.k==='t'?t(p.ttl):t('bk_sura',{x:tx(BKSN[p.s])})+(Q?' · '+Q[p.s-1].ar:'');
const bkWords=ws=>ws.length?`<h3>${t('bk_words')}</h3><div class="syl bkws">${ws.map(x=>`<button class="btn bkw" data-ww="${x.s}:${x.a}:${x.i}"><span class="ar">${esc(x.w)}</span><small>${x.s}:${x.a}</small></button>`).join('')}</div>`:'';
function bkPage(p){const H=['َ','ِ','ُ'];
 if(p.k==='ov')return `<p class="small">${t('bk_names_note')}</p><div class="syl">${L28.map(c=>{const x=LF(c);return `<button class="btn" data-say="${x[1]}"><span class="ar" style="font-size:calc(30px*var(--arz))">${c}</span><small>${esc(tx(x[2]))}</small></button>`}).join('')}</div>`;
 if(p.k==='l'){const x=LF(p.c),j=x[4],F=t('forms').split('|'),fm=j?[p.c,p.c+'‍','‍'+p.c+'‍','‍'+p.c]:[p.c,'—','—','‍'+p.c],prev=L28.slice(Math.max(0,p.idx-3),p.idx);
  const combo=prev.flatMap(q=>[q+'َ'+p.c+'َ',p.c+'َ'+q+'ِ',q+'ُ'+p.c+'ْ']);
  return `<div class="card"><div class="big">${p.c}</div><div style="text-align:center"><b style="font-size:20px">${esc(tx(x[2]))}</b> <span class="ar" style="font-size:22px;line-height:1">${x[1]}</span></div><p>${esc(tx(x[3]))}</p>
  <div class="forms">${F.map((nm,k)=>`<div><div class="g">${esc(fm[k])}</div><span class="small">${nm}</span></div>`).join('')}</div></div>
  <h3>${t('bk_syll')}</h3><div class="syl">${H.map(h=>`<button class="btn" data-say="${p.c+h}"><span class="ar">${p.c+h}</span></button>`).join('')}${p.idx?`<button class="btn" data-say="${p.c}ْ"><span class="ar">${'أَ'+p.c+'ْ'}</span></button>`:''}</div>
  ${combo.length?`<h3>${t('bk_combo')}</h3><div class="syl">${combo.map(c=>`<button class="btn" data-say="${c}"><span class="ar">${c}</span></button>`).join('')}</div>`:''}
  ${p.w.length?bkWords(p.w):`<div class="note">${t('bk_nowords')}</div>`}`}
 if(p.k==='t'){const gs=p.gl.map(k=>GLA.find(x=>x.k===k)).filter(Boolean);
  return gs.map(g=>`<div class="card"><div class="row" style="justify-content:space-between"><b>${esc(tx(g.n))}</b><span class="ar" style="font-size:22px">${g.ar}</span></div><p>${tx(g.d)}</p><a class="btn" href="#qoida-${g.k}">${t('bk_more')} →</a></div>`).join('')+bkWords(p.w)}
 const n=bkAy(p.s);return `<div class="links"><button class="btn" data-bkmus="${p.s}">${t('bk_open_mushaf')}</button></div>`+Array.from({length:n},(_,i)=>{const a=i+1;return `<div class="card ex" data-ref="${p.s}:${a}">${ayahHTML(p.s+':'+a,null)}<div class="links"><button class="btn p" data-ayk="${p.s}:${a}">▶ ${p.s}:${a}</button></div></div>`}).join('')}
function vKitob(){if(!bkBuild())return `<h2>${t('book_title')}</h2><p class="small">${t('loading')}</p>`;const N=BK.length,n=Math.min(Math.max(1,store.get('bkpg',1)),N),dn=store.get('bkdone',{}),p=BK[n-1];
 return `<h2>${t('bk_title')}</h2><div class="note">${t('bk_note')} <a href="https://islom.uz/kitob/1" target="_blank" rel="noopener">${t('bk_orig')}</a></div>
 <div class="card" id="bkdl"></div>
 <div class="row" style="margin:8px 0"><button class="btn" id="bkprev" aria-label="←"${n<=1?' disabled':''}>←</button><select id="bkpg" class="inp" style="flex:1;min-width:0">${BK.map((q,i)=>`<option value="${i+1}"${i+1===n?' selected':''}>${dn[i+1]?'✓ ':''}${i+1}. ${esc(bkTitle(q))}</option>`).join('')}</select><button class="btn" id="bknext" aria-label="→"${n>=N?' disabled':''}>→</button></div>
 <h2>${n}. ${esc(bkTitle(p))}</h2>${bkPage(p)}
 <div class="row" style="margin-top:14px;justify-content:space-between"><button class="btn p" id="bkok">${dn[n]?t('bk_readdone'):t('bk_read')}</button>${n<N?`<button class="btn" id="bknext2">${t('gl_next')}</button>`:''}</div>`}
// Аудиони телефонга сақлаш (Service Worker шу кешдан беради)
const AC='qu-audio';
async function bkDlStatus(){const el=$('#bkdl');if(!el||!('caches' in window))return el&&el.remove();const refs=bkRefs(),c=await caches.open(AC),keys=new Set((await c.keys()).map(r=>r.url));
 const urls=refs.map(r=>{const [s,a]=r.split(':').map(Number);return audioURL(R[0],s,a)}),have=urls.filter(u=>keys.has(u)).length;
 if(BKDL){el.innerHTML=`<b>${t('bk_dl_prog',{n:BKDL.n,m:BKDL.m})}</b><div class="pbar"><b style="width:${Math.round(BKDL.n/BKDL.m*100)}%"></b></div>`;return}
 if(have>=urls.length){let sz=0;for(const u of urls){const r=await c.match(u);if(r){const b=await r.clone().blob();sz+=b.size}}el.innerHTML=`<span class="small">${t('bk_dl_done',{mb:(sz/1048576).toFixed(0)})}</span>`;return}
 el.innerHTML=`<button class="btn p" id="bkdlgo" style="width:100%;white-space:normal">${have?t('bk_dl_part',{n:have,m:urls.length}):t('bk_dl',{n:urls.length})}</button>${navigator.onLine===false?`<div class="small">${t('bk_dl_off')}</div>`:''}`}
let BKDL=null;
async function bkDownload(){if(BKDL)return;const refs=bkRefs(),c=await caches.open(AC),keys=new Set((await c.keys()).map(r=>r.url));const urls=refs.map(r=>{const [s,a]=r.split(':').map(Number);return audioURL(R[0],s,a)}).filter(u=>!keys.has(u));
 BKDL={n:0,m:urls.length};bkDlStatus();let i=0;
 const worker=async()=>{while(i<urls.length){const u=urls[i++];try{const r=await fetch(u,{mode:'cors'});if(r.ok)await c.put(u,r)}catch(e){}BKDL.n++;if(BKDL.n%5===0||BKDL.n===BKDL.m)bkDlStatus()}};
 await Promise.all([worker(),worker(),worker()]);BKDL=null;bkDlStatus()}
const cacheAudio=u=>{if(!('caches' in window)||navigator.onLine===false)return;caches.open(AC).then(c=>c.match(u).then(m=>{if(!m)fetch(u,{mode:'cors'}).then(r=>{if(r.ok)c.put(u,r)}).catch(()=>{})}))};
const bkGo=n=>{store.set('bkpg',Math.max(1,Math.min(BK?BK.length:1,n)));render()};

// ---------- Қоидалар луғати ----------
const GLA=C.GL.flatMap((g,gi)=>g.i.map(x=>({k:x[0],ar:x[1],n:x[2],s:x[3],d:x[4],ex:x[5],L:x[6],g:gi})));
const glk=()=>store.get('glk',{});
// ---------- Ўқув йўли (мажбурий кетма-кетлик) ----------
// 1-босқич: Алифбо (ҳарф → ҳаракат → бўғин → сўз). 2-босқич: Тажвид (товушдан қоидага: махраж → сифат → тафхим/тарқиқ → нун ва мим → мадлар → вақф).
const TJORD=[10,11,12,1,2,3,4,5,6,7,8,9,13];
const PATH=[...AL.map((_,i)=>({s:1,h:'alif-'+(i+1),k:'a',i})),{s:1,h:'imtihon-alif',k:'xa'},{s:2,h:'mahraj',k:'m'},...TJORD.map(n=>({s:2,h:'dars-'+n,k:'d',i:n-1})),{s:2,h:'imtihon-tajwid',k:'xt'}];
function stepDone(p){if(p.k==='a')return !!doneA()[p.i];if(p.k==='d')return !!done()[p.i];if(p.k==='m')return !!store.get('mkdone',0);if(p.k==='xa')return !!certs().alif;if(p.k==='xt')return !!certs().tajwid;return false}
const lvl=()=>prof.level||0;
const stepReq=p=>!(p.s===1&&lvl()>=1);
function stepTitle(p){if(p.k==='r')return '🔁 '+t('sx_ret')+': '+stepTitle(p.base);if(p.k==='a')return tx(AL[p.i].t);if(p.k==='d')return tx(C.L[p.i].t);if(p.k==='m')return t('mk_title');if(p.k==='xa')return t('exam_alif');return t('exam_tajwid')}
function curStep(){const r=typeof dueRet==='function'?dueRet()[0]:null;if(r)return {h:'sinov-'+r.h,k:'r',base:r,s:r.s};return PATH.find(p=>stepReq(p)&&!stepDone(p))||null}
function stepOpen(h){const j=PATH.findIndex(p=>p.h===h);if(j<0)return true;if(stepDone(PATH[j]))return true;if(typeof dueRet==='function'&&dueRet().length)return false;if(lvl()>=2)return true;for(let k=0;k<j;k++){const p=PATH[k];if(stepReq(p)&&!stepDone(p))return false}return true}
function pathNext(h){const j=PATH.findIndex(p=>p.h===h);const n=PATH.slice(j+1).find(p=>stepReq(p))||PATH[j+1];return n||null}
function pathNo(h){const L=PATH.filter(stepReq);return L.findIndex(p=>p.h===h)+1}
function nextLesson(){const c=curStep();return c?{h:c.h,t:stepTitle(c)}:null}
function vLocked(h){const c=curStep(),j=PATH.findIndex(p=>p.h===h);return `<p><a href="#darslar">${t('all_lessons')}</a></p><div class="card lockc"><div class="lockic">🔒</div><h2>${esc(stepTitle(PATH[j]))}</h2><p>${t('lk_d')}</p>
 ${c?`<a class="btn p lg" href="#${c.h}">▶ ${t('lk_go')}: ${esc(stepTitle(c))}</a>`:''}<p class="small" style="margin-top:12px">${t('lk_why')}</p></div>`}
function examBtn(h){const L=(typeof lx==='function'?lx():{})[h]||{};return L.p?`<a class="btn" href="#sinov-${h}">✓ ${t('sx_passed',{s:L.sc!=null?L.sc:'—'})}</a>`:`<a class="btn p" href="#sinov-${h}">📝 ${t('sx_take')}</a>`}
function nextBtn(h){const n=pathNext(h);return n?`<a class="btn" href="#${n.h}">${t('next_lesson_btn')} → ${esc(stepTitle(n))}</a>`:''}
// ---------- Қоидаларни ёдлаш тизими (такрорлаш карталари, Лейтнер) ----------
const SRI=[0,1,3,7,14,30,60];
const srs=()=>store.get('srs',{});
const addDays=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
function glOpenFor(link){if(!link)return false;if(/^alif-/.test(link))return !!doneA()[+link.split('-')[1]-1]||lvl()>=1;if(/^dars-/.test(link))return !!done()[+link.split('-')[1]-1];if(link==='mahraj')return !!store.get('mkdone',0);return !!certs().alif||lvl()>=1}
function srsSync(){const S=srs();let ch=0;GLA.forEach(x=>{if(!S[x.k]&&glOpenFor(x.L)){S[x.k]={b:0,due:today()};ch=1}});if(ch)store.set('srs',S);return S}
function srsDue(){const S=srsSync(),td=today();return GLA.filter(x=>S[x.k]&&S[x.k].due<=td)}
let TK=null;
function vTakror(){const due=srsDue(),S=srs(),tot=Object.keys(S).length,mast=Object.values(S).filter(v=>v.b>=4).length;
 if(!TK||TK.done)TK={q:due.map(x=>x.k),i:0,ok:0,re:0,show:false,done:false};
 const k=TK.q[TK.i],x=k&&GLA.find(g=>g.k===k);
 const head=`<p><a href="#darslar">${t('all_lessons')}</a></p><h2>🧠 ${t('tk_title')}</h2><div class="note">${t('tk_note')}</div><div class="prow"><span>${t('tk_cards',{n:tot})}</span><span>✅ ${t('tk_mast',{n:mast})}</span></div>`;
 if(!tot)return head+`<div class="card"><p>${t('tk_none')}</p>${nextLesson()?`<a class="btn p" href="#${nextLesson().h}">▶ ${esc(nextLesson().t)}</a>`:''}</div>`;
 if(!x){const nd=Object.values(S).map(v=>v.due).filter(d=>d>today()).sort()[0];return head+`<div class="card tkdone"><div style="font-size:42px">🌟</div><h3>${t('tk_fin')}</h3><p>${TK.q.length?t('tk_res',{n:TK.q.length,ok:TK.ok}):''} ${nd?t('tk_next',{d:nd}):''}</p>${nextLesson()?`<a class="btn p" href="#${nextLesson().h}">▶ ${t('next_lesson')}: ${esc(nextLesson().t)}</a>`:''}</div>`}
 const b=S[k]?S[k].b:0;
 return head+`<div class="pbar"><b style="width:${TK.i/TK.q.length*100}%"></b></div><div class="small">${TK.i+1}/${TK.q.length} · ${t('tk_box',{n:b+1})}</div>
 <div class="card tkcard"><div class="ar tkar">${x.ar}</div><div class="tkn">${esc(tx(x.n))}</div>
 ${TK.show?`<div class="tkans"><p><b>${esc(tx(x.s))}</b></p><p class="small">${tx(x.d)}</p>${x.ex&&x.ex.say?`<button class="btn" data-say="${esc(x.ex.say)}">🔊 ${esc(x.ex.show||x.ex.say)}</button>`:''}</div>
 <div class="tkbtns"><button class="btn tkno" data-tk="0">❌ ${t('tk_no')}</button><button class="btn" data-tk="1">😐 ${t('tk_hard')}</button><button class="btn p" data-tk="2">✅ ${t('tk_yes')}</button></div>`
 :`<p class="small">${t('tk_q')}</p><button class="btn p lg" id="tkShow">${t('tk_show')}</button>`}</div>`}
function tkAns(v){const k=TK.q[TK.i],S=srs(),c=S[k]||{b:0};if(v===0){c.b=0;c.due=today();TK.q.push(k);TK.re++}else if(v===1){c.due=addDays(1)}else{c.b=Math.min(SRI.length-1,c.b+1);c.due=addDays(SRI[c.b]);TK.ok++}S[k]=c;store.set('srs',S);
 const g=glk();if(v===2){g[k]=1;store.set('glk',g)}TK.i++;TK.show=false;render()}
const strip=h=>String(h).replace(/<[^>]+>/g,'');
function vQoidalar(){const kn=glk(),n=GLA.filter(x=>kn[x.k]).length;
 return `<h2>${t('gl_title')}</h2><div class="note">${t('gl_note')}</div>
 <div class="card"><div class="prow"><span>${t('gl_learned')}</span><span>${n}/${GLA.length}</span></div><div class="pbar"><b style="width:${Math.round(n/GLA.length*100)}%"></b></div>
 <a class="btn p lg" href="#glmashq" style="margin-top:10px">🎯 ${t('gl_test')}</a></div>
 <input id="glSearch" class="inp" type="search" placeholder="${t('gl_search')}" style="width:100%;margin:6px 0 4px">
 ${C.GL.map((g,gi)=>`<div class="glg"><h3>${esc(tx(g.g))}</h3><div class="grid">${GLA.filter(x=>x.g===gi).map(x=>`<a class="card lesson glc" href="#qoida-${x.k}" data-f="${esc((tx(x.n)+' '+strip(tx(x.s))+' '+x.ar+' '+x.k).toLowerCase())}"><span class="num${kn[x.k]?' done':''}">${kn[x.k]?'✓':'•'}</span><span style="flex:1"><b>${esc(tx(x.n))}</b><br><span class="small">${esc(strip(tx(x.s)))}</span></span><span class="ar glar">${x.ar}</span></a>`).join('')}</div></div>`).join('')}`}
function vQoida(k){const i=GLA.findIndex(x=>x.k===k);if(i<0)return vQoidalar();const x=GLA[i],kn=glk(),p=GLA[i-1],nx=GLA[i+1];let ex='';
 if(x.ex.r){const [li_,ei]=x.ex.r,e=C.L[li_].ex[ei],[s]=e[0].split(':');
  ex=`${stageHTML()}<h3>${t('gl_example')}</h3><div class="card ex" data-ref="${e[0]}"><div class="ref">${e[0]} · ${esc(sname(+s))}</div>${ayahHTML(e[0],e[1])}<div>${esc(tx(e[2]))}</div><div class="links"><button class="btn p" data-rule="${li_}:${ei}">${t('play_rule')}</button><button class="btn" data-ayk="${e[0]}">${t('play_ayah')}</button></div></div>`}
 else ex=`<h3>${t('gl_example')}</h3><div class="card"><div class="big" style="font-size:calc(52px*var(--arz))">${x.ex.show}</div><div class="links" style="justify-content:center"><button class="btn p" data-say="${x.ex.say}">🔊 ${esc(x.ex.show)}</button></div></div>`;
 const lk=x.L?`<a class="btn" href="#${x.L}">${x.L==='mahraj'?t('tab_makhraj'):x.L==='ustozlar'?t('reciters'):t('gl_open_lesson')}</a>`:'';
 return `<p><a href="#qoidalar">${t('gl_all')}</a> · <span class="small">${esc(tx(C.GL[x.g].g))}</span></p>
 <div class="card"><div class="row" style="justify-content:space-between;align-items:center"><h2 style="margin:0">${esc(tx(x.n))}</h2><span class="ar" style="font-size:calc(30px*var(--arz));line-height:1.4">${x.ar}</span></div>
 <p><b>${tx(x.s)}</b></p><p>${tx(x.d)}</p><div class="links"><button class="btn${kn[x.k]?'':' p'}" id="glKnow" data-k="${x.k}">${kn[x.k]?t('gl_known'):t('gl_know')}</button>${lk}</div></div>
 ${ex}
 <div class="row" style="margin-top:14px;justify-content:space-between">${p?`<a class="btn" href="#qoida-${p.k}">${t('gl_prev')}</a>`:'<span></span>'}${nx?`<a class="btn" href="#qoida-${nx.k}">${t('gl_next')}</a>`:`<a class="btn p" href="#glmashq">🎯 ${t('gl_test')}</a>`}</div>`}
let GT=null;
function glStart(){const sh=a=>a.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(v=>v[1]);const pick=sh(GLA).slice(0,10);
 GT={i:0,score:0,ans:false,qs:pick.map((x,j)=>{const ty=j%3,oth=sh(GLA.filter(o=>o.k!==x.k)).slice(0,3),opts=sh([x,...oth]);return {ty,x,opts}})}}
function vGlTest(){if(!GT)glStart();if(GT.i>=GT.qs.length){const pct=Math.round(GT.score/GT.qs.length*100);
  return `<p><a href="#qoidalar">${t('gl_all')}</a></p><h2>${t('gl_test')}</h2><div class="card" style="text-align:center"><div class="kv" style="font-size:40px">${pct>=80?'🏆':pct>=50?'👍':'📖'}</div><h3>${t('gl_result',{n:GT.score,m:GT.qs.length})}</h3><div class="links" style="justify-content:center"><button class="btn p" id="glAgain">${t('gl_again')}</button><a class="btn" href="#qoidalar">${t('gl_all')}</a></div></div>`}
 const q=GT.qs[GT.i],x=q.x,qt=q.ty===0?t('gl_q_what',{x:tx(x.n)}):q.ty===1?t('gl_q_which',{x:strip(tx(x.s))}):t('gl_q_ar',{x:x.ar});
 const lab=o=>q.ty===0?strip(tx(o.s)):tx(o.n);
 return `<p><a href="#qoidalar">${t('gl_all')}</a></p><h2>${t('gl_test')}</h2><div class="pbar"><b style="width:${Math.round(GT.i/GT.qs.length*100)}%"></b></div><p class="small">${GT.i+1} / ${GT.qs.length}</p>
 <div class="card"><b ${q.ty===2?'class="ar" style="font-size:calc(30px*var(--arz))"':''}>${esc(q.ty===2?x.ar:qt)}</b>${q.ty===2?`<div>${esc(qt)}</div>`:''}
 ${q.opts.map(o=>`<button class="btn opt glo" data-v="${o.k}">${esc(lab(o))}</button>`).join('')}<div class="small qres"></div>
 <div class="links hidden" id="glMore"><a class="btn" href="#qoida-${x.k}">${esc(tx(x.n))} →</a><button class="btn p" id="glNext">${t('gl_next_q')}</button></div></div>`}

function render(){applyProf();const h=(location.hash||'#bosh').slice(1);let v,tab=h,r2;
 if(/^(dars-\d+|alif-\d+|imtihon-alif|imtihon-tajwid)$/.test(h)&&!stepOpen(h)){v=vLocked(h);tab='darslar'}
 else if(/^dars-\d+$/.test(h)){v=vDars(+h.split('-')[1]-1);tab='darslar'}
 else if(/^alif-\d+$/.test(h)){v=vAlif(+h.split('-')[1]-1);tab='darslar'}
 else if(h==='takror'){v=vTakror();tab='darslar'}
 else if(/^imtihon-(alif|tajwid|review)$/.test(h)){v=vExam(h.split('-')[1]);tab=h.endsWith('review')?'bosh':'darslar'}
 else if(/^sertifikat-(alif|tajwid)$/.test(h)){v=vCert(h.split('-')[1]);tab='bosh'}
 else if(/^qoida-[a-z]+$/.test(h)){v=vQoida(h.slice(6));tab='qoidalar'}
 else if(h==='glmashq'){v=vGlTest();tab='qoidalar'}
 else if(h==='kitob-ms'){v=vKitob();tab='kitob'}
 else if((r2=route2(h))){v=r2.v;tab=r2.tab}
 else v=({bosh:vBosh,darslar:vDarslar,qoidalar:vQoidalar,mushaf:vMushaf2,ustozlar:vUstozlar,mahraj:vMahraj,tekshiruv:vTek,kitob:vKutub,sozlama:vSozlama}[h]||vBosh)();
 navi(tab);$('#view').innerHTML=v;window.scrollTo(0,0);bar();
 if(h==='kitob-ms')bkDlStatus();after2(h);
 if(/^sertifikat-/.test(h)){const cv=$('#cert');if(cv){drawCert(cv,h.split('-')[1]);const a=$('#certSave');try{a.href=cv.toDataURL('image/png')}catch(e){}}}
 $('#ob').innerHTML=prof.onb?'':obHTML()}

// ---------- Ҳодисалар ----------
const say=tt=>{try{const ss=window.speechSynthesis;if(!ss)return false;const v=ss.getVoices().find(x=>/^ar/i.test(x.lang));const u=new SpeechSynthesisUtterance(tt);u.lang=v?v.lang:'ar-SA';if(v)u.voice=v;u.rate=.7;ss.cancel();ss.speak(u);return true}catch(e){return false}};
try{window.speechSynthesis&&window.speechSynthesis.getVoices()}catch(e){}
function answer(btn,ok,box,correctSel){box.querySelectorAll('.opt,.aq').forEach(b=>{b.disabled=true;if(correctSel(b))b.classList.add('ok')});if(!ok)btn.classList.add('no');const r=box.querySelector('.qres');if(r)r.textContent=ok?t('correct'):t('wrong');if(ok)stars(btn);markActive()}
document.addEventListener('click',e=>{const tg=e.target.closest('button,[data-k],.w,.mk');if(!tg)return;const d=tg.dataset;
 if(tg.id==='bkprev'){bkGo(store.get('bkpg',1)-1);return}if(tg.id==='bknext'||tg.id==='bknext2'){bkGo(store.get('bkpg',1)+1);return}
 if(tg.id==='bkok'){const dd=store.get('bkdone',{}),n=store.get('bkpg',1);if(dd[n])delete dd[n];else{dd[n]=1;stars(tg)}store.set('bkdone',dd);markActive();if(dd[n]&&BK&&n<BK.length)bkGo(n+1);else render();return}
 if(tg.id==='bkdlgo'){bkDownload();return}
 if(d.ww){const [s,a,w]=d.ww.split(':').map(Number);tg.classList.add('kw');if(!playWords(s,a,[w],null,()=>tg.classList.remove('kw')))tg.classList.remove('kw');return}
 if(d.bkmus){store.set('sura',+d.bkmus);location.hash='mushaf';return}
 if(tg.classList.contains('glo')){if(GT.ans)return;GT.ans=true;const q=GT.qs[GT.i],ok=d.v===q.x.k;if(ok){GT.score++;const kk=glk();kk[q.x.k]=1;store.set('glk',kk)}answer(tg,ok,tg.closest('.card'),b=>b.dataset.v===q.x.k);$('#glMore').classList.remove('hidden');return}
 if(tg.id==='glNext'){GT.i++;GT.ans=false;render();return}
 if(tg.id==='glAgain'){GT=null;render();return}
 if(tg.id==='glKnow'){const kk=glk();if(kk[d.k])delete kk[d.k];else{kk[d.k]=1;stars(tg)}store.set('glk',kk);markActive();render();return}
 if(tg.classList.contains('w')&&d.s){const hb=tg.closest('.hide .ar');if(hb&&!hb.classList.contains('show')){hb.classList.add('show');return}const s=+d.s,a=+d.a2,w=+d.w;if(TM&&TM.t[s+':'+a]){tg.classList.add('kw');playWords(s,a,[w],null,()=>tg.classList.remove('kw'))}return}
 if(d.ob){if(d.ob==='lang'){prof.lang=d.v;OB=1}else if(d.ob==='name'){prof.name=($('#obName').value||'').trim();OB=2}else if(d.ob==='level'){prof.level=+d.v;OB=3}else if(d.ob==='goal'){prof.goal=+d.v;prof.onb=1;OB=0;saveProf();location.hash=nextLesson()?nextLesson().h:'bosh';render();return}saveProf();$('#ob').innerHTML=obHTML();return}
 if(d.rule){const [li_,ei]=d.rule.split(':').map(Number),l=C.L[li_],[ref,hl,n]=l.ex[ei],[s,a]=ref.split(':').map(Number),w=Q?Q[s-1].v[a-1].split(' '):[],box=tg.closest('.ex');
  const g=playWords(s,a,hl,ms=>{const x=g&&g.find(q=>ms>=q[1]&&ms<q[2]);box.querySelectorAll('.w').forEach(e=>e.classList.toggle('kw',!!x&&+e.dataset.w===x[0]))},()=>box.querySelectorAll('.w.kw').forEach(e=>e.classList.remove('kw')));
  if(g){const dur=g[g.length-1][2]-g[0][1];animate(l.ex[ei][3]||l.anim,dur,hl.map(k=>w[k]).join(' '),esc(tx(n)))}else{$('#stgCap').textContent=t('audio_fail')}
  const st_=$('#stage');if(st_&&st_.getBoundingClientRect().top<0)st_.scrollIntoView({behavior:'smooth',block:'start'});return}
 if(d.ayk){const [s,a]=d.ayk.split(':').map(Number);playAyahK(s,a);return}
 if(d.lw){const lw=TM&&TM.lw[d.lw];if(lw){const g=playWords(lw[0],lw[1],[lw[2]]);const grp=C.MK.flatMap(x=>x[1]).find(r=>r[0].split(' ').includes(d.lw));if(g)animate('izhar',g[0][2]-g[0][1],Q?Q[lw[0]-1].v[lw[1]-1].split(' ')[lw[2]]:'',esc(lw[0]+':'+lw[1]));if(grp)stagePoints([grp[1]])}return}
 if(tg.classList.contains('mk')){const p=d.mk,ls=d.letters.split(' ');stagePoints([p]);document.querySelectorAll('.mk').forEach(b=>b.classList.toggle('sel',b===tg));const c=ls.find(x=>TM&&TM.lw[x.replace('ّ','')]);$('#stgBig').textContent=d.letters;
  const st_=$('#stage');st_.classList.add('on');if(c){const lw=TM.lw[c.replace('ّ','')];playWords(lw[0],lw[1],[lw[2]]);$('#stgCap').textContent=(Q?Q[lw[0]-1].v[lw[1]-1].split(' ')[lw[2]]+' · ':'')+lw[0]+':'+lw[1]}
  if(st_.getBoundingClientRect().top<0)st_.scrollIntoView({behavior:'smooth',block:'start'});return}
 if(d.qi!==undefined){const i=+location.hash.split('-')[1]-1,q=C.L[i].q[+d.qi],box=tg.closest('.card');answer(tg,+d.oi===q[2],box,b=>+b.dataset.oi===q[2]);return}
 if(tg.classList.contains('aq')){answer(tg,d.ans==='1',tg.closest('.card'),b=>b.dataset.ans==='1');return}
 if(tg.classList.contains('exo')){if(EX.ans)return;EX.ans=true;const q=EX.qs[EX.i],ok=d.v===String(q.a);if(ok)EX.score++;answer(tg,ok,tg.closest('.card'),b=>b.dataset.v===String(q.a));$('#exNext').classList.remove('hidden');return}
 if(tg.id==='exNext'){EX.i++;EX.ans=false;render();return}
 if(tg.id==='exRetry'){EX=null;render();return}
 if(tg.id==='exPlay'){const q=EX.qs[EX.i];if(q.lw){const lw=TM.lw[q.lw];playWords(lw[0],lw[1],[lw[2]])}else if(q.rule){const [s,a]=q.rule.ref.split(':').map(Number);playWords(s,a,q.rule.hl)}return}
 if(tg.id==='tkShow'){TK.show=true;render();return}
 if(d.tk!==undefined){tkAns(+d.tk);return}
 if(tg.id==='mkfin'){store.set('mkdone',1);srsSync();stars(tg);location.hash=(pathNext('mahraj')||{h:'darslar'}).h;return}
 if(tg.id==='fin'){const i=+location.hash.split('-')[1]-1,dd=done();dd[i]=1;store.set('done',dd);srsSync();markActive();stars(tg);render();return}
 if(tg.id==='afin'){const i=+location.hash.split('-')[1]-1,dd=doneA();dd[i]=1;store.set('adone',dd);srsSync();markActive();stars(tg);render();return}
 if(d.say){if(!say(d.say)){tg.disabled=true;tg.textContent=t('no_voice')}return}
 if(d.r){store.set('rec',d.r);render();const sh=$('#msSheet.on');if(sh&&sh.dataset.k==='cmp'){const b=sh.querySelector('[data-playr]');if(b)cmpSheet(b.dataset.playr.split('|')[0])}return}
 if(d.c){const c=store.get('cnt',{});c[d.c]=(c[d.c]||0)+1;store.set('cnt',c);tg.textContent=`+1 · ${c[d.c]}/10`;markActive();return}
 if(d.m){const m=memo();if(m[d.m])delete m[d.m];else{m[d.m]=1;stars(tg)}store.set('memo',m);tg.classList.toggle('p',!!m[d.m]);tg.textContent=(m[d.m]?'✓ ':'')+t('memorized');return}
 if(d.k){tg.classList.toggle('show');return}
 if(tg.id==='go'){run();return}if(tg.id==='rec'){recToggle();return}
 if(d.play){playList([d.play.split(':').map(Number)],0);return}
 if(d.playsura){const s=+d.playsura;playList(Q[s-1].v.map((_,i)=>[s,i+1]),0);return}
 if(d.range){const [s0,f,e2]=d.range.split(':').map(Number),l=[];for(let a=f;a<=e2;a++)l.push([s0,a]);playList(l,0);return}
 if(d.rcf){store.set('rcf',d.rcf);render();return}
 if(d.cmp){cmpSheet(d.cmp);return}
 if(d.playr){const [k,id]=d.playr.split('|'),r=R.find(x=>x.id===id);if(r){P.list=[k.split(':').map(Number)];P.i=0;P.left=1;P.ov=r;startCur();document.querySelectorAll('.cmpr').forEach(e=>e.classList.toggle('pl',e.contains(tg)))}return}
 if(d.sample){const r=R.find(x=>x.id===d.sample);if(r){P.ov=r;P.list=[[1,2]];P.i=0;P.left=1;startCur()}return}
 if(d.recref){store.set('tref',d.recref);location.hash='tekshiruv';return}
 if(d.set){if(d.set==='lang')prof.lang=d.v;else if(d.set==='font')prof.font=+d.v;else if(d.set==='theme')prof.theme=d.v;else if(d.set==='goal')prof.goal=+d.v;else if(d.set==='level')prof.level=+d.v;saveProf();render();return}
 if(tg.id==='gShare'){const u=giftLink(($('#gName').value||'').trim());if(navigator.share)navigator.share({title:t('app'),text:t('dua'),url:u}).catch(()=>{});else copy(u);return}
 if(tg.id==='gCopy'){copy(giftLink(($('#gName').value||'').trim()));return}
 if(tg.id==='rst'){$('#rstq').innerHTML=`<p>${t('reset_q')}</p><div class="links"><button class="btn p" id="rstY">${t('yes')}</button><button class="btn" id="rstN">${t('no')}</button></div>`;return}
 if(tg.id==='rstN'){$('#rstq').innerHTML='';return}
 if(tg.id==='rstY'){['done','adone','memo','cnt','certs','days','bkdone','bkpg','glk'].forEach(k=>store.set(k,k==='bkpg'?1:{}));render();return}
 if(tg.id==='certShare'){const cv=$('#cert');cv.toBlob(b=>{const f=new File([b],'sertifikat.png',{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[f]}))navigator.share({files:[f],title:t('certificate')}).catch(()=>{});else{const a=$('#certSave');a.click()}});return}
 if(tg.id==='pplay'){P.a.paused?pl(P.a):P.a.pause();return}
 if(tg.id==='pnext'){if(P.i<P.list.length-1){P.i++;P.left=+store.get('rep',1);startCur()}else{const [s,a]=P.list[P.i];if(Q&&a<Q[s-1].v.length){P.list=[[s,a+1]];P.i=0;P.left=+store.get('rep',1);startCur()}}return}
 if(tg.id==='pprev'){if(P.i>0){P.i--;P.left=+store.get('rep',1);startCur()}else{const [s,a]=P.list[P.i];if(a>1){P.list=[[s,a-1]];P.i=0;P.left=+store.get('rep',1);startCur()}}return}
 if(tg.id==='pclose'){P.a.pause();P.list=[];bar();return}
 if(tg.id==='msprev'){goPage(store.get('mspg',1)-1);return}if(tg.id==='msnext'){goPage(store.get('mspg',1)+1);return}
 if(tg.id==='mszoom'){store.set('msz',store.get('msz',1)>1?1:2);kbUI();return}
 if(tg.id==='msok'){const dd=store.get('msdone',{}),n=store.get('mspg',1);if(dd[n])delete dd[n];else{dd[n]=1;stars(tg)}store.set('msdone',dd);markActive();kbUI();return}});
function copy(u){try{navigator.clipboard.writeText(u).then(()=>{const b=$('#gCopy');if(b)b.textContent=t('copied')})}catch(e){}}
document.addEventListener('input',e=>{if(e.target.id==='glSearch'){const q=e.target.value.trim().toLowerCase();document.querySelectorAll('.glc').forEach(c=>c.style.display=!q||c.dataset.f.includes(q)?'':'none');document.querySelectorAll('.glg').forEach(g=>g.style.display=[...g.querySelectorAll('.glc')].some(c=>c.style.display!=='none')?'':'none');return}if(e.target.id==='gName'){store.set('giftName',e.target.value);$('#gLink').textContent=giftLink(e.target.value.trim())}if(e.target.id==='sName'){prof.name=e.target.value.trim();store.set('prof',prof)}});
document.addEventListener('change',e=>{const id=e.target.id;
 if(id==='sKids'){prof.kids=e.target.checked;saveProf();return}
 if(id==='mspg'){goPage(+e.target.value);return}if(id==='bkpg'){bkGo(+e.target.value);return}if(id==='mspdf'&&e.target.files[0]){setPdf(e.target.files[0]);return}
 if(id==='prep'){store.set('rep',+e.target.value);P.left=+e.target.value;bar();return}if(id==='prate'){store.set('rate',+e.target.value);P.a.playbackRate=+e.target.value;return}
 if(id==='ts'){store.set('tref',e.target.value+':1');render();return}if(id==='ta'){store.set('tref',$('#ts').value+':'+e.target.value);render();return}
 if(id==='sura'){store.set('sura',+e.target.value);render();return}if(id==='hide'){store.set('hide',e.target.checked);render()}});
window.addEventListener('hashchange',()=>{stopSeg();if(!/^#imtihon/.test(location.hash))EX=null;render()});
let rw=0;const ro=new ResizeObserver(()=>{const c=$('#cv1');if(c&&lastA)plot(c,lastA);const w=document.body.clientWidth;if(PDF&&$('#pgcv')&&w!==rw){rw=w;drawPage().catch(()=>{})}});ro.observe(document.body);

// Кутубхона, тарих, қорилар, намоз вақтлари, ҳижрий тақвим, оят расмлари, савол-жавоб.
// app.js дан олдин юкланади: бу ерда фақат функциялар; улар app.js даги t, tx, esc, store, $, Q, R... ни чақирилганда ишлатади.
const L3=()=>['uz','ru','tg'][li()];
const pick=a=>a[li()];

// ---------- Маршрутлар ----------
function route2(h){if(/^sinov-/.test(h)){const x=h.slice(6);return {v:stepOpen(x)?vSinov(x):vLocked(x),tab:'darslar'}}let m;
 if(h==='kitob-tarix')return {v:vTarix(),tab:'kitob'};
 if((m=h.match(/^kitob-tarix-(\d+)$/)))return {v:vTarixCh(+m[1]),tab:'kitob'};
 if(h==='kitob-qori')return {v:vQorilar(),tab:'kitob'};
 if((m=h.match(/^kitob-qori-intro-(\d+)$/)))return {v:vQoriIntro(+m[1]),tab:'kitob'};
 if((m=h.match(/^kitob-qori-([a-z-]+)$/)))return {v:vQori(m[1]),tab:'kitob'};
 if(h==='namoz')return {v:vNamoz(),tab:'kitob'};
 if(h==='taqvim')return {v:vTaqvim(),tab:'kitob'};
 if(h==='oyat')return {v:vOyat(),tab:'kitob'};
 if(h==='savol')return {v:vSavol(),tab:'kitob'};
 if(h==='hifz')return {v:vHifz(),tab:'mushaf'};
 if(h==='qibla')return {v:vQibla(),tab:'bosh'};
 if(h==='tasbeh')return {v:vTasbeh(),tab:'bosh'};
 if(h==='duo')return {v:vDuo(),tab:'bosh'};
 return null}
let PTI=null;
function after2(h){if(PTI){clearInterval(PTI);PTI=null}if(h!=='taqvim'&&store.get('hjoff',0))store.set('hjoff',0);
 if(h==='oyat')ayDraw();
 if(h!=='mushaf')asStop();
 if(h!=='hifz'&&HZF)hfStop(true);
 if(h==='mushaf')msAfter();
 if(h==='hifz')hfAfter();
 if(h==='namoz'||h==='bosh'||h==='')PTI=setInterval(ptTick,1000);
 if(h==='qibla')qbStart();else qbStop();
 if(h==='savol'){const q=store.get('fqq','');const i=$('#fqSearch');if(i&&q){i.value=q;fqFilter(q)}}}

// ---------- Кутубхона жавони ----------
function vKutub(){const ms=Object.keys(store.get('bkdone',{})).length,tx_=Object.keys(store.get('txd',{})).length,MSN=(typeof bkBuild==='function'&&bkBuild())?BK.length:60;
 const bar_=(n,tot)=>`<div class="pbar"><b style="width:${Math.round(n/tot*100)}%"></b></div>`;
 const book=(h,ic,ti,d,n,tot)=>`<a class="card shelf" href="#${h}"><span class="sic">${ic}</span><span style="flex:1"><b>${esc(ti)}</b><br><span class="small">${esc(d)}</span>${tot?bar_(n,tot):''}</span></a>`;
 const nx=ptNext();
 return `<h2>${t('lib_title')}</h2><div class="note">${t('lib_note')}</div>
 <h3>${t('lib_books')}</h3><div class="grid">
 ${book('kitob-ms','📗',t('bk_title'),t('lib_ms_d'),ms,MSN)}
 ${book('kitob-tarix','📜',t('tx_title'),t('tx_d'),tx_,C.TX.length)}
 ${book('kitob-qori','🎙',t('qb_title'),t('qb_d'))}</div>
 <h3>${t('lib_tools')}</h3><div class="grid">
 ${book('namoz','🕌',t('pt_title'),nx?t('pt_next',{p:nx.n,t:nx.s}):t('pt_d'))}
 ${book('taqvim','🌙',t('hj_title'),hjStr(new Date())||t('hj_d'))}
 ${book('oyat','🖼',t('ay_title'),t('ay_d'))}
 ${book('savol','❓',t('fq_title'),t('fq_d',{n:FQA().length}))}
 <a class="card shelf" href="${ZK}" target="_blank" rel="noopener"><span class="sic">📚</span><span style="flex:1"><b>${t('zk_title')} ↗</b><br><span class="small">${t('zk_d')}</span></span></a></div>`}
function homeExtra(){const nx=ptNext(),hj=hjStr(new Date());
 return `<div class="card"><div class="prow"><span>🕌 ${nx?esc(t('pt_next',{p:nx.n,t:nx.s})):t('pt_title')}</span><a href="#namoz">→</a></div>
 ${hj?`<div class="prow"><span>🌙 ${esc(hj)}</span><a href="#taqvim">→</a></div>`:''}
 <div class="links"><a class="btn" href="#savol">❓ ${t('fq_title')}</a><a class="btn" href="#oyat">🖼 ${t('ay_title')}</a></div></div>`}

// ---------- 1. Тарих китоби ----------
function vTarix(){const dn=store.get('txd',{});
 return `<p><a href="#kitob">${t('lib_back')}</a></p><h2>📜 ${t('tx_title')}</h2>
 <div class="grid">${C.TX.map((c,i)=>`<a class="card lesson" href="#kitob-tarix-${i+1}"><span class="num${dn[i+1]?' done':''}">${dn[i+1]?'✓':i+1}</span><span><b>${esc(tx(c.t))}</b></span></a>`).join('')}</div>`}
function vTarixCh(n){const N=C.TX.length;if(n<1||n>N)return vTarix();const c=C.TX[n-1],dn=store.get('txd',{});
 let extra='';
 if(c.map)extra=`<h3>${t('tx_map_l')}</h3><div class="grid">${C.L.map((l,i)=>`<a class="card lesson" href="#dars-${i+1}"><span class="num">${i+1}</span><span><b>${esc(tx(l.t))}</b><br><span class="small">${esc(tx(l.k))}</span></span></a>`).join('')}</div>
 <h3>${t('tx_map_g')}</h3>${C.GL.map((g,gi)=>`<div class="card"><b>${esc(tx(g.g))}</b><div class="links">${GLA.filter(x=>x.g===gi).map(x=>`<a class="btn" href="#qoida-${x.k}">${esc(tx(x.n))}</a>`).join('')}</div></div>`).join('')}`;
 return `<p><a href="#kitob-tarix">${t('tx_back')}</a></p><h2>${n}. ${esc(tx(c.t))}</h2>
 <div class="card prose">${tx(c.b)}</div>${extra}
 <div class="row" style="margin-top:14px;justify-content:space-between">
 ${n>1?`<a class="btn" href="#kitob-tarix-${n-1}">${t('gl_prev')}</a>`:'<span></span>'}
 <button class="btn${dn[n]?'':' p'}" id="txok" data-n="${n}">${dn[n]?'✓ '+t('ch_read'):t('bk_read')}</button>
 ${n<N?`<a class="btn" href="#kitob-tarix-${n+1}">${t('gl_next')}</a>`:'<span></span>'}</div>`}

// ---------- 2. Қорилар китоби ----------
function vQorilar(){const card=q=>`<a class="card lesson" href="#kitob-qori-${q.id}"><span class="num">🎙</span><span><b>${esc(tx(q.n))}</b> <span class="small">(${esc(tx(q.y))})</span><br><span class="small">${esc(tx(q.who))}</span></span></a>`;
 return `<p><a href="#kitob">${t('lib_back')}</a></p><h2>🎙 ${t('qb_title')}</h2>
 <div class="grid">${C.QINTRO.map((c,i)=>`<a class="card lesson" href="#kitob-qori-intro-${i+1}"><span class="num">${i+1}</span><span><b>${esc(tx(c.t))}</b></span></a>`).join('')}</div>
 <h3>${t('qb_old')}</h3><div class="grid">${C.QB.filter(q=>q.e==='old').map(card).join('')}</div>
 <h3>${t('qb_new')}</h3><div class="grid">${C.QB.filter(q=>q.e==='new').map(card).join('')}</div>`}
function vQoriIntro(n){const N=C.QINTRO.length;if(n<1||n>N)return vQorilar();const c=C.QINTRO[n-1];
 return `<p><a href="#kitob-qori">${t('qb_back')}</a></p><h2>${esc(tx(c.t))}</h2><div class="card prose">${tx(c.b)}</div>
 <div class="row" style="margin-top:14px;justify-content:space-between">${n>1?`<a class="btn" href="#kitob-qori-intro-${n-1}">${t('gl_prev')}</a>`:'<span></span>'}${n<N?`<a class="btn" href="#kitob-qori-intro-${n+1}">${t('gl_next')}</a>`:`<a class="btn" href="#kitob-qori">${t('qb_back')}</a>`}</div>`}
function vQori(id){const i=C.QB.findIndex(q=>q.id===id);if(i<0)return vQorilar();const q=C.QB[i],p=C.QB[i-1],nx=C.QB[i+1],has=R.some(r=>r.id===id);
 return `<p><a href="#kitob-qori">${t('qb_back')}</a></p>
 <div class="card"><h2 style="margin:0 0 4px">${esc(tx(q.n))}</h2><div class="small">${esc(tx(q.y))} · ${t(q.e==='old'?'qb_old':'qb_new')}</div>
 <p>${esc(tx(q.b))}</p><div class="note"><b>${t('qb_for')}:</b> ${esc(tx(q.who))}</div>
 ${has?`<div class="links"><button class="btn p" data-sample="${q.id}">▶ ${t('qb_listen')}</button></div>`:''}</div>
 <div class="row" style="margin-top:14px;justify-content:space-between">${p?`<a class="btn" href="#kitob-qori-${p.id}">${t('gl_prev')}</a>`:'<span></span>'}${nx?`<a class="btn" href="#kitob-qori-${nx.id}">${t('gl_next')}</a>`:'<span></span>'}</div>`}

// ---------- 3. Намоз вақтлари ----------
const PT=(()=>{const r=Math.PI/180,sn=d=>Math.sin(d*r),cs=d=>Math.cos(d*r),tn=d=>Math.tan(d*r),asn=x=>Math.asin(x)/r,acs=x=>Math.acos(Math.max(-1,Math.min(1,x)))/r,at2=(y,x)=>Math.atan2(y,x)/r,acot=x=>Math.atan(1/x)/r,fx=(a,b)=>{a=a-b*Math.floor(a/b);return a<0?a+b:a};
 const jul=(y,m,d)=>{if(m<=2){y--;m+=12}const A=Math.floor(y/100),B=2-A+Math.floor(A/4);return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524.5};
 const sun=jd=>{const D=jd-2451545,g=fx(357.529+.98560028*D,360),q=fx(280.459+.98564736*D,360),L=fx(q+1.915*sn(g)+.020*sn(2*g),360),e=23.439-.00000036*D,RA=fx(at2(cs(e)*sn(L),cs(L))/15,24);return {decl:asn(sn(e)*sn(L)),eqt:q/15-RA}};
 return (date,lat,lon,tz,af)=>{const JD=jul(date.getFullYear(),date.getMonth()+1,date.getDate())-lon/(15*24);
  const mid=t=>fx(12-sun(JD+t).eqt,24);
  const ang=(a,t,ccw)=>{const d=sun(JD+t).decl,T=acs((-sn(a)-sn(d)*sn(lat))/(cs(d)*cs(lat)))/15;return mid(t)+(ccw?-T:T)};
  const asr=(f,t)=>{const d=sun(JD+t).decl;return ang(-acot(f+tn(Math.abs(lat-d))),t)};
  let T={f:5,s:6,d:12,a:13,m:18,i:18};
  for(let k=0;k<2;k++){const p=x=>x/24;T={f:ang(18,p(T.f),1),s:ang(.833,p(T.s),1),d:mid(p(T.d)),a:asr(af||2,p(T.a)),m:ang(.833,p(T.m)),i:ang(17,p(T.i))}}
  for(const k in T)T[k]=T[k]+tz-lon/15;return T}})();
const PK=['f','s','d','a','m','i'],PN={f:'pt_fajr',s:'pt_sun',d:'pt_dhuhr',a:'pt_asr',m:'pt_maghrib',i:'pt_isha'};
const hm=x=>{let m=Math.round(x*60);m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
function ptPlace(){const p=store.get('pcity',null);if(p&&p.lat!=null)return {n:t('pt_mine'),lat:p.lat,lon:p.lon,tz:p.tz};
 const i=p&&p.i!=null?p.i:(prof.lang==='tg'?18:0),c=C.CITY[i]||C.CITY[0];return {i,n:lt_(pick(c.slice(0,3))),lat:c[3],lon:c[4],tz:5}}
function ptDay(d){const p=ptPlace();return PT(d,p.lat,p.lon,p.tz,store.get('asrf',2))}
function ptNext(){try{const now=new Date(),T=ptDay(now),p=ptPlace(),nm=(now.getUTCHours()+now.getUTCMinutes()/60+p.tz+24)%24;
 for(const k of ['f','d','a','m','i']){if(T[k]>nm)return {k,n:t(PN[k]),s:hm(T[k]),left:T[k]-nm}}
 const tm=new Date(now);tm.setDate(tm.getDate()+1);const T2=ptDay(tm);return {k:'f',n:t('pt_fajr'),s:hm(T2.f),left:T2.f+24-nm}}catch(e){return null}}
function ptTick(){document.querySelectorAll('[data-cd]').forEach(e=>{const nw=ptNow();if(nw)e.innerHTML=fmtLeft(nw.left)});const el=$('#ptLeft');if(!el)return;const nx=ptNext();if(!nx)return;const L=Math.max(0,Math.round(nx.left*60));el.textContent=t('pt_left',{h:Math.floor(L/60),m:L%60});const b=$('#ptNx');if(b)b.textContent=t('pt_next',{p:nx.n,t:nx.s})}
const WD={uz:['Як','Ду','Се','Чо','Па','Жу','Ша'],ru:['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],tg:['Як','Ду','Се','Чо','Па','Ҷу','Ша']};
function vNamoz(){const p=ptPlace(),now=new Date(),T=ptDay(now),nx=ptNext(),L=nx?Math.max(0,Math.round(nx.left*60)):0;
 const opts=C.CITY.map((c,i)=>`<option value="${i}"${p.i===i?' selected':''}>${esc(lt_(pick(c.slice(0,3))))}</option>`).join('');
 const days=[...Array(7)].map((_,k)=>{const d=new Date(now);d.setDate(d.getDate()+k);return [d,ptDay(d)]});
 return `<p><a href="#kitob">${t('lib_back')}</a></p><h2>🕌 ${t('pt_title')}</h2>
 <div class="row" style="gap:8px;flex-wrap:wrap"><select id="ptCity" class="inp" style="flex:1;min-width:160px">${p.i==null?`<option selected>${t('pt_mine')}</option>`:''}${opts}</select><button class="btn" id="ptGeo">${t('pt_geo')}</button></div>
 <div class="small" id="ptMsg"></div>
 ${nx?`<div class="card plan" style="text-align:center"><b id="ptNx" style="font-size:20px">${esc(t('pt_next',{p:nx.n,t:nx.s}))}</b><div class="small" id="ptLeft">${t('pt_left',{h:Math.floor(L/60),m:L%60})}</div></div>`:''}
 <div class="card"><div class="small">${esc(p.n)} · ${hjStr(now)||''}</div>
 ${PK.map(k=>{const nw=ptNow(),on=nw&&nw.k===k;return `<div class="prow pt${on?' ptn':''}"><span>${t(PN[k])}${on?`<span class="ptc" data-cd>${fmtLeft(nw.left)}</span>`:''}</span><b>${hm(T[k])}</b></div>`}).join('')}</div>
 <div class="card"><b>${t('pt_asr_m')}</b><div class="links"><button class="btn${store.get('asrf',2)===2?' p':''}" data-asrf="2">${t('pt_hanafi')}</button><button class="btn${store.get('asrf',2)===1?' p':''}" data-asrf="1">${t('pt_shafii')}</button></div></div>
 <h3>${t('pt_week')}</h3><div class="card" style="overflow-x:auto"><table class="ptt"><tr><th></th>${PK.map(k=>`<th>${t(PN[k])}</th>`).join('')}</tr>
 ${days.map(([d,X])=>`<tr><td>${WD[L3()][d.getDay()]} ${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}</td>${PK.map(k=>`<td>${hm(X[k])}</td>`).join('')}</tr>`).join('')}</table></div>
 <div class="note">${t('pt_note')}</div>`}

// ---------- 4. Ҳижрий тақвим ----------
const HF=(()=>{try{return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{day:'numeric',month:'numeric',year:'numeric'})}catch(e){return null}})();
const hij=d=>{if(!HF)return null;try{const p=HF.formatToParts(d),g=k=>+((p.find(x=>x.type===k)||{}).value);const r={d:g('day'),m:g('month'),y:g('year')};return r.d&&r.m&&r.y?r:null}catch(e){return null}};
const HM={uz:['Муҳаррам','Сафар','Рабиъул-аввал','Рабиъус-соний','Жумодул-аввал','Жумодус-соний','Ражаб','Шаъбон','Рамазон','Шаввол','Зулқаъда','Зулҳижжа'],
 ru:['Мухаррам','Сафар','Раби аль-авваль','Раби ас-сани','Джумада аль-уля','Джумада ас-сани','Раджаб','Шабан','Рамадан','Шавваль','Зуль-када','Зуль-хиджа'],
 tg:['Муҳаррам','Сафар','Рабеъулаввал','Рабеъуссонӣ','Ҷумодиулаввал','Ҷумодиуссонӣ','Раҷаб','Шаъбон','Рамазон','Шаввол','Зулқаъда','Зулҳиҷҷа']};
const GM={uz:['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'],
 ru:['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],
 tg:['январ','феврал','март','апрел','май','июн','июл','август','сентябр','октябр','ноябр','декабр']};
const GMN={uz:GM.uz,ru:['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],tg:GM.tg};
const lt_=s=>lang()==='uzl'?lat(s):s;
const hjStr=d=>{const h=hij(d);return h?lt_(`${h.d} ${HM[L3()][h.m-1]} ${h.y}`+(L3()==='ru'?' г.х.':' ҳ.')):''};
const gStr=d=>lt_(`${d.getDate()} ${GM[L3()][d.getMonth()]} ${d.getFullYear()}`);
const HEV=[[1,1,'hj_ev_ny'],[1,10,'hj_ev_ash'],[9,1,'hj_ev_ram'],[9,26,'hj_ev_qadr'],[10,1,'hj_ev_fitr'],[12,9,'hj_ev_arafa'],[12,10,'hj_ev_adha']];
function hjEvents(){const now=new Date();now.setHours(12,0,0,0);const out=[],seen={};
 for(let k=0;k<400&&out.length<HEV.length;k++){const d=new Date(now);d.setDate(d.getDate()+k);const h=hij(d);if(!h)break;const e=HEV.find(x=>x[0]===h.m&&x[1]===h.d);if(e&&!seen[e[2]]){seen[e[2]]=1;out.push({d,k,e,h})}}return out}
function vTaqvim(){const now=new Date(),h=hij(now),off=store.get('hjoff',0),base=new Date(now.getFullYear(),now.getMonth()+off,1,12);
 if(!h)return `<p><a href="#kitob">${t('lib_back')}</a></p><h2>🌙 ${t('hj_title')}</h2><div class="note">${t('hj_note')}</div>`;
 const first=(base.getDay()+6)%7,nd=new Date(base.getFullYear(),base.getMonth()+1,0).getDate(),evs=HEV;
 const hs=new Set();let cells='';for(let i=0;i<first;i++)cells+='<span></span>';
 for(let d=1;d<=nd;d++){const dt=new Date(base.getFullYear(),base.getMonth(),d,12),x=hij(dt);if(x)hs.add(HM[L3()][x.m-1]+' '+x.y);
  const isT=dt.toDateString()===now.toDateString(),ev=x&&evs.find(e=>e[0]===x.m&&e[1]===x.d);
  cells+=`<span class="hc${isT?' tod':''}${ev?' ev':''}"${ev?` title="${esc(t(ev[2]))}"`:''}><b>${d}</b><i>${x?x.d:''}</i></span>`}
 const wh=(L3()==='ru'?['Пн','Вт','Ср','Чт','Пт','Сб','Вс']:L3()==='tg'?['Ду','Се','Чо','Па','Ҷу','Ша','Як']:['Ду','Се','Чо','Па','Жу','Ша','Як']).map(x=>`<span class="hw">${lt_(x)}</span>`).join('');
 return `<p><a href="#kitob">${t('lib_back')}</a></p><h2>🌙 ${t('hj_title')}</h2>
 <div class="card plan" style="text-align:center"><div class="small">${t('hj_today')}: ${esc(gStr(now))}</div><b style="font-size:22px">${esc(hjStr(now))}</b></div>
 <div class="card"><div class="row" style="justify-content:space-between;align-items:center;flex-wrap:nowrap"><button class="btn" id="hjPrev">←</button><b style="text-align:center;flex:1">${lt_(GMN[L3()][base.getMonth()])} ${base.getFullYear()}<br><span class="small">${esc(lt_([...hs].join(' — ')))}</span></b><button class="btn" id="hjNext">→</button></div>
 <div class="hcal">${wh}${cells}</div></div>
 <h3>${t('hj_days')}</h3>${hjEvents().map(x=>`<div class="card prow"><span><b>${t(x.e[2])}</b><br><span class="small">${esc(lt_(`${x.h.d} ${HM[L3()][x.h.m-1]} ${x.h.y}`))}</span></span><span style="text-align:right">${esc(gStr(x.d))}<br><span class="small">${x.k?t('hj_in',{n:x.k}):t('hj_today')}</span></span></div>`).join('')}
 <div class="note">${t('hj_note')}</div>`}

// ---------- 5. Оят расмлари ----------
const AYP=['1:5','2:152','2:186','2:201','2:286','3:8','3:173','13:28','17:24','20:25','20:114','25:74','29:69','39:53','65:3','94:5','94:6','112:1'];
const AYT={
 night:{i:'🌙',pv:'linear-gradient(180deg,#0b1030,#2b2a6b 70%,#0a0d22)',ink:'#ffffff',gold:'#e8c76a'},
 dunes:{i:'🏜',pv:'linear-gradient(180deg,#2a1b4d,#c8553d 55%,#f2a65a)',ink:'#ffffff',gold:'#ffe1a0'},
 girih:{i:'✴',pv:'radial-gradient(circle,#1f6b52,#0a2e24)',ink:'#ffffff',gold:'#d9b45a'},
 paper:{i:'📜',pv:'radial-gradient(circle,#fbf3dc,#e6d3a3)',ink:'#2b2116',gold:'#9a7420'},
 sea:{i:'🌊',pv:'linear-gradient(180deg,#ffd9a8,#f39b7f 40%,#2f5d8a 60%,#123456)',ink:'#ffffff',gold:'#fff0c8'},
 mihrab:{i:'🕌',pv:'linear-gradient(135deg,#0f2a4a,#1d4e89)',ink:'#ffffff',gold:'#d4af37'},
 photo:{i:'📷',pv:'linear-gradient(135deg,#555,#999)',ink:'#ffffff',gold:'#f3d27a'}};
let AYIMG=null;
function ayRnd(seed){let x=seed>>>0||1;return ()=>{x^=x<<13;x>>>=0;x^=x>>17;x^=x<<5;x>>>=0;return x/4294967296}}
function aySky(c,W,H,stops){const g=c.createLinearGradient(0,0,0,H);stops.forEach(([p,col])=>g.addColorStop(p,col));c.fillStyle=g;c.fillRect(0,0,W,H)}
function ayMosque(c,W,base,col,sc){c.fillStyle=col;const cx=W/2,u=sc;c.beginPath();
 // асосий гумбаз ва бино
 c.fillRect(cx-170*u,base-120*u,340*u,120*u);c.moveTo(cx-130*u,base-120*u);c.bezierCurveTo(cx-130*u,base-260*u,cx-20*u,base-300*u,cx,base-330*u);c.bezierCurveTo(cx+20*u,base-300*u,cx+130*u,base-260*u,cx+130*u,base-120*u);c.fill();
 c.fillRect(cx-2*u,base-370*u,4*u,45*u);c.beginPath();c.arc(cx,base-372*u,7*u,0,7);c.fill();
 // кичик гумбазлар
 [[-250,70],[250,70]].forEach(([dx,r])=>{c.fillRect(cx+dx*u-r*u,base-90*u,2*r*u,90*u);c.beginPath();c.arc(cx+dx*u,base-90*u,r*u,Math.PI,0);c.fill()});
 // миноралар
 [[-360],[360]].forEach(([dx])=>{const x=cx+dx*u;c.fillRect(x-16*u,base-420*u,32*u,420*u);c.fillRect(x-24*u,base-330*u,48*u,14*u);c.beginPath();c.moveTo(x-18*u,base-420*u);c.lineTo(x,base-480*u);c.lineTo(x+18*u,base-420*u);c.fill()});
 c.fillRect(0,base-8*u,W,8*u+600)}
function ayStar8(c,x,y,r){c.beginPath();for(let k=0;k<16;k++){const a=Math.PI/8*k,rr=k%2?r*.62:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}c.closePath()}
function ayBg(c,W,H,k,rnd){
 if(k==='night'){aySky(c,W,H,[[0,'#070b24'],[.55,'#1f2160'],[.85,'#3b2f6e'],[1,'#0a0d22']]);
  for(let i=0;i<260;i++){const x=rnd()*W,y=rnd()*H*.75,r=rnd()*2.2+.3;c.globalAlpha=.3+rnd()*.7;c.fillStyle='#fff';c.beginPath();c.arc(x,y,r,0,7);c.fill()}c.globalAlpha=1;
  const mx=W*.8,my=H*.12,mr=60;const gl=c.createRadialGradient(mx,my,10,mx,my,220);gl.addColorStop(0,'rgba(255,240,200,.35)');gl.addColorStop(1,'rgba(255,240,200,0)');c.fillStyle=gl;c.fillRect(0,0,W,H*.5);
  c.fillStyle='#f6e7b0';c.beginPath();c.arc(mx,my,mr,Math.PI*.3,Math.PI*1.7,false);c.arc(mx+30,my-12,mr*.88,Math.PI*1.62,Math.PI*.38,true);c.closePath();c.fill();
  ayMosque(c,W,H-40,'#05071a',W/1080*1.05);return}
 if(k==='dunes'){aySky(c,W,H,[[0,'#24184a'],[.35,'#7a2f5c'],[.6,'#e0663f'],[.78,'#f7b267'],[1,'#f7b267']]);
  const sy=H*.66,g=c.createRadialGradient(W/2,sy,10,W/2,sy,W*.6);g.addColorStop(0,'rgba(255,230,160,.9)');g.addColorStop(.15,'rgba(255,200,120,.5)');g.addColorStop(1,'rgba(255,200,120,0)');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.fillStyle='#ffe7a8';c.beginPath();c.arc(W/2,sy,70,0,7);c.fill();
  [['#b5452f',.70,60],['#8a2f2a',.78,80],['#5a1f2a',.88,70],['#2c1020',.96,50]].forEach(([col,yy,amp],i)=>{c.fillStyle=col;c.beginPath();c.moveTo(0,H);const y0=H*yy;for(let x=0;x<=W;x+=20)c.lineTo(x,y0-Math.sin(x/W*Math.PI*(1.3+i*.4)+i)*amp);c.lineTo(W,H);c.fill()});
  // туялар карвони
  c.fillStyle='#2c1020';const cy=H*.84;[[.62,1],[.69,.9],[.75,.8]].forEach(([fx,s])=>{const x=W*fx,u=s*1.1;c.beginPath();c.ellipse(x,cy-38*u,34*u,16*u,0,0,7);c.fill();c.beginPath();c.ellipse(x-6*u,cy-54*u,14*u,12*u,0,0,7);c.fill();c.fillRect(x+26*u,cy-80*u,7*u,42*u);c.beginPath();c.ellipse(x+36*u,cy-80*u,10*u,6*u,0,0,7);c.fill();[-24,-12,14,24].forEach(d=>c.fillRect(x+d*u,cy-30*u,5*u,34*u))});return}
 if(k==='girih'){const g=c.createRadialGradient(W/2,H/2,50,W/2,H/2,Math.max(W,H)*.75);g.addColorStop(0,'#1d6a51');g.addColorStop(1,'#06251c');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.strokeStyle='rgba(217,180,90,.28)';c.lineWidth=2;const S=135;for(let y=0;y<H+S;y+=S)for(let x=0;x<W+S;x+=S){ayStar8(c,x,y,S*.42);c.stroke();c.save();c.translate(x+S/2,y+S/2);c.rotate(Math.PI/4);c.strokeRect(-S*.2,-S*.2,S*.4,S*.4);c.restore();c.beginPath();c.moveTo(x+S*.42,y);c.lineTo(x+S-S*.42,y);c.moveTo(x,y+S*.42);c.lineTo(x,y+S-S*.42);c.stroke()}
  const v=c.createRadialGradient(W/2,H/2,W*.25,W/2,H/2,W*.75);v.addColorStop(0,'rgba(6,37,28,.85)');v.addColorStop(1,'rgba(6,37,28,0)');c.fillStyle=v;c.fillRect(0,0,W,H);return}
 if(k==='paper'){c.fillStyle='#f4e8c8';c.fillRect(0,0,W,H);const im=c.getImageData(0,0,W,H),d=im.data;for(let i=0;i<d.length;i+=4){const n=(rnd()-.5)*22;d[i]+=n;d[i+1]+=n;d[i+2]+=n*.8}c.putImageData(im,0,0);
  const v=c.createRadialGradient(W/2,H/2,W*.3,W/2,H/2,Math.max(W,H)*.75);v.addColorStop(0,'rgba(120,80,20,0)');v.addColorStop(1,'rgba(120,80,20,.45)');c.fillStyle=v;c.fillRect(0,0,W,H);
  // безакли ҳошия
  c.strokeStyle='#9a7420';c.lineWidth=5;c.strokeRect(50,50,W-100,H-100);c.lineWidth=2;c.strokeRect(70,70,W-140,H-140);
  c.fillStyle='rgba(154,116,32,.85)';for(let x=95;x<W-80;x+=50){ayStar8(c,x,60,9);c.fill();ayStar8(c,x,H-60,9);c.fill()}for(let y=95;y<H-80;y+=50){ayStar8(c,60,y,9);c.fill();ayStar8(c,W-60,y,9);c.fill()}
  [[110,110],[W-110,110],[110,H-110],[W-110,H-110]].forEach(([x,y])=>{c.fillStyle='#9a7420';ayStar8(c,x,y,26);c.fill();c.fillStyle='#f4e8c8';ayStar8(c,x,y,12);c.fill()});return}
 if(k==='sea'){aySky(c,W,H,[[0,'#3a4f8f'],[.3,'#f39b7f'],[.5,'#ffd9a8'],[.52,'#5a7fa8'],[1,'#0f2d4f']]);const hz=H*.52;
  c.fillStyle='#fff3d0';c.beginPath();c.arc(W*.5,hz,58,Math.PI,0);c.fill();
  c.fillStyle='rgba(60,50,90,.55)';c.beginPath();c.moveTo(0,hz);[[.12,-120],[.25,-60],[.38,-150],[.5,-40]].forEach(([fx,dy])=>c.lineTo(W*fx,hz+dy));c.lineTo(W*.5,hz);c.fill();
  c.fillStyle='rgba(40,40,80,.6)';c.beginPath();c.moveTo(W*.55,hz);[[.68,-90],[.8,-170],[.92,-70],[1,-110]].forEach(([fx,dy])=>c.lineTo(W*fx,hz+dy));c.lineTo(W,hz);c.fill();
  for(let i=0;i<70;i++){const y=hz+8+Math.pow(rnd(),1.6)*(H*.86-hz),w=20+rnd()*120*(y-hz)/(H-hz)+10,x=W*.5+(rnd()-.5)*(80+(y-hz)*.9);c.globalAlpha=.25+rnd()*.4;c.fillStyle='#ffe9c0';c.fillRect(x-w/2,y,w,2+rnd()*2)}c.globalAlpha=1;
  for(let i=0;i<5;i++){const bx=W*(.2+i*.13),by=H*(.18+rnd()*.12),s=8+rnd()*8;c.strokeStyle='rgba(30,30,50,.7)';c.lineWidth=3;c.beginPath();c.moveTo(bx-s,by);c.quadraticCurveTo(bx-s/2,by-s*.6,bx,by);c.quadraticCurveTo(bx+s/2,by-s*.6,bx+s,by);c.stroke()}return}
 if(k==='photo'&&AYIMG){const iw=AYIMG.width,ih=AYIMG.height,sc=Math.max(W/iw,H/ih);c.drawImage(AYIMG,(W-iw*sc)/2,(H-ih*sc)/2,iw*sc,ih*sc);const o=c.createLinearGradient(0,0,0,H);o.addColorStop(0,'rgba(0,0,0,.35)');o.addColorStop(.5,'rgba(0,0,0,.55)');o.addColorStop(1,'rgba(0,0,0,.7)');c.fillStyle=o;c.fillRect(0,0,W,H);return}
 // mihrab (ёки расм танланмаган бўлса)
 const g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,'#0f2a4a');g.addColorStop(1,'#1d4e89');c.fillStyle=g;c.fillRect(0,0,W,H);
 c.save();c.globalAlpha=.08;c.strokeStyle='#d4af37';c.lineWidth=2;for(let y=0;y<H+120;y+=120)for(let x=0;x<W+120;x+=120){ayStar8(c,x,y,44);c.stroke()}c.restore()}
function ayArch(c,x0,y0,w,h,col,lw){const cx=x0+w/2,r=w/2;c.beginPath();c.moveTo(x0,y0+h);c.lineTo(x0,y0+r*1.1);c.bezierCurveTo(x0,y0+r*.35,cx-r*.35,y0+r*.15,cx,y0);c.bezierCurveTo(cx+r*.35,y0+r*.15,x0+w,y0+r*.35,x0+w,y0+r*1.1);c.lineTo(x0+w,y0+h);c.closePath();if(lw){c.strokeStyle=col;c.lineWidth=lw;c.stroke()}else{c.fillStyle=col;c.fill()}}
function vOyat(){if(!Q)return `<p><a href="#kitob">${t('lib_back')}</a></p><h2>🖼 ${t('ay_title')}</h2><p class="small">${t('loading')}</p>`;
 const [s,a]=store.get('ayref','94:5').split(':').map(Number),th=AYT[store.get('ayth','night')]?store.get('ayth','night'):'night',sz=store.get('aysz','sq'),N=Q[s-1].v.length,tr=store.get('aytr',true);
 return `<p><a href="#kitob">${t('lib_back')}</a></p><h2>🖼 ${t('ay_title')}</h2>
 <div class="card"><div class="row" style="gap:8px;flex-wrap:wrap">
 <label style="flex:2;min-width:150px" class="small">${t('ay_sura')}<select id="aySura" class="inp" style="width:100%">${Q.map((q,i)=>`<option value="${i+1}"${i+1===s?' selected':''}>${i+1}. ${esc(q.tr)} ${q.ar}</option>`).join('')}</select></label>
 <label style="flex:1;min-width:80px" class="small">${t('ay_ayah')}<select id="ayNum" class="inp" style="width:100%">${Array.from({length:N},(_,i)=>`<option${i+1===a?' selected':''}>${i+1}</option>`).join('')}</select></label></div>
 <div class="small" style="margin-top:10px">${t('ay_theme')}:</div><div class="aythm">${Object.keys(AYT).map(k=>`<button class="ayt${k===th?' on':''}" data-ayth="${k}" style="background:${AYT[k].pv}"><span>${AYT[k].i}</span><small>${t('ayt_'+k)}</small></button>`).join('')}</div>
 ${th==='photo'?`<label class="btn" style="margin-top:8px;display:inline-block">🖼 ${t('ay_photo')}<input type="file" id="ayFile" accept="image/*" hidden></label>${AYIMG?'':` <span class="small">${t('ay_photo_h')}</span>`}`:''}
 <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:10px"><span class="small">${t('ay_size')}:</span><button class="btn${sz==='sq'?' p':''}" data-aysz="sq">${t('ay_sq')}</button><button class="btn${sz==='st'?' p':''}" data-aysz="st">${t('ay_story')}</button>
 <label class="row small" style="margin-left:8px"><input type="checkbox" id="ayTr"${tr?' checked':''}> ${t('ay_withtr')}</label></div></div>
 <div class="small" id="ayMsg"></div>
 <canvas id="aycv" style="width:100%;max-width:${sz==='st'?360:520}px;display:block;margin:8px auto;border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,.25)"></canvas>
 <div class="links" style="justify-content:center"><button class="btn p" id="ayDl">${t('ay_save')}</button><button class="btn" id="ayShare">${t('ay_share')}</button><button class="btn" data-ayk="${s}:${a}">${t('ay_listen')}</button></div>
 <h3>${t('ay_pick')}</h3><div class="links">${AYP.map(r=>{const [x]=r.split(':');return `<button class="btn${r===s+':'+a?' p':''}" data-ayp="${r}">${esc(Q[x-1].tr)} ${r}</button>`}).join('')}</div>`}
const arNum=n=>String(n).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);
function ayWrap(c,text,maxW){const words=text.split(/\s+/),lines=[];let cur='';for(const w of words){const tt=cur?cur+' '+w:w;if(c.measureText(tt).width>maxW&&cur){lines.push(cur);cur=w}else cur=tt}if(cur)lines.push(cur);return lines}
let AYN=0;
async function ayDraw(){const cv=$('#aycv');if(!cv||!Q)return;const my=++AYN;const [s,a]=store.get('ayref','94:5').split(':').map(Number),k0=store.get('ayth','night'),k=AYT[k0]?k0:'night',th=AYT[k],st=store.get('aysz','sq')==='st',wtr=store.get('aytr',true);
 const W=1080,H=st?1920:1080;cv.width=W;cv.height=H;const c=cv.getContext("2d");if(!c)return;
 try{await Promise.all([document.fonts.load('60px "KFGQPC Hafs"'),document.fonts.load('60px "Amiri Quran"'),document.fonts.load('40px "Amiri"'),document.fonts.load('600 30px "Noto Sans"')])}catch(e){}
 let trT='',trA='';if(wtr){const l=trL()==='ar'?'uz':trL();try{const d=await trGet(TRK[l][0],s);trT=(d[a]&&d[a].t||'').replace(/\s*\[\d+\]/g,'').replace(/^\d+[.)]\s*/,'').trim();trA=tx(TRK[l][1])}catch(e){}}
 if(my!==AYN||!$('#aycv'))return;
 ayBg(c,W,H,k,ayRnd(s*1000+a));
 const ink=th.ink,gold=th.gold,scene=k==='night'||k==='dunes'||k==='sea';
 // матн майдони
 const top=st?260:120,bottom=scene?(st?H*.62:H*.6):H-(st?330:200),pad=st?110:120,maxW=W-pad*2;
 // ойна/равоқ
 if(k==='mihrab'||k==='girih'||k==='photo'){const aw=W-120,ax=60,ay=top-60,ah=H-(st?90:50)-ay;c.save();ayArch(c,ax,ay,aw,ah,k==='photo'?'rgba(0,0,0,.25)':'rgba(255,255,255,.05)');ayArch(c,ax,ay,aw,ah,gold,5);ayArch(c,ax+16,ay+22,aw-32,ah-22,gold,1.5);c.restore()}
 const avail=bottom-top;let tl=[],tf=0,tlh=0;c.direction='ltr';c.textAlign='center';
 if(trT){tf=st?40:34;for(;tf>=22;tf-=2){c.font=`italic ${tf}px "Noto Sans",sans-serif`;tl=ayWrap(c,'«'+trT+'»',maxW+20);if(tl.length<=(st?6:4))break}tlh=tf*1.38;const mx=st?7:4;if(tl.length>mx){tl=tl.slice(0,mx);tl[mx-1]=tl[mx-1].replace(/\s*\S*$/,'')+' …»'}}
 const trBlock=tl.length?60+tl.length*tlh:0;
 c.direction='rtl';let fs=st?118:104,lines;
 for(;fs>=30;fs-=4){c.font=`${fs}px ${qFont()==="kf"?'"KFGQPC Hafs",':''}"Amiri Quran","Amiri",serif`;lines=ayWrap(c,Q[s-1].v[a-1].trim(),maxW);if(lines.length*fs*1.85+trBlock<=avail)break}
 const lh=fs*1.85,grp=lines.length*lh+trBlock,g0=top+Math.max(0,(avail-grp)/2),y0=g0+lh*.68;let long=grp>avail+4;
 if(scene||k==='photo'){const pg=c.createLinearGradient(0,g0-70,0,g0+grp+70);pg.addColorStop(0,'rgba(0,0,0,0)');pg.addColorStop(.25,'rgba(0,0,0,.22)');pg.addColorStop(.75,'rgba(0,0,0,.22)');pg.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=pg;c.fillRect(0,g0-70,W,grp+140)}
 c.save();if(k!=='paper'){c.shadowColor='rgba(0,0,0,.55)';c.shadowBlur=18;c.shadowOffsetY=3}c.fillStyle=ink;c.font=`${fs}px ${qFont()==="kf"?'"KFGQPC Hafs",':''}"Amiri Quran","Amiri",serif`;lines.forEach((l,i)=>c.fillText(l,W/2,y0+i*lh));c.restore();
 if(tl.length){const dy=g0+lines.length*lh+22;c.save();c.strokeStyle=gold;c.globalAlpha=.85;c.lineWidth=2;c.beginPath();c.moveTo(W/2-200,dy);c.lineTo(W/2-22,dy);c.moveTo(W/2+22,dy);c.lineTo(W/2+200,dy);c.stroke();c.fillStyle=gold;ayStar8(c,W/2,dy,12);c.fill();c.restore();
  c.direction='ltr';c.save();if(k!=='paper'){c.shadowColor='rgba(0,0,0,.7)';c.shadowBlur=10}c.fillStyle=ink;c.globalAlpha=.95;c.font=`italic ${tf}px "Noto Sans",sans-serif`;tl.forEach((l,i)=>c.fillText(l,W/2,dy+30+tf+i*tlh));c.restore()}
 const msg=$('#ayMsg');if(msg)msg.textContent=long?t('ay_long'):'';
 // имзо (картуш)
 const fy=scene?(k==='night'?H-(st?190:130):k==='sea'?H-(st?200:120):H-(st?170:95)):H-(st?230:135);
 c.direction='ltr';c.save();if(k!=='paper'){c.shadowColor='rgba(0,0,0,.7)';c.shadowBlur=12}
 c.fillStyle=gold;c.font=`48px "Amiri",serif`;c.fillText(`﴿ ${Q[s-1].ar} · ${arNum(a)} ﴾`,W/2,fy);
 c.fillStyle=ink;c.globalAlpha=.88;c.font=`600 28px "Noto Sans",sans-serif`;c.fillText(`${Q[s-1].tr} ${s}:${a}${trA?' · '+trA:''}`,W/2,fy+44);
 c.globalAlpha=.6;c.font=`22px "Noto Sans",sans-serif`;c.fillText(t('app')+(trT?' · QuranEnc.com':''),W/2,fy+78);c.restore()}
function aySave(share){const cv=$('#aycv');if(!cv)return;const nm=`oyat-${store.get('ayref','94:5').replace(':','-')}.png`;
 cv.toBlob(b=>{if(!b)return;const f=new File([b],nm,{type:'image/png'});
  if(share&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:t('ay_title')}).catch(()=>{});return}
  const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=nm;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)},'image/png')}

// ---------- 6. Савол-жавоб ----------
let FQC=null;
function FQA(){if(FQC&&FQC.l===lang())return FQC.a;const a=[];
 C.FQ.forEach(([c,q,ans,l])=>a.push({c,q:tx(q),a:tx(ans),l,zq:q.uz}));
 GLA.forEach(x=>a.push({c:'rule',q:t('fq_q_rule',{x:tx(x.n)}),a:strip(tx(x.s))+' '+strip(tx(x.d)),l:'qoida-'+x.k,ar:x.ar}));
 C.LT.forEach(x=>a.push({c:'letter',q:t('fq_q_letter',{x:x[0]+' ('+tx(x[2])+')'}),a:strip(tx(x[3])),l:'mahraj',ar:x[0]}));
 C.TX.forEach((x,i)=>{if(!x.map)a.push({c:'hist',q:tx(x.t)+'?',a:strip(tx(x.b)).slice(0,420)+'…',l:'kitob-tarix-'+(i+1)})});
 C.QINTRO.forEach((x,i)=>a.push({c:'ustoz',q:tx(x.t)+'?',a:strip(tx(x.b)).slice(0,420)+'…',l:'kitob-qori-intro-'+(i+1)}));
 C.QB.forEach(x=>a.push({c:'ustoz',q:t('fq_q_who',{x:tx(x.n)}),a:tx(x.y)+'. '+tx(x.b),l:'kitob-qori-'+x.id}));
 FQC={l:lang(),a};return a}
const FCAT=[['','fq_all'],['app','fq_app'],['rule','fq_rule'],['letter','fq_letter'],['quran','fq_quran'],['hist','fq_hist'],['ustoz','fq_ustoz'],['adab','fq_adab'],['hifz','fq_hifz'],['namoz','fq_namoz']];
function vSavol(){const A=FQA(),c=store.get('fqc','');
 return `<p><a href="#kitob">${t('lib_back')}</a></p><h2>❓ ${t('fq_title')}</h2><div class="small">${t('fq_d',{n:A.length})}</div>
 <input id="fqSearch" class="inp" type="search" placeholder="${esc(t('fq_search'))}" style="width:100%;margin:8px 0">
 <div class="links fqcats">${FCAT.map(([k,l])=>`<button class="btn${k===c?' p':''}" data-fqc="${k}">${t(l)}</button>`).join('')}</div>
 <div id="fqList">${A.map((x,i)=>`<details class="card fqi" data-c="${x.c}" data-f="${esc((x.q+' '+x.a+' '+(x.ar||'')).toLowerCase())}"${c&&x.c!==c?' style="display:none"':''}><summary><b>${esc(x.q)}</b></summary><p>${esc(x.a)}</p><div class="links">${x.l?`<a class="btn" href="#${x.l}">${t('fq_more')}</a>`:''}${['adab','quran','hifz','namoz'].includes(x.c)?`<a class="btn" target="_blank" rel="noopener" href="${esc(zkURL(x.zq||x.q))}">${t('zk_rel')}</a>`:''}</div></details>`).join('')}</div>
 <div class="note hidden" id="fqNone">${t('fq_none')}</div>${zkCard()}<div class="note">${t('fq_note')}</div>`}
const ZK='https://savollar.islom.uz/';
const zkURL=q=>q&&q.trim()?ZK+'qidiruv?q='+encodeURIComponent(q.trim()):ZK;
function zkCard(){const q=store.get('fqq','');return `<div class="card" id="zk"><b>📚 ${t('zk_title')}</b><p class="small">${t('zk_d')}</p><div class="links"><a class="btn p" id="zkGo" target="_blank" rel="noopener" href="${esc(zkURL(q))}">${esc(q.trim()?t('zk_search',{q:q.trim()}):t('zk_open'))}</a><a class="btn" target="_blank" rel="noopener" href="${ZK}">${t('zk_ask')}</a></div></div>`}
function fqFilter(q){q=q.trim().toLowerCase();const c=store.get('fqc','');let n=0;const ws=q.split(/\s+/).filter(w=>w.length>1);
 document.querySelectorAll('.fqi').forEach(el=>{const ok=(!c||el.dataset.c===c||q)&&(!ws.length||ws.every(w=>el.dataset.f.includes(w)));el.style.display=ok?'':'none';if(ok)n++});
 const nn=$('#fqNone');if(nn)nn.classList.toggle('hidden',n>0);const z=$('#zkGo');if(z){z.href=zkURL(q);z.textContent=q?t('zk_search',{q}):t('zk_open')}if(n===0&&q){const zc=$('#zk');if(zc&&nn)nn.after(zc)}}

// ---------- Ҳодисалар ----------
document.addEventListener('click',e=>{const tg=e.target.closest('button');if(!tg)return;const d=tg.dataset;
 if(tg.id==='txok'){const dd=store.get('txd',{}),n=+d.n;if(dd[n])delete dd[n];else{dd[n]=1;stars(tg)}store.set('txd',dd);markActive();if(dd[n]&&n<C.TX.length)location.hash='kitob-tarix-'+(n+1);else render();return}
 if(tg.id==='ptGeo'){const m=$('#ptMsg');if(!navigator.geolocation){m.textContent=t('pt_geo_fail');return}m.textContent=t('loading');
  navigator.geolocation.getCurrentPosition(p=>{store.set('pcity',{lat:+p.coords.latitude.toFixed(4),lon:+p.coords.longitude.toFixed(4),tz:-new Date().getTimezoneOffset()/60});render()},()=>{const mm=$('#ptMsg');if(mm)mm.textContent=t('pt_geo_fail')},{timeout:15000,maximumAge:864e5});return}
 if(tg.id==='hjPrev'||tg.id==='hjNext'){store.set('hjoff',store.get('hjoff',0)+(tg.id==='hjNext'?1:-1));render();return}
 if(d.ayp){store.set('ayref',d.ayp);render();return}
 if(d.asrf){store.set('asrf',+d.asrf);render();return}
 if(d.ayth){store.set('ayth',d.ayth);render();return}
 if(d.aysz){store.set('aysz',d.aysz);render();return}
 if(tg.id==='ayDl'){aySave(false);return}if(tg.id==='ayShare'){aySave(true);return}
 if(d.fqc!==undefined){store.set('fqc',d.fqc);document.querySelectorAll('[data-fqc]').forEach(b=>b.classList.toggle('p',b===tg));fqFilter(($('#fqSearch')||{}).value||'');return}});
document.addEventListener('change',e=>{const id=e.target.id;
 if(id==='ptCity'){store.set('pcity',{i:+e.target.value});render();return}
 if(id==='ayTr'){store.set('aytr',e.target.checked);ayDraw();return}
 if(id==='ayFile'){const f=e.target.files&&e.target.files[0];if(!f)return;const im=new Image();im.onload=()=>{AYIMG=im;render()};im.src=URL.createObjectURL(f);return}
 if(id==='aySura'){store.set('ayref',e.target.value+':1');render();return}
 if(id==='ayNum'){store.set('ayref',store.get('ayref','94:5').split(':')[0]+':'+e.target.value);render();return}});
document.addEventListener('input',e=>{if(e.target.id==='fqSearch'){store.set('fqq',e.target.value);fqFilter(e.target.value)}});

// ---------- Бош саҳифа: ҳозирги/кейинги намоз ва плиткалар ----------
const fmtLeft=h=>{const s=Math.max(0,Math.round(h*3600)),H=Math.floor(s/3600),M=Math.floor(s%3600/60),S=s%60;return t('pt_ends',{t:`<b class="clk">${H}:${String(M).padStart(2,'0')}:${String(S).padStart(2,'0')}</b>`})};
function ptNow(){try{const now=new Date(),p=ptPlace(),nm=(now.getUTCHours()+now.getUTCMinutes()/60+now.getUTCSeconds()/3600+p.tz+24)%24,T=ptDay(now);
 let cur=null;for(const k of PK)if(T[k]<=nm)cur=k;const seq=PK,nxt=k=>{const i=seq.indexOf(k);return i<seq.length-1?{k:seq[i+1],at:T[seq[i+1]]}:{k:'f',at:ptDay(new Date(now.getTime()+864e5)).f+24}};
 if(!cur)return {k:'i',n:t('pt_isha'),left:T.f-nm};const n=nxt(cur);return {k:cur,n:t(PN[cur]),left:n.at-nm}}catch(e){return null}}
const WDF={uz:['Якшанба','Душанба','Сешанба','Чоршанба','Пайшанба','Жума','Шанба'],ru:['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],tg:['Якшанбе','Душанбе','Сешанбе','Чоршанбе','Панҷшанбе','Ҷумъа','Шанбе']};
function hdrDate(){const d=new Date(),h=hjStr(d);return (h?h+' / ':'')+lt_(WDF[L3()][d.getDay()]+', '+d.getDate()+' '+GM[L3()][d.getMonth()])}
const TI={
mushaf:'<path d="M8 14c6-3 12-3 16 1 4-4 10-4 16-1v22c-6-3-12-3-16 1-4-4-10-4-16-1z" fill="#fff"/><path d="M24 15v22"/><path d="M12 19c3-1 6-1 8 0M12 24c3-1 6-1 8 0M28 19c2-1 5-1 8 0M28 24c2-1 5-1 8 0" stroke="var(--gold)"/>',
qibla:'<path d="M15 17l9-5 9 5v14l-9 5-9-5z" fill="#1b1b1b" stroke="#1b1b1b"/><path d="M15 17l9 5 9-5M24 22v14" stroke="#555"/><path d="M15 21l9 5 9-5" stroke="var(--gold)" stroke-width="2"/><path d="M8 40l7-7M8 40v-5M8 40h5" stroke="var(--lapis)" stroke-width="2.4"/>',
tasbeh:'<circle cx="24" cy="21" r="11" fill="none" stroke-dasharray="0.1 5.2" stroke-width="5" stroke="var(--lapis)"/><path d="M24 32v5" stroke="var(--gold)" stroke-width="2.5"/><path d="M20 37h8l-2 7h-4z" fill="var(--gold)" stroke="var(--gold)"/>',
duo:'<path d="M22 40c-5-1-9-6-10-12l-2-9c0-2 3-2 3 0l2 6 0-12c0-2 3-2 3 0v10-13c0-2 3-2 3 0v13-11c0-2 3-2 3 0v19c0 3-1 6-2 9z" fill="#f6d9b8"/><path d="M26 40c5-1 9-6 10-12l2-9c0-2-3-2-3 0l-2 6 0-12c0-2-3-2-3 0v10-13c0-2-3-2-3 0v13-11c0-2-3-2-3 0v19c0 3 1 6 2 9z" fill="#f6d9b8"/>',
namoz:'<path d="M14 40V24h20v16" fill="#fff"/><path d="M14 24c0-6 4-9 10-12 6 3 10 6 10 12" fill="var(--gold)" stroke="var(--gold)"/><path d="M8 40V18M40 40V18M7 18h2M39 18h2" stroke-width="2.2"/><circle cx="24" cy="32" r="5" fill="#fff"/><path d="M24 29v3l2 1.5"/><path d="M6 40h36"/>',
tajvid:'<text x="24" y="33" text-anchor="middle" font-family="Amiri,serif" font-size="26" fill="var(--gold)" stroke="none">ضاد</text><path d="M9 38c10-3 20-3 30 0" />',
hifz:'<circle cx="24" cy="14" r="6" fill="#f6d9b8"/><path d="M18 12c1-4 11-4 12 0" fill="#fff"/><path d="M12 40c0-8 5-14 12-14s12 6 12 14z" fill="#fff"/><path d="M15 31h18v9H15z" fill="var(--gold)" stroke="var(--gold)"/>',
kitob:'<circle cx="14" cy="24" r="4" fill="var(--gold)" stroke="none"/><circle cx="24" cy="24" r="4" fill="var(--gold)" stroke="none"/><circle cx="34" cy="24" r="4" fill="var(--gold)" stroke="none"/>'};
function tile(h,ic,l){return `<a class="tile" href="#${h}"><span class="ti"><svg viewBox="0 0 48 48" fill="none" stroke="var(--lapis)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${TI[ic]}</svg></span><span>${l}</span></a>`}
function homeTop(){const nw=ptNow(),nx=ptNext(),p=ptPlace();
 return `<div class="ptop"><a class="pnow" href="#namoz"><div class="pk">${t('pt_now')}</div><div class="pv">${nw?esc(nw.n):'—'}</div><div class="pc" data-cd>${nw?fmtLeft(nw.left):''}</div><svg class="pmq" viewBox="0 0 120 90" aria-hidden="true"><path d="M30 90V52h60v38" fill="rgba(255,255,255,.9)"/><path d="M30 52c0-16 14-24 30-32 16 8 30 16 30 32z" fill="#e9b949"/><path d="M60 8v12" stroke="#e9b949" stroke-width="3"/><circle cx="60" cy="6" r="3" fill="#e9b949"/><path d="M14 90V36h10v54zM96 90V36h10v54z" fill="rgba(255,255,255,.85)"/><path d="M13 36l6-10 6 10M95 36l6-10 6 10" fill="#e9b949"/><path d="M52 90V72a8 8 0 0 1 16 0v18" fill="#2c6e57"/></svg></a>
 <a class="pnext" href="#namoz"><div class="pk">${t('pt_nextk')}</div><div class="pv">${nx?esc(nx.n):'—'}</div><div class="small">${t('pt_starts')}</div><div class="pt2">${nx?nx.s:''} <span class="arr">→</span></div></a></div>
 <div class="small" style="margin:-4px 2px 6px;color:var(--mute)">📍 ${esc(p.n)}</div>
 <div class="tiles">${tile('mushaf','mushaf',t('tab_mushaf'))}${tile('qibla','qibla',t('qb_t'))}${tile('tasbeh','tasbeh',t('ts_t'))}${tile('duo','duo',t('du_t'))}
 ${tile('namoz','namoz',t('pt_title'))}${tile('darslar','tajvid',t('tj_t'))}${tile('hifz','hifz',t('hf_t'))}${tile('kitob','kitob',t('more_t'))}</div>`}

// ---------- Қибла ----------
const KAABA=[21.4225,39.8262];
function qBearing(){const p=ptPlace(),r=Math.PI/180,f1=p.lat*r,f2=KAABA[0]*r,dl=(KAABA[1]-p.lon)*r;const b=Math.atan2(Math.sin(dl)*Math.cos(f2),Math.cos(f1)*Math.sin(f2)-Math.sin(f1)*Math.cos(f2)*Math.cos(dl))/r;return (b+360)%360}
let QH=null,QON=false,QV=false,QA=null,QN=0,QL=0;
function vQibla(){const b=qBearing(),p=ptPlace();
 const ticks=Array.from({length:72},(_,i)=>{const big=i%6===0;return `<line x1="150" y1="${big?22:26}" x2="150" y2="34" stroke="${big?'var(--lapis)':'#bbb'}" stroke-width="${big?4:2}" stroke-linecap="round" transform="rotate(${i*5} 150 150)"/>`}).join('');
 return `<p><a href="#bosh">← ${t('tab_home')}</a></p><h2>🧭 ${t('qb_t')}</h2>
 <div class="card" style="text-align:center"><b>${esc(p.n)}</b><div class="small">${t('qb_deg',{d:b.toFixed(1)})}</div></div>
 <div class="qwrap"><div id="qrot" style="transition:transform .2s linear;will-change:transform"><svg id="qdial" viewBox="0 0 300 300" style="transition:none"><circle cx="150" cy="150" r="140" fill="var(--card)" stroke="var(--ink)" stroke-width="8"/>${ticks}
 <g font-size="22" font-weight="700" fill="var(--mute)" text-anchor="middle"><text x="150" y="62">N</text><text x="245" y="158">E</text><text x="150" y="252">S</text><text x="55" y="158">W</text></g>
 <g transform="rotate(${b.toFixed(1)} 150 150)"><line x1="150" y1="150" x2="150" y2="58" stroke="var(--gold)" stroke-width="5" stroke-linecap="round"/><g transform="translate(150 44)"><rect x="-14" y="-14" width="28" height="28" rx="3" fill="#1b1b1b"/><rect x="-14" y="-6" width="28" height="4" fill="var(--gold)"/></g></g>
 <circle cx="150" cy="150" r="8" fill="var(--lapis)"/></svg></div><div class="qtop">▲</div></div>
 <div id="qmsg" class="note" style="text-align:center">${QON?t('qb_wait'):t('qb_static')}</div><div id="qdbg" class="small" style="text-align:center;color:var(--mute)"></div>
 <div class="links" style="justify-content:center">${QON&&QH!=null?'':`<button class="btn p" id="qOn">🧭 ${t('qb_on')}</button>`}<a class="btn" href="#namoz">📍 ${t('pt_city')}</a></div>
 <div class="note">${t('qb_note')}</div>`}
const qIOS=()=>!!(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==='function');
function qbOri(e){let h=null;
 if(typeof e.webkitCompassHeading==='number'&&e.webkitCompassHeading>=0)h=e.webkitCompassHeading;
 else if(e.type==='deviceorientationabsolute'&&e.alpha!=null)h=(360-e.alpha)%360;
 else if(e.absolute===true&&e.alpha!=null)h=(360-e.alpha)%360;
 if(h==null)return;
 // экран ётиқ ҳолатда бурчакни тузатиш
 const so=(screen.orientation&&screen.orientation.angle)||window.orientation||0;h=(h+so+360)%360;
 QN++;QH=h;const now=Date.now();if(now-QL<60)return;QL=now;
 const r=$('#qrot');if(!r)return;
 const tgt=-h;if(QA==null)QA=tgt;else{let d=((tgt-QA)%360+540)%360-180;QA+=d}
 r.style.transform=r.style.webkitTransform=`rotate(${QA.toFixed(1)}deg)`;
 const btn=$('#qOn');if(btn)btn.remove();
 const dbg=$('#qdbg');if(dbg)dbg.textContent=t('qb_head',{d:Math.round(h)});
 const diff=((qBearing()-h+540)%360)-180,m=$('#qmsg');if(m){if(Math.abs(diff)<5){m.textContent=t('qb_ok');m.classList.add('qok');if(!QV){try{navigator.vibrate&&navigator.vibrate(60)}catch(_){}QV=true}}else{m.textContent=t(diff>0?'qb_right':'qb_left',{d:Math.round(Math.abs(diff))});m.classList.remove('qok');QV=false}}}
function qbListen(){window.addEventListener('deviceorientationabsolute',qbOri,true);window.addEventListener('deviceorientation',qbOri,true);
 const n0=QN;setTimeout(()=>{if(QN===n0&&location.hash==='#qibla'){const m=$('#qmsg');if(m)m.textContent=t(window.DeviceOrientationEvent?(qIOS()?'qb_ios_none':'qb_nosensor'):'qb_nosensor')}},3000)}
// iPhone: рухсат фақат тугма босилганда, бевосита сўралади (await олдидан ҳеч нарса йўқ)
function qbAsk(){QON=true;const m=$('#qmsg');
 if(qIOS()){let p;try{p=DeviceOrientationEvent.requestPermission()}catch(e){if(m)m.textContent=t('qb_ios_deny');return}
  if(m)m.textContent=t('qb_wait');
  p.then(r=>{if(r==='granted')qbListen();else{const mm=$('#qmsg');if(mm)mm.textContent=t('qb_ios_deny')}}).catch(()=>{const mm=$('#qmsg');if(mm)mm.textContent=t('qb_ios_deny')});return}
 if(m)m.textContent=t('qb_wait');qbListen()}
function qbStart(){QA=null;if(QON||!qIOS()){QON=true;qbListen()}}
function qbStop(){window.removeEventListener('deviceorientationabsolute',qbOri,true);window.removeEventListener('deviceorientation',qbOri,true);QH=null;QA=null}

// ---------- Тасбеҳ ----------
const DZ=[['سُبْحَانَ اللهِ',X3('Субҳаналлоҳ','Субханаллах','Субҳаналлоҳ'),X3('Аллоҳ барча нуқсонлардан покдир','Аллах свободен от всех недостатков','Аллоҳ аз ҳама нуқсон пок аст')],
['الْحَمْدُ لِلَّهِ',X3('Алҳамдулиллаҳ','Альхамдулиллях','Алҳамдулиллоҳ'),X3('Барча ҳамд Аллоҳга','Вся хвала Аллаху','Ҳама ҳамд Аллоҳро')],
['اللهُ أَكْبَرُ',X3('Аллоҳу акбар','Аллаху акбар','Аллоҳу акбар'),X3('Аллоҳ энг улуғдир','Аллах превыше всего','Аллоҳ бузургтар аст')],
['لَا إِلَهَ إِلَّا اللهُ',X3('Лā илаҳа иллаллоҳ','Ля иляха илляллах','Ло илоҳа иллаллоҳ'),X3('Аллоҳдан ўзга илоҳ йўқ','Нет божества, кроме Аллаха','Ҷуз Аллоҳ худое нест')],
['أَسْتَغْفِرُ اللهَ',X3('Астағфируллоҳ','Астагфируллах','Астағфируллоҳ'),X3('Аллоҳдан мағфират сўрайман','Прошу прощения у Аллаха','Аз Аллоҳ омурзиш мехоҳам')],
['سُبْحَانَ اللهِ وَبِحَمْدِهِ',X3('Субҳаналлоҳи ва биҳамдиҳи','Субханаллахи ва бихамдихи','Субҳаналлоҳи ва биҳамдиҳӣ'),X3('Аллоҳни ҳамди ила поклайман','Пречист Аллах, и хвала Ему','Аллоҳро бо ҳамдаш пок медонам')],
['لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ',X3('Лā ҳавла ва лā қуввата иллā биллаҳ','Ля хауля ва ля куввата илля билляh','Ло ҳавла ва ло қуввата илло биллоҳ'),X3('Куч ва қувват фақат Аллоҳ билан','Нет силы и мощи, кроме как у Аллаха','Қувват ва тавоно танҳо бо Аллоҳ аст')],
['اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',X3('Аллоҳумма солли ъалā Муҳаммад','Аллахумма салли аля Мухаммад','Аллоҳумма салли ало Муҳаммад'),X3('Аллоҳим, Муҳаммадга салавот йўллагин','О Аллах, благослови Мухаммада','Худоё, ба Муҳаммад дуруд фирист')]];
function X3(uz,ru,tg){return {uz,ru,tg}}
function tsS(){const d=today(),a=store.get('tsb',{});if(a.d!==d)return {d,c:{},tot:0};return a}
function vTasbeh(){const i=store.get('tsi',0),z=DZ[i]||DZ[0],g=store.get('tsg',33),S=tsS(),n=S.c[i]||0,pc=g?Math.min(1,(n%g||(n&&n%g===0?g:0))/g):0;
 return `<p><a href="#bosh">← ${t('tab_home')}</a></p><h2>📿 ${t('ts_t')}</h2>
 <div class="card tsz"><div class="ar" style="text-align:center;font-size:calc(46px*var(--arz));line-height:1.6">${z[0]}</div><div style="text-align:center"><b>${esc(tx(z[1]))}</b><div class="small">${esc(tx(z[2]))}</div></div></div>
 <div class="tsl">${DZ.map((x,k)=>`<button class="btn${k===i?' p':''}" data-tsi="${k}"><span class="ar" style="font-size:20px;line-height:1.5">${x[0]}</span></button>`).join('')}</div>
 <div class="links" style="justify-content:center"><span class="small">${t('ts_goal')}:</span>${[33,99,100,0].map(v=>`<button class="btn${v===g?' p':''}" data-tsg="${v}">${v||'∞'}</button>`).join('')}</div>
 <button id="tsTap" class="tstap" aria-label="+1"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="none" stroke="var(--lapisbg)" stroke-width="12"/><circle id="tsRing" cx="100" cy="100" r="90" fill="none" stroke="var(--lapis)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(565.5*pc).toFixed(1)} 565.5" transform="rotate(-90 100 100)"/></svg><b id="tsN">${n}</b><span class="small" id="tsG">${g?(Math.floor(n/g))+' × '+g:''}</span></button>
 <div class="links" style="justify-content:center"><button class="btn" id="tsReset">↺ ${t('ts_reset')}</button></div>
 <div class="small" style="text-align:center">${t('ts_today',{n:S.tot})}</div>`}
function tsTap(){const i=store.get('tsi',0),g=store.get('tsg',33),S=tsS();S.c[i]=(S.c[i]||0)+1;S.tot++;store.set('tsb',S);const n=S.c[i];
 const N=$('#tsN');if(N)N.textContent=n;const G=$('#tsG');if(G)G.textContent=g?Math.floor(n/g)+' × '+g:'';const pc=g?((n%g)||g)/g:0;const R=$('#tsRing');if(R)R.setAttribute('stroke-dasharray',(565.5*pc).toFixed(1)+' 565.5');
 try{if(navigator.vibrate)navigator.vibrate(g&&n%g===0?[80,60,80]:12)}catch(e){}if(g&&n%g===0)markActive()}

// ---------- Дуолар (Қуръондан) ----------
const DUC=[['du_c1',['2:201','2:127','2:128','2:250','2:286','3:8','3:16','3:147','3:193','7:23','14:40','14:41','18:10','23:109','25:65','25:74','59:10']],
['du_c2',['1:6','20:25','20:26','20:27','20:28','20:114','3:8','26:83']],
['du_c3',['17:24','14:41','25:74','71:28','27:19']],
['du_c4',['7:23','21:87','3:193','23:118','28:16','3:147']],
['du_c5',['2:250','21:83','9:129','3:173','2:286','28:24','60:4']],
['du_c6',['2:201','14:40','26:83','26:85','12:101']]];
function vDuo(){const c=store.get('duc',0),L=DUC[c]||DUC[0];
 const head=`<p><a href="#bosh">← ${t('tab_home')}</a></p><h2>🤲 ${t('du_t')}</h2><div class="small">${t('du_note')}</div>
 <div class="dgrid">${DUC.map((x,k)=>`<button class="dcat${k===c?' on':''}" data-duc="${k}"><span>${['📖','💡','👨‍👩‍👧','🌙','🕊','🌍'][k]}</span>${t(x[0])}</button>`).join('')}</div>`;
 if(!Q)return head+`<p class="small">${t('loading')}</p>`;
 return head+`<h3>${t(L[0])}</h3>`+L[1].map(r=>{const [s,a]=r.split(':').map(Number),v=Q[s-1]&&Q[s-1].v[a-1];if(!v)return '';return `<div class="card"><div class="ref">${esc(Q[s-1].tr)} ${r}</div><div class="ar" style="font-size:calc(28px*var(--arz))">${esc(v)}</div><div class="links"><button class="btn p" data-ayk="${r}">${t('play_ayah')}</button><button class="btn" data-ayp2="${r}">🖼 ${t('ay_title')}</button></div></div>`}).join('')}

document.addEventListener('click',e=>{const tg=e.target.closest('button');if(!tg)return;const d=tg.dataset;
 if(tg.id==='tsTap'){tsTap();return}
 if(d.tsi!==undefined){store.set('tsi',+d.tsi);render();return}if(d.tsg!==undefined){store.set('tsg',+d.tsg);render();return}
 if(tg.id==='tsReset'){const S=tsS(),i=store.get('tsi',0);S.c[i]=0;store.set('tsb',S);render();return}
 if(tg.id==='qOn'){qbAsk();return}
 if(d.duc!==undefined){store.set('duc',+d.duc);render();return}
 if(d.ayp2){store.set('ayref',d.ayp2);location.hash='oyat';return}});

// ---------- Мусҳаф таржимаси (QuranEnc.com, ўзгаришсиз, манбаси билан) ----------
const TRK={uz:['uzbek_sadiq',{uz:'Шайх Муҳаммад Содиқ Муҳаммад Юсуф',ru:'Шейх Мухаммад Садык Мухаммад Юсуф',tg:'Шайх Муҳаммад Содиқ Муҳаммад Юсуф'}],
 ru:['russian_aboadel',{uz:'Абу Адель',ru:'Абу Адель',tg:'Абу Одил'}],
 tg:['tajik_arifi',{uz:'Рувводут таржима маркази',ru:'Центр переводов «Руввад»',tg:'Маркази тарҷумаи «Рувод»'}],
 en:['english_saheeh',{uz:'Saheeh International',ru:'Saheeh International',tg:'Saheeh International'}],
 ar:['arabic_moyassar',{uz:'ат-Тафсир ал-Муяссар (арабча қисқа тафсир)',ru:'ат-Тафсир аль-Муяссар (краткий тафсир на арабском)',tg:'ат-Тафсир ал-Муяссар (тафсири кӯтоҳи арабӣ)'}]};
const trOn=()=>!!store.get('trOn',false);
const trL=()=>{const v=store.get('trL','');return TRK[v]?v:L3()};
const TRM={};let TRV={};
function trBar(){const on=trOn(),l=trL();return `<div class="row trbar"><label class="row"><input type="checkbox" id="trOn"${on?' checked':''} style="width:22px;height:22px"> 🌐 ${t('tr_on')}</label><label class="row"><input type="checkbox" id="wbwOn"${wbwOn()?' checked':''} style="width:22px;height:22px"> 🔤 ${t('wbw_on')}</label>${on?`<select id="trL" class="inp" style="width:auto">${['uz','ru','tg','en','ar'].map(k=>`<option value="${k}"${k===l?' selected':''}>${t('tr_'+k)}</option>`).join('')}</select>`:''}</div>${on&&store.get('hide',false)?`<div class="small">${t('tr_hidden')}</div>`:''}`}
function trCredit(){const l=trL(),k=TRK[l];return `<div class="note small" id="trCredit">${t('tr_credit',{a:esc(tx(k[1]))})} <a href="https://quranenc.com/${l==='ru'?'ru':l==='tg'?'tg':l==='ar'?'ar':l==='en'?'en':'uz'}/browse/${k[0]}/${store.get('sura',1)}" target="_blank" rel="noopener">QuranEnc.com</a>${TRV[k[0]]?' · '+t('tr_ver',{v:esc(TRV[k[0]])}):''}. ${t('tr_note')}</div>`}
async function trGet(key,s){const id=key+':'+s;if(TRM[id])return TRM[id];const url=`https://quranenc.com/api/v1/translation/sura/${key}/${s}`;let j=null;
 try{const r=await fetch(url,{mode:'cors'});if(r.ok){j=await r.json();try{if('caches' in window){const c=await caches.open('qu-audio');c.put(url,new Response(JSON.stringify(j),{headers:{'Content-Type':'application/json'}}))}}catch(_){}}}catch(e){}
 if(!j&&'caches' in window){try{const c=await caches.open('qu-audio'),m=await c.match(url);if(m)j=await m.json()}catch(_){}}
 if(!j||!j.result)throw new Error('tr');const out={};j.result.forEach(x=>{out[+x.aya]={t:x.translation||'',f:x.footnotes||''}});TRM[id]=out;return out}
async function trVer(key){if(TRV[key]!==undefined)return;TRV[key]='';try{const r=await fetch('https://quranenc.com/api/v1/translations/list',{mode:'cors'});if(r.ok){const j=await r.json();const it=(j.translations||[]).find(x=>x.key===key);if(it&&it.version){TRV[key]=String(it.version);const c=$('#trCredit');if(c)c.outerHTML=trCredit()}}}catch(_){}}
async function trFill(s){const l=trL(),key=TRK[l][0];document.querySelectorAll('.trn').forEach(e=>{e.innerHTML=`<span class="small">${t('loading')}</span>`});
 try{const d=await trGet(key,s);if(store.get('sura',1)!==s)return;
  document.querySelectorAll('.trn').forEach(e=>{const x=d[+e.dataset.tr];if(!x){e.innerHTML='';return}e.innerHTML=`<p${l==='ar'?' dir="rtl" class="artr"':''}>${esc(x.t)}</p>${x.f?`<details><summary class="small">${t('tr_fn')}</summary><p class="small">${esc(x.f)}</p></details>`:''}`});trVer(key)}
 catch(e){document.querySelectorAll('.trn').forEach((el,i)=>{el.innerHTML=i===0?`<span class="small">${t('tr_fail')} <a href="https://quranenc.com/uz/browse/${key}/${s}" target="_blank" rel="noopener">QuranEnc.com</a></span>`:''})}}
document.addEventListener('change',e=>{const id=e.target.id;
 if(id==='trOn'){store.set('trOn',e.target.checked);render();return}
 if(id==='trL'){store.set('trL',e.target.value);render();return}});

// ---------- Ўқишни текшириш: устоз жавоби (сўзларни таниш + солиштириш) ----------
let SR=null,SRP=null,SRON=false;
function srStart(){const K=window.SpeechRecognition||window.webkitSpeechRecognition;SR=null;if(!K)return;
 try{const r=new K();r.lang='ar-SA';r.continuous=true;r.interimResults=true;r.maxAlternatives=1;let fin='',intr='';r._err='';
  SRP=new Promise(res=>{r.onresult=e=>{intr='';for(let i=e.resultIndex;i<e.results.length;i++){const x=e.results[i];if(x.isFinal)fin+=' '+x[0].transcript;else intr+=' '+x[0].transcript}};
   r.onerror=e=>{r._err=e.error||'err'};r.onend=()=>{if(SRON&&!/not-allowed|service/.test(r._err)){try{r.start();return}catch(_){}}res((fin+' '+intr).trim())}});
  SRON=true;r.start();SR=r}catch(e){SR=null}}
async function srStop(){SRON=false;if(!SR)return {ok:false,why:(window.SpeechRecognition||window.webkitSpeechRecognition)?'err':'none'};const r=SR;SR=null;try{r.stop()}catch(_){}
 const txt=await Promise.race([SRP,new Promise(z=>setTimeout(()=>z(null),3000))]);if(txt===null||/not-allowed|service|network/.test(r._err))return {ok:false,why:r._err||'err'};return {ok:true,txt:txt||''}}
const arNorm=w=>String(w).replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g,'').replace(/[ٱأإآا]/g,'').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ء/g,'').replace(/[^ء-ي]/g,'');
function lev(a,b){const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let p=Array.from({length:n+1},(_,j)=>j);for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]}
const wsim=(a,b)=>{const L=Math.max(a.length,b.length);return L?1-lev(a,b)/L:1};
function alignAyah(words,heard){const A=words,H=heard,m=A.length,n=H.length,S=[];for(let i=0;i<=m;i++){S.push(new Array(n+1).fill(0))}
 const ok=(i,j)=>wsim(A[i].n,H[j])>=0.67||(A[i].n.length>=4&&(H[j].includes(A[i].n)||A[i].n.includes(H[j])&&H[j].length>=3));
 for(let i=m-1;i>=0;i--)for(let j=n-1;j>=0;j--)S[i][j]=ok(i,j)?1+S[i+1][j+1]:Math.max(S[i+1][j],S[i][j+1]);
 const st=A.map(()=>({ok:false,heard:''}));let i=0,j=0,gapH=[];const flush=(from)=>{};
 while(i<m&&j<n){if(ok(i,j)&&S[i][j]===1+S[i+1][j+1]){st[i].ok=true;i++;j++}else if(S[i+1][j]>=S[i][j+1]){i++}else{j++}}
 // ўрнига эшитилган сўз: бир хил оралиқдаги мос келмаган сўз
 i=0;j=0;const mi=[];while(i<m&&j<n){if(ok(i,j)&&S[i][j]===1+S[i+1][j+1]){mi.push([i,j]);i++;j++}else if(S[i+1][j]>=S[i][j+1])i++;else j++}
 let pi=-1,pj=-1;mi.concat([[m,n]]).forEach(([a,b])=>{const gi=[],gj=[];for(let x=pi+1;x<a;x++)gi.push(x);for(let y=pj+1;y<b;y++)gj.push(y);gi.forEach((x,k)=>{if(gj[k]!=null)st[x].heard=H[gj[k]]});pi=a;pj=b});
 return st}
function teacherHTML(s,a,A,B,sr){const raw=(Q&&Q[s-1].v[a-1]||'').split(' '),words=raw.map((w,i)=>({w,i,n:arNorm(w)})).filter(x=>x.n);
 const rec_=prec().n.split(' (')[0],tips=[];let head='',body='',score=null;
 if(sr&&sr.ok&&sr.txt){const hw=sr.txt.split(/\s+/).map(arNorm).filter(Boolean),st=alignAyah(words,hw),bad=words.map((w,k)=>({...w,...st[k]})).filter(x=>!x.ok);score=Math.round((words.length-bad.length)/words.length*100);
  head=bad.length===0?t('tf_all_ok'):bad.length<=2?t('tf_few',{n:bad.length}):t('tf_many',{n:bad.length,m:words.length});
  body=`<div class="ar tfay">${raw.map((w,i)=>{const b=bad.find(x=>x.i===i),isW=words.some(x=>x.i===i);return isW?`<button class="tfw ${b?'no':'ok'}" data-tw="${s}:${a}:${i}">${esc(w)}</button>`:esc(w)}).join(' ')}</div><p class="small">${t('tf_tap')}</p>`+
   bad.slice(0,8).map(x=>`<div class="tfcard"><div><b>${x.heard?t('tf_said',{h:esc(x.heard)}):t('tf_missed')}</b></div><div class="row" style="align-items:center;gap:10px;margin-top:6px"><span class="ar" style="font-size:calc(34px*var(--arz));line-height:1.5">${esc(x.w)}</span><button class="btn p" data-tw="${s}:${a}:${x.i}">▶ ${t('tf_listen')}</button></div><div class="small">${t('tf_repeat')}</div></div>`).join('')}
 else if(sr&&sr.ok){head=t('tf_silent')}
 else head=t('tf_noasr');
 if(A&&B){const r=A.rate/B.rate;if(r>1.25)tips.push(t('tf_fast',{x:Math.min(100,Math.round((r-1)*100))}));else if(r<0.6)tips.push(t('tf_slow'));
  const am=A.long.length?Math.max(...A.long.map(o=>o.h)):0,bm=Math.min(6,B.long.length?Math.max(...B.long.map(o=>o.h)):0);
  if(bm>=4&&am<bm-1.5)tips.push(t('tf_madd',{a:am,b:bm}));else if(A.long.length<B.long.length-1)tips.push(t('tf_fewlong'));
  if(!tips.length)tips.push(t('tf_tempo_ok'))}
 const all=score===100&&tips.length===1&&A&&B&&tips[0]===t('tf_tempo_ok');
 return `<div class="card tfbox"><div class="tfhead"><span class="tfav">📊</span><div><div class="small">${t('tf_from',{r:esc(rec_)})}</div><b style="font-size:18px">${esc(head)}</b>${score!=null?`<div class="pbar" style="margin-top:6px"><b style="width:${score}%"></b></div><div class="small">${t('tf_score',{n:score})}</div>`:''}</div></div>
 ${body}${tips.length?`<div class="tfcard"><b>${t('tf_tempo')}</b><ul style="margin:6px 0 0;padding-left:18px">${tips.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
 <div id="tajBox" class="tfcard"></div><div class="links"><button class="btn p" data-play="${s}:${a}">▶ ${t('tf_whole',{r:esc(rec_)})}</button><button class="btn" id="tfMine">▶ ${t('tf_mine')}</button><button class="btn" id="rec2">🎙 ${t('tf_again')}</button></div>
 ${all?`<div class="note">🌟 ${t('tf_next')}</div>`:''}<div class="note small">${t('tf_note')}</div></div>`}
document.addEventListener('click',e=>{const tg=e.target.closest('button');if(!tg)return;const d=tg.dataset;
 if(d.tw){const [s,a,w]=d.tw.split(':').map(Number);tg.classList.add('kw');if(!playWords(s,a,[w],null,()=>tg.classList.remove('kw'))){tg.classList.remove('kw');playList([[s,a]],0)}return}
 if(tg.id==='tfMine'){const au=document.querySelector('#mine audio');if(au){au.currentTime=0;au.play()}return}
 if(tg.id==='rec2'){const r=$('#rec');if(r){r.scrollIntoView({behavior:'smooth',block:'center'});r.click()}return}});

// ---------- Сўзма-сўз маъно (Quran.com API, инглизча) ----------
const wbwOn=()=>!!store.get('wbwOn',false);const WBM={};
async function wbwGet(s){if(WBM[s])return WBM[s];const out={};let page=1,guard=0;
 const ca='caches' in window?await caches.open('qu-audio').catch(()=>null):null;
 while(page&&guard++<12){const url=`https://api.quran.com/api/v4/verses/by_chapter/${s}?words=true&language=en&word_fields=text_uthmani&per_page=50&page=${page}`;let j=null;
  try{const r=await fetch(url,{mode:'cors'});if(r.ok){j=await r.json();if(ca)ca.put(url,new Response(JSON.stringify(j),{headers:{'Content-Type':'application/json'}})).catch(()=>{})}}catch(e){}
  if(!j&&ca){const m=await ca.match(url).catch(()=>null);if(m)j=await m.json()}
  if(!j||!j.verses)throw new Error('wbw');
  j.verses.forEach(v=>{out[v.verse_number]=(v.words||[]).filter(w=>w.char_type_name==='word').map(w=>({ar:w.text_uthmani||w.text||'',n:arNorm(w.text_uthmani||w.text||''),m:(w.translation&&w.translation.text)||'',tl:(w.transliteration&&w.transliteration.text)||'',au:w.audio_url||''}))});
  page=j.pagination&&j.pagination.next_page}
 WBM[s]=out;return out}
// бизнинг матндаги сўз рақамини API сўзига мослаш
function wbwMatch(tokens,api,wi){const ours=tokens.map((x,i)=>({i,n:arNorm(x)})).filter(x=>x.n);const k=ours.findIndex(x=>x.i===wi);if(k<0)return null;
 if(ours.length===api.length&&wsim(ours[k].n,api[k].n)>=0.5)return api[k];
 let best=null,bs=0;api.forEach((w,j)=>{const sc=wsim(ours[k].n,w.n)-Math.abs(j/Math.max(1,api.length-1)-k/Math.max(1,ours.length-1))*0.5;if(sc>bs){bs=sc;best=w}});return bs>0.4?best:null}
function wbwPop(html){let p=$('#wbwPop');if(!p){p=document.createElement('div');p.id='wbwPop';document.body.appendChild(p)}p.innerHTML=`<button class="wbx" id="wbwX" aria-label="close">✕</button>${html}`;p.classList.add('on')}
async function wbwShow(s,a,wi){const tok=(Q&&Q[s-1].v[a-1]||'').split(' ');const w0=tok[wi]||'';
 wbwPop(`<div class="ar wbar">${esc(w0)}</div><div class="small">${t('loading')}</div>`);
 try{const d=await wbwGet(s),m=wbwMatch(tok,d[a]||[],wi);
  if(!m){wbwPop(`<div class="ar wbar">${esc(w0)}</div><div class="small">${t('wbw_none')}</div>`);return}
  let gl='';try{gl=await seraj(s,a,w0)}catch(_){}
  wbwPop(`<div class="ar wbar">${esc(w0)}</div>${m.tl?`<div class="wbtl">${esc(m.tl)}</div>`:''}<div class="wbm"><span class="tag">EN</span> ${esc(m.m)}</div>${gl?`<div class="wbm wbara" dir="rtl"><span class="tag">AR</span> ${esc(gl)}</div>`:''}
   <div class="small" style="text-align:center"><a href="https://ru.quranacademy.org/quran/${s}:${a}" target="_blank" rel="noopener">RU · ${t('wbw_ru')} ↗</a></div>
   <div class="links"><button class="btn p" data-ww2="${s}:${a}:${wi}">▶ ${t('wbw_play')}</button></div><div class="small" style="opacity:.7">${t('wbw_src')}${gl?' '+t('wbw_src_ar'):''}</div>`)}
 catch(e){wbwPop(`<div class="ar wbar">${esc(w0)}</div><div class="small">${t('wbw_fail')}</div>`)}}
document.addEventListener('click',e=>{if(e.target.closest('#wbwX')){const p=$('#wbwPop');if(p)p.classList.remove('on');return}
 const b=e.target.closest('[data-ww2]');if(b){const [s,a,w]=b.dataset.ww2.split(':').map(Number);if(!playWords(s,a,[w]))playList([[s,a]],0);return}
 const w=e.target.closest('.ayah .w,.pline .w');if(w&&wbwOn()&&!store.get('hide',false)){wbwShow(+w.dataset.s,+w.dataset.a2,+w.dataset.w)}});
document.addEventListener('change',e=>{if(e.target.id==='wbwOn'){store.set('wbwOn',e.target.checked);const p=$('#wbwPop');if(p)p.classList.remove('on');render()}});

// Арабча сўз маъноси: «ас-Сирож фи баёни ғарибил Қуръон» (QuranEnc, arabic_seraj) — қийин сўзлар изоҳи
async function seraj(s,a,w){const d=await trGet('arabic_seraj',s),x=d[a];if(!x||!x.t)return '';const n=arNorm(w);let best='',bs=0;
 x.t.split(/\n+/).forEach(line=>{const i=line.indexOf(':');if(i<1)return;const head=line.slice(0,i),hn=arNorm(head);if(!hn)return;
  const hw=hn.split(/\s+/);let sc=0;head.split(/\s+/).map(arNorm).filter(Boolean).forEach(h=>{sc=Math.max(sc,wsim(h,n),(n.length>=3&&(h.includes(n)||n.includes(h)))?0.8:0)});
  if(sc>bs){bs=sc;best=head.trim()+': '+line.slice(i+1).trim()}});return bs>=0.7?best:''}

// ---------- Тажвид текшируви (HisnLabs Tajweed v2) ----------
let TJB=null,TJS=null;
function tajLoad(){return new Promise((res,rej)=>{if(window.TAJ)return res(window.TAJ);const sc=document.createElement('script');sc.src='tajweed.js';sc.onload=()=>res(window.TAJ);sc.onerror=rej;document.head.appendChild(sc)})}
const MADDN={NormalMaddRule:'tjm_nat',MonfaselMaddRule:'tjm_munf',MottaselMaddRule:'tjm_mutt',MottaselMaddPauseRule:'tjm_mutt',LazemMaddRule:'tjm_lazim',AaredMaddRule:'tjm_arid',LeenMaddRule:'tjm_lin',BadalMadd:'tjm_badal',LeenHamzaMadd:'tjm_lin'};
const VOWN={'َ':'fatha','ُ':'damma','ِ':'kasra'};
const RULEQ={madd:'madd',NormalMaddRule:'maddt',MonfaselMaddRule:'maddm',MottaselMaddRule:'maddm',LazemMaddRule:'maddl',AaredMaddRule:'madd',ghunnah:'ghunna',idgham_ghunnah:'idgham',idgham:'idgham',ikhfa:'ikhfa',iqlab:'iqlab',qalqalah:'qalqala',shadda:'shadda',vowel:'harakat'};
function tjMsg(n){const k=n.k||{},mn=k.rule?t(MADDN[k.rule]||'tjm_nat'):'';
 switch(n.kind){case 'madd_short':return t('tj_madd_short',{n:mn,h:k.heard,w:k.want});case 'madd_long':return t('tj_madd_long',{n:mn,h:k.heard,w:k.want});
  case 'madd_missing':return t('tj_madd_missing',{n:mn});case 'madd_added':return t('tj_madd_added');case 'madd_uneven':return t('tj_madd_uneven',{n:mn,l:k.lens});
  case 'ghunnah_short':return t('tj_ghunnah_short');case 'ikhfa_izhar':return t('tj_ikhfa_izhar');case 'ikhfa_short':return t('tj_ikhfa_short');
  case 'iqlab_missed':return t('tj_iqlab');case 'idgham_missed':return t('tj_idgham',{l:k.letter||''});case 'idgham_ghunnah_short':return t('tj_idgham_gh');
  case 'shadda_missing':return t('tj_shadda',{l:k.letter||''});case 'qalqalah_missing':return t('tj_qalqala',{l:k.letter||''});
  case 'letter':return t('tj_letter',{h:k.heard,w:k.want});case 'vowel':return t('tj_vowel',{h:t('tj_'+VOWN[k.heard]),w:t('tj_'+VOWN[k.want])});
  case 'dropped':return t('tj_dropped',{w:k.want});case 'added':return t('tj_added',{h:k.heard});case 'word_missing':return t('tj_word');default:return n.rule}}
async function tajRun(blob,s,a){TJB={blob,s,a};const box=$('#tajBox');if(!box)return;
 let T;try{T=await tajLoad()}catch(e){box.innerHTML=`<b>🎯 ${t('tj_title')}</b><div class="small">${t('tj_fail')}</div>`;return}
 if(!(await T.cached())&&!TJS){box.innerHTML=`<b>🎯 ${t('tj_title')}</b><p class="small">${t('tj_intro')}</p><button class="btn p" id="tjDl">⬇ ${t('tj_dl')}</button>`;return}
 box.innerHTML=`<b>🎯 ${t('tj_title')}</b><div class="small" id="tjSt">${t('tj_wait')}</div>`;
 try{const r=await T.check(blob,s,a,p=>{const e=$('#tjSt');if(e)e.textContent=t('tj_dl_p',{n:Math.round(p*100)})});TJS=true;tajShow(r,s,a)}
 catch(e){const b2=$('#tajBox');if(b2)b2.innerHTML=`<b>🎯 ${t('tj_title')}</b><div class="small">${t('tj_fail')}</div>`;console.warn(e)}}
function tajShow(r,s,a){const box=$('#tajBox');if(!box)return;const W=r.words,bad=W.filter(w=>!w.ok),our=(Q&&Q[s-1].v[a-1]||'').split(' ').filter(x=>arNorm(x));
 const same=our.length===W.length,wi=k=>same?(Q[s-1].v[a-1].split(' ').findIndex((x,i,arr)=>arr.slice(0,i+1).filter(y=>arNorm(y)).length===k+1)):-1;
 const madd=W.flatMap(w=>w.madd.map(m=>`${esc(w.word)} — ${t(MADDN[m.rule]||'tjm_nat')}: ${m.heard}`));
 box.innerHTML=`<b>🎯 ${t('tj_title')}</b><div style="margin:6px 0"><b>${bad.length?esc(t('tj_found',{n:bad.length})):esc(t('tj_clean'))}</b></div>
 <div class="ar tfay">${W.map((w,k)=>`<button class="tfw ${w.ok?'ok':'no'}" ${wi(k)>=0?`data-tw="${s}:${a}:${wi(k)}"`:''}>${esc(w.word)}</button>`).join(' ')}</div>
 ${bad.map(w=>{const k=W.indexOf(w),i=wi(k);return `<div class="tfcard"><div class="row" style="align-items:center;gap:10px;justify-content:space-between"><span class="ar" style="font-size:calc(30px*var(--arz))">${esc(w.word)}</span>${i>=0?`<button class="btn p" data-tw="${s}:${a}:${i}">▶ ${t('tf_listen')}</button>`:`<button class="btn p" data-play="${s}:${a}">▶ ${t('tf_listen')}</button>`}</div>
  <ul style="margin:6px 0 0;padding-left:18px">${w.notes.map(n=>{const q=RULEQ[n.k&&n.k.rule]||RULEQ[n.rule];return `<li>${n.sev==='jali'?'🔴':'🟠'} ${esc(tjMsg(n))}${q?` <a href="#qoida-${q}">${t('tj_rule')}</a>`:''}</li>`}).join('')}</ul></div>`}).join('')}
 ${madd.length?`<details><summary class="small">${t('tj_madds')}</summary><div class="small">${madd.join('<br>')}</div></details>`:''}
 <div class="small" style="margin-top:6px">🔴 ${t('tj_jali')} · 🟠 ${t('tj_khafi')}</div><div class="note small">${t('tj_note')}</div>`}
document.addEventListener('click',e=>{const b=e.target.closest('#tjDl');if(!b)return;b.disabled=true;b.textContent=t('tj_dl_p',{n:0});
 tajLoad().then(T=>T.ready(p=>{b.textContent=t('tj_dl_p',{n:Math.round(p*100)})})).then(()=>{TJS=true;if(TJB)tajRun(TJB.blob,TJB.s,TJB.a)}).catch(err=>{b.disabled=false;b.textContent=t('tj_dl');const bx=$('#tajBox');if(bx)bx.insertAdjacentHTML('beforeend',`<div class="small">${t('tj_fail')}</div>`);console.warn(err)})});

// =================== МУСҲАФ (янги) ===================
const JUZ=[[1,1],[2,142],[2,253],[3,93],[4,24],[4,148],[5,82],[6,111],[7,88],[8,41],[9,93],[11,6],[12,53],[15,1],[17,1],[18,75],[21,1],[23,1],[25,21],[27,56],[29,46],[33,31],[36,28],[39,32],[41,47],[46,1],[51,31],[58,1],[67,1],[78,1]];
const mview=()=>store.get('mview','ayat'),mmode=()=>store.get('mmode','ar');
let CHP=null;async function chapters(){if(CHP)return CHP;const url='https://api.quran.com/api/v4/chapters';let j=null;const ca='caches' in window?await caches.open('qu-audio').catch(()=>null):null;
 try{const r=await fetch(url,{mode:'cors'});if(r.ok){j=await r.json();if(ca)ca.put(url,new Response(JSON.stringify(j))).catch(()=>{})}}catch(e){}
 if(!j&&ca){const m=await ca.match(url).catch(()=>null);if(m)j=await m.json()}if(!j)throw 0;CHP=j.chapters;return CHP}
const juzOf=(s,a)=>{let j=1;JUZ.forEach((x,i)=>{if(s>x[0]||(s===x[0]&&a>=x[1]))j=i+1});return j};
// кунлик ўқиш
function rdGet(){const r=store.get('rd',{}),d=today();return r[d]||0}
function rdAdd(k){const r=store.get('rd',{}),d=today(),sk=store.get('rdk',{});if(sk.d!==d){sk.d=d;sk.k=[]}if(sk.k.includes(k))return;sk.k.push(k);if(sk.k.length>400)sk.k=sk.k.slice(-400);store.set('rdk',sk);r[d]=(r[d]||0)+1;
 const keys=Object.keys(r).sort();if(keys.length>60)delete r[keys[0]];store.set('rd',r);store.set('lastr',k);markActive();const e=$('#msRd');if(e)e.innerHTML=rdLine()}
function rdLine(){const g=+store.get('mgoal',10),n=rdGet();return `📖 ${t('ms_today',{n,g})}${n>=g?' ✅':''} · 🔥 ${streak()}`}
const bm=()=>store.get('bm',{});
const JUZN=['الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع','العاشر','الحادي عشر','الثاني عشر','الثالث عشر','الرابع عشر','الخامس عشر','السادس عشر','السابع عشر','الثامن عشر','التاسع عشر','العشرون','الحادي والعشرون','الثاني والعشرون','الثالث والعشرون','الرابع والعشرون','الخامس والعشرون','السادس والعشرون','السابع والعشرون','الثامن والعشرون','التاسع والعشرون','الثلاثون'];
const TJP={};
function msHead(s,a,p){return `<div class="mhead"><div class="mpt" id="msPt">${msPtHTML()}</div>
 <div class="mcart"><button class="cart" id="msJuz" aria-label="juz"><span>الجزء ${JUZN[juzOf(s,a)-1]}</span></button><button class="mpgn${store.get('mpgn',true)?'':' off'}" id="msPgN" aria-label="page">${p?arNum(p):'•'}</button><button class="cart" id="msSura" aria-label="sura"><span>سورة ${Q[s-1].ar}</span></button></div></div>`}
function msPtHTML(){const nw=ptNow(),nx=ptNext();if(!nw||!nx)return '';const S=Math.max(0,Math.round(nw.left*3600));return `<span>${esc(nw.n)}: <b class="clk">${Math.floor(S/3600)}:${String(Math.floor(S%3600/60)).padStart(2,'0')}:${String(S%60).padStart(2,'0')}</b></span><span>${esc(nx.n)} ${nx.s}</span>`}
function msPtTick(){const e=$('#msPt');if(e)e.innerHTML=msPtHTML()}
function msTool(){const hide=store.get('hide',false),mm=mmode(),pl=typeof P!=='undefined'&&P.list.length&&!P.a.paused;
 const b=(id,ic,lb,on)=>`<button id="${id}" class="${on?'on':''}"><i>${ic}</i><small>${lb}</small></button>`;
 return `<div class="mtool">${b('mtPlay',pl?'⏸':'▶',t('mt_play'),pl)}${b('mtBm','⭐',t('mt_bm'))}${b('mtAuto','⏬',t('mt_auto'),!!AS)}${b('mtShare','📤',t('mt_share'))}${b('mtTr','🌐',t('mt_tr'),mm==='tr')}${b('mtHz','🧠',t('mt_hifz'),hide)}${b('mtMore','⋯',t('mt_more'))}</div>`}
function vMushaf2(){if(!Q)return `<p class="small">${t('loading')}</p>`;const s=store.get('sura',1),S_=Q[s-1],hide=store.get('hide',false),v=mview(),last=store.get('lastr','');
 const p0=v==='page'?+store.get('mpage',0):ayPage(s,1)||0;
 const bar2=`<div class="msbar2"><div class="seg"><button class="${v==='ayat'?'on':''}" data-mv="ayat">☰ ${t('ms_ayat')}</button><button class="${v==='page'?'on':''}" data-mv="page">📖 ${t('ms_page')}</button></div>
  <button class="btn sm rchip" id="msRec">🎙 ${esc(rec().n.split(' (')[0].split(' ').slice(-2).join(' '))} ▾</button><button class="btn sm${tajOn()?' p':''}" id="msTaj" aria-label="tajweed" title="${t('ms_tajc')}">🎨</button><span class="small" id="msRd">${rdLine()}</span></div>
 ${tajOn()&&!hide?`<details class="tjd"><summary class="small">🎨 ${t('ms_tajc')} — ${t('tj_legend')}</summary>${tajLegend()}</details>`:''}
 ${last&&last.split(':')[0]!=String(s)?`<button class="btn mscont" data-go="${last}">↪ ${t('ms_cont',{r:esc(Q[+last.split(':')[0]-1].tr)+' '+last})}</button>`:''}`;
 const top=msHead(s,1,p0)+bar2,tool=msTool();
 if(v==='page')return top+`<div class="mframe"><div class="mpaper"><div id="msPage" class="mpage${tajOn()?' tajc':''}"><p class="small">${t('loading')}</p></div></div></div>`+tool;
 const mm=mmode(),bmk=bm(),bis=s!==1&&s!==9?`<div class="ar bism">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>`:'';
 if(mm==='book')return top+`<div class="mframe"><div class="mpaper"><h3 style="margin-top:0">${s}. ${esc(S_.tr)} <span class="ar">${S_.ar}</span></h3><div id="msBook" class="msbook">${t('loading')}</div></div></div>${trCredit()}`+tool;
 const tr=trOn()&&!hide&&mm==='tr',flow=!tr;
 const ay=S_.v.map((tt,i)=>{const k=s+':'+(i+1),b=bmk[k];const ws=tt.split(' '),hs=tajOn()&&!hide?tjWords(ws,true):ws.map(esc);
  const ar=`<span class="ar" data-k="${k}">${ws.map((w,wi)=>`<span class="w" data-w="${wi}" data-s="${s}" data-a2="${i+1}">${hs[wi]}</span>`).join(' ')} <button class="amark${b?' bm-'+b:''}" data-am="${k}" aria-label="${t('ayah_n',{n:i+1})}">${arNum(i+1)}</button></span>`;
  return flow?`<span class="ayah" data-a="${k}">${ar} </span>`:`<div class="ayah" data-a="${k}">${ar}<div class="trn" data-tr="${i+1}"></div></div>`}).join('');
 return top+`<div class="mframe"><div class="mpaper">
 <div class="surahead"><div class="ar">سورة ${S_.ar}</div><div class="small">${esc(S_.tr)} · ${t(S_.tp==='medinan'?'ms_madani':'ms_makki')} · ${t('ms_n_ayat',{n:S_.v.length})}</div></div>${bis}
 ${hide?`<div class="links"><button class="btn p" id="hzRec">🎙 ${t('hz_rec')}</button><button class="btn" id="hzReset">↺ ${t('hz_reset')}</button></div><div class="small" id="hzSt">${t('hz_note')}</div>`:''}
 <div class="msayat${flow?' flow':' trg'}${hide?' hz':''}${tajOn()?' tajc':''}">${ay}</div></div></div>
 ${tr?trCredit():''}
 <div class="row" style="justify-content:space-between;margin-top:14px">${s>1?`<button class="btn" data-gos="${s-1}">← ${esc(Q[s-2].tr)}</button>`:'<span></span>'}${s<114?`<button class="btn" data-gos="${s+1}">${esc(Q[s].tr)} →</button>`:'<span></span>'}</div>`+tool}
// сарлавҳани кўриниб турган оятга мослаш
let MSY=0;function msHeadUpd(){if(location.hash!=='#mushaf'||mview()!=='ayat')return;const hh=($('.mhead')||{}).offsetHeight||100;
 const el=[...document.querySelectorAll('.msayat .ayah')].find(e=>{const r=e.getBoundingClientRect();return r.bottom>hh+20});if(!el)return;const [s,a]=el.dataset.a.split(':').map(Number);
 const j=$('#msJuz span');if(j)j.textContent='الجزء '+JUZN[juzOf(s,a)-1];const p=ayPage(s,a),n=$('#msPgN');if(n&&p)n.textContent=arNum(p)}
window.addEventListener('scroll',()=>{if(MSY)return;MSY=requestAnimationFrame(()=>{MSY=0;msHeadUpd()})},{passive:true});
// мета: саҳифа ва ҳизб белгилари (Quran.com), тажвид билан бирга
async function msMeta(s){try{await tajVerses(s);if(store.get('sura',1)!==s)return;const R=TJR[s]||{};
 document.querySelectorAll('.msayat .ayah').forEach(el=>{const a=+el.dataset.a.split(':')[1];if(R[a])el.classList.add('rub')});msHeadUpd()}catch(e){}}
// автоскролл
let AS=null;function asStop(){if(AS){cancelAnimationFrame(AS.r);AS=null}const p=$('#asPill');if(p)p.remove();const b=$('#mtAuto');if(b)b.classList.remove('on')}
function asStart(){asStop();let acc=0,lt=0;AS={r:0};const sp=()=>+store.get('asp',2);
 const step=ts=>{if(!AS)return;if(lt){acc+=(ts-lt)*sp()*0.012;const d=Math.floor(acc);if(d){window.scrollBy(0,d);acc-=d}}lt=ts;if(window.innerHeight+window.scrollY>=document.body.scrollHeight-2){asStop();return}AS.r=requestAnimationFrame(step)};AS.r=requestAnimationFrame(step);
 document.body.insertAdjacentHTML('beforeend',`<div id="asPill"><button data-asp="-1">−</button><b id="asV">${sp()}×</b><button data-asp="1">+</button><button data-asp="0">⏹</button></div>`);const b=$('#mtAuto');if(b)b.classList.add('on')}
function firstVis(){const hh=($('.mhead')||{}).offsetHeight||100;const el=[...document.querySelectorAll('.msayat .ayah,.pline .w[data-pa]')].find(e=>e.getBoundingClientRect().bottom>hh+10);if(!el)return store.get('sura',1)+':1';return el.dataset.a||el.dataset.pa}
function openBm(){const b=bm(),ks=Object.keys(b).sort((x,y)=>{const [a1,b1]=x.split(':').map(Number),[a2,b2]=y.split(':').map(Number);return a1-a2||b1-b2}),last=store.get('lastr','');
 sheet(`<h3 style="margin-top:0">⭐ ${t('mt_bm')}</h3>${last?`<button class="btn p" data-go="${last}" style="width:100%;margin-bottom:8px">↪ ${t('ms_last')}: ${esc(Q[+last.split(':')[0]-1].tr)} ${last}</button>`:''}
 ${ks.length?`<div class="bmlist">${ks.map(k=>{const [s,a]=k.split(':').map(Number);return `<button class="bmi" data-go="${k}"><span class="bmc bm-${b[k]}"></span><b>${esc(Q[s-1].tr)} ${k}</b><span class="ar">${esc(Q[s-1].v[a-1].split(' ').slice(0,5).join(' '))}…</span></button>`}).join('')}</div>`:`<p class="small">${t('bm_empty')}</p>`}`,'bm')}
function openSet(){sheet(`<h3 style="margin-top:0">⋯ ${t('mt_more')}</h3>${msSettings()}`,'set');qcfPv()}
async function qcfPv(){try{const [d]=await Promise.all([mlGet(604),qcfLoad(604)]);const L=d.lines.find(l=>l.words&&l.words.some(w=>w.location==='112:1:1'));if(!L)return;const g=L.words.filter(w=>w.location.startsWith('112:1:')).map(w=>w.qpcV2).join(' ');
 document.querySelectorAll('[data-qpv]').forEach(e=>{const tj=e.dataset.qpv==='qt',i=document.documentElement.dataset.theme==='dark'?(tj?1:4):document.documentElement.dataset.theme==='sepia'?(tj?2:5):(tj?0:3);e.textContent=g;e.setAttribute('style',`font-family:qcf604;${qcfPalOK?`font-palette:--q604p${i}`:''}`)})}catch(e){}}
function openJuz(){sheet(`<h3 style="margin-top:0">${t('ms_juzs')}</h3><div class="juzg">${JUZ.map((x,i)=>`<button class="btn" data-go="${x[0]}:${x[1]}"><b>${i+1}</b><span class="ar">${JUZN[i]}</span><small>${esc(Q[x[0]-1].tr)} ${x[0]}:${x[1]}</small></button>`).join('')}</div>`,'juz')}
// саҳифани суриб ўтказиш
let SWX=null;document.addEventListener('touchstart',e=>{const p=e.target.closest('#msPage');SWX=p&&e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null},{passive:true});
document.addEventListener('touchend',e=>{if(!SWX)return;const t0=e.changedTouches[0],dx=t0.clientX-SWX.x,dy=t0.clientY-SWX.y;SWX=null;if(Math.abs(dx)<70||Math.abs(dy)>Math.abs(dx)*.6)return;const p=+store.get('mpage',1),np=Math.max(1,Math.min(604,p+(dx>0?1:-1)));if(np!==p){store.set('mpage',np);pageFill();window.scrollTo(0,0)}},{passive:true});
const QFT=[['qt','qcf',1,'qf_qt','qf_qt_d'],['qm','qcf',0,'qf_qm','qf_qm_d'],['tj','kf',1,'qf_tj','qf_tj_d'],['ms','kf',0,'qf_ms','qf_ms_d'],['am','am',null,'qf_am','qf_am_d'],['sh','sh',null,'qf_sh','qf_sh_d']];
const qFont=()=>store.get('qfont','qcf');
function qfCur(){const f=qFont();return f==='kf'?(tajOn()?'tj':'ms'):f==='qcf'?(tajOn()?'qt':'qm'):f}
function qConvW(w,f){return f==='kf'||f==='qcf'?w:w.replace(/ٗ/g,'ࣰ').replace(/ٞ/g,'ࣱ').replace(/ٖ/g,'ࣲ')}
let Q0=null;function qConv(){if(!Q)return;if(!Q0)Q0=Q.map(x=>x.v.slice());const f=qFont();Q.forEach((x,i)=>{x.v=Q0[i].map(v=>qConvW(v,f))})}
function applyQf(){const r=document.documentElement,f=qFont();if(f==='kf'||f==='qcf')delete r.dataset.qf;else r.dataset.qf=f;r.style.setProperty('--qsz',(+store.get('qsz',100)/100).toFixed(2));
 document.body&&document.body.classList.toggle('norule',!store.get('mrule',true));
 if(f==='sh'&&!document.getElementById('shFont')){const l=document.createElement('link');l.id='shFont';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap';document.head.appendChild(l)}}
applyQf();
if(!store.get('mv2',0)){store.set('mv2',1);store.set('mview','page');store.set('qfont','qcf')}
const QFS='قُلۡ هُوَ ٱللَّهُ أَحَدٌ';
function msSettings(){const th=prof.theme||'auto',mm=mmode(),g=store.get('mgoal',10),cur=qfCur(),sz=+store.get('qsz',100);
 return `<button class="btn" style="width:100%;margin-bottom:10px" id="msRec">🎙 ${t('rc_pick')}: <b>${esc(rec().n)}</b> ▾</button><div class="small" style="margin-bottom:6px">${t('qf_title')}</div>${QFT.map(([k,f,tj,n,d])=>{const w=qConvW(QFS,f),html=(k==='tj'||k==='qt')?tjWords(w.split(' '),false).join(' '):esc(w),ff=f==='kf'||f==='qcf'?'"KFGQPC Hafs"':f==='am'?'"Amiri Quran"':'"Scheherazade New","Amiri"';
  return `<button class="fth${cur===k?' on':''}" data-qft="${k}"><span class="pv${k==='tj'||k==='qt'?' tajc':''}"${f==='qcf'?` data-qpv="${k}"`:''} style="font-family:${ff}">${html}</span><span><b>${t(n)}</b><small>${t(d)}</small></span><span class="ck">${cur===k?'✓':''}</span></button>`}).join('')}
 <div class="tgl"><label><input type="checkbox" id="mpgnOn"${store.get('mpgn',true)?' checked':''}>${t('qf_pgn')}</label><label><input type="checkbox" id="mruleOn"${store.get('mrule',true)?' checked':''}>${t('qf_rule')}</label><label><input type="checkbox" id="wbwOn"${wbwOn()?' checked':''}>${t('wbw_on')}</label></div>
 <div class="szr"><span class="small">${t('qf_size')} <b id="qszV">${sz}%</b></span><input type="range" id="qsz" min="60" max="180" step="5" value="${sz}"><span class="ar">سُورَةٌ</span></div>
 <div class="msset">
 <div><span class="small">${t('ms_theme')}</span><div class="seg">${['auto','light','sepia','dark'].map(x=>`<button class="${th===x?'on':''}" data-th="${x}">${t('th_'+x)}</button>`).join('')}</div></div>
 <div><span class="small">${t('ms_mode')}</span><div class="seg">${['ar','tr','book'].map(x=>`<button class="${mm===x?'on':''}" data-mm="${x}">${t('mm_'+x)}</button>`).join('')}</div></div>
 ${mm!=='ar'?`<div><span class="small">${t('tr_on')}</span> <select id="trL2" class="inp" style="width:auto">${['uz','ru','tg','en','ar'].map(k=>`<option value="${k}"${k===trL()?' selected':''}>${t('tr_'+k)}</option>`).join('')}</select></div>`:''}
 <div><span class="small">${t('ms_goal')}</span> <select id="mgoal" class="inp" style="width:auto">${[5,10,20,50,100].map(x=>`<option${x===g?' selected':''}>${x}</option>`).join('')}</select></div></div>
 ${tajOn()?`<h4 style="margin:10px 0 0">🎨 ${t('ms_tajc')}</h4>`+tajLegend():''}`}
const TJC=[['madda_necessary','tl_6','ٱلضَّآلِّينَ'],['madda_obligatory','tl_45','جَآءَ'],['madda_permissible','tl_246','نَسۡتَعِينُ'],['madda_normal','tl_2','مَٰلِكِ'],['ghunnah','tl_gh','إِنَّ'],['qalaqah','tl_q','أَحَدٌ'],['ra_tafkhim','tl_r','رَبِّ'],['slnt','tl_s','ٱللَّهِ']];
function tajLegend(){return `<div class="tjleg tajc">${TJC.map(([c,k,ex])=>`<div class="tjl"><span class="tjdot tj-${c}"></span><span class="ar">${tjWords(ex.split(' '),true).join(' ')}</span><span>${t(k)}</span></div>`).join('')}</div><div class="small" style="opacity:.7">${t('tl_src')}</div>`}
// Quran.com маълумотлари: оятлар (таржима ранглари, сўзлар), саҳифа
async function qcom(url){const ca='caches' in window?await caches.open('qu-audio').catch(()=>null):null;let j=null;
 try{const r=await fetch(url,{mode:'cors'});if(r.ok){j=await r.json();if(ca)ca.put(url,new Response(JSON.stringify(j))).catch(()=>{})}}catch(e){}
 if(!j&&ca){const m=await ca.match(url).catch(()=>null);if(m)j=await m.json()}if(!j)throw new Error('qcom');return j}
// ---------- Маҳаллий тажвид ранглари (Ҳафс, усмоний ёзув; «Мусҳаф ат-Тажвид» ранг тизими) ----------
const TJ_H=/[ً-ٰٟۖ-ࣰۭ-ࣳ]/,TJ_TAN=/[ً-ࣰٍ-ࣲٖٗٞ]/,TJ_SUK=/[ْۡ]/,TJ_SH='ّ',TJ_HAR=/[ً-ࣰِ-ࣲٖٗٞ]/;
const TJ_FD=/[ًࣰٌࣱَُٗٞ]/,TJ_KS=/[ٍࣲِٖ]/;
const TJ_HAMZA='ءأإؤئ',TJ_IZ='ءأإؤئهعحغخ',TJ_IDG='ينمو',TJ_IKH='تثجدذزسشصضطظفقك',TJ_QAL='قطبجد',TJ_HEAVY='خصضغطقظ';
const TJ_ALEF='ا',TJ_WASL='ٱ',TJ_LAM='ل',TJ_NOON='ن',TJ_MEEM='م',TJ_BA='ب',TJ_RA='ر',TJ_WAW='و',TJ_YA='ي',TJ_AM='ى';
function tjTok(w){const out=[];for(const ch of w){if(TJ_H.test(ch)&&out.length)out[out.length-1].m+=ch;else out.push({b:ch,m:''})}return out}
const tjLet=x=>x&&/[ء-يٱۥۦ]/.test(x.b);
function tjWords(words,endAyah){const W=words.map(tjTok),cls=W.map(t=>t.map(()=>''));
 const nxt=(wi,li)=>{let i=wi,j=li+1;for(;;){if(!W[i])return null;if(j<W[i].length){const x=W[i][j];if((x.b===TJ_ALEF||x.b===TJ_AM)&&!TJ_HAR.test(x.m)&&!TJ_SUK.test(x.m)&&!x.m.includes(TJ_SH)&&!x.m.includes('\u0653')&&!(i!==wi&&j===0)){j++;continue}if(!tjLet(x)){j++;continue}return {x,cross:i!==wi,i,j}}i++;j=0}};
 const prv=(wi,li)=>{let i=wi,j=li-1;for(;;){if(j<0){i--;if(i<0)return null;j=W[i].length-1;continue}const x=W[i][j];if(!tjLet(x)||((x.b===TJ_ALEF||x.b===TJ_AM)&&!x.m)){j--;continue}return {x,i,j}}};
 const set=(i,j,c)=>{if(i!=null&&W[i]&&W[i][j]&&!cls[i][j])cls[i][j]=c};
 const LW=W.length-1;
 // вақфдаги ориз мад (охирги сўз)
 if(endAyah&&W[LW]){const t=W[LW];let L=t.length-1;while(L>0&&!tjLet(t[L]))L--;const M=t[L-1],Pm=t[L-2];
  if(M&&!t[L].m.includes(TJ_SH)){const isMadd=(M.b===TJ_ALEF&&!M.m)||(M.b===TJ_WAW&&!TJ_HAR.test(M.m)&&!TJ_SUK.test(M.m)&&Pm&&Pm.m.includes('ُ'))||(M.b===TJ_YA&&!TJ_HAR.test(M.m)&&!TJ_SUK.test(M.m)&&Pm&&Pm.m.includes('ِ'))||M.m.includes('ٰ')||((M.b===TJ_WAW||M.b===TJ_YA)&&TJ_SUK.test(M.m)&&Pm&&Pm.m.includes('َ'));
   if(isMadd)set(LW,L-1,'madda_permissible')}}
 W.forEach((t,wi)=>t.forEach((x,li)=>{const b=x.b,m=x.m,last=endAyah&&wi===LW&&!t.slice(li+1).some(tjLet);
  if(b===TJ_WASL){set(wi,li,'ham_wasl');const l=t[li+1],n2=t[li+2];if(l&&l.b===TJ_LAM&&!l.m&&n2&&n2.m.includes(TJ_SH))cls[wi][li+1]='laam_shamsiyah';return}
  if(!last&&(m.includes('ۢ')||m.includes('ۭ'))){set(wi,li,'iqlab');return}
  if(m.includes('۟')){set(wi,li,'slnt');return}
  if(b===TJ_ALEF&&!m&&li===t.length-1&&li>0&&t[li-1].b===TJ_WAW){set(wi,li,'slnt');return}
  if(m.includes('ٓ')){const n=nxt(wi,li);let c='madda_necessary';if(n){c='madda_normal';if(TJ_HAMZA.includes(n.x.b)||n.x.m.includes('ٔ'))c=n.cross?'madda_munfasil':'madda_obligatory';else if(n.x.m.includes(TJ_SH)||TJ_SUK.test(n.x.m)||!TJ_HAR.test(n.x.m))c='madda_necessary'}set(wi,li,c);return}
  if((b===TJ_NOON||b===TJ_MEEM)&&m.includes(TJ_SH)){set(wi,li,'ghunnah');return}
  if(b==='ۥ'||b==='ۦ'||m.includes('ٰ')){set(wi,li,'madda_normal')}
  const tan=TJ_TAN.test(m),noonS=b===TJ_NOON&&!TJ_HAR.test(m)&&!m.includes(TJ_SH);
  if((tan||noonS)&&!last){const n=nxt(wi,li);if(!n)return;const c=n.x.b;
   if(TJ_IZ.includes(c)||c===TJ_WASL)return;
   if(TJ_IDG.includes(c)){if(n.cross){if(noonS)set(wi,li,'slnt');set(n.i,n.j,'idgham_ghunnah')}return}
   if(c===TJ_LAM||c===TJ_RA){if(n.cross&&noonS)set(wi,li,'idgham_wo_ghunnah');return}
   if(c===TJ_BA){set(wi,li,'iqlab');return}
   if(TJ_IKH.includes(c))set(wi,li,'ikhafa');return}
  if(b===TJ_MEEM&&!TJ_HAR.test(m)&&!m.includes(TJ_SH)){const n=nxt(wi,li);if(n&&n.x.b===TJ_BA)set(wi,li,'ikhafa_shafawi');else if(n&&n.x.b===TJ_MEEM)set(wi,li,'slnt');return}
  if(TJ_QAL.includes(b)&&(TJ_SUK.test(m)||(last&&!m.includes(TJ_SH)))){set(wi,li,'qalaqah');return}
  if(b===TJ_RA){let heavy=false;
   if(!last&&TJ_FD.test(m))heavy=true;
   else if(!last&&TJ_KS.test(m))heavy=false;
   else{const p=prv(wi,li);if(p){let q=p;if(!TJ_HAR.test(q.x.m)&&q.x.b!==TJ_WASL){if(q.x.b===TJ_YA&&TJ_SUK.test(q.x.m))q=null;else q=prv(q.i,q.j)}
     if(q){if(q.x.b===TJ_WASL)heavy=true;else if(TJ_FD.test(q.x.m))heavy=true;else if(TJ_KS.test(q.x.m)){const n=nxt(wi,li);heavy=!!(n&&!n.cross&&TJ_HEAVY.includes(n.x.b))}}}}
   if(heavy)set(wi,li,'ra_tafkhim');return}
  if(!TJ_HAR.test(m)&&!TJ_SUK.test(m)&&!m.includes(TJ_SH)&&/[ء-ي]/.test(b)&&!'اوىي'.includes(b)&&!m.includes('ٰ')){const n=nxt(wi,li);if(n&&n.x.m.includes(TJ_SH))set(wi,li,'idgham_mutajanisayn')}
 }));
 return W.map((t,wi)=>{let h='',cur='';t.forEach((x,li)=>{const c=cls[wi][li],s=esc(x.b+x.m);if(c!==cur){if(cur)h+='</tajweed>';if(c)h+=`<tajweed class="${c}">`;cur=c}h+=s});if(cur)h+='</tajweed>';return h})}

const TJV={},TJR={};const tajOn=()=>store.get('tajc',true);
async function tajVerses(s){if(TJV[s])return TJV[s];const out={};let RB=0;let page=1,g=0;while(page&&g++<12){const j=await qcom(`https://api.quran.com/api/v4/verses/by_chapter/${s}?fields=text_uthmani_tajweed&per_page=50&page=${page}`);(j.verses||[]).forEach(v=>{out[v.verse_number]=v.text_uthmani_tajweed||'';(TJP[s]=TJP[s]||{})[v.verse_number]=v.page_number;if(v.rub_el_hizb_number&&v.rub_el_hizb_number!==RB)(TJR[s]=TJR[s]||{})[v.verse_number]=v.verse_number>1||s===1?1:0;RB=v.rub_el_hizb_number});page=j.pagination&&j.pagination.next_page}TJV[s]=out;return out}
// фақат <tajweed class> ва <span class=end> қолдирилади
function tjSafe(h){return String(h).replace(/<span class=["']?end["']?>[^<]*<\/span>/g,'').replace(/<(\/?)([a-z]+)([^>]*)>/gi,(m,cl,tag,at)=>{if(tag.toLowerCase()!=='tajweed')return '';if(cl)return '</tajweed>';const c=(at.match(/class=["']?([a-z_]+)/i)||[])[1]||'';return `<tajweed class="${c}">`})}
async function tajFill(s){try{const d=await tajVerses(s);if(store.get('sura',1)!==s||!tajOn())return;
 document.querySelectorAll('.msayat .ayah').forEach(el=>{const a=+el.dataset.a.split(':')[1],h=d[a];if(!h)return;const ws=tjSafe(h).trim().split(/\s+/).filter(x=>x.replace(/<[^>]+>/g,'').trim()),sp=el.querySelectorAll('.ar .w');if(ws.length!==sp.length)return;sp.forEach((e,i)=>{e.innerHTML=ws[i]})})}
 catch(e){}}
async function bookFill(s){const box=$('#msBook');if(!box)return;const l=trL(),key=TRK[l][0];try{const d=await trGet(key,s);if(store.get('sura',1)!==s)return;
 box.innerHTML=Object.keys(d).map(Number).sort((x,y)=>x-y).map(a=>`<span class="bka" data-a="${s}:${a}"><sup>${a}</sup> ${esc(d[a].t)} </span>`).join('');if(l==='ar')box.setAttribute('dir','rtl');trVer(key)}
 catch(e){box.innerHTML=`<span class="small">${t('tr_fail')}</span>`}}
// 604 саҳифали кўриниш
let RDT=null;function rdLater(k){clearTimeout(RDT);RDT=setTimeout(()=>{},0);setTimeout(()=>{if(location.hash==='#mushaf'&&mview()==='page')rdAdd(k)},8000)}
// кўриниб турган оятларни «ўқилди» деб ҳисоблаш
let IO=null;function rdObserve(){if(IO)IO.disconnect();if(!('IntersectionObserver' in window))return;const tm=new Map();
 IO=new IntersectionObserver(es=>es.forEach(e=>{const k=e.target.dataset.a;if(e.isIntersecting){tm.set(k,setTimeout(()=>rdAdd(k),2500))}else{clearTimeout(tm.get(k));tm.delete(k)}}),{threshold:0.6});
 document.querySelectorAll('.msayat .ayah').forEach(el=>IO.observe(el))}
function msAfter(){const s=store.get('sura',1);if(PTI)clearInterval(PTI);PTI=setInterval(msPtTick,1000);const sh=$('#msSheet.on');if(sh&&sh.dataset.k==='set')openSet();
 if(mview()==='page'){pageFill();return}
 const mm=mmode(),hide=store.get('hide',false);if(mm==='book'){bookFill(s);return}
 ayatQcf(s);pidxP.then(msHeadUpd);if(trOn()&&mm==='tr'&&!hide)trFill(s);
 rdObserve();const go=store.get('msgo','');if(go){store.set('msgo','');const el=document.querySelector(`.ayah[data-a="${go}"]`);if(el){el.scrollIntoView({block:'center'});el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),2200)}}}
function msGo(k){const [s,a]=k.split(':').map(Number);if(!Q||!Q[s-1]||a<1||a>Q[s-1].v.length)return;store.set('sura',s);store.set('msgo',k);store.set('mview','ayat');store.set('mpage',0);if(location.hash!=='#mushaf')location.hash='mushaf';else render()}
// Сура рўйхати ва қидирув
function sheet(html,id){let p=$('#msSheet');if(!p){p=document.createElement('div');p.id='msSheet';document.body.appendChild(p)}p.innerHTML=`<div class="shbg" data-shclose="1"></div><div class="shp"><button class="wbx" data-shclose="1">✕</button>${html}</div>`;p.className='on';p.dataset.k=id||''}
const shClose=()=>{const p=$('#msSheet');if(p)p.className=''};
function suraList(q){q=(q||'').trim();const n=arNorm(q),isAr=/[؀-ۿ]/.test(q);let out='';
 const m=q.match(/^(\d{1,3})\s*[:.\s]\s*(\d{1,3})$/);if(m)out+=`<button class="btn p" data-go="${+m[1]}:${+m[2]}">→ ${+m[1]}:${+m[2]}</button>`;
 if(isAr&&n.length>=3){const hits=[];for(let s=1;s<=114&&hits.length<30;s++)Q[s-1].v.forEach((v,i)=>{if(hits.length<30&&arNorm(v.replace(/\s+/g,' ')).includes(n.replace(/\s+/g,'')))hits.push([s,i+1,v])});
  return out+`<div class="small">${t('ms_found',{n:hits.length})}</div>`+hits.map(([s,a,v])=>`<button class="shrow" data-go="${s}:${a}"><b>${s}:${a}</b> <span class="ar" style="font-size:18px">${esc(v.length>80?v.slice(0,80)+'…':v)}</span></button>`).join('')}
 const ql=q.toLowerCase();return out+Q.filter(x=>!q||String(x.n)===q||x.tr.toLowerCase().includes(ql)||x.ar.includes(q)).map(x=>`<button class="shrow" data-gos="${x.n}"><span class="num">${x.n}</span><span style="flex:1;text-align:left"><b>${esc(x.tr)}</b><br><span class="small">${t(x.tp==='medinan'?'ms_madani':'ms_makki')} · ${t('ms_n_ayat',{n:x.v.length})}</span></span><span class="ar" style="font-size:22px">${x.ar}</span></button>`).join('')}
function openSuras(){sheet(`<h3 style="margin:0 0 8px">${t('ms_suras')}</h3><input id="msQ" class="inp" type="search" placeholder="${esc(t('ms_q'))}" style="width:100%">
 <div class="seg" style="margin:8px 0;flex-wrap:wrap">${JUZ.map((j,i)=>`<button data-go="${j[0]}:${j[1]}">${i+1}</button>`).join('')}</div><div class="small">${t('ms_juzs')}</div>
 <div id="msList">${suraList('')}</div>`,'suras')}
// Оят менюси
function openAyah(k){const [s,a]=k.split(':').map(Number),b=bm()[k],m=memo(),ab=store.get('ab',{});
 sheet(`<div class="ar${tajOn()?' tajc':''}" style="font-size:22px;text-align:center;margin:6px 24px">${tajOn()?tjWords(Q[s-1].v[a-1].split(' '),true).join(' '):esc(Q[s-1].v[a-1])}</div><div class="small" style="text-align:center">${esc(Q[s-1].tr)} ${k} · ${t('ms_juz',{n:juzOf(s,a)})}</div>
 <div class="shgrid">
 <button data-sh="play" data-k="${k}">▶<br>${t('sh_play')}</button>
 <button data-sh="playfrom" data-k="${k}">⏩<br>${t('sh_from')}</button>
 <button data-sh="a" data-k="${k}">🅰<br>${ab.a===k?'✓ ':''}${t('sh_a')}</button>
 <button data-sh="b" data-k="${k}">🅱<br>${ab.b===k?'✓ ':''}${t('sh_b')}</button>
 <button data-sh="tr" data-k="${k}">🌐<br>${t('sh_tr')}</button>
 <button data-sh="chk" data-k="${k}">🎙<br>${t('sh_chk')}</button>
 <button data-sh="memo" data-k="${k}">${m[k]?'✅':'☑'}<br>${t('memorized')}</button>
 <button data-sh="img" data-k="${k}">🖼<br>${t('sh_img')}</button>
 <button data-sh="copy" data-k="${k}">📋<br>${t('sh_copy')}</button>
 <button data-sh="share" data-k="${k}">📤<br>${t('ay_share')}</button></div>
 <div class="small" style="margin-top:6px">🔖 ${t('sh_bm')}</div><div class="bmrow">${['green','gold','red','blue'].map(c=>`<button class="bmc bm-${c}${b===c?' on':''}" data-bm="${c}" data-k="${k}"></button>`).join('')}<button class="btn" data-bm="" data-k="${k}">✕</button></div>
 <div id="shTr"></div>`,'ayah')}
const TAF={uz:['uzbek_mokhtasar',{uz:'«Ал-Мухтасар фит-тафсир» — ўзбекча',ru:'«Аль-Мухтасар фи тафсир» — узбекский',tg:'«Ал-Мухтасар фит-тафсир» — ӯзбекӣ'}],
 ru:['russian_mokhtasar',{uz:'«Ал-Мухтасар фит-тафсир» — русча',ru:'«Аль-Мухтасар фи тафсир» — русский',tg:'«Ал-Мухтасар фит-тафсир» — русӣ'}],
 ar:['arabic_moyassar',{uz:'«Ат-Тафсир ал-муяссар» — арабча',ru:'«Ат-Тафсир аль-муяссар» — арабский',tg:'«Ат-Тафсир ал-муяссар» — арабӣ'}]};
async function shTr(k){const [s,a]=k.split(':').map(Number),box=$('#shTr');if(!box)return;box.innerHTML=`<p class="small">${t('loading')}</p>`;
 const l0=trL()==='ar'?(lang()==='ru'?'ru':lang()==='tg'?'tg':'uz'):trL(),ul=lang()==='ru'?'ru':lang()==='tg'?'tg':'uz';
 const tfl=[...new Set([l0==='ru'||ul==='ru'||ul==='tg'?'ru':'uz',ul==='tg'?'uz':null].filter(Boolean))];
 const one=async(key,lab,ar,cls)=>{try{const d=await trGet(key,s),x=d[a];if(!x||!x.t)return '';return `<div class="trn ${cls}"><div class="small"><b>${esc(lab)}</b></div><p${ar?' dir="rtl" class="artr"':''}>${esc(x.t)}</p>${x.f?`<details><summary class="small">${t('tr_fn')}</summary><p class="small">${esc(x.f)}</p></details>`:''}</div>`}catch(e){return ''}};
 const jobs=[one(TRK[l0][0],t('sh_trn')+': '+tx(TRK[l0][1]),false,'')];
 tfl.forEach(l=>jobs.push(one(TAF[l][0],t('sh_tafsir')+': '+tx(TAF[l][1]),false,'tfs')));
 jobs.push(one(TAF.ar[0],t('sh_tafsir')+': '+tx(TAF.ar[1]),true,'tfs'));
 const parts=await Promise.all(jobs);if(!$('#shTr'))return;
 box.innerHTML=parts.join('')||`<span class="small">${t('tr_fail')}</span>`;box.insertAdjacentHTML('beforeend',`<div class="small">${t('sh_src')} <a href="https://quranenc.com" target="_blank" rel="noopener">QuranEnc.com</a></div>`)}
// Ёддан ўқиш (ҳифз): овоз билан сўзларни очиш
let HZ=null;
function hzStart(){const s=store.get('sura',1),K=window.SpeechRecognition||window.webkitSpeechRecognition,st=$('#hzSt'),btn=$('#hzRec');
 if(!K){if(st)st.textContent=t('tf_noasr');return}
 if(HZ){try{HZ.stop()}catch(e){}HZ=null;if(btn)btn.textContent='🎙 '+t('hz_rec');return}
 const words=[...document.querySelectorAll('.msayat .w')].filter(w=>arNorm(w.textContent));let pos=words.findIndex(w=>!w.classList.contains('rev')&&!w.classList.contains('miss'));if(pos<0)pos=0;
 const r=new K();r.lang='ar-SA';r.continuous=true;r.interimResults=true;let used=0;HZ=r;if(btn)btn.textContent='⏹ '+t('stop');if(st)st.textContent=t('hz_listen');
 r.onresult=e=>{let all='';for(let i=0;i<e.results.length;i++)all+=' '+e.results[i][0].transcript;const hw=all.trim().split(/\s+/).map(arNorm).filter(Boolean);
  while(used<hw.length&&pos<words.length){const h=hw[used],w0=arNorm(words[pos].textContent);
   if(wsim(h,w0)>=0.6||(w0.length>=4&&h.includes(w0))){words[pos].classList.add('rev');pos++;used++;continue}
   const nx=words[pos+1]&&arNorm(words[pos+1].textContent);if(nx&&wsim(h,nx)>=0.6){words[pos].classList.add('miss');pos++;continue}
   if(!e.results[e.results.length-1].isFinal)break;used++}
  const cur=words[pos];if(cur){const a=cur.closest('.ayah');if(a)a.scrollIntoView({block:'center',behavior:'smooth'})}
  const st2=$('#hzSt');if(st2){const miss=document.querySelectorAll('.msayat .w.miss').length;st2.textContent=t('hz_prog',{n:document.querySelectorAll('.msayat .w.rev').length,m:miss})}};
 r.onerror=ev=>{const st2=$('#hzSt');if(st2)st2.textContent=t('tf_noasr')};
 r.onend=()=>{if(HZ===r){try{r.start()}catch(e){HZ=null}}};try{r.start()}catch(e){HZ=null}}
document.addEventListener('click',e=>{const el=e.target.closest('button,[data-shclose],.w,.bka,.qm');if(!el)return;const d=el.dataset;
 if(d.shclose){shClose();return}
 if(el.id==='msSura'){openSuras();return}
 if(el.id==='msTaj'){store.set('tajc',!tajOn());render();return}
 if(d.qft){const x=QFT.find(q=>q[0]===d.qft);store.set('qfont',x[1]);if(x[2]!==null)store.set('tajc',!!x[2]);qConv();applyQf();render();return}
 if(el.id==='msRec'){cmpSheet(firstVis());return}
 if(el.id==='msJuz'){openJuz();return}
 if(el.id==='msPgN'){const p=+store.get('mpage',0)||1;sheet(`<h3 style="margin-top:0">${t('ms_page')}</h3><div class="row" style="gap:8px"><input id="pgIn" class="inp" type="number" min="1" max="604" value="${p}" style="flex:1"><button class="btn p" id="pgGo">→</button></div>`,'pg');return}
 if(el.id==='pgGo'){const v=Math.max(1,Math.min(604,+($('#pgIn')||{}).value||1));shClose();store.set('mpage',v);store.set('mview','page');render();window.scrollTo(0,0);return}
 if(el.id==='mtPlay'){if(P.list.length&&!P.a.paused){P.a.pause();el.querySelector('i').textContent='▶';el.classList.remove('on');return}const k=firstVis(),[s,a]=k.split(':').map(Number);playList(Q[s-1].v.map((_,i)=>[s,i+1]),a-1);el.querySelector('i').textContent='⏸';el.classList.add('on');return}
 if(el.id==='mtBm'){openBm();return}
 if(el.id==='mtAuto'){if(AS)asStop();else asStart();return}
 if(el.id==='mtShare'){const k=firstVis(),[s,a]=k.split(':').map(Number),txt=`${Q[s-1].v[a-1]}\n— ${Q[s-1].tr} ${k}\n${location.origin+location.pathname}#mushaf`;if(navigator.share)navigator.share({text:txt}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=>{el.querySelector('small').textContent='✓'}).catch(()=>{});return}
 if(el.id==='mtTr'){const k=firstVis();if(mview()==='page')store.set('mview','ayat');const on=mmode()==='tr';store.set('mmode',on?'ar':'tr');if(!on)store.set('trOn',true);store.set('msgo',k);render();return}
 if(el.id==='mtHz'){const k=firstVis(),[s1,a1]=k.split(':').map(Number);if(+store.get('hfs',0)!==s1){store.set('hfs',s1);store.set('hfa',a1);store.set('hfb',0)}location.hash='hifz';return}
 if(el.id==='mtMore'){openSet();return}
 if(d.asp!==undefined){const v=+d.asp;if(!v){asStop();return}const n=Math.max(1,Math.min(6,+store.get('asp',2)+v));store.set('asp',n);const b=$('#asV');if(b)b.textContent=n+'×';return}
 if(el.id==='msSet'){const p=$('#msSetP');if(p)p.classList.toggle('hidden');return}
 if(d.mv){if(d.mv==='page'){const k=firstVis(),[s1,a1]=k.split(':').map(Number);store.set('mpage',ayPage(s1,a1)||0)}store.set('mview',d.mv);render();window.scrollTo(0,0);return}
 if(d.gos){shClose();store.set('sura',+d.gos);store.set('mpage',0);if(location.hash!=='#mushaf')location.hash='mushaf';else{render();window.scrollTo(0,0)}return}
 if(d.go){shClose();msGo(d.go);return}
 if(d.pg){const p=Math.max(1,Math.min(604,+d.pg));store.set('mpage',p);pageFill();window.scrollTo(0,0);return}
 if(d.fz){prof.font=Math.max(0,Math.min(3,(prof.font||0)+(+d.fz)));saveProf();return}
 if(d.th){prof.theme=d.th==='auto'?'':d.th;saveProf();render();setTimeout(()=>{const p=$('#msSetP');if(p)p.classList.remove('hidden')},0);return}
 if(d.mm){store.set('mmode',d.mm);if(d.mm!=='ar')store.set('trOn',true);render();return}
 if(d.am){e.stopPropagation();openAyah(d.am);return}
 if(el.classList.contains('bka')){openAyah(el.dataset.a);return}
 if(d.bm!==undefined&&d.k){const b=bm();if(d.bm)b[d.k]=d.bm;else delete b[d.k];store.set('bm',b);const m=document.querySelector(`.amark[data-am="${d.k}"]`);if(m){m.className='amark'+(d.bm?' bm-'+d.bm:'')}openAyah(d.k);return}
 if(d.sh){const k=d.k,[s,a]=k.split(':').map(Number);
  if(d.sh==='play'){shClose();playList([[s,a]],0);return}
  if(d.sh==='playfrom'){shClose();playList(Q[s-1].v.map((_,i)=>[s,i+1]),a-1);return}
  if(d.sh==='a'||d.sh==='b'){const ab=store.get('ab',{});ab[d.sh]=k;store.set('ab',ab);if(ab.a&&ab.b){const [s1,a1]=ab.a.split(':').map(Number),[s2,a2]=ab.b.split(':').map(Number);
    if(s1===s2){const lo=Math.min(a1,a2),hi=Math.max(a1,a2),L=[];for(let i=lo;i<=hi;i++)L.push([s1,i]);store.set('ab',{});shClose();P.ov=null;
     const reps=Math.max(3,+store.get('rep',1));let round=0;playList(L,0);const onEnd=()=>{if(P.list===L&&P.i===L.length-1&&P.a.ended&&++round<reps){P.i=0;P.left=+store.get('rep',1);startCur()}else P.a.removeEventListener('ended',onEnd)};P.a.addEventListener('ended',onEnd);
     const n=$('#hzSt')||$('#msRd');if(n)n.insertAdjacentHTML('afterend',`<div class="note small" id="abN">${t('sh_ab_on',{a:s1+':'+lo,b:s1+':'+hi,n:reps})}</div>`);return}}openAyah(k);return}
  if(d.sh==='tr'){shTr(k);return}
  if(d.sh==='chk'){shClose();store.set('tref',k);location.hash='tekshiruv';return}
  if(d.sh==='memo'){const m=memo();if(m[k])delete m[k];else m[k]=today();store.set('memo',m);openAyah(k);return}
  if(d.sh==='img'){shClose();store.set('ayref',k);location.hash='oyat';return}
  if(d.sh==='copy'||d.sh==='share'){const txt=`${Q[s-1].v[a-1]}\n— ${Q[s-1].tr} ${k}`;if(d.sh==='share'&&navigator.share){navigator.share({text:txt}).catch(()=>{});return}
   try{navigator.clipboard.writeText(txt);el.innerHTML='✓<br>'+t('sh_copied')}catch(_){}return}}
 if(el.id==='hzRec'){hzStart();return}
 if(el.id==='hzReset'){document.querySelectorAll('.msayat .w').forEach(w=>w.classList.remove('rev','miss'));return}
 if(el.classList.contains('w')&&el.closest('.msayat.hz')){el.classList.add('peek');setTimeout(()=>el.classList.remove('peek'),1500)}},true);
document.addEventListener('input',e=>{if(e.target.id==='qsz'){store.set('qsz',+e.target.value);applyQf();const v=$('#qszV');if(v)v.textContent=e.target.value+'%';return}if(e.target.id==='msQ'){const l=$('#msList');if(l)l.innerHTML=suraList(e.target.value)}});
document.addEventListener('change',e=>{const id=e.target.id;
 if(id==='mpgnOn'){store.set('mpgn',e.target.checked);render();return}
 if(id==='mruleOn'){store.set('mrule',e.target.checked);applyQf();return}
 if(id==='tajcOn'){store.set('tajc',e.target.checked);render();setTimeout(()=>{const p=$('#msSetP');if(p)p.classList.remove('hidden')},0);return}
 if(id==='mgoal'){store.set('mgoal',+e.target.value);const r=$('#msRd');if(r)r.innerHTML=rdLine();return}
 if(id==='trL2'){store.set('trL',e.target.value);render();return}});

// =================== ҲИФЗ: ёддан ўқиш, овоз билан текшириш ===================
let HZF=null;
function hfRange(){const s=+store.get('hfs',store.get('sura',1)),N=Q[s-1].v.length;let a=+store.get('hfa',1),b=+store.get('hfb',N);a=Math.max(1,Math.min(N,a));b=Math.max(a,Math.min(N,b||N));return {s,a,b,N}}
function vHifz(){if(!Q)return `<p class="small">${t('loading')}</p>`;const {s,a,b,N}=hfRange(),md=store.get('hfm','hid'),K=window.SpeechRecognition||window.webkitSpeechRecognition;
 const opt=(n,v)=>Array.from({length:n},(_,i)=>`<option${i+1===v?' selected':''}>${i+1}</option>`).join('');
 const ay=[];for(let i=a;i<=b;i++){const ws=Q[s-1].v[i-1].split(' ');ay.push(`<span class="hfa" data-a="${i}">${ws.map((w,wi)=>`<span class="hfw" data-i="${i}" data-wi="${wi}">${esc(w)}</span>`).join(' ')} <span class="amark" data-hfam="${i}">${arNum(i)}</span></span>`)}
 const last=store.get('hfres',{})[`${s}:${a}-${b}`];
 return `<h2>🧠 ${t('hf2_title')}</h2><p class="small">${t('hf2_d')}</p>
 <div class="card"><div class="row" style="gap:8px;flex-wrap:wrap">
 <label style="flex:2;min-width:150px" class="small">${t('ay_sura')}<select id="hfS" class="inp" style="width:100%">${Q.map((q,i)=>`<option value="${i+1}"${i+1===s?' selected':''}>${i+1}. ${esc(q.tr)} ${q.ar}</option>`).join('')}</select></label>
 <label style="flex:1;min-width:70px" class="small">${t('hf2_from')}<select id="hfA" class="inp" style="width:100%">${opt(N,a)}</select></label>
 <label style="flex:1;min-width:70px" class="small">${t('hf2_to')}<select id="hfB" class="inp" style="width:100%">${opt(N,b)}</select></label></div>
 <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap"><span class="small">${t('hf2_mode')}:</span><div class="seg"><button class="${md==='hid'?'on':''}" data-hfm="hid">${t('hf2_hid')}</button><button class="${md==='faint'?'on':''}" data-hfm="faint">${t('hf2_faint')}</button></div></div>
 ${last?`<div class="small" style="margin-top:6px">${t('hf2_last',{ok:last.ok,n:last.n,e:last.e})}</div>`:''}</div>
 ${K?'':`<div class="note">${t('hf2_noasr')}</div>`}
 <div class="hfbar"><button class="btn p hfgo" id="hfGo">🎙 ${t('hf2_start')}</button><button class="btn" id="hfHint">💡 ${t('hf2_hint')}</button><button class="btn" id="hfReset">↺</button></div>
 <div class="hfst"><span>✅ <b id="hfOk">0</b></span><span>❌ <b id="hfErr">0</b></span><span>💡 <b id="hfH">0</b></span><span class="small" id="hfPct"></span></div>
 <div class="pbar"><b id="hfBar" style="width:0%"></b></div>
 <div class="small hflive" id="hfLive">${t('hf2_ready')}</div>
 <div class="mframe"><div class="mpaper"><div class="surahead"><div class="ar">سورة ${Q[s-1].ar}</div><div class="small">${esc(Q[s-1].tr)} · ${a}–${b}</div></div>
 ${a===1&&s!==1&&s!==9?'<div class="ar bism">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>':''}
 <div class="hftext ${md}" id="hfText">${ay.join(' ')}</div></div></div>
 <div id="hfSum"></div>`}
function hfInit(){const el=[...document.querySelectorAll('#hfText .hfw')];HZF={el,w:el.map(e=>arNorm(e.textContent)),pos:0,pend:null,ok:0,err:0,hint:0,rec:null,used:0,on:false,errA:new Set()};
 el.forEach((e,i)=>{if(!HZF.w[i])e.classList.add('ok','skip')});hfAdv();hfStat()}
function hfAdv(){while(HZF.pos<HZF.el.length&&HZF.el[HZF.pos].classList.contains('skip'))HZF.pos++;document.querySelectorAll('#hfText .cur').forEach(e=>e.classList.remove('cur'));const c=HZF.el[HZF.pos];if(c){c.classList.add('cur');const r=c.getBoundingClientRect();if(HZF.on&&c.scrollIntoView&&(r.top>innerHeight*.7||r.top<90))c.scrollIntoView({block:'center',behavior:'smooth'})}
 document.querySelectorAll('#hfText .hfa').forEach(a=>{const ws=[...a.querySelectorAll('.hfw')];if(ws.length&&ws.every(w=>w.classList.contains('ok')||w.classList.contains('err')||w.classList.contains('hint'))){a.classList.add('done');if(ws.some(w=>w.classList.contains('err')))a.classList.add('bad')}});
 if(HZF.pos>=HZF.el.length)hfFinish()}
function hfStat(){const n=HZF.el.filter(e=>!e.classList.contains('skip')).length,d=HZF.ok+HZF.err+HZF.hint;const set=(i,v)=>{const e=$(i);if(e)e.textContent=v};set('#hfOk',HZF.ok);set('#hfErr',HZF.err);set('#hfH',HZF.hint);set('#hfPct',`${d}/${n}`);const b=$('#hfBar');if(b)b.style.width=(n?d/n*100:0)+'%'}
function hfMark(i,c){const e=HZF.el[i];if(!e||e.classList.contains('ok')||e.classList.contains('err')||e.classList.contains('hint'))return;e.classList.add(c);if(c==='ok')HZF.ok++;else if(c==='err'){HZF.err++;HZF.errA.add(+e.dataset.i)}else HZF.hint++}
function hfM(h,i){const w=HZF.w[i];if(!w)return false;if(h===w)return true;if(wsim(h,w)>=0.62)return true;if(w.length>=4&&h.length>=4&&(h.includes(w)||w.includes(h)))return true;return false}
function hfFeed(h){if(!HZF||!h||HZF.pos>=HZF.el.length)return;const p=HZF.pos;
 if(hfM(h,p)){hfMark(p,'ok');HZF.pos=p+1;HZF.pend=null;hfAdv();hfStat();return}
 const two=HZF.w[p]+(HZF.w[p+1]||'');if(HZF.w[p+1]&&wsim(h,two)>=0.75){hfMark(p,'ok');hfMark(p+1,'ok');HZF.pos=p+2;HZF.pend=null;hfAdv();hfStat();return}
 if(HZF.pend&&wsim(HZF.pend+h,HZF.w[p])>=0.75){hfMark(p,'ok');HZF.pos=p+1;HZF.pend=null;hfAdv();hfStat();return}
 for(let k=1;k<=3;k++){let q=p+k;if(q<HZF.el.length&&hfM(h,q)){for(let j=p;j<q;j++)hfMark(j,'err');hfMark(q,'ok');HZF.pos=q+1;HZF.pend=null;hfAdv();hfStat();return}}
 if(HZF.pend!==null){hfMark(p,'err');HZF.pos=p+1;HZF.pend=null;hfAdv();if(HZF.pos<HZF.el.length&&hfM(h,HZF.pos)){hfMark(HZF.pos,'ok');HZF.pos++;hfAdv()}else HZF.pend=h;hfStat();return}
 HZF.pend=h}
function hfStart(){const K=window.SpeechRecognition||window.webkitSpeechRecognition;if(!K){const l=$('#hfLive');if(l)l.textContent=t('hf2_noasr');return}
 if(!HZF)hfInit();if(HZF.pos>=HZF.el.length){hfInit();document.querySelectorAll('#hfText .hfw').forEach(e=>e.classList.remove('ok','err','hint','cur'));document.querySelectorAll('#hfText .hfa').forEach(e=>e.classList.remove('done','bad'));hfInit();const sm=$('#hfSum');if(sm)sm.innerHTML=''}
 const r=new K();r.lang='ar-SA';r.continuous=true;r.interimResults=true;r.maxAlternatives=1;HZF.rec=r;HZF.on=true;let used=0;
 const b=$('#hfGo');if(b){b.textContent='⏹ '+t('stop');b.classList.add('rec')}const l=$('#hfLive');if(l)l.textContent=t('hf2_listen');
 r.onstart=()=>{used=0};
 r.onresult=e=>{let all='',fin=true;for(let i=0;i<e.results.length;i++){all+=' '+e.results[i][0].transcript;if(!e.results[i].isFinal)fin=false}
  const hw=all.trim().split(/\s+/).map(arNorm).filter(Boolean),lim=fin?hw.length:Math.max(used,hw.length-1);
  while(used<lim){hfFeed(hw[used]);used++}const lv=$('#hfLive');if(lv)lv.textContent='🎧 '+all.trim().split(/\s+/).slice(-6).join(' ')};
 r.onerror=ev=>{if(ev.error==='not-allowed'||ev.error==='service-not-allowed'){HZF.on=false;const lv=$('#hfLive');if(lv)lv.textContent=t('hf2_mic')}};
 r.onend=()=>{if(HZF&&HZF.on&&HZF.rec===r&&HZF.pos<HZF.el.length){try{r.start()}catch(e){hfStop()}}else if(HZF&&HZF.rec===r)hfStop(true)};
 try{r.start()}catch(e){hfStop()}}
function hfStop(silent){if(!HZF)return;HZF.on=false;const r=HZF.rec;HZF.rec=null;if(r){try{r.stop()}catch(e){}}const b=$('#hfGo');if(b){b.textContent='🎙 '+t(HZF.pos>0&&HZF.pos<HZF.el.length?'hf2_cont':'hf2_start');b.classList.remove('rec')}const l=$('#hfLive');if(l&&!silent)l.textContent=t('hf2_paused')}
function hfFinish(){if(!HZF||HZF.fin)return;HZF.fin=true;hfStop(true);const {s,a,b}=hfRange(),n=HZF.ok+HZF.err+HZF.hint;const res=store.get('hfres',{});res[`${s}:${a}-${b}`]={ok:HZF.ok,e:HZF.err,n,d:today()};store.set('hfres',res);
 const pct=n?Math.round(HZF.ok/n*100):0,ea=[...HZF.errA].sort((x,y)=>x-y);
 const sm=$('#hfSum');if(sm)sm.innerHTML=`<div class="card hfsum"><h3 style="margin-top:0">${pct>=95?'🌟':pct>=75?'👍':'💪'} ${t('hf2_res',{p:pct})}</h3><p>${t('hf2_res_d',{ok:HZF.ok,e:HZF.err,h:HZF.hint,n})}</p>
 ${ea.length?`<p class="small">${t('hf2_erra')}: ${ea.map(x=>`<b>${x}</b>`).join(', ')}</p><div class="links"><button class="btn p" id="hfPlayErr">▶ ${t('hf2_play_err')}</button><button class="btn" id="hfRetryErr">↺ ${t('hf2_retry_err')}</button></div>`:`<p>${t('hf2_perfect')}</p>`}
 <div class="links"><button class="btn" id="hfAgain">↺ ${t('hf2_again')}</button>${b<Q[s-1].v.length?`<button class="btn" id="hfNext">→ ${t('hf2_next')}</button>`:''}</div></div>`;
 if(sm)sm.scrollIntoView({block:'center',behavior:'smooth'});const lv=$('#hfLive');if(lv)lv.textContent=t('hf2_done')}
function hfAfter(){HZF=null;if($('#hfText'))hfInit()}
document.addEventListener('click',e=>{const el=e.target.closest('button,.hfw');if(!el||!el.closest('#view'))return;const d=el.dataset;
 if(el.id==='hfGo'){if(HZF&&HZF.on)hfStop();else hfStart();return}
 if(el.id==='hfHint'||(el.classList.contains('hfw')&&HZF&&+HZF.el.indexOf(el)===HZF.pos)){if(!HZF)hfInit();if(HZF.pos<HZF.el.length){hfMark(HZF.pos,'hint');HZF.pos++;HZF.pend=null;hfAdv();hfStat()}return}
 if(el.id==='hfReset'||el.id==='hfAgain'){hfStop(true);render();return}
 if(d.hfm){store.set('hfm',d.hfm);const tx_=$('#hfText');if(tx_){tx_.classList.remove('hid','faint');tx_.classList.add(d.hfm)}document.querySelectorAll('[data-hfm]').forEach(b=>b.classList.toggle('on',b===el));return}
 if(el.id==='hfPlayErr'){const {s}=hfRange();playList([...HZF.errA].sort((x,y)=>x-y).map(a=>[s,a]),0);return}
 if(el.id==='hfRetryErr'){const ea=[...HZF.errA].sort((x,y)=>x-y);store.set('hfa',ea[0]);store.set('hfb',ea[ea.length-1]);render();return}
 if(el.id==='hfNext'){const {b,N}=hfRange(),len=b-+store.get('hfa',1)+1;store.set('hfa',b+1);store.set('hfb',Math.min(N,b+len));render();return}});
document.addEventListener('change',e=>{const id=e.target.id;
 if(id==='hfS'){hfStop(true);store.set('hfs',+e.target.value);store.set('hfa',1);store.set('hfb',0);render();return}
 if(id==='hfA'){hfStop(true);store.set('hfa',+e.target.value);if(+store.get('hfb',0)&&+store.get('hfb',0)<+e.target.value)store.set('hfb',+e.target.value);render();return}
 if(id==='hfB'){hfStop(true);store.set('hfb',+e.target.value);render();return}});

// =================== QCF V4 (Мадина мусҳафи, KFGQPC) — саҳифа шрифтлари ===================
const QCFU=p=>`https://raw.githubusercontent.com/quran/quran.com-frontend-next/production/public/fonts/quran/hafs/v4/colrv1/woff2/p${p}.woff2`;
const MLU=p=>`https://raw.githubusercontent.com/zonetecde/mushaf-layout/refs/heads/main/mushaf/page-${String(p).padStart(3,'0')}.json`;
let PIDX=null;const pidxP=fetch('pidx.json').then(r=>r.json()).then(j=>PIDX=j).catch(()=>null);
const ayPage=(s,a)=>PIDX&&PIDX[s-1]?PIDX[s-1][a-1]:0;
const QF={},MLD={};
const qcfOn=()=>qFont()==='qcf';
const qcfPalOK=(()=>{try{return CSS.supports('font-palette','--x')}catch(e){return false}})();
function qcfPalIdx(){const th=document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'),tj=tajOn();return th==='dark'?(tj?1:4):th==='sepia'?(tj?2:5):(tj?0:3)}
function qcfStyle(p){return `font-family:qcf${p};${qcfPalOK?`font-palette:--q${p}p${qcfPalIdx()}`:''}`}
function qcfLoad(p){if(QF[p])return QF[p];QF[p]=fetch(QCFU(p)).then(r=>{if(!r.ok)throw new Error('font');return r.arrayBuffer()}).then(b=>new FontFace('qcf'+p,b).load()).then(f=>{document.fonts.add(f);
  let st=document.getElementById('qcfPal');if(!st){st=document.createElement('style');st.id='qcfPal';document.head.appendChild(st)}
  try{for(let i=0;i<6;i++)st.sheet.insertRule(`@font-palette-values --q${p}p${i}{font-family:qcf${p};base-palette:${i}}`,st.sheet.cssRules.length)}catch(e){}return 'qcf'+p}).catch(e=>{delete QF[p];throw e});QF[p].catch(()=>{});return QF[p]}
function mlGet(p){if(MLD[p])return MLD[p];MLD[p]=fetch(MLU(p)).then(r=>{if(!r.ok)throw new Error('ml');return r.json()}).catch(e=>{delete MLD[p];throw e});MLD[p].catch(()=>{});return MLD[p]}
// QCF тайёр эмас бўлса (dark режимда палитра йўқ) — Ҳафс шрифтида қолади
const qcfUsable=()=>qcfOn()&&(qcfPalOK||qcfPalIdx()===0||qcfPalIdx()===3);
// Саҳифа кўриниши
async function pageFill(){const box=$('#msPage');if(!box)return;await pidxP;let p=+store.get('mpage',0);if(!p){p=ayPage(store.get('sura',1),1)||1;store.set('mpage',p)}
 box.innerHTML=`<div class="pgload"><div class="spin"></div></div>`;
 try{const [d]=await Promise.all([mlGet(p),qcfUsable()?qcfLoad(p).catch(()=>null):null]);if(+store.get('mpage',0)!==p)return;
  const useQ=qcfUsable()&&QF[p]&&document.fonts.check('20px qcf'+p),B=bm();let firstK='';
  const rows=d.lines.map(L=>{if(L.type==='surah-header'){const s=+L.surah;return `<div class="pl hdr"><div class="shdr"><span class="ar">سورة ${Q[s-1].ar}</span><small>${esc(Q[s-1].tr)} · ${t('ms_n_ayat',{n:Q[s-1].v.length})}</small></div></div>`}
   if(L.type==='basmala')return `<div class="pl bsm ar">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</div>`;
   return `<div class="pl txt"${useQ?` style="${qcfStyle(p)}"`:''}>${L.words.map(w=>{const [s,a,i]=w.location.split(':').map(Number);if(!firstK)firstK=s+':'+a;const parts=(useQ?w.qpcV2:w.word).split(' '),last=parts.length>1;const wtxt=parts[0],mk=parts.slice(1).join(' ');
    const k=s+':'+a;return `<span class="w" data-s="${s}" data-a2="${a}" data-w="${i-1}" data-pa="${k}">${esc(useQ?wtxt:(Q[s-1].v[a-1].split(' ')[i-1]||wtxt))}</span>${last?`<span class="qm${B[k]?' bm-'+B[k]:''}" data-am="${k}">${useQ?esc(mk):`<button class="amark" data-am="${k}">${arNum(a)}</button>`}</span>`:''}`}).join('')}</div>`}).join('');
  box.innerHTML=`<div class="pgbody${useQ?' qcf':''}" style="--qfs:${store.get('qfs'+p,0)||26}px">${rows}</div><div class="pgfoot"><span>${arNum(p)}</span></div>
  <div class="pgnav"><button class="btn" data-pg="${p+1}" ${p>=604?'disabled':''}>← ${t('ms_next')}</button><button class="btn" data-pg="${p-1}" ${p<=1?'disabled':''}>${t('ms_prev')} →</button></div>`;
  if(useQ)pgFit(box.querySelector('.pgbody'));
  const f=firstK.split(':').map(Number);if(f[0]){store.set('sura',f[0]);const n=$('#msPgN');if(n)n.textContent=arNum(p);const j=$('#msJuz span');if(j)j.textContent='الجزء '+JUZN[juzOf(f[0],f[1])-1];const su=$('#msSura span');if(su)su.textContent='سورة '+Q[f[0]-1].ar}
  [p+1,p-1].filter(x=>x>=1&&x<=604).forEach(x=>{mlGet(x).catch(()=>{});if(qcfUsable())qcfLoad(x).catch(()=>{})});
  d.lines.forEach(L=>L.words&&L.words.forEach(w=>{const [s,a]=w.location.split(':');rdLater(s+':'+a)}))}
 catch(e){box.innerHTML=`<div class="note">${t('ms_pg_fail')}</div>`}}
// қаторларни контейнер энига мослаш (Мадина мусҳафидагидек)
function pgFit(b){if(!b)return;const W=b.clientWidth;if(!W)return;b.classList.add('meas');const ls=[...b.querySelectorAll('.pl.txt')];const ws=ls.map(l=>l.scrollWidth);b.classList.remove('meas');const mx=Math.max(...ws,1);
 const base=parseFloat(getComputedStyle(b).getPropertyValue('--qfs'))||26,fs=Math.min(60,Math.max(14,base*W/mx*.985));b.style.setProperty('--qfs',fs.toFixed(2)+'px');
 ls.forEach((l,i)=>l.classList.toggle('short',ws[i]<mx*.72))}
let PGR=0;window.addEventListener('resize',()=>{clearTimeout(PGR);PGR=setTimeout(()=>{const b=$('.pgbody.qcf');if(b){b.style.setProperty('--qfs','26px');pgFit(b)}},200)});
// Оятлар кўриниши: Ҳафс матнини QCF глифларига алмаштириш
async function ayatQcf(s){await pidxP;if(!qcfUsable()||!PIDX||!PIDX[s-1])return;const pages=[...new Set(PIDX[s-1])];
 for(const p of pages){if(store.get('sura',1)!==s||location.hash!=='#mushaf'||mview()!=='ayat')return;
  try{const [d]=await Promise.all([mlGet(p),qcfLoad(p)]);const st=qcfStyle(p),by={};
   d.lines.forEach(L=>L.words&&L.words.forEach(w=>{const [ws,a,i]=w.location.split(':').map(Number);if(ws!==s)return;(by[a]=by[a]||[])[i-1]=w.qpcV2}));
   Object.keys(by).forEach(a=>{const el=document.querySelector(`.msayat .ayah[data-a="${s}:${a}"] .ar`);if(!el||el.dataset.q)return;const sp=el.querySelectorAll('.w'),G=by[a];if(G.length!==sp.length||G.some(x=>!x))return;
    sp.forEach((e,i)=>{const pr=G[i].split(' ');e.textContent=pr[0];e.setAttribute('style',st)});const m=el.querySelector('.amark'),mk=G[G.length-1].split(' ').slice(1).join(' ');if(m&&mk){m.textContent=mk;m.classList.add('qg');m.setAttribute('style',st)}el.dataset.q='1';el.classList.add('qcfa')})}catch(e){}}}

// =================== ҚАТЪИЙ ИМТИҲОНЛАР, ТАКРОРИЙ СИНОВЛАР, ТАЛАБ ТИЗИМИ ===================
const STR={soft:{p:70,o:70,tm:0,cd:0,self:1,sh:0},fair:{p:80,o:80,tm:0,cd:10,self:1,sh:0},firm:{p:85,o:85,tm:40,cd:30,self:0,sh:0},hard:{p:90,o:90,tm:25,cd:60,self:0,sh:1}};
const strict=()=>STR[store.get('strict','fair')]?store.get('strict','fair'):'fair',SP=()=>STR[strict()];
const RET=[3,10,30,90];
const lx=()=>store.get('lx',{});
function lxSet(h,o){const L=lx();L[h]=Object.assign(L[h]||{},o);store.set('lx',L)}
// ўқиш кунлари: дарс/имтиҳон/такрорда ≥5 дақиқа ёки имтиҳон/такрор якуни
const sdays=()=>store.get('sday',{});
function studyAdd(sec){const S=sdays(),k=today();S[k]=(S[k]||0)+sec;store.set('sday',S)}
function studied(k){return (sdays()[k]||0)>=300}
setInterval(()=>{if(document.visibilityState==='visible'&&/^#(dars-|alif-|sinov-|takror|hifz|kitob-ms|mahraj|imtihon)/.test(location.hash))studyAdd(20)},20000);
function missedDays(){const S=sdays();const ks=Object.keys(S).filter(k=>S[k]>=300).sort();const st=store.get('pstart',null);if(!st){store.set('pstart',today());return 0}
 const last=ks.length?ks[ks.length-1]:st;if(last===today())return 0;const ms=(new Date(today())-new Date(last))/864e5;return Math.max(0,Math.round(ms)-(ks.length?1:0))}
function escLevel(){const m=missedDays(),sh=SP().sh;if(m<=0)return 0;if(m<=1-sh)return 1;if(m<=3-sh)return 2;if(m<=6-sh)return 3;return 4}
const passedSteps=()=>PATH.filter(p=>(p.k==='a'||p.k==='d'||p.k==='m')&&lx()[p.h]&&lx()[p.h].p);
// чоралар: бир узилишда бир марта
function escApply(){const lv=escLevel(),key=today()+':'+lv;if(lv<2||store.get('escK','')===key)return;store.set('escK',key);
 const ps=passedSteps().sort((a,b)=>(lx()[b.h].d||'').localeCompare(lx()[a.h].d||''));
 if(lv>=2&&ps[0])lxSet(ps[0].h,{rn:today()});
 if(lv>=3&&ps[1])lxSet(ps[1].h,{rn:today()});
 if(lv>=4&&ps[0]){unpass(ps[0].h);store.set('escRev',stepTitle(ps[0]))}}
function unpass(h){const p=PATH.find(x=>x.h===h);if(!p)return;if(p.k==='a'){const d=doneA();delete d[p.i];store.set('adone',d)}else if(p.k==='d'){const d=done();delete d[p.i];store.set('done',d)}else if(p.k==='m')store.set('mkdone',0);lxSet(h,{p:0,rb:0,rn:null})}
function dueRet(){const L=lx(),td=today();return PATH.filter(p=>L[p.h]&&L[p.h].p&&L[p.h].rn&&L[p.h].rn<=td)}
// ---------- Савол генераторлари ----------
const pickN=(a,n)=>shuffle(a).slice(0,n);
function qTaj(i,n,ret){const l=C.L[i],out=[];
 l.q.forEach(q=>out.push({q:tx(q[0]),o:q[1].map(tx),a:tx(q[1][q[2]])}));
 GLA.filter(x=>x.L==='dars-'+(i+1)).forEach(x=>{const others=pickN(GLA.filter(y=>y.k!==x.k&&y.g===x.g).concat(pickN(GLA.filter(y=>y.k!==x.k),3)),3).map(y=>tx(y.s));out.push({q:t('sx_term',{x:tx(x.n)}),big:x.ar,o:shuffle([tx(x.s),...others]),a:tx(x.s)})});
 const titles=C.L.map(z=>tx(z.t)),me=tx(l.t);
 if(l.anim!=='waqf')pickN(l.ex.filter(e=>!e[3]),2).forEach(([ref,hl])=>out.push({q:t('sx_listen'),rule:{ref,hl},o:shuffle([me,...pickN(titles.filter(z=>z!==me),3)]),a:me}));
 const prev=C.L.map((z,j)=>j).filter(j=>j!==i&&done()[j]);pickN(prev,ret?1:2).forEach(j=>{const q=pickN(C.L[j].q,1)[0];if(q)out.push({q:tx(q[0]),o:q[1].map(tx),a:tx(q[1][q[2]]),rv:1})});
 return shuffle(out).slice(0,n)}
function qLet(cs,n){const out=[];const LT=C.LT.filter(x=>x[0]!=='ء');shuffle(cs).forEach((c,k)=>{const x=LF(c);if(!x)return;const oth=pickN(LT.filter(y=>y[0]!==c),3);
 const ty=k%3;if(ty===0)out.push({q:t('find_letter',{x:tx(x[2])}),o:shuffle([c,...oth.map(y=>y[0])]),a:c,ar:1});
 else if(ty===1)out.push({q:t('name_of'),big:c,o:shuffle([x,...oth]).map(y=>tx(y[2])),a:tx(x[2])});
 else if(TM&&TM.lw[c]&&c!=='ا')out.push({q:t('listen_letter'),lw:c,o:shuffle([c,...oth.map(y=>y[0])]),a:c,ar:1});
 else out.push({q:t('find_letter',{x:tx(x[2])}),o:shuffle([c,...oth.map(y=>y[0])]),a:c,ar:1})});
 pickN(cs.filter(c=>C.CT[c]),2).forEach(c=>{const hs=['َ','ِ','ُ'],ht=['а','и','у'],hi=Math.floor(Math.random()*3);out.push({q:t('read_syl'),big:c+hs[hi],o:shuffle([0,1,2].map(j=>tx(C.CT[c]+ht[j]))),a:tx(C.CT[c]+ht[hi])})});
 return shuffle(out).slice(0,n)}
function qHB(l,n){const out=[];const W=l.w||[];W.forEach(([a,,c])=>{const oth=pickN(W.filter(w=>w[2]!==c).map(w=>tx(w[2])),3);if(oth.length>=2)out.push({q:t('sx_read'),big:a,o:shuffle([tx(c),...oth]),a:tx(c)})});
 if(l.syl&&l.h)pickN([...l.syl],3).forEach(c=>{const k=Math.floor(Math.random()*l.h.length),base=C.CT[c]||'';if(!base)return;out.push({q:t('read_syl'),big:c+l.h[k],o:shuffle(l.h.map((m,j)=>tx(base+l.ht[j]))),a:tx(base+l.ht[k])})});
 return shuffle(out).slice(0,n)}
function qMk(n){const G=C.MK.map(([g])=>tx(g)),out=[];C.MK.forEach(([g,rows])=>rows.forEach(([lt])=>lt.split(' ').forEach(c=>out.push({q:t('sx_mk',{x:c}),big:c,o:shuffle([tx(g),...pickN(G.filter(z=>z!==tx(g)),3)]),a:tx(g)}))));return pickN(out,n)}
function examFor(h,ret){const p=PATH.find(x=>x.h===h);const n=ret?4:8;let qs=[],oral=[];
 if(p.k==='d'){qs=qTaj(p.i,n,ret);const ex=C.L[p.i].ex.filter(e=>!e[3]);oral=pickN(ex,ret?1:Math.min(2,ex.length)).map(([ref,hl])=>({ref,hl}))}
 else if(p.k==='a'){const l=AL[p.i];if(l.g){const prevG=AL.slice(0,p.i).filter(x=>x.g).flatMap(x=>x.g);qs=qLet(l.g.concat(pickN(prevG,ret?0:2)),n);oral=pickN(l.g.filter(c=>TM&&TM.lw[c]),ret?2:3).map(c=>{const w=TM.lw[c];return {lw:c,ref:w[0]+':'+w[1],hl:[w[2]]}})}
  else{qs=qHB(l,n);oral=pickN((l.w||[]).filter(w=>w[0].length>1),ret?2:3).map(w=>({word:w[0]}))}}
 else if(p.k==='m'){qs=qMk(n)}
 return {h,ret:!!ret,qs,oral,i:0,sc:0,ans:false,ph:'intro',or:[],oi:0,t0:0}}
// ---------- Имтиҳон экрани ----------
let SX=null,SXT=null;
function sxTarget(o){if(o.word)return [o.word];const [s,a]=o.ref.split(':').map(Number);const w=Q[s-1].v[a-1].split(' ');return o.lw?[w[o.hl[0]]]:w}
function vSinov(h){const p=PATH.find(x=>x.h===h);if(!p)return vDarslar();const L=lx()[h]||{},ret=!!(L.p&&L.rn&&L.rn<=today());
 if(!SX||SX.h!==h||SX.ret!==ret&&SX.ph==='intro')SX=examFor(h,ret);const P=SP(),now=Date.now();
 const head=`<p><a href="#${h}">${t('back')}</a></p><h2>📝 ${ret?t('sx_ret'):t('sx_title')}: ${esc(stepTitle(p))}</h2>`;
 if(SX.ph==='intro'){const cd=L.cd&&L.cd>now?L.cd:0;
  return head+`<div class="card sxint"><p>${ret?t('sx_ret_d'):t('sx_d')}</p><ul class="sxl"><li>${t('sx_r1',{n:SX.qs.length,p:P.p})}</li>${P.tm?`<li>⏱ ${t('sx_r2',{s:P.tm})}</li>`:''}${SX.oral.length?`<li>🎙 ${t('sx_r3',{n:SX.oral.length,p:P.o})}</li>`:''}<li>${t('sx_r4',{m:P.cd})}</li></ul>
  ${L.n?`<p class="small">${t('sx_att',{n:L.n})}${L.sc!=null?' · '+t('sx_lastsc',{s:L.sc}):''}</p>`:''}
  ${cd?`<div class="note warnn">⏳ ${t('sx_cd',{t:new Date(cd).toLocaleTimeString().slice(0,5)})}</div><a class="btn" href="#${h}">📖 ${t('sx_restudy')}</a>`:`<button class="btn p lg" id="sxGo" style="width:100%">▶ ${t('sx_start')}</button>`}
  <p class="small">${t('sx_tone_'+strict())}</p></div>`}
 if(SX.ph==='q'){const q=SX.qs[SX.i];
  return head+`<div class="prow"><span>${t('question')} ${SX.i+1}/${SX.qs.length}</span><span>✓ ${SX.sc}</span></div><div class="pbar"><b style="width:${SX.i/SX.qs.length*100}%"></b></div>
  ${P.tm?`<div class="sxtm"><b id="sxTm" style="width:100%"></b></div>`:''}
  <div class="card exq">${q.rv?`<span class="tag">${t('sx_rv')}</span>`:''}<b>${esc(q.q)}</b>${q.big?`<div class="big ar">${esc(q.big)}</div>`:''}${q.lw||q.rule?`<div class="links"><button class="btn p lg" id="sxPlay">▶ ${t('play')}</button></div>`:''}
  <div class="${q.ar?'syl':''}">${q.o.map(o=>`<button class="btn opt sxo${q.ar?' ar':''}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div><div class="small qres"></div>
  <div class="row" style="margin-top:10px"><button class="btn p hidden" id="sxNext">${t('next')}</button></div></div>`}
 if(SX.ph==='oral'){const o=SX.oral[SX.oi],tw=sxTarget(o),r=SX.or[SX.oi],K=window.SpeechRecognition||window.webkitSpeechRecognition;
  return head+`<div class="prow"><span>🎙 ${t('sx_oral')} ${SX.oi+1}/${SX.oral.length}</span><span>${t('sx_theory')}: ${Math.round(SX.sc/SX.qs.length*100)}%</span></div>
  <div class="card"><p class="small">${t('sx_oral_d')}</p><div class="ar sxtxt">${tw.map((w,i)=>`<span class="w${r&&r.m?(r.m[i]?' okw':' badw'):''}${o.hl&&!o.lw&&o.hl.includes(i)?' hlw':''}">${esc(w)}</span>`).join(' ')}</div>
  <div class="links">${o.ref?`<button class="btn" id="sxRef">▶ ${t('sx_sample')}</button>`:o.word?`<button class="btn" data-say="${esc(o.word)}">🔊 ${t('sx_sample')}</button>`:''}${K?`<button class="btn p lg" id="sxRec">🎙 ${t('sx_rec')}</button>`:''}</div>
  <div class="small" id="sxHeard">${r?`${t('sx_acc',{p:r.p})} ${r.p>=SP().o?'✅':'❌'}`:''}</div>
  ${!K?`<div class="note warnn">${t('sx_noasr')}</div>${SP().self?`<label class="row small"><input type="checkbox" id="sxSelf"> ${t('sx_self')}</label><input id="sxWit" class="inp" placeholder="${t('sx_wit')}"><button class="btn p" id="sxSelfOk">${t('sx_selfok')}</button>`:`<p class="small">${t('sx_noself')}</p>`}`:''}
  ${r?`<div class="links">${r.p<SP().o&&(r.k||0)<3?`<button class="btn" id="sxRec2">↺ ${t('sx_again',{n:3-(r.k||0)})}</button>`:''}<button class="btn p" id="sxONext">${SX.oi<SX.oral.length-1?t('next'):t('finish')}</button></div>`:''}</div>`}
 // натижа
 const tp=Math.round(SX.sc/SX.qs.length*100),op=SX.oral.length?Math.round(SX.or.reduce((a,r)=>a+(r?r.p:0),0)/SX.oral.length):100,pass=tp>=P.p&&op>=P.o,nx=pathNext(h);
 return head+`<div class="card sxres ${pass?'ok':'bad'}"><div style="font-size:46px">${pass?'🏆':'📕'}</div><h3>${pass?t(ret?'sx_ret_ok':'sx_pass'):t(ret?'sx_ret_fail':'sx_fail')}</h3>
 <div class="prow"><span>${t('sx_theory')}</span><b>${tp}% / ${P.p}%</b></div><div class="pbar"><b style="width:${tp}%"></b></div>
 ${SX.oral.length?`<div class="prow"><span>${t('sx_oral')}</span><b>${op}% / ${P.o}%</b></div><div class="pbar"><b style="width:${op}%"></b></div>`:''}
 <p>${pass?t('sx_pass_d'):t('sx_fail_d',{m:P.cd})}</p>
 <div class="links">${pass?(nx?`<a class="btn p" href="#${(curStep()||nx).h}">▶ ${esc(stepTitle(curStep()||nx))}</a>`:''):`<a class="btn p" href="#${h}">📖 ${t('sx_restudy')}</a>`}<a class="btn" href="#darslar">🗺 ${t('pt_map')}</a></div></div>`}
function sxTimer(){clearInterval(SXT);const P=SP();if(!P.tm||!SX||SX.ph!=='q')return;SX.t0=Date.now();SXT=setInterval(()=>{const b=$('#sxTm');if(!b||!SX||SX.ph!=='q'||SX.ans){clearInterval(SXT);return}const left=1-(Date.now()-SX.t0)/(P.tm*1000);b.style.width=Math.max(0,left*100)+'%';b.classList.toggle('low',left<.3);
 if(left<=0){clearInterval(SXT);SX.ans=true;const q=SX.qs[SX.i];const card=$('.exq');card.querySelectorAll('.sxo').forEach(x=>{x.disabled=true;if(x.dataset.v===String(q.a))x.classList.add('ok')});card.querySelector('.qres').textContent='⏱ '+t('sx_timeout');$('#sxNext').classList.remove('hidden')}},200)}
function sxFinish(){const P=SP(),h=SX.h,tp=Math.round(SX.sc/SX.qs.length*100),op=SX.oral.length?Math.round(SX.or.reduce((a,r)=>a+(r?r.p:0),0)/SX.oral.length):100,pass=tp>=P.p&&op>=P.o,L=lx()[h]||{},p=PATH.find(x=>x.h===h);
 studyAdd(300);SX.ph='res';
 if(pass){if(SX.ret){const rb=Math.min(RET.length-1,(L.rb||0)+1);lxSet(h,{rb,rn:addDays(RET[rb]),sc:tp,os:op})}
  else{lxSet(h,{p:1,sc:tp,os:op,d:today(),n:(L.n||0)+1,rb:0,rn:addDays(RET[0]),cd:0});if(p.k==='a'){const d=doneA();d[p.i]=1;store.set('adone',d)}else if(p.k==='d'){const d=done();d[p.i]=1;store.set('done',d)}else if(p.k==='m')store.set('mkdone',1);srsSync();markActive()}}
 else{const fails=(L.fd===today()?(L.f||0):0)+1,cd=fails>=3?new Date(addDays(1)+'T05:00').getTime():Date.now()+P.cd*60000;lxSet(h,{n:(L.n||0)+1,sc:tp,f:fails,fd:today(),cd:P.cd||fails>=3?cd:0});if(SX.ret)unpass(h)}}
function sxOralRun(retry){const K=window.SpeechRecognition||window.webkitSpeechRecognition;if(!K)return;const o=SX.oral[SX.oi],tw=sxTarget(o),tn=tw.map(arNorm),r=new K();r.lang='ar-SA';r.continuous=true;r.interimResults=true;let heard='',stop=0;
 const b=$('#sxRec')||$('#sxRec2');if(b){b.textContent='⏹ '+t('stop');b.classList.add('rec');b.id='sxStop'}
 const fin=()=>{if(stop)return;stop=1;try{r.stop()}catch(e){}const hw=heard.trim().split(/\s+/).map(arNorm).filter(Boolean);
  // LCS тенглаштириш
  const n=tn.length,m=hw.length,D=Array.from({length:n+1},()=>Array(m+1).fill(0));for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)D[i][j]=tn[i]&&wsim(tn[i],hw[j])>=0.6?D[i+1][j+1]+1:Math.max(D[i+1][j],D[i][j+1]);
  const M=Array(n).fill(0);let i=0,j=0;while(i<n&&j<m){if(tn[i]&&wsim(tn[i],hw[j])>=0.6&&D[i][j]===D[i+1][j+1]+1){M[i]=1;i++;j++}else if(D[i+1][j]>=D[i][j+1])i++;else j++}
  const cnt=tn.filter(Boolean).length||1,p=Math.round(M.filter((x,k)=>x&&tn[k]).length/cnt*100),prev=SX.or[SX.oi];SX.or[SX.oi]={p:Math.max(p,prev?prev.p:0),m:p>=(prev?prev.p:0)?M:prev.m,k:(prev?prev.k||0:0)+(retry?1:0),heard};render()};
 r.onresult=e=>{let s='';for(let i=0;i<e.results.length;i++)s+=' '+e.results[i][0].transcript;heard=s;const el=$('#sxHeard');if(el)el.textContent='🎧 '+s.trim()};
 r.onerror=()=>fin();r.onend=()=>fin();SX._r=r;SX._fin=fin;try{r.start()}catch(e){fin()}
 clearTimeout(SX._to);SX._to=setTimeout(fin,Math.max(8000,tw.length*2500))}
document.addEventListener('click',e=>{const tg=e.target.closest('button');if(!tg||!SX||!/^#sinov-/.test(location.hash))return;const d=tg.dataset;
 if(tg.id==='sxGo'){SX.ph='q';render();sxTimer();return}
 if(tg.classList.contains('sxo')){if(SX.ans)return;SX.ans=true;clearInterval(SXT);const q=SX.qs[SX.i],ok=d.v===String(q.a);if(ok)SX.sc++;answer(tg,ok,tg.closest('.card'),b=>b.dataset.v===String(q.a));$('#sxNext').classList.remove('hidden');return}
 if(tg.id==='sxNext'){SX.i++;SX.ans=false;if(SX.i>=SX.qs.length){if(SX.oral.length)SX.ph='oral';else sxFinish()}render();sxTimer();return}
 if(tg.id==='sxPlay'){const q=SX.qs[SX.i];if(q.lw){const lw=TM.lw[q.lw];playWords(lw[0],lw[1],[lw[2]])}else if(q.rule){const [s,a]=q.rule.ref.split(':').map(Number);playWords(s,a,q.rule.hl)}return}
 if(tg.id==='sxRef'){const o=SX.oral[SX.oi],[s,a]=o.ref.split(':').map(Number);if(o.lw||o.hl&&TM&&TM.t[o.ref])playWords(s,a,o.hl);else playList([[s,a]],0);return}
 if(tg.id==='sxRec'||tg.id==='sxRec2'){sxOralRun(tg.id==='sxRec2');return}
 if(tg.id==='sxStop'){SX._fin&&SX._fin();return}
 if(tg.id==='sxSelfOk'){const ok=$('#sxSelf')&&$('#sxSelf').checked,w=($('#sxWit')||{}).value||'';if(!ok||w.trim().length<2){const el=$('#sxHeard');if(el)el.textContent=t('sx_selfneed');return}SX.or[SX.oi]={p:SP().o,m:null,self:w.trim()};render();return}
 if(tg.id==='sxONext'){if(SX.oi<SX.oral.length-1){SX.oi++;render()}else{sxFinish();render()}return}});
// ---------- Мураббий (тон ва огоҳлантиришлар) ----------
function coachCard(){escApply();const lv=escLevel(),m=missedDays(),s=strict(),rv=store.get('escRev','');if(!lv)return '';
 const due=dueRet().length,pr=progressTxt();
 return `<div class="card coach c${lv}"><div class="coachh">${['','🙂','⚠️','🚨','⛔'][lv]} <b>${t('co_h'+lv,{n:m})}</b></div><p>${t('co_'+s+lv,{n:m})}</p>
 ${lv>=2&&due?`<p class="small">${t('co_forced',{n:due})}</p>`:''}${lv>=4&&rv?`<p class="small">${t('co_revoked',{x:esc(rv)})}</p>`:''}
 <div class="links"><a class="btn p" href="#${(curStep()||{h:'darslar'}).h}">▶ ${t('co_go')}</a>${lv>=3?partnerBtns(t('co_rep',{n:m,p:pr})):''}</div></div>`}
function progressTxt(){const L=PATH.filter(stepReq);return L.filter(stepDone).length+'/'+L.length}
function partnerBtns(msg){const ph=(store.get('pphone','')||'').replace(/[^\d+]/g,''),nm=store.get('pname','');if(!ph)return `<a class="btn" href="#sozlama">👤 ${t('co_setp')}</a>`;
 const body=encodeURIComponent((nm?nm+', ':'')+msg+' '+location.origin+location.pathname);
 return `<a class="btn" href="sms:${ph}?&body=${body}">✉️ SMS: ${esc(nm||ph)}</a><a class="btn" href="https://wa.me/${ph.replace('+','')}?text=${body}" target="_blank" rel="noopener">WhatsApp</a>`}
// ---------- Эслатмалар: календарь (ICS) ва билдиришнома ----------
function icsBlob(){const tm=store.get('rtime','20:00').split(':'),d=new Date(),pad2=x=>String(x).padStart(2,'0'),dt=`${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}T${pad2(tm[0])}${pad2(tm[1])}00`,u=location.origin+location.pathname;
 const s=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Nurul Quron//UZ','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:nurul-quron-daily-'+Date.now()+'@nur','DTSTAMP:'+dt,'DTSTART:'+dt,'DURATION:PT20M','RRULE:FREQ=DAILY','SUMMARY:📖 Nurul Qur’on — '+t('rm_ev'),'DESCRIPTION:'+t('rm_evd')+' '+u,'URL:'+u,
  'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+t('rm_ev'),'TRIGGER:PT0M','END:VALARM','BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+t('rm_ev2'),'TRIGGER:PT2H','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
 return new Blob([s],{type:'text/calendar'})}
async function notifOn(){if(!('Notification' in window)){alertMsg(t('rm_nonotif'));return}const p=await Notification.requestPermission();store.set('notif',p==='granted');
 if(p==='granted'){try{const reg=await navigator.serviceWorker.ready;if(reg.periodicSync){await reg.periodicSync.register('qu-daily',{minInterval:12*3600*1000})}reg.showNotification('Nurul Qur’on',{body:t('rm_test'),icon:'icon-192.png',tag:'qu-test'})}catch(e){}}render()}
function alertMsg(m){const el=$('#rmMsg');if(el)el.textContent=m}
// SW учун ҳолат (охирги ўқиш куни, огоҳлантириш даражаси, матнлар)
async function swState(){try{const c=await caches.open('qu-state');await c.put('./__state',new Response(JSON.stringify({last:Object.keys(sdays()).filter(k=>sdays()[k]>=300).sort().pop()||'',lv:escLevel(),time:store.get('rtime','20:00'),msg:[1,2,3,4].map(l=>t('co_'+strict()+l,{n:'{n}'})),title:'Nurul Qur’on'})))}catch(e){}}
setTimeout(swState,3000);setInterval(swState,60000);
function remindHTML(){const n=('Notification' in window)?Notification.permission:'na',ph=store.get('pphone',''),pn=store.get('pname','');
 return `<div class="card"><b>⏰ ${t('rm_t')}</b><p class="small">${t('rm_d')}</p>
 <div class="row" style="gap:8px;align-items:center"><span class="small">${t('rm_time')}</span><input type="time" id="rTime" class="inp" style="width:auto" value="${store.get('rtime','20:00')}"></div>
 <div class="links" style="margin-top:8px"><button class="btn p" id="rIcs">📅 ${t('rm_cal')}</button><button class="btn" id="rNot">${n==='granted'?'🔔 '+t('rm_on'):'🔔 '+t('rm_enable')}</button></div><div class="small" id="rmMsg">${t('rm_note')}</div></div>
 <div class="card"><b>🎚 ${t('stc_t')}</b><p class="small">${t('stc_d')}</p><div class="segc" style="flex-direction:column">${['soft','fair','firm','hard'].map(k=>`<button class="btn${strict()===k?' p':''}" data-strict="${k}"><b>${t('stc_'+k)}</b><br><small>${t('stc_'+k+'_d',STR[k])}</small></button>`).join('')}</div></div>
 <div class="card"><b>👤 ${t('pt_partner')}</b><p class="small">${t('pt_partner_d')}</p><input id="pName" class="inp" placeholder="${t('pt_pname')}" value="${esc(pn)}"><input id="pPhone" class="inp" type="tel" placeholder="+998 90 123 45 67" value="${esc(ph)}" style="margin-top:6px">
 ${ph?`<div class="links" style="margin-top:6px">${partnerBtns(t('co_week',{p:progressTxt(),s:streak()}))}</div>`:''}</div>`}
document.addEventListener('click',e=>{const tg=e.target.closest('button');if(!tg)return;const d=tg.dataset;
 if(d.strict){store.set('strict',d.strict);render();return}
 if(tg.id==='rIcs'){const a=document.createElement('a');a.href=URL.createObjectURL(icsBlob());a.download='nurul-quron-dars.ics';document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),500);alertMsg(t('rm_icsok'));return}
 if(tg.id==='rNot'){notifOn();return}});
document.addEventListener('change',e=>{const id=e.target.id;if(id==='rTime'){store.set('rtime',e.target.value);swState()}if(id==='pName')store.set('pname',e.target.value.trim());if(id==='pPhone'){store.set('pphone',e.target.value.trim());render()}});

// эски «ўзлаштирилган» дарсларни ҳам такрорий синовга қўшиш
setTimeout(()=>{const L=lx();let ch=0;PATH.forEach(p=>{if((p.k==='a'||p.k==='d'||p.k==='m')&&stepDone(p)&&!L[p.h]){L[p.h]={p:1,d:today(),rb:0,rn:addDays(RET[0]),old:1};ch=1}});if(ch)store.set('lx',L)},1500);
window.QU={get SX(){return SX},sxTarget:o=>sxTarget(o),curStep:()=>curStep(),lx:()=>lx(),get:(k,d)=>store.get(k,d)};

// ---------- Ишга тушириш ----------
try{const u=new URLSearchParams(location.search);if(u.get('from')){store.set('gift',{from:u.get('from').slice(0,60),to:(u.get('to')||'').slice(0,60)});history.replaceState(null,'',location.pathname+location.hash)}}catch(e){}
if(!prof.lang){const n=(navigator.language||'').toLowerCase();prof.lang=n.startsWith('ru')?'ru':n.startsWith('tg')?'tg':'uz'}
applyProf();render();
if('serviceWorker' in navigator){const hadC=!!navigator.serviceWorker.controller;navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadC&&!window.__rl){window.__rl=1;location.reload()}})}
const CDNQ='https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran.json';
const viaScript=()=>new Promise((ok,no)=>{if(window.QURAN_DATA)return ok(window.QURAN_DATA);const sc=document.createElement('script');sc.src='quran.js';sc.onload=()=>window.QURAN_DATA?ok(window.QURAN_DATA):no();sc.onerror=no;document.head.appendChild(sc)});
const viaCDN=()=>fetch(CDNQ).then(r=>{if(!r.ok)throw 0;return r.json()}).then(d=>d.map(x=>({n:x.id,ar:x.name,tr:x.transliteration,v:x.verses.map(v=>v.text),tp:x.type})));
const viaLocal=()=>fetch('quran.json').then(r=>{if(!r.ok)throw 0;return r.json()});
const tmP=fetch('timings.json').then(r=>r.ok?r.json():null).catch(()=>null);
const qP=location.protocol==='file:'?viaScript():viaCDN().catch(viaLocal).catch(viaScript);
Promise.all([qP.catch(()=>null),tmP]).then(([q,tm])=>{Q=q;TM=tm;if(q)qConv();if(!q)$('#view').insertAdjacentHTML('afterbegin',`<div class="note">${t('audio_fail')}</div>`);render()});
}
