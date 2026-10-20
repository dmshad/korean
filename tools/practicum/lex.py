# Сверка лексики практикума по порогу курса: python3 lex.py pw1
import sys,json,re,importlib
sys.path.insert(0,'/home/claude/prac')
from kiwipiepy import Kiwi
kw=Kiwi()
D=json.load(open('/home/claude/D.json'))
def expand(t):
    # ( ) и [a|b] -> все варианты
    def parse(s,i,stop):
        alts=[['']];cur=['']
        out=['']
        while i<len(s):
            c=s[i]
            if stop and c in ')]|':return out,i
            if c=='(':
                sub,i=parse(s,i+1,True);i+=1;out=[o+x for o in out for x in sub+['']]
            elif c=='[':
                opts=[];i+=1
                while True:
                    sub,i=parse(s,i,True);opts+=sub
                    if s[i]=='|':i+=1;continue
                    i+=1;break
                out=[o+x for o in out for x in opts]
            else:
                out=[o+c for o in out];i+=1
        return out,i
    return parse(t,0,False)[0]
for m in sys.argv[1:]:
    M=importlib.import_module(m)
    steps=D['course'];idx=[c['id'] for c in steps].index(M.STEP['id'])
    blocks=set(str(b) for c in steps[:idx] if c['k']=='w' for b in c['b'])|{'base','yesno'}
    W=[w for w in D['words'] if str(w['block']) in blocks]
    allow=set()
    for w in W:
        ko=w['ko'];allow.add(ko)
        if ko.endswith('다'):allow.add(ko[:-1])
        for t in kw.tokenize(ko):allow.add(t.form)
    allow|={'민수','지민','세','네','두','한','스무','저','나','이것','그','이','저것','것','하','되','있','없','이','아니'}
    items=[x for p in M.G['parts'] for b in p['ex'] for x in b]+[x for a in M.BANK.values() for x in a]
    texts=set()
    for x in items:
        for t in [x['ko']]+x['alt']+[tr['a'] for tr in x['traps']]:
            texts|=set(expand(t))
    for s in M.G['sections']:
        for e in s['ex']:texts.add(re.sub(r'\([^)]*\)','',e['ko']))
    for u in M.G['usage']:
        texts.add(u['phrase'])
        for e in u['ex']:texts.add(e['ko'])
    bad={}
    for t in texts:
        for tok in kw.tokenize(t):
            if tok.tag in('NNG','NNP','VV','VA','MAG','MM','NP','XR','VX','NR','MAJ','IC') and tok.form not in allow:
                bad.setdefault(tok.form+'/'+tok.tag,set()).add(t)
    for k,v in sorted(bad.items()):print(m,k,'|',list(v)[:2])
    print(m,'texts',len(texts),'unknown',len(bad))
