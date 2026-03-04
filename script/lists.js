/*
 * Скрипт страниц списков фильмов/сериалов.
 * Управляет фильтрами, пагинацией, рендером карточек и fallback-сценариями.
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==================================================
  // БАЗОВЫЕ УТИЛИТЫ И ОПРЕДЕЛЕНИЕ КОНТЕКСТА СТРАНИЦЫ
  // ==================================================

  const A = window.AppUtils;

  /**
   * Логирование нефатальных ошибок без прерывания основного сценария.
   *
   * @param {string} context
   * @param {unknown} error
   * @param {Record<string, unknown>} [details]
   */
  const logRecoverableError = (context, error, details = {}) => {
    if (A?.logError) {
      A.logError(context, error, details);
      return;
    }

    const text =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error || "Unknown error");
    console.warn(`[Lists] ${context}`, { error: text, ...details });
  };

  /**
   * Экранирует потенциально небезопасный HTML из внешних источников.
   * Нужен для безопасного рендера карточек.
   *
   * @param {unknown} value
   * @returns {string}
   */
  function escapeHtml(value) {
    const source = String(value ?? "");
    return source.replace(/[&<>'"]/g, (ch) => {
      switch (ch) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "'":
          return "&#39;";
        case '"':
          return "&quot;";
        default:
          return ch;
      }
    });
  }

  function isProjectMobileRoute(pathname) {
    const path = String(pathname || "");
    const normalizedPath = path.endsWith("/") ? path + "index.html" : path;

    return (
      normalizedPath.endsWith("/mobile/index.html") ||
      normalizedPath.endsWith("/mobile/movie_list/index.html") ||
      normalizedPath.endsWith("/mobile/series_list/index.html") ||
      normalizedPath.endsWith("/mobile/movie/index.html")
    );
  }

  const isSeriesPage = window.location.pathname.includes("series_list");
  const isMobilePage = A?.isMobilePath
    ? A.isMobilePath()
    : isProjectMobileRoute(window.location.pathname);

  // Префикс ассетов зависит от глубины текущего маршрута.
  const ASSETS_PREFIX = isMobilePage ? "../../" : "../";

  // Резервный постер для пустых и битых внешних ссылок.
  const FALLBACK_POSTER_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="358" height="500" viewBox="0 0 358 500">
      <rect width="100%" height="100%" fill="#111111"/>
      <rect x="18" y="18" width="322" height="464" rx="8" ry="8" fill="#1c1c1c" stroke="#3a3a3a" stroke-width="2"/>
      <text x="50%" y="50%" fill="#9b9b9b" font-family="Arial, sans-serif" font-size="22" text-anchor="middle" dominant-baseline="middle">
        <tspan x="50%" dy="-8">ПОСТЕР</tspan>
        <tspan x="50%" dy="26">ОТСУТСТВУЕТ</tspan>
      </text>
    </svg>`,
  )}`;

  const NO_POSTER_RE = /\/images\/posters\/kp\/no-poster\.png/i;
  const EMBEDDED_BADGE_POSTER_RE =
    /assets\/images\/img\/(код красный|секреты затерянного леса|путеводная звезда)\.png$/i;
  const cardsGrid = document.getElementById("cards-grid");
  const paginationContainer = document.getElementById("pagination");
  const paginationTopContainer = document.getElementById("pagination-top");
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-query");
  const filterForm = document.getElementById("filter-form");
  const genreFilter = document.getElementById("genre-filter");
  const ratingFilter = document.getElementById("rating-filter");
  const countryFilter = document.getElementById("country-filter");
  const yearFilter = document.getElementById("year-filter");
  const directorFilter = document.getElementById("director-filter");
  const resetButton = document.getElementById("reset-filters");

  // ==================================================
  // СЧИТЫВАНИЕ ТЕКУЩЕГО СОСТОЯНИЯ ПОИСКА/ФИЛЬТРОВ
  // ==================================================

  /**
   * Считать текущие значения поиска/фильтров.
   * Группируем данные в один объект, чтобы не дублировать код по всему файлу.
   */
  function getFilters() {
    return {
      query: (searchInput?.value || "").trim(),
      genre: genreFilter?.value || "",
      rating: ratingFilter?.value || "",
      country: countryFilter?.value || "",
      year: yearFilter?.value || "",
      director: (directorFilter?.value || "").trim(),
    };
  }

  // Резервные данные, если API недоступен.
  const sampleMoviesList = [
    {
      id: 1,
      title: "Эхо Тьмы",
      rating: 9.1,
      poster: "../assets/images/fallback/film-echo-of-darkness.png",
      genre: "Драма",
      country: "США",
      year: 2024,
      age: "16+",
      director: "Алексей Журов",
      actors: "Мария Иванова, Дмитрий Соколов",
      description:
        "В маленьком городе исчезают люди, а в ночной тишине слышится зловещее эхо. Следователь и местная журналистка ищут ответы, пока тьма не поглотила всё вокруг.",
    },
    {
      id: 2,
      title: "Иллюзия любви",
      rating: 8.7,
      poster: "../assets/images/fallback/film-illusion-of-love.png",
      genre: "Драма",
      country: "Великобритания",
      year: 2023,
      age: "12+",
      director: "Эмма Браун",
      actors: "Камиль Дюран, Луи Мартен",
      description:
        "В жизнь успешного архитектора внезапно входит таинственная незнакомка, меняя привычный порядок вещей. За романтической историей скрывается загадка, разгадать которую можно лишь доверившись сердцу.",
    },
    {
      id: 3,
      title: "Отшельник: Путь Ветра",
      rating: 8.6,
      poster: "../assets/images/fallback/film-hermit-wind-path.png",
      genre: "Фэнтези",
      country: "Франция",
      year: 2022,
      age: "12+",
      director: "Люк Дюваль",
      actors: "Жан Рено, Марион Котийяр",
      description:
        "Ветреные горы скрывают древнюю тайну. Отшельник помогает путникам пройти испытания и вернуть надежду в королевство.",
    },
    {
      id: 4,
      title: "Паутина времени",
      rating: 8.6,
      poster: "../assets/images/fallback/film-web-of-time.png",
      genre: "Фантастика",
      country: "США",
      year: 2025,
      age: "12+",
      director: "Майкл Харпер",
      actors: "Том Холланд, Зендая",
      description:
        "Экспедиция в далёкий мир сталкивается с загадочным явлением — красной тенью, меняющей само время. Героям нужно разгадать её природу, чтобы вернуться домой.",
    },
    {
      id: 5,
      title: "Код Красный",
      rating: 8.2,
      poster: "../assets/images/fallback/film-code-red.png",
      genre: "Боевик",
      country: "Россия",
      year: 2024,
      age: "16+",
      director: "Игорь Лебедев",
      actors: "Крис Эванс, Скарлетт Йоханссон",
      description:
        "Когда секретный протокол «Код красный» активируется, группа оперативников получает всего одну ночь, чтобы предотвратить катастрофу.",
    },
    {
      id: 6,
      title: "Принц и нищий",
      rating: 8.1,
      poster: "../assets/images/fallback/film-prince-and-pauper.png",
      genre: "Фэнтези",
      country: "Великобритания",
      year: 2023,
      age: "12+",
      director: "Джеймс Кэмерон",
      actors: "Том Хэнкс, Эмма Стоун",
      description:
        "Юная героиня отправляется в таинственный лес, чтобы раскрыть древнюю загадку и вернуть справедливость.",
    },
    {
      id: 7,
      title: "Секреты затерянного леса",
      rating: 7.9,
      poster: "../assets/images/fallback/film-lost-forest-secrets.png",
      genre: "Фэнтези",
      country: "Россия",
      year: 2022,
      age: "6+",
      director: "Анна Селезнёва",
      actors: "Дэниел Рэдклифф, Эмма Уотсон",
      description:
        "Таинственный лес хранит секреты древней магии. Героям предстоит пройти испытания и защитить свой дом.",
    },
    {
      id: 8,
      title: "Путеводная звезда",
      rating: 7.8,
      poster: "../assets/images/fallback/film-guiding-star.png",
      genre: "Драма",
      country: "США",
      year: 2021,
      age: "6+",
      director: "Ричард Лоусон",
      actors: "Леа Сейду, Венсан Кассель",
      description:
        "Юная путешественница находит старую карту, ведущую к легендарной звезде. В дороге её ждут испытания и открытия.",
    },
    {
      id: 9,
      title: "Проклятое королевство",
      rating: 7.5,
      poster: "../assets/images/fallback/film-cursed-kingdom.png",
      genre: "Фэнтези",
      country: "Великобритания",
      year: 2020,
      age: "16+",
      director: "Кристофер Нолан",
      actors: "Бенедикт Камбербэтч, Кейт Бланшетт",
      description:
        "Старинное королевство оказывается на грани распада, когда древнее проклятие возвращается и начинает разрушать мир людей.",
    },
  ];

  const sampleSeriesList = [
    {
      id: 101,
      title: "Грань Невидимости",
      rating: 9.1,
      poster: "../assets/images/fallback/series-edge-of-invisibility.png",
      genre: "Фэнтези",
      country: "США",
      year: 2023,
      age: "18+",
      director: "Дэвид Бениофф",
      actors: "Эмилия Кларк, Кит Харингтон",
      description: "Эпическая сага о борьбе за власть и судьбе мира.",
    },
    {
      id: 102,
      title: "Под куполом Тайн",
      rating: 8.7,
      poster: "../assets/images/fallback/series-under-dome-of-secrets.png",
      genre: "Драма",
      country: "США",
      year: 2024,
      age: "18+",
      director: "Винс Гиллиган",
      actors: "Брайан Крэнстон, Аарон Пол",
      description:
        "История превращения, где каждый шаг ведёт героев к точке невозврата.",
    },
    {
      id: 103,
      title: "Белое зеркало",
      rating: 8.6,
      poster: "../assets/images/fallback/series-white-mirror.png",
      genre: "Фантастика",
      country: "США",
      year: 2024,
      age: "16+",
      director: "Братья Даффер",
      actors: "Милли Бобби Браун",
      description: "Мистические события, где технологии отражают страхи людей.",
    },
    {
      id: 104,
      title: "Меланхолия",
      rating: 8.6,
      poster: "../assets/images/fallback/series-melancholy.png",
      genre: "Драма",
      country: "Великобритания",
      year: 2023,
      age: "16+",
      director: "Софи Уэст",
      actors: "Джулия Робертс, Мэттью Макконахи",
      description: "Расследование, которое меняет представление о реальности.",
    },
    {
      id: 105,
      title: "Друзья с Тёмной Стороны",
      rating: 8.2,
      poster: "../assets/images/fallback/series-friends-dark-side.png",
      genre: "Криминал",
      country: "США",
      year: 2024,
      age: "18+",
      director: "Ник Вон",
      actors: "Крис Эванс",
      description:
        "Криминальная история с неожиданными поворотами и опасными союзами.",
    },
    {
      id: 106,
      title: "Сердца Четырех",
      rating: 8.1,
      poster: "../assets/images/fallback/series-four-hearts.png",
      genre: "Комедия",
      country: "США",
      year: 2024,
      age: "12+",
      director: "Роберт Кинг",
      actors: "Константин Хабенский, Виктория Исакова",
      description:
        "История о выборе, который меняет всё, и о дружбе, которая спасает.",
    },
    {
      id: 107,
      title: "Враги",
      rating: 7.9,
      poster: "../assets/images/fallback/series-enemies.png",
      genre: "Триллер",
      country: "Великобритания",
      year: 2022,
      age: "16+",
      director: "Джон Морган",
      actors: "Александр Петров, Светлана Ходченкова",
      description: "Опасная игра, где каждый шаг может стать последним.",
    },
    {
      id: 108,
      title: "Постучись в мое окно",
      rating: 7.8,
      poster: "../assets/images/fallback/series-knock-on-my-window.png",
      genre: "Фантастика",
      country: "США",
      year: 2025,
      age: "12+",
      director: "Сара Уилсон",
      actors: "Тимоти Шаламе, Зендея",
      description: "Путешествие во времени, оставляющее след в настоящем.",
    },
    {
      id: 109,
      title: "Ход короля",
      rating: 7.5,
      poster: "../assets/images/fallback/series-kings-move.png",
      genre: "Триллер",
      country: "Россия",
      year: 2023,
      age: "16+",
      director: "Виктор Орлов",
      actors: "Олег Меньшиков, Данила Козловский",
      description:
        "Напряжённый детектив о выборе, где каждая ошибка стоит слишком дорого.",
    },
  ];

  let allItems = [];
  let filtered = [];
  const itemsPerPage = 9;
  let currentPage = 1;
  let totalPages = 1;
  let isLoading = false;
  let useAPI = true;
  let hasSearchFromUrl = false;

  function normalizePagesCount(value, fallback = 1) {
    const pages = Number(value);
    if (!Number.isFinite(pages) || pages <= 0) return Math.max(1, fallback);
    return Math.max(1, Math.floor(pages));
  }

  function mapGenreRuToKey(value) {
    const source = String(value || "")
      .trim()
      .toLowerCase();
    if (!source) return "";
    const apiMap = window.MovieAPI?.GENRE_MAP;
    if (apiMap && apiMap[source]) return String(apiMap[source]).toLowerCase();
    return FALLBACK_GENRE_MAP[source] || source;
  }

  function mapCountryRuToKey(value) {
    const source = String(value || "")
      .trim()
      .toLowerCase();
    if (!source) return "";

    for (const [k, ru] of Object.entries(FALLBACK_COUNTRY_MAP)) {
      if (String(ru || "").toLowerCase() === source) return k;
    }

    const apiReverse = window.MovieAPI?.COUNTRY_MAP_REVERSE;
    if (apiReverse) {
      for (const [ru, k] of Object.entries(apiReverse)) {
        if (String(ru || "").toLowerCase() === source) {
          return String(k || "").toLowerCase();
        }
      }
    }

    return source;
  }

  // ==================================================
  // ИНИЦИАЛИЗАЦИЯ СОСТОЯНИЯ ИЗ URL
  // ==================================================

  // Инициализация строки поиска из query-параметров.
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get("search");
  if (searchQuery && searchInput) {
    searchInput.value = searchQuery;
    hasSearchFromUrl = true;
  }

  // ==================================================
  // ЗАГРУЗКА ДАННЫХ (API -> РЕЗЕРВНЫЙ РЕЖИМ)
  // ==================================================

  /**
   * Показать индикатор загрузки
   */
  function showLoading() {
    if (!cardsGrid) return;
    cardsGrid.innerHTML = `
      <div class="loading-state" style="grid-column: 1 / -1; text-align: center; padding: 60px;">
        <div class="spinner" style="
          width: 48px;
          height: 48px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3bb33b;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        "></div>
        <p style="color: #686868; font-size: 16px;">Загрузка фильмов...</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  /**
   * Загружает данные с API, при ошибке переключается на резервный набор.
   */
  async function loadData() {
    if (isLoading) return;
    isLoading = true;
    showLoading();

    const { query, genre, rating, country, year, director } = getFilters();

    try {
      // Основной сценарий: загрузка через API.
      if (window.MovieAPI && useAPI) {
        let result;

        // При наличии поисковой строки используем полнотекстовый поиск.
        if (query) {
          // Для страницы сериалов передаем тип TV_SERIES.
          result = await window.MovieAPI.searchMovies(
            query,
            currentPage,
            itemsPerPage,
            isSeriesPage ? "TV_SERIES" : "FILM",
          );
        } else {
          // Без поискового запроса получаем обычный пагинируемый список по фильтрам.
          const options = {
            page: currentPage,
            limit: itemsPerPage,
            genre: genre || null,
            rating: rating ? parseFloat(rating) : null,
            country: country || null,
            year: year || null,
            director: director || null,
          };

          if (isSeriesPage) {
            result = await window.MovieAPI.getSeries(options);
          } else {
            result = await window.MovieAPI.getMovies(options);
          }
        }

        if (result && result.docs) {
          allItems = result.docs.map((movie) => {
            const normalized = window.MovieAPI.normalizeMovie(movie);
            return {
              id: normalized.id,
              title: normalized.title,
              rating: normalized.rating,
              poster: normalized.poster || normalized.posterPreview,
              genre: normalized.genres[0]?.toLowerCase() || "",
              country: normalized.countries[0]?.toLowerCase() || "",
              year: normalized.year,
              age: normalized.ageRating || "",
              description:
                normalized.description || normalized.shortDescription || "",
            };
          });
          totalPages = normalizePagesCount(
            result.pages || Math.ceil(result.total / itemsPerPage) || 1,
            1,
          );
          if (currentPage > totalPages) currentPage = totalPages;
          if (currentPage < 1) currentPage = 1;
          filtered = allItems;
          render();
          return;
        }
      }
    } catch (error) {
      logRecoverableError("API request failed, using fallback data", error);
      useAPI = false;
    } finally {
      isLoading = false;
    }

    // Резервный сценарий на локальных данных.
    useAPI = false;
    useFallbackData();
  }

  /**
   * Переключает рендер на локальные данные.
   */
  function useFallbackData() {
    const dataset = isSeriesPage ? sampleSeriesList : sampleMoviesList;
    allItems = [...dataset];
    applyLocalFilters();
  }

  // ==================================================
  // НОРМАЛИЗАЦИЯ ЛОКАЛЬНЫХ ЗНАЧЕНИЙ ПОД КЛЮЧИ ФИЛЬТРОВ
  // ==================================================

  const FALLBACK_GENRE_MAP = {
    фэнтези: "fantasy",
    драма: "drama",
    боевик: "action",
    триллер: "thriller",
    фантастика: "scifi",
    ужасы: "horror",
    комедия: "comedy",
    криминал: "crime",
  };

  const FALLBACK_COUNTRY_MAP = {
    usa: "США",
    uk: "Великобритания",
    russia: "Россия",
    france: "Франция",
  };

  function normalizeGenreKey(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const low = raw.toLowerCase();

    // Если уже пришел нормализованный ключ.
    const apiGenreMap = window.MovieAPI?.GENRE_MAP;
    const apiValues = apiGenreMap ? Object.values(apiGenreMap) : [];
    if (apiValues.includes(low)) return low;

    // Иначе приводим человекочитаемое значение к ключу.
    if (apiGenreMap && apiGenreMap[low]) return apiGenreMap[low];
    return FALLBACK_GENRE_MAP[low] || low;
  }

  function normalizeCountryKey(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const low = raw.toLowerCase();

    // Если уже пришел ключ страны.
    if (Object.prototype.hasOwnProperty.call(FALLBACK_COUNTRY_MAP, low))
      return low;

    // Пробуем обратные карты API.
    const apiReverse = window.MovieAPI?.COUNTRY_MAP_REVERSE;
    if (apiReverse) {
      if (apiReverse[raw]) return apiReverse[raw];
      for (const [ru, key] of Object.entries(apiReverse)) {
        if (String(ru).toLowerCase() === low) return key;
      }
    }

    // Финальный резервный вариант по локальной карте.
    for (const [key, ru] of Object.entries(FALLBACK_COUNTRY_MAP)) {
      if (String(ru).toLowerCase() === low) return key;
    }

    return low;
  }

  /**
   * Применяет фильтры к локальным данным.
   */
  function applyLocalFilters() {
    const { query, genre, rating, country, year, director } = getFilters();
    const queryLower = query.toLowerCase();
    const directorLower = String(director || "")
      .trim()
      .toLowerCase();

    const dataset = isSeriesPage ? sampleSeriesList : sampleMoviesList;

    filtered = dataset.filter((item) => {
      const matchesQuery =
        !queryLower || item.title.toLowerCase().includes(queryLower);
      const matchesGenre =
        !genre || normalizeGenreKey(item.genre) === String(genre).toLowerCase();
      const matchesRating = !rating || item.rating >= parseFloat(rating);
      const matchesCountry =
        !country ||
        normalizeCountryKey(item.country) === String(country).toLowerCase();
      const matchesYear = !year || String(item.year) === year;
      const itemDirector = String(item.director || "").toLowerCase();
      const matchesDirector =
        !directorLower || itemDirector.includes(directorLower);
      return (
        matchesQuery &&
        matchesGenre &&
        matchesRating &&
        matchesCountry &&
        matchesYear &&
        matchesDirector
      );
    });

    filtered.sort((a, b) => b.rating - a.rating);
    totalPages = normalizePagesCount(
      Math.ceil(filtered.length / itemsPerPage),
      1,
    );
    currentPage = 1;
    render();
  }

  /**
   * Нормализует URL постера:
   * - для локальных картинок приводим путь к корректному относительно текущей страницы
   *   (desktop список: ../assets/..., mobile список: ../../assets/...)
   * - безопасно кодируем пробелы/кириллицу (encodeURI)
   * - если расширения нет — добавляем .png
   * - для http/https ничего не меняем
   */
  function normalizePosterUrl(posterUrl) {
    const raw = String(posterUrl || "").trim();
    if (!raw || NO_POSTER_RE.test(raw)) return FALLBACK_POSTER_URL;

    // Внешние URL не изменяем.
    if (
      /^https?:\/\//i.test(raw) ||
      raw.startsWith("data:") ||
      raw.startsWith("blob:")
    ) {
      return raw;
    }

    // Нормализуем путь для последующих проверок.
    let safeRaw = raw;
    try {
      const decoded = decodeURI(raw).replace(/\\/g, "/");
      safeRaw = decoded;
    } catch (error) {
      // Если decodeURI не сработал, оставляем исходное значение.
      logRecoverableError("Poster decode failed", error, { poster: raw });
      safeRaw = raw;
    }

    // Приводим локальные пути к единому виду через ASSETS_PREFIX.
    const idx = safeRaw.indexOf("assets/");
    let normalized = idx >= 0 ? safeRaw.slice(idx) : safeRaw;
    if (normalized.startsWith("assets/")) {
      normalized = `${ASSETS_PREFIX}${normalized}`;
    }

    if (!/\.(png|jpe?g|webp|svg)$/i.test(normalized)) normalized += ".png";

    // Для локальных путей кодируем пробелы и кириллицу.
    return encodeURI(normalized);
  }

  // ==================================================
  // РЕНДЕР КАРТОЧЕК И ПАГИНАЦИИ
  // ==================================================

  /**
   * Рендерит карточки фильмов.
   */
  function renderCards(page) {
    if (!cardsGrid) return;

    cardsGrid.innerHTML = "";
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const items = useAPI ? filtered : filtered.slice(start, end);

    if (items.length === 0) {
      cardsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 20px; display: block; opacity: 0.5;">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <h3 style="margin: 0 0 10px; font-size: 20px;">Ничего не найдено</h3>
          <p style="color: #686868; margin: 0;">Попробуйте изменить параметры поиска или фильтры</p>
        </div>
      `;
      return;
    }

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "movie-card";

      // Нормализуем путь к постеру до безопасного URL.
      const posterUrl = normalizePosterUrl(item.poster);
      const isFallbackPoster = posterUrl === FALLBACK_POSTER_URL;
      const safeTitle = escapeHtml(item.title || "Без названия");
      const parsedRating = Number(item.rating);
      const normalizedRating = Number.isFinite(parsedRating)
        ? parsedRating.toFixed(1)
        : "—";
      const ratingBadgeClass =
        Number.isFinite(parsedRating) && parsedRating >= 8.5
          ? "rating-badge rating-badge--high"
          : "rating-badge rating-badge--warm";
      const ratingBadgeHtml = `<div class="${ratingBadgeClass}">${normalizedRating}</div>`;

      card.innerHTML = `
        <div class="poster-wrapper">
          <img src="${posterUrl}" alt="${safeTitle}" loading="lazy" onerror="this.onerror=null; this.src='${FALLBACK_POSTER_URL}'" />
          ${ratingBadgeHtml}
          <div class="poster-gradient"></div>
        </div>
        <div class="card-content">
          <h3>${safeTitle}</h3>
        </div>
      `;

      card.addEventListener("click", () => {
        // Сохраняем карточку в sessionStorage для страницы деталей.
        try {
          const localDataset = isSeriesPage
            ? sampleSeriesList
            : sampleMoviesList;
          const localMeta = localDataset.find(
            (entry) => String(entry.id) === String(item.id),
          );

          const payload = {
            id: item.id,
            title: item.title,
            rating: item.rating,
            poster: posterUrl,
            genre: item.genre || "",
            country: item.country || "",
            year: item.year || "",
            age: item.age || localMeta?.age || "",
            director: item.director || localMeta?.director || "",
            actors: item.actors || localMeta?.actors || "",
            description: item.description || localMeta?.description || "",
            isSeries: isSeriesPage,
            source: useAPI ? "api" : "local",
          };
          const payloadText = JSON.stringify(payload);
          if (A?.safeStorageSet) {
            A.safeStorageSet(
              "last-selected-item",
              payloadText,
              window.sessionStorage,
            );
            A.safeStorageSet(
              "last-selected-item-id",
              String(item.id),
              window.sessionStorage,
            );
          } else {
            sessionStorage.setItem("last-selected-item", payloadText);
            sessionStorage.setItem("last-selected-item-id", String(item.id));
          }
        } catch (error) {
          logRecoverableError("SessionStorage write failed", error, {
            id: item.id,
            title: item.title,
          });
        }

        const moviePath = "../movie/index.html";
        window.location.href = `${moviePath}?id=${item.id}`;
      });

      cardsGrid.appendChild(card);
    });
  }

  /**
   * Рендерит пагинацию.
   */
  function renderPagination(container) {
    if (!container) return;

    container.innerHTML = "";

    const pagesCountRaw = useAPI
      ? totalPages
      : Math.ceil(filtered.length / itemsPerPage);
    const safePagesCountRaw = Number.isFinite(pagesCountRaw)
      ? Math.max(1, Math.floor(pagesCountRaw))
      : 1;
    // По ТЗ на страницах списков всегда отображаем 5 кнопок.
    // Если реальных страниц меньше, лишние кнопки рендерятся disabled.
    const pagesCount = 5;

    // Нормализуем текущую страницу в допустимые границы.
    if (currentPage > safePagesCountRaw) currentPage = safePagesCountRaw;
    if (currentPage < 1) currentPage = 1;

    for (let i = 1; i <= pagesCount; i++) {
      addPageButton(container, i, safePagesCountRaw);
    }
  }

  async function populateFilterOptionsFromAPI() {
    if (!window.MovieAPI) return;

    try {
      const [genresRaw, countriesRaw] = await Promise.all([
        window.MovieAPI.getGenres?.() || [],
        window.MovieAPI.getCountries?.() || [],
      ]);

      if (genreFilter && Array.isArray(genresRaw) && genresRaw.length) {
        const current = String(genreFilter.value || "").toLowerCase();
        const options = [];

        genresRaw.forEach((g) => {
          const ruName = String(g?.genre || "").trim();
          if (!ruName) return;
          const key = mapGenreRuToKey(ruName);
          if (!key || options.some((x) => x.value === key)) return;
          options.push({ value: key, label: ruName });
        });

        if (options.length) {
          const defaultLabel = isMobilePage ? "Все жанры" : "Все жанры";
          genreFilter.innerHTML = "";
          genreFilter.add(new Option(defaultLabel, ""));
          options
            .sort((a, b) => a.label.localeCompare(b.label, "ru"))
            .forEach((opt) =>
              genreFilter.add(new Option(opt.label, opt.value)),
            );

          if (current && options.some((x) => x.value === current)) {
            genreFilter.value = current;
          }
        }
      }

      if (countryFilter && Array.isArray(countriesRaw) && countriesRaw.length) {
        const current = String(countryFilter.value || "").toLowerCase();
        const options = [];

        countriesRaw.forEach((c) => {
          const ruName = String(c?.country || "").trim();
          if (!ruName) return;
          const key = mapCountryRuToKey(ruName);
          if (!key || options.some((x) => x.value === key)) return;
          options.push({ value: key, label: ruName });
        });

        if (options.length) {
          countryFilter.innerHTML = "";
          countryFilter.add(new Option("Все страны", ""));
          options
            .sort((a, b) => a.label.localeCompare(b.label, "ru"))
            .forEach((opt) =>
              countryFilter.add(new Option(opt.label, opt.value)),
            );

          if (current && options.some((x) => x.value === current)) {
            countryFilter.value = current;
          }
        }
      }
    } catch (error) {
      logRecoverableError("Failed to populate filters from API", error);
    }
  }

  /**
   * Добавляет кнопку страницы.
   */
  function addPageButton(container, pageNum, pagesCountRaw) {
    const btn = document.createElement("button");
    btn.textContent = pageNum;

    const isDisabled = pageNum > pagesCountRaw;
    if (pageNum === currentPage && !isDisabled) btn.classList.add("active");
    if (isDisabled) {
      btn.disabled = true;
    } else {
      btn.addEventListener("click", () => {
        currentPage = pageNum;
        if (useAPI) {
          loadData();
        } else {
          render();
        }
        scrollToTop();
      });
    }
    container.appendChild(btn);
  }

  /**
   * Прокрутка к началу списка карточек.
   */
  function scrollToTop() {
    cardsGrid?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /**
   * Основной вход в рендер карточек и пагинации.
   */
  function render() {
    renderCards(currentPage);
    renderPagination(paginationTopContainer);
    if (paginationContainer) {
      paginationContainer.style.display = "none";
    }
  }

  // ==================================================
  // ОБРАБОТЧИКИ ПОИСКА И ФИЛЬТРОВ
  // ==================================================
  searchForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    currentPage = 1;
    hasSearchFromUrl = Boolean((searchInput?.value || "").trim());
    if (useAPI) {
      loadData();
    } else {
      applyLocalFilters();
    }
  });

  const handleFilterChange = () => {
    currentPage = 1;
    hasSearchFromUrl = Boolean((searchInput?.value || "").trim());
    if (useAPI) {
      loadData();
    } else {
      applyLocalFilters();
    }
  };

  genreFilter?.addEventListener("change", handleFilterChange);
  ratingFilter?.addEventListener("change", handleFilterChange);
  countryFilter?.addEventListener("change", handleFilterChange);
  yearFilter?.addEventListener("change", handleFilterChange);
  directorFilter?.addEventListener("input", handleFilterChange);

  resetButton?.addEventListener("click", () => {
    filterForm?.reset();
    if (searchInput) {
      searchInput.value = "";
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("search");
    window.history.replaceState({}, "", url.toString());

    currentPage = 1;
    hasSearchFromUrl = false;
    if (useAPI) {
      loadData();
    } else {
      applyLocalFilters();
    }
  });

  // Форма фильтров не должна выполнять нативный submit/перезагрузку страницы.
  // При Enter в полях фильтра применяем текущие значения в том же сценарии,
  // что и при изменении селектов.
  filterForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    handleFilterChange();
  });

  // ==================================================
  // ВИЗУАЛЬНАЯ СИНХРОНИЗАЦИЯ СОСТОЯНИЯ СЕЛЕКТОВ
  // ==================================================

  // Синхронизирует состояние CSS-класса раскрытия у селектов.
  function setupSelectArrowToggle() {
    const selects = document.querySelectorAll(".filter-select");
    if (!selects.length) return;

    const closeAll = (except) => {
      selects.forEach((s) => {
        if (s !== except) s.classList.remove("is-open");
      });
    };

    selects.forEach((select) => {
      const open = () => {
        closeAll(select);
        select.classList.add("is-open");
      };

      const close = () => select.classList.remove("is-open");

      select.addEventListener("mousedown", open);
      select.addEventListener("touchstart", open, { passive: true });
      select.addEventListener("keydown", (e) => {
        const k = e.key;
        if (
          k === "Enter" ||
          k === " " ||
          k === "Spacebar" ||
          k === "ArrowDown" ||
          k === "ArrowUp"
        ) {
          open();
        }
      });

      select.addEventListener("change", close);
      select.addEventListener("blur", close);
    });

    document.addEventListener("mousedown", (e) => {
      const t = e.target;
      const insideSelect =
        t &&
        (t.classList?.contains("filter-select") ||
          t.closest?.(".filter-select"));
      if (!insideSelect) closeAll();
    });
  }

  setupSelectArrowToggle();

  populateFilterOptionsFromAPI();

  // ==================================================
  // ТОЧКА ВХОДА
  // ==================================================

  loadData();
});
