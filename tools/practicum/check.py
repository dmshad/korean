import sys,json,subprocess,importlib
sys.path.insert(0,'/home/claude/prac')
for m in sys.argv[1:]:
    M=importlib.import_module(m)
    items=[x for p in M.G['parts'] for b in p['ex'] for x in b]+[x for b in M.G['allEx'] for x in b]+[x for a in M.BANK.values() for x in a]
    json.dump({'items':items},open('/tmp/claude-0/items.json','w'),ensure_ascii=False)
    r=subprocess.run(['node','/home/claude/repo/tools/bankcheck.js','/tmp/claude-0/items.json',M.G['id']],capture_output=True,text=True)
    print(m,r.stdout[-3000:],r.stderr[-2000:])
