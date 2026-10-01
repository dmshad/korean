/* ===== Проверка без Claude (движок) ===== */
const CHK=(()=>{
 const SB=0xAC00,L0=['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
 const V0=['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
 const T0=['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
 const isH=c=>{const k=c.charCodeAt(0)-SB;return k>=0&&k<11172;};
 const dec=c=>{const k=c.charCodeAt(0)-SB;return {l:Math.floor(k/588),v:Math.floor(k%588/28),t:k%28};};
 const enc=(l,v,t)=>String.fromCharCode(SB+l*588+v*28+t);
 const jamo=s=>[...s].map(c=>{if(!isH(c))return c;const d=dec(c);return L0[d.l]+V0[d.v]+T0[d.t];}).join('');
 const hasB=c=>isH(c)&&dec(c).t>0;
 /* ---- шаблон: ( ) — необязательно, [a|b] — варианты ---- */
 function expand(t,lim=800){
  let i=0;
  function seq(){let out=[''];while(i<t.length){const c=t[i];
    if(c===')'||c===']'||c==='|')break;
    if(c==='('){i++;const inner=seq();i++;out=cross(out,[...inner,'']);}
    else if(c==='['){i++;let alts=[];for(;;){alts=alts.concat(seq());if(t[i]==='|'){i++;continue;}i++;break;}out=cross(out,alts);}
    else{out=out.map(x=>x+c);i++;}}
   return out;}
  const cross=(a,b)=>{const r=[];for(const x of a)for(const y of b){r.push(x+y);if(r.length>lim)return r;}return r;};
  return [...new Set(seq().map(norm))];
 }
 /* ---- нормализация ---- */
 function norm(s){return String(s||'').normalize('NFC').replace(/[.,!?;:~…"'«»“”‘’()\[\]—–\-]/g,' ').replace(/\s+/g,' ').trim();}
 const nsp=s=>s.replace(/\s/g,'');
 /* ---- произношение: связывание 받침 + ㅇ ---- */
 const TL={1:0,2:1,4:2,7:3,8:5,16:6,17:7,19:9,20:10,22:12,23:14,24:15,25:16,26:17};           // 받침 → начальная
 const SPL={3:[1,9],5:[4,12],6:[4,18],9:[8,0],10:[8,6],11:[8,7],12:[8,9],13:[8,16],14:[8,17],15:[8,18],18:[17,9]}; // двойные: остаётся, уходит(нач.)
 function link(s){const a=[...s];for(let k=0;k+1<a.length;k++){const c=a[k],n=a[k+1];if(!isH(c)||!isH(n))continue;
   const x=dec(c),y=dec(n);if(!x.t||y.l!==11)continue;
   if(x.t===21)continue;                                   // ㅇ не переходит
   if(x.t===27){a[k]=enc(x.l,x.v,0);continue;}              // ㅎ выпадает
   if(SPL[x.t]){const[st,mv]=SPL[x.t];
     if(mv===18){a[k]=enc(x.l,x.v,0);a[k+1]=enc(TL[st],y.v,y.t);continue;} // ㄶ ㅀ: ㅎ выпадает, ㄴ/ㄹ переходит
     a[k]=enc(x.l,x.v,st);a[k+1]=enc(mv,y.v,y.t);continue;}
   if(TL[x.t]!==undefined){a[k]=enc(x.l,x.v,0);a[k+1]=enc(TL[x.t],y.v,y.t);}}
  return a.join('');}
 // напряжение после ㄱ/ㄷ/ㅂ-받침: 업서요 → 업써요, 학교 → 학꾜
 const TK=new Set([1,2,3,7,9,17,18,19,20,22,23,24,25,26]),TN={0:1,3:4,7:8,9:10,12:13};
 function tense(s){const a=[...s];for(let k=0;k+1<a.length;k++){const c=a[k],n=a[k+1];if(!isH(c)||!isH(n))continue;
   const x=dec(c),y=dec(n);if(TK.has(x.t)&&TN[y.l]!==undefined)a[k+1]=enc(TN[y.l],y.v,y.t);}return a.join('');}
 const pron=s=>{const l=link(s);return [l,tense(l)];};
 /* ---- расстояние по чамо ---- */
 function lev(a,b){a=[...a];b=[...b];const m=a.length,n=b.length;if(Math.abs(m-n)>3)return 9;let p=Array.from({length:n+1},(_,j)=>j);
  for(let i=1;i<=m;i++){const q=[i];for(let j=1;j<=n;j++)q[j]=Math.min(p[j]+1,q[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=q;}return p[n];}
 /* ---- правила механических ошибок ---- */
 const PAIRS=[
  [['은','는'],'тема: после согласной — 은, после гласной — 는'],
  [['이','가'],'подлежащее: после согласной — 이, после гласной — 가'],
  [['을','를'],'объект: после согласной — 을, после гласной — 를'],
  [['이에요','예요'],'связка: после согласной — 이에요, после гласной — 예요'],
  [['이었어요','였어요'],'связка в прошедшем: после согласной — 이었어요, после гласной — 였어요'],
  [['와','과'],'와/과: после гласной — 와, после согласной — 과 (наоборот, чем у 은/는)'],
  [['아요','어요'],'основа на ㅏ/ㅗ — 아요, иначе — 어요'],
  [['았어요','었어요'],'основа на ㅏ/ㅗ — 았어요, иначе — 었어요']];
 function tokRule(a,c){ // a — ответ, c — верный токен
  if(c.endsWith('요')&&a===c.slice(0,-1))return {kind:'yo',note:'Без 요 получается 반말 (фамильярно). В вежливой речи — '+c+'.'};
  let p=0;while(p<a.length&&p<c.length&&a[p]===c[p])p++;
  const sa=a.slice(p),sc=c.slice(p),stem=c.slice(0,p);
  for(const[pr,why]of PAIRS)if(pr.includes(sa)&&pr.includes(sc)&&sa!==sc){
   const last=stem.slice(-1);const tail=last?(' «'+stem+'» кончается на '+(hasB(last)?'согласную':'гласную')+'.'):'';
   return {kind:'allo',note:why+'.'+tail};}
  return bRule(a,c);}
 // неправильные основы: ㅂ (덥어요, 가까와요, 도워요), ㄷ (묻어요 / 발아요), ㅅ (낫아요 / 우어요); перед -지 основа целая
 const END=['어요','아요','었어요','았어요'];
 function bForms(s){const l=s.slice(-1);if(!l||!isH(l))return null;const d=dec(l),h=s.slice(0,-1),z=h+enc(d.l,d.v,0);
  const reg=END.map(e=>s+e);
  if(d.t===17)return {k:'b',reg,irr:[z+'워요',z+'웠어요',z+'와요',z+'왔어요'],ji:[z+'워지',z+'우지',z+'와지',z+'오지']};
  if(d.t===7){const r=h+enc(d.l,d.v,8);return {k:'d',reg,irr:END.map(e=>r+e),ji:[r+'지']};}
  if(d.t===19)return {k:'s',reg,irr:END.map(e=>z+e),ji:[z+'아지',z+'어지',z+'지']};
  return null;}
 const BN={b:['ㅂ-불규칙: перед 아/어 ㅂ → 우, 우 + 어 = 워: ','ㅂ'],d:['ㄷ-불규칙: перед гласной ㄷ → ㄹ: ','ㄷ'],s:['ㅅ-불규칙: перед гласной ㅅ выпадает: ','ㅅ']};
 function bRule(a,c){
  if(c.endsWith('지')&&LEX.stem[c.slice(0,-1)]){const b=bForms(c.slice(0,-1));if(b&&b.ji.includes(a))return {kind:'birr',note:'Перед -지 основа не меняется: '+c+'.'};return null;}
  const f=LEX.form[c];if(!f)return null;const s=f.s,b=bForms(s);if(!b)return null;const irr=!c.startsWith(s);
  if(irr&&b.reg.includes(a))return {kind:'birr',note:(s==='돕'?'돕다 — особый: ㅂ → 오, 오 + 아 = 와: ':BN[b.k][0])+c+'.'};
  if(irr&&b.k==='b'&&b.irr.includes(a)&&a!==c)return {kind:'birr',note:(s==='돕'?'돕다 — 와, не 워: ':'워 — после любой гласной (кроме 돕다): ')+c+'.'};
  if(!irr&&b.irr.includes(a))return {kind:'breg',note:s+'다 — правильная основа, '+BN[b.k][1]+' не меняется: '+c+'.'};
  return null;}
 function rules(ans,v){const A=ans.split(' '),C=v.split(' ');if(A.length!==C.length)return null;
  const diff=[];for(let k=0;k<A.length;k++)if(A[k]!==C[k])diff.push(k);
  if(!diff.length)return null;const out=[];
  for(const k of diff){const r=tokRule(A[k],C[k]);if(!r)return null;out.push(r);}
  return {kind:out[0].kind,note:[...new Set(out.map(r=>r.note))].join(' ')};}
 /* ---- разбор отличий (по слогам) для подсветки ---- */
 function diff(a,b){const A=[...a],B=[...b],m=A.length,n=B.length;const L=Array.from({length:m+1},()=>new Array(n+1).fill(0));
  for(let i=m-1;i>=0;i--)for(let j=n-1;j>=0;j--)L[i][j]=A[i]===B[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
  const da=[],db=[];let i=0,j=0;while(i<m||j<n){
   if(i<m&&j<n&&A[i]===B[j]){da.push([A[i],0]);db.push([B[j],0]);i++;j++;}
   else if(j<n&&(i>=m||L[i][j+1]>=L[i+1][j])){db.push([B[j],1]);j++;}
   else{da.push([A[i],1]);i++;}}
  return {a:da,b:db};}
 // какие чамо отличаются при расстоянии 1 (ㅆ — показатель прошедшего, не описка)
 function oneJ(x,y){x=[...x];y=[...y];let i=0;while(i<x.length&&i<y.length&&x[i]===y[i])i++;let j=0;while(j<x.length-i&&j<y.length-i&&x[x.length-1-j]===y[y.length-1-j])j++;return x.slice(i,x.length-j).concat(y.slice(i,y.length-j));}
 /* ---- равнозначные формы (канон) ---- */
 let LEX={nouns:new Set(),form:{},stem:{}};
 // nouns: существительные/местоимения/счётные; form: 가요→{s:'가',p:0}; stem: '가'→{pres:'가요',past:'갔어요'}
 function setLex(D){const n=new Set(['뭐','무엇','누구','이것','그것','저것','여기','거기','저기']),f={},st={};
  for(const w of D.words||[]){const k=w.ko;if(/\s/.test(k))continue;
   if(['noun','pron','counter','time','num','question'].includes(w.cat))n.add(k);
   if(w.cat==='verb'&&k.endsWith('하다')&&k.length>2)n.add(k.slice(0,-2));
   if((w.cat==='verb'||w.cat==='adj')&&w.forms&&k.endsWith('다')&&!/\//.test(w.forms.pres||'/')){const sm=k.slice(0,-1);
    st[sm]={pres:w.forms.pres,past:w.forms.past};f[w.forms.pres]={s:sm,p:0};if(w.forms.past)f[w.forms.past]={s:sm,p:1};}}
  LEX={nouns:n,form:f,stem:st};}
 const PP=[['을','를'],['이','가']];
 function stripP(t){for(const[c,v]of PP)for(const q of [c,v]){if(!t.endsWith(q)||t.length<2)continue;const st=t.slice(0,-q.length);
   if(!LEX.nouns.has(st))continue;const need=hasB(st.slice(-1))?c:v;if(q===need)return st;}return t;}
 function canon(s){let T=s.split(' ').filter(Boolean);
  // длинное отрицание → короткое: 가지 못해요 → 못 가요
  const o=[];for(let k=0;k<T.length;k++){const t=T[k],n=T[k+1];
   if(t.endsWith('지')&&n&&/^(못했어요|못해요|않았어요|않아요)$/.test(n)){const sm=t.slice(0,-1),neg=n[0]==='못'?'못':'안',past=n==='못했어요'||n==='않았어요';
    if(sm.endsWith('하')&&sm.length>1){o.push(sm.slice(0,-1),neg,past?'했어요':'해요');k++;continue;}
    const e=LEX.stem[sm];if(e){o.push(neg,past?e.past:e.pres);k++;continue;}}
   // 하다-глагол с 안/못 внутри: 운동하지… уже выше; короткое 운동을 못 해요 → частица снимется ниже
   o.push(t);}
  T=o.filter(t=>t!=='저는'&&t!=='나는').map(t=>{if(t==='저의')return '제';if(t==='나의')return '내';const m=t.match(/^(.+)한테(도|만)?$/);if(m&&LEX.nouns.has(m[1]))return m[1]+'에게'+(m[2]||'');return t;}).map(t=>{if(t.endsWith('의')&&t.length>1&&!LEX.nouns.has(t)&&LEX.nouns.has(t.slice(0,-1)))return t.slice(0,-1);return t;}).map(stripP);
  const r=[];for(let k=0;k<T.length;k++){if(T[k]==='어디에'){r.push('어디');continue;}r.push(T[k]);}
  // 하다-составной без пробела и с 안/못 между: 운동 못 해요 — норма; 못 운동해요 не трогаем
  return r.join(' ');}
 /* ---- главная ---- */
 // item: {ko, alt[], traps[{a,why}]}; ответ пользователя
 function check(item,ans){
  const raw=String(ans||'').trim();
  if(!raw||raw==='-')return {v:'bad',kind:'empty',best:expand(item.ko)[0]||'',note:''};
  if(/[()\[\]|]/.test(raw)){const b=expand(item.ko)[0]||'';return {v:'bad',kind:'brk',best:b,note:'Скобки в ответе не пишутся. В эталоне (를) означает, что частица необязательна: верно и с ней, и без неё. Пиши один вариант целиком.',d:diff(norm(raw),b)};}
  const a=norm(raw);
  const V=[];for(const t of [item.ko,...(item.alt||[])])for(const x of expand(t))if(!V.includes(x))V.push(x);
  if(V.includes(a))return {v:'ok',kind:'exact',best:a};
  const an=nsp(a);
  for(const x of V)if(nsp(x)===an)return {v:'typo',kind:'space',best:x,note:'Только пробелы.'};
  for(const tr of item.traps||[])for(const x of expand(tr.a))if(nsp(x)===an){
   const best=V.slice().sort((p,q)=>lev(jamo(nsp(p)),jamo(an))-lev(jamo(nsp(q)),jamo(an)))[0];
   return {v:'bad',kind:'trap',best,note:tr.why,d:diff(a,best)};}
  const ca=item.strict?a:canon(a);if(!item.strict)for(const x of V)if(canon(x)===ca)return {v:'ok',kind:'eq',best:x};
  for(const x of V){const r=rules(a,x);if(r)return {v:'bad',kind:r.kind,best:x,note:r.note,d:diff(a,x)};}
  if(!item.strict)for(const x of V){const r=rules(ca,canon(x));if(r)return {v:'bad',kind:r.kind,best:x,note:r.note,d:diff(a,x)};}
  const la=pron(an);
  for(const x of V){const px=pron(nsp(x));if(la.some(y=>px.includes(y)))return {v:'bad',kind:'pron',best:x,note:'Записано по произношению. 받침 звучит в следующем слоге, но пишется на своём месте: '+x+'.',d:diff(a,x)};}
  const ja=jamo(an);let best=V[0],bd=99;for(const x of V){const d=lev(jamo(nsp(x)),ja);if(d<bd){bd=d;best=x;}}
  if(bd===1&&jamo(nsp(best)).length>=4&&!oneJ(jamo(nsp(best)),ja).includes('ㅆ'))return {v:'typo',kind:'jamo',best,note:'Описка в одной букве.',d:diff(a,best)};
  // ловушка с опечаткой (одна чамо): ошибка по смыслу важнее опечатки
  for(const tr of item.traps||[])for(const x of expand(tr.a))if(lev(jamo(nsp(x)),ja)<=1&&jamo(nsp(x)).length>=4)return {v:'bad',kind:'trap',best,note:tr.why+' Плюс ошибка в написании — сравни с эталоном.',d:diff(a,best)};
  return {v:'unk',kind:'unk',best,note:'',d:diff(a,best)};
 }
 return {check,expand,norm,link,jamo,lev,diff,setLex,canon};
})();
/* ===== Банк заданий (автономный режим) ===== */
// D.bank = { gN: { qN|_ : [ {ru, ko, alt[], traps[{a,why}], u} ] } }; ko/alt — шаблоны ( ) и [a|b]
const BANK=(()=>{
 // показ шаблона: ( ) — с содержимым, [a|b] — первый вариант
 function show(t){let i=0;t=String(t||'');
  function seq(stop){let o='';while(i<t.length){const c=t[i];
    if(stop&&(c===')'||c===']'||c==='|'))return o;
    if(c==='('){i++;o+=seq(1);i++;}
    else if(c==='['){i++;let first=seq(1),f=true;while(t[i]==='|'){i++;seq(1);}i++;o+=first;}
    else{o+=c;i++;}}return o;}
  return seq(0).replace(/\s+/g,' ').replace(/\s+([.,?!])/g,'$1').trim();}
 // ключ задания — первая реплика (до « — »): одинаковые вопросы в один блок не ставятся
 const key=x=>CHK.norm(show(x.ko).split(' — ')[0]);
 function pick(src,n,used,taken){const r=[];for(const x of src){if(r.length>=n)break;const k=key(x);if(taken.has(k)||(used&&used.has(x.id)))continue;taken.add(k);r.push(x);}return r;}
 const sh=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
 let POOL=null;
 // пул: банк + базовые блоки из тем (ex частей, allEx — по модели в свою часть)
 function build(D){POOL={};const B=D.bank||{},OPEN=new Set(D.grammar.filter(g=>g.open).map(g=>g.id)),HAS=new Set(D.grammar.map(g=>g.id));
  for(const g of D.grammar){if(!(g.n>0))continue;const P={},add=(p,x,src)=>{const a=P[p]||(P[p]=[]),k=show(x.ko);if(a.some(y=>show(y.ko)===k))return;a.push(Object.assign({},x,{id:g.id+'|'+p+'|'+src+a.length}));};
   const parts=g.parts||[],pOf=u=>{const p=parts.find(p=>(p.usage||[]).includes(u));return p?p.id:(parts[0]?parts[0].id:'_');};
   for(const p of parts)for(const b of p.ex||[])for(const x of b)add(p.id,x,'e');
   for(const b of g.allEx||[])for(const x of b)add(pOf(x.u),x,'a');
   for(const [p,a] of Object.entries(B[g.id]||{}))for(const x of a)if(!x.after||(HAS.has(x.after)&&!OPEN.has(x.after)))add(p,x,'b');
   if(Object.keys(P).length)POOL[g.id]=P;}
  return POOL;}
 const all=g=>Object.values(POOL[g]||{}).flat();
 const has=g=>all(g).length>0;
 // элемент блока в формате движка: ko — показ, шаблоны — в alt
 function item(x,g){const ko=show(x.ko);return {ru:x.ru,ko,alt:[x.ko,...(x.alt||[])],traps:x.traps||[],t:g,u:x.u||'',w:[],bid:x.id,strict:!!x.strict};}
 // часть: по кругу, i-й блок
 function part(g,p,i,n=5){const a=(POOL[g]||{})[p]||[];if(!a.length)return null;const L=a.length,st=(i*n)%L;
  const rot=Array.from({length:L},(_,k)=>a[(st+k)%L]);return pick(rot,Math.min(n,L),null,new Set()).map(x=>item(x,g));}
 // вся тема: n случайных из всех частей, без повторов внутри сессии, пока хватает
 function whole(g,used,n=8,taken){const a=all(g);if(!a.length)return null;taken=taken||new Set();let f=a.filter(x=>!used.has(x.id));if(f.length<n){used.clear();f=a;}
  let r=pick(sh(f),n,null,taken);if(r.length<n)r=r.concat(pick(sh(a),n-r.length,new Set(r.map(x=>x.id)),taken));
  r.forEach(x=>used.add(x.id));return r.map(x=>item(x,g));}
 // смешанные: nc из текущей + no из прошлых тем
 function mix(g,prev,used,nc=5,no=5){const taken=new Set(),cur=whole(g,used,nc,taken)||[];const old=prev.filter(has);
  const o=[];for(let k=0,tries=0;o.length<no&&old.length&&tries<no*6;tries++){const t=old[Math.random()*old.length|0];const a=pick(sh(all(t)),1,used,taken);const x=a[0];if(x){used.add(x.id);o.push(item(x,t));}}
  return sh([...cur,...o]);}
 // повторение: слоты {t,u} → фраза той модели, иначе любая фраза темы
 function rev(slots,used){const taken=new Set();return slots.map(sl=>{const a=all(sl.t);if(!a.length)return null;
   const ok=x=>!taken.has(key(x));
   let f=a.filter(x=>x.u===sl.u&&!used.has(x.id)&&ok(x));if(!f.length)f=a.filter(x=>!used.has(x.id)&&ok(x));if(!f.length)f=a.filter(ok);if(!f.length)f=a;
   const x=f[Math.random()*f.length|0];used.add(x.id);taken.add(key(x));return item(x,sl.t);}).filter(Boolean);}
 // сколько фраз и моделей покрыто
 function stat(){const r={};for(const g of Object.keys(POOL||{})){const a=all(g);r[g]={n:a.length,parts:Object.fromEntries(Object.entries(POOL[g]).map(([p,x])=>[p,x.length])),u:new Set(a.map(x=>x.u)).size};}return r;}
 return {build,show,item,part,whole,mix,rev,stat,has,all};
})();
