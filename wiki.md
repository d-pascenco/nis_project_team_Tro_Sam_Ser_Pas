# Полный воркфлоу создания и развертывания проекта с нуля

## Overview

В рамках проекта разработаны frontend на React и backend на FastAPI, настроены PostgreSQL, Cloudflare и сервер на Oracle Cloud Free Tier.
Ниже описана подробная последовательность действий команды, возникшие ошибки и способы их устранения.

## 1. Создание инстанса в Oracle Cloud

### 1.1 Создание инстанса
В Oracle Cloud Console:
- `Compute`
- `Instances`
- `Create Instance`

### 1.2 Параметры инстанса
При создании были выбраны следующие параметры:
- **Shape:** `VM.Standard.E2.1.Micro`
- **Image:** `Canonical Ubuntu 24.04`
- **Public IP:** включён
- **SSH key:** загружен при создании инстанса

## 2. Настройка сети Oracle Cloud
После создания нового инстанса потребовалась ручная проверка сетевой конфигурации.

### 2.1 Security List
В Security List были настроены входящие правила.

#### Ingress Rules
| Source     | Protocol | Destination Port | Назначение       |
|------------|----------|------------------|------------------|
| 0.0.0.0/0  | TCP      | 22               | SSH (для команды)|
| 0.0.0.0/0  | TCP      | 80               | HTTP             |
| 0.0.0.0/0  | TCP      | 443              | HTTPS            |
| 0.0.0.0/0  | TCP      | 5432             | postgres db      |

В дальнейшем на хосте открыть вышеперечисленные порты можно через следюущие команды: 
```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
```
И проверка внутри:
```bash
sudo iptables -L -n
```
- в секции INPUT должен быть правило с ACCEPT для вашего порта выше строки REJECT icmp-host-prohibited

Проверка снаружи:
```bash
ncat -zv наш_ip 80
```

### 2.5 Сохранение iptables-правил после перезагрузки

На Oracle Cloud iptables-правила сбрасываются при перезагрузке. Чтобы они применялись автоматически:

```bash
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

После этого правила сохраняются в `/etc/iptables/rules.v4` и восстанавливаются при каждом запуске системы.

Если сайт перестал открываться после перезагрузки (Cloudflare `523 Origin Unreachable`), в первую очередь проверяем iptables:

```bash
sudo iptables -L INPUT -n --line-numbers | grep -E '80|443'
```

Если правил нет — добавляем и сохраняем снова:

```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```
- ответ будет что-то вроде Ncat: Connected to ваш_ip:80.

### 2.2 Проверка подсети
Подсеть из коробки имела параметры:
- тип: `Public Subnet`
- CIDR: `10.0.0.0/24`
Это означало, что инстанс может использовать публичный доступ, но только при наличии правильного маршрута через Internet Gateway.

### 2.3 Internet Gateway
Для VCN был создан Internet Gateway.
Путь в интерфейсе:
- `Networking`
- `Virtual Cloud Networks`
- выбрать VCN
- `Internet Gateway`
- `Create Internet Gateway`

### 2.4 Route Table
В `Default Route Table` было добавлено правило:
- **Destination CIDR block:** `0.0.0.0/0`
- **Target Type:** `Internet Gateway`
Без этого правила внешний трафик до инстанса не доходил.

## 3. Первая диагностика SSH-доступа
После создания инстанса была попытка подключения по SSH.

### 3.1 Подключение по SSH
а. Linux. 
- Установка ssh-клиента (если нету):
```bash
sudo apt update && sudo apt install ssh
```
- Подключаемся:
```bash
ssh -i /путь/к/ssh-ключу/ssh-key-2026-04-12.key ubuntu@публичный_айпи_адрес_инстанса
```
б. Windows
- Установка ssh клиента:
"Пуск" → "Параметры" → "Приложения" → "Дополнительные компоненты" → "Добавить компонент" → найти OpenSSH Client → установить.
`Settings` - `Apps` - `Optional Features` - `Add a feature` - выбрать `OpenSSH Client` - установить
- Затем открываем powershell и подключаемся:
```bash
ssh -i C:\путь\к\ssh-ключу\ssh-key-2026-04-12.key ubuntu@публичный_айпи_адрес_инстанса
```

### 3.2 Ошибка прав на приватный ключ
```text
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Permissions 0644 for '/home/что-то там/ssh-key-2026-04-12.key' are too open.
This private key will be ignored.
Load key "/home/что-то там/ssh-key-2026-04-12.key": bad permissions
ubuntu@адрес_хоста: Permission denied (publickey).
```
- Решение:
Были изменены права на приватный ключ:
```bash
chmod 600 /путь к ключу/ssh-key-2026-04-12.key
```

### 3.3 Передача доступа команде
В проекте использовался не отдельный пользователь для каждого участника, а более простой вариант:
- участникам команды был передан один и тот же SSH-ключ
#### 3.3.1 Недостатки такого подхода
Этот способ работает, но имеет ограничения:
- отсутствует разграничение доступа
- нельзя выборочно отозвать доступ у одного участника
- при компрометации ключа скомпрометирован весь доступ к серверу
- действия всех участников выполняются под одним и тем же пользователем

Для учебного проекта такой способ использовался как самый быстрый.

## 4. Проверка характеристик системы
После успешного входа по SSH были выполнены команды для получения информации о системе.

### 4.1 Команды
```bash
uname -a
cat /etc/os-release
lscpu
cat /proc/meminfo | grep MemTotal
df -h
hostname -I
```

### 4.2 Полученные характеристики

По выводу системы:
- **OS:** Ubuntu 24.04.4 LTS
- **CPU:** 2 vCPU
- **RAM:** около 1 GB
- **Disk:** около 48 GB доступного пространства на корневом разделе

Можно одной командой:
```bash
echo "=== OS ===" && cat /etc/os-release | grep -E "PRETTY_NAME|VERSION" && echo "=== CPU ===" && lscpu | grep -E "Model name|CPU\(s\)" && echo "=== RAM ===" && cat /proc/meminfo | grep MemTotal && echo "=== DISK ===" && df -h
```

## 5. Обновление системы
После входа на сервер была выполнена базовая подготовка системы.

### 5.1 Обновление списка пакетов
```bash
sudo apt update
```

### 5.2 Установка обновлений
```bash
sudo apt upgrade -y
```

### 5.3 Установленные пакеты
На сервер были установлены базовые пакеты, необходимые для дальнейшей работы.
```bash
sudo apt install -y nginx
sudo apt install -y curl git
```
- `nginx` — веб-сервер
- `curl` — выполнение HTTP-запросов из консоли
- `git` — клонирование и обновление репозитория проекта
Также установлены:
- `nano` — текстовый редактор

Команды, которые помогут в навигации:
- `dpkg -l` — все существующие установленные пакеты и их назначение
- `apt-mark showmanual` — пользовательские, без авто

## 6. Настройка и запуск Nginx
Nginx — это веб-сервер, который быстро отдает статические файлы сайта (HTML, картинки) и работает как прокси: принимает запросы от пользователей и пересылает на другие серверы (балансировка нагрузки).
Альтернатива Apache: быстрее на статике, асинхронный. Конфиг в /etc/nginx/nginx.conf.

### 6.1 Установка, включение и запуск
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```
Проверка статуса:
```bash
systemctl status nginx
```

