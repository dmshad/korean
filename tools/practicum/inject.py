# Вставка практикумов слов в данные артефакта: python3 inject.py <in.html> <out.html> pw1 [pw2 ...]
import sys,json,importlib
src,dst,mods=sys.argv[1],sys.argv[2],sys.argv[3:]
L=open(src,encoding='utf8').read().split('\n')
i=next(k for k,l in enumerate(L) if l.startswith('<script type="application/json" id="data">'))
pre='<script type="application/json" id="data">';post='</script>'
s=L[i];assert s.startswith(pre) and s.endswith(post)
D=json.loads(s[len(pre):-len(post)])
for m in mods:
    M=importlib.import_module(m);G=M.G
    D['grammar']=[g for g in D['grammar'] if g['id']!=G['id']]
    # по порядку n
    k=next((j for j,g in enumerate(D['grammar']) if g.get('n',0)>G['n']),len(D['grammar']));D['grammar'].insert(k,G)
    D['bank'][G['id']]=M.BANK
    D['course']=[c for c in D['course'] if c['id']!=M.STEP['id']]
    j=next(j for j,c in enumerate(D['course']) if c['id']==M.AFTER);D['course'].insert(j+1,M.STEP)
L[i]=pre+json.dumps(D,ensure_ascii=False,separators=(',',':'))+post
open(dst,'w',encoding='utf8').write('\n'.join(L))
json.dump(D,open('/home/claude/D.json','w'),ensure_ascii=False)
print('ok',[c['id'] for c in D['course']][20:40])
