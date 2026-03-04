/*
 * Модуль карусели для мобильных страниц.
 * Отвечает за рендер карточки, навигацию, API/fallback и сохранение контекста выбора.
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==================================================
  // БАЗОВАЯ ИНИЦИАЛИЗАЦИЯ И ПРОВЕРКА КОНТЕКСТА СТРАНИЦЫ
  // ==================================================

  const A = window.AppUtils || {};

  /**
   * Логирование нефатальных ошибок мобильной карусели.
   *
   * @param {string} context
   * @param {unknown} error
   * @param {Record<string, unknown>} [details]
   */
  const logRecoverableError = (context, error, details = {}) => {
    if (typeof A.logError === "function") {
      A.logError(context, error, details);
      return;
    }

    const text =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error || "Unknown error");
    console.warn(`[MobileCarousel] ${context}`, { error: text, ...details });
  };

  const path = window.location.pathname;
  const isMobileHome =
    path.includes("/mobile/") &&
    !path.includes("/movie_list") &&
    !path.includes("/series_list");
  const isMobileMovies = path.includes("/mobile/movie_list");
  const isMobileSeries = path.includes("/mobile/series_list");

  if (!isMobileHome && !isMobileMovies && !isMobileSeries) return;

  // Базовые пути зависят от текущей мобильной страницы.
  const movieBase = isMobileHome ? "./" : "../";
  const assetsBase = isMobileHome ? "../" : "../../";

  const moviePage = `${movieBase}movie/index.html`;
  const EMBEDDED_BADGE_POSTER_RE = /assets\/images\/img\/код красный\.png$/i;
  const CLEAN_CODE_RED_POSTER =
    "assets/images/2dc081c49be870e762ad7f4f7bb24b9135455824.png";

  // ==================================================
  // ЛОКАЛЬНЫЕ РЕЗЕРВНЫЕ ДАННЫЕ
  // ==================================================

  const fallbackMoviesCards = [
    {
      id: 1,
      title: "Проклятое\nкоролевство",
      rating: 9.8,
      poster: `${assetsBase}assets/images/fallback/carousel-cursed-kingdom.png`,
      genre: "Фэнтези",
      country: "Россия",
      year: 2025,
      age: "12+",
      director: "Александр Петров",
      actors: "Мария Иванова, Дмитрий Соколов",
      description: "Мрачное королевство и древнее проклятие.",
    },
    {
      id: 12,
      title: "Эхо Тьмы",
      rating: 9.1,
      poster: `${assetsBase}assets/images/fallback/carousel-prince-and-pauper.png`,
      genre: "Драма",
      country: "США",
      year: 2024,
      age: "16+",
      director: "Джеймс Роулинг",
      actors: "Эмма Стоун, Том Харди",
      description: "Таинственные события меняют судьбы героев.",
    },
    {
      id: 2,
      title: "Код красный",
      rating: 9.7,
      poster: `${assetsBase}assets/images/fallback/carousel-code-red.png`,
      genre: "Боевик",
      country: "США",
      year: 2023,
      age: "16+",
      director: "Джон Картер",
      actors: "Крис Эванс, Скарлетт Йоханссон",
      description: "Операция, от которой зависит безопасность мира.",
    },
    {
      id: 3,
      title: "Путеводная звезда",
      rating: 8.7,
      poster: `${assetsBase}assets/images/fallback/carousel-guiding-star.png`,
      genre: "Фантастика",
      country: "Великобритания",
      year: 2022,
      age: "12+",
      director: "Лиза Браун",
      actors: "Том Холланд, Зендая",
      description: "Путешествие к неизведанному за гранью времени.",
    },
    {
      id: 5,
      title: "Судьба героев",
      rating: 8.4,
      poster: `${assetsBase}assets/images/fallback/carousel-echo-of-darkness.png`,
      genre: "Боевик",
      country: "Франция",
      year: 2024,
      age: "12+",
      director: "Пьер Дюпон",
      actors: "Жан Рено, Марион Котийяр",
      description: "Испытания, которые закаляют настоящих героев.",
    },
    {
      id: 6,
      title: "Красная тень",
      rating: 8.2,
      poster: `${assetsBase}assets/images/fallback/carousel-web-of-time.png`,
      genre: "Триллер",
      country: "Россия",
      year: 2021,
      age: "16+",
      director: "Иван Смирнов",
      actors: "Александр Петров, Светлана Ходченкова",
      description: "Опасная игра, где каждый шаг может стать последним.",
    },
    {
      id: 8,
      title: "Таинственная\nнезнакомка",
      rating: 7.9,
      poster: `${assetsBase}assets/images/844bcd2e5896a872b7b9cf235aed590036142e91.png`,
      genre: "Драма",
      country: "Франция",
      year: 2022,
      age: "12+",
      director: "Софи Мартен",
      actors: "Леа Сейду, Венсан Кассель",
      description: "Встреча, которая переворачивает жизнь.",
    },
  ];

  const fallbackSeriesCards = [
    {
      id: 101,
      title: "Грань\nНевидимости",
      rating: 9.1,
      poster: `${assetsBase}assets/images/fallback/series-edge-of-invisibility.png`,
      genre: "Фантастика",
      country: "США",
      year: 2024,
      age: "18+",
      director: "Сара Миллер",
      actors: "Джулия Робертс, Мэттью Макконахи",
      description: "Расследование, которое меняет представление о реальности.",
    },
    {
      id: 102,
      title: "Под куполом\nТайн",
      rating: 8.7,
      poster: `${assetsBase}assets/images/fallback/series-under-dome-of-secrets.png`,
      genre: "Триллер",
      country: "США",
      year: 2024,
      age: "16+",
      director: "Винс Гиллиган",
      actors: "Брайан Крэнстон, Аарон Пол",
      description:
        "История превращения, где каждый шаг ведёт героев к точке невозврата.",
    },
    {
      id: 103,
      title: "Белое\nзеркало",
      rating: 8.6,
      poster: `${assetsBase}assets/images/fallback/series-white-mirror.png`,
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
      poster: `${assetsBase}assets/images/fallback/series-melancholy.png`,
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
      title: "Друзья с Тёмной\nСтороны",
      rating: 8.2,
      poster: `${assetsBase}assets/images/fallback/series-friends-dark-side.png`,
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
      title: "Сердца\nЧетырех",
      rating: 8.1,
      poster: `${assetsBase}assets/images/fallback/series-four-hearts.png`,
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
      poster: `${assetsBase}assets/images/fallback/series-enemies.png`,
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
      title: "Постучись в мое\nокно",
      rating: 7.8,
      poster: `${assetsBase}assets/images/fallback/series-knock-on-my-window.png`,
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
      title: "Ход\nкороля",
      rating: 7.5,
      poster: `${assetsBase}assets/images/fallback/series-kings-move.png`,
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

  // Наборы данных для разных мобильных страниц.
  const datasets = {
    home: fallbackMoviesCards.slice(0, 6),
    movies: fallbackMoviesCards.slice(0, 6),
    series: fallbackSeriesCards,
  };

  // На страницах используются разные классы карточки.
  const card = isMobileSeries
    ? document.querySelector(".movie-card-b") ||
      document.querySelector(".movie-card")
    : document.querySelector(".movie-card");

  if (!card) return;

  let prevBtn = null;
  let nextBtn = null;
  let items = [];
  // Источник нужен странице деталей для резервного сценария.
  let itemsSource = "local";
  let isLoading = false;

  if (isMobileHome) {
    prevBtn = document.querySelector(".vector-1");
    nextBtn = document.querySelector(".vector-2");
    items = datasets.home;
  } else if (isMobileMovies) {
    prevBtn = document.querySelector(".vector-b");
    nextBtn = document.querySelector(".vector-c");
    items = datasets.movies;
  } else if (isMobileSeries) {
    prevBtn = document.querySelector(".vector-c");
    nextBtn = document.querySelector(".vector-d");
    items = datasets.series;
  }

  if (!prevBtn || !nextBtn || items.length === 0) return;

  let index = 0;

  // ==================================================
  // ЗАГРУЗКА КАРТОЧЕК ИЗ API
  // ==================================================

  /**
   * Пытается загрузить карточки из API.
   * При ошибке оставляет локальный fallback без смены пользовательского сценария.
   */
  async function loadFromAPI() {
    if (isLoading) return;
    isLoading = true;

    try {
      if (window.MovieAPI) {
        const isSeries = isMobileSeries;
        let result;

        if (isSeries) {
          result = await window.MovieAPI.getSeries({ page: 1, limit: 6 });
        } else {
          // По ТЗ для листингов без поискового ввода используем случайную выдачу.
          const docs = await window.MovieAPI.getRandomMovies(6, false);
          result = { docs };
        }

        if (result && result.docs && result.docs.length > 0) {
          const isForbiddenCard = (item) => {
            const title = String(item?.title || "").toLowerCase();
            const poster = String(item?.poster || "").toLowerCase();
            return (
              title.includes("тайна леса") ||
              poster.includes("a9829552b0aa01ba8988f0bde8648206689d3797")
            );
          };

          const mapped = result.docs
            .map((movie) => {
              const normalized = window.MovieAPI.normalizeMovie(movie);
              const titleRaw = String(normalized.title || "").trim();
              return {
                id: normalized.id,
                // В визуале допускается перенос строки; в storage сохраняем плоский title.
                title:
                  titleRaw.length > 20
                    ? titleRaw
                        .replace(/\s+/g, " ")
                        .replace(/(.{12,18})\s/, "$1\n")
                    : titleRaw,
                rating: normalized.rating,
                poster: normalized.poster || normalized.posterPreview,
                genre: normalized.genres?.[0] || "",
                country: normalized.countries?.[0] || "",
                year: normalized.year || "",
                age: normalized.ageRating
                  ? String(normalized.ageRating) + "+"
                  : "",
                director: "",
                actors: "",
                description:
                  normalized.shortDescription || normalized.description || "",
              };
            })
            .filter((item) => !isForbiddenCard(item));

          if (mapped.length > 0) {
            items = mapped;
            itemsSource = "api";
            index = 0;
            render();
          }
        }
      }
    } catch (error) {
      logRecoverableError("API request failed, using fallback data", error);
    }

    isLoading = false;
  }

  /**
   * Создает overlay-элементы для карточки.
   */
  function ensureOverlay() {
    if (card.querySelector(".poster-gradient")) return;

    const gradient = document.createElement("div");
    gradient.className = "poster-gradient";

    card.appendChild(gradient);
  }

  /**
   * Обеспечить DOM-элемент бейджа рейтинга в карточке.
   *
   * @returns {HTMLDivElement}
   */
  function ensureRatingBadge() {
    let badge = card.querySelector(".rating-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "rating-badge";
      card.appendChild(badge);
    }

    return /** @type {HTMLDivElement} */ (badge);
  }

  /**
   * Обеспечивает заголовок над карточкой.
   */
  function ensureTitle() {
    const parent = card.parentElement;
    if (!parent) return null;

    let title = parent.querySelector(".mobile-card-title");
    if (!title) {
      title = document.createElement("h3");
      title.className = "mobile-card-title";
      parent.insertBefore(title, card);
    }

    return title;
  }

  /**
   * Рендерит текущую карточку.
   */
  function render() {
    const item = items[index];
    if (!item) return;

    ensureOverlay();
    const ratingBadgeEl = ensureRatingBadge();
    const titleEl = ensureTitle();

    // Постер пишем в `url("...")`, чтобы корректно обрабатывать пробелы и кириллицу.
    let posterRaw = String(item.poster || "").trim();
    try {
      const decoded = decodeURI(posterRaw).replace(/\\/g, "/");
      if (EMBEDDED_BADGE_POSTER_RE.test(decoded)) {
        posterRaw = `${assetsBase}${CLEAN_CODE_RED_POSTER}`;
      }
    } catch (error) {
      logRecoverableError("Poster decode failed", error, {
        poster: posterRaw,
      });
    }
    const posterSafe = posterRaw ? encodeURI(posterRaw) : "";
    card.style.backgroundImage = posterSafe ? `url("${posterSafe}")` : "";
    card.dataset.movieId = String(item.id);

    // Для проблемного ассета принудительно используем режим cover.
    const isProblemPoster = String(item.poster || "").includes(
      "a9829552b0aa01ba8988f0bde8648206689d3797",
    );
    card.classList.toggle("poster-fit-cover", isProblemPoster);

    const ratingValue = Number(item.rating);
    if (Number.isFinite(ratingValue) && ratingValue > 0) {
      ratingBadgeEl.textContent = ratingValue.toFixed(1);
      ratingBadgeEl.hidden = false;
    } else {
      ratingBadgeEl.textContent = "";
      ratingBadgeEl.hidden = true;
    }

    if (titleEl) {
      titleEl.textContent = item.title;
    }

    // После рендера синхронизируем состояние стрелок.
    updateArrowState();
  }

  /**
   * Обновляет состояние стрелок.
   */
  function updateArrowState() {
    if (prevBtn) {
      prevBtn.classList.toggle("disabled", index === 0);
      prevBtn.style.opacity = index === 0 ? "0.3" : "1";
    }
    if (nextBtn) {
      nextBtn.classList.toggle("disabled", index === items.length - 1);
      nextBtn.style.opacity = index === items.length - 1 ? "0.3" : "1";
    }
  }

  /**
   * Навигация по карточкам.
   */
  function go(delta) {
    const newIndex = index + delta;
    if (newIndex >= 0 && newIndex < items.length) {
      index = newIndex;
      render();
    }
  }

  // ==================================================
  // НАВИГАЦИЯ И ВЫБОР КАРТОЧКИ
  // ==================================================

  // Кнопочная навигация карусели.
  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    go(-1);
  });

  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    go(1);
  });

  // Клик сохраняет контекст карточки и открывает страницу деталей.
  card.style.cursor = "pointer";
  card.addEventListener("click", () => {
    const id = card.dataset.movieId;
    if (!id) return;

    // Сохраняем минимум полей для восстановления деталей.
    try {
      const selected = items.find((it) => String(it?.id) === String(id));
      if (selected) {
        const plainTitle = String(selected.title || "")
          .replace(/\n/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        const payload = {
          id: selected.id,
          title: plainTitle,
          rating: selected.rating,
          poster: selected.poster,
          genre: selected.genre || "",
          country: selected.country || "",
          year: selected.year || "",
          age: selected.age || "",
          director: selected.director || "",
          actors: selected.actors || "",
          description: selected.description || "",
          isSeries: Boolean(isMobileSeries),
          source: itemsSource,
        };

        sessionStorage.setItem("last-selected-item", JSON.stringify(payload));
        sessionStorage.setItem("last-selected-item-id", String(selected.id));
      }
    } catch (error) {
      logRecoverableError("SessionStorage write failed", error, {
        id,
        source: itemsSource,
      });
    }

    window.location.href = `${moviePage}?id=${encodeURIComponent(id)}`;
  });

  // ==================================================
  // СВАЙП-НАВИГАЦИЯ
  // ==================================================

  // Свайпы дублируют кнопки навигации.
  let touchStartX = 0;
  let touchEndX = 0;

  card.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true },
  );

  card.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    },
    { passive: true },
  );

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        go(1);
      } else {
        go(-1);
      }
    }
  }

  // ==================================================
  // ТОЧКА ВХОДА
  // ==================================================

  render();

  // Неблокирующая попытка обновить данные с API.
  loadFromAPI();
});
