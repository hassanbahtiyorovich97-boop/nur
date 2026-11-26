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
 if(prof.theme==='light'||prof.theme==='dark')r.dataset.theme=prof.theme;else delete r.dataset.theme;
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
 if(S.src!==url){S.src=url;sPend=go}else go();
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
function headSVG(id){return `<svg class="head" id="${id||'head'}" viewBox="20 10 260 250" role="img" aria-label="${t('scheme')}">
<path class="skin" d="M78 26 C120 4 220 10 250 60 C272 100 262 150 236 176 L232 250 L118 250 L116 222 C96 214 74 204 68 190 C60 176 66 168 60 160 L50 158 C44 156 44 150 50 148 L48 142 C42 140 42 134 48 132 L54 128 C48 124 44 120 40 112 C34 104 40 98 50 96 C56 92 60 84 62 74 C64 50 66 36 78 26Z"/>
<path class="cav" id="noseCav" d="M60 100 C80 92 130 92 160 98 C176 102 182 110 182 118 C160 112 120 110 64 112Z"/>
<path class="cav" id="mouthCav" d="M62 128 C90 118 150 114 178 128 C186 150 186 178 196 200 L184 200 C176 176 168 156 150 150 C120 144 90 150 66 150Z"/>
<path class="cav" id="throat" d="M178 128 C190 160 194 200 196 250 L214 250 C212 200 206 160 194 120Z"/>
<path class="tongue" id="tongue" d="M66 148 C76 134 104 128 132 128 C156 128 170 136 176 156 C180 172 184 186 190 200 L172 206 C166 186 156 168 140 160 C110 152 86 154 66 152Z"/>
<rect class="tooth" x="60" y="126" width="9" height="7" rx="2"/><rect class="tooth" x="60" y="146" width="9" height="7" rx="2"/>
<path class="lip" id="lipU" d="M46 134 C52 130 58 130 60 134 L58 140 C54 141 48 140 46 138Z"/>
<path class="lip" id="lipL" d="M46 152 C52 156 58 156 60 152 L58 146 C54 145 48 146 46 148Z"/>
<circle class="glow" id="noseGlow" cx="110" cy="104" r="30"/>
${Object.entries(PTS).map(([k,[x,y]])=>`<g class="pt" data-p="${k}"><circle cx="${x}" cy="${y}" r="9" class="ring"/><circle cx="${x}" cy="${y}" r="4.5" class="dot"/></g>`).join('')}
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
const listen=(s,a,chk)=>{const x=prec();return `<button class="btn p" data-play="${s}:${a}">▶ ${esc(x.n.split(' (')[0])}</button>${chk?`<button class="btn" data-recref="${s}:${a}">${t('check_me')}</button>`:''}`};
function stars(el){if(!document.body.classList.contains('kids')||!el)return;const r=el.getBoundingClientRect();for(let i=0;i<6;i++){const s=document.createElement('span');s.className='star';s.textContent='⭐';s.style.left=(r.left+r.width/2)+'px';s.style.top=(r.top+window.scrollY)+'px';s.style.setProperty('--dx',(Math.random()*160-80)+'px');s.style.setProperty('--dy',(-60-Math.random()*90)+'px');document.body.appendChild(s);setTimeout(()=>s.remove(),900)}}

// ---------- Навигация ----------
const ico={bosh:'<path d="M3 11l9-7 9 7v9H3z"/><path d="M9 20v-6h6v6"/>',darslar:'<path d="M4 5h7a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H4zM20 5h-5a3 3 0 0 0-3 3"/>',mushaf:'<path d="M5 4h11l3 3v13H5z"/><path d="M9 10h6M9 14h6"/>',mahraj:'<path d="M7 9a5 5 0 0 1 10 0v3a5 5 0 0 1-10 0z"/><path d="M12 17v3"/>',kitob:'<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',tekshiruv:'<path d="M3 12h3l2-6 4 12 3-9 2 3h4"/>',qoidalar:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h1M4 12h1M4 18h1"/>'};
const TABS=[['bosh','tab_home'],['darslar','tab_lessons'],['qoidalar','tab_rules'],['mushaf','tab_mushaf'],['mahraj','tab_makhraj'],['kitob','tab_book'],['tekshiruv','tab_check']];
function navi(cur){$('#nav').innerHTML=TABS.map(([h,k])=>`<a href="#${h}" class="${cur===h?'on':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ico[h]}</svg>${t(k)}</a>`).join('');
 $('#hdr').innerHTML=`<div><h1>${t('app')}</h1><div class="sub">${t('tagline')}</div></div><div class="row"><a class="btn" href="#ustozlar">${t('reciters')}</a><a class="btn" href="#sozlama" aria-label="${t('settings')}">⚙</a></div>`}

