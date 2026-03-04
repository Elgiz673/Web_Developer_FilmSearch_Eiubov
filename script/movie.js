/*
 * Скрипт страницы деталей фильма/сериала.
 * Загружает и отображает карточку, трейлер, кадры и рецензии из API.
 */

document.addEventListener("DOMContentLoaded", () => {
  const A = window.AppUtils || {};

  /**
   * Централизованный лог recoverable-ошибок страницы деталей.
   * Сохраняет диагностику без падения интерфейса.
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
    console.warn(`[MoviePage] ${context}`, { error: text, ...details });
  };

  // ID сущности приходит из query-параметра.
  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get("id");

  const isMobile = window.location.pathname.includes("/mobile/");

  // Локальная база на случай недоступности внешних сервисов.
  const sampleDetails = [
    {
      id: 1,
      title: "Принц и нищий",
      genre: "Фэнтези",
      country: "США",
      year: 2025,
      rating: 8.7,
      age: "12+",
      director: "Джеймс Кэмерон",
      actors: "Том Хэнкс, Эмма Стоун, Райан Гослинг",
      poster: "../assets/images/a9829552b0aa01ba8988f0bde8648206689d3797",
      description:
        "Юная героиня отправляется в таинственный лес, чтобы раскрыть древнюю загадку.",
      trailer: "",
      frames: ["../assets/images/a9829552b0aa01ba8988f0bde8648206689d3797"],
      reviews: [
        {
          author: "Алексей М.",
          text: "Удивительный фильм!",
          rating: 9,
          type: "positive",
        },
      ],
    },
    {
      id: 2,
      title: "Проклятое королевство",
      genre: "Драма",
      country: "Великобритания",
      year: 2024,
      rating: 9.0,
      age: "16+",
      director: "Кристофер Нолан",
      actors: "Бенедикт Камбербэтч, Кейт Бланшетт",
      poster: "../assets/images/0f7b757711b70b0bb9f8146c8da81b5cc7ca3aad.png",
      description: "История о храбрых воинах.",
      trailer: "",
      frames: ["../assets/images/0f7b757711b70b0bb9f8146c8da81b5cc7ca3aad.png"],
      reviews: [
        {
          author: "Иван Р.",
          text: "Сильная драма!",
          rating: 10,
          type: "positive",
        },
      ],
    },
    {
      id: 3,
      title: "Грань Невидимости",
      genre: "Боевик",
      country: "США",
      year: 2023,
      rating: 8.1,
      age: "16+",
      director: "Дэвид Лейтч",
      actors: "Киану Ривз, Шарлиз Терон",
      poster: "../assets/images/2dc081c49be870e762ad7f4f7bb24b9135455824",
      description: "Неизвестный герой защищает город.",
      trailer: "",
      frames: ["../assets/images/2dc081c49be870e762ad7f4f7bb24b9135455824"],
      reviews: [
        {
          author: "Егор С.",
          text: "Много экшена!",
          rating: 8,
          type: "positive",
        },
      ],
    },
    {
      id: 4,
      title: "Под куполом Тайн",
      genre: "Фэнтези",
      country: "Франция",
      year: 2022,
      rating: 7.9,
      age: "12+",
      director: "Люк Бессон",
      actors: "Венсан Кассель, Марион Котийяр",
      poster: "../assets/images/473c9413b2f911a679efb90d663d5708f7bdc93a.png",
      description: "Загадочный всадник помогает путникам.",
      trailer: "",
      frames: ["../assets/images/473c9413b2f911a679efb90d663d5708f7bdc93a.png"],
      reviews: [
        { author: "Олег Д.", text: "Красиво!", rating: 8, type: "positive" },
      ],
    },
    {
      id: 5,
      title: "Белое зеркало",
      genre: "Драма",
      country: "Россия",
      year: 2023,
      rating: 8.4,
      age: "12+",
      director: "Андрей Звягинцев",
      actors: "Юлия Пересильд, Данила Козловский",
      poster: "../assets/images/844bcd2e5896a872b7b9cf235aed590036142e91",
      description: "Психологическая драма о секретах.",
      trailer: "",
      frames: ["../assets/images/844bcd2e5896a872b7b9cf235aed590036142e91"],
      reviews: [
        {
          author: "Сергей Л.",
          text: "Сильный сюжет!",
          rating: 9,
          type: "positive",
        },
      ],
    },
    {
      id: 6,
      title: "Меланхолия",
      genre: "Триллер",
      country: "США",
      year: 2024,
      rating: 7.6,
      age: "16+",
      director: "Денис Вильнёв",
      actors: "Оскар Айзек, Джессика Честейн",
      poster: "../assets/images/eb49d8c5e80ce032d225c42462a24fb66a55f743",
      description: "Напряжённый триллер.",
      trailer: "",
      frames: ["../assets/images/eb49d8c5e80ce032d225c42462a24fb66a55f743"],
      reviews: [
        {
          author: "Кирилл Н.",
          text: "Держит в напряжении!",
          rating: 8,
          type: "positive",
        },
      ],
    },
    {
      id: 7,
      title: "Враги",
      genre: "Фантастика",
      country: "США",
      year: 2025,
      rating: 8.2,
      age: "12+",
      director: "Ридли Скотт",
      actors: "Тимоти Шаламе, Зендея",
      poster: "../assets/images/b564ebf395eb131051ff910e1d3378557af5af1c",
      description: "Путешествие по времени.",
      trailer: "",
      frames: ["../assets/images/b564ebf395eb131051ff910e1d3378557af5af1c"],
      reviews: [
        {
          author: "Ольга И.",
          text: "Интересная идея!",
          rating: 8,
          type: "positive",
        },
      ],
    },
    {
      id: 8,
      title: "Друзья с Тёмной Стороны",
      genre: "Ужасы",
      country: "Великобритания",
      year: 2022,
      rating: 7.8,
      age: "18+",
      director: "Джеймс Ван",
      actors: "Патрик Уилсон, Вера Фармига",
      poster: "../assets/images/876acfa920fe8b92a37a54ce8e4c223a3198943a",
      description: "Классический хоррор.",
      trailer: "",
      frames: ["../assets/images/876acfa920fe8b92a37a54ce8e4c223a3198943a"],
      reviews: [
        {
          author: "Дмитрий Ж.",
          text: "Настоящий ужас!",
          rating: 8,
          type: "positive",
        },
      ],
    },
    {
      id: 9,
      title: "Постучись в мое окно",
      genre: "Фантастика",
      country: "США",
      year: 2024,
      rating: 8.9,
      age: "12+",
      director: "Стивен Спилберг",
      actors: "Мэттью Макконахи, Энн Хэтэуэй",
      poster: "../assets/images/a95a817979d9f6c754e1e377b2844afd1e19c314",
      description: "Космическая одиссея.",
      trailer: "",
      frames: ["../assets/images/a95a817979d9f6c754e1e377b2844afd1e19c314"],
      reviews: [
        {
          author: "Светлана Ф.",
          text: "Захватывающе!",
          rating: 9,
          type: "positive",
        },
      ],
    },
    {
      id: 10,
      title: "Сердца Четырех",
      genre: "Боевик",
      country: "США",
      year: 2023,
      rating: 7.5,
      age: "16+",
      director: "Майкл Бэй",
      actors: "Джейсон Стэйтем, Дуэйн Джонсон",
      poster: "../assets/images/d0bccdc26e7438821552fb2e881d6ab11edcd5ff",
      description: "Взрывной экшен.",
      trailer: "",
      frames: ["../assets/images/d0bccdc26e7438821552fb2e881d6ab11edcd5ff"],
      reviews: [
        {
          author: "Виктор М.",
          text: "Классический экшен!",
          rating: 7,
          type: "positive",
        },
      ],
    },
    {
      id: 11,
      title: "Ход короля",
      genre: "Фантастика",
      country: "США",
      year: 2022,
      rating: 9.2,
      age: "12+",
      director: "Стивен Спилберг",
      actors: "Мэттью Макконахи, Энн Хэтэуэй",
      poster: "../assets/images/d6097fa49cfff58178686910fd0297ca28904f49",
      description: "Тайны вселенной.",
      trailer: "",
      frames: ["../assets/images/d6097fa49cfff58178686910fd0297ca28904f49"],
      reviews: [
        {
          author: "Светлана Ф.",
          text: "Визуальное пиршество!",
          rating: 9,
          type: "positive",
        },
      ],
    },
    {
      id: 12,
      title: "Эхо Тьмы",
      genre: "Драма",
      country: "Россия",
      year: 2021,
      rating: 9.1,
      age: "12+",
      director: "Андрей Звягинцев",
      actors: "Юлия Пересильд, Данила Козловский",
      poster: "../assets/images/3e0bb1e0b7f060162e15b5991a49ed436940c25b",
      description: "История о выборе и взрослении.",
      trailer: "",
      frames: ["../assets/images/3e0bb1e0b7f060162e15b5991a49ed436940c25b"],
      reviews: [
        {
          author: "Анна Т.",
          text: "Глубокая история!",
          rating: 8,
          type: "positive",
        },
      ],
    },
    // Сериалы (служебный диапазон id >= 100).
    {
      id: 101,
      title: "Грань Невидимости",
      genre: "Фэнтези",
      country: "США",
      year: 2023,
      rating: 9.5,
      age: "18+",
      director: "Дэвид Бениофф",
      actors: "Эмилия Кларк, Кит Харингтон",
      poster: "../assets/images/0f7b757711b70b0bb9f8146c8da81b5cc7ca3aad.png",
      description: "Эпическая сага.",
      trailer: "",
      frames: ["../assets/images/0f7b757711b70b0bb9f8146c8da81b5cc7ca3aad.png"],
      reviews: [
        {
          author: "Антон Л.",
          text: "Лучший сериал!",
          rating: 10,
          type: "positive",
        },
      ],
    },
    {
      id: 102,
      title: "Под куполом Тайн",
      genre: "Драма",
      country: "США",
      year: 2024,
      rating: 9.4,
      age: "18+",
      director: "Винс Гиллиган",
      actors: "Брайан Крэнстон, Аарон Пол",
      poster: "../assets/images/a9829552b0aa01ba8988f0bde8648206689d3797",
      description: "История превращения.",
      trailer: "",
      frames: ["../assets/images/a9829552b0aa01ba8988f0bde8648206689d3797"],
      reviews: [
        {
          author: "Иван Р.",
          text: "Сильная драма!",
          rating: 10,
          type: "positive",
        },
      ],
    },
    {
      id: 103,
      title: "Белое зеркало",
      genre: "Фантастика",
      country: "США",
      year: 2024,
      rating: 8.8,
      age: "16+",
      director: "Братья Даффер",
      actors: "Милли Бобби Браун",
      poster: "../assets/images/876acfa920fe8b92a37a54ce8e4c223a3198943a",
      description: "Мистические события.",
      trailer: "",
      frames: ["../assets/images/876acfa920fe8b92a37a54ce8e4c223a3198943a"],
      reviews: [
        {
          author: "Ольга И.",
          text: "Атмосферно!",
          rating: 9,
          type: "positive",
        },
      ],
    },
  ];

  // Нормализует пути к ассетам с учетом desktop/mobile глубины маршрута.
  function normalizeAssetPath(path) {
    if (!path) return "";
    let out = String(path);
    if (out.startsWith("http") || out.startsWith("file:")) return out;
    if (out.startsWith("assets/")) {
      out = isMobile ? `../../${out}` : `../${out}`;
    }
    if (isMobile) out = out.replace("../assets/", "../../assets/");
    if (!/\.(png|jpe?g|webp|svg)$/i.test(out)) out += ".png";
    return out;
  }

  const CURSED_KINGDOM_TRAILER_STUB = {
    title: "проклятое королевство",
    bg: "assets/images/fallback/cursed-trailer-bg.png",
    play: "assets/images/fallback/cursed-trailer-play.svg",
  };

  const CURSED_KINGDOM_FRAMES = [
    "assets/images/fallback/cursed-frame-1.png",
    "assets/images/fallback/cursed-frame-2.png",
  ];

  function normalizeMovieTitle(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  // Ключевые узлы страницы.
  const posterContainer = document.getElementById("movie-poster-container");
  const titleEl = document.getElementById("movie-title");
  const genreEl = document.getElementById("movie-genre");
  const countryEl = document.getElementById("movie-country");
  const yearEl = document.getElementById("movie-year");
  const ageEl = document.getElementById("movie-age");
  const directorEl = document.getElementById("movie-director");
  const actorsEl = document.getElementById("movie-actors");
  const aboutSectionTitleEl = document.getElementById("about-section-title");
  const ratingEl = document.getElementById("movie-rating");
  const descriptionEl = document.getElementById("movie-description");
  const trailerContainer = document.querySelector(
    ".rectangle-3, .trailer-placeholder",
  );
  const framesContainer = document.querySelector(
    ".flex-row-f, .frames-container",
  );
  const reviewsContainer = document.querySelector(
    ".flex-row, .reviews-container",
  );

  /**
   * Служебное состояние динамической подстройки макета блока "О фильме".
   * Нужна для Figma-верстки с абсолютным позиционированием.
   */
  let aboutFilmLayoutBound = false;
  let aboutFilmRaf = 0;
  let aboutFilmResizeTimer = 0;

  /**
   * Гарантирует видимость футера при увеличении высоты контента карточки.
   * Без этой подстройки фиксированная высота контейнера может обрезать низ страницы.
   */
  function ensureFooterVisible() {
    const main = document.querySelector(".main-container");
    if (!main) return;

    const footer = document.querySelector(".rectangle-1d, .rectangle-1e");

    // Запоминаем исходную высоту для безопасного отката inline-правок.
    if (!main.dataset.baseHeight) {
      const base = Math.ceil(
        parseFloat(getComputedStyle(main).height) || main.offsetHeight || 0,
      );
      if (base) main.dataset.baseHeight = String(base);
    }
    const baseH = Math.ceil(parseFloat(main.dataset.baseHeight || "0") || 0);

    const mainRect = main.getBoundingClientRect();
    let needed = 0;

    if (footer) {
      const footerRect = footer.getBoundingClientRect();
      needed = Math.ceil(footerRect.bottom - mainRect.top);
    } else {
      // Резервный путь, если футер не найден по селектору.
      const kids = Array.from(main.children || []);
      needed = kids.reduce((max, el) => {
        const r = el.getBoundingClientRect();
        const bottom = r.bottom - mainRect.top;
        return Math.max(max, bottom);
      }, 0);
      needed = Math.ceil(needed);
    }

    const target = Math.max(baseH, needed);
    if (!target) return;

    const currentComputed = Math.ceil(
      parseFloat(getComputedStyle(main).height) || main.offsetHeight || 0,
    );

    // Не добавляем искусственный запас снизу.
    if (target !== currentComputed) {
      if (target === baseH) {
        // Возвращаем управление высотой обратно CSS.
        main.style.height = "";
        delete main.dataset.autoExpanded;
      } else {
        main.style.height = `${target}px`;
        main.dataset.autoExpanded = "1";
      }
    }
  }

  function scheduleAboutFilmLayoutAdjust() {
    if (aboutFilmRaf) cancelAnimationFrame(aboutFilmRaf);
    aboutFilmRaf = requestAnimationFrame(() => {
      aboutFilmRaf = 0;
      adjustAboutFilmLayout();
      ensureFooterVisible();
    });
  }

  function bindAboutFilmLayoutAdjustments() {
    if (aboutFilmLayoutBound) return;
    if (!document.querySelector(".flex-row-ec")) return;

    aboutFilmLayoutBound = true;

    window.addEventListener("resize", () => {
      clearTimeout(aboutFilmResizeTimer);
      aboutFilmResizeTimer = setTimeout(scheduleAboutFilmLayoutAdjust, 120);
    });

    window.addEventListener("load", scheduleAboutFilmLayoutAdjust);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready
        .then(scheduleAboutFilmLayoutAdjust)
        .catch((error) => {
          logRecoverableError("Fonts ready hook failed", error);
        });
    }
  }

  function adjustAboutFilmLayout() {
    const container = document.querySelector(".flex-row-ec");
    if (!container) return;

    const title = document.getElementById("movie-title");
    const about = document.querySelector(".about-film");
    const genreLabel = document.querySelector(".genre");
    const genreValue = document.getElementById("movie-genre");
    const countryLabel = document.querySelector(".production-country");
    const countryValue = document.getElementById("movie-country");
    const actorsLabel = document.querySelector(".actors");
    const actorsValue = document.getElementById("movie-actors");

    const shiftTargets = [
      about,
      genreLabel,
      genreValue,
      countryLabel,
      countryValue,
      actorsLabel,
      actorsValue,
    ].filter(Boolean);
    const absTargets = shiftTargets.filter(
      (el) => getComputedStyle(el).position === "absolute",
    );
    absTargets.forEach((el) => {
      if (!el.dataset.baseTop) {
        const topRaw = getComputedStyle(el).top;
        const top = Number.isFinite(parseFloat(topRaw))
          ? parseFloat(topRaw)
          : 0;
        el.dataset.baseTop = String(top);
      }
    });

    const baseTitleHeight = title
      ? Math.ceil(parseFloat(getComputedStyle(title).height) || 0)
      : 0;
    const titleScrollH = title
      ? Math.ceil(title.scrollHeight || 0)
      : baseTitleHeight;
    const titleDelta = Math.max(0, titleScrollH - (baseTitleHeight || 172));

    absTargets.forEach((el) => {
      const baseTop = parseFloat(el.dataset.baseTop || "0") || 0;
      el.style.top = `${baseTop + titleDelta}px`;
    });

    const baseContainerHeight = Math.ceil(
      parseFloat(getComputedStyle(container).height) || 553,
    );
    if (!actorsValue) {
      container.style.height = `${baseContainerHeight}px`;
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const actorsRect = actorsValue.getBoundingClientRect();
    const actorsBottom = Math.max(
      Math.ceil(actorsRect.bottom - containerRect.top),
      (actorsValue.offsetTop || 0) + Math.ceil(actorsValue.scrollHeight || 0),
    );

    const padding = 24;
    const neededHeight = Math.max(baseContainerHeight, actorsBottom + padding);
    container.style.height = `${Math.ceil(neededHeight)}px`;
  }

  // Сохраняем шаблон рецензий для повторных рендеров.
  const reviewsTemplateHTML = reviewsContainer
    ? reviewsContainer.innerHTML
    : "";

  // DOM-хелперы для единообразного обновления узлов.
  const setText = (el, value) => {
    if (!el) return;
    el.textContent = value ?? "";
  };

  const setBgImage = (el, url) => {
    if (!el) return;
    const rawUrl = url ? String(url).trim() : "";
    if (!rawUrl) {
      el.style.backgroundImage = "none";
      return;
    }
    const alreadyEncoded = /%[0-9A-Fa-f]{2}/.test(rawUrl);
    const safeUrl = alreadyEncoded ? rawUrl : encodeURI(rawUrl);
    el.style.backgroundImage = `url("${safeUrl}")`;
  };

  const clearNode = (el) => {
    if (el) el.innerHTML = "";
  };

  const setRatingBadge = (el, rating) => {
    if (!el) return;

    const parsedRating = Number(rating);
    const hasRating = Number.isFinite(parsedRating) && parsedRating > 0;

    el.classList.remove("rating-badge--high", "rating-badge--warm");

    if (!hasRating) {
      el.textContent = "";
      el.hidden = true;
      return;
    }

    el.textContent = parsedRating.toFixed(1);
    el.classList.add(
      parsedRating >= 8.5 ? "rating-badge--high" : "rating-badge--warm",
    );
    el.hidden = false;
  };

  const resetTrailerContainer = () => {
    if (!trailerContainer) return;
    trailerContainer.style.backgroundImage = "none";
    trailerContainer.style.background = "none";

    // Сохраняем нативный <video> в DOM (для формального соответствия ТЗ)
    // и очищаем только динамически добавляемые узлы.
    const staticVideo = trailerContainer.querySelector("#movie-trailer-video");
    if (staticVideo) {
      staticVideo.hidden = true;
      staticVideo.removeAttribute("src");
      staticVideo.removeAttribute("poster");
      try {
        staticVideo.load();
      } catch (error) {
        logRecoverableError("Static trailer video reset failed", error);
      }
    }

    Array.from(trailerContainer.children).forEach((child) => {
      if (child && child.id === "movie-trailer-video") return;
      child.remove();
    });
  };

  /**
   * Показать индикатор загрузки
   */
  function showLoading() {
    setText(titleEl, "Загрузка...");

    // Сразу убираем статичный плейсхолдер, чтобы пользователь
    // не запускал локальный overlay до появления реального плеера.
    if (trailerContainer) {
      resetTrailerContainer();
      trailerContainer.style.backgroundImage = "none";
      trailerContainer.style.background = "#000";
    }
  }

  function extractImageUrls(resp) {
    const docs = Array.isArray(resp?.docs)
      ? resp.docs
      : Array.isArray(resp)
        ? resp
        : [];
    return (
      docs
        // Приоритет отдаем полноразмерным кадрам.
        .map((d) => d?.imageUrl || d?.url || d?.src || d?.previewUrl)
        .filter(Boolean)
        .map(String)
    );
  }

  /**
   * Загружает кадры с приоритетом типов и fallback на постер.
   * Это предотвращает пустой блок "Кадры" при частичных ответах API.
   */
  async function loadFramesFromApi(id, posterFallbackUrl) {
    if (!window.MovieAPI?.getMovieImages) {
      return posterFallbackUrl
        ? [String(posterFallbackUrl), String(posterFallbackUrl)]
        : [];
    }

    const typesPriority = [
      "STILL",
      "SCREENSHOT",
      "SHOOTING",
      "FAN_ART",
      "PROMO",
      "POSTER",
    ];

    const collected = [];

    for (const type of typesPriority) {
      try {
        const items = await window.MovieAPI.getMovieImages(id, 1, 20, type);
        collected.push(...extractImageUrls(items));
        if (collected.length >= 2) break;
      } catch (error) {
        logRecoverableError("Frame load by type failed", error, {
          movieId: id,
          imageType: type,
        });
      }
    }

    if (!collected.length) {
      try {
        const anyItems = await window.MovieAPI.getMovieImages(id, 1, 20, null);
        collected.push(...extractImageUrls(anyItems));
      } catch (error) {
        logRecoverableError("Frame load fallback failed", error, {
          movieId: id,
        });
      }
    }

    if (!collected.length && posterFallbackUrl) {
      collected.push(String(posterFallbackUrl));
    }

    const unique = [...new Set(collected.filter(Boolean).map(String))];
    if (unique.length === 1) return [unique[0], unique[0]];
    return unique;
  }

  /**
   * Загрузить данные фильма
   */
  let stored = null;

  function getStoredSelectedItem(errorContext) {
    try {
      const raw = sessionStorage.getItem("last-selected-item");
      const data = raw ? JSON.parse(raw) : null;
      const storedId = sessionStorage.getItem("last-selected-item-id");

      if (
        data &&
        String(data.id) === String(storedId) &&
        String(storedId) === String(movieId)
      ) {
        return data;
      }
    } catch (error) {
      logRecoverableError(errorContext, error, {
        storageKey: "last-selected-item",
      });
    }
    return null;
  }

  function isCursedKingdomMovie(movie) {
    const fromMovie = normalizeMovieTitle(movie?.title);
    if (fromMovie === CURSED_KINGDOM_TRAILER_STUB.title) return true;

    const fromStored = normalizeMovieTitle(stored?.title);
    return fromStored === CURSED_KINGDOM_TRAILER_STUB.title;
  }

  function getCursedKingdomFrames() {
    const normalized = CURSED_KINGDOM_FRAMES.map((path) =>
      encodeURI(normalizeAssetPath(path)),
    ).filter(Boolean);
    return normalized.length === 1
      ? [normalized[0], normalized[0]]
      : normalized;
  }

  function renderCursedKingdomTrailerStub() {
    if (!trailerContainer) return;

    resetTrailerContainer();

    const bgPath = normalizeAssetPath(CURSED_KINGDOM_TRAILER_STUB.bg);
    const playPath = normalizeAssetPath(CURSED_KINGDOM_TRAILER_STUB.play);

    trailerContainer.style.background = `url("${encodeURI(bgPath)}") no-repeat center`;
    trailerContainer.style.backgroundSize = "cover";
    trailerContainer.style.backgroundPosition = "center";
    trailerContainer.style.overflow = "hidden";
    trailerContainer.style.position = "relative";

    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.className = "vector trailer-stub-play";
    playButton.setAttribute("aria-label", "Воспроизвести трейлер");

    const iconSize = isMobile ? 56 : 115;
    playButton.style.position = "absolute";
    playButton.style.top = "50%";
    playButton.style.left = "50%";
    playButton.style.width = `${iconSize}px`;
    playButton.style.height = `${iconSize}px`;
    playButton.style.margin = "0";
    playButton.style.transform = "translate(-50%, -50%)";
    playButton.style.border = "0";
    playButton.style.padding = "0";
    playButton.style.backgroundColor = "transparent";
    playButton.style.backgroundImage = `url("${encodeURI(playPath)}")`;
    playButton.style.backgroundRepeat = "no-repeat";
    playButton.style.backgroundPosition = "center";
    playButton.style.backgroundSize = "100% 100%";
    playButton.style.cursor = "pointer";
    playButton.style.zIndex = "41";

    trailerContainer.appendChild(playButton);
  }

  function mapStoredItemToMovie(storedItem) {
    const parsedRating = Number(storedItem?.rating);
    return {
      id: storedItem?.id,
      title: storedItem?.title || "Фильм",
      rating: Number.isFinite(parsedRating) ? parsedRating : null,
      poster: storedItem?.poster || "",
      genre: storedItem?.genre || "—",
      country: storedItem?.country || "—",
      year: storedItem?.year || "—",
      age: storedItem?.age || "—",
      director: storedItem?.director || "—",
      actors: storedItem?.actors || "—",
      description: storedItem?.description || "",
      isSeries: Boolean(storedItem?.isSeries),
      frames: [],
      reviews: [],
    };
  }

  async function loadMovieData() {
    if (!movieId) {
      showNotFound();
      return;
    }

    showLoading();

    stored = getStoredSelectedItem("Stored payload parse failed");

    if (stored && stored.source === "local") {
      const normalizedStored = mapStoredItemToMovie(stored);
      displayMovie(normalizedStored, false);
      return;
    }

    try {
      // Основной сценарий: загрузка карточки и зависимых данных из API.
      if (window.MovieAPI) {
        const movie = await window.MovieAPI.getMovieById(movieId);

        if (movie) {
          const normalized = window.MovieAPI.normalizeMovie(movie);

          // Рендерим карточку сразу после базовых данных фильма,
          // чтобы резолвер трейлера стартовал без ожидания staff/reviews.
          displayMovie(normalized, true);

          // Убираем статичный fallback-рейтинг рецензий из HTML,
          // пока API-отзывы подгружаются асинхронно.
          displayReviewsLoading();

          // Кадры и рецензии запускаем параллельно,
          // чтобы один блок не задерживал другой.
          const framesTask = (async () => {
            try {
              const posterFallback =
                normalized.poster || normalized.posterPreview || "";
              const urls = await loadFramesFromApi(movieId, posterFallback);
              if (urls.length) {
                displayFrames(urls);
              } else {
                const framesTitle =
                  document.querySelector(".frames-from-movie");
                if (framesContainer) framesContainer.style.display = "none";
                if (framesTitle) framesTitle.style.display = "none";
              }
            } catch (error) {
              logRecoverableError("Failed to load frames", error, {
                movieId,
              });
            }
          })();

          const reviewsTask = (async () => {
            try {
              if (!window.MovieAPI?.getMovieReviews) {
                displayReviews([]);
                return;
              }

              const reviews = await window.MovieAPI.getMovieReviews(
                movieId,
                1,
                5,
              );
              const docs = Array.isArray(reviews?.docs)
                ? reviews.docs
                : Array.isArray(reviews?.items)
                  ? reviews.items
                  : [];
              displayReviews(docs);
            } catch (error) {
              logRecoverableError("Failed to load reviews", error, {
                movieId,
              });
              displayReviews([]);
            }
          })();

          // Персоналии запрашиваются отдельным шагом.
          try {
            if (window.MovieAPI.getMovieStaff) {
              const staff = await window.MovieAPI.getMovieStaff(movieId);
              if (Array.isArray(staff)) {
                normalized.directors = staff
                  .filter((p) => {
                    const prof = String(
                      p.professionText || p.professionKey || "",
                    ).toLowerCase();
                    return prof.includes("режисс") || prof.includes("director");
                  })
                  .map((p) => p.nameRu || p.nameEn || p.name || "")
                  .filter(Boolean);
                normalized.actors = staff
                  .filter((p) => {
                    const prof = String(
                      p.professionText || p.professionKey || "",
                    ).toLowerCase();
                    return (
                      prof.includes("актёр") ||
                      prof.includes("актер") ||
                      prof.includes("actor")
                    );
                  })
                  .map((p) => p.nameRu || p.nameEn || p.name || "")
                  .filter(Boolean);
              }

              // Обновляем только нужные поля, не перезапуская трейлерный рендер.
              if (directorEl) {
                directorEl.textContent =
                  normalized.directors?.join(", ") || stored?.director || "—";
              }
              if (actorsEl) {
                actorsEl.textContent =
                  normalized.actors?.join(", ") || stored?.actors || "—";
              }
            }
          } catch (error) {
            logRecoverableError("Failed to load staff", error, {
              movieId,
            });
          }

          await Promise.allSettled([framesTask, reviewsTask]);

          return;
        }
      }
    } catch (error) {
      logRecoverableError("API request failed, using fallback data", error, {
        movieId,
      });
    }

    // Вторичный fallback: данные последнего клика из sessionStorage.
    if (stored) {
      const normalizedStored = mapStoredItemToMovie(stored);
      displayMovie(normalizedStored, false);
      return;
    }

    // Финальный fallback: локальная коллекция sampleDetails.
    const details = sampleDetails.find(
      (item) => item.id === parseInt(movieId, 10),
    );
    if (details) {
      displayMovie(details, false);
    } else {
      showNotFound();
    }
  }

  /**
   * Отобразить данные фильма
   */
  function displayMovie(movie, isFromAPI) {
    document.title = `${movie.title} — Что сегодня посмотреть?`;

    // Заголовок блока зависит от типа контента.
    if (aboutSectionTitleEl) {
      const isSeriesByType = __knIsSeries__(movie);
      const isSeriesByStored = Boolean(stored && stored.isSeries);
      const isSeriesByFlag = Boolean(movie && movie.isSeries);
      const isSeriesByFallbackId = Number(movie && movie.id) >= 100;
      const isSeries =
        isSeriesByType ||
        isSeriesByStored ||
        isSeriesByFlag ||
        isSeriesByFallbackId;

      aboutSectionTitleEl.textContent = isSeries ? "О сериале" : "О фильме";
    }

    // Для API берем основной постер, затем превью и данные из storage.
    const posterUrl = isFromAPI
      ? movie.poster || movie.posterPreview || stored?.poster || ""
      : normalizeAssetPath(movie.poster);
    const safePosterUrl = posterUrl || "";
    if (posterContainer) {
      setBgImage(posterContainer, safePosterUrl);

      // На мобильной версии адаптируем fit постера под соотношение сторон.
      const containerRect = posterContainer.getBoundingClientRect();
      const containerRatio = containerRect.height
        ? containerRect.width / containerRect.height
        : 0;

      if (safePosterUrl) {
        const img = new Image();
        img.onload = () => {
          const imageRatio = img.naturalHeight
            ? img.naturalWidth / img.naturalHeight
            : 0;
          const ratioDiff = Math.abs(imageRatio - containerRatio);
          const shouldCover = isMobile && ratioDiff > 0.08;
          posterContainer.classList.toggle("poster-fit-cover", shouldCover);
        };
        img.src = safePosterUrl;
      } else {
        posterContainer.classList.remove("poster-fit-cover");
      }
    }

    // Сохраняем постер для fallback-рендера трейлерного блока.
    if (trailerContainer) {
      trailerContainer.dataset.poster = safePosterUrl;
    }

    // Основная карточка данных фильма/сериала.
    if (titleEl) titleEl.textContent = movie.title;
    if (genreEl)
      genreEl.textContent = isFromAPI
        ? movie.genres?.join(", ") || stored?.genre || "—"
        : movie.genre || "—";
    if (countryEl)
      countryEl.textContent = isFromAPI
        ? movie.countries?.join(", ") || stored?.country || "—"
        : movie.country || "—";
    if (yearEl) yearEl.textContent = movie.year || stored?.year || "—";
    if (ageEl)
      ageEl.textContent = isFromAPI
        ? movie.ageRating || stored?.age || "—"
        : movie.age || "—";
    if (directorEl)
      directorEl.textContent = isFromAPI
        ? movie.directors?.join(", ") || stored?.director || "—"
        : movie.director || "—";
    if (actorsEl)
      actorsEl.textContent = isFromAPI
        ? movie.actors?.join(", ") || stored?.actors || "—"
        : movie.actors || "—";
    setRatingBadge(ratingEl, movie.rating);
    if (descriptionEl) {
      const storedDescription = stored?.description || "";
      const baseDescription = movie.description || storedDescription || "";
      const title = movie.title || stored?.title || "";
      if (title && baseDescription) {
        const re = /^[^—\-:]+[—\-:]/;
        const normalized = baseDescription.replace(re, `${title} —`);
        descriptionEl.textContent = normalized;
      } else {
        descriptionEl.textContent = baseDescription;
      }
    }

    // После рендера синхронизируем размеры блоков Figma-верстки.
    bindAboutFilmLayoutAdjustments();
    scheduleAboutFilmLayoutAdjust();

    // Трейлер.
    if (trailerContainer) {
      // В API-сценарии отключаем статичный fallback-фон/кнопку из шаблона,
      // чтобы резервная картинка не отображалась поверх состояния загрузки.
      if (isFromAPI) {
        trailerContainer.style.backgroundImage = "none";
        trailerContainer.style.background = "#000";
        const staticPlayOverlay = trailerContainer.querySelector(".vector");
        if (staticPlayOverlay) {
          staticPlayOverlay.remove();
        }
      }

      resolveAndDisplayTrailer(movie, isFromAPI);
    }

    // Кадры.
    const frames = isCursedKingdomMovie(movie)
      ? getCursedKingdomFrames()
      : isFromAPI
        ? movie.frames
        : movie.frames?.map((f) => normalizeAssetPath(f));
    if (frames && frames.length > 0) {
      displayFrames(frames);
    }

    // Рецензии в fallback-режиме.
    if (!isFromAPI && movie.reviews) {
      displayReviewsFallback(movie.reviews);
    }
  }

  /**
   * Показать сообщение "не найдено"
   */

  function showNotFound() {
    document.title = "Фильм не найден — Что сегодня посмотреть?";

    // Пытаемся восстановить данные последнего выбранного элемента.
    const data = getStoredSelectedItem(
      "Stored payload parse in not-found failed",
    );
    if (data) {
      const posterUrl = data.poster || "";
      setBgImage(posterContainer, posterUrl);
      if (posterContainer) {
        const isProblemPoster = String(posterUrl || "").includes(
          "a9829552b0aa01ba8988f0bde8648206689d3797",
        );
        posterContainer.classList.toggle("poster-fit-cover", isProblemPoster);
      }

      setText(titleEl, data.title || "Фильм не найден");
      setText(genreEl, data.genre || "—");
      setText(countryEl, data.country || "—");
      setText(yearEl, data.year || "—");
      setText(ageEl, "—");
      setText(directorEl, "—");
      setText(actorsEl, "—");
      setRatingBadge(ratingEl, data.rating);

      // В not-found скрываем зависимые блоки.
      resetTrailerContainer();
      clearNode(framesContainer);
      clearNode(reviewsContainer);
      return;
    }

    setBgImage(posterContainer, "");
    setText(titleEl, "Фильм не найден");
    setText(genreEl, "—");
    setText(countryEl, "—");
    setText(yearEl, "—");
    setText(ageEl, "—");
    setText(directorEl, "—");
    setText(actorsEl, "—");
    setRatingBadge(ratingEl, null);

    // Скрываем зависимые блоки, чтобы не оставались пустые контейнеры.
    resetTrailerContainer();
    clearNode(framesContainer);
    clearNode(reviewsContainer);
  }

  /**
   * Отобразить трейлер
   */

  async function resolveAndDisplayTrailer(movie, isFromAPI = false) {
    if (!trailerContainer) return;

    const isSupportedTrailerUrl = (url) => {
      const s = String(url || "").toLowerCase();
      return (
        s.includes("youtube.com/") ||
        s.includes("youtu.be/") ||
        s.includes("rutube.ru/")
      );
    };

    // Показываем резервный stub только в fallback-режиме (без API-данных).
    if (!isFromAPI && isCursedKingdomMovie(movie)) {
      renderCursedKingdomTrailerStub();
      return;
    }

    const posterUrl =
      trailerContainer &&
      trailerContainer.dataset &&
      trailerContainer.dataset.poster
        ? String(trailerContainer.dataset.poster || "").trim()
        : "";

    // Если трейлер уже найден, используем его без повторного запроса.
    const existing = Array.isArray(movie?.trailers)
      ? movie.trailers.filter(Boolean)
      : [];
    const firstSupportedExisting = existing.find((u) =>
      isSupportedTrailerUrl(u),
    );
    if (firstSupportedExisting) {
      displayTrailer(firstSupportedExisting, posterUrl);
      return;
    }

    // Иначе выполняем отдельный поиск через MovieAPI.
    try {
      if (window.MovieAPI && window.MovieAPI.getMovieVideos) {
        const videos = await window.MovieAPI.getMovieVideos(movie);
        const list = Array.isArray(videos) ? videos : [];

        // Предпочитаем YouTube, затем RuTube, затем любой валидный источник.
        const firstYoutube = list.find((v) => {
          const raw = String(v?.embedUrl || v?.url || "").toLowerCase();
          return raw.includes("youtube.com/") || raw.includes("youtu.be/");
        });

        const firstRutube = list.find((v) => {
          const raw = String(v?.embedUrl || v?.url || "").toLowerCase();
          return raw.includes("rutube.ru/");
        });

        const winner = firstYoutube || firstRutube || null;
        const url = winner ? winner.embedUrl || winner.url : "";

        if (url) {
          displayTrailer(url, posterUrl);
          return;
        }
      }
    } catch (error) {
      logRecoverableError("Trailer lookup via MovieAPI failed", error, {
        movieId: movie?.id,
      });
    }

    // Дополнительный fallback: прямой поиск RuTube по названию.
    try {
      const year = String(movie?.year || stored?.year || "").trim();
      const isSeries =
        __knIsSeries__(movie) ||
        Boolean(movie?.isSeries) ||
        Boolean(stored?.isSeries);

      const titleCandidates = __uniqNonEmpty__([
        movie?.title,
        movie?.alternativeTitle,
        movie?.nameRu,
        movie?.nameOriginal,
        movie?.nameEn,
        stored?.title,
      ]).slice(0, 4);

      let rutubeEmbed = "";

      for (const title of titleCandidates) {
        rutubeEmbed = await findRutubeTrailerEmbedUrl(title, year, {
          isSeries,
        });
        if (rutubeEmbed) break;
      }

      if (rutubeEmbed) {
        displayTrailer(rutubeEmbed, posterUrl);
        return;
      }
    } catch (error) {
      logRecoverableError("RuTube trailer lookup failed", error, {
        movieId: movie?.id,
        title: movie?.title,
      });
    }

    showTrailerMessage("Трейлер недоступен");
  }

  // ===== Внутренние кэши и утилиты трейлерного резолвера =====
  const __KN_SEARCH_CACHE__ = new Map();

  // Кэш и inflight-дедупликация для запросов через CORS-прокси.
  const __FETCH_TEXT_CACHE__ = new Map();
  const __FETCH_TEXT_INFLIGHT__ = new Map();
  const __FETCH_TEXT_TTL_MS__ = 10 * 60 * 1000;

  let __JINA_COOLDOWN_UNTIL__ = 0;
  let __JINA_LAST_TS__ = 0;
  const __JINA_MIN_INTERVAL_MS__ = 750;
  let __JINA_QUEUE__ = Promise.resolve();

  function __sleep__(ms) {
    return new Promise((r) => setTimeout(r, Math.max(0, Number(ms) || 0)));
  }

  function __cacheGetFetchText__(url) {
    const key = String(url || "").trim();
    if (!key) return null;
    const v = __FETCH_TEXT_CACHE__.get(key);
    if (!v) return null;
    if (Date.now() - (v.t || 0) > __FETCH_TEXT_TTL_MS__) {
      __FETCH_TEXT_CACHE__.delete(key);
      return null;
    }
    return v.text || "";
  }

  function __cacheSetFetchText__(url, text) {
    const key = String(url || "").trim();
    if (!key) return;
    __FETCH_TEXT_CACHE__.set(key, { t: Date.now(), text: String(text || "") });
  }

  function isKinonewsTrailerUrl(url) {
    const s = String(url || "").toLowerCase();
    return (
      s.includes("kinonews.ru/viewtrailer") ||
      s.includes("kinonews.ru/trailers")
    );
  }

  function normalizeKinonewsTrailerEmbedUrl(url) {
    const s = String(url || "").trim();
    if (!s) return "";

    // Нормализуем URL: trailers<ID> -> viewtrailer<ID>.
    const mTrailer = s.match(/kinonews\.ru\/trailers(\d+)\//i);
    if (mTrailer && mTrailer[1])
      return `https://www.kinonews.ru/viewtrailer${mTrailer[1]}/`;

    const mView = s.match(/kinonews\.ru\/viewtrailer(\d+)\//i);
    if (mView && mView[1])
      return `https://www.kinonews.ru/viewtrailer${mView[1]}/`;

    // Варианты без завершающего слеша.
    const mTrailer2 = s.match(/kinonews\.ru\/trailers(\d+)/i);
    if (mTrailer2 && mTrailer2[1])
      return `https://www.kinonews.ru/viewtrailer${mTrailer2[1]}/`;

    const mView2 = s.match(/kinonews\.ru\/viewtrailer(\d+)/i);
    if (mView2 && mView2[1])
      return `https://www.kinonews.ru/viewtrailer${mView2[1]}/`;

    return "";
  }

  function normalizeRutubeEmbedUrl(url) {
    const s = String(url || "").trim();
    if (!s) return "";

    const normalizeId = (id) => {
      const clean = String(id || "")
        .trim()
        .replace(/[^a-z0-9]/gi, "");
      return clean.length >= 8 ? clean : "";
    };

    // Шаг 1: пробуем нормализацию через URL API.
    try {
      const u = new URL(s, location.origin);
      const host = String(u.hostname || "")
        .replace(/^www\./i, "")
        .toLowerCase();

      if (!host.endsWith("rutube.ru")) return "";

      const parts = String(u.pathname || "")
        .split("/")
        .filter(Boolean);

      if (parts[0] === "play" && parts[1] === "embed") {
        const id = normalizeId(parts[2] || "");
        if (id) return `https://rutube.ru/play/embed/${id}`;
      }

      if (parts[0] === "video") {
        const id = normalizeId(parts[1] || "");
        if (id) return `https://rutube.ru/play/embed/${id}`;
      }
    } catch (error) {
      logRecoverableError("Rutube embed URL normalization failed", error, {
        urlSample: String(s || "").slice(0, 180),
      });
    }

    // Шаг 2: regex fallback.
    const mEmbed = s.match(/rutube\.ru\/play\/embed\/([a-z0-9]{8,})/i);
    if (mEmbed && mEmbed[1]) return `https://rutube.ru/play/embed/${mEmbed[1]}`;

    const mVideo = s.match(/rutube\.ru\/video\/([a-z0-9]{8,})/i);
    if (mVideo && mVideo[1]) return `https://rutube.ru/play/embed/${mVideo[1]}`;

    return "";
  }

  function normalizeYoutubeEmbedUrl(url) {
    const s = String(url || "").trim();
    if (!s) return "";

    // Уже embed-формат.
    const mEmbed = s.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (mEmbed && mEmbed[1])
      return `https://www.youtube.com/embed/${mEmbed[1]}`;

    try {
      const u = new URL(s);
      const host = (u.hostname || "").toLowerCase();
      let id = "";
      if (host.includes("youtu.be")) {
        id = u.pathname.split("/").filter(Boolean)[0] || "";
      } else if (host.includes("youtube.com")) {
        if (u.pathname.startsWith("/embed/")) {
          id = u.pathname.split("/")[2] || "";
        } else if (u.pathname.startsWith("/shorts/")) {
          id = u.pathname.split("/")[2] || "";
        } else {
          id = u.searchParams.get("v") || "";
        }
      }
      if (id) return `https://www.youtube.com/embed/${id}`;
    } catch (error) {
      logRecoverableError("YouTube embed URL normalization failed", error, {
        urlSample: String(s || "").slice(0, 180),
      });
    }

    // Резервный разбор по регулярному выражению.
    const m = s.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/,
    );
    if (m && m[1]) return `https://www.youtube.com/embed/${m[1]}`;

    return "";
  }

  // Из HTML KinoNews извлекает первую ссылку вида /trailers<ID>/.
  function __knExtractTrailerPageUrlFromMoviePage__(html) {
    if (!html) return "";
    const text = String(html);
    const low = text.toLowerCase();

    // Сужаем область поиска до секции трейлеров.
    let scope = text;
    const idx = low.indexOf("трейлеры к");
    if (idx !== -1) scope = text.slice(idx, idx + 12000);

    // Полный URL.
    let m = scope.match(/https?:\/\/www\.kinonews\.ru\/trailers(\d+)\/?/i);
    if (m && m[1]) return `https://www.kinonews.ru/trailers${m[1]}/`;

    // Относительный URL.
    m = scope.match(/\/trailers(\d+)\/?/i);
    if (m && m[1]) return `https://www.kinonews.ru/trailers${m[1]}/`;

    return "";
  }

  function __uniqNonEmpty__(arr) {
    const out = [];
    const seen = new Set();
    for (const v of arr || []) {
      const s = String(v || "").trim();
      if (!s) continue;
      const key = s.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
    }
    return out;
  }

  function __safeDecodeURIComponent__(s) {
    try {
      return decodeURIComponent(s);
    } catch (error) {
      logRecoverableError("decodeURIComponent failed", error, {
        valueSample: String(s || "").slice(0, 120),
      });
      return s;
    }
  }

  function __extractKinonewsUrlsFromHtml__(html) {
    const s = String(html || "");
    const urls = [];

    // DDG часто хранит реальную ссылку в параметре uddg.
    const reUddg = /uddg=([^&"'<>]+)/g;
    let m;
    while ((m = reUddg.exec(s))) {
      let u = m[1] || "";
      // Некоторые значения двойного кодирования раскодируем дважды.
      u = __safeDecodeURIComponent__(u);
      if (/%2F/i.test(u)) u = __safeDecodeURIComponent__(u);

      if (u.includes("kinonews.ru/")) urls.push(u);
    }

    // Прямые вхождения URL.
    const reDirect = /https?:\/\/(?:www\.)?kinonews\.ru\/[^\s"'<>]+/gi;
    const direct = s.match(reDirect) || [];
    urls.push(...direct);

    // Нормализация хвостов и HTML entities.
    return __uniqNonEmpty__(
      urls.map((u) =>
        String(u)
          .replace(/&amp;/g, "&")
          .replace(/[)\],.]+$/g, ""),
      ),
    );
  }

  // Универсальный fetch с таймаутом для прокси-цепочки трейлеров.
  async function __fetchTextWithTimeout__(url, timeoutMs = 4500) {
    const u = String(url || "").trim();
    if (!u) throw new Error("Empty url");

    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(
      () => {
        try {
          controller && controller.abort();
        } catch (error) {
          logRecoverableError("AbortController abort failed", error);
        }
      },
      Math.max(1, Number(timeoutMs) || 4500),
    );

    try {
      const res = await fetch(u, {
        method: "GET",
        // Для прокси не используем cookies/credentials.
        credentials: "omit",
        redirect: "follow",
        signal: controller ? controller.signal : undefined,
        headers: {
          Accept: "text/html, text/plain;q=0.9, */*;q=0.8",
        },
      });

      if (!res.ok) {
        const err = new Error(
          `HTTP ${res.status}: ${res.statusText || "Request failed"}`,
        );
        err.status = res.status;
        throw err;
      }
      return await res.text();
    } finally {
      clearTimeout(timer);
    }
  }

  async function __fetchTextViaCORSProxies__(targetUrl, timeoutMs = 4500) {
    const url = String(targetUrl || "").trim();
    if (!url) throw new Error("Empty url");

    // Дедупликация запросов и кэш для снижения риска 429.
    const cached = __cacheGetFetchText__(url);
    if (cached != null) return cached;

    if (__FETCH_TEXT_INFLIGHT__.has(url))
      return await __FETCH_TEXT_INFLIGHT__.get(url);

    const work = (async () => {
      const clean = url.replace(/^https?:\/\//i, "");

      // Сначала пробуем allorigins.
      const allOrigins = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        url,
      )}`;
      try {
        const t = await __fetchTextWithTimeout__(
          allOrigins,
          Math.min(4500, Number(timeoutMs) || 4500),
        );
        __cacheSetFetchText__(url, t);
        return t;
      } catch (e) {
        logRecoverableError("AllOrigins fetch failed", e, { targetUrl: url });
      }

      // Резервный прокси r.jina.ai с ограничением частоты запросов.
      if (Date.now() < __JINA_COOLDOWN_UNTIL__)
        throw new Error("Jina proxy cooldown (429)");

      const candidates = [
        `https://r.jina.ai/https://${clean}`,
        `https://r.jina.ai/http://${clean}`,
      ];

      for (const u of candidates) {
        try {
          const t = await (__JINA_QUEUE__ = __JINA_QUEUE__.then(async () => {
            const wait = Math.max(
              0,
              __JINA_MIN_INTERVAL_MS__ - (Date.now() - __JINA_LAST_TS__),
            );
            if (wait) await __sleep__(wait);
            __JINA_LAST_TS__ = Date.now();
            return await __fetchTextWithTimeout__(
              u,
              Math.min(4500, Number(timeoutMs) || 4500),
            );
          }));
          __cacheSetFetchText__(url, t);
          return t;
        } catch (e) {
          const status = e && typeof e === "object" ? e.status : null;
          if (status === 429) {
            // При 429 включаем глобальный cooldown.
            __JINA_COOLDOWN_UNTIL__ = Date.now() + 60 * 1000;
          }
        }
      }

      throw new Error("Fetch failed (all proxies)");
    })().finally(() => {
      __FETCH_TEXT_INFLIGHT__.delete(url);
    });

    __FETCH_TEXT_INFLIGHT__.set(url, work);
    return await work;
  }

  function __kinonewsIdFromUrl__(u) {
    const s = String(u || "");
    const m1 =
      s.match(/\/viewtrailer(\d+)\//i) || s.match(/\/viewtrailer(\d+)\b/i);
    if (m1 && m1[1]) return m1[1];
    const m2 = s.match(/\/trailers(\d+)\//i) || s.match(/\/trailers(\d+)\b/i);
    if (m2 && m2[1]) return m2[1];
    return "";
  }

  async function __findKinonewsEmbedByDdgQuery__(query) {
    const q = String(query || "").trim();
    if (!q) return "";

    if (__KN_SEARCH_CACHE__.has(q)) return __KN_SEARCH_CACHE__.get(q) || "";

    let embed = "";
    try {
      const ddgUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
      const html = await __fetchTextViaCORSProxies__(ddgUrl, 4500);
      const urls = __extractKinonewsUrlsFromHtml__(html);

      // 1) Прямые ссылки на trailer/viewtrailer.
      for (const u of urls) {
        const id = __kinonewsIdFromUrl__(u);
        if (id) {
          embed = `https://www.kinonews.ru/viewtrailer${id}/`;
          break;
        }
      }

      // 2) Если найдены только movie_ страницы, извлекаем ID трейлера из их HTML.
      if (!embed) {
        const moviePages = urls
          .filter((u) => /kinonews\.ru\/movie_\d+\//i.test(u))
          .slice(0, 3);
        for (const mp of moviePages) {
          try {
            const movieHtml = await __fetchTextViaCORSProxies__(mp, 4500);
            const id = __kinonewsIdFromUrl__(movieHtml);
            if (id) {
              embed = `https://www.kinonews.ru/viewtrailer${id}/`;
              break;
            }
            // Дополнительный формат ссылки на trailer-id.
            const mTrail = String(movieHtml).match(/\/trailers(\d+)\//i);
            if (mTrail && mTrail[1]) {
              embed = `https://www.kinonews.ru/viewtrailer${mTrail[1]}/`;
              break;
            }
          } catch (error) {
            logRecoverableError("Kinonews movie page parse failed", error, {
              moviePageUrl: mp,
            });
          }
        }
      }
    } catch (e) {
      logRecoverableError("Kinonews DDG search failed", e, { query: q });
    }

    __KN_SEARCH_CACHE__.set(q, embed || "");
    return embed || "";
  }
  // Собирает список ID-кандидатов трейлеров Kinonews из DDG-выдачи.
  async function __knSearchKinonewsTrailerIdsByDdg__(query) {
    const q = String(query || "").trim();
    if (!q) return [];

    try {
      const ddgUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
      const html = await __fetchTextViaCORSProxies__(ddgUrl, 4500);
      const urls = __extractKinonewsUrlsFromHtml__(html);

      const ids = [];
      const seen = new Set();

      for (const u of urls || []) {
        const id = __kinonewsIdFromUrl__(u);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        ids.push(id);
        if (ids.length >= 12) break;
      }

      return ids;
    } catch (error) {
      logRecoverableError("Kinonews trailer id extraction failed", error, {
        query: q,
      });
      return [];
    }
  }

  // ===== Kinonews resolver (strict/soft matching) =====

  function __knNorm__(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^a-z0-9а-я]+/gi, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function __knTokens__(s) {
    const n = __knNorm__(s);
    return n ? n.split(" ").filter(Boolean) : [];
  }

  function __knTitleSim__(a, b) {
    const A = new Set(__knTokens__(a));
    const B = new Set(__knTokens__(b));
    if (!A.size || !B.size) return 0;
    let inter = 0;
    for (const t of A) if (B.has(t)) inter += 1;
    const union = A.size + B.size - inter;
    return union ? inter / union : 0;
  }
  function __knIsSeries__(movie) {
    const t = String(movie && movie.type ? movie.type : "").toUpperCase();
    if (
      t.includes("TV_SERIES") ||
      t.includes("SERIES") ||
      t.includes("MINI_SERIES")
    )
      return true;
    return false;
  }

  function __knExtractMeta__(txt) {
    const s0 = String(txt || "");

    const decode = (str) => {
      return String(str || "")
        .replace(/&nbsp;/g, " ")
        .replace(/&quot;/g, '"')
        .replace(/&#34;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&laquo;/g, "«")
        .replace(/&raquo;/g, "»")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
    };

    const stripTags = (html) => {
      return decode(
        String(html || "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
      );
    };

    const out = { title: "", year: "", rawTitle: "", isSeriesHint: null };

    // 1) Заголовок: сначала h1, затем title.
    const mH1 = s0.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const mTitle = s0.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

    const h1 = mH1 && mH1[1] ? stripTags(mH1[1]) : "";
    const tt = mTitle && mTitle[1] ? stripTags(mTitle[1]) : "";

    out.rawTitle = (h1 || tt || "").trim();

    // Подсказка типа контента из текста заголовка.
    const rawLow = out.rawTitle.toLowerCase();
    if (rawLow.includes("сериал")) out.isSeriesHint = true;
    if (rawLow.includes("фильм")) out.isSeriesHint = false;

    // 2) Пытаемся извлечь название в кавычках.
    const quoted = [];
    for (const m of out.rawTitle.matchAll(/«([^»]{2,120})»/g))
      quoted.push(m[1]);
    for (const m of out.rawTitle.matchAll(/"([^"]{2,120})"/g))
      quoted.push(m[1]);

    // Дополнительный паттерн в теле страницы.
    if (!quoted.length) {
      const bodyMatch =
        s0.match(
          /Видео\s+и\s+трейлеры\s+к\s+(?:фильму|сериалу)\s+[«"]([^»"]+)[»"]/i,
        ) || s0.match(/трейлеры\s+к\s+(?:фильму|сериалу)\s+[«"]([^»"]+)[»"]/i);
      if (bodyMatch && bodyMatch[1]) quoted.push(stripTags(bodyMatch[1]));
    }

    // Берём наиболее информативный вариант названия.
    let best = "";
    for (const q of quoted) {
      const cand = String(q || "").trim();
      if (cand.length > best.length) best = cand;
    }
    out.title = best.trim();

    // Год: сначала явный label, затем 4-значный паттерн.
    const mYear =
      s0.match(/Год\s+выхода\s*:\s*(\d{4})/i) || s0.match(/Год\s*:\s*(\d{4})/i);
    if (mYear && mYear[1]) out.year = String(mYear[1]).trim();
    if (!out.year) {
      const mY2 = out.rawTitle.match(/\b(19\d{2}|20\d{2})\b/);
      if (mY2 && mY2[1]) out.year = String(mY2[1]).trim();
    }

    return out;
  }

  function __knPickBestUrlFromJinaResults__(results, targetTitles, targetYear) {
    const titles = Array.isArray(targetTitles) ? targetTitles : [targetTitles];
    const y = String(targetYear || "").trim();

    let bestUrl = "";
    let bestScore = -1;

    for (const r of results || []) {
      const url = String(r.url || r.link || r.href || "").trim();
      if (!url || !/kinonews\.ru\//i.test(url)) continue;

      const isTrailersList = /kinonews\.ru\/trailers_\d+\//i.test(url);
      const isMoviePage = /kinonews\.ru\/(?:movie|serial)_\d+\//i.test(url);
      if (!isTrailersList && !isMoviePage) continue;

      const blob = [
        r.title || "",
        r.content || "",
        r.description || "",
        r.snippet || "",
      ].join("\n");
      const meta = __knExtractMeta__(blob);

      let sim = 0;
      for (const t of titles)
        sim = Math.max(sim, __knTitleSim__(meta.title, t));

      let score = sim;
      if (isTrailersList) score += 0.5;

      if (y && meta.year) {
        if (meta.year === y) score += 2.0;
        else score -= 1.0;
      }

      if (score > bestScore) {
        bestScore = score;
        bestUrl = url;
      }
    }

    return bestUrl;
  }

  async function __jinaSearchKinonews__(query, timeoutMs = 9000) {
    // Стабильный поиск через DDG HTML + CORS-прокси.
    const q = String(query || "").trim();
    if (!q) return [];

    try {
      // Ограничиваем результаты доменом kinonews.ru.
      const q2 = /site:kinonews\.ru/i.test(q) ? q : `${q} site:kinonews.ru`;
      const ddgUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(q2)}`;

      const html = await __fetchTextViaCORSProxies__(ddgUrl, timeoutMs);
      const urls = __extractKinonewsUrlsFromHtml__(html);

      const out = [];
      const seen = new Set();

      for (const u0 of urls || []) {
        const u = String(u0 || "")
          .trim()
          .replace(/[)\]\s'"]+$/g, "");

        if (!u || seen.has(u)) continue;
        seen.add(u);

        // Сохраняем структуру, совместимую с остальным кодом модуля.
        out.push({ url: u, title: "", snippet: "" });

        if (out.length >= 12) break;
      }

      return out;
    } catch (error) {
      logRecoverableError("Kinonews DDG list fetch failed", error, {
        query: q,
      });
      return [];
    }
  }

  function __knAbsUrl__(base, maybeRel) {
    const s = String(maybeRel || "").trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
    try {
      return new URL(s, base).toString();
    } catch (error) {
      logRecoverableError("Relative URL normalization failed", error, {
        base: String(base || "").slice(0, 120),
        value: String(maybeRel || "").slice(0, 120),
      });
      return "";
    }
  }

  function __knExtractFirstTrailerPageUrl__(trailersListText, baseUrl) {
    const s = String(trailersListText || "");
    // Форматы: /trailers<ID>/ и /trailers<ID>_pN/.
    const re = /\/trailers(?!_)(\d+)(?:_p\d+)?\//gi;
    const seen = new Set();
    let m;
    while ((m = re.exec(s))) {
      const id = m[1];
      if (!id || seen.has(id)) continue;
      seen.add(id);
      return `https://www.kinonews.ru/trailers${id}/`;
    }
    // Резервный формат без завершающего слеша.
    const re2 = /\/trailers(?!_)(\d+)\b/gi;
    while ((m = re2.exec(s))) {
      const id = m[1];
      if (!id || seen.has(id)) continue;
      seen.add(id);
      return `https://www.kinonews.ru/trailers${id}/`;
    }
    return "";
  }

  function __knExtractViewTrailerUrl__(trailerPageText) {
    const s = String(trailerPageText || "");
    const m = s.match(/viewtrailer(\d+)/i);
    if (m && m[1]) return `https://www.kinonews.ru/viewtrailer${m[1]}/`;
    // Иногда в тексте встречается только trailers<ID> без viewtrailer.
    const m2 = s.match(/\/trailers(?!_)(\d+)\//i);
    if (m2 && m2[1]) return `https://www.kinonews.ru/viewtrailer${m2[1]}/`;
    return "";
  }

  async function __knResolveTrailersListUrl__(candidateUrl) {
    const url = String(candidateUrl || "").trim();
    if (!url) return "";

    // Если это уже страница списка трейлеров.
    if (/kinonews\.ru\/trailers_\d+\//i.test(url)) return url;

    // Для movie/serial страницы извлекаем связанный trailers_<id>.
    if (/kinonews\.ru\/(?:movie|serial)_\d+\//i.test(url)) {
      try {
        const html = await __fetchTextViaCORSProxies__(url, 4500);
        const m = String(html || "").match(/\/trailers_(\d+)\//i);
        if (m && m[1]) return `https://www.kinonews.ru/trailers_${m[1]}/`;
      } catch (error) {
        logRecoverableError("Kinonews trailers list resolve failed", error, {
          candidateUrl: url,
        });
      }
    }

    return "";
  }

  async function __knResolveMp4FromViewUrl__(viewUrl) {
    const url = String(viewUrl || "").trim();
    if (!url) return "";

    const viewId = __kinonewsIdFromUrl__(url);

    const normalizeCandidate = (cand) => {
      let u = String(cand || "").trim();
      if (!u) return "";
      u = u.replace(/&amp;/g, "&").replace(/\\u0026/g, "&");

      // Убираем обрамляющие кавычки из извлечённого URL.
      u = u.replace(/^['"]+|['"]+$/g, "").trim();

      // protocol-relative URL (//...) приводим к https.
      if (u.startsWith("//")) u = "https:" + u;

      // Относительный путь делаем абсолютным относительно страницы источника.
      if (u.startsWith("/")) u = __knAbsUrl__(url, u);

      return u.trim();
    };

    const isBad = (u) => {
      const s = String(u || "").toLowerCase();
      return (
        !s ||
        s.includes("doubleclick") ||
        s.includes("googleads") ||
        s.includes("pagead") ||
        s.includes("/ads") ||
        s.includes("ad_status") ||
        s.includes("adservice")
      );
    };

    const scoreUrl = (u, baseScore) => {
      const s = String(u || "").toLowerCase();
      let score = baseScore || 0;

      if (isBad(s)) score -= 2000;

      if (s.includes("kinonews")) score += 120;
      if (s.includes("trailer") || s.includes("trailers")) score += 60;

      if (viewId && s.includes(String(viewId))) score += 150;

      if (s.endsWith(".mp4") || s.includes(".mp4?")) score += 30;
      if (s.endsWith(".m3u8") || s.includes(".m3u8?")) score += 10;

      return score;
    };

    try {
      const html = await __fetchTextViaCORSProxies__(url, 4500);
      const s = String(html || "");

      const candidates = new Map();

      const add = (cand, base) => {
        const u = normalizeCandidate(cand);
        if (!u) return;
        if (!/(\.mp4|\.m3u8)(\?|$)/i.test(u)) return;

        const sc = scoreUrl(u, base);
        const prev = candidates.get(u);
        if (prev == null || sc > prev) candidates.set(u, sc);
      };

      // 1) Приоритет источникам внутри <video>/<source>.
      for (const m of s.matchAll(
        /<video[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi,
      )) {
        add(m[1], 400);
      }
      for (const m of s.matchAll(
        /<source[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi,
      )) {
        add(m[1], 350);
      }

      // 2) Метатеги og:video.
      for (const m of s.matchAll(
        /property\s*=\s*["']og:video(?::url)?["']\s+content\s*=\s*["']([^"']+)["']/gi,
      )) {
        add(m[1], 250);
      }

      // 3) Любые mp4/m3u8 в тексте как последняя попытка.
      for (const m of s.matchAll(
        /https?:\/\/[^\s"'<>]+?\.(?:mp4|m3u8)(?:\?[^\s"'<>]*)?/gi,
      )) {
        add(m[0], 120);
      }

      // Выбираем кандидата с максимальным score.
      let bestUrl = "";
      let bestScore = -1e9;

      for (const [u, sc] of candidates.entries()) {
        if (sc > bestScore) {
          bestScore = sc;
          bestUrl = u;
        }
      }

      if (!bestUrl || bestScore < 0) return "";
      return bestUrl;
    } catch (error) {
      logRecoverableError("Kinonews mp4 resolve failed", error, {
        viewUrl: url,
      });
      return "";
    }
  }

  async function __findKinonewsTrailerStrict__(movie, title, year) {
    // Строгий подбор трейлера: поиск кандидатов, сверка заголовка/года/типа контента.

    const titles = __uniqNonEmpty__([
      title,
      movie && movie.nameRu,
      movie && movie.nameEn,
      movie && movie.nameOriginal,
      movie && movie.originalName,
      movie && movie.alternativeName,
      movie && movie.alternativeTitle,
    ]).slice(0, 3);

    const y = String(year || "").trim();
    const isSeries = __knIsSeries__(movie);

    const cacheKey = `knStrict4:${isSeries ? "s" : "m"}:${__knNorm__(
      titles[0] || "",
    )}:${y}`;
    if (__KN_SEARCH_CACHE__.has(cacheKey))
      return __KN_SEARCH_CACHE__.get(cacheKey) || "";

    const queries = [];
    const typeWord = isSeries ? "сериал" : "фильм";

    for (const t of titles.slice(0, 2)) {
      if (y) {
        queries.push(`site:kinonews.ru/trailers ${t} ${y} ${typeWord} трейлер`);
        queries.push(`site:kinonews.ru/trailers ${t} ${y}`);
      }
      queries.push(`site:kinonews.ru/trailers ${t} ${typeWord} трейлер`);
      queries.push(`site:kinonews.ru/trailers ${t} трейлер`);
      queries.push(`site:kinonews.ru/trailers ${t}`);
    }

    const uniqQueries = __uniqNonEmpty__(queries).slice(0, 8);

    let best = { id: "", score: -1 };

    const scoreCandidate = (meta) => {
      const candTitle = meta.title || meta.rawTitle || "";
      let sim = 0;
      for (const tt of titles)
        sim = Math.max(sim, __knTitleSim__(candTitle, tt));

      let score = sim;

      // Учитываем подсказку типа контента со страницы.
      if (meta.isSeriesHint !== null) {
        if (meta.isSeriesHint === isSeries) score += 0.12;
        else score -= 0.12;
      }

      // Год учитывается мягко: не все страницы его содержат.
      if (y && meta.year) {
        if (meta.year === y) score += 0.18;
        else score -= 0.2;
      }

      return { score, sim };
    };

    for (const q of uniqQueries) {
      const ids = await __knSearchKinonewsTrailerIdsByDdg__(q);
      for (const id of ids.slice(0, 8)) {
        try {
          const trailerPageUrl = `https://www.kinonews.ru/trailers${id}/`;
          const trailerHtml = await __fetchTextViaCORSProxies__(
            trailerPageUrl,
            6000,
          );

          const meta = __knExtractMeta__(trailerHtml);
          const { score, sim } = scoreCandidate(meta);

          // Слабые совпадения отбрасываем.
          if (sim < 0.45) continue;

          if (score > best.score) best = { id, score };

          // Ранний выход при уверенном совпадении.
          if (best.score >= 0.82) break;
        } catch (error) {
          logRecoverableError("Kinonews strict candidate check failed", error, {
            candidateId: id,
            query: q,
          });
        }
      }
      if (best.score >= 0.82) break;
    }

    const viewUrl = best.id
      ? `https://www.kinonews.ru/viewtrailer${best.id}/`
      : "";
    const result = best.score >= 0.55 ? viewUrl : "";

    __KN_SEARCH_CACHE__.set(cacheKey, result || "");
    return result || "";
  }

  // Публичный helper для поиска embed-URL трейлера.

  async function findKinonewsTrailerEmbedUrl(movie, title, year) {
    // 1) Строгий поиск.
    try {
      const strictUrl = await __findKinonewsTrailerStrict__(movie, title, year);
      if (strictUrl) return strictUrl;
    } catch (error) {
      logRecoverableError("Kinonews strict trailer search failed", error, {
        title,
        year,
      });
    }

    // 2) Мягкий fallback с обязательной проверкой кандидата.
    const titles = __uniqNonEmpty__([
      title,
      movie && movie.nameRu,
      movie && movie.nameEn,
      movie && movie.nameOriginal,
      movie && movie.originalName,
      movie && movie.alternativeName,
      movie && movie.alternativeTitle,
    ]);

    const y = String(year || "").trim();
    const isSeries = __knIsSeries__(movie);
    const typeWord = isSeries ? "сериал" : "фильм";

    const queries = [];
    for (const t of titles.slice(0, 2)) {
      if (y) queries.push(`site:kinonews.ru ${t} ${y} ${typeWord} трейлер`);
      queries.push(`site:kinonews.ru/trailers ${t} ${typeWord} трейлер`);
      queries.push(`site:kinonews.ru/trailers ${t} трейлер`);
    }

    for (const q of __uniqNonEmpty__(queries).slice(0, 6)) {
      const embed = await __findKinonewsEmbedByDdgQuery__(q);
      if (!embed) continue;

      const id = __kinonewsIdFromUrl__(embed);
      if (!id) continue;

      try {
        const trailerPageUrl = `https://www.kinonews.ru/trailers${id}/`;
        const trailerText = await __fetchTextViaCORSProxies__(
          trailerPageUrl,
          6000,
        );
        const meta = __knExtractMeta__(trailerText);

        // Год проверяем мягко.
        if (y && meta.year && meta.year !== y) continue;

        // Проверка похожести заголовка.
        const candTitle = meta.title || meta.rawTitle || "";
        let sim = 0;
        for (const tt of titles)
          sim = Math.max(sim, __knTitleSim__(candTitle, tt));
        if (sim < 0.55) continue;

        // Проверка типа контента.
        if (meta.isSeriesHint !== null && meta.isSeriesHint !== isSeries)
          continue;

        return `https://www.kinonews.ru/viewtrailer${id}/`;
      } catch (error) {
        logRecoverableError("Kinonews soft candidate check failed", error, {
          candidateId: id,
          query: q,
        });
      }
    }

    return "";
  }

  async function findRutubeTrailerEmbedUrl(title, year, options = {}) {
    const t = String(title || "").trim();
    const y = String(year || "").trim();
    const isSeries = Boolean(options?.isSeries);
    if (!t) return "";

    const normalizeText = (s) =>
      String(s || "")
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/[^a-z0-9а-я]+/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

    const tokenize = (s) => normalizeText(s).split(" ").filter(Boolean);

    const titleTokens = tokenize(t);

    const hasAny = (source, dictionary) => {
      const s = normalizeText(source);
      return dictionary.some((x) => s.includes(x));
    };

    const trailerKeywords = isSeries
      ? ["трейлер", "тизер", "trailer", "teaser", "сериал", "season"]
      : ["трейлер", "тизер", "trailer", "teaser"];

    const bannedKeywords = [
      "обзор",
      "review",
      "reaction",
      "реакция",
      "разбор",
      "прохождение",
      "interview",
    ];

    const scoreCandidate = (url) => {
      const raw = String(url || "").trim();
      const normalized = normalizeText(raw);
      let score = 0;

      if (/\/video\//i.test(raw)) score += 3;
      if (/\/play\/embed\//i.test(raw)) score += 3;

      if (hasAny(normalized, trailerKeywords)) score += 2;
      if (hasAny(normalized, bannedKeywords)) score -= 6;

      if (y && normalized.includes(String(y).toLowerCase())) score += 1;

      if (titleTokens.length) {
        const tokens = new Set(tokenize(normalized));
        let hit = 0;
        for (const tk of titleTokens) {
          if (tokens.has(tk)) hit += 1;
        }
        score += hit / Math.max(1, titleTokens.length);
      }

      return score;
    };

    const queries = [];
    if (y) queries.push(`site:rutube.ru ${t} ${y} трейлер`);
    queries.push(`site:rutube.ru ${t} трейлер`);
    queries.push(`site:rutube.ru ${t} тизер`);
    if (isSeries) {
      if (y) queries.push(`site:rutube.ru ${t} ${y} сериал трейлер`);
      queries.push(`site:rutube.ru ${t} сериал трейлер`);
    }

    const extractRutubeUrls = (html) => {
      const s = String(html || "");
      const out = [];

      // DDG: реальные URL часто в uddg.
      const reUddg = /uddg=([^&"'<>]+)/g;
      let m;
      while ((m = reUddg.exec(s))) {
        let u = m[1] || "";
        u = __safeDecodeURIComponent__(u);
        if (/%2F/i.test(u)) u = __safeDecodeURIComponent__(u);
        if (u.includes("rutube.ru/")) out.push(u);
      }

      // Прямые вхождения URL.
      const direct =
        s.match(/https?:\/\/(?:www\.)?rutube\.ru\/[^\s"'<>]+/gi) || [];
      out.push(...direct);

      return __uniqNonEmpty__(
        out.map((u) =>
          String(u)
            .replace(/&amp;/g, "&")
            .replace(/[)\],.]+$/g, ""),
        ),
      );
    };

    for (const q of __uniqNonEmpty__(queries).slice(0, 5)) {
      try {
        const ddgUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(
          q,
        )}`;
        const html = await __fetchTextViaCORSProxies__(ddgUrl, 4500);
        const urls = extractRutubeUrls(html);

        const scored = urls
          .map((u) => {
            const embed = normalizeRutubeEmbedUrl(u);
            if (!embed) return null;
            return { embed, score: scoreCandidate(u) };
          })
          .filter(Boolean)
          .sort((a, b) => b.score - a.score);

        if (scored.length && scored[0].embed) {
          return scored[0].embed;
        }
      } catch (error) {
        logRecoverableError("Rutube DDG lookup failed", error, {
          query: q,
        });
      }
    }

    return "";
  }

  function displayTrailer(trailerUrl, posterUrl) {
    if (!trailerContainer) return;

    const clearBg = () => {
      trailerContainer.style.backgroundImage = "none";
      trailerContainer.style.background = "none";
    };

    const safePoster = String(posterUrl || "").trim();

    const setIframe = (src) => {
      clearBg();

      // iframe рендерим сразу, чтобы состояние блока было визуально предсказуемым.
      resetTrailerContainer();
      const iframeWrap = document.createElement("div");
      iframeWrap.className = "movie-trailer-iframe-wrap";
      iframeWrap.style.width = "100%";
      iframeWrap.style.height = "100%";
      iframeWrap.innerHTML = `
        <iframe
          width="560"
          height="315"
          src="${src}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"
          style="width:100%;height:100%;border:0;border-radius:12px;display:block;background:#000;"
        ></iframe>
      `;
      trailerContainer.appendChild(iframeWrap);
    };

    const setVideo = (src) => {
      clearBg();
      resetTrailerContainer();

      // Используем уже существующий в HTML статический <video>.
      const v = trailerContainer.querySelector("#movie-trailer-video");
      if (v) {
        v.hidden = false;
        v.setAttribute("src", src);
        if (safePoster) {
          v.setAttribute("poster", safePoster);
        } else {
          v.removeAttribute("poster");
        }
        try {
          v.load();
        } catch (error) {
          logRecoverableError("Static trailer video load failed", error, {
            trailerUrl: src,
          });
        }

        v.addEventListener(
          "error",
          () => {
            const fallbackView = trailerContainer.dataset.knViewUrl;
            if (fallbackView) setIframe(fallbackView);
          },
          { once: true },
        );
      } else {
        // Технический fallback, если static video был удалён из шаблона.
        trailerContainer.innerHTML = `
          <video
            id="kn-trailer-video"
            src="${src}"
            ${safePoster ? `poster="${safePoster}"` : ""}
            controls
            playsinline
            preload="auto"
            style="width:100%;height:100%;border-radius:12px;background:#000;object-fit:contain;display:block;"
          ></video>
        `;
      }
    };

    const raw = String(trailerUrl || "").trim();
    if (!raw) {
      showTrailerMessage("Трейлер недоступен");
      return;
    }

    const low = raw.toLowerCase();

    // URL YouTube переводим в embed-формат для корректного встраивания.
    if (low.includes("youtube.com/") || low.includes("youtu.be/")) {
      const embedUrl = normalizeYoutubeEmbedUrl(raw) || raw;
      setIframe(embedUrl);
      return;
    }

    // URL RuTube также переводим в embed-формат.
    if (low.includes("rutube.ru/")) {
      const embedUrl = normalizeRutubeEmbedUrl(raw) || raw;
      setIframe(embedUrl);
      return;
    }

    showTrailerMessage("Трейлер недоступен");
  }

  function showTrailerMessage(text) {
    if (!trailerContainer) return;

    resetTrailerContainer();
    const msg = document.createElement("div");
    msg.className = "movie-trailer-message";
    msg.innerHTML = `
      <div style="
        display:flex;
        align-items:center;
        justify-content:center;
        height:100%;
        color:#686868;
        font-size:16px;
        text-align:center;
        padding:20px;
      ">
        ${text || "Трейлер недоступен"}
      </div>
    `;
    trailerContainer.appendChild(msg);
  }

  function scoreRutubeItem(item, title, year) {
    const t = String(title || "").toLowerCase();
    const y = String(year || "").toLowerCase();
    const name = String(item?.title || item?.name || "").toLowerCase();

    let score = 0;
    if (t && name.includes(t)) score += 3;
    if (name.includes("трейлер")) score += 2;
    if (y && name.includes(y)) score += 1;
    return score;
  }

  async function searchRutubeTrailerUrl(query, title, year) {
    // Совместимый wrapper: возвращает URL RuTube через основной резолвер.
    const q = String(query || "").trim();
    const t = String(title || "").trim();
    const y = String(year || "").trim();

    const candidate = q || t;
    if (!candidate) return null;

    const embed = await findRutubeTrailerEmbedUrl(candidate, y, {
      isSeries: false,
    });

    return embed || null;
  }

  /**
   * Отобразить кадры из фильма
   */
  function displayFrames(frames) {
    if (!frames || !Array.isArray(frames)) return;

    const cleaned = [...new Set(frames.filter(Boolean).map(String))];
    if (!cleaned.length) return;

    // При наличии gallery.js делегируем рендер кадров.
    if (window.Gallery && typeof window.Gallery.initGallery === "function") {
      window.Gallery.initGallery(cleaned);
      return;
    }

    // Минимальный fallback-рендер двух слотов.
    const slot1 = document.querySelector(".rectangle-4");
    const slot2 = document.querySelector(".rectangle-5");
    if (slot1) slot1.style.backgroundImage = `url(${cleaned[0]})`;
    if (slot2) slot2.style.backgroundImage = `url(${cleaned[1] || cleaned[0]})`;
  }

  /**
   * Рендерит рецензии API без разрушения исходной Figma-разметки.
   * Подменяются только текстовые поля существующего шаблона.
   */
  function displayReviewsLoading() {
    if (!reviewsContainer) return;

    if (
      reviewsTemplateHTML &&
      !reviewsContainer.querySelector(".rectangle-7")
    ) {
      reviewsContainer.innerHTML = reviewsTemplateHTML;
    }

    const card1 = reviewsContainer.querySelector(".rectangle-7");
    const card2 = reviewsContainer.querySelector(".rectangle-10");
    if (!card1 || !card2) return;

    const author1 = card1.querySelector(".irina-glebova");
    const text1 = card1.querySelector(".movie-review");
    const stars1 = card1.querySelector(".flex-row-dd");
    setText(author1, "—");
    setText(text1, "Загрузка рецензий...");

    if (stars1) {
      stars1.style.display = "none";
      stars1.innerHTML = "";
    }

    card2.style.display = "none";
  }

  function displayReviews(reviews) {
    if (!reviewsContainer) return;

    const list = Array.isArray(reviews) ? reviews : [];

    // Если разметка была перезаписана, восстанавливаем исходный шаблон.
    if (
      reviewsTemplateHTML &&
      !reviewsContainer.querySelector(".rectangle-7")
    ) {
      reviewsContainer.innerHTML = reviewsTemplateHTML;
    }

    const card1 = reviewsContainer.querySelector(".rectangle-7");
    const card2 = reviewsContainer.querySelector(".rectangle-10");

    // Если шаблон отсутствует, выходим без ошибок.
    if (!card1 || !card2) return;

    const author1 = card1.querySelector(".irina-glebova");
    const text1 = card1.querySelector(".movie-review");
    const stars1 = card1.querySelector(".flex-row-dd");

    const author2 = card2.querySelector(".author-name");
    const text2 = card2.querySelector(".movie-review-1c");
    const stars2 = card2.querySelector(".flex-row-11");

    const pickAuthor = (r) =>
      r?.author || r?.author?.name || r?.user?.name || r?.username || "Аноним";

    const pickText = (r) =>
      r?.review || r?.text || r?.description || r?.content || r?.title || "";

    const pickReviewAvg = (r) => {
      const candidates = [
        r?.rating,
        r?.ratingKinopoisk,
        r?.ratingValue,
        r?.authorRating,
        r?.userRating,
        r?.assessment,
        r?.score,
      ];

      for (const value of candidates) {
        // Пустые значения не интерпретируем как 0, иначе все звёзды становятся серыми.
        if (value === null || value === undefined) continue;

        const normalized = String(value).trim();
        if (!normalized) continue;

        const parsed = Number(normalized.replace(",", "."));
        if (Number.isFinite(parsed) && parsed >= 0) {
          return Math.min(10, parsed);
        }
      }

      // Если API не дал числовую оценку рецензии, используем тональность отзыва.
      // Это сохраняет корректную визуализацию «чёрные + серые» вместо ложного 0.0.
      const type = String(r?.type || r?.reviewType || "").toLowerCase();
      if (type.includes("positive") || type.includes("pos")) return 8;
      if (type.includes("neutral") || type.includes("neu")) return 5;
      if (type.includes("negative") || type.includes("neg")) return 2;

      return null;
    };

    const renderReviewStars = (container, review) => {
      if (!container) return;

      const avg = pickReviewAvg(review);
      if (!Number.isFinite(avg)) {
        container.style.display = "none";
        container.innerHTML = "";
        return;
      }

      container.style.display = "flex";
      container.innerHTML = createStarRating(avg);
      container.setAttribute(
        "aria-label",
        `Рейтинг рецензии: avg ${avg.toFixed(1)} из 10`,
      );
    };

    // Пустое состояние рецензий в рамках текущего шаблона.
    if (!list.length) {
      setText(author1, "—");
      setText(text1, "Рецензии не найдены");
      if (stars1) stars1.style.display = "none";

      if (stars2) stars2.style.display = "none";
      card2.style.display = "none";
      return;
    }

    // Восстанавливаем видимость после empty-state.
    if (stars1) stars1.style.display = "";
    card2.style.display = "";
    if (stars2) stars2.style.display = "";

    // Первая карточка.
    const r1 = list[0];
    setText(author1, pickAuthor(r1));
    setText(text1, truncateText(pickText(r1), 200));
    renderReviewStars(stars1, r1);

    // Вторая карточка (опционально).
    const r2 = list[1];
    if (r2) {
      setText(author2, pickAuthor(r2));
      setText(text2, truncateText(pickText(r2), 200));
      renderReviewStars(stars2, r2);
    } else {
      // Если второй рецензии нет, скрываем вторую карточку.
      card2.style.display = "none";
    }
  }

  /**
   * Отобразить рецензии из fallback данных
   */
  function displayReviewsFallback(reviews) {
    if (!reviewsContainer || !reviews) return;
  }

  /**
   * Создать звёздный рейтинг
   */
  function createStarRating(rating) {
    const maxStars = 10;
    const avg = Math.max(0, Math.min(10, Number(rating) || 0));
    const fullStars = Math.round(avg);
    let starsHtml = "";

    for (let i = 0; i < maxStars; i++) {
      if (i < fullStars) {
        starsHtml +=
          '<span class="review-star review-star--filled" aria-hidden="true">★</span>';
      } else {
        starsHtml +=
          '<span class="review-star review-star--empty" aria-hidden="true">★</span>';
      }
    }

    return (
      `${starsHtml}` +
      `<span class="review-stars-avg">avg ${avg.toFixed(1)}</span>`
    );
  }

  /**
   * Обрезать текст
   */
  function truncateText(text, maxLength) {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }

  // Точка входа.
  loadMovieData();
});
