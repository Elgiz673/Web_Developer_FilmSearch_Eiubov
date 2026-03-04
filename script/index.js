/*
 * Скрипт главной страницы.
 * Формирует карусель карточек, подгружает данные из API и управляет навигацией.
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==================================================
  // БАЗОВЫЕ ЗАВИСИМОСТИ И ЗАЩИТНЫЕ ПРОВЕРКИ
  // ==================================================

  const A = window.AppUtils;

  /**
   * Логирование нефатальных ошибок в карточках главной страницы.
   * Ошибка не должна ломать основной сценарий пользователя.
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
    console.warn(`[Home] ${context}`, { error: text, ...details });
  };

  // Скрипт запускается только на десктопной главной.
  const isMobilePage = A?.isMobilePath
    ? A.isMobilePath()
    : String(window.location.pathname || "").includes("/mobile/");
  if (isMobilePage) return;

  const qs = A?.qs
    ? A.qs.bind(A)
    : (selector) => document.querySelector(selector);
  const setBgImage = A?.setBgImage
    ? A.setBgImage.bind(A)
    : (el, url) => {
        if (el) el.style.backgroundImage = url ? `url(${url})` : "";
      };

  // Не используем `.map(qs)`: второй аргумент map попадёт в `root`.
  const filmCards = [".film-card", ".film-card-1", ".film-card-2"].map(
    (selector) => qs(selector),
  );
  const nextArrow = qs(".vector");
  const prevArrow = qs(".vector-prev");

  // ==================================================
  // ЛОКАЛЬНЫЕ ДАННЫЕ И СЛУЖЕБНЫЕ КАРТЫ ДЛЯ РЕЗЕРВНОГО РЕЖИМА
  // ==================================================

  // Локальный набор на случай недоступности API.
  const fallbackMovies = [
    {
      id: 1,
      title: "Проклятое\nкоролевство",
      rating: 9.8,
      poster: "assets/images/fallback/carousel-cursed-kingdom.png",
      source: "local",
      genre: "Фэнтези, драма",
      country: "Великобритания",
      actors:
        "Альберто Маркез, Наталия Ковальски, Леонардо Родригес, Изабелла Хартман",
      director: "Элиас Торнбридж",
      year: "23 апреля 2023 года",
      age: "16+",
      description:
        "Старинное королевство оказывается на грани распада, когда древнее проклятие возвращается и начинает разрушать мир людей. Героям предстоит пройти через предательство и выбор, чтобы вернуть свет и спасти тех, кого они любят.",
    },
    {
      id: 2,
      title: "Код красный",
      rating: 9.7,
      poster: "assets/images/fallback/carousel-code-red.png",
      source: "local",
      genre: "Боевик, триллер",
      country: "США",
      actors: "Майкл Ривз, Сара Хант, Даниэль Ким, Виктор Грей",
      director: "Кристофер Бланк",
      year: "12 февраля 2024 года",
      age: "16+",
      description:
        "Когда секретный протокол «Код красный» активируется, группа оперативников получает всего одну ночь, чтобы предотвратить катастрофу. На кону — безопасность страны, а доверять приходится только своим инстинктам.",
    },
    {
      id: 3,
      title: "Путеводная звезда",
      rating: 8.7,
      poster: "assets/images/fallback/carousel-guiding-star.png",
      source: "local",
      genre: "Приключения, семейный",
      country: "Россия",
      actors: "Алина Соколова, Артём Волков, Илья Нестеров, Мария Данилова",
      director: "Олег Ветров",
      year: "7 сентября 2022 года",
      age: "6+",
      description:
        "Юная путешественница находит старую карту, ведущую к легендарной путеводной звезде. В дороге её ждут испытания, дружба и открытие силы, которая помогает не сбиться с пути.",
    },
    {
      id: 5,
      title: "Судьба героев",
      rating: 8.4,
      poster: "assets/images/fallback/carousel-echo-of-darkness.png",
      source: "local",
      genre: "Драма, боевик",
      country: "США",
      actors: "Джеймс Ховард, Лили Картер, Оливер Скотт, Рэйчел Янг",
      director: "Николас Грант",
      year: "18 мая 2025 года",
      age: "16+",
      description:
        "Команда людей с разными судьбами объединяется, чтобы остановить угрозу, которую никто не решается назвать вслух. Каждый из них должен решить, готов ли он стать героем, когда ставки слишком высоки.",
    },
    {
      id: 6,
      title: "Красная тень",
      rating: 8.2,
      poster: "assets/images/fallback/carousel-web-of-time.png",
      source: "local",
      genre: "Фантастика, приключения",
      country: "Канада",
      actors: "Эмили Браун, Итан Миллер, Ноа Хьюз, Клара Ричардс",
      director: "София Ли",
      year: "3 ноября 2024 года",
      age: "12+",
      description:
        "Экспедиция в далёкий мир сталкивается с загадочным явлением — красной тенью, меняющей само время. Чтобы вернуться домой, героям нужно разгадать её природу и не потерять друг друга.",
    },
    {
      id: 7,
      title: "Эхо Тьмы",
      rating: 9.1,
      poster: "assets/images/fallback/carousel-prince-and-pauper.png",
      source: "local",
      genre: "Мистика, триллер",
      country: "Россия",
      actors: "Виктория Орлова, Игорь Лавров, Павел Рудин, Нина Шестакова",
      director: "Антон Мельников",
      year: "28 января 2023 года",
      age: "16+",
      description:
        "В маленьком городе исчезают люди, а в ночной тишине слышится зловещее эхо. Следователь и местная журналистка пытаются раскрыть тайну, пока тьма не поглотила всё вокруг.",
    },
  ];

  // По ТЗ главная получает 6 фильмов через /v1.4/movie/{id}.
  // Используем фиксированный набор id для стабильной и воспроизводимой выдачи.
  const HOME_MOVIE_IDS = [435, 326, 448, 2360, 258687, 535341];

  // Карта постеров, которые должны строго соответствовать макету на главной.
  const localPosterByTitle = {
    "проклятое королевство":
      "assets/images/fallback/carousel-cursed-kingdom.png",
    "код красный": "assets/images/fallback/carousel-code-red.png",
    "путеводная звезда": "assets/images/fallback/carousel-guiding-star.png",
    "судьба героев": "assets/images/fallback/carousel-echo-of-darkness.png",
    "красная тень": "assets/images/fallback/carousel-web-of-time.png",
    "эхо тьмы": "assets/images/fallback/carousel-prince-and-pauper.png",
  };

  const localMetaByTitle = {
    "проклятое королевство": {
      genre: "Фэнтези, драма",
      country: "Великобритания",
      actors:
        "Альберто Маркез, Наталия Ковальски, Леонардо Родригес, Изабелла Хартман",
      director: "Элиас Торнбридж",
      year: "23 апреля 2023 года",
      age: "16+",
      description:
        "Проклятое королевство — это фильм, который захватил мое сердце и не отпустит. Этот фильм, с его захватывающим сюжетом и отличными актерами, оставил у меня невероятное впечатление. Каждый кадр этого фильма наполнен эмоциями и драматизмом, что делает его идеальным для тех, кто любит киноискусство.",
    },
    "код красный": {
      genre: "Боевик, триллер",
      country: "США",
      actors: "Майкл Ривз, Сара Хант, Даниэль Ким, Виктор Грей",
      director: "Кристофер Бланк",
      year: "12 февраля 2024 года",
      age: "16+",
      description:
        "Код красный — история о спецоперации, где ошибка стоит слишком дорого. Команда действует на грани возможностей, а каждое решение приближает их либо к спасению, либо к катастрофе.",
    },
    "путеводная звезда": {
      genre: "Приключения, семейный",
      country: "Россия",
      actors: "Алина Соколова, Артём Волков, Илья Нестеров, Мария Данилова",
      director: "Олег Ветров",
      year: "7 сентября 2022 года",
      age: "6+",
      description:
        "Путеводная звезда — добрая приключенческая история о поиске пути и вере в мечту. Героев ждут испытания, дружба и открытие того, что настоящая сила всегда рядом.",
    },
    "судьба героев": {
      genre: "Драма, боевик",
      country: "США",
      actors: "Джеймс Ховард, Лили Картер, Оливер Скотт, Рэйчел Янг",
      director: "Николас Грант",
      year: "18 мая 2025 года",
      age: "16+",
      description:
        "Судьба героев — история людей, вынужденных выбирать между долгом и сердцем. Им предстоит пройти через потери и победы, чтобы понять, кем они являются на самом деле.",
    },
    "красная тень": {
      genre: "Фантастика, приключения",
      country: "Канада",
      actors: "Эмили Браун, Итан Миллер, Ноа Хьюз, Клара Ричардс",
      director: "София Ли",
      year: "3 ноября 2024 года",
      age: "12+",
      description:
        "Красная тень — путешествие в неизведанные миры, где время ведёт себя иначе. Героям нужно разгадать тайну явления, чтобы вернуться домой.",
    },
    "эхо тьмы": {
      genre: "Мистика, триллер",
      country: "Россия",
      actors: "Виктория Орлова, Игорь Лавров, Павел Рудин, Нина Шестакова",
      director: "Антон Мельников",
      year: "28 января 2023 года",
      age: "16+",
      description:
        "Эхо Тьмы — мрачная история о тайнах, которые не хотят быть раскрытыми. Следователь и журналистка сталкиваются с силами, которые сильнее страха.",
    },
    "таинственная незнакомка": {
      genre: "Мелодрама, детектив",
      country: "Франция",
      actors: "Камиль Дюран, Луи Мартен, Жюльет Лоран, Пьер Арно",
      director: "Селин Бове",
      year: "14 июня 2022 года",
      age: "12+",
      description:
        "Таинственная незнакомка — романтическая история, где прошлое не отпускает героев. Любовь здесь становится ключом к разгадке давней тайны.",
    },
    беглец: {
      genre: "Триллер, криминал",
      country: "США",
      actors: "Брайан Коллинз, Мэри Холл, Тревор Нэш, Лора Стил",
      director: "Гаррет Коул",
      year: "9 марта 2021 года",
      age: "16+",
      description:
        "Беглец — история о человеке, который должен доказать невиновность, пока город охотится на него. В этой гонке правда стоит дороже жизни.",
    },
  };

  let sampleMovies = [...fallbackMovies];
  let currentIndex = 0;
  const itemsPerPage = 3;
  let isLoading = false;
  let apiMoviesReady = false;
  const failedPosterUrls = new Set();

  // ==================================================
  // СОХРАНЕНИЕ ДАННЫХ ДЛЯ СТРАНИЦЫ ДЕТАЛЕЙ
  // ==================================================

  /**
   * Сохраняет выбранную карточку для fallback-режима страницы деталей.
   *
   * @param {Record<string, unknown>} payload
   */
  function persistLastSelectedItem(payload) {
    const json = JSON.stringify(payload);

    if (A?.safeStorageSet) {
      A.safeStorageSet("last-selected-item", json, window.sessionStorage);
      A.safeStorageSet(
        "last-selected-item-id",
        String(payload.id ?? ""),
        window.sessionStorage,
      );
      return;
    }

    try {
      sessionStorage.setItem("last-selected-item", json);
      sessionStorage.setItem("last-selected-item-id", String(payload.id ?? ""));
    } catch (error) {
      logRecoverableError("SessionStorage write failed", error, {
        id: payload.id,
      });
    }
  }

  // ==================================================
  // ЗАГРУЗКА И ПОДГОТОВКА ДАННЫХ КАРУСЕЛИ
  // ==================================================

  /**
   * Загружает данные карусели из API.
   * При ошибке сохраняет стабильный UX через локальный fallback.
   */
  async function loadMoviesFromAPI() {
    if (isLoading) return;
    isLoading = true;

    try {
      if (window.MovieAPI) {
        // По ТЗ: 6 фильмов через /v1.4/movie/{id}.
        const docs = await window.MovieAPI.getMoviesByIds(HOME_MOVIE_IDS);
        const result = { docs };

        if (result?.docs?.length) {
          const mapped = result.docs.map((movie) => {
            const normalized = window.MovieAPI.normalizeMovie(movie);
            const titleKey = String(normalized.title || "")
              .replace(/\s+/g, " ")
              .trim()
              .toLowerCase();
            const localPoster = localPosterByTitle[titleKey];
            const localMeta = localMetaByTitle[titleKey];

            return {
              id: normalized.id,
              title: normalized.title,
              rating: normalized.rating,
              poster:
                localPoster || normalized.poster || normalized.posterPreview,
              source: "api",
              genre: localMeta?.genre || normalized.genres?.join(", ") || "",
              country:
                localMeta?.country || normalized.countries?.join(", ") || "",
              year: localMeta?.year || normalized.year || "",
              age: localMeta?.age || normalized.ageRating || "",
              director:
                localMeta?.director || normalized.directors?.join(", ") || "",
              actors: localMeta?.actors || normalized.actors?.join(", ") || "",
              description:
                localMeta?.description ||
                normalized.description ||
                normalized.shortDescription ||
                "",
            };
          });

          const isForbiddenCard = (item) => {
            const title = String(item?.title || "").toLowerCase();
            const poster = String(item?.poster || "").toLowerCase();
            return (
              title.includes("тайна леса") ||
              poster.includes("a9829552b0aa01ba8988f0bde8648206689d3797")
            );
          };
          const filteredMapped = mapped.filter(
            (item) => !isForbiddenCard(item),
          );

          // Для циклической карусели нужен минимум 4-й элемент.
          const minItems = itemsPerPage + 1;
          if (filteredMapped.length >= minItems) {
            sampleMovies = filteredMapped;
            apiMoviesReady = true;
          } else {
            const merged = [
              ...filteredMapped,
              ...fallbackMovies.filter(
                (fallback) =>
                  !filteredMapped.some(
                    (apiItem) =>
                      String(apiItem.id) === String(fallback.id) ||
                      apiItem.poster === fallback.poster,
                  ),
              ),
            ];
            const mergedFiltered = merged.filter(
              (item) => !isForbiddenCard(item),
            );
            sampleMovies = mergedFiltered.length
              ? mergedFiltered
              : [...fallbackMovies];
            apiMoviesReady = sampleMovies.some((m) => m?.source === "api");
          }
        }
      }
    } catch (error) {
      logRecoverableError("API request failed, using fallback data", error);
      sampleMovies = [...fallbackMovies];
      apiMoviesReady = false;
    } finally {
      isLoading = false;
      bindCardClicks();
    }
  }

  /**
   * Нормализует путь к постеру.
   */
  function normalizePosterPath(path) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    if (!path.includes(".")) return path + ".png";
    return path;
  }

  function normalizeTitleKey(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function escapeSvgText(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildInlinePosterPlaceholder(title) {
    const safeTitle = escapeSvgText(
      String(title || "Постер временно недоступен")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 38) || "Постер временно недоступен",
    );

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="520" viewBox="0 0 360 520">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0%" stop-color="#2e2f36"/><stop offset="100%" stop-color="#16171c"/>` +
      `</linearGradient></defs>` +
      `<rect width="360" height="520" fill="url(#g)"/>` +
      `<text x="50%" y="48%" text-anchor="middle" fill="#ffffff" font-size="24" font-family="Inter, Arial, sans-serif">` +
      `${safeTitle}</text>` +
      `<text x="50%" y="56%" text-anchor="middle" fill="#c9c9c9" font-size="16" font-family="Inter, Arial, sans-serif">` +
      `fallback poster</text>` +
      `</svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function buildPosterCandidates(primaryPoster, titleKey) {
    const pool = [];
    if (primaryPoster) pool.push(normalizePosterPath(primaryPoster));

    const localByTitle = localPosterByTitle[titleKey];
    if (localByTitle) pool.push(normalizePosterPath(localByTitle));

    return Array.from(new Set(pool.filter(Boolean)));
  }

  function setPosterWithFallback(
    card,
    primaryPoster,
    { title, titleKey, token },
  ) {
    // Порядок кандидатов важен:
    // API-постер -> локальный постер по названию -> inline-заглушка.
    const candidates = buildPosterCandidates(primaryPoster, titleKey);
    const chain = [...candidates, buildInlinePosterPlaceholder(title)];
    let pointer = 0;

    // Если в карточке уже есть постер, не перетираем его мгновенной заглушкой.
    // Это убирает визуальный "скачок" при повторных рендерах.
    const immediateFallback = buildInlinePosterPlaceholder(title);
    const prevPoster = String(card.dataset.moviePoster || "").trim();
    if (!prevPoster) {
      setBgImage(card, immediateFallback);
      card.dataset.moviePoster = immediateFallback;
    }

    const tryNext = () => {
      if (!card || card.dataset.posterRenderToken !== token) return;
      if (pointer >= chain.length) {
        setBgImage(card, "");
        card.dataset.moviePoster = "";
        return;
      }

      const candidate = chain[pointer++];
      if (!candidate) {
        tryNext();
        return;
      }

      if (
        !candidate.startsWith("data:image/") &&
        failedPosterUrls.has(candidate)
      ) {
        tryNext();
        return;
      }

      if (candidate.startsWith("data:image/")) {
        setBgImage(card, candidate);
        card.dataset.moviePoster = candidate;
        return;
      }

      const probe = new Image();
      probe.onload = () => {
        if (card.dataset.posterRenderToken !== token) return;
        failedPosterUrls.delete(candidate);
        setBgImage(card, candidate);
        card.dataset.moviePoster = candidate;
      };
      probe.onerror = () => {
        failedPosterUrls.add(candidate);
        tryNext();
      };
      probe.src = candidate;
    };

    tryNext();
  }

  // ==================================================
  // РЕНДЕР И ПРИВЯЗКА КАРТОЧЕК
  // ==================================================

  /**
   * Гарантировать наличие DOM-элемента бейджа рейтинга у карточки.
   *
   * @param {HTMLElement} card
   * @returns {HTMLDivElement}
   */
  function ensureRatingBadge(card) {
    let badge = card.querySelector(".rating-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "rating-badge";
      card.appendChild(badge);
    }

    return /** @type {HTMLDivElement} */ (badge);
  }

  /**
   * Обновляет отображение карточек фильмов.
   */
  function updateCards() {
    filmCards.forEach((card, idx) => {
      if (!card) return;

      const movieIndex = currentIndex + idx;

      if (movieIndex < sampleMovies.length) {
        const movie = sampleMovies[movieIndex];

        // Нормализуем DOM карточки: одна overlay-структура + контент.
        const ratingBadges = card.querySelectorAll(".rating-badge");
        const gradients = card.querySelectorAll(".poster-gradient");
        const contents = card.querySelectorAll(".card-content");

        const hasSingleStructure =
          gradients.length === 1 && contents.length === 1;

        if (!hasSingleStructure) {
          card.innerHTML = "";
        } else {
          ratingBadges.forEach((el, idx) => {
            if (idx > 0) el.remove();
          });
          gradients.forEach((el, idx) => {
            if (idx > 0) el.remove();
          });
          contents.forEach((el, idx) => {
            if (idx > 0) el.remove();
          });
        }

        // Гарантируем базовую структуру карточки.
        if (!card.querySelector(".poster-gradient")) {
          const gradient = document.createElement("div");
          gradient.className = "poster-gradient";
          card.appendChild(gradient);
        }

        if (!card.querySelector(".card-content")) {
          const content = document.createElement("div");
          content.className = "card-content";

          const title = document.createElement("h3");
          content.appendChild(title);

          card.appendChild(content);
        }

        const ratingBadgeEl = ensureRatingBadge(card);

        // Токен защищает от гонки асинхронной загрузки постеров
        // при быстром перелистывании карусели.
        const posterUrl = normalizePosterPath(movie.poster);
        const titleKey = normalizeTitleKey(movie.title);
        const posterToken = `${movie.id || "no-id"}-${idx}-${Date.now()}`;
        card.dataset.posterRenderToken = posterToken;
        setPosterWithFallback(card, posterUrl, {
          title: movie.title || "",
          titleKey,
          token: posterToken,
        });
        card.style.display = "block";
        card.dataset.movieTitle = movie.title || "";
        card.dataset.movieGenre = movie.genre || "";
        card.dataset.movieCountry = movie.country || "";
        card.dataset.movieYear = movie.year || "";
        card.dataset.movieAge = movie.age || "";
        card.dataset.movieDirector = movie.director || "";
        card.dataset.movieActors = movie.actors || "";
        card.dataset.movieDescription = movie.description || "";
        card.dataset.movieSource = movie.source || "local";

        // Для проблемного ассета используем cover.
        const isProblemPoster = String(posterUrl || "").includes(
          "a9829552b0aa01ba8988f0bde8648206689d3797",
        );
        card.classList.toggle("poster-fit-cover", isProblemPoster);

        const titleEl = card.querySelector(".card-content h3");
        if (titleEl) titleEl.textContent = movie.title;

        const ratingValue = Number(movie.rating);
        if (Number.isFinite(ratingValue) && ratingValue > 0) {
          card.dataset.movieRating = ratingValue.toFixed(1);
          ratingBadgeEl.textContent = ratingValue.toFixed(1);
          ratingBadgeEl.hidden = false;
        } else {
          card.dataset.movieRating = "";
          ratingBadgeEl.textContent = "";
          ratingBadgeEl.hidden = true;
        }

        // Храним ID в data-атрибуте для перехода на страницу деталей.
        card.dataset.movieId = movie.id;
      } else {
        card.style.display = "none";
      }
    });

    updateArrows();
  }

  /**
   * Обновить состояние стрелок
   */
  function updateArrows() {
    const hasMultiplePages = sampleMovies.length > itemsPerPage;
    const atStart = currentIndex <= 0;
    const atEnd = currentIndex + itemsPerPage >= sampleMovies.length;

    if (prevArrow) {
      const disabled = !hasMultiplePages || atStart;
      prevArrow.classList.toggle("disabled", disabled);
      prevArrow.style.pointerEvents = disabled ? "none" : "auto";
      prevArrow.setAttribute("aria-disabled", disabled ? "true" : "false");
    }
    if (nextArrow) {
      const disabled = !hasMultiplePages || atEnd;
      nextArrow.classList.toggle("disabled", disabled);
      nextArrow.style.pointerEvents = disabled ? "none" : "auto";
      nextArrow.setAttribute("aria-disabled", disabled ? "true" : "false");
    }
  }

  /**
   * Клик по карточке — переход на страницу деталей.
   */
  function handleCardClick(event) {
    const card = event.currentTarget;
    const movieId = card.dataset.movieId;
    if (movieId) {
      try {
        const titleEl = card.querySelector(".card-content h3");
        const ratingValue = card.dataset.movieRating || "";
        const computedBg = getComputedStyle(card).backgroundImage || "";
        const posterMatch = computedBg.match(/url\(["']?(.*?)["']?\)/i);
        const poster = posterMatch?.[1] || card.dataset.moviePoster || "";

        const payload = {
          id: movieId,
          title: card.dataset.movieTitle || titleEl?.textContent || "",
          rating: ratingValue,
          poster: card.dataset.moviePoster || poster,
          genre: card.dataset.movieGenre || "",
          country: card.dataset.movieCountry || "",
          year: card.dataset.movieYear || "",
          age: card.dataset.movieAge || "",
          director: card.dataset.movieDirector || "",
          actors: card.dataset.movieActors || "",
          description: card.dataset.movieDescription || "",
          isSeries: false,
          source: card.dataset.movieSource || "local",
        };
        persistLastSelectedItem(payload);
      } catch (error) {
        logRecoverableError("Card click payload save failed", error, {
          movieId,
        });
      }

      window.location.href = `movie/index.html?id=${movieId}`;
    }
  }

  /**
   * Навесить клики на карточки
   */
  function bindCardClicks() {
    filmCards.forEach((card) => {
      if (!card) return;
      // Защита от дублей обработчиков.
      card.removeEventListener("click", handleCardClick);
      card.addEventListener("click", handleCardClick);
      card.style.cursor = "pointer";
    });
  }

  // ==================================================
  // НАВИГАЦИЯ КАРУСЕЛИ
  // ==================================================

  /**
   * Переключение вперед (циклическое)
   */
  function goNext() {
    if (sampleMovies.length <= itemsPerPage) return;

    if (currentIndex + itemsPerPage < sampleMovies.length) {
      currentIndex += itemsPerPage;
    }

    updateCards();
  }

  /**
   * Переключение назад (циклическое)
   */
  function goPrev() {
    if (sampleMovies.length <= itemsPerPage) return;

    if (currentIndex - itemsPerPage >= 0) {
      currentIndex -= itemsPerPage;
    }

    updateCards();
  }

  // Клики по стрелкам.
  if (nextArrow) {
    nextArrow.style.cursor = "pointer";
    nextArrow.addEventListener("click", goNext);
  }

  if (prevArrow) {
    prevArrow.style.cursor = "pointer";
    prevArrow.addEventListener("click", goPrev);
  }

  updateArrows();

  // Дублируем управление стрелками с клавиатуры.
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      goNext();
    } else if (e.key === "ArrowLeft") {
      goPrev();
    }
  });

  // Свайпы для touch-устройств.
  let touchStartX = 0;
  let touchEndX = 0;

  const carouselContainer = qs(".flex-row-a");
  if (carouselContainer) {
    carouselContainer.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true },
    );

    carouselContainer.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      },
      { passive: true },
    );
  }

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  }

  // ==================================================
  // ТОЧКА ВХОДА
  // ==================================================

  // Карусель рендерим только после завершения первичной загрузки API.
  // Это исключает промежуточный показ fallback-постеров при живом, но медленном API.
  // Fallback остаётся только для реальной ошибки API (обрабатывается в loadMoviesFromAPI).
  bindCardClicks();

  loadMoviesFromAPI().finally(() => {
    updateCards();
  });
});