// ---------- Курслар ----------
const done=()=>store.get('done',{}),doneA=()=>store.get('adone',{}),memo=()=>store.get('memo',{}),certs=()=>store.get('certs',{});
const AL=[...C.GR.map(g=>({t:{uz:'Ҳарфлар: '+g,ru:'Буквы: '+g,tg:'Ҳарфҳо: '+g},g:g.split(' ')})),...C.HB];
const LF=c=>C.LT.find(x=>x[0]===c);
function nextLesson(){const a=doneA(),d=done();const na=AL.findIndex((_,i)=>!a[i]),nt=C.L.findIndex((_,i)=>!d[i]);
 if((prof.level||0)===0&&na>=0)return {h:'alif-'+(na+1),t:tx(AL[na].t)};if(nt>=0)return {h:'dars-'+(nt+1),t:tx(C.L[nt].t)};if(na>=0)return {h:'alif-'+(na+1),t:tx(AL[na].t)};return null}

function vBosh(){const g=store.get('gift',null),nl=nextLesson(),st=streak(),mins=Math.floor((days()[today()]||0)/60),goal=prof.goal||10,pc=Math.min(100,Math.round(mins/goal*100));
 const a=Object.keys(doneA()).length,d=Object.keys(done()).length,ms=Object.keys(store.get('msdone',{})).length,m=Object.keys(memo()).length,cs=certs();
 const bar_=(n,tot)=>`<div class="pbar"><b style="width:${Math.round(n/tot*100)}%"></b></div>`;
 return `<h2>${t('salam')}${prof.name?', '+esc(prof.name):''}!</h2>
 ${g&&g.from?`<div class="card gift"><div class="gift-ic">🎁</div><div><b>${esc(t('gift_from',{from:g.from}))}</b><div class="small">${t('dua')}</div></div></div>`:''}
 <div class="grid3"><div class="card kpi"><div class="kv">🔥 ${st}</div><div class="small">${t('streak')}</div></div>
 <div class="card kpi"><div class="kv"><span id="todayMin">${mins}</span>/${goal} ${t('min')}</div><div class="pbar"><b style="width:${pc}%"></b></div><div class="small">${t('today')}</div></div>
 <div class="card kpi"><div class="kv">${m}</div><div class="small">${t('memorized_n')}</div></div></div>
 <div class="card plan"><b>${t('today_plan')}</b>
 ${nl?`<a class="btn p lg" href="#${nl.h}">${t('next_lesson')}: ${esc(nl.t)}</a>`:''}
 <a class="btn lg" href="#imtihon-review">${t('review')}</a>
 <a class="btn lg" href="#kitob">${t('book_title')} · ${store.get('mspg',1)}/43</a></div>
 <div class="card"><b>${t('progress')}</b>
 <div class="prow"><span>${t('course_alif')}</span><span>${a}/${AL.length}</span></div>${bar_(a,AL.length)}
 <div class="prow"><span>${t('course_tajwid')}</span><span>${d}/${C.L.length}</span></div>${bar_(d,C.L.length)}
 <div class="prow"><span>${t('book_title')}</span><span>${ms}/43</span></div>${bar_(ms,43)}
 <div class="prow"><span><a href="#qoidalar">${t('gl_title')}</a></span><span>${Object.keys(glk()).length}/${GLA.length}</span></div>${bar_(Object.keys(glk()).length,GLA.length)}
 ${Object.keys(cs).length?`<div class="links">${Object.keys(cs).map(k=>`<a class="btn" href="#sertifikat-${k}">🏅 ${t('certificate')}: ${t(k==='alif'?'course_alif':'course_tajwid')}</a>`).join('')}</div>`:''}</div>`}

