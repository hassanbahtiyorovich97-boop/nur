// Тажвид текшируви: HisnLabs Tajweed v2 модели (Apache-2.0) + қоидалар қисми (imam.py) нинг JavaScript нусхаси.
// Модель телефонда ишлайди (onnxruntime-web), бир марта юкланади ва кэшда сақланади.
(function(G){
'use strict';
const LONG={'ا':'alif','ۥ':'waw','ۦ':'yaa'},HARAKAT=new Set(['َ','ُ','ِ']),ONSET=3,TIME_SIX=8.3,TIME_FIVE=7.0;
const PHON=["ء","ب","ت","ث","ج","ح","خ","د","ذ","ر","ز","س","ش","ص","ض","ط","ظ","ع","غ","ف","ق","ك","ل","م","ن","ه","و","ي","ا","ۦ","ۥ","َ","ُ","ِ","۪","ـ","ٲ","ڇ","ں","۾","ۜ","ؙ"];
const KIND={m:'madd',s:'shadda',q:'qalqalah',k:'ikhfa',b:'iqlab',g:'ghunnah',G:'idgham_ghunnah',d:'idgham'};

// ---------- Levenshtein opcodes (python-Levenshtein билан бир хил шакл) ----------
function editops(a,b){const n=a.length,m=b.length,W=m+1,D=new Uint32Array((n+1)*W);
 for(let i=0;i<=n;i++)D[i*W]=i;for(let j=0;j<=m;j++)D[j]=j;
 for(let i=1;i<=n;i++)for(let j=1;j<=m;j++){const c=a[i-1]===b[j-1]?0:1;D[i*W+j]=Math.min(D[(i-1)*W+j]+1,D[i*W+j-1]+1,D[(i-1)*W+j-1]+c)}
 const ops=[];let i=n,j=m;
 // кетма-кетлик python-Levenshtein (rapidfuzz) билан бир хил: аввал ўчириш, алмаштириш, қўшиш, кейин мослик
 while(i>0||j>0){const d=D[i*W+j];
  if(i>0&&D[(i-1)*W+j]+1===d){ops.push(['delete',i-1,j]);i--;continue}
  if(i>0&&j>0&&a[i-1]!==b[j-1]&&D[(i-1)*W+j-1]+1===d){ops.push(['replace',i-1,j-1]);i--;j--;continue}
  if(j>0&&D[i*W+j-1]+1===d){ops.push(['insert',i,j-1]);j--;continue}
  i--;j--}
 return ops.reverse()}
function opcodes(a,b){let p=0;while(p<a.length&&p<b.length&&a[p]===b[p])p++;let q=0;while(q<a.length-p&&q<b.length-p&&a[a.length-1-q]===b[b.length-1-q])q++;
 const ops=editops(a.slice(p,a.length-q),b.slice(p,b.length-q)).map(o=>[o[0],o[1]+p,o[2]+p]),out=[];let i=0,j=0,k=0;
 while(k<ops.length){const [t,oi,oj]=ops[k];if(i<oi||j<oj){const L=Math.min(oi-i,oj-j);if(L>0){out.push(['equal',i,i+L,j,j+L]);i+=L;j+=L;continue}}
  const i1=i,j1=j;while(k<ops.length&&ops[k][0]===t&&ops[k][1]===i&&ops[k][2]===j){if(t==='replace'){i++;j++}else if(t==='insert')j++;else i++;k++}out.push([t,i1,i,j1,j])}
 const L=Math.min(a.length-i,b.length-j);if(L>0)out.push(['equal',i,i+L,j,j+L]);return out}

// ---------- imam.listen ----------
function boundaries(ref,heard){const b=new Array(ref.length+1).fill(0);
 for(const [tag,i1,i2,j1,j2] of opcodes(ref,heard))for(let k=i1;k<=i2;k++)b[k]=j1+(i2>i1?Math.round((k-i1)*(j2-j1)/(i2-i1)):0);
 b[ref.length]=heard.length;return b}
function run(h,a,b,c){let k=-1;for(let x=a;x<b;x++)if(h[x]===c){k=x;break}if(k<0)return [0,a,a];let s=k,e=k;while(s>0&&h[s-1]===c)s--;while(e<h.length&&h[e]===c)e++;return [e-s,s,e]}
function dur(h,times,s,e){const a=s&&HARAKAT.has(h[s-1])?times[s-1]:times[s];return Math.max(0,times[Math.min(e,times.length-1)]-a)}
function tempoOf(R,h,b,times){if(!times||times.length!==h.length+1)return null;const ends=new Set([R.w.length-1]),nat=[];
 for(const u of R.units)if(u.kind==='madd'&&u.rule==='NormalMaddRule'&&!ends.has(u.word)){const [n,s,e]=run(h,Math.max(0,b[u.s]-1),Math.min(h.length,b[u.e]+1),u.char);if(n>=1&&n<=3)nat.push(dur(h,times,s,e))}
 const v=nat.filter(d=>d>0.08&&d<2).sort((x,y)=>x-y);if(v.length<2)return null;return v[Math.floor(v.length/2)]/2}
const strip=s=>{let o='';for(const c of s){if(o&&o[o.length-1]===c)continue;o+=c}return [...o].filter(c=>!LONG[c]&&!'ںڇ۾'.includes(c)).join('')};
const setOf=s=>new Set([...s]);const subset=(a,b)=>[...a].every(x=>b.has(x));

function listen(R,heard,probs,times,minProb=0.3,minJali=0.7){heard=heard.replace(/ /g,'');const P=R.p,b=boundaries(P,heard),notes=R.w.map(()=>[]),covered=new Array(P.length).fill(false),maddHeard=R.w.map(()=>[]);
 let span=[0,0];const unsure=(hs,he,thr)=>{if(!probs)return false;const seg=probs.slice(Math.max(0,hs-1),Math.min(probs.length,he+1));return seg.length>0&&Math.min(...seg)<(thr==null?minProb:thr)};
 const add=(w,rule,sev,kind,k)=>{if(unsure(span[0],span[1]))return;notes[w].push({rule,sev,kind,k:k||{}})};
 const moreNun=(u,hs,he)=>(heard.slice(Math.max(0,hs-2),he).split('ن').length-1)>(P.slice(Math.max(0,u.s-2),u.e).split('ن').length-1);
 const seen={},unit=tempoOf(R,heard,b,times);
 for(const u of R.units){for(let x=u.s;x<u.e;x++)covered[x]=true;const hs=b[u.s],he=b[u.e];span=[hs,he];
  if(u.kind==='madd'){let [n,rs,re]=run(heard,Math.max(0,hs-1),Math.min(heard.length,he+1),u.char);if(u.rule.startsWith('Leen')&&n>0)n+=1;
   const sym=n;let shown=n?(n<=3?2:n<=5?4:6):0;
   if(unit&&(n===4||n===5)){const tc=dur(heard,times,rs,re)/unit;n=tc>=TIME_SIX?6:tc>=TIME_FIVE?5:4;shown=tc>=TIME_SIX?6:4}
   const allowed=u.allowed,near=allowed.reduce((p,a)=>Math.abs(a-n)<Math.abs(p-n)?a:p,allowed[0]);
   (seen[u.rule]=seen[u.rule]||[]).push([u.word,sym]);
   if(shown&&u.rule!=='NormalMaddRule')maddHeard[u.word].push({rule:u.rule,heard:shown});
   if(n===0&&!u.rule.startsWith('Leen'))add(u.word,u.rule,'jali','madd_missing',{rule:u.rule});
   else if(Math.abs(n-near)>1&&!unsure(hs,he))notes[u.word].push({rule:u.rule,sev:'khafi',kind:n>near?'madd_long':'madd_short',k:{rule:u.rule,heard:n,want:allowed.includes(u.golden)?u.golden:near}})}
  else if(u.kind==='qalqalah'){if(!heard.slice(Math.max(0,hs-1),he+1).includes('ڇ'))add(u.word,'qalqalah','khafi','qalqalah_missing',{letter:u.s?P[u.s-1]:''})}
  else if(u.kind==='ikhfa'){const [n]=run(heard,hs,Math.max(he,hs+1),'ں');if(n===0&&heard.slice(hs,he+1).includes('ن'))add(u.word,'ikhfa','khafi','ikhfa_izhar');else if(n&&n<u.golden-1)add(u.word,'ikhfa','khafi','ikhfa_short')}
  else if(u.kind==='iqlab'){if(!heard.slice(Math.max(0,hs-1),he+1).includes('۾'))add(u.word,'iqlab','khafi','iqlab_missed')}
  else if(u.kind==='ghunnah'||u.kind==='idgham_ghunnah'){const [n]=run(heard,Math.max(0,hs-1),Math.min(heard.length,he+1),u.char);
   if(u.kind==='idgham_ghunnah'&&u.char!=='ن'&&moreNun(u,hs,he))add(u.word,'idgham','khafi','idgham_missed',{letter:u.char});
   else if(n<u.golden)add(u.word,u.kind,'khafi',u.kind==='ghunnah'?'ghunnah_short':'idgham_ghunnah_short')}
  else if(u.kind==='shadda'||u.kind==='idgham'){const [n]=run(heard,Math.max(0,hs-1),Math.min(heard.length,he+1),u.char);
   if(u.kind==='idgham'&&moreNun(u,hs,he))add(u.word,'idgham','khafi','idgham_missed',{letter:u.char});else if(n===1)add(u.word,'shadda','jali','shadda_missing',{letter:u.char})}}
 const OKSET=new Set([...Object.keys(LONG),'ڇ','ں','۾','ن','م']);
 for(const [tag,i1,i2,j1,j2] of opcodes(P,heard)){if(tag==='equal')continue;const exp=P.slice(i1,i2),got=heard.slice(j1,j2);
  if(i2>i1&&covered.slice(i1,i2).every(Boolean)&&(!got||subset(setOf(got),new Set([...setOf(exp),...OKSET]))))continue;
  if(tag==='insert'&&R.units.some(u=>u.kind==='madd'&&u.s<=i1&&i1<=u.e&&subset(setOf(got),new Set([u.char]))))continue;
  const w=(()=>{for(let k=0;k<R.sp.length;k++)if(R.sp[k][0]<=i1&&i1<R.sp[k][1])return k;return R.w.length-1})();span=[j1,j2];
  if(i1<ONSET)continue;const ec=strip(exp),gc=strip(got);if(ec===gc)continue;if(unsure(j1,j2,minJali))continue;
  if(tag==='replace'&&ec.length===1&&gc.length===1&&HARAKAT.has(ec)&&HARAKAT.has(gc)){notes[w].push({rule:'vowel',sev:'jali',kind:'vowel',k:{want:ec,heard:gc}})}
  else if(tag==='replace')add(w,'letter','jali','letter',{want:exp,heard:got});
  else if(tag==='delete'){if(exp.length===1&&(LONG[exp]||HARAKAT.has(exp)))continue;add(w,'dropped','jali','dropped',{want:exp})}
  else if(tag==='insert'){if(i1===0||i1===P.length)continue;if(subset(setOf(got),new Set(Object.keys(LONG)))){if(got.length>=2)add(w,'madd_added','khafi','madd_added');continue}
   if(got.length===1&&HARAKAT.has(got))continue;add(w,'added','jali','added',{heard:got})}}
 R.sp.forEach(([a,z],k)=>{if(z>a&&b[z]-b[a]<=Math.max(0,Math.floor((z-a)/4)))notes[k]=[{rule:'word',sev:'jali',kind:'word_missing',k:{}}]});
 for(const [rule,sn] of Object.entries(seen)){if(['MonfaselMaddRule','MottaselMaddRule','AaredMaddRule','BadalMadd'].includes(rule)&&sn.length>=2){const lens=sn.map(x=>x[1]).filter(Boolean);
  if(lens.length&&Math.max(...lens)-Math.min(...lens)>=2){const avg=Math.round(lens.reduce((x,y)=>x+y,0)/lens.length);const w=sn.reduce((p,x)=>Math.abs(x[1]-avg)>Math.abs(p[1]-avg)?x:p,sn[0])[0];notes[w].push({rule:rule+':uneven',sev:'khafi',kind:'madd_uneven',k:{rule,lens:lens.join(' / ')}})}}}
 return R.w.map((w,k)=>({word:w,ok:!notes[k].length,notes:notes[k],madd:maddHeard[k]}))}

function prepRef(o){return {w:o.w,p:o.p,sp:o.sp,units:o.u.map(x=>({s:x[0],e:x[1],kind:KIND[x[2]],word:x[3],golden:x[4],allowed:x[5],rule:x[6],char:x[7]}))}}

// ---------- Whisper log-mel (faster_whisper.FeatureExtractor нинг нусхаси) ----------
let MELF=null,COS=null,SIN=null,WIN=null;
function melFilters(sr=16000,nfft=400,nm=80){const nf=nfft/2+1,fft=new Float64Array(nf);for(let i=0;i<nf;i++)fft[i]=i*sr/nfft;
 const mels=[];for(let i=0;i<nm+2;i++)mels.push(45.245640471924965*i/(nm+1));const fsp=200/3,minLogHz=1000,minLogMel=minLogHz/fsp,logstep=Math.log(6.4)/27;
 const fr=mels.map(m=>m>=minLogMel?minLogHz*Math.exp(logstep*(m-minLogMel)):fsp*m);const W=[];
 for(let i=0;i<nm;i++){const row=new Float32Array(nf),fd0=fr[i+1]-fr[i],fd1=fr[i+2]-fr[i+1],en=2/(fr[i+2]-fr[i]);
  for(let j=0;j<nf;j++){const lo=-(fr[i]-fft[j])/fd0,up=(fr[i+2]-fft[j])/fd1;row[j]=Math.max(0,Math.min(lo,up))*en}W.push(row)}return W}
function logMel(x){const N=400,H=160,nf=201;if(!MELF){MELF=melFilters();WIN=new Float32Array(N);for(let i=0;i<N;i++)WIN[i]=0.5-0.5*Math.cos(2*Math.PI*i/N);
  COS=new Float32Array(nf*N);SIN=new Float32Array(nf*N);for(let k=0;k<nf;k++)for(let n=0;n<N;n++){COS[k*N+n]=Math.cos(2*Math.PI*k*n/N);SIN[k*N+n]=Math.sin(2*Math.PI*k*n/N)}}
 const p=N/2,L=x.length+2*p,y=new Float32Array(L);for(let i=0;i<L;i++){let j=i-p;if(j<0)j=-j;if(j>=x.length)j=2*(x.length-1)-j;y[i]=x[Math.max(0,Math.min(x.length-1,j))]}
 const T=1+Math.floor((L-N)/H)-1,mag=new Float32Array(nf),fr=new Float32Array(N),out=new Float32Array(80*T);let mx=-Infinity;
 for(let t=0;t<T;t++){for(let n=0;n<N;n++)fr[n]=y[t*H+n]*WIN[n];
  for(let k=0;k<nf;k++){let re=0,im=0;const o=k*N;for(let n=0;n<N;n++){re+=fr[n]*COS[o+n];im-=fr[n]*SIN[o+n]}mag[k]=re*re+im*im}
  for(let m=0;m<80;m++){const w=MELF[m];let s=0;for(let k=0;k<nf;k++)s+=w[k]*mag[k];const v=Math.log10(Math.max(s,1e-10));out[m*T+t]=v;if(v>mx)mx=v}}
 for(let i=0;i<out.length;i++)out[i]=(Math.max(out[i],mx-8)+4)/4;return {data:out,T}}

// ---------- Модель ----------
const MODEL_URL='https://huggingface.co/Hisnlabs/tajweed-v2/resolve/main/onnx/model-int8.onnx';
const ORT_URL='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
let SESS=null,LOADING=null;
function loadScript(u){return new Promise((res,rej)=>{if(G.ort)return res();const s=document.createElement('script');s.src=u;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
async function modelBytes(onProg){const C='qu-audio';let c=null;try{c=await caches.open(C);const m=await c.match(MODEL_URL);if(m)return new Uint8Array(await m.arrayBuffer())}catch(e){}
 const r=await fetch(MODEL_URL,{mode:'cors'});if(!r.ok)throw new Error('model '+r.status);const tot=+r.headers.get('content-length')||23e6,rd=r.body&&r.body.getReader?r.body.getReader():null;
 let buf;if(rd){const parts=[];let got=0;for(;;){const {done,value}=await rd.read();if(done)break;parts.push(value);got+=value.length;onProg&&onProg(got/tot)}buf=new Uint8Array(got);let o=0;for(const p of parts){buf.set(p,o);o+=p.length}}
 else buf=new Uint8Array(await r.arrayBuffer());
 try{if(c)await c.put(MODEL_URL,new Response(buf,{headers:{'Content-Type':'application/octet-stream'}}))}catch(e){}return buf}
async function ready(onProg){if(SESS)return SESS;if(LOADING)return LOADING;
 LOADING=(async()=>{await loadScript(ORT_URL+'ort.min.js');G.ort.env.wasm.wasmPaths=ORT_URL;G.ort.env.wasm.numThreads=1;
  const bytes=await modelBytes(onProg);SESS=await G.ort.InferenceSession.create(bytes,{executionProviders:['wasm']});return SESS})();
 try{return await LOADING}catch(e){LOADING=null;throw e}}
async function cached(){try{const c=await caches.open('qu-audio');return !!(await c.match(MODEL_URL))}catch(e){return false}}

async function toMono16k(blob){const ab=await blob.arrayBuffer();const AC=G.AudioContext||G.webkitAudioContext;const ctx=new AC();
 const buf=await new Promise((res,rej)=>{const p=ctx.decodeAudioData(ab,res,rej);if(p&&p.then)p.then(res,rej)});try{ctx.close()}catch(e){}
 const len=Math.ceil(buf.duration*16000),OC=G.OfflineAudioContext||G.webkitOfflineAudioContext,oc=new OC(1,len,16000),src=oc.createBufferSource();src.buffer=buf;src.connect(oc.destination);src.start();
 const r=await oc.startRendering();return r.getChannelData(0)}

async function hear(blob,onProg){const sess=await ready(onProg);let x=await toMono16k(blob);
 if(x.length>16000*29)x=x.slice(0,16000*29);
 // овозни бир хил баландликка келтириш
 let pk=0;for(let i=0;i<x.length;i++)pk=Math.max(pk,Math.abs(x[i]));if(pk>0&&pk<0.5){const g=0.5/pk;x=x.map(v=>v*g)}
 const LEAD=6400,a=new Float32Array(x.length+2*LEAD);a.set(x,LEAD);
 let {data,T}=logMel(a);let F=Math.min(3000,Math.floor(T/2)*2);if(F<T){const d2=new Float32Array(80*F);for(let m=0;m<80;m++)d2.set(data.subarray(m*T,m*T+F),m*F);data=d2}T=F;
 const out=await sess.run({mel:new G.ort.Tensor('float32',data,[1,80,T]),riwaya:new G.ort.Tensor('int64',BigInt64Array.from([0n]),[1])});
 const lp=out[Object.keys(out)[0]],[,TT,V]=lp.dims,D=lp.data,step=a.length/16000/TT;
 let h='',probs=[],times=[],prev=0,last=-1;
 for(let t=0;t<TT;t++){let bi=0,bv=-Infinity;for(let v=0;v<V;v++){const z=D[t*V+v];if(z>bv){bv=z;bi=v}}
  if(bi!==prev&&bi!==0){h+=PHON[bi-1];probs.push(Math.exp(bv));times.push((t+0.5)*step-LEAD/16000)}if(bi!==0)last=t;prev=bi}
 times.push(last>=0?(last+1)*step-LEAD/16000:0);return {heard:h,probs,times}}

const REFS={};
async function refFor(s,a){if(!REFS[s]){const r=await fetch(`tj/${String(s).padStart(3,'0')}.json`);if(!r.ok)throw new Error('ref');REFS[s]=await r.json()}const o=REFS[s][a-1];return o?prepRef(o):null}

async function check(blob,s,a,onProg){const R=await refFor(s,a);if(!R)throw new Error('ref');const H=await hear(blob,onProg);return {words:listen(R,H.heard,H.probs,H.times),heard:H.heard,ref:R}}

G.TAJ={check,ready,cached,listen,prepRef,logMel,opcodes,refFor,MODEL_URL};
})(window);
