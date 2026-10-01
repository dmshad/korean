const fs=require('fs');const [CHK,BANK]=new Function(fs.readFileSync('/home/claude/chk.js','utf8')+';return [CHK,BANK];')();
const D=JSON.parse(fs.readFileSync('/home/claude/D.json','utf8'));CHK.setLex(D);
const f=process.argv[2];const {items}=JSON.parse(fs.readFileSync(f,'utf8'));let bad=0;
for(const x of items){const it=BANK.item(x,process.argv[3]||'pr1');
 for(const t of [x.ko,...(x.alt||[])])for(const v of CHK.expand(t)){const r=CHK.check(it,v);if(r.v!=='ok'){bad++;console.log('SELF',v,r.v,r.kind);}}
 for(const tr of x.traps){const r=CHK.check(it,tr.a);if(r.v!=='bad'){bad++;console.log('TRAP accepted',tr.a,r.v,r.kind,'|',x.ko);}else if(r.kind!=='trap')console.log('  trap caught by rule',r.kind,tr.a);}
 if(/[A-Za-z]/.test(x.ko))console.log('latin',x.ko);}
console.log(f,'items',items.length,'problems',bad,'show sample:',BANK.show(items[1].ko));
