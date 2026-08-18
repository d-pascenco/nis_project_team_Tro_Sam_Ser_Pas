# NextPath

NextPath - учебная информационная система для формирования индивидуального плана профессионального развития. Пользователь заполняет анкету, получает план обучения и может отслеживать выполнение этапов в личном кабинете.

Развёрнутая версия проекта:

- https://nextpath.su - основное приложение и форма;
- https://my.nextpath.su - личный кабинет.

## Функциональные возможности

- многоэтапная анкета с информацией об образовании, навыках, целях и доступном времени;
- формирование плана развития с помощью Groq API;
- авторизация через Google OAuth;
- хранение профиля, плана и прогресса в PostgreSQL;
- создание публичной ссылки на план;
- экспорт плана в HTML и PDF.

## Архитектура

Проект состоит из двух приложений:

```text
frontend/    React, TypeScript, Vite, Tailwind CSS
backend/     FastAPI, SQLAlchemy, PostgreSQL
```

Frontend обслуживает основной домен и домен личного кабинета из одной сборки. Backend предоставляет REST API, выполняет проверку Google OAuth, обращается к Groq API и работает с PostgreSQL. В production запросы к приложениям направляются через Nginx.

Дополнительные материалы:

- [`frontend/README.md`](frontend/README.md) - структура и запуск frontend;
- [`backend/README.md`](backend/README.md) - API и запуск backend;
- [`wiki.md`](wiki.md) - порядок настройки сервера и развёртывания.

## Локальный запуск

### Backend

```bash
cp .env.example .env
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Проверка доступности API:

```bash
curl http://127.0.0.1:8000/api/health
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite запускает приложение по адресу `http://localhost:8080`.

## Конфигурация

Перед запуском необходимо скопировать `.env.example` в `.env` и заполнить значения переменных.

| Переменная | Назначение |
|------------|------------|
| `DATABASE_URL` | Строка подключения к PostgreSQL |
| `GROQ_API_KEY` | Ключ доступа к Groq API |
| `GOOGLE_CLIENT_ID` | Идентификатор клиента Google OAuth |
| `JWT_SECRET` | Секретный ключ для подписи JWT |
| `VITE_GOOGLE_CLIENT_ID` | Идентификатор Google OAuth для frontend |
| `VITE_CABINET_URL` | URL личного кабинета |
| `VITE_MAIN_URL` | URL основного приложения |

Файл `.env` не должен добавляться в Git.

## Проверка проекта

Backend:

```bash
cd backend
source venv/bin/activate
PYTHONPATH=. pytest -q
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Тесты backend используют подмену подключения к базе данных, поэтому для их выполнения PostgreSQL не требуется.

## Развёртывание

В проект включён скрипт `scripts/deploy_host.sh`. Он применяет SQL-миграции, устанавливает зависимости, собирает frontend и перезапускает сервисы на сервере. Параметры production-среды и последовательность первоначальной настройки приведены в [`wiki.md`](wiki.md).
