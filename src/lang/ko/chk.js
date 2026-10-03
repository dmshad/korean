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
 // назализация перед ㄴ/ㅁ: 합니다 → [함니다], 먹습니다 → [먹씀니다]
 const NS={1:21,2:21,24:21,7:4,19:4,20:4,22:4,23:4,25:4,17:16,26:16};
 function nasal(s){const a=[...s];for(let k=0;k+1<a.length;k++){const c=a[k],n=a[k+1];if(!isH(c)||!isH(n))continue;
   const x=dec(c),y=dec(n);if((y.l===2||y.l===6)&&NS[x.t]!==undefined)a[k]=enc(x.l,x.v,NS[x.t]);}return a.join('');}
 const pron=s=>{const l=link(s),t=tense(l);return [l,t,nasal(l),nasal(t)];};
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
  [['았어요','었어요'],'основа на ㅏ/ㅗ — 았어요, иначе — 었어요'],
  [['습니다','읍니다'],'после согласной — 습니다 (읍니다 — устаревшее написание)'],
  [['습니까','읍니까'],'после согласной — 습니까 (읍니까 — устаревшее написание)']];
 function tokRule(a,c){ // a — ответ, c — верный токен
  if(c.endsWith('요')&&a===c.slice(0,-1))return {kind:'yo',note:'Без 요 получается 반말 (фамильярно). В вежливой речи — '+c+'.'};
  if(LEX.pt&&LEX.pt[c]){const r=ptRule(a,c);if(r)return r;}
  let p=0;while(p<a.length&&p<c.length&&a[p]===c[p])p++;
  const sa=a.slice(p),sc=c.slice(p),stem=c.slice(0,p);
  for(const[pr,why]of PAIRS)if(pr.includes(sa)&&pr.includes(sc)&&sa!==sc){
   const last=stem.slice(-1);const tail=last?(' «'+stem+'» кончается на '+(hasB(last)?'согласную':'гласную')+'.'):'';
   return {kind:'allo',note:why+'.'+tail};}
  return bRule(a,c)||hRule(a,c)||fRule(a,c)||gRule(a,c)||sRule(a,c)||psRule(a,c)||reRule(a,c)||goRule(a,c)||jmRule(a,c)||asRule(a,c)||niRule(a,c)||myRule(a,c)||roRule(a,c)||ayRule(a,c)||boRule(a,c)||dwRule(a,c)||adRule(a,c)||ptRule(a,c)||pfRule(a,c)||kiRule(a,c);}
 // неправильные основы: ㅂ (덥어요, 가까와요, 도워요), ㄷ (묻어요 / 발아요), ㅅ (낫아요 / 우어요); перед -지 основа целая
 const END=['어요','아요','었어요','았어요'];
 function bForms(s){const l=s.slice(-1);if(!l||!isH(l))return null;const d=dec(l),h=s.slice(0,-1),z=h+enc(d.l,d.v,0);
  const reg=END.map(e=>s+e);
  if(d.t===17)return {k:'b',reg,irr:[z+'워요',z+'웠어요',z+'와요',z+'왔어요'],ji:[z+'워지',z+'우지',z+'와지',z+'오지']};
  if(d.t===7){const r=h+enc(d.l,d.v,8);return {k:'d',reg,irr:END.map(e=>r+e),ji:[r+'지']};}
  if(d.t===19)return {k:'s',reg,irr:END.map(e=>z+e),ji:[z+'아지',z+'어지',z+'지']};
  return null;}
 const BN={b:['ㅂ-불규칙: перед 아/어 ㅂ → 우, 우 + 어 = 워: ','ㅂ'],d:['ㄷ-불규칙: перед гласной ㄷ → ㄹ: ','ㄷ'],s:['ㅅ-불규칙: перед гласной ㅅ выпадает: ','ㅅ']};
 // 합니다: -ㅂ니다 после гласной и ㄹ (ㄹ выпадает), -습니다 после согласной; ㅂ/ㄷ перед ними не меняются
 function hRule(a,c){const e=c.endsWith('니다')?'니다':c.endsWith('니까')?'니까':null;if(!e||a===c)return null;
  const pre=c.slice(0,-2),l=pre.slice(-1);if(!l||!isH(l))return null;const N='-ㅂ'+e+' — после гласной и ㄹ (ㄹ выпадает: 압니다), -습'+e+' — после согласной: '+c+'.';
  if(l==='습'){const s=pre.slice(0,-1),q=s.slice(-1);if(!q||!isH(q))return null;const d=dec(q),z=s.slice(0,-1)+enc(d.l,d.v,0);
   if(d.t===17&&[z+'웁'+e,z+'우습'+e,z+'워습'+e].includes(a))return {kind:'h',note:'Перед согласным окончанием ㅂ на месте: '+c+'.'};
   if(d.t===7&&[z+enc(d.l,d.v,8).slice(-1)+'습'+e,s.slice(0,-1)+enc(d.l,d.v,8)+'습'+e,z+'릅'+e].includes(a))return {kind:'h',note:'Перед согласным окончанием ㄷ на месте: '+c+'.'};
   return null;}
  const d=dec(l);if(d.t!==17)return null;const z=pre.slice(0,-1)+enc(d.l,d.v,0),zl=pre.slice(0,-1)+enc(d.l,d.v,8);
  if([z+'습'+e,z+'읍'+e,zl+'습'+e,zl+'읍'+e].includes(a))return {kind:'h',note:N};
  return null;}
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
 let PTC={};
 function setLex(D){PTC={};const n=new Set(['뭐','무엇','누구','이것','그것','저것','여기','거기','저기']),f={},st={};
  for(const w of D.words||[]){const k=w.ko;if(/\s/.test(k))continue;
   if(['noun','pron','counter','time','num','question'].includes(w.cat))n.add(k);
   if(w.cat==='verb'&&k.endsWith('하다')&&k.length>2)n.add(k.slice(0,-2));
   if((w.cat==='verb'||w.cat==='adj')&&w.forms&&k.endsWith('다')&&!/\//.test(w.forms.pres||'/')){const sm=k.slice(0,-1);PTC[sm]=w.cat;
    st[sm]={pres:w.forms.pres,past:w.forms.past};f[w.forms.pres]={s:sm,p:0};if(w.forms.past)f[w.forms.past]={s:sm,p:1};}}
  const fu={},se={},ps={},re={},as={},ni={},my={},ay={},bo={},ad={};for(const [sm,e] of Object.entries(st)){const t=futTok(sm,e.pres);if(t)fu[t]=sm;const q=seTok(sm,e.pres);if(q)se[q]=sm;const p2=psTok(sm,e.pres);if(p2)ps[p2]=sm;const r2=reTok(sm,e.pres);if(r2)re[r2]=sm;const a2=asTok(sm,e.pres);if(a2&&!as[a2])as[a2]=sm;const n2=niTok(sm,e.pres);if(n2&&!ni[n2])ni[n2]=sm;const m2=myTok(sm,e.pres);if(m2&&!my[m2])my[m2]=sm;const y2=asTok(sm,e.pres);if(y2){const yk=y2.slice(0,-1)+'야',bk=y2.slice(0,-1);if(!ay[yk])ay[yk]=sm;if(!bo[bk])bo[bk]=sm;if(!ad[bk+'도'])ad[bk+'도']=sm;}const n3=String(e.past||'');if(n3.endsWith('어요')&&!ni[n3.slice(0,-2)+'으니까'])ni[n3.slice(0,-2)+'으니까']=sm;}
  const pt={};for(const [sm,cat] of Object.entries(PTC)){const e=st[sm];if(!e)continue;for(const [tk,kd] of ptToks(sm,e.pres,cat))(pt[tk]=pt[tk]||[]).push({s:sm,k:kd,cat});}
  for(const k in pt)pt[k].sort((x,y)=>(dec(y.s.slice(-1)).t===8)-(dec(x.s.slice(-1)).t===8));
  LEX={nouns:n,form:f,stem:st,fut:fu,se,ps,re,as,ni,my,ay,bo,ad,pt};}
 // -(으)세요: форма основы
 function seTok(s,p){const l=s.slice(-1);if(!l||!isH(l))return null;const d=dec(l),b=s.slice(0,-1),irr=!String(p||'').startsWith(s);
  if(d.t===0)return s+'세요';if(d.t===8)return b+enc(d.l,d.v,0)+'세요';
  if(irr&&d.t===17)return b+enc(d.l,d.v,0)+'우세요';if(irr&&d.t===7)return b+enc(d.l,d.v,8)+'으세요';if(irr&&d.t===19)return b+enc(d.l,d.v,0)+'으세요';
  return s+'으세요';}
 function sRule(a,c){const s=LEX.se&&LEX.se[c];if(!s||a===c)return null;const d=dec(s.slice(-1)),b=s.slice(0,-1);
  const W=[s+'세요',s+'으세요',b+enc(d.l,d.v,0)+'으세요',b+enc(d.l,d.v,8)+'세요'];if(!W.includes(a))return null;
  const N=d.t===0?'После гласной — -세요: ':d.t===8?'Основа на ㄹ: ㄹ выпадает — ':d.t===17?'ㅂ-불규칙: ㅂ → 우 — ':d.t===7?'ㄷ-불규칙: ㄷ → ㄹ — ':d.t===19?'ㅅ-불규칙: ㅅ выпадает — ':'После согласной — -으세요: ';
  return {kind:'se',note:N+c+'.'};}
 // -(으)ㅂ시다: форма основы
 function psTok(s,p){const l=s.slice(-1);if(!l||!isH(l))return null;const d=dec(l),b=s.slice(0,-1),irr=!String(p||'').startsWith(s);
  if(d.t===0||d.t===8)return b+enc(d.l,d.v,17)+'시다';
  if(irr&&d.t===17)return b+enc(d.l,d.v,0)+'웁시다';if(irr&&d.t===7)return b+enc(d.l,d.v,8)+'읍시다';if(irr&&d.t===19)return b+enc(d.l,d.v,0)+'읍시다';
  return s+'읍시다';}
 function psRule(a,c){const s=LEX.ps&&LEX.ps[c];if(!s||a===c)return null;const d=dec(s.slice(-1)),b=s.slice(0,-1);
  const W=[s+'읍시다',s+'습시다',b+enc(d.l,d.v,17)+'시다',b+enc(d.l,d.v,0)+'읍시다',b+enc(d.l,d.v,8)+'읍시다',b+enc(d.l,d.v,0)+'웁시다',b+enc(d.l,d.v,8)+'습시다'];if(!W.includes(a))return null;
  const irr=!c.startsWith(s);const N=d.t===0?'После гласной — -ㅂ시다: ':d.t===8?'Основа на ㄹ: ㄹ выпадает — ':irr&&d.t===17?'ㅂ-불규칙: ㅂ → 우 — ':irr&&d.t===7?'ㄷ-불규칙: ㄷ → ㄹ — ':irr&&d.t===19?'ㅅ-불규칙: ㅅ выпадает — ':a===s+'습시다'?'После согласной — -읍시다 (не 습시다): ':s+'다 — правильная основа, не меняется: ';
  return {kind:'ps',note:N+c+'.'};}
 // -(으)러: форма основы (ㄹ остаётся)
 function reTok(s,p){const l=s.slice(-1);if(!l||!isH(l))return null;const d=dec(l),b=s.slice(0,-1),irr=!String(p||'').startsWith(s);
  if(d.t===0||d.t===8)return s+'러';
  if(irr&&d.t===17)return b+enc(d.l,d.v,0)+'우러';if(irr&&d.t===7)return b+enc(d.l,d.v,8)+'으러';if(irr&&d.t===19)return b+enc(d.l,d.v,0)+'으러';
  return s+'으러';}
 function reRule(a,c){const s=LEX.re&&LEX.re[c];if(!s||a===c)return null;const d=dec(s.slice(-1)),b=s.slice(0,-1);
  const W=[s+'으러',s+'러',b+enc(d.l,d.v,0)+'러',b+enc(d.l,d.v,0)+'으러',b+enc(d.l,d.v,8)+'으러',b+enc(d.l,d.v,0)+'우러'];if(!W.includes(a))return null;
  const irr=!c.startsWith(s);const N=d.t===0?'После гласной — -러: ':d.t===8?'Основа на ㄹ — сразу -러, ㄹ остаётся: ':irr&&d.t===17?'ㅂ-불규칙: ㅂ → 우 — ':irr&&d.t===7?'ㄷ-불규칙: ㄷ → ㄹ — ':irr&&d.t===19?'ㅅ-불규칙: ㅅ выпадает — ':a===s+'러'?'После согласной — -으러: ':s+'다 — правильная основа, не меняется: ';
  return {kind:'re',note:N+c+'.'};}
 // -고: основа без изменений; существительное — 이고
 function goRule(a,c){if(!c.endsWith('고')||a===c)return null;
  if(c.endsWith('이고')&&a===c.slice(0,-2)+'고'&&LEX.nouns.has(c.slice(0,-2)))return {kind:'go',note:'После согласной — 이고: '+c+'.'};
  const s=c.slice(0,-1),e=LEX.stem[s];if(!e)return null;const d=dec(s.slice(-1)),b=s.slice(0,-1),ps=String(e.pres||'').slice(0,-1);
  const W=[s+'으고',ps+'고',b+enc(d.l,d.v,0)+'고',b+enc(d.l,d.v,8)+'고',b+enc(d.l,d.v,0)+'우고'];if(!W.includes(a))return null;
  return {kind:'go',note:'-고 — прямо к основе, без изменений (неправильные основы тоже целые): '+c+'.'};}
 // -지만: основа без изменений; существительное — 이지만
 function jmRule(a,c){if(!c.endsWith('지만')||a===c)return null;
  if(c.endsWith('이지만')&&a===c.slice(0,-3)+'지만'&&LEX.nouns.has(c.slice(0,-3)))return {kind:'jm',note:'После согласной — 이지만: '+c+'.'};
  const s=c.slice(0,-2),e=LEX.stem[s];if(!e)return null;const d=dec(s.slice(-1)),b=s.slice(0,-1),ps=String(e.pres||'').slice(0,-1);
  const W=[s+'으지만',ps+'지만',b+enc(d.l,d.v,0)+'지만',b+enc(d.l,d.v,8)+'지만',b+enc(d.l,d.v,0)+'우지만'];if(!W.includes(a))return null;
  return {kind:'jm',note:'-지만 — прямо к основе, без изменений (неправильные основы тоже целые): '+c+'.'};}
 // -아서/어서: 해요-форма без 요 + 서; время не ставится; существительное — 이라서/라서
 function asTok(s,p){p=String(p||'');return p.endsWith('요')&&!p.endsWith('에요')?p.slice(0,-1)+'서':null;}
 function asRule(a,c){if(!c.endsWith('서')||a===c)return null;
  if(c.endsWith('이라서')&&a===c.slice(0,-3)+'라서'&&LEX.nouns.has(c.slice(0,-3)))return {kind:'as',note:'После согласной — 이라서: '+c+'.'};
  if(c.endsWith('라서')&&!c.endsWith('이라서')&&a===c.slice(0,-2)+'이라서'&&LEX.nouns.has(c.slice(0,-2)))return {kind:'as',note:'После гласной — 라서: '+c+'.'};
  const s=LEX.as&&LEX.as[c];if(!s)return null;const e=LEX.stem[s]||{},pa=String(e.past||'');
  if(pa.endsWith('요')&&a===pa.slice(0,-1)+'서')return {kind:'as',note:'-아서/어서 не берёт время — прошедшее только в конце фразы: '+c+'.'};
  const d=dec(s.slice(-1)),b=s.slice(0,-1),V=d.v,ok=new Set();
  if(d.t===0&&s.endsWith('하'))ok.add(s+'여서');if(d.t===0&&[8,13,20].includes(V))ok.add(s+(V===8?'아서':'어서'));
  const W=[s+'아서',s+'어서',s+'서',s+'으서',s+'여서',b+enc(d.l,d.v,0)+'어서',b+enc(d.l,d.v,0)+'아서',b+enc(d.l,d.v,0)+'워서'].filter(x=>x!==c&&!ok.has(x));
  if(!W.includes(a))return null;
  return {kind:'as',note:'-아서/어서 — 해요-форма без 요 + 서: '+(e.pres||'')+' → '+c+'.'};}
 // -(으)니까: форма основы (ㄹ выпадает, ㅂ → 우, ㄷ → ㄹ, ㅅ выпадает); прошедшее — 았/었으니까; существительное — 이니까/니까
 function niTok(s,p){const l=s.slice(-1);if(!l||!isH(l))return null;const d=dec(l),b=s.slice(0,-1),irr=!String(p||'').startsWith(s);
  if(d.t===0)return s+'니까';if(d.t===8)return b+enc(d.l,d.v,0)+'니까';
  if(irr&&d.t===17)return b+enc(d.l,d.v,0)+'우니까';if(irr&&d.t===7)return b+enc(d.l,d.v,8)+'으니까';if(irr&&d.t===19)return b+enc(d.l,d.v,0)+'으니까';
  return s+'으니까';}
 function niRule(a,c){if(!c.endsWith('니까')||a===c)return null;
  if(c.endsWith('이니까')&&a===c.slice(0,-3)+'니까'&&LEX.nouns.has(c.slice(0,-3)))return {kind:'ni',note:'После согласной — 이니까: '+c+'.'};
  if(!c.endsWith('이니까')&&a===c.slice(0,-2)+'이니까'&&LEX.nouns.has(c.slice(0,-2)))return {kind:'ni',note:'После гласной — 니까: '+c+'.'};
  const s=LEX.ni&&LEX.ni[c];if(!s)return null;const e=LEX.stem[s]||{};
  if(c.endsWith('으니까')&&String(e.past||'').slice(0,-2)===c.slice(0,-3)){if(a===c.slice(0,-3)+'니까')return {kind:'ni',note:'После прошедшего — 으니까: '+c+'.'};return null;}
  const d=dec(s.slice(-1)),b=s.slice(0,-1),pr=String(e.pres||'');
  const W=[s+'니까',s+'으니까',b+enc(d.l,d.v,0)+'니까',b+enc(d.l,d.v,0)+'으니까',b+enc(d.l,d.v,8)+'으니까',b+enc(d.l,d.v,0)+'우니까',pr.endsWith('요')?pr.slice(0,-1)+'니까':''].filter(x=>x&&x!==c);
  if(!W.includes(a))return null;const irr=!pr.startsWith(s);
  if(pr.endsWith('요')&&a===pr.slice(0,-1)+'니까')return {kind:'ni',note:'-(으)니까 — к основе, не к 해요-форме: '+c+'.'};
  const N=d.t===0?'После гласной — -니까: ':d.t===8?'Основа на ㄹ: ㄹ выпадает — ':irr&&d.t===17?'ㅂ-불규칙: ㅂ → 우 — ':irr&&d.t===7?'ㄷ-불규칙: ㄷ → ㄹ — ':irr&&d.t===19?'ㅅ-불규칙: ㅅ выпадает — ':'После согласной — -으니까: ';
  return {kind:'ni',note:N+c+'.'};}
 // -(으)면: ㄹ остаётся (멀면), ㅂ → 우면, ㄷ → ㄹ으면, ㅅ выпадает; существительное — 이면/면
 function myTok(s,p){const l=s.slice(-1);if(!l||!isH(l))return null;const d=dec(l),b=s.slice(0,-1),irr=!String(p||'').startsWith(s);
  if(d.t===0||d.t===8)return s+'면';
  if(irr&&d.t===17)return b+enc(d.l,d.v,0)+'우면';if(irr&&d.t===7)return b+enc(d.l,d.v,8)+'으면';if(irr&&d.t===19)return b+enc(d.l,d.v,0)+'으면';
  return s+'으면';}
 function myRule(a,c){if(!c.endsWith('면')||a===c)return null;
  if(c.endsWith('이면')&&a===c.slice(0,-2)+'면'&&LEX.nouns.has(c.slice(0,-2)))return {kind:'my',note:'После согласной — 이면: '+c+'.'};
  if(!c.endsWith('이면')&&a===c.slice(0,-1)+'이면'&&LEX.nouns.has(c.slice(0,-1)))return {kind:'my',note:'После гласной — 면: '+c+'.'};
  const s=LEX.my&&LEX.my[c];if(!s)return null;const e=LEX.stem[s]||{},pr=String(e.pres||'');const d=dec(s.slice(-1)),b=s.slice(0,-1);
  const W=[s+'면',s+'으면',b+enc(d.l,d.v,0)+'면',b+enc(d.l,d.v,0)+'으면',b+enc(d.l,d.v,8)+'으면',b+enc(d.l,d.v,0)+'우면',pr.endsWith('요')?pr.slice(0,-1)+'면':''].filter(x=>x&&x!==c);
  if(!W.includes(a))return null;
  if(pr.endsWith('요')&&a===pr.slice(0,-1)+'면')return {kind:'my',note:'-(으)면 — к основе, не к 해요-форме: '+c+'.'};
  const irr=!pr.startsWith(s);
  const N=d.t===0?'После гласной — -면: ':d.t===8?'Основа на ㄹ: ㄹ остаётся, сразу -면 — ':irr&&d.t===17?'ㅂ-불규칙: ㅂ → 우 — ':irr&&d.t===7?'ㄷ-불규칙: ㄷ → ㄹ — ':irr&&d.t===19?'ㅅ-불규칙: ㅅ выпадает — ':'После согласной — -으면: ';
  return {kind:'my',note:N+c+'.'};}
 // (으)로: после гласной и ㄹ — 로, после остальных согласных — 으로
 function roRule(a,c){if(!c.endsWith('로')||a===c)return null;
  if(c.endsWith('으로')&&a===c.slice(0,-2)+'로'&&LEX.nouns.has(c.slice(0,-2)))return {kind:'ro',note:'После согласной — 으로: '+c+'.'};
  if(!c.endsWith('으로')&&a===c.slice(0,-1)+'으로'){const n=c.slice(0,-1);if(!LEX.nouns.has(n))return null;const l=n.slice(-1);
   return {kind:'ro',note:(isH(l)&&dec(l).t===8?'После ㄹ — просто 로: ':'После гласной — 로: ')+c+'.'};}
  return null;}
 // -아야/어야 되다, -아/어 보다: 해요-форма без 요 (+ 야); 되요 → 돼요
 function haeW(s,c,suf){const d=dec(s.slice(-1)),b=s.slice(0,-1),V=d.v,ok=new Set();
  if(d.t===0&&s.endsWith('하'))ok.add(s+'여'+suf);if(d.t===0&&[8,13,20].includes(V))ok.add(s+(V===8?'아':'어')+suf);
  return [s+'아'+suf,s+'어'+suf,s+suf,s+'으'+suf,s+'여'+suf,b+enc(d.l,d.v,0)+'어'+suf,b+enc(d.l,d.v,0)+'아'+suf,b+enc(d.l,d.v,0)+'워'+suf].filter(x=>x!==c&&!ok.has(x));}
 function ayRule(a,c){if(!c.endsWith('야')||a===c)return null;const s=LEX.ay&&LEX.ay[c];if(!s)return null;const e=LEX.stem[s]||{};
  if(!haeW(s,c,'야').includes(a))return null;
  return {kind:'ay',note:'-아야/어야 — 해요-форма без 요 + 야: '+(e.pres||'')+' → '+c+'.'};}
 function boRule(a,c){const s=LEX.bo&&LEX.bo[c];if(!s||a===c)return null;const e=LEX.stem[s]||{};
  if(!haeW(s,c,'').concat([s+'고']).includes(a))return null;
  return {kind:'bo',note:'Перед 보다 / 주다 — 해요-форма без 요: '+(e.pres||'')+' → '+c+'.'};}
 function adRule(a,c){if(!c.endsWith('도')||a===c)return null;const s=LEX.ad&&LEX.ad[c];if(!s)return null;const e=LEX.stem[s]||{};
  if(!haeW(s,c,'도').includes(a))return null;
  return {kind:'ad',note:'-아도/어도 — 해요-форма без 요 + 도: '+(e.pres||'')+' → '+c+'.'};}
 function dwRule(a,c){const M={'돼요':['되요'],'됐어요':['됬어요'],'돼서':['되서'],'돼':['되']};
  if(M[c]&&M[c].includes(a))return {kind:'dw',note:'되어 сливается в 돼: '+c+' (не '+a+').'};return null;}
 // -(으)ㄴ/는 (определение): 형용사 -(으)ㄴ (있다/없다 — 는), глагол наст. -는, прош. -(으)ㄴ
 function ptN(s,p){const l=s.slice(-1);if(!l||!isH(l))return null;const d=dec(l),b=s.slice(0,-1),irr=!String(p||'').startsWith(s);
  if(d.t===0)return b+enc(d.l,d.v,4);if(d.t===8)return b+enc(d.l,d.v,4);
  if(irr&&d.t===17)return b+enc(d.l,d.v,0)+'운';if(irr&&d.t===7)return b+enc(d.l,d.v,8)+'은';if(irr&&d.t===19)return b+enc(d.l,d.v,0)+'은';
  return s+'은';}
 function ptNeun(s){const l=s.slice(-1);if(!l||!isH(l))return null;const d=dec(l);if(d.t===8)return s.slice(0,-1)+enc(d.l,d.v,0)+'는';return s+'는';}
 function ptToks(s,p,cat){if(/(있|없)$/.test(s))return [[s+'는','an']];
  if(cat==='adj'){const t=ptN(s,p);return t?[[t,'adj']]:[];}
  const a=ptNeun(s),b=ptN(s,p);return [a?[a,'pres']:null,b?[b,'past']:null].filter(Boolean);}
 function ptRule(a,c){const E=LEX.pt&&LEX.pt[c];if(!E||a===c)return null;for(const e of E){const r=ptOne(a,c,e);if(r)return r;}return null;}
 // -기 (-기 전에): прямо к основе
 function kiRule(a,c){if(!c.endsWith('기')||a===c)return null;const s=c.slice(0,-1),e=LEX.stem[s];if(!e)return null;const d=dec(s.slice(-1)),pr=String(e.pres||''),pa=String(e.past||'');
  const W=[s+'으기',pr.endsWith('요')?pr.slice(0,-1)+'기':'',pa.endsWith('어요')?pa.slice(0,-2)+'기':'',s.slice(0,-1)+enc(d.l,d.v,8)+'기'].filter(x=>x&&x!==c);
  if(!W.includes(a))return null;
  if(pa.endsWith('어요')&&a===pa.slice(0,-2)+'기')return {kind:'ki',note:'Перед -기 전에 время не ставится: '+c+'.'};
  return {kind:'ki',note:'-기 — прямо к основе, без изменений: '+c+'.'};}
 function pfRule(a,c){const s=LEX.fut&&LEX.fut[c];if(!s||a===c)return null;const st=LEX.stem[s]||{};
  const n1=ptNeun(s),n2=ptN(s,st.pres);if(a!==n1&&a!==n2)return null;
  return {kind:'pt',note:'Нужна форма -(으)ㄹ (перед 때; предстоящее, «чтобы …»): '+c+'; '+a+' — '+(a===n1&&PTC[s]!=='adj'?'сейчас, обычно':'прошедшее / признак')+'.'};}
 function ptOne(a,c,e){const s=e.s,d=dec(s.slice(-1)),b=s.slice(0,-1),st=LEX.stem[s]||{};
  const nN=ptN(s,st.pres),nNeun=ptNeun(s);
  if(e.k==='adj'&&a===s+'는')return {kind:'pt',note:'형용사 перед существительным — -(으)ㄴ, не -는: '+c+'.'};
  if(e.k==='an'&&(a===s+'은'||a===b+enc(d.l,d.v,4)))return {kind:'pt',note:'있다/없다 (맛있다, 재미있다…) — -는: '+c+'.'};
  if(e.k==='pres'&&a===nN)return {kind:'pt',note:'Сейчас, обычно — -는: '+c+'; '+nN+' — прошедшее.'};
  if(e.k==='past'&&LEX.fut){const fu=Object.keys(LEX.fut).find(k=>LEX.fut[k]===s);if(fu&&a===fu)return {kind:'pt',note:'Прошедшее (и перед 후에) — -(으)ㄴ: '+c+'; '+fu+' — будущее.'};}
  if(e.k==='past'&&a===nNeun)return {kind:'pt',note:'Прошедшее — -(으)ㄴ: '+c+'; '+nNeun+' — сейчас, обычно.'};
  const W=[s+'은',s+'는',s+'ㄴ',b+enc(d.l,d.v,0)+'은',b+enc(d.l,d.v,0)+'는',b+enc(d.l,d.v,8)+'는',b+enc(d.l,d.v,0)+'운',s+'운',String(st.pres||'').slice(0,-1)+'ㄴ'].filter(x=>x!==c);
  if(!W.includes(a))return null;const irr=!String(st.pres||'').startsWith(s);
  const N=d.t===8?'Основа на ㄹ: ㄹ выпадает — ':irr&&d.t===17?'ㅂ-불규칙: ㅂ → 우 — ':irr&&d.t===7?'ㄷ-불규칙: ㄷ → ㄹ — ':irr&&d.t===19?'ㅅ-불규칙: ㅅ выпадает — ':d.t===0?'После гласной — ㄴ / 는: ':'После согласной — 은 / 는: ';
  return {kind:'pt',note:N+c+'.'};}
 // -(으)ㄹ 거예요: форма перед 거예요
 function futTok(s,p){const l=s.slice(-1);if(!l||!isH(l))return null;const d=dec(l),b=s.slice(0,-1),irr=!String(p||'').startsWith(s);
  if(d.t===0)return b+enc(d.l,d.v,8);if(d.t===8)return s;
  if(irr&&d.t===17)return b+enc(d.l,d.v,0)+'울';if(irr&&d.t===7)return b+enc(d.l,d.v,8)+'을';if(irr&&d.t===19)return b+enc(d.l,d.v,0)+'을';
  return s+'을';}
 // -(으)ㄹ게요 / -(으)ㄹ래요: форма основы как у 거예요; запись 게요
 function gRule(a,c){for(const suf of ['게요','래요','까요']){if(!c.endsWith(suf)||c.length<3)continue;const pre=c.slice(0,-2);
   {const q=a.slice(0,-2),s=LEX.fut&&LEX.fut[pre];if(a.endsWith(suf)&&s&&q===s&&q!==pre)return {kind:'fut',note:'Перед -'+suf+' основа принимает -(으)ㄹ: '+c+'.'};}
   if(suf==='게요'&&a===pre+'께요')return {kind:'fut',note:'Пишется 게요 (читается [께요]): '+c+'.'};
   if(a.endsWith(suf)){const r=fRule(a.slice(0,-2),pre);if(r)return {kind:'fut',note:r.note.replace(/ \(как в .*\)\.$/,'.').replace(pre+'.',c+'.')};}}
  return null;}
 function fRule(a,c){
  if(/^거예요/.test(c)&&/^(거에요|꺼예요|꺼에요)/.test(a))return {kind:'fut',note:'Пишется 거예요 (читается [꺼예요]).'};
  const s=LEX.fut&&LEX.fut[c];if(!s||a===c)return null;const l=s.slice(-1),d=dec(l),b=s.slice(0,-1);
  const W=[s+'을',s+'ㄹ',b+enc(d.l,d.v,0)+'올',b+enc(d.l,d.v,0)+'을',b+enc(d.l,d.v,8)+'을',s].filter(x=>x!==c);if(!W.includes(a))return null;
  if(a===s)return {kind:'fut',note:'Основа принимает -(으)ㄹ: '+c+' (как в '+c+' 거예요, '+c+' 수 있어요).'};
  const N=d.t===0?'После гласной — -ㄹ: ':d.t===8?'Основа на ㄹ — окончание сразу, без 을: ':d.t===17?'ㅂ-불규칙: перед -을 ㅂ → 우: ':d.t===7?'ㄷ-불규칙: перед -을 ㄷ → ㄹ: ':d.t===19?'ㅅ-불규칙: ㅅ выпадает: ':'После согласной — -을: ';
  return {kind:'fut',note:N+c+' (как в '+c+' 거예요, '+c+' 수 있어요).'};}
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
  T=o.filter(t=>t!=='저는'&&t!=='나는').map(t=>{if(t==='저의')return '제';if(t==='나의')return '내';const m=t.match(/^(.+)한테(도|만)?$/);if(m&&LEX.nouns.has(m[1]))return m[1]+'에게'+(m[2]||'');return t;}).map(t=>{if(t.endsWith('의')&&t.length>1&&!LEX.nouns.has(t)&&LEX.nouns.has(t.slice(0,-1)))return t.slice(0,-1);return t;}).map((t,k,A)=>/^(거예요|거에요|겁니다|겁니까|꺼예요)/.test(A[k+1]||'')?t:stripP(t));
  const r=[];for(let k=0;k<T.length;k++){if(T[k]==='어디에'){r.push('어디');continue;}r.push(T[k]);}
  // 하다-составной без пробела и с 안/못 между: 운동 못 해요 — норма; 못 운동해요 не трогаем
  return r.join(' ');}
 /* ---- главная ---- */
 // item: {ko, alt[], traps[{a,why}]}; ответ пользователя

 // 반말: эталон в 반말 (ни одно слово не кончается на 요), ответ отличается только вежливостью
 const BAN1={'나는':'저는','나도':'저도','나를':'저를','나만':'저만','내가':'제가','내':'제','나한테':'저한테','나':'저','나하고':'저하고','나보다':'저보다','나처럼':'저처럼','우리':'저희'};
 function banRule(a,x){const A=a.split(' '),X=x.split(' ');if(A.length!==X.length)return null;if(X.some(t=>/요$/.test(t)))return null;
  let n=0,yo=0,pr=0;for(let i=0;i<X.length;i++){const p=A[i],q=X[i];if(p===q)continue;
   if(q.endsWith('이야')&&p===q.slice(0,-2)+'야'&&n===0)return 'После согласной — 이야: '+q+'.';
   if(q.endsWith('야')&&!q.endsWith('이야')&&p===q.slice(0,-1)+'이야'&&n===0)return 'После гласной — 야: '+q+'.';
   if(p===q+'요'||(q.endsWith('이야')&&p===q.slice(0,-2)+'이에요')||(q.endsWith('야')&&!q.endsWith('이야')&&p===q.slice(0,-1)+'예요')||(q.endsWith('줘')&&p===q.slice(0,-1)+'주세요')||(q.endsWith('아니야')&&p===q.slice(0,-3)+'아니에요')){n++;yo++;continue;}
   if(BAN1[q]===p){n++;pr++;continue;}return null;}
  if(!n)return null;
  return (yo?'Здесь 반말 — без вежливого окончания (요, 이에요/예요, 주세요): '+x+'.':'')+(pr?(yo?' ':'')+'В 반말 — 나/내, не 저/제: '+x+'.':'');}
 function check(item,ans){
  const raw=String(ans||'').trim();
  if(!raw||raw==='-')return {v:'bad',kind:'empty',best:expand(item.ko)[0]||'',note:''};
  if(/[\[\]|]/.test(raw)){const b=expand(item.ko)[0]||'';return {v:'bad',kind:'brk',best:b,note:'Квадратные скобки и | в ответе не пишутся. Пиши один вариант целиком; необязательную часть можно взять в круглые скобки.',d:diff(norm(raw),b)};}
  if(/[()]/.test(raw)){
   // круглые скобки ученика: верно, только если верны оба варианта (с частью в скобках и без неё)
   const ok=(()=>{let d=0;for(const c of raw){if(c==='(')d++;else if(c===')'){d--;if(d<0)return false;}}return d===0;})();
   const U=ok?expand(raw).map(x=>x.replace(/\s+/g,' ').trim()).filter((x,i,a)=>x&&a.indexOf(x)===i):[];
   if(!ok||!U.length||U.length>8){const b=expand(item.ko)[0]||'';return {v:'bad',kind:'brk',best:b,note:'Скобки расставлены неверно. Необязательную часть бери в круглые скобки: 친구(의).',d:diff(norm(raw),b)};}
   const R=U.map(x=>({x,r:check(item,x)}));
   const bad=R.find(o=>o.r.v==='bad');
   if(bad)return {v:'bad',kind:'opt',best:bad.r.best,note:'Скобки значат «верно и с этим, и без этого». Здесь это не так — вариант «'+bad.x+'» неверен'+(bad.r.note?': '+bad.r.note:'.'),d:diff(norm(raw),bad.r.best)};
   const unk=R.find(o=>o.r.v==='unk');
   if(unk)return {v:'unk',kind:'unk',best:unk.r.best,note:'',d:diff(norm(raw),unk.r.best)};
   const ty=R.find(o=>o.r.v==='typo');
   if(ty)return {v:'typo',kind:ty.r.kind,best:ty.r.best,note:ty.r.note,d:ty.r.d};
   return {v:'ok',kind:'opt',best:R[0].r.best,note:'Верно: часть в скобках здесь необязательна.'};}
  const a=norm(raw);
  const V=[];for(const t of [item.ko,...(item.alt||[])])for(const x of expand(t))if(!V.includes(x))V.push(x);
  if(V.includes(a))return {v:'ok',kind:'exact',best:a};
  const an=nsp(a);
  for(const x of V)if(nsp(x)===an)return {v:'typo',kind:'space',best:x,note:'Только пробелы.'};
  for(const tr of item.traps||[])for(const x of expand(tr.a))if(nsp(x)===an){
   const best=V.slice().sort((p,q)=>lev(jamo(nsp(p)),jamo(an))-lev(jamo(nsp(q)),jamo(an)))[0];
   return {v:'bad',kind:'trap',best,note:tr.why,d:diff(a,best)};}
  // 반말: эталон без 요, ответ — вежливый (요, 이에요, 주세요, 저/제)
  for(const x of V){const r=banRule(a,x);if(r)return {v:'bad',kind:'ban',best:x,note:r,d:diff(a,x)};}
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