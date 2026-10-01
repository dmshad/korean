#!/bin/bash
# Выкладка пакета /home/claude/pkg/app в dmshad/korean (main). Аргумент — сообщение коммита.
set -e
T=$(cat /home/claude/.ghtoken)
rm -rf /home/claude/repo
git clone -q https://x-access-token:$T@github.com/dmshad/korean.git /home/claude/repo
cp /home/claude/pkg/app/* /home/claude/repo/
cd /home/claude/repo
git -c user.name="dmshad" -c user.email="dmshad@users.noreply.github.com" add -A
git -c user.name="dmshad" -c user.email="dmshad@users.noreply.github.com" commit -q -m "$1" && git push -q origin main && git log --oneline -1
