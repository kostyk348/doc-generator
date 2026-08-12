#!/bin/bash
# Запускать на сервере (tmdata@10.10.0.177) — из старого чекаута
# (/home/tmdata/develop/frontend/doc-generator) при самом первом запуске после
# переезда на новый путь, из /opt/tmdata-frontend/docgen во всех остальных случаях.
# WorkingDirectory в systemd/docgen.service совпадает с новым каталогом, отдельного
# rsync в /opt/tmdata, в отличие от frontend-приложений, не требуется — systemd
# запускает node прямо отсюда. Синхронизирует и сам systemd-юнит при изменении —
# повторного "sudo cp systemd/docgen.service /etc/..." руками быть не должно.

set -e

GIT_REMOTE="local"
OLD_DIR="/home/tmdata/develop/frontend/doc-generator"
NEW_DIR="/opt/tmdata-frontend/docgen"

echo "=== DOC-GENERATOR DEPLOY: $(date) ==="

# Разовый перенос со старого пути — идемпотентно: срабатывает только пока
# NEW_DIR не существует. Скрипт продолжает работать и после переезда каталога,
# из которого сам запущен, — открытый файловый дескриптор переживает и rename
# (один диск), и copy+unlink (разные диски); явный cd ниже нужен, чтобы
# дальнейшие относительные команды (npm, sudo cp systemd/...) резолвились
# уже из нового места.
if [[ -d "$OLD_DIR" && ! -d "$NEW_DIR" ]]; then
    echo "→ Разовый перенос: $OLD_DIR → $NEW_DIR..."
    sudo mkdir -p "$(dirname "$NEW_DIR")"
    sudo systemctl stop docgen 2>/dev/null || true
    sudo mv "$OLD_DIR" "$NEW_DIR"
    sudo chown -R tmdata:tmdata "$NEW_DIR"
    echo "  ✓ Перенесено"
fi
cd "$NEW_DIR"

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
sudo systemctl enable docgen >/dev/null 2>&1 || true

echo "→ Перезапуск сервиса..."
sudo systemctl restart docgen
sleep 1
sudo systemctl status docgen --no-pager -l || true

echo "=== DOC-GENERATOR DEPLOY DONE: $(date) ==="
