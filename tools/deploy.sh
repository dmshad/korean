#!/bin/bash
# Выкладка: deploy.sh "<сообщение>" [<артефакт.html> [язык=ko]]
# 1) пакет /home/claude/pkg/app → корень репозитория (приложение); 2) если указан артефакт — разбор на части в src/ и content/ (tools/split.py).
set -e
T=$(cat /home/claude/.ghtoken)
rm -rf /home/claude/repo
git clone -q https://x-access-token:$T@github.com/dmshad/korean.git /home/claude/repo
cp /home/claude/pkg/app/* /home/claude/repo/
if [ -n "$2" ]; then
  [ -d /home/claude/newtools ] && cp /home/claude/newtools/* /home/claude/repo/tools/
  ( cd /home/claude/repo && python3 tools/split.py "$2" "${3:-ko}" )
fi
cd /home/claude/repo
git -c user.name="dmshad" -c user.email="dmshad@users.noreply.github.com" add -A
git -c user.name="dmshad" -c user.email="dmshad@users.noreply.github.com" commit -q -m "$1" && git push -q origin main && git log --oneline -1
