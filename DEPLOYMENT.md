# Инструкция по деплою и интеграции `generator-doc-gost` на портал tmdata (/docgen/)

## 1. Архитектура и Базовый Путь (/docgen/)

Микросервис настроен на работу по относительному адресу `/docgen/`:
- **Vite Base Path**: `process.env.VITE_BASE_PATH` (по умолчанию `/docgen/`).
- **Express Backend (`server.ts`)**:
  - Слушает `PORT=3000` (по умолчанию).
  - API эндпоинты смонтированы одновременно на `/api/` и `/docgen/api/` (поддерживает как `proxy_pass http://127.0.0.1:3000/`, так и без усечения).
  - Статический клиент раздается Express по путям `/docgen` и `/` в production режиме.
- **Фронтенд вызовы**: `getApiBaseUrl()` динамически вычисляет базовый префикс (например, `/docgen/api/ai-text`).

---

## 2. Развертывание в systemd

1. Скопируйте файл сервиса в системный каталог:
   ```bash
   sudo cp systemd/docgen.service /etc/systemd/system/docgen.service
   ```

2. Создайте каталог для логов (если отсутствует):
   ```bash
   sudo mkdir -p /var/log/tmdata
   sudo chown -R wms:wms /var/log/tmdata
   ```

3. Создайте файл окружения `.env` в папке проекта `/home/wms/services/doc-generator/.env`:
   ```env
   NODE_ENV=production
   PORT=3000
   ALLOWED_ORIGIN=*
   ```

4. Соберите проект и запустите сервис:
   ```bash
   npm run build
   sudo systemctl daemon-reload
   sudo systemctl enable docgen
   sudo systemctl start docgen
   sudo systemctl status docgen
   ```

---

## 3. Настройка Nginx

Вставьте следующий блок в файл `drf_catalog_service/systemd/nginx.conf` (или аналогичный конфигурационный файл портала):

```nginx
location ^~ /docgen/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 90s;
}
```

Выполните перезагрузку конфигурации Nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 4. Интеграция с Авторизацией Portal-Core (JWT)

Для ограничения доступа на стороне фронтенда:
1. Установите `portal-core`:
   ```bash
   npm install portal-core@git+ssh://wms@10.10.0.165/home/wms/git-repos/tmdata/portal-core.git#master
   ```
2. В файле `src/App.tsx` подключите хук `useAuthGate` с правами доступа портала.
3. Дополнительно Nginx может использовать HTTP Basic Auth (`auth_basic`) для блокировки неавторизованных прямых вызовов на уровень `/docgen/`.

---

## 5. Пост-сообщения (PostMessage) и Возврат на Портал

Микросервис поддерживает обмен сообщениями:
- **`RETURN_TO_PORTAL`**: Кнопка «Вернуться на портал» отправляет событие `RETURN_TO_PORTAL` в родительское окно `window.parent.postMessage` и совершает навигацию назад на `document.referrer`.
- **`INIT_DOCUMENT`**: Инициализация данных документа из 1С/Портала.
- **`REGISTER_DOCUMENT`**: Запрос на авто-регистрацию документа в реестре.
