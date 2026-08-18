# NextPath Frontend

Frontend-приложение NextPath обслуживает два домена из одной сборки:

- **nextpath.su** - лендинг, форма онбординга, просмотр роудмапа
- **my.nextpath.su** - личный кабинет авторизованного пользователя

## Стек

React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, react-router-dom, @react-oauth/google

## Разработка

```bash
npm install
npm run dev
```

Сервер разработки доступен по адресу `http://localhost:8080`. Разделение по доменам в локальной среде отключено.

## Сборка

```bash
NODE_OPTIONS="--max-old-space-size=512" npm run build
```

Результат сборки сохраняется в каталоге `dist`. При развёртывании содержимое каталога копируется в `/var/www/html`.

## Структура `src/`

```
types.ts              - общие типы (RoadmapData, OnboardingFormData, ScheduleItem...)
lib/
  auth.ts             - хранение JWT в localStorage
  urls.ts             - логика доменов (IS_CABINET_DOMAIN, goToCabinet)
  constants.ts        - справочники, маппинг платформ, getResourceUrl
  suggestions.ts      - города по странам, университеты, профессии, языки
  generate-html.ts    - генератор интерактивного HTML-файла для скачивания
components/
  RoadmapPreview.tsx  - карточки роудмапа, скачивание, шаринг
  RoadmapVisual.tsx   - полноэкранный граф роудмапа
  RoadmapGenerating.tsx - экран загрузки при генерации
  ProfileEditForm.tsx - форма редактирования профиля в кабинете
  Autocomplete.tsx    - поле ввода с подсказками
  ErrorBoundary.tsx   - обработчик ошибок рендера
  steps/              - 6 шагов онбординга
pages/
  Index.tsx           - лендинг (nextpath.su)
  Onboarding.tsx      - форма и роудмап (nextpath.su)
  Profile.tsx         - личный кабинет (my.nextpath.su)
  Shared.tsx          - публичная страница роудмапа (/shared/:id)
App.tsx               - роутинг с учётом домена
```

## Переменные окружения (Vite)

Переменные задаются в корневом `.env` с префиксом `VITE_` и включаются в frontend при сборке.

| Переменная | Назначение |
|------------|----------------|
| `VITE_GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID |
| `VITE_CABINET_URL` | `https://my.nextpath.su` |
| `VITE_MAIN_URL` | `https://nextpath.su` |
