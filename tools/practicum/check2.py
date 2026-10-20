import sys,json,subprocess,re
sys.path.insert(0,'/home/claude/prac')
from lex import expand
from kiwipiepy import Kiwi
kw=Kiwi()
D=json.load(open('/home/claude/D.json'))
G={g['id']:g for g in D['grammar']}
def allowed(step):
    S=D['course'];idx=[c['id'] for c in S].index(step)
    bl=set(str(b) for c in S[:idx+1] if c['k']=='w' for b in c['b'])|{'base','yesno'}
    A=set()
    for w in D['words']:
        if str(w['block']) in bl:
            A.add(w['ko']);A.add(w['ko'][:-1] if w['ko'].endswith('다') else w['ko'])
            for t in kw.tokenize(w['ko']):A.add(t.form)
    return A|{'민수','지민','세','네','두','한','스무','저','나','것','하','되','있','없','이','아니','못','안','않','싶','그래서','그런데','하지만','그리고','동안','쯤','때문','데','거'}
def lexrep(texts,step,tag):
    A=allowed(step);bad={}
    for t in texts:
        for tok in kw.tokenize(t):
            if tok.tag in('NNG','NNP','VV','VA','MAG','MM','NP','XR','VX','NR','MAJ','IC','NNB') and tok.form not in A:
                bad.setdefault(tok.form+'/'+tok.tag,set()).add(t)
    for k,v in sorted(bad.items()):print(tag,k,'|',list(v)[:2])
    print(tag,'texts',len(texts),'unknown',len(bad))
for gid in ('g47','g48'):
    g=G[gid];items=[x for p in g['parts'] for b in p['ex'] for x in b]+[x for b in g['allEx'] for x in b]+[x for a in D['bank'][gid].values() for x in a]
    json.dump({'items':items},open('/tmp/claude-0/items.json','w'),ensure_ascii=False)
    r=subprocess.run(['node','/home/claude/repo/tools/bankcheck.js','/tmp/claude-0/items.json',gid],capture_output=True,text=True)
    print(gid,r.stdout[-1500:],r.stderr[-800:])
    texts=set()
    for x in items:
        for t in [x['ko']]+x['alt']+[tr['a'] for tr in x['traps']]: texts|=set(expand(t))
    for s in g['sections']:
        for e in s['ex']: texts.add(e['ko'])
    lexrep(texts,gid,gid)
for step,bl in (('wt43',range(162,166)),('wt44',range(166,170))):
    texts={e['ko'] for w in D['words'] if w['block'] in bl for e in w['ex']}
    lexrep(texts,step,step)
