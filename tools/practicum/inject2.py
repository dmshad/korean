# Словарные 43–44 + обновление Т47/Т48: python3 inject2.py <in.html> <out.html>
import sys,json,copy
import wt4344 as V, g4748 as Q
src,dst=sys.argv[1],sys.argv[2]
L=open(src,encoding='utf8').read().split('\n')
pre='<script type="application/json" id="data">';post='</script>'
i=next(k for k,l in enumerate(L) if l.startswith(pre))
D=json.loads(L[i][len(pre):-len(post)])
new_ids={w['id'] for w in V.WORDS}
assert not (new_ids & {w['id'] for w in D['words']}), 'already injected'
# слова, заметки, блоки
D['words']+=copy.deepcopy(V.WORDS)
D['notes'].update(V.NOTES)
D['blocks']+=V.BLOCKS
# обратные связи
BY={w['id']:w for w in D['words']}
for w in V.WORDS:
    for r in w['rel']:
        o=BY[r['id']]
        if not any(x['id']==w['id'] for x in o['rel']): o['rel'].append({'id':w['id'],'t':r['t']})
# курс
for before,step in V.STEPS:
    j=[c['id'] for c in D['course']].index(before);D['course'].insert(j,step)
# грамматика
G={g['id']:g for g in D['grammar']}
for gid,EX,BK,TH,AX in (('g47',Q.EX47,Q.BANK47,Q.TH47,Q.ALLEX47),('g48',Q.EX48,Q.BANK48,Q.TH48,Q.ALLEX48)):
    g=G[gid]
    for p in g['parts']:
        old=p['ex'][0]
        b=D['bank'][gid].setdefault(p['id'],[])
        keys={x['ko'] for x in b}
        for x in old:
            if x['ko'] not in keys: b.append(x)     # старые базовые фразы — в банк (если их там ещё нет)
        p['ex']=[EX[p['id']]]
    for q,a in BK.items(): D['bank'][gid].setdefault(q,[]).extend(a)
    for s in g['sections']:
        k,r=TH[s['id']];s['ex'].append({'ko':k,'ru':r})
    g['allEx'][1]=AX
G['g48']['sections'][0]['body']+=Q.S1_48_ADD
L[i]=pre+json.dumps(D,ensure_ascii=False,separators=(',',':'))+post
open(dst,'w',encoding='utf8').write('\n'.join(L))
json.dump(D,open('/home/claude/D.json','w'),ensure_ascii=False)
print('ok words',len(D['words']),'course',len(D['course']),{g:{q:len(a) for q,a in D['bank'][g].items()} for g in ('g47','g48')})
