#!/bin/bash
# Запускать на сервере (tmdata@10.10.0.177), из чекаута — WorkingDirectory
# в systemd/docgen.service совпадает с этим каталогом, отдельного rsync в
# /opt/tmdata, в отличие от frontend-приложений, не требуется — systemd
# запускает node прямо отсюда.

set -e

GIT_REMOTE="local"

echo "=== DOC-GENERATOR DEPLOY: $(date) ==="

echo "→ Обновление кода..."
git pull "$GIT_REMOTE" prod
echo "  ✓ $(git log -1 --oneline)"

if ! command -v node &>/dev/null; then
    echo "ОШИБКА: Node.js не установлен"
    exit 1
fi

echo "→ Установка зависимостей и сборка..."
npm install
npm run build
echo "  ✓ Сборка завершена"

echo "→ Перезапуск сервиса..."
sudo systemctl restart docgen
sleep 1
sudo systemctl status docgen --no-pager -l || true

echo "=== DOC-GENERATOR DEPLOY DONE: $(date) ==="