function vDarslar(){const d=done(),da=doneA(),cs=certs();
 const card=(i,ttl,sub,ok,h)=>`<a class="card lesson" href="#${h}"><span class="num${ok?' done':''}">${ok?'✓':i+1}</span><span><b>${esc(ttl)}</b><br><span class="small">${esc(sub)}</span></span></a>`;
 return `<h2>${t('course_alif')}</h2><div class="note">${t('course_alif_note')}</div>
 <div class="grid">${AL.map((l,i)=>card(i,tx(l.t),l.g?t('letters'):t('reading_rule'),da[i],'alif-'+(i+1))).join('')}</div>
 <div class="card examc"><div><b>🏅 ${t('exam_alif')}</b><div class="small">${t('exam_note')}</div></div><a class="btn p" href="#imtihon-alif">${cs.alif?'✓ ':''}${t('start')}</a></div>
 <h2 style="margin-top:28px">${t('course_tajwid')}</h2><div class="note">${t('course_tajwid_note')}</div>
 <div class="grid">${C.L.map((l,i)=>card(i,tx(l.t),tx(l.k),d[i],'dars-'+(i+1))).join('')}</div>
 <div class="card examc"><div><b>🏅 ${t('exam_tajwid')}</b><div class="small">${t('exam_note')}</div></div><a class="btn p" href="#imtihon-tajwid">${cs.tajwid?'✓ ':''}${t('start')}</a></div>`}

function quizHTML(qs){return qs.map((q,qi)=>`<div class="card" data-q="${qi}"><b>${esc(tx(q[0]))}</b>${q[1].map((o,oi)=>`<button class="btn opt" data-qi="${qi}" data-oi="${oi}">${esc(tx(o))}</button>`).join('')}<div class="small qres"></div></div>`).join('')}

function vDars(i){const l=C.L[i];if(!l)return vDarslar();const d=done();
 return `<p><a href="#darslar">${t('all_lessons')}</a></p><h2>${i+1}. ${esc(tx(l.t))}</h2><div class="small">${esc(tx(l.k))}</div>
 <div class="card"><div class="letters">${esc(l.lt)}</div><p>${tx(l.r)}</p></div>
 ${stageHTML()}
 <h3>${t('examples')}</h3><p class="small">${t('tap_word')}</p>
 ${l.ex.map(([ref,hl,n],ei)=>{const [s,a]=ref.split(':');return `<div class="card ex" data-ref="${ref}"><div class="ref">${ref} · ${esc(sname(+s))}</div>${ayahHTML(ref,hl)}<div>${esc(tx(n))}</div>
 <div class="links"><button class="btn p" data-rule="${i}:${ei}">${t('play_rule')}</button><button class="btn" data-ayk="${ref}">${t('play_ayah')}</button>${rec().id!=='husary-m'?listen(+s,+a):''}<button class="btn" data-recref="${ref}">${t('check_me')}</button></div></div>`}).join('')}
 <h3>${t('test')}</h3>${quizHTML(l.q)}
 <h3>${t('homework')}</h3><div class="note">${esc(tx(l.hw))}</div>
 <div class="row" style="margin-top:14px"><button class="btn p" id="fin">${d[i]?t('mastered_done'):t('mastered')}</button>${i<C.L.length-1?`<a class="btn" href="#dars-${i+2}">${t('next_lesson_btn')}</a>`:`<a class="btn" href="#imtihon-tajwid">🏅 ${t('exam_tajwid')}</a>`}</div>`}

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
 h+=`<div class="row" style="margin-top:14px"><button class="btn p" id="afin">${d[i]?t('mastered_done'):t('mastered')}</button>${i<AL.length-1?`<a class="btn" href="#alif-${i+2}">${t('next_lesson_btn')}</a>`:`<a class="btn" href="#imtihon-alif">🏅 ${t('exam_alif')}</a>`}</div>`;return h}

