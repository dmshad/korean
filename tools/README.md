# Устройство репозитория (с 03.10)
Корень — собранное приложение (PWA) для dmshad.github.io/korean: index.html, sw.js, manifest, иконки, version.json.
Исходники, разобранные на части (на будущие языки — греческий, японский):
- src/shell.html — разметка и стили, места вставки /*@APP@*/ и /*@DATA@*/.
- src/core/app.js — ядро (не зависит от языка), места /*@LANG@*/ и /*@ENGINE@*/.
- src/lang/<яз>/lang.js — настройки языка (код, имя, голос озвучки); код языка = префикс хранилища и кэша.
- src/lang/<яз>/chk.js — движок проверки и сборки банка (CHK, BANK) для языка.
- content/<яз>/data.json — контент: слова, грамматика, банки, курс, диалоги.
Источник правды пока — артефакт в Claude: правки вносятся в него, при выкладке deploy.sh разбирает его на части (split.py).
Сборка из частей: build.py <яз> <out.html> — результат побайтно совпадает с артефактом.

# Инструменты (без токена)
- split.py <артефакт.html> <яз> — разбор артефакта на части (из корня репозитория); обновляет и tools/chk.js.
- build.py <яз> <out.html> — сборка артефакта из частей.
- build_pkg.py <index.html> <версия> [яз] — PWA-пакет в /home/claude/pkg/app; настройки языка (имя, значок, цвет) — словарь PKG в начале файла.
- deploy.sh "<сообщение>" [<артефакт.html> [яз]] — пакет в корень репозитория; с артефактом — ещё и разбор на части.
- chk.js — копия движка (как src/lang/ko/chk.js) для bankcheck.js.
- bankcheck.js <bank.json> <gid> — прогон фраз банка через проверку.
- course.js, course_steps.py — модуль курса и генератор последовательности.
Порядок в новом чате: git clone → cp tools/* /home/claude/ → echo -n TOKEN > /home/claude/.ghtoken → Artifact read → правка → publish →
build_pkg.py → deploy.sh "<сообщение>" <артефакт.html>.

# Хранилище
Все приложения на одном адресе (dmshad.github.io) — общая память браузера. Поэтому ключи — с префиксом языка (ko:trainer, ko:app…),
кэш — с префиксом (ko-<версия>), кнопка «Обновить» снимает только свой service worker. Старые ключи без префикса переносятся один раз (ko:_migr).

# Языковые места в ядре (вынести в lang/<яз> при подключении второго языка)
- Промпты генерации и проверки через Claude: mkGen, chkPrompt, trPrompt, trChkPrompt, whyPrompt, allowed, FORBID, dForbid, DSITD, NONEG.
- «Числа»: XC, NT, NCNT, IN, SYSN, numItem, sino, sino4, nat.
- «Формы»: cjTypes, cjAns, CJW, REOX, niForm, seForm, psForm, hForm, myForm, ptForm, reoForm, fForm, neg, mo.
- Письменность и «На слух»: LJ (чамо), алфавитный указатель словаря (ini), auItem, auListHTML, AULEAD; lang="ko" у полей ввода, localeCompare('ko').
- Подписи категорий: CAT, CATN.
