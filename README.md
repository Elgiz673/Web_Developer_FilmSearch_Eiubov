# Что сегодня посмотреть?

## Профиль проекта

| Поле          | Значение                                 |
| ------------- | ---------------------------------------- |
| Проект        | Приложение для поиска фильмов и сериалов |
| Имя и фамилия | Элгиз Эюбов                              |
| GitHub        | Elgiz673                                 |
| E-mail        | elgiz714@gmail.com                       |

---

## Описание

**«Что сегодня посмотреть?»** — прикладной frontend‑проект для быстрого выбора фильмов и сериалов.

Приложение покрывает полный пользовательский сценарий:

- поиск контента;
- фильтрация результатов;
- просмотр карточек;
- переход на детальную страницу;
- просмотр трейлеров, кадров и рецензий.

Реализация ориентирована на стабильную работу в desktop и mobile сценариях, включая отказоустойчивое fallback‑поведение.

---

## Технологический стек

<p align="center">
  <img alt="HTML5" src="https://img.shields.io/badge/HTML5-Markup-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img alt="CSS3" src="https://img.shields.io/badge/CSS3-Responsive-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111" />
  <img alt="PHP" src="https://img.shields.io/badge/PHP-API%20Proxy-777BB4?style=for-the-badge&logo=php&logoColor=white" />
  <img alt="Jest" src="https://img.shields.io/badge/Jest-Unit%20Tests-C21325?style=for-the-badge&logo=jest&logoColor=white" />
</p>

### Используемые технологии

- Frontend: HTML5, CSS3, JavaScript (ES6+, без сборщика)
- Интеграционный слой: PHP‑proxy
- Источники данных: Kinopoisk Unofficial API, Kinopoisk.dev API
- Тестирование: Jest (helper/unit)

---

## Ключевые возможности

### Главная страница

- Карусель с подборкой контента.
- Быстрая навигация в каталоги фильмов и сериалов.

### Каталоги

- Поиск по названию.
- Фильтры по жанру, рейтингу, стране, году, режиссёру.
- Пагинация и удобная навигация.

### Детальная карточка

- Полные метаданные: жанры, страна, актёры, режиссёр, дата релиза, возрастной рейтинг.
- Трейлер, галерея кадров, рецензии.

### UX и адаптивность

- Светлая и тёмная тема.
- Отдельные mobile‑страницы и автопереход между desktop/mobile версиями.
- Fallback‑сценарии при ограничениях сети/API.

---

## Архитектура

Проект разделён на три слоя.

1. Слой представления
   - Desktop страницы: главная, списки, детальная карточка.
   - Mobile страницы: отдельный набор в каталоге `mobile/`.
   - Стили: общие и страничные CSS‑файлы.

2. Слой клиентской логики
   - `script/api.js` — запросы к API и нормализация данных.
   - `script/main.js` — общие утилиты.
   - `script/index.js` — главная страница и карусель.
   - `script/lists.js` — поиск, фильтры, пагинация.
   - `script/movie.js` — логика детальной страницы.
   - `script/gallery.js` — поведение галереи.

3. Серверный интеграционный слой
   - `kp-proxy.php` — безопасное проксирование запросов.
   - `kp-proxy.config.php` — конфигурация токенов и upstream.
   - `index.php` — точка входа для PHP‑хостингов.

---

## Структура репозитория

```text
FilmSearch/
├─ index.html
├─ index.php
├─ kp-proxy.php
├─ kp-proxy.config.php
├─ assets/
├─ style/
├─ script/
├─ movie/
├─ movie_list/
├─ series_list/
├─ mobile/
└─ tests/
```

---

## Маршруты интерфейса

| Сценарий        | Desktop                   | Mobile                           |
| --------------- | ------------------------- | -------------------------------- |
| Главная         | `/index.html`             | `/mobile/index.html`             |
| Список фильмов  | `/movie_list/index.html`  | `/mobile/movie_list/index.html`  |
| Список сериалов | `/series_list/index.html` | `/mobile/series_list/index.html` |
| Карточка тайтла | `/movie/index.html`       | `/mobile/movie/index.html`       |

---

## Конфигурация окружения

Поддерживаемые параметры:

- `KP_UNOFFICIAL_TOKEN`
- `KP_DEV_TOKEN`
- `KP_TOKEN`
- `UPSTREAM_UNOFFICIAL`
- `UPSTREAM_DEV`

---

## Безопасность

- API‑токены не размещаются во frontend‑коде.
- Внешние API вызываются через серверный proxy.
- Рекомендуется хранить ключи только в окружении сервера.
- Для production желательно включить rate‑limit и логирование ошибок.

---

## Надёжность

Реализованы механизмы деградации без потери базового UX:

- fallback‑ресурсы при недоступности внешнего API;
- безопасный рендер при неполных данных;
- сохранение работоспособности ключевых экранов.

---

## Тестирование

Используется Jest‑контур для helper/unit‑проверок:

- фильтрация;
- пагинация;
- списочные утилиты.

Каталог тестов: `tests/`.

---

## Итог

Проект представляет собой практичный frontend‑продукт с понятной архитектурой, адаптивным UX и устойчивой интеграцией с внешними API через серверный слой.