### 6.2 Проверка работы сайта по IP
Для проверки того, что веб-сервер реально отдаёт страницу, была создана тестовая HTML-страница.
```bash
echo '<html><body>ok</body></html>' | sudo tee /var/www/html/index.html
```
После этого страница должна открываться в браузере по адресу:
```text
http://<наш_ip_инстанса>
```

## 7. Пулим и собираем проект сайта
Репозиторий:
https://github.com/d-pascenco/nis_project_team_Tro_Sam_Ser_Pas.git

### 7.1 Переходим в домашнюю папку и клонируем проект из репозитория:
```bash
cd ~
git clone https://github.com/d-pascenco/nis_project_team_Tro_Sam_Ser_Pas.git
```
- Гит попросит логин и токен.

Проект находится в следующей директории:
```
/home/ubuntu/nis_project_team_Tro_Sam_Ser_Pas
```

Структура monorepo:
```
nis_project_team_Tro_Sam_Ser_Pas/
├── frontend/
├── backend/
├── scripts/deploy_host.sh
└── wiki.md        — документация
```

### 7.2 Устанавливаем зависимости и собираем frontend
```bash
cd nis_project_team_Tro_Sam_Ser_Pas/frontend
npm install
npm run build
```
Еще понадобятся команды:
`npm run dev` - Start the development server with auto-reloading and an instant preview.

### 7.3 После установки Nginx настроен на /var/www/html (дефолтная конфигурация nginx).
Поэтому при выкатке обновлений на сайт нужно будет делать следующее:
```bash
cd ~/nis_project_team_Tro_Sam_Ser_Pas
git pull --ff-only
bash scripts/deploy_host.sh
```

Скрипт `scripts/deploy_host.sh` автоматически:
- устанавливает зависимости и собирает frontend
- копирует `dist/` в web root
- обновляет Python venv бэкенда
- применяет SQL-миграции
- перезапускает `nextpath-backend`
- проверяет и reload'ит Nginx

### 7.4 Выдаем сайту сертификат через sertbot (переход с http на https)
HTTPS — обязательно для любого сайта с формами/данными. Бесплатно через Let’s Encrypt.
Certbot сам найдёт nginx и добавит SSL в конфиг /etc/nginx/sites-available/наш_сайт.ком

Установка:
```bash
sudo apt install -y certbot python3-certbot-nginx
```
Выдача:
```bash
sudo certbot --nginx -d nextpath.su -d www.nextpath.su
```

Что будет без сертификатов:
- браузеры пишут “Not secure”.
- пользователи закрывают сайт.
- Google/Yandex опускают в поиске.
- хакеры могут украсть данные.

## 8. Подключение Cloudflare
После того как сайт стал доступен по IP, был подключён Cloudflare. Это сделано для того, чтобы сайт был доступен из РФ.
Cloudflare использовался для:
- привязки домена к серверу
- маршрутизации трафика через прокси
- дальнейшей настройки HTTPS и DNS-управления

## 9. Установка и настройка базы данных

### 9.1 Установка
Выбран postgres движок.
Установка:
```bash
sudo apt install postgresql postgresql-contrib -y
```
Проверяем, что сервис запущен:
```bash
sudo systemctl status postgresql
```
Команда входа в СУБД из консоли:
```bash
sudo -u postgres psql
```
### 9.2 Создание базы данных и ролей
Создание базы:
```sql
CREATE DATABASE nextpath;
```
Создание ролей:
```sql
-- backend (postgres юзер, под которым бэк будет выполнять действия)
CREATE USER nextpath_app WITH PASSWORD 'strong_password';

-- юзер для команды (создан один юзер, чтобы проще было управлять доступом)
CREATE USER nextpath_admin WITH PASSWORD 'admin_password';
ALTER USER nextpath_admin WITH SUPERUSER;
```
Выдача доступа:
```sql
GRANT ALL PRIVILEGES ON DATABASE nextpath TO nextpath_app;
GRANT ALL PRIVILEGES ON DATABASE nextpath TO nextpath_admin;
```
### 9.3 Подключение к базе
Помимо программ клиентов для подключения к базе, можно подключаться через консоль:
```bash
\c nextpath
```
#### 9.3.1 Подключение из SQL клиента

