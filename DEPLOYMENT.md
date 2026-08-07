# Инструкция по деплою и интеграции `generator-doc-gost` на портал tmdata (/docgen/)

## 1. Архитектура и Прод-Сервер (tmdata@10.10.0.177)

Микросервис разворачивается на продуктовом сервере портала **tmdata@10.10.0.177**:
- **Рабочий каталог на сервере**: `/home/tmdata/develop/frontend/doc-generator`
- **Системный пользователь**: `tmdata`
- **Vite Base Path**: `/docgen/` (задается в `vite.config.ts`)
- **Express Backend (`server.ts`)**:
  - Слушает `PORT=3000` (по умолчанию).
  - API эндпоинты смонтированы под `/api/` и `/docgen/api/`.
  - Статический клиент раздается Express по пути `/docgen`.
- **Фронтенд вызовы**: `getApiBaseUrl()` динамически вычисляет префикс `/docgen/api`.

---

## 2. Развертывание в systemd

1. Скопируйте файл сервиса в системный каталог:
   ```bash
   sudo cp systemd/docgen.service /etc/systemd/system/docgen.service
   ```

2. Создайте каталог для логов и установите владельца `tmdata:tmdata`:
   ```bash
   sudo mkdir -p /var/log/tmdata
   sudo chown -R tmdata:tmdata /var/log/tmdata
   ```

3. Создайте файл окружения `.env` в папке проекта `/home/tmdata/develop/frontend/doc-generator/.env`:
   ```env
   NODE_ENV=production
   PORT=3000
   ALLOWED_ORIGIN=*
   ```

4. Соберите проект и запустите сервис:
   ```bash
   cd /home/tmdata/develop/frontend/doc-generator
   npm run build
   sudo systemctl daemon-reload
   sudo systemctl enable docgen
   sudo systemctl start docgen
   sudo systemctl status docgen
   ```

---

## 3. Настройка Nginx

Вставьте следующий блок в файл `drf_catalog_service/systemd/nginx.conf` на сервере `10.10.0.177`:

```nginx
location ^~ /docgen/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 90s;
    
    # Защита на уровне Nginx
    auth_basic "TMDATA Portal - Doc Generator Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
}
```

Выполните перезагрузку конфигурации Nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 4. Защита доступа и Авторизация (Portal Auth Gate)

Приложение реализует двухуровневую защиту:
1. **Уровень Proxy/Nginx**: Включен `auth_basic` через `/etc/nginx/.htpasswd`.
2. **Уровень Фронтенда (`useAuthGate` / `PortalAuthGate`)**:
   - Реализована проверка портальной JWT-сессии `portal_token` / `access_token` из cookie или `localStorage`.
   - Поддерживает интеграцию с пакетом `portal-core` (`npm install portal-core@git+ssh://wms@10.10.0.165/home/wms/git-repos/tmdata/portal-core.git#master`).
   - При отсутствии валидной сессии приложение блокирует генерацию документов и отображает шлюз авторизации портала.


---

## 5. Пост-сообщения (PostMessage) и Возврат на Портал

Микросервис поддерживает обмен сообщениями:
- **`RETURN_TO_PORTAL`**: Кнопка «Вернуться на портал» отправляет событие `RETURN_TO_PORTAL` в родительское окно `window.parent.postMessage` и совершает навигацию назад на `document.referrer`.
- **`INIT_DOCUMENT`**: Инициализация данных документа из 1С/Портала.
- **`REGISTER_DOCUMENT`**: Запрос на авто-регистрацию документа в реестре.
