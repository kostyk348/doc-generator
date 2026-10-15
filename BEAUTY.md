# BEAUTY.md — что осталось за владельцем

Аудит (`repo_polish_audit.py`, прогон 14.10.2026) по этому репозиторию:

```
doc-generator   ★1  2026-08-17 → нет описания; нет тем; нет лицензии
```

У воркера нет задачи ставить GitHub-метаданные, теги и релизы. Ниже — только то, чего не сделать
из репозитория. Запускать после публикации локального коммита из этой ветки.

## 1. Решение владельца: репозиторий публичный, а README говорит «не для публичного распространения»

`gh api repos/kostyk348/doc-generator` → `"private": false, "visibility": "public"`, при этом README
и `LICENSE` (добавлен в этом коммите) описывают ПО как внутреннее.

Это противоречие в политике, а не в оформлении, и решается только владельцем:

```bash
# если ПО должно остаться внутренним — закрыть репозиторий:
gh repo edit kostyk348/doc-generator --visibility private --accept-visibility-change-consequences

# если репозиторий сознательно публичный (как витрина) — оставить как есть,
# но тогда стоит убрать из публичной истории данные о внутренних адресах/узлах
```

Внутренние адреса в репозитории есть (`DEPLOYMENT.md`, `deploy_docgen.sh`, `systemd/docgen.service`),
поэтому решение стоит принять осознанно. Проверить:

```bash
grep -rn "10\.10\.\|tmdata@\|/opt/tmdata" --include="*.md" --include="*.sh" --include="*.ts" . | head
```

## 2. Метаданные (описание, темы)

Описание пустое, тем нет:

```
desc: null
topics: []
```

Готовая команда (описание — без внутреннего адреса и без названия площадки, чтобы не светить лишнее):

```bash
gh repo edit kostyk348/doc-generator \
  --description "Офлайн-генератор официальных документов по ГОСТ Р 7.0.97–2025: бланки, авто-реквизиты, реестр исходящих с hash-chain контролем целостности, склонение ФИО, экспорт PDF/.eml, Electron-сборка. Внутреннее ПО." \
  --add-topic gost \
  --add-topic document-generator \
  --add-topic react \
  --add-topic typescript \
  --add-topic electron \
  --add-topic vite \
  --add-topic offline-first \
  --add-topic internal-tool
```

## 3. CI (в этом коммите добавлен впервые)

Проверено локально на чистом клоне (15.10.2026):

```
npm ci --ignore-scripts --no-audit --no-fund   → added 472 packages, exit 0
npm run lint  (tsc --noEmit)                   → exit 0, без вывода
npm test      (vitest run)                     → Test Files 7 passed (7), Tests 86 passed (86)
```

`.github/workflows/ci.yml` в этом коммите гоняет ровно эти три команды на Node 22
(`--ignore-scripts` — чтобы CI не пытался скачивать бинарь Electron).

## 4. Тег и релиз

Уместен **после** пуша и зелёного CI: в `package.json` уже `version: 1.0.0`, приложение задеплоено
на портал.

```bash
# после пуша и зелёного CI на main:
git tag -a v1.0.0 -m "v1.0.0 — генератор документов по ГОСТ: бланки, авто-реквизиты, реестр с hash-chain, экспорт PDF/.eml, Electron-сборка"
git push origin v1.0.0
gh release create v1.0.0 --title "v1.0.0" --notes-file CHANGELOG.md
```

`CHANGELOG.md` в этом коммите уже в формате Keep a Changelog — годится как notes-file.
Отдельно решить, нужен ли релиз вообще: ПО внутреннее, релизы имеют смысл как вехи для
деплоя (`prod`-ветка) — тогда тег стоит ставить на коммит `prod`, а не на `main`.