// ---------- Мусҳаф ----------
function vMushaf(){const s=store.get('sura',1),hide=store.get('hide',false),m=memo(),cnt=store.get('cnt',{});if(!Q)return `<p class="small">${t('loading')}</p>`;const S_=Q[s-1];
 return `<h2>${t('mushaf_title')}</h2><div class="row"><select id="sura" aria-label="${t('tab_mushaf')}">${Q.map(x=>`<option value="${x.n}"${x.n===s?' selected':''}>${x.n}. ${esc(x.tr)} — ${esc(x.ar)}</option>`).join('')}</select>
 <button class="btn p" data-playsura="${s}">${t('play_sura')}</button><label class="row"><input type="checkbox" id="hide"${hide?' checked':''} style="width:22px;height:22px"> ${t('hide_mode')}</label></div>
 <p class="small">${t('mushaf_note')} ${t('karaoke')} ${t('tap_word')}</p>
 <div class="${hide?'hide':''}">${S_.v.map((tt,i)=>{const k=s+':'+(i+1),c=cnt[k]||0;return `<div class="ayah" data-a="${k}"><div class="ar" data-k="${k}">${tt.split(' ').map((w,wi)=>`<span class="w" data-w="${wi}" data-s="${s}" data-a2="${i+1}">${esc(w)}</span>`).join(' ')} <span class="mark">${i+1}</span></div><div class="links">${listen(s,i+1,1)}<button class="btn" data-c="${k}">+1 · ${c}/10</button><button class="btn${m[k]?' p':''}" data-m="${k}">${m[k]?'✓ ':''}${t('memorized')}</button></div></div>`}).join('')}</div>`}

// ---------- Устозлар ----------
function vUstozlar(){const cur=rec().id;
 return `<h2>${t('reciters')}</h2><div class="note">${t('rec_note')}</div>
 <div class="grid">${R.map(r=>`<div class="card"><b>${esc(r.n)}</b><div><span class="tag">${esc(tx(r.c))}</span><span class="tag">${t('sp_'+r.sp)}</span></div><p class="small">${esc(tx(r.why))}</p><p><b>${t('when')}:</b> ${esc(tx(r.use))}</p>
 <div class="links">${r.f?`<button class="btn${cur===r.id?' p':''}" data-r="${r.id}">${cur===r.id?t('chosen'):t('choose')}</button><button class="btn" data-sample="${r.id}">${t('sample')}</button>`:`<span class="small">${t('no_audio')}</span>`}${r.q?`<a class="btn" href="https://www.youtube.com/results?search_query=${encodeURIComponent(r.q)}" target="_blank" rel="noopener">${t('videos')}</a>`:''}</div></div>`).join('')}</div>`}

