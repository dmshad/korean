# Разбор артефакта на части: python3 tools/split.py <artifact.html> <lang>  (запускать из корня репозитория)
# Пишет: src/shell.html, src/core/app.js, src/lang/<lang>/lang.js, src/lang/<lang>/chk.js, content/<lang>/data.json
import sys,os,re
src,lang=sys.argv[1],sys.argv[2]
s=open(src,encoding='utf-8').read()
m=re.search(r'(<script type="application/json" id="data">)(.*?)(</script>)',s,re.S)
data=m.group(2); s=s[:m.start(2)]+'/*@DATA@*/'+s[m.end(2):]
i=s.find('<script>')+8; j=s.find('</script>',i); app=s[i:j]; shell=s[:i]+'/*@APP@*/'+s[j:]
L0='/* ===== Язык приложения'; L1='\n/* ===== Хранилище с языковым префиксом'
a=app.find(L0); b=app.find(L1); assert a>=0 and b>a
langjs=app[a:b]; app=app[:a]+'/*@LANG@*/'+app[b:]
E0='/* ===== Проверка без Claude (движок) ===== */'; E1="\nconst D=JSON.parse(document.getElementById('data').textContent);"
a=app.find(E0); b=app.find(E1); assert a>=0 and b>a
eng=app[a:b]; app=app[:a]+'/*@ENGINE@*/'+app[b:]
for p,t in [('src/shell.html',shell),('src/core/app.js',app),(f'src/lang/{lang}/lang.js',langjs),(f'src/lang/{lang}/chk.js',eng),(f'content/{lang}/data.json',data)]:
    os.makedirs(os.path.dirname(p),exist_ok=True); open(p,'w',encoding='utf-8').write(t)
# tools/chk.js — для bankcheck.js (тот же движок)
open('tools/chk.js','w',encoding='utf-8').write(eng.rstrip()+'\n')
print('ok', {p:os.path.getsize(p) for p in ['src/shell.html','src/core/app.js',f'src/lang/{lang}/lang.js',f'src/lang/{lang}/chk.js',f'content/{lang}/data.json']})