Параметры:
```text
Host: публичный адрес нашего инстанса (выдан команде)
Port: 5432
Database: nextpath
User: nextpath_app
Password: наш пароль (выдан команде)
```

### 9.4 Настройка прав

Убираем superuser у backend:
```sql
ALTER USER nextpath_app NOSUPERUSER;
```
Доступ к схеме:
```sql
GRANT USAGE ON SCHEMA public TO nextpath_app;
```
Доступ к таблицам:
sql```
GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA public
TO nextpath_app;
```
Права по умолчанию:
```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLES TO nextpath_app;
```
### 9.5 Разрешение внешних подключений

По умолчанию PostgreSQL слушает только localhost.

Проверяем:
```bash
sudo ss -tulnp | grep 5432
```
Если выдает 127.0.0.1:5432 нужно изменить конфиг.

#### 9.5.1 postgresql.conf

При работе из Arch может прийти ошибка nano (xterm-kitty). Исправить ее можно, задав временно `export TERM=xterm`

Редактируем конфиг.
Открываем:
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```
Находим строку `#listen_addresses = 'localhost'`
Заменяем на `listen_addresses = '*'`

#### 9.5.2 pg_hba.conf

```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```
Добавить правила:
```text
host    nextpath    nextpath_app    0.0.0.0/0    md5
host    nextpath    nextpath_admin  0.0.0.0/0    md5
```
И перезапускаем сервис:
```bash
sudo systemctl restart postgresql
```
Проверяем:
```bash
sudo ss -tulnp | grep 5432
```
Ожидаемый результат `0.0.0.0:5432`.

## 00. Тесты backend

Директория `backend/tests/` содержит интеграционные тесты API на базе `FastAPI TestClient`.

Запуск:
```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

Зависимость от реальной БД отсутствует — используется `FakeDb`, подменяющий SQLAlchemy-сессию.

Тест-кейсы:
- `test_health` — проверяет `/api/health`, ожидает `{"status": "ok"}`
- `test_submit_onboarding_form_with_frontend_camel_case_payload` — проверяет, что `POST /api/forms` принимает camelCase-поля от фронтенда и возвращает 201
- `test_submit_onboarding_form_validates_ranges` — проверяет отклонение некорректных значений (422)

## 10. Backend для формы сайта

Backend-сервис принимает данные onboarding-формы с фронтенда и сохраняет их в PostgreSQL.

### 10.1 Какие frontend-поля сохраняем

В `src/pages/Onboarding.tsx` форма состоит из 5 шагов:

| Шаг сайта | Компонент frontend | Поля payload |
|-----------|--------------------|--------------|
| О вас | `BasicInfoStep` | `fullName`, `age`, `location`, `currentStatus` |
| Образование | `EducationStep` | `education`, `university`, `specialization`, `yearsExperience`, `currentRole`, `cvSummary` |
| Цели | `GoalsStep` | `targetProfession`, `targetIndustry`, `timeline`, `motivation`, `priorities` |
| Навыки | `SkillsStep` | `technicalSkills`, `softSkills`, `languages`, `learningStyle` |
| Ограничения | `ConstraintsStep` | `hoursPerWeek`, `budget`, `healthConsiderations`, `preferOnline`, `preferRussian`, `needMentorship`, `additionalInfo` |
| Расписание занятости |||

Backend принимает именно эти camelCase-ключи, поэтому на фронтенде можно отправлять `JSON.stringify(formData)` без ручного переименования полей.

### 10.2 Что добавлено в репозиторий

В репозитории появился каталог `backend/`:

- `backend/app/main.py` — FastAPI-приложение с endpoint'ами `/api/health` и `/api/forms`.
- `backend/app/database.py` — подключение SQLAlchemy к PostgreSQL через `DATABASE_URL`.
- `backend/app/models.py` — SQLAlchemy-модель таблицы `user_forms`.
- `backend/app/schemas.py` — Pydantic-схемы, которые валидируют реальные поля формы сайта.
- `backend/sql/001_create_user_forms.sql` — SQL-скрипт для ручного создания таблицы и выдачи прав `nextpath_app`.
- `backend/.env.example` — пример переменных окружения для хоста.
- `backend/tests/test_api.py` — базовые тесты API без подключения к реальной базе.

### 10.3 Таблица для onboarding-формы

Backend пишет данные формы в таблицу `user_forms`.

Ключевые поля таблицы:

```sql
CREATE TABLE IF NOT EXISTS user_forms (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255),
    age INTEGER,
    location VARCHAR(255),
    current_status VARCHAR(100),
    education VARCHAR(255),
    university VARCHAR(255),
    specialization VARCHAR(255),
    years_experience INTEGER,
    current_role VARCHAR(255),
    cv_summary TEXT,
    target_profession VARCHAR(255),
    target_industry VARCHAR(255),
    timeline VARCHAR(100),
    motivation TEXT,
    priorities JSONB NOT NULL DEFAULT '[]'::jsonb,
    technical_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    soft_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    languages JSONB NOT NULL DEFAULT '[]'::jsonb,
    learning_style VARCHAR(255),
    hours_per_week INTEGER,
    budget VARCHAR(255),
    health_considerations TEXT,
    prefer_online BOOLEAN,
    prefer_russian BOOLEAN,
    need_mentorship BOOLEAN,
    additional_info TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Полный SQL лежит в `backend/sql/001_create_user_forms.sql`.

### 10.4 Локальный запуск backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Проверка, что backend запущен:

```bash
curl http://127.0.0.1:8000/api/health
```

Ожидаемый ответ:

```json
{"status":"ok"}
```

### 10.5 Проверка записи формы

```bash
curl -X POST http://127.0.0.1:8000/api/forms \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Test User","age":"21","currentStatus":"student","targetProfession":"Data Scientist","hoursPerWeek":15,"technicalSkills":["Python","SQL"],"languages":[{"name":"English","level":70}]}'
```