// ---------- Махраж ----------
function vMahraj(){return `<h2>${t('mk_title')}</h2><div class="note">${t('mk_note')}</div>
 <div class="mkwrap"><div class="card stage" id="stage">${headSVG()}<div class="stg-big ar" id="stgBig"></div><div class="small" id="stgCap"></div></div>
 <div>${C.MK.map(([g,rows])=>`<div class="card"><b>${esc(tx(g))}</b>${rows.map(([a,p,d])=>`<button class="mk" data-mk="${p}" data-letters="${a}"><span class="ar">${esc(a)}</span><span>${esc(tx(d))}</span></button>`).join('')}</div>`).join('')}</div></div>
 <h3>${t('pairs')}</h3><div class="card"><div class="letters">ث–س–ص · ذ–ز–ظ · ت–ط · ح–ه · ع–ء · ق–ك · د–ض</div></div>`}

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
function startExam(kind){let qs;if(kind==='alif')qs=alifQ(12);else if(kind==='tajwid')qs=tajQ(12);else{const d=done();qs=Object.keys(d).length?tajQ(5,d):alifQ(5)}EX={kind,qs,i:0,score:0,ans:false}}
function vExam(kind){if(!EX||EX.kind!==kind)startExam(kind);const q=EX.qs[EX.i],ttl=kind==='alif'?t('exam_alif'):kind==='tajwid'?t('exam_tajwid'):t('review');
 if(!q)return vExamEnd();
 return `<p><a href="#darslar">${t('back')}</a></p><h2>${ttl}</h2><div class="prow"><span>${t('question')} ${EX.i+1} ${t('of')} ${EX.qs.length}</span><span>✓ ${EX.score}</span></div><div class="pbar"><b style="width:${EX.i/EX.qs.length*100}%"></b></div>
 <div class="card exq"><b>${esc(q.q)}</b>${q.big?`<div class="big">${esc(q.big)}</div>`:''}${q.lw||q.rule?`<div class="links"><button class="btn p lg" id="exPlay">${t('play')}</button></div>`:''}
 <div class="${q.ar?'syl':''}">${q.o.map(o=>`<button class="btn opt exo${q.ar?' ar':''}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div><div class="small qres"></div>
 <div class="row" style="margin-top:10px"><button class="btn p hidden" id="exNext">${EX.i<EX.qs.length-1?t('next'):t('finish')}</button></div></div>`}
function vExamEnd(){const pct=Math.round(EX.score/EX.qs.length*100),pass=pct>=80,k=EX.kind;
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
 <div class="card"><b>${t('s_name')}</b><input id="sName" class="inp" value="${esc(prof.name||'')}" placeholder="${t('ob_name_ph')}"></div>
 <div class="card"><b>${t('s_font')}</b>${seg('font',[[0,'A'],[1,'A+'],[2,'A++'],[3,'A+++']],prof.font||0)}<div class="ar" style="text-align:center">بِسْمِ ٱللَّهِ</div></div>
 <div class="card"><b>${t('s_theme')}</b>${seg('theme',[['auto',t('th_auto')],['light',t('th_light')],['dark',t('th_dark')]],prof.theme||'auto')}</div>
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
async function run(blob){const f1=blob||($('#f1')&&$('#f1').files[0]),f2=$('#f2')&&$('#f2').files[0];if(!f1){st(t('need_rec'));return}st(t('analyzing'));await new Promise(r=>setTimeout(r,30));
 let A;try{A=analyze(await decode(f1))}catch(e){st(t('bad_file'));return}let B=null,note='';const book=location.hash==='#kitob';
 if(!book){try{B=analyze(await decode(f2||await refBuffer()))}catch(e){B=null;note=t('ref_fail')}}else note=t('book_note');
 lastA=A;$('#res').innerHTML=resHTML(A,B)+(note?`<div class="note small">${esc(note)}</div>`:'');plot($('#cv1'),A);st(t('ready'));markActive()}
async function recToggle(){const b=$('#rec');if(mr&&mr.state==='recording'){mr.stop();return}
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.MediaRecorder){st(t('no_mic'));return}P.a.pause();stopSeg();
 let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}})}catch(e){st(t('mic_denied'));return}
 const mt=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(x=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(x));mr=new MediaRecorder(stream,mt?{mimeType:mt}:undefined);chunks=[];
 mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
 mr.onstop=()=>{stream.getTracks().forEach(x=>x.stop());clearInterval(recI);b.textContent=t('rerecord');b.classList.add('p');const blob=new Blob(chunks,{type:mr.mimeType||'audio/mp4'});$('#mine').innerHTML=`<p class="small" style="margin:10px 0 4px">${t('your_rec')}:</p><audio controls src="${URL.createObjectURL(blob)}" style="width:100%"></audio>`;run(blob)};
 mr.start();recT=Date.now();b.textContent=t('stop');b.classList.remove('p');$('#res').innerHTML='';recI=setInterval(()=>{const e=$('#st');if(e)e.innerHTML=`<span class="recdot"></span>${t('recording')} ${((Date.now()-recT)/1000).toFixed(0)} s`},300)}

// ---------- Китоб (Муаллими соний) ----------
const idb=(()=>{let p;const db=()=>p||(p=new Promise((ok,no)=>{const r=indexedDB.open('qu',1);r.onupgradeneeded=()=>r.result.createObjectStore('f');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}));
 return{get:k=>db().then(d=>new Promise((ok,no)=>{const q=d.transaction('f').objectStore('f').get(k);q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)})),
 set:(k,v)=>db().then(d=>new Promise((ok,no)=>{const t=d.transaction('f','readwrite');t.objectStore('f').put(v,k);t.oncomplete=()=>ok();t.onerror=()=>no(t.error)}))}})();

let PDF=null,drawTok=0;
const loadLib=()=>window.pdfjsLib?Promise.resolve():new Promise((ok,no)=>{const sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';sc.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';ok()};sc.onerror=no;document.head.appendChild(sc)});

async function openPdf(buf){await loadLib();PDF=await window.pdfjsLib.getDocument({data:new Uint8Array(buf.slice(0))}).promise}

function vKitob(){return `<h2>${t('book_title')}</h2><div id="kb"><p class="small">${t('loading')}</p></div>`}
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

// ---------- Қоидалар луғати ----------
const GLA=C.GL.flatMap((g,gi)=>g.i.map(x=>({k:x[0],ar:x[1],n:x[2],s:x[3],d:x[4],ex:x[5],L:x[6],g:gi})));
const glk=()=>store.get('glk',{});
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

function render(){applyProf();const h=(location.hash||'#bosh').slice(1);let v,tab=h;
 if(/^dars-\d+$/.test(h)){v=vDars(+h.split('-')[1]-1);tab='darslar'}
 else if(/^alif-\d+$/.test(h)){v=vAlif(+h.split('-')[1]-1);tab='darslar'}
 else if(/^imtihon-(alif|tajwid|review)$/.test(h)){v=vExam(h.split('-')[1]);tab=h.endsWith('review')?'bosh':'darslar'}
 else if(/^sertifikat-(alif|tajwid)$/.test(h)){v=vCert(h.split('-')[1]);tab='bosh'}
 else if(/^qoida-[a-z]+$/.test(h)){v=vQoida(h.slice(6));tab='qoidalar'}
 else if(h==='glmashq'){v=vGlTest();tab='qoidalar'}
 else v=({bosh:vBosh,darslar:vDarslar,qoidalar:vQoidalar,mushaf:vMushaf,ustozlar:vUstozlar,mahraj:vMahraj,tekshiruv:vTek,kitob:vKitob,sozlama:vSozlama}[h]||vBosh)();
 navi(tab);$('#view').innerHTML=v;window.scrollTo(0,0);bar();
 if(tab==='kitob')bookInit();
 if(/^sertifikat-/.test(h)){const cv=$('#cert');if(cv){drawCert(cv,h.split('-')[1]);const a=$('#certSave');try{a.href=cv.toDataURL('image/png')}catch(e){}}}
 $('#ob').innerHTML=prof.onb?'':obHTML()}

// ---------- Ҳодисалар ----------
const say=tt=>{try{const ss=window.speechSynthesis;if(!ss)return false;const v=ss.getVoices().find(x=>/^ar/i.test(x.lang));const u=new SpeechSynthesisUtterance(tt);u.lang=v?v.lang:'ar-SA';if(v)u.voice=v;u.rate=.7;ss.cancel();ss.speak(u);return true}catch(e){return false}};
try{window.speechSynthesis&&window.speechSynthesis.getVoices()}catch(e){}
function answer(btn,ok,box,correctSel){box.querySelectorAll('.opt,.aq').forEach(b=>{b.disabled=true;if(correctSel(b))b.classList.add('ok')});if(!ok)btn.classList.add('no');const r=box.querySelector('.qres');if(r)r.textContent=ok?t('correct'):t('wrong');if(ok)stars(btn);markActive()}
document.addEventListener('click',e=>{const tg=e.target.closest('button,[data-k],.w,.mk');if(!tg)return;const d=tg.dataset;
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
 if(tg.id==='fin'){const i=+location.hash.split('-')[1]-1,dd=done();dd[i]=1;store.set('done',dd);markActive();stars(tg);render();return}
 if(tg.id==='afin'){const i=+location.hash.split('-')[1]-1,dd=doneA();dd[i]=1;store.set('adone',dd);markActive();stars(tg);render();return}
 if(d.say){if(!say(d.say)){tg.disabled=true;tg.textContent=t('no_voice')}return}
 if(d.r){store.set('rec',d.r);render();return}
 if(d.c){const c=store.get('cnt',{});c[d.c]=(c[d.c]||0)+1;store.set('cnt',c);tg.textContent=`+1 · ${c[d.c]}/10`;markActive();return}
 if(d.m){const m=memo();if(m[d.m])delete m[d.m];else{m[d.m]=1;stars(tg)}store.set('memo',m);tg.classList.toggle('p',!!m[d.m]);tg.textContent=(m[d.m]?'✓ ':'')+t('memorized');return}
 if(d.k){tg.classList.toggle('show');return}
 if(tg.id==='go'){run();return}if(tg.id==='rec'){recToggle();return}
 if(d.play){playList([d.play.split(':').map(Number)],0);return}
 if(d.playsura){const s=+d.playsura;playList(Q[s-1].v.map((_,i)=>[s,i+1]),0);return}
 if(d.range){const [s0,f,e2]=d.range.split(':').map(Number),l=[];for(let a=f;a<=e2;a++)l.push([s0,a]);playList(l,0);return}
 if(d.sample){const r=R.find(x=>x.id===d.sample);if(r){P.ov=r;P.list=[[1,2]];P.i=0;P.left=1;startCur()}return}
 if(d.recref){store.set('tref',d.recref);location.hash='tekshiruv';return}
 if(d.set){if(d.set==='lang')prof.lang=d.v;else if(d.set==='font')prof.font=+d.v;else if(d.set==='theme')prof.theme=d.v;else if(d.set==='goal')prof.goal=+d.v;saveProf();render();return}
 if(tg.id==='gShare'){const u=giftLink(($('#gName').value||'').trim());if(navigator.share)navigator.share({title:t('app'),text:t('dua'),url:u}).catch(()=>{});else copy(u);return}
 if(tg.id==='gCopy'){copy(giftLink(($('#gName').value||'').trim()));return}
 if(tg.id==='rst'){$('#rstq').innerHTML=`<p>${t('reset_q')}</p><div class="links"><button class="btn p" id="rstY">${t('yes')}</button><button class="btn" id="rstN">${t('no')}</button></div>`;return}
 if(tg.id==='rstN'){$('#rstq').innerHTML='';return}
 if(tg.id==='rstY'){['done','adone','memo','cnt','certs','days','msdone','mspg'].forEach(k=>store.set(k,k==='mspg'?1:{}));render();return}
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
 if(id==='mspg'){goPage(+e.target.value);return}if(id==='mspdf'&&e.target.files[0]){setPdf(e.target.files[0]);return}
 if(id==='prep'){store.set('rep',+e.target.value);P.left=+e.target.value;bar();return}if(id==='prate'){store.set('rate',+e.target.value);P.a.playbackRate=+e.target.value;return}
 if(id==='ts'){store.set('tref',e.target.value+':1');render();return}if(id==='ta'){store.set('tref',$('#ts').value+':'+e.target.value);render();return}
 if(id==='sura'){store.set('sura',+e.target.value);render();return}if(id==='hide'){store.set('hide',e.target.checked);render()}});
window.addEventListener('hashchange',()=>{stopSeg();if(!/^#imtihon/.test(location.hash))EX=null;render()});
let rw=0;const ro=new ResizeObserver(()=>{const c=$('#cv1');if(c&&lastA)plot(c,lastA);const w=document.body.clientWidth;if(PDF&&$('#pgcv')&&w!==rw){rw=w;drawPage().catch(()=>{})}});ro.observe(document.body);

// ---------- Ишга тушириш ----------
try{const u=new URLSearchParams(location.search);if(u.get('from')){store.set('gift',{from:u.get('from').slice(0,60),to:(u.get('to')||'').slice(0,60)});history.replaceState(null,'',location.pathname+location.hash)}}catch(e){}
if(!prof.lang){const n=(navigator.language||'').toLowerCase();prof.lang=n.startsWith('ru')?'ru':n.startsWith('tg')?'tg':'uz'}
applyProf();render();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
const CDNQ='https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran.json';
const viaScript=()=>new Promise((ok,no)=>{if(window.QURAN_DATA)return ok(window.QURAN_DATA);const sc=document.createElement('script');sc.src='quran.js';sc.onload=()=>window.QURAN_DATA?ok(window.QURAN_DATA):no();sc.onerror=no;document.head.appendChild(sc)});
const viaCDN=()=>fetch(CDNQ).then(r=>{if(!r.ok)throw 0;return r.json()}).then(d=>d.map(x=>({n:x.id,ar:x.name,tr:x.transliteration,v:x.verses.map(v=>v.text)})));
const viaLocal=()=>fetch('quran.json').then(r=>{if(!r.ok)throw 0;return r.json()});
const tmP=fetch('timings.json').then(r=>r.ok?r.json():null).catch(()=>null);
const qP=location.protocol==='file:'?viaScript():viaCDN().catch(viaLocal).catch(viaScript);
Promise.all([qP.catch(()=>null),tmP]).then(([q,tm])=>{Q=q;TM=tm;if(!q)$('#view').insertAdjacentHTML('afterbegin',`<div class="note">${t('audio_fail')}</div>`);render()});
}
