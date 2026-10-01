# Инструменты сборки (без токена)
- build_pkg.py <index.html> <версия> — собирает PWA-пакет в /home/claude/pkg/app (иконки, manifest, sw.js, version.json, index.html с баннером обновления).
- deploy.sh "<сообщение>" — клонирует репозиторий и пушит /home/claude/pkg/app в main. Токен берётся из /home/claude/.ghtoken (создать из github.md проекта).
- chk.js — исходник движка проверки и сборки банка (CHK, BANK), то же, что в артефакте.
- course.js — модуль курса (COURSE), то же, что в артефакте.
- bankcheck.js <bank.json> <gid> — прогон фраз банка через проверку (варианты принимаются, ловушки ловятся).
- course_steps.py — генератор последовательности курса (D.course).
Порядок в новом чате: git clone → cp tools/* /home/claude/ → echo -n TOKEN > /home/claude/.ghtoken → Artifact read → build → deploy.
