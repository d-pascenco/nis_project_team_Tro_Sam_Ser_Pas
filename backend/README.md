# NextPath Backend

Backend NextPath принимает данные анкеты, сохраняет их в PostgreSQL, формирует персональный план через Groq API и обеспечивает авторизацию через Google OAuth.

## Стек

Python 3.9+, FastAPI, SQLAlchemy 2, PostgreSQL, Uvicorn, Groq API, python-jose

## Методы API

| Метод | URL | Описание |
|-------|-----|----------|
| `GET` | `/api/health` | Статус сервиса, БД, Groq, Google |
| `POST` | `/api/forms` | Сохранить данные формы (анонимно) |
| `POST` | `/api/roadmap` | Сгенерировать роудмап через Groq |
| `POST` | `/api/share` | Создать публичную ссылку на роудмап |
| `GET` | `/api/share/{id}` | Получить расшаренный роудмап |
| `POST` | `/api/auth/google` | Авторизация через Google, возвращает JWT |
| `GET` | `/api/me` | Профиль, роудмап, form_data, прогресс |
| `PUT` | `/api/me/profile` | Обновить имя |
| `PUT` | `/api/me/progress` | Сохранить выполненные этапы |
| `POST` | `/api/me/roadmap` | Сохранить роудмап |
| `POST` | `/api/me/save-form` | Сохранить данные формы |
| `POST` | `/api/me/recalculate` | Обновить form_data и пересчитать роудмап |

## Локальный запуск

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Тесты

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

Тесты используют `FastAPI TestClient` с подменой зависимости базы данных. Для их выполнения PostgreSQL не требуется. Проверяются состояние API, отправка анкеты с полями в camelCase и валидация числовых диапазонов.

## Структура

```
app/
  main.py       - все endpoints, middleware, обработчик ошибок
  models.py     - SQLAlchemy-модели (UserForm, User, SharedRoadmap)
  schemas.py    - Pydantic-схемы валидации
  database.py   - подключение через DATABASE_URL
  env.py        - загрузка .env
sql/
  001_create_user_forms.sql
  002_create_users.sql
  003_alter_users_add_progress.sql
  004_alter_users_add_form_data.sql
  005_alter_user_forms_add_schedule.sql
  006_alter_user_forms_add_target_skills.sql
  007_alter_user_forms_add_country.sql
  008_create_shared_roadmaps.sql
tests/
  test_api.py   - тесты основных endpoints
```

## Развёртывание с systemd

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
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable nextpath-backend
sudo systemctl restart nextpath-backend
journalctl -u nextpath-backend -f
```
