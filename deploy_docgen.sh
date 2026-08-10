#!/bin/bash
# Запускать на сервере (tmdata@10.10.0.177), из чекаута /opt/tmdata-frontend/docgen —
# WorkingDirectory в systemd/docgen.service совпадает с этим каталогом, отдельного
# rsync в /opt/tmdata, в отличие от frontend-приложений, не требуется — systemd
# запускает node прямо отсюда. Синхронизирует и сам systemd-юнит при изменении —
# повторного "sudo cp systemd/docgen.service /etc/..." руками быть не должно.
#
# Первый запуск на новом пути — разовый и не автоматизирован этим скриптом
# (переезд каталога/юнита с нуля — курица-и-яйцо, если сам скрипт лежит внутри
# переезжающего каталога), см. DEPLOYMENT.md §2.

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

# Синхронизация systemd-юнита с репозиторием — без этого правки в
# systemd/docgen.service остаются только в git, живой /etc/systemd/system/docgen.service
# не обновляется сам по себе (та же ловушка, на которой уже спотыкались с nginx.conf:
# источник в репо и то, что реально применено, — разные файлы, если их не синхронизировать).
echo "→ Синхронизация systemd-юнита..."
sudo mkdir -p /var/log/tmdata
sudo chown -R tmdata:tmdata /var/log/tmdata
if ! sudo cmp -s systemd/docgen.service /etc/systemd/system/docgen.service; then
    sudo cp systemd/docgen.service /etc/systemd/system/docgen.service
    sudo systemctl daemon-reload
    echo "  ✓ Юнит обновлён"
else
    echo "  ✓ Юнит не изменился"
fi

echo "→ Перезапуск сервиса..."
sudo systemctl restart docgen
sleep 1
sudo systemctl status docgen --no-pager -l || true

echo "=== DOC-GENERATOR DEPLOY DONE: $(date) ==="