Если PostgreSQL доступен и переменная `DATABASE_URL` настроена правильно, backend вернет `id`, сообщение об успешном сохранении и `created_at`.

Проверка в PostgreSQL:

```sql
SELECT id, full_name, target_profession, hours_per_week, created_at
FROM user_forms
ORDER BY id DESC
LIMIT 5;
```

### 10.6 Переменные окружения для production

На сервере нужно задать:

```bash
DATABASE_URL=postgresql://nextpath_app:REAL_PASSWORD@127.0.0.1:5432/nextpath
APP_HOST=127.0.0.1
APP_PORT=8000
FRONTEND_ORIGINS=https://nextpath.su,https://www.nextpath.su
CREATE_TABLES_ON_STARTUP=true
```

Пароль в `DATABASE_URL` нужно заменить на реальный пароль пользователя `nextpath_app`.

### 10.7 Подключение frontend

При нажатии кнопки "Создать карту" на последнем шаге `src/pages/Onboarding.tsx` отправляет данные формы на backend:

```ts
await fetch("/api/forms", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(formData),
});
```
Backend принимает camelCase-ключи напрямую из `FormData`, поэтому дополнительный маппинг на фронтенде не нужен.

### 10.8 Production-запуск backend через systemd

На хосте backend держится отдельным systemd-сервисом — автоматически перезапускается после падения или перезагрузки сервера.

Файл `/etc/systemd/system/nextpath-backend.service`:

```ini
[Unit]
Description=NextPath FastAPI Backend
After=network.target postgresql.service

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/nis_project_team_Tro_Sam_Ser_Pas/backend
EnvironmentFile=/home/ubuntu/nis_project_team_Tro_Sam_Ser_Pas/.env
ExecStart=/home/ubuntu/nis_project_team_Tro_Sam_Ser_Pas/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Команды запуска:

```bash
sudo systemctl daemon-reload
sudo systemctl enable nextpath-backend
sudo systemctl start nextpath-backend
sudo systemctl status nextpath-backend
journalctl -u nextpath-backend -f
```

### 10.9 Nginx reverse proxy для API

В конфиг сайта Nginx нужно добавить проксирование API на локальный backend:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

После изменения конфига:

```bash
sudo nginx -t
sudo systemctl reload nginx
curl https://nextpath.su/api/health
```

### 10.10 Важное замечание по PostgreSQL

После появления backend не нужно держать PostgreSQL открытым наружу на `0.0.0.0/0`, если база и backend находятся на одном сервере.

Лучше схема такая:

```text
Пользователь → HTTPS → nginx → FastAPI backend → PostgreSQL localhost
```

То есть PostgreSQL должен быть доступен backend-у через `127.0.0.1:5432`, а внешний порт `5432` лучше закрыть, если он больше не нужен команде для прямого подключения из SQL-клиентов.

## 11. Деплой monorepo на хост

Проект деплоится как monorepo:

```text
nis_project_team_Tro_Sam_Ser_Pas/
├── frontend/
├── backend/
├── scripts/deploy_host.sh
└── wiki.md
```

Схема деплоя:

1. Клонировать repo в `/home/ubuntu/nis_project_team_Tro_Sam_Ser_Pas`.
2. Создать `.env` из `.env.example` с реальным `DATABASE_URL`.
3. Создать systemd-service `nextpath-backend`.
4. Добавить в Nginx reverse proxy `/api/` на `127.0.0.1:8000` и SPA fallback.
5. Запустить `bash scripts/deploy_host.sh`.
6. Проверить `https://nextpath.su/onboarding` и `https://nextpath.su/api/health`.

### 12.1 Первый деплой на хост

```bash
cd /home/ubuntu
git clone https://github.com/d-pascenco/nis_project_team_Tro_Sam_Ser_Pas.git
cd nis_project_team_Tro_Sam_Ser_Pas
cp .env.example .env
nano .env   # прописать DATABASE_URL и остальные переменные
bash scripts/deploy_host.sh
```

### 11.2 Команды диагностики хоста

```bash
sudo nginx -t
sudo systemctl status nginx --no-pager
sudo systemctl status nextpath-backend --no-pager
sudo ss -tulnp | grep -E ':(80|443|5432|8000)\b'
node -v && npm -v && python3 --version
```

### 11.3 Как настроить push с локального repo на production

Есть два варианта:

- проще: пушить в GitHub, а на хосте делать `git pull --ff-only && bash scripts/deploy_host.sh`;
- удобнее: создать bare repo `/home/ubuntu/git/nis_project_team_Tro_Sam_Ser_Pas.git` на хосте и добавить локальный remote `prod`, чтобы `git push prod main` запускал deploy hook.

Подробные команды для обоих вариантов описаны в секции 12 этого документа.

### 11.4 `.env` и Nginx-конфиг

Секреты хранятся в корневом `.env` (игнорируется Git). Файл создаётся из `.env.example`:

```bash
cp .env.example .env
```

Минимальное содержимое:

```env
DATABASE_URL=postgresql://nextpath_app:PASSWORD@127.0.0.1:5432/nextpath
APP_HOST=127.0.0.1
APP_PORT=8000
FRONTEND_ORIGINS=https://nextpath.su,https://www.nextpath.su
CREATE_TABLES_ON_STARTUP=true
```

