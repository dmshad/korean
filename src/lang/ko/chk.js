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
 const CO=(c,full)=>({kind:'co',ok:true,note:'Засчитано: после гласной связку обычно стягивают — '+c+'. Полное '+full+' звучит книжно.'});
 function tokRule(a,c){ // a — ответ, c — верный токен
  if(c.endsWith('요')&&a===c.slice(0,-1))return {kind:'yo',note:'Без 요 получается 반말 (фамильярно). В вежливой речи — '+c+'.'};
  if(LEX.pt&&LEX.pt[c]){const r=ptRule(a,c);if(r)return r;}
  {const DM={'들':'듣','걸':'걷','물':'묻'};const i=c.search(/[들걸물](어|었|으)/);if(i>=0&&a===c.slice(0,i)+DM[c[i]]+c.slice(i+1))return {kind:'dirr',note:'ㄷ-불규칙: перед гласной ㄷ → ㄹ — '+c+'.'};}
  if(c.endsWith('였어요')&&a===c.slice(0,-3)+'이었어요'&&c.length>3&&!hasB(c.slice(-4,-3)))return CO(c,a);
  let p=0;while(p<a.length&&p<c.length&&a[p]===c[p])p++;
  const sa=a.slice(p),sc=c.slice(p),stem=c.slice(0,p);
  for(const[pr,why]of PAIRS)if(pr.includes(sa)&&pr.includes(sc)&&sa!==sc){
   const last=stem.slice(-1);const tail=last?(' «'+stem+'» кончается на '+(hasB(last)?'согласную':'гласную')+'.'):'';
   return {kind:'allo',note:why+'.'+tail};}
  {const r=h2Rule(a,c)||xRule(a,c);if(r)return r;}
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

 // 합니다: вопрос/утверждение, невыпавшая ㄹ, -습니다 к 해요-форме, существительное + 습니다
 function h2Rule(a,c){if(a===c)return null;
  if(c.endsWith('니다')&&a===c.slice(0,-1)+'까')return {kind:'h',note:'-ㅂ니다/-습니다 — утверждение, -ㅂ니까/-습니까 — вопрос: '+c+'.'};
  if(c.endsWith('니까')&&a===c.slice(0,-1)+'다')return {kind:'h',note:'Это вопрос: -ㅂ니까/-습니까 — '+c+'.'};
  if((c.endsWith('니다')||c.endsWith('니까'))&&a.length===c.length&&a.slice(-2)===c.slice(-2)&&a.slice(0,-3)===c.slice(0,-3)){const x=c.slice(-3,-2),y=a.slice(-3,-2);
   if(isH(x)&&isH(y)){const dx=dec(x),dy=dec(y);if(dx.t===17&&dy.t===8&&dx.l===dy.l&&dx.v===dy.v)return {kind:'h',note:'ㄹ выпадает перед -ㅂ니다: '+c+'.'};}}
  if(/습니[다까]$/.test(a)&&LEX.form[a.slice(0,-3)+'요']&&!/습니[다까]$/.test(c))return {kind:'h',note:'-ㅂ니다/-습니다 присоединяется к основе, а не к 해요-форме: '+c+'.'};
  if(/입니[다까]$/.test(c)&&(a===c.slice(0,-3)+'습'+c.slice(-2)||a===c.slice(0,-3)+'이습'+c.slice(-2)))return {kind:'h',note:'После существительного — связка 입니다: '+c+'.'};
  return null;}

 // запись 래요/게요; 저는 вместо 제가; время у той же основы; -고 перед 싶다
 function xRule(a,c){
  if(c.endsWith('예요')&&!c.endsWith('이예요')&&a===c.slice(0,-2)+'에요')return {kind:'cop',note:'После гласной — 예요: '+c+'.'};
  {const f=LEX.form[c];if(f&&a!==c){const st=f.s;if(st.endsWith('르')&&[st+'어요',st+'아요',st+'었어요',st+'았어요'].includes(a))return {kind:'birr',note:'르-불규칙: '+st+'다 → '+c+'.'};
   const l=st.slice(-1),dl=isH(l)?dec(l):null;if(dl&&dl.v===18&&dl.t===0&&!st.endsWith('르')&&[st+'어요',st+'었어요',st+'아요',st+'았어요'].includes(a))return {kind:'birr',note:'ㅡ выпадает перед 아/어: '+st+'다 → '+c+'.'};}}
  if(c.endsWith('이에요')&&a===c.slice(0,-3)+'이예요')return {kind:'cop',note:'После согласной — 이에요 (не 이예요): '+c+'.'};
  if(/(드|주무|계)세요$/.test(c)&&a===c.replace(/세요$/,'시세요'))return {kind:'si',note:'-시- уже внутри слова: 드시다, 주무시다, 계시다 + 어요 → 드세요, 주무세요, 계세요. Второй 시 не нужен: '+c+'.'};
  if(c.endsWith('이세요')&&c.length>3&&a===c.slice(0,-3)+'세요'&&LEX.nouns.has(c.slice(0,-3)))return {kind:'cop',note:'После согласной — 이세요, после гласной — 세요: '+c+'.'};
  if(c.endsWith('지')&&LEX.stem[c.slice(0,-1)]){const s=c.slice(0,-1),d=dec(s.slice(-1));if(d.t===8&&a===s.slice(0,-1)+enc(d.l,d.v,0)+'지')return {kind:'se',note:'ㄹ выпадает только перед ㅅ, ㄴ, ㅂ (여세요, 엽시다). Перед -지 основа целая: '+c+'.'};}
  if(c.endsWith('래요')&&a===c.slice(0,-2)+'레요')return {kind:'sp',note:'Пишется 래요 (ㅐ): '+c+'.'};
  if(c.endsWith('래요?')&&a===c.slice(0,-3)+'레요?')return {kind:'sp',note:'Пишется 래요 (ㅐ): '+c+'.'};
  if(c.endsWith('게요')&&a===c.slice(0,-2)+'개요')return {kind:'sp',note:'Пишется 게요 (ㅔ): '+c+'.'};
  if(c==='제가'&&a==='저는')return {kind:'jega',note:'На вопрос «кто?» отвечают 제가: 가 выделяет, кто именно (저는 — «а я…»).'};
  if(c.endsWith('고')&&LEX.form[a+'요']&&LEX.form[a+'요'].s===c.slice(0,-1)&&a!==c)return {kind:'go',note:'Перед 싶다 — основа + 고, не 해요-форма: '+c+'.'};
  if(/싶어요$|싶었어요$/.test(c)&&(a===c.replace(/싶어요$/,'싶어해요')||a===c.replace(/싶었어요$/,'싶어했어요')))return {kind:'sip',note:'О себе — '+c+'; 싶어해요 говорят о другом человеке.'};
  if(/싶어해요$|싶어했어요$/.test(c)&&(a===c.replace(/싶어해요$/,'싶어요')||a===c.replace(/싶어했어요$/,'싶었어요')))return {kind:'sip',note:'О другом человеке — '+c+': 싶어요 говорят только о себе (и в вопросе собеседнику).'};
  const fa=LEX.form[a],fc=LEX.form[c];if(fa&&fc&&fa.s===fc.s&&fa.p!==fc.p)return {kind:'tense',note:(fc.p?'Нужно прошедшее время: ':'Нужно настоящее время (состояние сейчас): ')+c+'.'};
  return null;}
 function bRule(a,c){
  if(c.endsWith('지')&&LEX.stem[c.slice(0,-1)]){const b=bForms(c.slice(0,-1));if(b&&b.ji.includes(a))return {kind:'birr',note:'Перед -지 основа не меняется: '+c+'.'};return null;}
  const f=LEX.form[c];if(!f)return null;const s=f.s,b=bForms(s);
  if(!b){if(c.startsWith(s)&&[s+'워요',s+'웠어요'].includes(a)&&a!==c)return {kind:'breg',note:s+'다 — правильная основа, перед 아/어 не меняется: '+c+'.'};return null;}
  const irr=!c.startsWith(s);
  if(irr&&b.reg.includes(a))return {kind:'birr',note:(s==='돕'?'돕다 — особый: ㅂ → 오, 오 + 아 = 와: ':BN[b.k][0])+c+'.'};
  if(irr&&b.k==='b'&&b.irr.includes(a)&&a!==c){
   // та же форма основы, другое время — пояснение о времени, а не о 워/와
   const grp=x=>b.irr.indexOf(x)<2?'w':'a',past=x=>x.length>=3&&x.endsWith('어요')&&isH(x.slice(-3,-2))&&dec(x.slice(-3,-2)).t===20;
   if(grp(a)===grp(c)&&past(a)!==past(c))return {kind:'tense',note:(past(c)?'Нужно прошедшее время: ':'Нужно настоящее время: ')+c+'.'};
   return {kind:'birr',note:(s==='돕'?'돕다 — 와, не 워: ':'워 — после любой гласной (кроме 돕다): ')+c+'.'};}
  if(irr&&b.k==='b'){const d=dec(s.slice(-1)),z=s.slice(0,-1)+enc(d.l,d.v,0);
   // гибриды: ㅂ оставлен + 워 (쉽워요), пропущен 우 (쉬어요, 도아요), несокращённое 우어 (추우어요)
   const H=[s+'워요',s+'웠어요',s+'와요',s+'왔어요',z+'어요',z+'었어요',z+'아요',z+'았어요',z+'우어요',z+'우었어요',z+'오아요',z+'오았어요'];
   if(H.includes(a)&&a!==c)return {kind:'birr',note:(s==='돕'?'돕다 — особый: ㅂ → 오, 오 + 아 = 와: ':BN.b[0])+c+'.'};}
  if(!irr&&(b.irr.includes(a)||[s+'워요',s+'웠어요',s+'와요',s+'왔어요'].includes(a)))return {kind:'breg',note:s+'다 — правильная основа, '+BN[b.k][1]+' не меняется: '+c+'.'};
  return null;}
 function rules(ans,v){const A=ans.split(' '),C=v.split(' ');if(A.length!==C.length)return null;
  const diff=[];for(let k=0;k<A.length;k++)if(A[k]!==C[k])diff.push(k);
  if(!diff.length)return null;const out=[];
  for(const k of diff){const r=tokRule(A[k],C[k]);if(!r)return null;out.push(r);}
  return {kind:out[0].kind,ok:out.every(r=>r.ok),note:[...new Set(out.map(r=>r.note))].join(' ')};}
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
   if(w.cat==='verb'&&k.endsWith('하다')&&k.length>2&&!/[아어워와여]$/.test(k.slice(0,-2)))n.add(k.slice(0,-2));
   if((w.cat==='verb'||w.cat==='adj')&&w.forms&&k.endsWith('다')&&!/\//.test(w.forms.pres||'/')){const sm=k.slice(0,-1);PTC[sm]=w.cat;
    st[sm]={pres:w.forms.pres,past:w.forms.past};f[w.forms.pres]={s:sm,p:0};if(w.forms.past)f[w.forms.past]={s:sm,p:1};}}
  const fu={},se={},ps={},re={},as={},ni={},my={},ay={},bo={},ad={};for(const [sm,e] of Object.entries(st)){const t=futTok(sm,e.pres);if(t)fu[t]=sm;const q=seTok(sm,e.pres);if(q)se[q]=sm;const p2=psTok(sm,e.pres);if(p2)ps[p2]=sm;const r2=reTok(sm,e.pres);if(r2)re[r2]=sm;const a2=asTok(sm,e.pres);if(a2&&!as[a2])as[a2]=sm;const n2=niTok(sm,e.pres);if(n2&&!ni[n2])ni[n2]=sm;const m2=myTok(sm,e.pres);if(m2&&!my[m2])my[m2]=sm;const y2=asTok(sm,e.pres);if(y2){const yk=y2.slice(0,-1)+'야',bk=y2.slice(0,-1);if(!ay[yk])ay[yk]=sm;if(!bo[bk])bo[bk]=sm;if(!ad[bk+'도'])ad[bk+'도']=sm;}const n3=String(e.past||'');if(n3.endsWith('어요')&&!ni[n3.slice(0,-2)+'으니까'])ni[n3.slice(0,-2)+'으니까']=sm;}
  const pt={};for(const [sm,cat] of Object.entries(PTC)){const e=st[sm];if(!e)continue;for(const [tk,kd] of ptToks(sm,e.pres,cat))(pt[tk]=pt[tk]||[]).push({s:sm,k:kd,cat});}
  for(const k in pt)pt[k].sort((x,y)=>(dec(y.s.slice(-1)).t===8)-(dec(x.s.slice(-1)).t===8));
  const pjm={};for(const [sm,e] of Object.entries(st)){const pa=String(e.past||'').replace(/(어요|아요)$/,'');if(pa&&pa!==sm)pjm[pa]=sm;}
  LEX={nouns:n,form:f,stem:st,fut:fu,se,ps,re,as,ni,my,ay,bo,ad,pt,pjm};}
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
  const W=[s+'으러',s+'러',b+enc(d.l,d.v,0)+'러',b+enc(d.l,d.v,0)+'으러',b+enc(d.l,d.v,8)+'으러',b+enc(d.l,d.v,0)+'우러',b+enc(d.l,d.v,8)+'러',String((LEX.stem[s]||{}).pres||'').replace(/요$/,'')+'러'].filter(x=>x!=='러'&&x!==c);if(!W.includes(a))return null;
  if(a===String((LEX.stem[s]||{}).pres||'').replace(/요$/,'')+'러')return {kind:'re',note:'-(으)러 ставят к основе, не к 해요-форме: '+c+'.'};
  const irr=!c.startsWith(s);const N=d.t===0?'После гласной — -러: ':d.t===8?'Основа на ㄹ — сразу -러, ㄹ остаётся: ':irr&&d.t===17?'ㅂ-불규칙: ㅂ → 우 — ':irr&&d.t===7?'ㄷ-불규칙: ㄷ → ㄹ — ':irr&&d.t===19?'ㅅ-불규칙: ㅅ выпадает — ':a===s+'러'?'После согласной — -으러: ':s+'다 — правильная основа, не меняется: ';
  return {kind:'re',note:N+c+'.'};}
 // -고: основа без изменений; существительное — 이고
 function goRule(a,c){if(!c.endsWith('고')||a===c)return null;
  if(c.endsWith('이고')&&a===c.slice(0,-2)+'고'&&LEX.nouns.has(c.slice(0,-2)))return {kind:'go',note:'После согласной — 이고: '+c+'.'};
  const s=c.slice(0,-1),e=LEX.stem[s];if(!e)return null;const d=dec(s.slice(-1)),b=s.slice(0,-1),ps=String(e.pres||'').slice(0,-1);
  const pa=String(e.past||'').replace(/(어요|아요)$/,'');if(pa&&a===pa+'고')return {kind:'go',note:'Действия одно за другим: -고 без времени, время — в последнем глаголе: '+c+'.'};
  if(a===String(e.pres||'')+'고')return {kind:'go',note:'-고 — прямо к основе, без 요: '+c+'.'};
  const W=[s+'으고',ps+'고',b+enc(d.l,d.v,0)+'고',b+enc(d.l,d.v,8)+'고',b+enc(d.l,d.v,0)+'우고'];if(!W.includes(a))return null;
  return {kind:'go',note:'-고 — прямо к основе, без изменений (неправильные основы тоже целые): '+c+'.'};}
 // -지만: основа без изменений; существительное — 이지만
 function jmRule(a,c){if(!c.endsWith('지만')||a===c)return null;
  if(c.endsWith('이지만')&&a===c.slice(0,-3)+'지만'&&LEX.nouns.has(c.slice(0,-3)))return {kind:'jm',note:'После согласной — 이지만: '+c+'.'};
  if(!c.endsWith('이지만')&&a===c.slice(0,-2)+'이지만'&&LEX.nouns.has(c.slice(0,-2)))return CO(c,a);
  {const nb=c.endsWith('이지만')?c.slice(0,-3):c.slice(0,-2);if(LEX.nouns.has(nb)&&(a===nb+'이에요지만'||a===nb+'예요지만'))return {kind:'jm',note:'-지만 — к основе, не к 해요-форме: '+c+'.'};}
  if(c.length>2&&isH(c.slice(-3,-2))&&dec(c.slice(-3,-2)).t===20&&a===c.slice(0,-2)+'고')return {kind:'jg',note:'«Но» — -지만: '+c+'. -고 — просто «и».'};
  if(c.endsWith('아니지만')&&a===c.slice(0,-2)+'에요지만')return {kind:'jm',note:'-지만 — к основе, не к 해요-форме: '+c+'.'};
  {const pp=LEX.pjm&&LEX.pjm[c.slice(0,-2)];if(pp&&a===pp+'지만')return {kind:'jm',note:'Прошлое — и в первой части: '+c+'.'};}
  const s=c.slice(0,-2),e=LEX.stem[s];if(!e)return null;const d=dec(s.slice(-1)),b=s.slice(0,-1),ps=String(e.pres||'').slice(0,-1);
  if(a===String(e.pres||'')+'지만')return {kind:'jm',note:'-지만 — к основе, не к 해요-форме: '+c+'.'};
  {const pa=String(e.past||'').replace(/(어요|아요)$/,'');if(pa&&a===pa+'지만')return {kind:'jm',note:'Здесь настоящее: '+c+'. '+a+' — о прошлом.'};}
  if(a===s+'고')return {kind:'jg',note:'«Но» — -지만: '+c+'. -고 — просто «и».'};
  const W=[s+'으지만',ps+'지만',b+enc(d.l,d.v,0)+'지만',b+enc(d.l,d.v,8)+'지만',b+enc(d.l,d.v,0)+'우지만'];if(!W.includes(a))return null;
  return {kind:'jm',note:'-지만 — прямо к основе, без изменений (неправильные основы тоже целые): '+c+'.'};}
 // -아서/어서: 해요-форма без 요 + 서; время не ставится; существительное — 이라서/라서
 function asTok(s,p){p=String(p||'');return p.endsWith('요')&&!p.endsWith('에요')?p.slice(0,-1)+'서':null;}
 function asRule(a,c){if(!c.endsWith('서')||a===c)return null;
  if(c.endsWith('이라서')&&a===c.slice(0,-3)+'라서'&&LEX.nouns.has(c.slice(0,-3)))return {kind:'as',note:'После согласной — 이라서: '+c+'.'};
  {const nb=c.endsWith('이라서')?c.slice(0,-3):c.endsWith('라서')?c.slice(0,-2):null;if(nb&&LEX.nouns.has(nb)&&(a===nb+'이에서'||a===nb+'예서'||a===nb+'에서'&&!c.endsWith('이라서')))return {kind:'as',note:'Существительное — (이)라서, не от 이에요: '+c+'.'};}
  if(c.endsWith('라서')&&!c.endsWith('이라서')&&a===c.slice(0,-2)+'이라서'&&LEX.nouns.has(c.slice(0,-2)))return CO(c,a);
  const s=LEX.as&&LEX.as[c];if(!s)return null;const e=LEX.stem[s]||{},pa=String(e.past||'');
  if(pa.endsWith('요')&&a===pa.slice(0,-1)+'서')return {kind:'as',note:'-아서/어서 не берёт время — прошедшее только в конце фразы: '+c+'.'};
  const d=dec(s.slice(-1)),b=s.slice(0,-1),V=d.v,ok=new Set();
  if(d.t===0&&s.endsWith('하'))ok.add(s+'여서');if(d.t===0&&[8,13,20].includes(V))ok.add(s+(V===8?'아서':'어서'));
  if(ok.has(a))return {kind:'as',ok:true,note:'Засчитано: нестянутая форма звучит книжно. В речи — '+c+'.'};
  if(a===s+'고')return {kind:'ag',note:'Причина или «и там / и с этим» — -아서/어서: '+c+'. -고 — просто «и».'};
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
  if(!c.endsWith('이니까')&&a===c.slice(0,-2)+'이니까'&&LEX.nouns.has(c.slice(0,-2)))return CO(c,a);
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
  if(!c.endsWith('이면')&&a===c.slice(0,-1)+'이면'&&LEX.nouns.has(c.slice(0,-1)))return CO(c,a);
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
 function gRule(a,c){if(/을까요$/.test(c)&&a===c.replace(/을까요$/,'으까요'))return {kind:'fut',note:'-을까요: ㄹ обязательно — '+c+'.'};if(/[ㄹ가-힣]까요$/.test(c)&&a===c.replace(/까요$/,'가요')&&hasB(c.slice(-3,-2)))return {kind:'fut',note:'Пишется 까요 (после ㄹ читается так же): '+c+'.'};for(const suf of ['게요','래요','까요']){if(!c.endsWith(suf)||c.length<3)continue;const pre=c.slice(0,-2);
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
   if(!LEX.nouns.has(st)||st==='번')continue;const need=hasB(st.slice(-1))?c:v;if(q===need)return st;}return t;}
 function canon(s){let T=s.split(' ').filter(Boolean);
  // длинное отрицание → короткое: 가지 못해요 → 못 가요
  const o=[];for(let k=0;k<T.length;k++){const t=T[k],n=T[k+1];
   if(t.endsWith('지')&&n&&/^(못했어요|못해요|않았어요|않아요)$/.test(n)){const sm=t.slice(0,-1),neg=n[0]==='못'?'못':'안',past=n==='못했어요'||n==='않았어요';
    if(sm.endsWith('하')&&sm.length>1&&LEX.nouns.has(sm.slice(0,-1))){o.push(sm.slice(0,-1),neg,past?'했어요':'해요');k++;continue;}
    const e=LEX.stem[sm];if(e){o.push(neg,past?e.past:e.pres);k++;continue;}}
   // 가지 않을래요 / 않을게요 / 않을까요 → 안 갈래요 / 안 갈게요 / 안 갈까요
   if(t.endsWith('지')&&n&&/^않을(래요|게요|까요)$/.test(n)){const sm=t.slice(0,-1),suf=n.slice(-2);
    if(sm.endsWith('하')&&sm.length>1&&LEX.nouns.has(sm.slice(0,-1))){o.push(sm.slice(0,-1),'안','할'+suf);k++;continue;}
    const e=LEX.stem[sm];if(e){const ft=futTok(sm,e.pres);if(ft){o.push('안',ft+suf);k++;continue;}}}
   // V-지 않으면 / 않으니까 / 않지만 / 않아서 → 안 V-(으)면 …; 못하면 … → 못 V-(으)면 …
   {const m=n&&t.endsWith('지')&&n.match(/^(않|못하|못해|못했)(으면|면|으니까|니까|지만|아서|서|았지만|지만|았으니까|으니까)$/);
    if(m){const sm=t.slice(0,-1),neg=m[1][0]==='못'?'못':'안',past=/았/.test(m[2])||m[1]==='못했',E=m[2].replace(/^(았|으)/,'');
     const mk=(stem,e)=>{if(!e)return null;const pr=e.pres,pa=String(e.past||'').replace(/(어요|아요)$/,'');
      if(past)return E==='지만'?pa+'지만':E==='니까'?pa+'으니까':null;
      return E==='면'?myTok(stem,pr):E==='니까'?niTok(stem,pr):E==='지만'?stem+'지만':E==='서'?asTok(stem,pr):null;};
     if(sm.endsWith('하')&&sm.length>1&&LEX.nouns.has(sm.slice(0,-1))){const f=mk('하',{pres:'해요',past:'했어요'});if(f){o.push(sm.slice(0,-1),neg,f);k++;continue;}}
     const f=mk(sm,LEX.stem[sm]);if(f){o.push(neg,f);k++;continue;}}}
   // V-지 않고 → 안 V-고; V-지 못하고 → 못 V-고
   if(t.endsWith('지')&&n&&/^(않고|못하고)$/.test(n)){const sm=t.slice(0,-1),neg=n[0]==='못'?'못':'안';
    if(sm.endsWith('하')&&sm.length>1&&LEX.nouns.has(sm.slice(0,-1))){o.push(sm.slice(0,-1),neg,'하고');k++;continue;}
    if(LEX.stem[sm]){o.push(neg,sm+'고');k++;continue;}}
   // -고 싶지 않아요 → 안 V-고 싶어요
   if(t.endsWith('고')&&n&&/^싶지$/.test(n)&&/^(않아요|않았어요|않습니다)$/.test(T[k+2]||'')){const m={'않아요':'싶어요','않았어요':'싶었어요','않습니다':'싶습니다'}[T[k+2]];
    if(t.endsWith('하고')&&t.length>2&&LEX.nouns.has(t.slice(0,-2))){o.push(t.slice(0,-2),'안','하고',m);k+=2;continue;}
    o.push('안',t,m);k+=2;continue;}
   // будущее: 가지 않을 거예요 → 안 갈 거예요
   if(t.endsWith('지')&&n&&/^(않을|못할)$/.test(n)&&/^(거|것|겁)/.test(T[k+2]||'')){const sm=t.slice(0,-1),neg=n[0]==='못'?'못':'안';
    if(sm.endsWith('하')&&sm.length>1&&LEX.nouns.has(sm.slice(0,-1))){o.push(sm.slice(0,-1),neg,'할');k++;continue;}
    const e=LEX.stem[sm];if(e){const ft=futTok(sm,e.pres);if(ft){o.push(neg,ft);k++;continue;}}}
   // 하다-глагол с 안/못 внутри: 운동하지… уже выше; короткое 운동을 못 해요 → частица снимется ниже
   o.push(t);}
  // 비/눈이 내리다 = 오다; 배(가) 고프다 = 배고프다, 목(이) 마르다, 배(가) 부르다
  for(let k=1;k<o.length;k++){if(!/^(비|눈)(가|이|는|은|도)?$/.test(o[k-1]))continue;const m=o[k].match(/^(내리|내려|내렸|내릴|내린)(.*)$/);if(m)o[k]={'내리':'오','내려':'와','내렸':'왔','내릴':'올','내린':'온'}[m[1]]+m[2];}
  for(let k=0;k<o.length-1;k++){const a=o[k],b=o[k+1];
   if(/^배(가)?$/.test(a)&&/^(고프|고파|고팠|고플|고픈|부르|불러|불렀|부를|부른)/.test(b)||/^목(이)?$/.test(a)&&/^(마르|말라|말랐|마를|마른)/.test(b)){o[k]=a[0]+b;o.splice(k+1,1);}}
  // 싶어 해요 = 싶어해요; 하지 않아요 после 싶어
  for(let k=0;k<o.length-1;k++)if(o[k]==='싶어'&&/^(해요|했어요|합니다|하지)$/.test(o[k+1])){o[k]='싶어'+o[k+1];o.splice(k+1,1);}
  const FUL={'뭘':'뭐를','것입니다':'겁니다','것입니까':'겁니까','것이에요':'거예요','것이에요?':'거예요','여기서':'여기에서','거기서':'거기에서','저기서':'저기에서','어디서':'어디에서','어젯밤에':'어젯밤','요즘에':'요즘','요즘에는':'요즘','여기에':'여기','거기에':'거기','저기에':'저기','작년에':'작년','작년에는':'작년','어젯밤에는':'어젯밤'};
  for(let k=0;k<o.length;k++)if(FUL[o[k]])o[k]=FUL[o[k]];
  for(let k=0;k<o.length;k++)if(o[k]==='함께')o[k]='같이';
  // 좀 перед просьбой или предложением необязательно: 좀 도와주세요 = 도와주세요
  for(let k=o.length-1;k>=0;k--)if(o[k]==='좀'&&o.slice(k+1,k+4).some(t=>/(세요|시다|까요|래요)$/.test(t)))o.splice(k,1);
  // 와/과 = 하고 (по алломорфу); 같이/함께 после «с кем» не обязателен
  for(let k=0;k<o.length;k++){const t=o[k],m=t.match(/^(.+)(와|과)$/);if(m&&(LEX.nouns.has(m[1])||/^(민수|지민|수진|준호)$/.test(m[1]))&&(m[2]==='과')===hasB(m[1].slice(-1)))o[k]=m[1]+'하고';}
  for(let k=o.length-1;k>0;k--)if((o[k]==='같이'||o[k]==='함께')&&o[k-1].endsWith('하고'))o.splice(k,1);
  // контрастное 는 после слова времени / места с 에: 주말에는 = 주말에, 어제는 = 어제
  const TW=new Set(['어젯밤','작년','올해','맨날','어제','오늘','내일','지금','아침','저녁','밤','점심','내년','올해','작년','요즘','이번','다음']);
  for(let k=0;k<o.length;k++){const t=o[k];if(t.length>2&&t.endsWith('에는'))o[k]=t.slice(0,-1);else{const m=t.match(/^(.+)(은|는)$/);if(m&&TW.has(m[1]))o[k]=m[1];}}
  // время с 에 / 은·는 / 에는: 지난주는 = 지난주에, 저번 주는 = 저번 주에, 월요일은 = 월요일에
  const TE=/^(지난주|지난달|주말|저번주|다음주|이번주|[월화수목금토일]요일)(에|은|는)$/,TE0=/^(지난주|지난달|저번주)$/;
  for(let k=0;k<o.length;k++){const m=o[k].match(TE);if(m){o[k]=m[1]+'에';continue;}if(TE0.test(o[k])){o[k]+='에';continue;}
   const m2=o[k].match(/^(주|달|주말)(에|은|는)$/);if(m2&&k>0&&/^(이번|다음|지난|저번)$/.test(o[k-1]))o[k]=m2[1]+'에';}
  // 아마, 같이 — позиция свободная
  for(const w of ['방금','금방','이미','벌써','아직','지금','작년','올해','어젯밤','저번에','오늘','어제','내일','맨날','요즘','매일','이따가','나중에','곧','원래','솔직히','절대','일단','제대로','자꾸','점점','서로','거의','당연히','같이','아마']){const i=o.indexOf(w);if(i>0){o.splice(i,1);o.unshift(w);}}
  // «N이 место에 있어요» = «место에 N이 있어요»
  for(let v=2;v<o.length;v++){if(!/^(있|없)/.test(o[v])||LEX.nouns.has(o[v]))continue;if(!(o[v-1].length>1&&o[v-1].endsWith('에')&&!o[v-1].endsWith('에게')))continue;
   let p0=v-1;while(p0-1>=0&&(LEX.nouns.has(o[p0-1])||o[p0-1].endsWith('의')&&LEX.nouns.has(o[p0-1].slice(0,-1))))p0--;const sj=o[p0-1];
   if(p0>=1&&sj&&/(이|가|은|는)$/.test(sj)&&LEX.nouns.has(sj.slice(0,-1))){o.splice(p0-1,1);o.splice(v-1,0,sj);}}
  T=o.filter(t=>t!=='저는'&&t!=='나는').map(t=>{if(t==='저의')return '제';if(t==='나의')return '내';const m=t.match(/^(.+)한테(도|만)?$/);if(m&&LEX.nouns.has(m[1]))return m[1]+'에게'+(m[2]||'');return t;}).map(t=>{if(t.endsWith('의')&&t.length>1&&!LEX.nouns.has(t)&&LEX.nouns.has(t.slice(0,-1)))return t.slice(0,-1);return t;}).map((t,k,A)=>/^(거예요|거에요|겁니다|겁니까|꺼예요)/.test(A[k+1]||'')?t:stripP(t));
  // N(을) 하다 = N하다, 춤(을) 추다 = 춤추다; 배(가) 고파요 = 배고파요
  for(let k=0;k<T.length-1;k++){const a=T[k],b=T[k+1];
   if(LEX.nouns.has(a)&&(/^(하|해|했|할|합)/.test(b)||(a==='춤'&&/^(추|춰|췄|출)/.test(b)))){T[k]=a+b;T.splice(k+1,1);continue;}
   const m=a.match(/^(.+?)(이|가)?$/);if(m&&LEX.form[m[1]+b]){T[k]=m[1]+b;T.splice(k+1,1);}}
  // -(으)러: место до или после цели — 식당에 밥 먹으러 가요 = 밥 먹으러 식당에 가요
  const MV=/^(가|갔|갈|갑|오|왔|올|와|옵|다녀|다니|다닐|나가|나갔|나갈|나와|나오|들어)/;
  for(let k=1;k<T.length-1;k++){if(!/.러$/.test(T[k])||!MV.test(T[k+1]))continue;
   for(let j=k-1;j>=0;j--){const t=T[j];if(t.length>1&&t.endsWith('에')&&!t.endsWith('에게')&&LEX.nouns.has(t.slice(0,-1))){T.splice(j,1);T.splice(k,0,t);break;}}}
  const r=[];for(let k=0;k<T.length;k++){if(T[k]==='어디에'){r.push('어디');continue;}if(T[k]==='무엇'){r.push('뭐');continue;}r.push(T[k]);}
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


 // описка засчитывается только внутри основы существительного: окончания и частицы — это грамматика
 function nounTypo(a,b){const A=a.split(' '),B=b.split(' ');if(A.length!==B.length)return false;
  const d=[];for(let k=0;k<A.length;k++)if(A[k]!==B[k])d.push(k);if(d.length!==1)return false;
  const at=A[d[0]],bt=B[d[0]];
  for(let n=bt.length;n>=1;n--){const N=bt.slice(0,n),P=bt.slice(n);if(!LEX.nouns.has(N))continue;
   if(!at.endsWith(P))return false;const aN=at.slice(0,at.length-P.length);return lev(jamo(aN),jamo(N))===1;}
  return false;}
 // канон «лайт» для ловушек: только опущение 저는/나는
 const lite=s=>s.split(' ').filter(t=>t&&t!=='저는'&&t!=='나는').join(' ');
 // падеж частицы на существительном из словаря: S — 이/가, O — 을/를
 function pCase(t){for(const [q,c] of [['이','S'],['가','S'],['을','O'],['를','O']]){if(t.length>1&&t.endsWith(q)&&LEX.nouns.has(t.slice(0,-q.length)))return {n:t.slice(0,-q.length),c};}return null;}
 // подмена 이/가 ↔ 을/를 на том же слове меняет смысл (어머니가 도와요 ≠ 어머니를 도와요) — канон это не засчитывает
 function pConflict(a,x){const A=lite(a).split(' '),X=lite(x).split(' ');
  const pa=A.map(pCase).filter(Boolean),px=X.map(pCase).filter(Boolean);
  for(const p of pa){if(px.some(q=>q.n===p.n)&&!px.some(q=>q.n===p.n&&q.c===p.c))return true;}return false;}
 // падеж, которого нет ни в одном варианте, при том что другой падеж на этом слове есть
 function pConflictAll(a,V){const pa=lite(a).split(' ').map(pCase).filter(Boolean);if(!pa.length)return false;
  const pv=V.flatMap(v=>lite(v).split(' ').map(pCase).filter(Boolean));
  return pa.some(p=>pv.some(q=>q.n===p.n&&q.c!==p.c)&&!pv.some(q=>q.n===p.n&&q.c===p.c));}
 function dopRule(a,V){const A=a.split(' ');if(!A.some(t=>/^(도와|도왔|도울|도우|도웁|돕)/.test(t)))return null;
  const di=A.findIndex(t=>/^(도와|도왔|도울|도우|도웁|돕)/.test(t));
  for(let ti=0;ti<A.length;ti++){const t=A[ti];const m=t.match(/^(.+?)(한테|에게|께)(는|도|만)?$/);if(!m)continue;
   if(ti>di||A.slice(ti+1,di).some(w=>/(요|다)$/.test(w)))continue;
   for(const x of V){if(!/(^| )(도와|도왔|도울|도우|도웁|돕)/.test(x))continue;const y=x.split(' ').find(w=>w===m[1]+'을'||w===m[1]+'를'||w.startsWith(m[1]+'을')||w.startsWith(m[1]+'를'));
    if(y)return {v:'bad',kind:'dop',best:x,note:'돕다 — кому помогают, стоит с 을/를 (как «выручить кого»): '+y+'. 한테/에게 здесь нельзя.',d:diff(a,x)};}
   const o=m[1]+(hasB(m[1].slice(-1))?'을':'를');return {v:'bad',kind:'dop',best:V[0],note:'돕다 — кому помогают, стоит с 을/를: '+o+'. 한테/에게 здесь нельзя.',d:diff(a,V[0])};}
  return null;}
 // описка не засчитывается автоматически: вердикт ставит ученик (решение 14.10)

 // ошибки уровня фразы: V-고 안 싶어요, V-지 싶지 않아요, 형용사 + 래요/게요, 못 + 래요, 안 + N하다
 function wRule(a,V){const A=a.split(' ');const best=V[0];const R=(note,kind)=>({v:'bad',kind,best,note,d:diff(a,best)});
  for(let k=0;k<A.length;k++){const t=A[k],n=A[k+1]||'';
   if(t.endsWith('고')&&n==='안'&&/^싶/.test(A[k+2]||''))return R('안 ставится перед глаголом: 안 '+t+' '+A[k+2]+', или '+t+' 싶지 않아요.','sip');
   if(t.endsWith('지')&&/^싶지/.test(n))return R('Перед 싶다 — -고: '+t.slice(0,-1)+'고 싶지 않아요.','sip');
   if(/(래요|게요)\??$/.test(t)){const base=t.replace(/(래요|게요)\??$/,''),sm=LEX.fut&&LEX.fut[base];
    if(sm&&PTC[sm]==='adj')return R('-(으)ㄹ래요 / -(으)ㄹ게요 — только с глаголами. О состоянии — обычная форма: '+LEX.stem[sm].pres+'.','adjv');
    if(A[k-1]==='못'&&t.includes('래요'))return R('래요 — о желании, с ним только 안. «Не смогу» — 못 + обычная форма или 못 갈 거예요.','mot');}
   if(t==='안'&&/러$/.test(n)&&!V.some(v=>/(^| )안 \S+러( |$)/.test(v)))return R('Отрицание — перед последним глаголом: …러 안 가요. Само -(으)러 не отрицается.','neg');
   if(/[아어]$/.test(t)&&n==='안'&&/^(해|했|할|하)/.test(A[k+2]||'')&&LEX.stem[t+'하'])return R('-아/어하다 — один глагол, 안 ставится перед ним целиком: 안 '+t+(A[k+2]||'')+'.','neg');
   if((t==='이해'&&n==='안')||(t==='안'&&/^이해(했|해|할)/.test(n))||(t==='이해하지'&&/^않/.test(n)))if(V.some(v=>/이해 못|못 이해|이해하지 못/.test(v)))return R('«Не понял» — 못: 이해 못 했어요. 이해 안 했어요 — «не стал понимать».','neg');
   if(/마세요$/.test(t)&&V.some(v=>/맙시다/.test(v))&&!V.some(v=>/마세요/.test(v)))return R('-지 마세요 — «не делайте» (просьба к вам). «Давайте не …» (мы все) — -지 맙시다: '+best+'.','neg');
   if(/^않(읍|습)시다$/.test(t)||(t==='안'&&/시다$/.test(n)&&V.some(v=>/맙시다/.test(v))))return R('«Давайте не …» — только -지 맙시다: '+best+'. 안 …ㅂ시다 и -지 않읍시다 не говорят.','neg');
   if(V.some(v=>/지 마세요/.test(v))&&!V.some(v=>/(^| )안 /.test(v))&&((t==='안'&&/세요$/.test(n))||(t.endsWith('지')&&/^않으세요$/.test(n))))return R('Запрет, «не делайте» — -지 마세요: '+best+'. 안 …세요 / -지 않으세요 значит «вы не …» (рассказ, вопрос).','neg');
   if(t.endsWith('지')&&/^(마요|말아요)$/.test(n)&&V.some(v=>/지 마세요/.test(v)))return {v:'ok',kind:'soft',best,note:'Засчитано: -지 마요 — тоже верно, разговорнее. Вежливо — -지 마세요: '+best+'.'};
   if(t==='안'&&/^\S+(하고|해요|했어요|할래요|할게요|할|하지)$/.test(n)){const m=n.match(/^(\S+?)(하고|해요|했어요|할래요|할게요|할|하지)$/);if(m&&LEX.nouns.has(m[1]))return R('안 ставится перед 하다: '+m[1]+' 안 '+n.slice(m[1].length)+'.','neg');}}
  return null;}

 // вопрос-приглашение -(으)ㄹ래요?: ответ 해요-формой или 거예요? — верно, с пояснением
 function softQ(item,a,V){if(!/\?/.test(item.ru||''))return null;
  for(const x of V){if(!/래요(\s|$)/.test(x))continue;const X=canon(x).split(' ');
   const A=canon(a.replace(/(\S+) 거예요/g,'$1래요')).split(' ');
   if(A.join(' ')===X.join(' ')&&/ 거예요/.test(a))return {v:'ok',kind:'soft',best:x,note:'Засчитано: «… 거예요?» — вопрос о планах. Спросить о выборе, пригласить — -(으)ㄹ래요?: '+x+'.'};
   const B=canon(a).split(' ');if(B.length!==X.length)continue;let diffk=-1,ok=true;
   for(let k=0;k<X.length;k++)if(B[k]!==X[k]){if(diffk>=0){ok=false;break;}diffk=k;}
   if(!ok||diffk<0)continue;const c=X[diffk],t=B[diffk];if(!c.endsWith('래요'))continue;const sm=LEX.fut&&LEX.fut[c.slice(0,-2)];
   if(sm&&LEX.stem[sm]&&LEX.stem[sm].pres===t)return {v:'ok',kind:'soft',best:x,note:'Засчитано: 해요-форма тоже приглашает. -(으)ㄹ래요? мягче — спрашивает, хочет ли собеседник: '+x+'.'};}
  return null;}
 // путаница связок: -아서 / -(으)니까 / -(으)면
 function cxForms(c){const r=[];const add=(k,s)=>{if(s)r.push([k,s]);};add('as',LEX.as&&LEX.as[c]);add('ni',LEX.ni&&LEX.ni[c]);add('my',LEX.my&&LEX.my[c]);
  const m=c.match(/^(.+?)(이라서|라서|이니까|니까|이면|면)$/);if(m&&LEX.nouns.has(m[1]))r.push([m[2].includes('서')?'as':m[2].includes('까')?'ni':'my','N:'+m[1]]);
  const h=c.match(/^(.+)(해서|하니까|하면)$/);if(h&&LEX.nouns.has(h[1]))r.push([h[2]==='해서'?'as':h[2]==='하니까'?'ni':'my','H:'+h[1]]);return r;}
 function cxTok(k,s){if(s.startsWith('H:')){const n=s.slice(2);return n+(k==='as'?'해서':k==='ni'?'하니까':'하면');}if(s.startsWith('N:')){const n=s.slice(2),b=hasB(n.slice(-1));return k==='as'?n+(b?'이라서':'라서'):k==='ni'?n+(b?'이니까':'니까'):n+(b?'이면':'면');}
  const e=LEX.stem[s];if(!e)return null;return k==='as'?asTok(s,e.pres):k==='ni'?niTok(s,e.pres):myTok(s,e.pres);}
 function cxRule(item,a,V){const A=canon(a).split(' ');
  for(const x of V){const X=canon(x).split(' ');if(X.length!==A.length)continue;let k=-1,n=0;for(let i=0;i<X.length;i++)if(X[i]!==A[i]){n++;k=i;}if(n!==1)continue;
   const c=X[k],t=A[k],tail=X.slice(k+1);
   for(const [kc,s] of cxForms(c))for(const kt of ['as','ni','my']){if(kt===kc||cxTok(kt,s)!==t)continue;
    const B=(note)=>({v:'bad',kind:'cx',best:x,note,d:diff(a,x)}),S=(note)=>({v:'ok',kind:'soft',best:x,note});
    const req=tail.some(w=>/(세요|시다|까요|마세요)$/.test(w)),dc=tail.some(w=>/(게요|래요)$/.test(w))||tail.includes('거예요');
    if(kc==='ni'&&kt==='as'){if(req)return B('Перед просьбой и предложением — -(으)니까, не -아서: '+c+'.');if(dc)return S('Засчитано: -아서 тоже верно для простого сообщения. -(으)니까 подчёркивает «раз так, то…», здесь тренируем её: '+c+'.');continue;}
    if(kc==='my'&&kt==='ni')return B('Условие (может и не случиться) — -(으)면: '+c+'. -(으)니까 — причина, которая уже есть.');
    if(kc==='ni'&&kt==='my')return B('Причина уже есть — -(으)니까: '+c+'. -(으)면 — «если».');
    if(kc==='my'&&kt==='as')return B('«Если» — -(으)면: '+c+'. -아서 — «потому что».');
    if(kc==='as'&&kt==='ni'&&/^(미안|죄송|고마|감사|반가)/.test(tail[0]||''))return B('За что извиняемся или благодарим — -아서: '+c+'.');}}
  return null;}
 // будущее -(으)ㄹ 거예요 вместо -(으)ㄹ게요 / предложения / настоящего
 function fuRule(item,a,V){const A=canon(a).split(' ');const k=A.indexOf('거예요');if(k<1)return null;const X0=A[k-1],sm=LEX.fut&&LEX.fut[X0];if(!sm||!LEX.stem[sm])return null;
  const e=LEX.stem[sm],dv=/давай/i.test(item.ru||'');
  for(const [cand,kind] of [[X0+'게요','g'],[X0+'까요','p'],[psTok(sm,e.pres),'p'],[e.pres,dv?'p':'e']]){if(!cand)continue;const B=A.slice(0,k-1).concat([cand],A.slice(k+1)).join(' ');
   for(const x of V)if(canon(x)===B){if(kind==='e')return {v:'ok',kind:'eq',best:x};
    return {v:'ok',kind:'soft',best:x,note:kind==='g'?'Засчитано: «… 거예요» — сообщаю план. Обещаю собеседнику — естественнее -(으)ㄹ게요: '+x+'.':'Засчитано: «… 거예요» — сообщаю план. Предложить — '+x+'.'};}}
  return null;}
 // лексические путаницы
 function confRule(a,V){const best=V[0],B=note=>({v:'bad',kind:'lex',best,note,d:diff(a,best)});
  if(/감기(가|를|이) 걸/.test(a)&&V.some(v=>/감기에 걸/.test(v)))return B('Простудиться — 감기에 걸리다 (частица 에).');
  if(/약(을|이)? (마시|마셔|마셨|마실)/.test(a)&&V.some(v=>/약(을)? (먹|드)/.test(v)))return B('Лекарство «едят»: 약을 먹다 (старшим — 드시다).');
  if(/잃어버/.test(a)&&!V.some(v=>/잃어버/.test(v))&&V.some(v=>/잊어버/.test(v)))return B('Забыть — 잊어버리다. 잃어버리다 — потерять (вещь).');
  if(/잊어버/.test(a)&&!V.some(v=>/잊어버/.test(v))&&V.some(v=>/잃어버/.test(v)))return B('Потерять (вещь) — 잃어버리다. 잊어버리다 — забыть.');
  return null;}
 // -(으)세요 в эталоне, ответ — простой 해요 той же основы: о старшем — ошибка, собеседнику — засчитано с пояснением
 const HON=/(선생님|할머니|할아버지|아버지|어머니|사장님|엄마|아빠)/,HONW=/^(선생님|할머니|할아버지|아버지|어머니|사장님|엄마|아빠|부모님|손님)(이|가|은|는|께서|께서는|도|만)?$/,HSP={'드세요':['먹어요','마셔요'],'주무세요':['자요'],'계세요':['있어요']};
 function hsRule(a,V,item){const A=canon(a).split(' ');
  for(const x of V){const X=canon(x).split(' ');if(X.length!==A.length)continue;let k=-1,n=0;for(let i=0;i<X.length;i++)if(X[i]!==A[i]){n++;k=i;}if(n!==1)continue;
   const c=X[k],t=A[k];let hit=false,sp=false;
   if(HSP[c]&&HSP[c].includes(t)){hit=true;sp=true;}
   else{const s=LEX.se&&LEX.se[c];if(s&&LEX.stem[s]&&LEX.stem[s].pres===t)hit=true;}
   if(!hit)continue;
   const hs=X.some((w,i)=>{const m=w.match(HONW);if(!m)return false;if(!m[2]&&LEX.nouns.has(X[i+1]||''))return false;return true;})||/(гост|старш)/i.test(String(item&&item.ru||''))||/\([^)]*(бабушк|дедушк|учител|начальн|директор|маме|папе|отцу|матери|пожил)/i.test(String(item&&item.ru||''));
   if(hs)return {v:'bad',kind:'hon',best:x,note:(sp?'У старших и гостя — особый глагол: ':'О старшем — с почтением, -(으)세요: ')+c+'.',d:diff(a,x)};
   if(sp)return {v:'ok',kind:'soft',best:x,note:'Засчитано: '+t+' — тоже вежливо. Старшим и гостям — '+c+'.'};
   return {v:'ok',kind:'soft',best:x,note:'Засчитано: 해요 — тоже вежливо. -(으)세요 добавляет почтения к собеседнику, здесь тренируем её: '+c+'.'};}
  return null;}
 // одно слово отличается: 에서 перед глаголом движения, китайское число с 시, -로 вместо -러
 const SINO=new Set(['일','이','삼','사','오','육','칠','팔','구','십','십일','십이']),NATN=new Set(['한','두','세','네','다섯','여섯','일곱','여덟','아홉','열','열한','열두']);
 function phRule(a,V){const A=canon(a).split(' ');
  for(const x of V){const X=canon(x).split(' ');if(X.length!==A.length)continue;let k=-1,n=0;for(let i=0;i<X.length;i++)if(X[i]!==A[i]){n++;k=i;}if(n!==1)continue;
   const c=X[k],t=A[k],nx=X[k+1]||'',R=note=>({v:'bad',kind:'ph',best:x,note,d:diff(a,x)});
   if(c.endsWith('에')&&t===c+'서'&&/^(가|갔|갈|갑|오|왔|올|와|옵|다녀|다니|다닐|나가|나갔|나갈|들어가|들어오|들어와|돌아가|돌아오|돌아와)/.test(nx)&&!LEX.nouns.has(nx)&&stripP(nx)===nx)return R('Куда идём — 에: '+c+' '+nx+'. 에서 перед 가다 — «откуда».');
   {const vj=X.slice(k+1,k+4).find(w=>/^(있|없|생기|생겼|생길|남았|남아|많|적)/.test(w)&&!LEX.nouns.has(w)&&stripP(w)===w);if(c.endsWith('에')&&t===c+'서'&&vj)return R('Где есть, появилось — 에, как с 있다: '+c+' … '+vj+'.');}
   if(t===c+'에'&&LEX.nouns.has(c)&&/^(타|탔|탈|탑|타러|타고)/.test(nx))return {v:'ok',kind:'soft',best:x,note:'Засчитано: '+c+'에 타다 — «сесть в», тоже верно. Обычно — '+c+(hasB(c.slice(-1))?'을':'를')+' 타다.'};
   {const FULL={'하나':'한','둘':'두','셋':'세','넷':'네','스물':'스무'};if(FULL[t]===c&&nx)return R('Перед счётным словом — краткая форма: '+c+' '+nx+' (하나 → 한, 둘 → 두, 셋 → 세, 넷 → 네).');}
   if(NATN.has(c)&&SINO.has(t)&&/^(번|잔|달|살|개|명|시간|마리|권|병|장)/.test(nx))return R('Здесь исконные числа: '+c+' '+nx+'.');
   if(SINO.has(c)&&NATN.has(t)&&/^(년|월|일|분|원|층|호)/.test(nx))return R('Здесь китайские числа: '+c+' '+nx+'.');
   if(c==='금방'&&t==='방금')return R('방금 — «только что», только с прошедшим. «Сейчас (приду)» — 금방 + настоящее: '+x+'.');
   if(NATN.has(c)&&SINO.has(t)&&/^시/.test(nx))return R('Часы — исконные числа: '+c+' '+nx+' (минуты — китайские).');
   if(/러$/.test(c)&&(t===c.slice(0,-1)+'로'))return R('Цель — -(으)러 (ㄹ + ㅓ), не -로: '+c+'.');}
  return null;}
 // число со счётным перед существительным: 세 잔 커피를 → 커피를 세 잔
 function cntRule(a,V){const A=lite(a).split(' ');const NUM=t=>NATN.has(t)||SINO.has(t)||t==='몇'||['하나','둘','셋','넷'].includes(t);
  for(let i=0;i+2<A.length;i++){if(!NUM(A[i]))continue;const m=A[i+2].match(/^(.+?)(을|를)$/);if(!m||!LEX.nouns.has(m[1]))continue;
   const sw=A.slice();sw.splice(i,3,A[i+2],A[i],A[i+1]);const j=sw.join(' ');const x=V.find(v=>canon(v)===canon(j));
   if(x)return {v:'bad',kind:'cnt',best:x,note:'Сначала что, потом сколько: '+A[i+2]+' '+A[i]+' '+A[i+1]+' (или '+m[1]+' '+A[i]+' '+A[i+1]+(hasB(A[i+1].slice(-1))?'을':'를')+'). «'+A[i]+' '+A[i+1]+' '+m[1]+'» по-корейски не говорят.',d:diff(a,x)};}
  return null;}
 // 형용사 с 을/를 (한국 음식을 그리워요): что — 이/가
 function adjObj(a,V){const A=lite(a).split(' ');
  for(const x of V){const X=lite(x).split(' ');if(X.length!==A.length)continue;
   for(let i=0;i+1<X.length;i++){const m=A[i].match(/^(.+?)(을|를)$/),n=X[i].match(/^(.+?)(이|가)$/);if(!m||!n||m[1]!==n[1]||A[i+1]!==X[i+1])continue;
    const f=LEX.form[X[i+1]];const sm=f?f.s:null;if(sm&&PTC[sm]==='adj')return {v:'bad',kind:'adj',best:x,note:X[i+1]+' — прилагательное: что (по чему) — 이/가: '+X[i]+' '+X[i+1]+'.',d:diff(a,x)};}}
  return null;}
 // тема 은/는 вместо 이/가 (и вместо 을/를 при отрицании) — верно
 const NEGW=/(^| )(안|못)( |$)|않|없|몰라|마세요|맙시다/;
 function topRule(item,a,V){if(/Кто|кто/.test(item.ru||''))return null;const A=lite(a).split(' ');
  for(const x of V){if(/누가|누구|제가/.test(x))continue;const X=lite(x).split(' ');if(X.length!==A.length)continue;let ok=true,n=0;
   for(let i=0;i<X.length;i++){if(X[i]===A[i])continue;const m=A[i].match(/^(.+?)(은|는)$/),q=X[i].match(/^(.+?)(이|가|을|를)$/);
    if(!m||!q||m[1]!==q[1]||/^(저|나|제|내)$/.test(m[1])){ok=false;break;}if(/[을를]/.test(q[2])&&!NEGW.test(a)){ok=false;break;}n++;}
   if(ok&&n)return {v:'ok',kind:'eq',best:x};
   if(x.split(' ').filter(w=>/(은|는)$/.test(w)&&LEX.nouns.has(w.slice(0,-1))||/^(저는|나는)$/.test(w)).length===1){let ok2=true,n2=0;
    for(let i=0;i<X.length;i++){if(X[i]===A[i])continue;const m=X[i].match(/^(.+?)(은|는)$/),q=A[i].match(/^(.+?)(이|가)$/);if(!m||!q||m[1]!==q[1]||!LEX.nouns.has(m[1])){ok2=false;break;}n2++;}
    if(ok2&&n2===1)return {v:'ok',kind:'eq',best:x};}}
  return null;}
 // нестянутые формы (생기었어요, 지내었어요) — верно, засчитано с пояснением
 function uncRule(a,V){const A=a.split(' ');
  for(const x of V){const X=x.split(' ');if(X.length!==A.length)continue;const d=[];for(let i=0;i<X.length;i++)if(X[i]!==A[i])d.push(i);if(d.length!==1)continue;
   const c=X[d[0]],t=A[d[0]],f=LEX.form[c];if(!f)continue;const st=f.s,l=st.slice(-1);if(!isH(l))continue;const dv=dec(l);if(dv.t!==0||![20,1,5,8,13].includes(dv.v))continue;
   if([st+'어요',st+'었어요',st+'아요',st+'았어요'].includes(t))return {v:'ok',kind:'soft',best:x,note:'Засчитано: так тоже верно, но обычно пишут слитно: '+c+'.'};}
  return null;}
 // предложение: добавленное 같이; 해요 вместо -(으)ㅂ시다 / -(으)ㄹ까요; -(으)ㄹ래요? вместо -(으)ㄹ까요? — засчитано с пояснением
 const ELD=/учител|начальник|старш|директор|бабушк|дедушк|профессор/i;
 function sugRule(item,a,V){let A=canon(a).split(' ');const ru=String(item.ru||'');
  const last=A[A.length-1]||'';
  if(A.includes('제가')&&!V.some(v=>canon(v).split(' ').includes('제가'))&&/게요$/.test(last)){const B=A.filter(t=>t!=='제가');const x=V.find(v=>canon(v)===B.join(' '));if(x)return {v:'ok',kind:'eq',best:x};}
  if(A.includes('같이')&&!V.some(v=>canon(v).split(' ').includes('같이'))&&(/(까요|시다|래요)$/.test(last)||(/Давай/i.test(ru)&&/요$/.test(last)))&&!A.includes('제가')){
   A=A.filter(t=>t!=='같이');const j=A.join(' ');const x=V.find(v=>canon(v)===j);if(x)return {v:'ok',kind:'eq',best:x};}
  const offer=/думаешь|Мне |ть\?|Наверное/.test(ru);
  for(const x of V){const X=canon(x).split(' ');if(X.length!==A.length)continue;let k=-1,n=0;for(let i=0;i<X.length;i++)if(X[i]!==A[i]){n++;k=i;}if(n!==1)continue;
   const c=X[k],t=A[k];
   const pres=(st)=>st&&LEX.stem[st]?LEX.stem[st].pres:null;
   if(/시다$/.test(c)&&!/맙시다$/.test(c)){const st=LEX.ps&&LEX.ps[c];const p=pres(st)||(/합시다$/.test(c)?c.slice(0,-3)+'해요':null);
    if(p&&t===p)return {v:'ok',kind:'soft',best:x,note:'Засчитано: 해요 тоже предлагает — мягко и разговорно. Здесь тренируем -(으)ㅂ시다: '+x+'.'};}
   if(/까요$/.test(c)&&!offer){const st=LEX.fut&&LEX.fut[c.slice(0,-2)];const p=pres(st)||(/할까요$/.test(c)?c.slice(0,-3)+'해요':null);
    if(p&&t===p)return {v:'ok',kind:'soft',best:x,note:'Засчитано: 해요 тоже предлагает. Вопрос -(으)ㄹ까요? мягче — решаем вместе: '+x+'.'};
    if(t===c.slice(0,-2)+'래요'&&!ELD.test(ru))return {v:'ok',kind:'soft',best:x,note:'Засчитано: -(으)ㄹ래요? — по-дружески, близким; -(으)ㄹ까요? — нейтральнее: '+x+'.'};}}
  return null;}
 function check(item,ans){const r=check0(item,ans);
  // обращение в начале (선생님, …) — необязательно
  if(r&&r.v==='unk'){const m=String(ans||'').match(/^\s*([가-힣]+(님|씨)|여기요|저기요)\s*(,?)\s*(.+)$/);
   if(m&&(m[3]||![item.ko,...(item.alt||[])].some(t=>String(t).includes(m[1])))){const r2=check0(item,m[4]);if(r2&&r2.v!=='unk')return r2;}}
  if(r&&r.v==='unk'&&/(^|\s)아마(\s|$)/.test(String(ans||''))&&/(наверн|вероятно|скорее всего|может быть)/i.test(item.ru||'')){const r2=check0(item,String(ans).replace(/(^|\s)아마(?=\s)/,' ').trim());if(r2&&r2.v!=='unk')return r2;}
  if(r&&r.v==='typo')return {v:'unk',kind:'typo',typo:1,best:r.best,note:'Похоже на опечатку'+(r.note?' ('+(r.note.charAt(0).toLowerCase()+r.note.slice(1)).replace(/\.$/,'')+')':'')+'. Если это опечатка — «Засчитать»; если не помнил — «Моя ошибка».',d:r.d};
  return r;}
 // цифры перед счётным: 30분 → 삼십 분, 3시 → 세 시
 const SD=['','일','이','삼','사','오','육','칠','팔','구'];
 function sinoN(n){if(n===0)return '영';let o='';const u=[[1000,'천'],[100,'백'],[10,'십']];for(const [v,w] of u){const q=Math.floor(n/v);if(q){o+=(q>1?SD[q]:'')+w;n%=v;}}return o+(n?SD[n]:'');}
 const NT1=['','한','두','세','네','다섯','여섯','일곱','여덟','아홉'],NT10=['','열','스물','서른','마흔','쉰','예순','일흔','여든','아흔'];
 function natN(n){if(n<1||n>99)return null;if(n===20)return '스무';return NT10[Math.floor(n/10)]+NT1[n%10];}
 function digits(s){return s.replace(/(\d+)\s*월/g,(m,d)=>(+d===6?'유':+d===10?'시':sinoN(+d))+'월').replace(/(\d+)\s*(개월|년|일|분|원|층|호|초)/g,(m,d,u)=>sinoN(+d)+' '+u).replace(/(\d+)\s*(시간|시|살|개|명|마리|잔|권|병|장)/g,(m,d,u)=>{const w=natN(+d);return w?w+' '+u:m;});}
 function check0(item,ans){
  const raw=digits(String(ans||'').trim());
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
  // слитно N하다 при шаблоне «N(을) 하다» — верно; раздельно — «опечатка?»
  {const AX=t=>t.replace(/(\S)\s+(?=(주세요|줘요|줘서|줬어요|줄게요|줄래요|줄 수|주시|주면|주니까|주고|줬|줄까요))/g,(m,ch)=>{const d=isH(ch)?dec(ch):null;return d&&d.t===0&&[0,4,6,1,9,14].includes(d.v)?ch:m;});
   const aa=AX(a);for(const x of V)if(AX(x)===aa&&x!==a)return {v:'ok',kind:'eq',best:x};}
  for(const x of V)if(nsp(x)===an){if(!item.strict&&a.split(' ').length<x.split(' ').length&&canon(a)===canon(x))return {v:'ok',kind:'eq',best:x};return {v:'typo',kind:'space',best:x,note:'Только пробелы.'};}
  for(const tr of item.traps||[])for(const x of expand(tr.a))if(nsp(x)===an){
   const best=V.slice().sort((p,q)=>lev(jamo(nsp(p)),jamo(an))-lev(jamo(nsp(q)),jamo(an)))[0];
   if(tr.ok)return {v:'ok',kind:'soft',best,note:tr.why};
   return {v:'bad',kind:'trap',best,note:tr.why,d:diff(a,best)};}
  if(/시다요(\s|$)/.test(a)){const f=a.replace(/시다요(?=\s|$)/g,'시다'),x=V.find(v=>canon(v)===canon(f))||V.find(v=>/시다(\s|$)/.test(v))||V[0];return {v:'bad',kind:'yo',best:x,note:'-(으)ㅂ시다 — законченная вежливая форма, 요 к ней не добавляют: '+x+'.',d:diff(a,x)};}
  // 반말: эталон без 요, ответ — вежливый (요, 이에요, 주세요, 저/제)
  for(const x of V){const r=banRule(a,x);if(r)return {v:'bad',kind:'ban',best:x,note:r,d:diff(a,x)};}
  // ловушка с 저는/나는 (канон их опускает — иначе ловушка обходится)
  {const la=lite(a);if(la!==a||1)for(const tr of item.traps||[])for(const x of expand(tr.a)){const lx=lite(norm(x));if(lx===la&&!V.some(v=>lite(v)===lx))return tr.ok?{v:'ok',kind:'soft',best:V[0],note:tr.why}:{v:'bad',kind:'trap',best:V[0],note:tr.why,d:diff(a,V[0])};}}
  // 돕다: кому помогают — 을/를, не 한테/에게
  {const r=dopRule(a,V)||confRule(a,V);if(r)return r;}
  {const r=wRule(a,V);if(r)return r;}
  const pcA=pConflictAll(a,V);
  const ca=item.strict?a:canon(a);if(!item.strict&&!pcA)for(const x of V)if(canon(x)===ca&&!pConflict(a,x))return {v:'ok',kind:'eq',best:x};
  // задание требует конкретную форму (strict): верный ответ другой формой — ошибка с пояснением
  if(item.strict){const cA=canon(a),ng=t=>/(^| )(안|못) /.test(t)?'s':/지 (않|못)/.test(t)?'l':'';
   for(const x of V)if(canon(x)===cA&&!pConflict(a,x)){if(ng(a)===ng(x))return {v:'ok',kind:'eq',best:x};
    return {v:'bad',kind:'strict',best:x,note:'По-корейски верно, но задание просит именно ту форму, что в скобке: '+x+'.',d:diff(a,x)};}}
  if(!item.strict)for(const tr of item.traps||[])for(const x of expand(tr.a)){const cx=canon(norm(x));if(cx===ca&&!V.some(v=>canon(v)===cx))return tr.ok?{v:'ok',kind:'soft',best:V[0],note:tr.why}:{v:'bad',kind:'trap',best:V[0],note:tr.why,d:diff(a,V[0])};}
  {const r=hsRule(a,V,item)||cxRule(item,a,V)||fuRule(item,a,V)||(item.strict?null:sugRule(item,a,V))||phRule(a,V)||cntRule(a,V)||adjObj(a,V)||topRule(item,a,V)||uncRule(a,V);if(r)return r;}
  {const r=softQ(item,a,V);if(r)return r;}
  const JG=r=>r&&r.kind==='jg'&&!/(^|[^а-яё])но([^а-яё]|$)/i.test(item.ru||'')?{kind:'jg',ok:true,note:'Засчитано: «а» можно передать и -고. -지만 сильнее подчёркивает контраст.'}:r;
  for(const x of V){const r=JG(rules(a,x));if(r)return r.ok?{v:'ok',kind:'soft',best:x,note:r.note}:{v:'bad',kind:r.kind,best:x,note:r.note,d:diff(a,x)};}
  if(!item.strict)for(const x of V){const r=JG(rules(ca,canon(x)));if(r)return r.ok?{v:'ok',kind:'soft',best:x,note:r.note}:{v:'bad',kind:r.kind,best:x,note:r.note,d:diff(a,x)};}
  const la=pron(an);
  for(const x of V){const px=pron(nsp(x));if(la.some(y=>px.includes(y)))return {v:'bad',kind:'pron',best:x,note:'Записано по произношению. 받침 звучит в следующем слоге, но пишется на своём месте: '+x+'.',d:diff(a,x)};}
  // пропущена ㅇ при наборе — слоги склеились (머겄어요 вместо 먹었어요): опечатка
  {const J0=[jamo(an),jamo(nsp(lite(a)))],C=c=>c>='ㄱ'&&c<='ㅎ',W=c=>c>='ㅏ'&&c<='ㅣ';for(const x of V){const jx=jamo(nsp(x));for(let i=1;i<jx.length-1;i++){if(jx[i]!=='ㅇ'||!C(jx[i-1])||!W(jx[i+1]))continue;if(J0.includes(jx.slice(0,i)+jx.slice(i+1)))return {v:'typo',kind:'jamo',best:x,note:'пропущена ㅇ, и слоги склеились: '+x+'.',d:diff(a,x)};}}}
  const ja=jamo(an);let best=V[0],bd=99;for(const x of V){const d=lev(jamo(nsp(x)),ja);if(d<bd){bd=d;best=x;}}
  if(bd===1&&jamo(nsp(best)).length>=4&&!oneJ(jamo(nsp(best)),ja).includes('ㅆ')&&nounTypo(a,best))return {v:'typo',kind:'jamo',best,note:'Описка в одной букве.',d:diff(a,best)};
  // ловушка с опечаткой (одна чамо): ошибка по смыслу важнее опечатки
  const pSwap=(x)=>{const X=x.split(' '),A2=an.split(' ');if(X.length!==A2.length)return false;const d=X.map((t,i)=>[t,A2[i]]).filter(([p,q])=>p!==q);return d.length===1&&/^(.+)(은|는|을|를|이|가)$/.test(d[0][0])&&/^(.+)(은|는|을|를|이|가)$/.test(d[0][1])&&d[0][0].slice(0,-1)===d[0][1].slice(0,-1);};
  for(const tr of item.traps||[])if(!tr.ok)for(const x of expand(tr.a))if(!pSwap(norm(x))&&lev(jamo(nsp(x)),ja)<=1&&jamo(nsp(x)).length>=4)return {v:'bad',kind:'trap',best,note:tr.why+' Плюс ошибка в написании — сравни с эталоном.',d:diff(a,best)};
  // те же слова в другом порядке — подсказка; вердикт ставит ученик
  if(!item.strict){const tk=t=>lite(norm(t)).split(' ').filter(Boolean),ta=tk(a),ka=ta.slice().sort().join(' ');
   for(const x of V){const tx=tk(x);if(tx.length>2&&tx.slice().sort().join(' ')===ka&&tx[tx.length-1]===ta[ta.length-1])return {v:'unk',kind:'unk',ord:1,best:x,note:'Те же слова, другой порядок. Обычный — как в эталоне: глагол в конце, срок прямо перед ним, группа времени и число со счётным не разрываются. Блоки с частицами переставлять можно: если смысл тот же — засчитай.',d:diff(a,x)};}}
  return {v:'unk',kind:'unk',best,note:'',d:diff(a,best)};
 }
 return {check,expand,norm,link,jamo,lev,diff,setLex,canon,lex:()=>LEX};
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