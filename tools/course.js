/* ===== Курс: последовательность тем, позиция, скрытие будущего ===== */
const COURSE=(()=>{
 const S=D.course||[];const posKey=()=>'coursePos_'+LSK;
 const gIds=new Set((D.grammar||[]).map(g=>g.id)),bIds=new Set((D.blocks||[]).map(b=>String(b.id)));
 const loaded=s=>s.k==='g'?gIds.has(s.g):(s.b&&s.b.length>0&&s.b.every(b=>bIds.has(String(b))));
 const idxOf=id=>S.findIndex(s=>s.id===id);
 // позиция по умолчанию — из meta (ведётся в чате управления)
 function metaPos(){const m=D.meta||{},cb=m.currentBlock;
  if(cb!=null){const a=(Array.isArray(cb)?cb:[cb]).map(String);const s=S.find(s=>s.k==='w'&&(s.b||[]).some(b=>a.includes(String(b))));if(s)return s.id;}
  if(m.currentGrammar){const s=S.find(s=>s.k==='g'&&s.g===m.currentGrammar);if(s)return s.id;}
  let last=null;for(const s of S)if(loaded(s))last=s.id;return last;}
 // выбор ученика (localStorage; синхронизируется из ST.course при загрузке)
 let user=null;try{user=JSON.parse(localStorage.getItem(posKey())||'null');}catch(e){}
 const mts=(D.meta&&D.meta.posTs)||0;
 let cur=(user&&user.cur&&idxOf(user.cur)>=0&&loaded(S[idxOf(user.cur)])&&(user.ts||0)>=mts)?user.cur:metaPos();
 let idx=idxOf(cur);
 const on=S.length>0&&idx>=0;
 if(on){
  const after=S.slice(idx+1),before=S.slice(0,idx),cs=S[idx];
  const hidB=new Set(after.filter(s=>s.k==='w').flatMap(s=>(s.b||[]).map(String)));
  const hidG=new Set(after.filter(s=>s.k==='g').map(s=>s.g));
  const hidN=new Set((D.grammar||[]).filter(g=>hidG.has(g.id)).map(g=>g.n));
  D.words=D.words.filter(w=>!hidB.has(String(w.block)));
  D.blocks=D.blocks.filter(b=>!hidB.has(String(b.id)));
  D.grammar=D.grammar.filter(g=>!hidG.has(g.id));
  if(D.morphs)D.morphs=D.morphs.filter(m=>!hidN.has(m.topic));
  if(D.conj&&D.conj.cells)for(const k of Object.keys(D.conj.cells))if(hidN.has(D.conj.cells[k].topic))delete D.conj.cells[k];
  if(D.bank)for(const g of hidG)delete D.bank[g];
  for(const g of D.grammar)g.open=(cs.k==='g'&&g.id===cs.g);
  D.meta.currentGrammar=cs.k==='g'?cs.g:null;
  D.meta.currentBlock=cs.k==='w'?(cs.b.length===1?cs.b[0]:cs.b.slice()):null;
  // пройденные практикумы снимают флаги «не отработано» (unflag частей)
  const GB=Object.fromEntries(D.grammar.map(g=>[g.id,g])),MB=Object.fromEntries((D.morphs||[]).map(m=>[m.id,m]));
  for(const s of before){if(s.k!=='g')continue;const g=GB[s.g];if(!g||!g.parts)continue;
   for(const p of g.parts)for(const f of p.unflag||[]){const i=f.lastIndexOf(':'),o=f.slice(0,i),id=f.slice(i+1);
    const t=GB[o]||MB[o];if(t&&t.new)t.new=t.new.filter(x=>x!==id);}}
 }
// повтор пройденной темы: временно делает её «темой урока», текущая позиция не меняется
 const vKey=()=>'courseView_'+LSK;let view=null;
 if(on){try{view=localStorage.getItem(vKey())||null;}catch(e){}
  const vi=view?idxOf(view):-1;
  if(vi<0||vi>=idx||!loaded(S[vi]))view=null;
  else{const vs=S[vi];
   if(vs.k==='g'){const g=D.grammar.find(x=>x.id===vs.g);if(!g)view=null;else{D.meta.currentGrammar=g.id;g.open=true;
     if(!g.parts||!g.parts.length)g.parts=[{id:'_',title:'Вся тема',intro:g.meaning||'',schema:(g.schema||[]).map((_,i)=>i),
       sections:(g.sections||[]).map(x=>x.id),usage:(g.usage||[]).map(x=>x.id),ex:[]}];}}
   else D.meta.currentBlock=vs.b.length===1?vs.b[0]:vs.b.slice();}}
 function setView(id){try{id?localStorage.setItem(vKey(),id):localStorage.removeItem(vKey());}catch(e){}}
 // прогресс: слова пройденных словарных тем + грамматические темы (текущая — 0.5)
 function stat(){if(!on)return null;const pb=new Set(S.slice(0,idx).filter(s=>s.k==='w').flatMap(s=>(s.b||[]).map(String)));
  const nw=D.words.filter(w=>pb.has(String(w.block))).length;
  const isT=s=>{if(s.k!=='g')return false;const g=(D.grammar||[]).find(x=>x.id===s.g);const n=g?g.n:+String(s.g).slice(1);return Number.isInteger(n)&&n>=1&&n<=46;};
  const nt=S.slice(0,idx).filter(isT).length,half=isT(S[idx])?0.5:0;
  const pct=Math.round(nw/800*50+(nt+half)/46*50);return {words:nw,themes:nt,half,pct};}
 function status(s){const i=idxOf(s.id);return !loaded(s)?'soon':i<idx?'done':i===idx?'cur':'ahead';}
 // смена позиции: сохраняется и применяется перезапуском
 function set(id){const i=idxOf(id);if(i<0||!loaded(S[i]))return false;const v={cur:id,ts:Date.now()};
  try{localStorage.setItem(posKey(),JSON.stringify(v));}catch(e){}if(typeof ST==='object'){ST.course=v;try{saveST();}catch(e){}}return true;}
 // после загрузки состояния: если в ST выбор новее — применить
 function sync(st){if(!on||!st||!st.course||!st.course.cur)return false;const c=st.course,i=idxOf(c.cur);
  if(i<0||!loaded(S[i])||(c.ts||0)<mts)return false;if(c.cur===cur)return false;
  try{localStorage.setItem(posKey(),JSON.stringify(c));}catch(e){}return true;}
 return {on,steps:S,get cur(){return cur;},get idx(){return idx;},get view(){return view;},loaded,status,stat,set,sync,idxOf,setView,
  title:s=>{if(s.k!=='g')return s.t;const g=(D.grammar||[]).find(x=>x.id===s.g);if(g&&g.label)return g.label;const n=g?g.n:+String(s.g).slice(1);return 'Т'+n+' · '+(g?g.title:s.t);}};
})();