Nginx-конфиг сайта: `/etc/nginx/sites-enabled/nextpath.su`. В нём SSL от Certbot и SPA fallback. Нужный блок для API:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
}
```

## 12. Подключение фронтенда к бэкенду

### 12.1 Проблема

После реализации backend кнопка "Создать карту" на последнем шаге формы не отправляла никаких данных. В `src/pages/Onboarding.tsx` функция `handleNext()` просто вызывала `setShowRoadmap(true)` без fetch-запроса.

Проверка подтвердила — в задеплоенном JS-бандле строка `api/forms` не встречается:

```bash
grep -c 'api/forms' /var/www/html/assets/*.js
# 0
```

### 12.2 Добавление fetch

В `Onboarding.tsx` добавлена асинхронная функция `submitForm()`, которая отправляет данные формы перед показом роудмапа:

```ts
const submitForm = async () => {
  setIsSubmitting(true);
  try {
    await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
  } catch {
    // не блокируем пользователя при сетевой ошибке
  } finally {
    setIsSubmitting(false);
  }
  setShowRoadmap(true);
};
```

### 12.3 Ошибка 422: пустые строки в числовых полях

После добавления fetch форма стала отправляться, но backend возвращал `422 Unprocessable Entity`. Причина: поля `age` и `yearsExperience` в `FormData` имеют тип `string` и при пустом значении отправляются как `""`. Backend ожидает `int | None`, и Pydantic v2 не может сконвертировать пустую строку в число.

Исправление в `backend/app/schemas.py` — добавлен валидатор:

```python
@field_validator("age", "years_experience", "hours_per_week", mode="before")
@classmethod
def coerce_empty_string_to_none(cls, value: Any) -> Any:
    if value == "" or value is None:
        return None
    return value
```

### 12.4 Диагностика production

Последовательность диагностики при проблемах с API:

```bash
# статус сервиса и логи
sudo systemctl status nextpath-backend --no-pager
journalctl -u nextpath-backend -n 50 --no-pager

# бэкенд слушает порт
sudo ss -tulnp | grep 8000

# health check напрямую и через nginx
curl -s http://127.0.0.1:8000/api/health
curl -s https://nextpath.su/api/health

# изменения попали в сборку
grep -c 'api/forms' /var/www/html/assets/*.js

# данные в базе
psql -h 127.0.0.1 -U nextpath_app -d nextpath -c \
  "SELECT id, full_name, target_profession, created_at FROM user_forms ORDER BY id DESC LIMIT 5;"
```

## 13. Валидация формы на фронтенде

### 13.1 Обязательные поля

Не все поля формы обязательны — только те, без которых нельзя построить роудмап:

| Шаг | Обязательные поля |
|-----|-------------------|
| О вас | Полное имя, Текущий статус |
| Образование | Уровень образования |
| Цели | Желаемая профессия, Срок достижения |
| Навыки | — |
| Ограничения | — |

### 13.2 Обязательные поля (расширенный список)

После ревью требований список обязательных полей был расширен:

| Шаг | Обязательные поля | Дополнительные условия |
|-----|-------------------|------------------------|
| О вас | Полное имя, Возраст, Город, Текущий статус | — |
| Образование | Уровень образования, Учебное заведение, Специальность, Опыт работы | CV: минимум 300 символов |
| Цели | Желаемая профессия, Индустрия, Срок, Приоритеты (≥1) | Мотивация: минимум 50 символов |
| Навыки | — | — |
| Ограничения | — | — |

### 13.3 Реализация

В `Onboarding.tsx` функция `getStepError()` возвращает конкретное сообщение для первого незаполненного поля текущего шага. При нажатии "Далее" с незаполненными полями переход не происходит и сообщение отображается под формой.

Для полей с минимальной длиной добавлены счётчики символов прямо в UI:
- CV: счётчик `X / 300`, красный пока не набрано 300 символов
- Мотивация: счётчик `X / 50`, красный пока не набрано 50 символов

Обязательные поля в шагах помечены `*` красным. Сообщение об ошибке сбрасывается при изменении любого поля или при переходе назад.

## 14. AI-генерация персонального роудмапа через Groq

### 14.1 Выбор провайдера

Для генерации персонального плана развития подключён [Groq](https://console.groq.com) — бесплатный API с очень высокой скоростью инференса. Используется модель `llama-3.3-70b-versatile`.

Преимущества перед OpenAI:
- бесплатный tier без привязки карты
- скорость генерации ~3–5 секунд на роудмап
- достаточное качество для структурированного JSON-вывода

### 14.2 Установка зависимости

```bash
pip install groq==0.13.0
```

В `backend/requirements.txt`:
```
groq==0.13.0
```

### 14.3 Переменная окружения

```env
GROQ_API_KEY=gsk_...  # ключ с console.groq.com
```

Добавляется в корневой `.env` на хосте. Если переменная не задана, endpoint возвращает `503` и фронтенд показывает статичный fallback-роудмап.

### 14.4 Endpoint POST /api/roadmap

Backend принимает те же camelCase-поля, что и `/api/forms`. Формирует промпт с профилем пользователя и запрашивает у Groq JSON-объект со структурой:

```json
{
  "stages": [
    {
      "id": 1,
      "title": "Основы Python",
      "duration": "4 недели",
      "skills": ["Python", "Jupyter", "NumPy"],
      "resources": ["Stepik", "Kaggle", "YouTube"]
    }
  ],
  "total_duration": "6 месяцев",
  "summary": "..."
}
```

Промпт учитывает: целевую профессию, индустрию, текущие навыки, часы в неделю, бюджет, предпочтение русского языка.

Используется `response_format={"type": "json_object"}` для гарантированного JSON-вывода.

### 14.5 Поток на фронтенде

При нажатии "Создать карту":

1. Данные формы сохраняются в БД (`POST /api/forms`) — fire-and-forget, не блокирует UI.
2. Показывается страница роудмапа с индикатором загрузки ("Генерируем персональный план...").
3. Параллельно выполняется запрос к `POST /api/roadmap`.
4. При успехе — отображается персональный план.
5. При ошибке (503/502/network) — тихо показывается статичный fallback.

### 14.6 Диагностика

В консоли браузера (F12 → Console) виден лог:

```
[roadmap] generated: {stages: [...], total_duration: "...", summary: "..."}
```

Или при ошибке:

```
[roadmap] error response: 503 {detail: "Roadmap generation unavailable: GROQ_API_KEY not set"}
[roadmap] fetch failed: TypeError: ...
```

На хосте ошибки логируются через `logging`:

```bash
journalctl -u nextpath-backend -f | grep roadmap
```

## 15. Авторизация через Google OAuth и личный кабинет

### 15.1 Архитектура

Авторизация построена на Google Identity Services (GIS) — пользователь нажимает кнопку "Войти через Google", Google возвращает ID-токен, бэкенд верифицирует токен и выдаёт собственный JWT.

```text
Браузер → Google (OAuth) → ID-токен → POST /api/auth/google → JWT → localStorage
```

JWT хранится в `localStorage` под ключом `nextpath_token`. Все защищённые запросы передают его в заголовке `Authorization: Bearer <token>`.

### 15.2 Настройка Google Cloud

1. Перейти на [console.cloud.google.com](https://console.cloud.google.com)
2. Создать проект или выбрать существующий
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Name: `NextPath` (только для консоли)
6. **Authorized JavaScript origins:**
   ```
   https://nextpath.su
   https://www.nextpath.su
   http://localhost:5173
   ```
7. **Authorized redirect URIs:** оставить пустым — используется implicit flow через JavaScript origins
8. Скопировать **Client ID** вида `1234567890-abc.apps.googleusercontent.com`

### 15.3 Переменные окружения

В корневом `.env` на хосте и локально:

```env
GOOGLE_CLIENT_ID=1234...apps.googleusercontent.com
JWT_SECRET=любая-длинная-случайная-строка
VITE_GOOGLE_CLIENT_ID=1234...apps.googleusercontent.com
```

`VITE_` префикс обязателен для Vite — только так переменная попадает в браузерный бандл.

### 15.4 Backend-зависимости

```bash
pip install google-auth==2.38.0 python-jose[cryptography]==3.4.0
```

Верификация Google ID-токена:

```python
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

id_info = id_token.verify_oauth2_token(
    credential,
    google_requests.Request(),
    GOOGLE_CLIENT_ID,
)
```

После верификации создаётся или находится пользователь в таблице `users`, выдаётся JWT.

### 15.5 Таблица users

```sql
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    google_id   VARCHAR(255) NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    name        VARCHAR(255),
    picture     TEXT,
    roadmap     JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Роудмап хранится как JSONB-объект прямо в строке пользователя.

Применить миграцию на хосте:

```bash
psql -h 127.0.0.1 -U nextpath_app -d nextpath \
  -f ~/nis_project_team_Tro_Sam_Ser_Pas/backend/sql/002_create_users.sql
```

### 15.6 Endpoints

| Метод | URL | Описание |
|-------|-----|----------|
| `POST` | `/api/auth/google` | Верифицирует Google ID-токен, создаёт пользователя, возвращает JWT |
| `GET` | `/api/me` | Возвращает профиль и сохранённый роудмап (требует Bearer) |
| `POST` | `/api/me/roadmap` | Сохраняет роудмап пользователя (требует Bearer) |

### 15.7 Frontend-пакет

```bash
npm install @react-oauth/google
```

В `App.tsx` весь граф компонентов оборачивается в `GoogleOAuthProvider`:

```tsx
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
  ...
</GoogleOAuthProvider>
```

### 15.8 Поток авторизации с сохранением роудмапа

1. Пользователь просматривает сгенерированный роудмап.
2. Нажимает "Войти и сохранить план" — открывается диалог с кнопкой Google.
3. После успешного входа:
   - JWT и данные пользователя сохраняются в `localStorage`.
   - Если есть текущий роудмап — он сохраняется через `POST /api/me/roadmap`.
   - Пользователь перенаправляется на `/profile`.
4. На странице `/profile` отображается аватар, имя и сохранённый план.

### 15.9 Утилиты auth (frontend/src/lib/auth.ts)

```ts
export const getToken = () => localStorage.getItem("nextpath_token");
export const setToken = (t: string) => localStorage.setItem("nextpath_token", t);
export const clearToken = () => { localStorage.removeItem("nextpath_token"); ... };
export const isAuthenticated = () => !!getToken();
export const authHeaders = () => ({ Authorization: `Bearer ${getToken()}`, ... });
```

## 16. UX-улучшения роудмапа

### 16.1 Скачать план (HTML)

Кнопка "Скачать план" генерирует полноценный самодостаточный HTML-файл через `generateRoadmapHTML` из `frontend/src/lib/generate-html.ts`. Файл скачивается автоматически без диалога печати.

Особенности:
- Тёмный дизайн в стиле сайта (`#0a0503` фон, цветные рамки этапов)
- Все 6 вкладок раскрыты: Обзор, Расписание, Недели, Практика, Ресурсы, Образ жизни
- Интерактивность: JS внутри файла — переключение вкладок, открытие/закрытие этапов
- Ссылки на ресурсы открываются в новой вкладке
- Работает офлайн — никаких внешних зависимостей
- Имя файла: `nextpath-{profession}.html`

Реализация — статичный импорт модуля в `RoadmapPreview.tsx`:
```ts
import { generateRoadmapHTML } from "@/lib/generate-html";

const handleDownload = () => {
  const html = generateRoadmapHTML({ roadmapData, userName, ... });
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  // ... скачиваем через <a>
};
```

### 16.2 Публичные ссылки (Поделиться)

Кнопка "Поделиться" создаёт уникальную ссылку вида `nextpath.su/shared/{uuid}`:

1. Фронтенд вызывает `POST /api/share` с данными роудмапа
2. Бэкенд сохраняет в таблицу `shared_roadmaps` (UUID генерируется Python)
3. Возвращает `{id: "uuid-here"}`
4. Фронтенд копирует `nextpath.su/shared/{id}` в буфер

Страница `/shared/:id` — публичная, без авторизации, показывает полный роудмап.

```sql
CREATE TABLE IF NOT EXISTS shared_roadmaps (
    id         VARCHAR(36) PRIMARY KEY,
    roadmap    JSONB NOT NULL,
    profession VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 16.3 Кликабельные ресурсы и навигация

- Ресурсы в каждом этапе — кликабельные ссылки с маппингом платформ (`lib/constants.ts`)
- Логотип ведёт на главную через `<Link to="/">` из react-router-dom
- Кнопка "Начать обучение" открывает модальное окно с ресурсами этапа

## 17. Визуальный граф роудмапа

Компонент `RoadmapVisual.tsx` — полноэкранный модальный граф в тёмном стиле.

**Структура (снизу вверх — от старта к цели):**
```
[GOAL — целевая профессия, требования, портфолио]
         |
[Этап 1 — текущий, выделен цветом, метка "СЕЙЧАС"]
         |
[Этап 2 ... Этап N]
         |
[START — пользователь, текущая занятость]
```

**6 вкладок в каждом этапе:**
- Обзор — навыки, инструменты, ценность для найма, критерий завершения
- Расписание — утренний блок, учебные сессии, вечерний ритуал, ритм недели
- Недели — план по неделям с задачами
- Практика — проекты и результаты этапа
- Ресурсы — ссылки с типом ресурса (курс, видео, практика)
- Жизнь — режим дня, тренировки, питание, признаки выгорания

GOAL-узел при клике раскрывает список требований работодателей и рекомендуемые проекты для портфолио.

Кнопка "Карта развития" доступна на странице роудмапа и в кабинете (разделы "Обзор" и "Мой план").

## 18. Полный личный кабинет (my.nextpath.su)

Личный кабинет (`frontend/src/pages/Profile.tsx`) — отдельный домен `my.nextpath.su`.

### Разделение доменов

```text
nextpath.su        → публичный сайт + форма онбординга
my.nextpath.su     → личный кабинет (только для авторизованных)
```

Оба домена отдают одни и те же статичные файлы из `/var/www/html`. Роутинг определяется по `window.location.hostname` в `App.tsx`:
- `hostname.startsWith("my.")` → `CabinetRoutes`
- иначе → `MainRoutes`

**Проблема cross-subdomain localStorage**: токен сохранённый на `nextpath.su` не доступен на `my.nextpath.su`. Решение — передача токена через URL при редиректе:
```
nextpath.su → авторизация → goToCabinet("/profile", token)
→ my.nextpath.su/profile?t=TOKEN
→ App.tsx извлекает ?t= и сохраняет в localStorage
→ CabinetGuard видит авторизацию
```

**Прямой вход** на `my.nextpath.su` (без редиректа) — показывается страница входа `CabinetLoginPage` прямо на поддомене с кнопкой Google Sign-In.

### Разделы кабинета

| Раздел | Содержимое |
|--------|------------|
| **Обзор** | Приветствие, 4 стата (этапов/выполнено/прогресс/осталось), прогресс-бар, текущий этап, кнопки "Карта развития" и "Скачать план" |
| **Мой план** | Роудмап с чекбоксами на каждом этапе (прогресс автосохраняется), кнопка "Карта развития" |
| **Профиль** | Аватар Google, редактирование имени (карандаш → inline edit), email, учётные данные |
| **Настройки** | Редактирование имени, кнопки "Редактировать профиль" и "Обновить план", выход |

### Редактирование профиля и пересчёт плана

Кнопка "Редактировать профиль" открывает `Sheet` с полной формой из 6 вкладок (все шаги онбординга), предзаполненной сохранёнными данными.

**"Сохранить"** → `POST /api/me/save-form` — только данные формы.

**"Обновить план"** → `POST /api/me/recalculate` — данные + новый AI-роудмап → переключает на вкладку "Мой план".

**Кнопка "Обновить план" в Настройках** → прямой вызов `POST /api/me/recalculate` с текущими сохранёнными данными (без открытия редактора).

### База данных для кабинета

```sql
-- Пользователи
CREATE TABLE users (
    id               SERIAL PRIMARY KEY,
    google_id        VARCHAR(255) UNIQUE NOT NULL,
    email            VARCHAR(255) UNIQUE NOT NULL,
    name             VARCHAR(255),
    picture          TEXT,
    roadmap          JSONB,
    form_data        JSONB,
    completed_stages JSONB NOT NULL DEFAULT '[]',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Расшаренные роудмапы
CREATE TABLE shared_roadmaps (
    id         VARCHAR(36) PRIMARY KEY,
    roadmap    JSONB NOT NULL,
    profession VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 19. Комплексный роудмап (расписание и образ жизни)

### Структура этапа (новые поля)

Каждый этап роудмапа содержит:

| Поле | Описание |
|------|----------|
| `goal` | Измеримая цель к концу этапа |
| `tools` | Конкретные инструменты (VS Code, Git, Jupyter...) |
| `resources` | Объекты `{name, platform, type, time}` вместо строк |
| `weekly_plan` | Разбивка по неделям с задачами на каждую |
| `projects` | 1-2 практических проекта с описанием |
| `deliverables` | Конкретные артефакты (репозиторий, сертификат) |
| `checkpoint` | Критерий завершения этапа |
| `job_relevance` | Ценность для резюме и собеседования |
| `daily_schedule` | Утро, учебные блоки, вечер, перерывы |
| `weekly_rhythm` | Расписание по дням недели |
| `lifestyle` | Сон, тренировки, питание, deep work, выгорание |
| `motivation_tips` | Психологические советы |
| `common_mistakes` | Типичные ошибки этапа |

Роудмап в целом содержит:

| Поле | Описание |
|------|----------|
| `final_goal` | `{title, requirements[], portfolio[]}` |
| `life_system` | Тайм-менеджмент, ритуалы, трекинг прогресса |

### Контекст промпта

Промпт передаёт в модель:
- Текущие hard/soft skills и желаемые для освоения
- Расписание занятости из формы (Работа 09:00–18:00, Сон 23:00–07:00...)
- Учебные блоки планируются в незанятые временные окна

### Токенный лимит

Groq бесплатный tier: 100K токенов/день. Один запрос занимает ~8-10K токенов.

- `max_tokens=4000`
- При ошибке 429 (превышение лимита) автоматически пробуется модель `llama-3.1-8b-instant`
- При исчерпании обеих моделей пользователь получает сообщение с просьбой подождать час

## 20. Расширенная форма онбординга

### Шаги формы (6 шагов)

| Шаг | Название | Ключевые поля |
|-----|----------|---------------|
| 1 | О вас | Имя, возраст, страна, город (по стране), статус |
| 2 | Образование | Уровень, вуз (мировые), специальность, опыт, CV (мин. 300 символов) |
| 3 | Цели | Профессия (autocomplete 60+ RU+EN), индустрия, срок, приоритеты, мотивация (мин. 50 символов) |
| 4 | Навыки | Текущие hard/soft + желаемые hard/soft + языки |
| 5 | Ограничения | Часы/нед (слайдер с подсказкой), бюджет, здоровье, предпочтения |
| 6 | Расписание | Текущая занятость с временными блоками |

### Ключевые UX-решения

**Autocomplete** (`Autocomplete.tsx`) — подсказки при вводе с подсветкой совпадения, навигацией стрелками, поддержкой Escape.

**Города по стране** — при выборе страны автодополнение для города показывает только города этой страны (35+ стран с отдельными списками).

**Навыки в 4 блоках** — разделение текущих и желаемых навыков (2 категории × 2 типа = 4 блока).

**Вставка через запятую** — поле навыков принимает "Python, React, SQL" → 3 тега.

**Расписание** — пресеты (Работа, Сон, Тренировки...), время через `type="time"` с корректной шириной для AM/PM.

**Политика обработки данных** — чекбокс согласия на последнем шаге. Кнопка "Создать карту" заблокирована пока не отмечено.

### SQL-миграции

| Файл | Содержимое |
|------|------------|
| `001_create_user_forms.sql` | Основная таблица форм |
| `002_create_users.sql` | Пользователи (Google OAuth) |
| `003_alter_users_add_progress.sql` | Прогресс этапов |
| `004_alter_users_add_form_data.sql` | Данные формы в профиле |
| `005_alter_user_forms_add_schedule.sql` | Расписание занятости |
| `006_alter_user_forms_add_target_skills.sql` | Желаемые навыки |
| `007_alter_user_forms_add_country.sql` | Страна пользователя |
| `008_create_shared_roadmaps.sql` | Публичные ссылки |

## 21. Экран генерации роудмапа

При нажатии "Создать карту" показывается полноэкранный overlay `RoadmapGenerating.tsx`:

- Тёмный радиальный градиент фон
- Большой прогресс-бар (0→100%)
- 8 шагов с индивидуальными мини-барами и иконками
- При завершении API — анимация ускоряется ×5
- Переход управляется `useEffect` в `Onboarding.tsx` (не внутри компонента)

```tsx
// Onboarding.tsx — надёжный переход без stale closure
useEffect(() => {
  if (!showGenerating || roadmapLoading) return;
  const elapsed = Date.now() - generatingStart.current;
  const wait = Math.max(0, 4500 - elapsed) + 500;
  const t = setTimeout(() => {
    setShowGenerating(false);
    setShowRoadmap(true);
  }, wait);
  return () => clearTimeout(t);
}, [showGenerating, roadmapLoading]);
```

Минимальное время показа — 4.5 секунды, независимо от скорости ответа API.

## 22. Архитектура фронтенда (актуальная)

### Ключевые файлы

```
src/
  types.ts              — все типы (RoadmapData, OnboardingFormData, ScheduleItem...)
  lib/
    auth.ts             — JWT в localStorage (getToken, setToken, authHeaders)
    urls.ts             — логика доменов (IS_CABINET_DOMAIN, goToCabinet)
    constants.ts        — PROFESSION_LABELS, STAGE_COLORS, getResourceUrl
    suggestions.ts      — CITIES_BY_COUNTRY, UNIVERSITIES, PROFESSIONS, LANGUAGES
    generate-html.ts    — генератор HTML-файла для скачивания
  components/
    RoadmapPreview.tsx  — карточки роудмапа + download + share + CTA
    RoadmapVisual.tsx   — fullscreen тёмный граф
    RoadmapGenerating.tsx — экран загрузки
    ProfileEditForm.tsx — форма редактирования в кабинете (Sheet)
    Autocomplete.tsx    — переиспользуемый autocomplete
    steps/              — 6 шагов онбординга
  pages/
    Index.tsx           — лендинг nextpath.su
    Onboarding.tsx      — форма + роудмап (nextpath.su)
    Profile.tsx         — личный кабинет (my.nextpath.su)
    Shared.tsx          — публичная страница роудмапа (/shared/:id)
  App.tsx               — домен-aware роутинг
```

### Роутинг

```text
nextpath.su/           → Index (лендинг)
nextpath.su/onboarding → Onboarding (форма + роудмап)
nextpath.su/shared/:id → Shared (публичная ссылка)
nextpath.su/profile    → редирект на my.nextpath.su/profile

my.nextpath.su/        → редирект на /profile
my.nextpath.su/profile → Profile (кабинет, с CabinetLoginPage если не авторизован)
my.nextpath.su/shared/:id → Shared (тоже работает)
```
