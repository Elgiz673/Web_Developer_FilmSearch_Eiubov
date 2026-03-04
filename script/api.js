/*
 * API-слой приложения.
 * Инкапсулирует работу с Kinopoisk API через прокси, нормализацию данных
 * и стратегию поиска трейлеров YouTube с безопасными резервными сценариями.
 */

(() => {
  "use strict";

  // ==================================================
  // БАЗОВЫЕ СЛУЖЕБНЫЕ ФУНКЦИИ И КОНФИГУРАЦИЯ
  // ==================================================

  /**
   * Централизованный лог нефатальных ошибок API-слоя.
   * Не прерывает выполнение и сохраняет диагностический контекст.
   *
   * @param {string} context
   * @param {unknown} error
   * @param {Record<string, unknown>} [details]
   */
  const logRecoverableError = (context, error, details = {}) => {
    const text =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error || "Unknown error");
    console.warn(`[MovieAPI] ${context}`, { error: text, ...details });
  };

  const IS_LOCALHOST = ["localhost", "127.0.0.1"].includes(
    String(location.hostname || "").toLowerCase(),
  );

  const detectPhpProxyPath = () => {
    const pathname = String(location.pathname || "");
    const marker = "/public_html/";
    const idx = pathname.indexOf(marker);

    // Локально в Live Server проект часто открыт как /public_html/...,
    // на проде обычно как /... (без префикса public_html).
    if (idx >= 0) return "/public_html/kp-proxy.php";

    return "/kp-proxy.php";
  };

  const API_CONFIG = {
    BASE_URL: location.origin,
    LOCAL_NODE_PROXY_URL: "http://localhost:5050",
    UPSTREAM_URL: "https://kinopoiskapiunofficial.tech",
    // На localhost допускаем публичный ключ только как резервный транспорт
    // (когда Node proxy не поднят, а PHP не исполняется в Live Server).
    LOCAL_PUBLIC_API_KEY:
      typeof window !== "undefined" && window.__POISKKINO_API_KEY__
        ? String(window.__POISKKINO_API_KEY__)
        : "8e4760c5-ca3d-4a7a-bc14-9713c3eb41f4",
    PHP_PROXY_PATH: detectPhpProxyPath(),
  };

  const YOUTUBE_CONFIG = {
    BASE_URL: "https://www.googleapis.com/youtube/v3",
    // Ключ не хранится в репозитории.
    // При необходимости может быть проброшен из безопасного окружения
    // (например, через серверный шаблон в window.__YOUTUBE_API_KEY__).
    API_KEY:
      typeof window !== "undefined" && window.__YOUTUBE_API_KEY__
        ? String(window.__YOUTUBE_API_KEY__)
        : "AIzaSyC-qytcFDlFnE2frP9ocP8SDSDy9EjWGus",
  };

  // В рабочем окружении используется PHP-прокси того же домена,
  // в локальной разработке — Node-прокси.
  const normalizePath = (endpoint) => {
    const ep = String(endpoint || "").trim();

    if (!ep) return "/";

    if (/^https?:\/\//i.test(ep)) return ep;

    return ep.startsWith("/") ? ep : `/${ep}`;
  };

  const appendParams = (searchParams, params) => {
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;

      if (Array.isArray(v)) {
        v.forEach((x) => searchParams.append(k, String(x)));
      } else {
        searchParams.append(k, String(v));
      }
    });
  };

  /**
   * Формирует адрес запроса с учетом окружения.
   *
   * @param {string} endpoint
   * @param {Record<string, unknown>} params
   * @returns {string}
   */
  const buildNodeProxyUrl = (endpoint, params) => {
    const path = normalizePath(endpoint);

    const u = new URL(path, API_CONFIG.LOCAL_NODE_PROXY_URL);
    appendParams(u.searchParams, params);
    return u.toString();
  };

  const buildProxyRequestUrl = (endpoint, params) => {
    const path = normalizePath(endpoint);

    const u = new URL(API_CONFIG.PHP_PROXY_PATH, API_CONFIG.BASE_URL);
    u.searchParams.set("path", path);
    appendParams(u.searchParams, params);
    return u.toString();
  };

  const buildDirectUpstreamUrl = (endpoint, params) => {
    const path = normalizePath(endpoint);

    const u = new URL(path, API_CONFIG.UPSTREAM_URL);
    appendParams(u.searchParams, params);
    return u.toString();
  };

  const buildRequestUrl = (endpoint, params) => {
    const path = normalizePath(endpoint);

    // Для обратной совместимости postJson оставляем прежний билдер через PHP-прокси.
    const u = new URL(API_CONFIG.PHP_PROXY_PATH, API_CONFIG.BASE_URL);
    u.searchParams.set("path", path);
    appendParams(u.searchParams, params);
    return u.toString();
  };

  // ==================================================
  // БАЗОВЫЕ ФУНКЦИИ СЕТЕВЫХ ЗАПРОСОВ
  // ==================================================

  const readJsonSafely = (text) => {
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (error) {
      logRecoverableError("JSON parse failed", error, {
        preview: String(text).slice(0, 200),
      });
      return { __raw: text };
    }
  };

  const looksLikeJsonText = (text) => {
    const trimmed = String(text || "").trim();
    return trimmed.startsWith("{") || trimmed.startsWith("[");
  };

  const requestJson = async (url, { method = "GET", headers, body } = {}) => {
    const resp = await fetch(url, {
      method,
      headers: { Accept: "application/json", ...(headers || {}) },
      ...(body === undefined ? {} : { body }),
    });

    const text = await resp.text().catch(() => "");

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${text.slice(0, 250)}`);
    }

    const contentType = String(
      resp.headers.get("content-type") || "",
    ).toLowerCase();
    if (!contentType.includes("application/json") && !looksLikeJsonText(text)) {
      throw new Error(
        `Unexpected non-JSON response (${contentType || "unknown"}): ${text
          .slice(0, 200)
          .replace(/\s+/g, " ")}`,
      );
    }

    return readJsonSafely(text);
  };

  const fetchJson = async (url, { headers } = {}) =>
    requestJson(url, { method: "GET", headers });

  const apiRequest = async (endpoint, params = {}) => {
    // Прод: только через server-side прокси (токен не уходит в браузер).
    if (!IS_LOCALHOST) {
      return fetchJson(buildProxyRequestUrl(endpoint, params));
    }

    const attempts = [];

    // 1) Предпочтительный локальный путь: Node proxy (если запущен на :5050).
    try {
      return await fetchJson(buildNodeProxyUrl(endpoint, params));
    } catch (error) {
      attempts.push(
        `node: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 2) Резерв локальной разработки: прямой запрос к poiskkino.dev.
    // Используем только на localhost.
    if (API_CONFIG.LOCAL_PUBLIC_API_KEY) {
      try {
        return await fetchJson(buildDirectUpstreamUrl(endpoint, params), {
          headers: { "X-API-KEY": API_CONFIG.LOCAL_PUBLIC_API_KEY },
        });
      } catch (error) {
        attempts.push(
          `direct: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // 3) Последний резерв: попытка через PHP-прокси (если локально запущен PHP-сервер).
    try {
      return await fetchJson(buildProxyRequestUrl(endpoint, params));
    } catch (error) {
      attempts.push(
        `php: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    throw new Error(
      `All local API transports failed (${attempts.join(" | ")})`,
    );
  };

  const postJson = (endpoint, payload = {}, { headers } = {}) =>
    requestJson(buildRequestUrl(endpoint, {}), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
      body: JSON.stringify(payload || {}),
    });

  const pickListDocs = (data) => {
    if (Array.isArray(data?.docs)) return data.docs;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.films)) return data.films;
    return [];
  };

  const pickPages = (data, docsLength) => {
    const pages =
      Number(data?.pages) ||
      Number(data?.totalPages) ||
      Number(data?.pagesCount) ||
      1;

    if (Number.isFinite(pages) && pages > 0) return pages;
    return docsLength > 0 ? 1 : 0;
  };

  const pickTotal = (data, docsLength) => {
    const total =
      Number(data?.total) ||
      Number(data?.searchFilmsCountResult) ||
      Number(data?.totalItems) ||
      docsLength;

    return Number.isFinite(total) && total >= 0 ? total : docsLength;
  };

  const isSeriesCandidate = (movie) => {
    const type = String(
      movie?.type || movie?.typeFilm || movie?.movieType || "",
    ).toUpperCase();

    return (
      Boolean(movie?.isSeries) ||
      Boolean(movie?.serial) ||
      type.includes("SERIES") ||
      type.includes("TV")
    );
  };

  const personName = (person) =>
    String(
      person?.nameRu ||
        person?.nameEn ||
        person?.name ||
        person?.description ||
        "",
    ).trim();

  const personProfession = (person) =>
    String(
      person?.profession ||
        person?.professionKey ||
        person?.enProfession ||
        person?.description ||
        "",
    )
      .trim()
      .toLowerCase();

  const hasDirectorProfession = (person) => {
    const prof = personProfession(person);
    return prof.includes("режисс") || prof.includes("director");
  };

  const hasActorProfession = (person) => {
    const prof = personProfession(person);
    return prof.includes("актер") || prof.includes("actor");
  };

  const splitPeopleText = (value) =>
    String(value || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  const uniqStrings = (list) => {
    const out = [];
    const seen = new Set();

    (Array.isArray(list) ? list : []).forEach((item) => {
      const text = String(item || "").trim();
      if (!text) return;

      const key = text.toLowerCase();
      if (seen.has(key)) return;

      seen.add(key);
      out.push(text);
    });

    return out;
  };

  const matchesDirectorFilter = (movie, directorValue) => {
    const target = String(directorValue || "")
      .trim()
      .toLowerCase();
    if (!target) return true;

    const rawPersons = Array.isArray(movie?.persons)
      ? movie.persons
      : Array.isArray(movie?.staff)
        ? movie.staff
        : [];

    const fromPersons = rawPersons
      .filter(hasDirectorProfession)
      .map(personName)
      .filter(Boolean);

    const fromDirectorsField = Array.isArray(movie?.directors)
      ? movie.directors.map((x) => String(x || "").trim())
      : [];

    const fromDirectorField = splitPeopleText(movie?.director);
    const directorPool = uniqStrings([
      ...fromPersons,
      ...fromDirectorsField,
      ...fromDirectorField,
    ]);

    if (!directorPool.length) return true;
    return directorPool.some((name) => name.toLowerCase().includes(target));
  };

  // ==================================================
  // МЕТОДЫ ДОСТУПА К KINOPOISK API
  // ==================================================

  // Получение карточки фильма/сериала по идентификатору.
  // Для kinopoiskapiunofficial.tech используем /api/v2.2/films/{id}.
  const getMovieById = async (id) => apiRequest(`/api/v2.2/films/${id}`);

  const searchMovies = async (keyword, page = 1, limit = 9, type = "FILM") => {
    const upperType = String(type || "").toUpperCase();
    const data = await apiRequest("/api/v2.1/films/search-by-keyword", {
      keyword,
      page,
      limit,
    });

    const list = pickListDocs(data);

    // API может вернуть смешанные типы, поэтому фильтруем на клиенте.
    const filtered = upperType
      ? list.filter((f) => {
          const series = isSeriesCandidate(f);
          return upperType === "TV_SERIES" ? series : !series;
        })
      : list;

    const docs = filtered.slice(0, limit);
    return {
      docs,
      total: pickTotal(data, filtered.length),
      pages: pickPages(data, filtered.length),
    };
  };

  // ==================================================
  // КЭШ ФИЛЬТРОВ (ЖАНРЫ И СТРАНЫ)
  // ==================================================

  // Защита от повторных одинаковых запросов при параллельной загрузке страницы.
  let __filtersCache = null;
  let __filtersPromise = null;

  const getFilters = async () => {
    if (__filtersCache) return __filtersCache;

    if (!__filtersPromise) {
      __filtersPromise = apiRequest("/api/v2.2/films/filters")
        .then((filtersRaw) => {
          const genres = (
            Array.isArray(filtersRaw?.genres) ? filtersRaw.genres : []
          )
            .map((g) => ({
              id: String(g?.id ?? "").trim(),
              genre: String(g?.genre || "").trim(),
            }))
            .filter((g) => g.id && g.genre);

          const countries = (
            Array.isArray(filtersRaw?.countries) ? filtersRaw.countries : []
          )
            .map((c) => ({
              id: String(c?.id ?? "").trim(),
              country: String(c?.country || "").trim(),
            }))
            .filter((c) => c.id && c.country);

          __filtersCache = {
            genres,
            countries,
          };

          return __filtersCache;
        })
        .finally(() => {
          __filtersPromise = null;
        });
    }

    return __filtersPromise;
  };

  const getGenres = async () => (await getFilters()).genres;
  const getCountries = async () => (await getFilters()).countries;

  const findGenreId = async (genreKey) => {
    if (!genreKey) return undefined;

    const genres = await getGenres();
    const ruName = GENRE_MAP_REVERSE[genreKey] || genreKey;
    const target = String(ruName || "").toLowerCase();

    const found = genres.find(
      (g) => String(g?.genre || "").toLowerCase() === target,
    );

    return found?.id;
  };

  const findCountryId = async (countryKey) => {
    if (!countryKey) return undefined;

    const countries = await getCountries();
    const ruName = COUNTRY_MAP[countryKey] || countryKey;
    const target = String(ruName || "").toLowerCase();

    const found = countries.find(
      (c) => String(c?.country || "").toLowerCase() === target,
    );

    return found?.id;
  };

  // Универсальная загрузка списка по типу (фильмы/сериалы) через unofficial API.
  const listByType = async (type, options = {}) => {
    const page = options.page || 1;
    const limit = options.limit || 9;

    const params = {
      page,
      limit,
      type:
        String(type || "").toUpperCase() === "TV_SERIES" ? "TV_SERIES" : "FILM",
    };

    if (options.rating) {
      const ratingFrom = Number(options.rating);
      if (Number.isFinite(ratingFrom) && ratingFrom > 0) {
        const min = Math.min(10, Math.max(0, ratingFrom));
        params.ratingFrom = min;
        params.ratingTo = 10;
      }
    }

    if (options.year) {
      const y = Number(String(options.year).trim());
      if (Number.isFinite(y) && y > 1800 && y < 3000) {
        params.yearFrom = y;
        params.yearTo = y;
      }
    }

    if (options.genre) {
      const genreNameRu =
        GENRE_MAP_REVERSE[options.genre] || String(options.genre);
      const genreId = await findGenreId(String(genreNameRu || "").trim());
      if (genreId) params.genres = genreId;
    }

    if (options.country) {
      const countryNameRu =
        COUNTRY_MAP[options.country] || String(options.country);
      const countryId = await findCountryId(String(countryNameRu || "").trim());
      if (countryId) params.countries = countryId;
    }

    const data = await apiRequest("/api/v2.2/films", params);
    const items = pickListDocs(data);

    const filteredByType = items.filter((item) => {
      const series = isSeriesCandidate(item);
      return String(type || "").toUpperCase() === "TV_SERIES"
        ? series
        : !series;
    });

    const filteredByDirector = options.director
      ? filteredByType.filter((item) =>
          matchesDirectorFilter(item, options.director),
        )
      : filteredByType;
    const docs = filteredByDirector.slice(0, limit);
    const total = Number(
      data?.total || filteredByDirector.length || docs.length,
    );
    const totalPages = Number(data?.pages || data?.totalPages || 0);

    return {
      docs,
      total: Number.isFinite(total) && total >= 0 ? total : docs.length,
      pages:
        Number.isFinite(totalPages) && totalPages > 0
          ? totalPages
          : Math.max(
              1,
              Math.ceil(filteredByDirector.length / Math.max(1, limit)),
            ),
    };
  };

  const getMovies = (options = {}) => listByType("FILM", options);
  const getSeries = (options = {}) => listByType("TV_SERIES", options);

  // Пакетная загрузка карточек по id (использует /api/v2.2/films/{id}).
  const getMoviesByIds = async (ids = []) => {
    const normalizedIds = Array.from(
      new Set(
        (Array.isArray(ids) ? ids : [])
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    );

    const out = [];
    const settled = await Promise.allSettled(
      normalizedIds.map((id) => getMovieById(id)),
    );

    settled.forEach((res, idx) => {
      const id = normalizedIds[idx];
      if (res.status === "fulfilled") {
        if (res.value) out.push(res.value);
        return;
      }

      logRecoverableError("/api/v2.2/films/{id} in batch failed", res.reason, {
        id,
      });
    });

    return out;
  };

  const getRandomMovies = async (count = 6, isSeries = false) => {
    const type = isSeries ? "TV_SERIES" : "FILM";
    const page = Math.max(1, Math.floor(Math.random() * 5) + 1);
    const list = await listByType(type, {
      page,
      limit: Math.max(count * 3, 18),
    });

    const pool = Array.isArray(list?.docs) ? [...list.docs] : [];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, count);
  };

  const getMovieReviews = async (id, page = 1, limit = 20) => {
    const data = await apiRequest(`/api/v2.2/films/${id}/reviews`, {
      page,
      order: "DATE_DESC",
    });
    const items = Array.isArray(data?.items) ? data.items : [];
    return {
      docs: items.slice(0, limit),
      total: Number(data?.total || items.length),
      pages: Number(data?.totalPages || 1),
    };
  };

  const getMovieImages = async (id, page = 1, limit = 20, type = null) => {
    const params = { page };

    if (type) params.type = type;

    const data = await apiRequest(`/api/v2.2/films/${id}/images`, params);
    const items = Array.isArray(data?.items) ? data.items : [];

    return items.slice(0, limit);
  };

  const getMovieStaff = async (id) => {
    const data = await apiRequest("/api/v1/staff", { filmId: id });
    return Array.isArray(data) ? data : [];
  };

  // ==================================================
  // РАБОТА С ТРЕЙЛЕРАМИ
  // ==================================================
  // Сначала пробуем найти трейлеры по ID в Kinopoisk,
  // если не получилось — используем резервный поиск в YouTube.

  // Кэш YouTube-поиска: ключ -> { t: время_записи, items: массив_видео }
  const __YT_CACHE__ = new Map();
  const __YT_TTL_MS__ = 10 * 60 * 1000;

  const YT_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

  const removeDiacritics = (s) => {
    try {
      return String(s || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
    } catch (error) {
      logRecoverableError("String normalize failed", error, {
        source: String(s || "").slice(0, 80),
      });
      return String(s || "");
    }
  };

  const normalizeTitleText = (s) =>
    removeDiacritics(String(s || ""))
      .toLowerCase()
      .replace(/[’'"]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

  const tokenizeTitle = (s) => {
    const txt = normalizeTitleText(s);

    if (!txt) return [];

    return (
      txt
        .split(" ")
        .filter(Boolean)
        // Сохраняем короткие токены и числа, чтобы не потерять части и сиквелы.
        .filter(
          (t) => t.length >= 2 || /^\d+$/.test(t) || /^[ivxlcdm]+$/i.test(t),
        )
    );
  };

  const containsWord = (haystack, word) => {
    const h = normalizeTitleText(haystack);
    const w = normalizeTitleText(word);

    if (!h || !w) return false;

    // Проверяем именно целое слово (латиница, кириллица, цифры).
    const re = new RegExp(`(^|[^\p{L}\p{N}])${w}([^\p{L}\p{N}]|$)`, "iu");

    return re.test(h);
  };

  const titleMatchScore = (expectedTitles, candidateTitle) => {
    const candNorm = normalizeTitleText(candidateTitle);
    const candTokens = new Set(tokenizeTitle(candidateTitle));

    if (!candNorm || !candTokens.size) return 0;

    let best = 0;

    for (const et of expectedTitles || []) {
      const expNorm = normalizeTitleText(et);
      const expTokens = tokenizeTitle(et);
      if (!expNorm || !expTokens.length) continue;

      // Для очень коротких названий требуем точное совпадение слова.
      if (expTokens.length === 1 && expTokens[0].length <= 3) {
        best = Math.max(best, containsWord(candNorm, expTokens[0]) ? 1 : 0);
        continue;
      }

      // Дополнительный бонус за точное фразовое вхождение.
      let phraseBonus = 0;

      if (expNorm.length >= 4 && candNorm.includes(expNorm)) phraseBonus = 0.25;

      let hit = 0;
      for (const t of expTokens) {
        if (candTokens.has(t)) hit += 1;
      }

      // Доля совпавших токенов в пределах текущего названия.
      const coverage = hit / expTokens.length;
      best = Math.max(best, Math.min(1, coverage + phraseBonus));
    }

    return best;
  };

  const minMatchThreshold = (expectedTitles) => {
    // Порог подбираем по самому информативному варианту названия.
    const tokensByTitle = (expectedTitles || []).map((t) => tokenizeTitle(t));
    const maxTokens = Math.max(0, ...tokensByTitle.map((t) => t.length));

    // Для очень коротких названий принимаем только почти точное совпадение.
    if (maxTokens <= 1) return 0.95;
    if (maxTokens === 2) return 0.7;

    return 0.35;
  };

  const extractYoutubeId = (url) => {
    const raw = String(url || "").trim();

    if (!raw) return "";

    // Шаг 1. Разбор через URL-объект — самый надежный вариант.
    try {
      const u = new URL(raw, location.origin);
      const host = u.hostname.replace(/^www\./, "").toLowerCase();
      let id = "";

      if (host === "youtu.be") {
        id = (u.pathname.split("/")[1] || "").trim();
      } else if (
        host.endsWith("youtube.com") ||
        host.endsWith("youtube-nocookie.com")
      ) {
        id = (u.searchParams.get("v") || "").trim();

        if (!id && u.pathname.startsWith("/embed/")) {
          id = (u.pathname.split("/")[2] || "").trim();
        }

        if (!id && u.pathname.startsWith("/shorts/")) {
          id = (u.pathname.split("/")[2] || "").trim();
        }
      }

      if (YT_ID_RE.test(id)) return id;
    } catch (error) {
      logRecoverableError("YouTube URL parse failed", error, {
        raw: String(raw || "").slice(0, 200),
      });
    }

    // Шаг 2. Резервная проверка через регулярное выражение.
    const m = raw.match(
      /(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/,
    );
    if (m?.[1] && YT_ID_RE.test(m[1])) return m[1];

    return "";
  };

  // Формируем ссылку встраивания только через youtube.com,
  // чтобы плеер стабильно работал на странице деталей.
  const buildYoutubeEmbedUrl = (id) => {
    const u = new URL(`https://www.youtube.com/embed/${id}`);
    u.searchParams.set("rel", "0");
    u.searchParams.set("modestbranding", "1");
    u.searchParams.set("playsinline", "1");
    return u.toString();
  };

  // Основной источник: ролики Kinopoisk по конкретному ID фильма.
  const getMovieVideosFromKinopoisk = async (id) => {
    const data = await apiRequest(`/api/v2.2/films/${id}/videos`);
    const items = Array.isArray(data?.items) ? data.items : [];
    if (!items.length) return [];

    const yt = items
      .map((x) => ({
        site: String(x?.site || "").toLowerCase(),
        url: String(x?.url || ""),
        name: String(x?.name || ""),
        type: String(x?.type || ""),
      }))
      .filter((x) => x.url)
      .filter((x) => x.site.includes("youtube") || x.url.includes("youtu"))
      // Оставляем только корректные ID видео,
      // иначе встроенный плеер может не загрузиться.
      .map((x) => ({ ...x, vid: extractYoutubeId(x.url) }))
      .filter((x) => YT_ID_RE.test(x.vid));

    if (!yt.length) return [];

    const rankType = (t) => {
      const s = String(t || "").toUpperCase();
      if (s.includes("TRAILER")) return 3;
      if (s.includes("TEASER")) return 2;
      return 1;
    };

    // Приоритет: трейлеры выше тизеров, тизеры выше остальных роликов.
    yt.sort((a, b) => {
      const rt = rankType(b.type) - rankType(a.type);
      if (rt) return rt;
      const an = normalizeTitleText(a.name);
      const bn = normalizeTitleText(b.name);
      // Дополнительно повышаем ролики с явной пометкой «трейлер».
      const boost = (s) =>
        s.includes("trailer") || s.includes("трейлер") ? 1 : 0;
      return boost(bn) - boost(an);
    });

    return yt.slice(0, 3).map((v) => ({
      site: "youtube",
      url: `https://www.youtube.com/watch?v=${v.vid}`,
      embedUrl: buildYoutubeEmbedUrl(v.vid),
      name: v.name || "Trailer",
    }));
  };

  // Резервный вариант: поиск на YouTube с проверкой релевантности.
  const youtubeRequest = (endpoint, params = {}) => {
    if (!YOUTUBE_CONFIG.API_KEY) {
      throw new Error("YOUTUBE_API_KEY is not configured");
    }

    const url = new URL(`${YOUTUBE_CONFIG.BASE_URL}${endpoint}`);
    appendParams(url.searchParams, params);

    return fetchJson(url.toString());
  };

  const parseIsoDurationToSeconds = (iso) => {
    const m = String(iso || "").match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

    if (!m) return 0;

    const h = parseInt(m[1] || "0", 10);
    const mm = parseInt(m[2] || "0", 10);
    const ss = parseInt(m[3] || "0", 10);

    return h * 3600 + mm * 60 + ss;
  };

  const isBannedVideoTitle = (title, { isSeries }) => {
    const t = normalizeTitleText(title);

    // Жёсткие маркеры нерелевантного контента.
    const hard = [
      "full movie",
      "complete movie",
      "full film",
      "movie full",
      "полный фильм",
      "фильм полностью",
      "фильм целиком",
      "полная версия",
      "весь фильм",
      "full episode",
      "полная серия",
      "full season",
      "полный сезон",
      "game trailer",
      "gameplay trailer",
      "trailer breakdown",
      "обзор",
      "reaction",
      "реакц",
      "разбор",
      "review",
      "explained",
      "recap",
      // Подборки, топы и похожие ролики почти всегда нерелевантны.
      "top",
      "best",
      "similar",
      "movies like",
      "movie like",
      "what to watch",
      "похожие",
      "похож",
      "лучших",
      "лучшие",
      "топ",
      "подборка",
      "подборки",
      "подборок",
      "что посмотреть",
      "лучшие моменты",
      "best moments",
      "highlights",
      "сцены",
      "нарезка",
      "компиляция",
      "interview",
      "behind the scenes",
      "bloopers",
    ];

    if (hard.some((k) => t.includes(k))) return true;

    // Для сериалов слова season/episode допустимы и не блокируют ролик.
    if (!isSeries) {
      const soft = ["episode", "season", "серия", "сезон"];

      if (soft.some((k) => t.includes(k))) return true;
    }

    return false;
  };

  const trailerScore = (title, { isSeries }) => {
    const t = normalizeTitleText(title);
    let score = 0;

    // Позитивные маркеры, характерные для трейлеров.
    if (t.includes("official trailer") || t.includes("официальный трейлер"))
      score += 6;
    if (t.includes("trailer") || t.includes("трейлер")) score += 4;
    if (t.includes("teaser") || t.includes("тизер")) score += 2;
    if (t.includes("final trailer")) score += 1;

    // Для сериалов маркер season/сезон повышает релевантность.
    if (isSeries && (t.includes("season") || t.includes("сезон"))) score += 0.5;

    // Понижаем обзоры и реакции — обычно это не трейлеры.
    if (t.includes("review") || t.includes("обзор")) score -= 4;
    if (t.includes("reaction") || t.includes("реакц")) score -= 3;
    if (t.includes("analysis") || t.includes("разбор")) score -= 3;

    if (isBannedVideoTitle(t, { isSeries })) score -= 25;

    return score;
  };

  const channelBonus = (channelTitle) => {
    const c = normalizeTitleText(channelTitle);

    if (!c) return 0;

    // Небольшой бонус известным официальным каналам.
    const good = [
      "warner bros",
      "netflix",
      "disney",
      "marvel",
      "pixar",
      "paramount",
      "sony",
      "universal",
      "hbo",
      "a24",
      "lionsgate",
      "amazon",
      "prime video",
      "apple tv",
      "20th century",
      "searchlight",
      "bbc",
      "hulu",
    ];

    return good.some((k) => c.includes(k)) ? 3 : 0;
  };

  const yearBonus = (title, year) => {
    const y = String(year || "").trim();

    if (!y || !/^\d{4}$/.test(y)) return 0;

    const t = normalizeTitleText(title);

    if (t.includes(y)) return 1.5;
    // Допускаем отклонение года на ±1 (премьера может смещаться).
    const y1 = String(Number(y) + 1);
    const y_1 = String(Number(y) - 1);
    if (t.includes(y1) || t.includes(y_1)) return 0.5;

    return 0;
  };

  const makeYouTubeQueries = ({ titles, year, isSeries }) => {
    const uniq = new Set();
    const out = [];

    const add = (q, lang) => {
      const qq = String(q || "").trim();

      if (!qq) return;

      const key = normalizeTitleText(qq);

      if (!key || uniq.has(key)) return;

      uniq.add(key);
      out.push({ q: qq, lang });
    };

    const t1 = titles?.[0] || "";
    const t2 = titles?.[1] || "";

    const hasRu = (s) => /[а-яё]/i.test(String(s || ""));
    const hasEn = (s) => /[a-z]/i.test(String(s || ""));

    const ru = hasRu(t1) ? t1 : hasRu(t2) ? t2 : "";
    const en = hasEn(t2) ? t2 : hasEn(t1) ? t1 : "";

    const y = year ? ` ${year}` : "";

    // Базовые запросы: оригинальное и локализованное название с годом.
    if (en) add(`${en}${y} trailer`, "en");
    if (ru) add(`${ru}${y} трейлер`, "ru");

    // Усиливаем запросы явным маркером «official trailer».
    if (en) add(`${en} official trailer${y}`, "en");
    if (ru) add(`${ru} официальный трейлер${y}`, "ru");

    // Для сериалов добавляем отдельные хвосты запроса.
    if (isSeries) {
      if (en) add(`${en}${y} series trailer`, "en");
      if (ru) add(`${ru}${y} сериал трейлер`, "ru");
    }

    return out.slice(0, 4);
  };

  const getMovieVideosFromYouTubeSearch = async ({
    expectedTitles,
    year,
    isSeries,
    kpId,
  }) => {
    const titles = Array.isArray(expectedTitles) ? expectedTitles : [];
    const safeYear = String(year || "").trim();
    const cacheKey = `yt:${kpId || ""}:${
      isSeries ? 1 : 0
    }:${safeYear}:${titles.join("|")}`;

    const cached = __YT_CACHE__.get(cacheKey);

    if (cached && Date.now() - cached.t < __YT_TTL_MS__) return cached.items;

    const queries = makeYouTubeQueries({ titles, year: safeYear, isSeries });

    if (!queries.length) return [];

    const minMatch = minMatchThreshold(titles);

    const looseMinMatch = Math.max(0.25, minMatch - 0.35);

    const candidates = new Map();

    const looseCandidates = new Map();

    const anyCandidates = new Map();

    // Если YouTube API недоступен, возвращаем безопасный резерв,
    // чтобы не ломать блок трейлера в интерфейсе.
    let youtubeApiFailed = false;

    let fallbackSearchId = "";

    // Запросы выполняем последовательно, чтобы не тратить лишнюю квоту API.
    let bestSoFar = null;

    for (const { q, lang } of queries) {
      let searchData;

      try {
        searchData = await youtubeRequest("/search", {
          part: "snippet",
          q,
          type: "video",
          maxResults: 8,
          safeSearch: "none",
          videoEmbeddable: "true",
          videoSyndicated: "true",
          relevanceLanguage: lang,
          key: YOUTUBE_CONFIG.API_KEY,
        });
      } catch (e) {
        logRecoverableError("YouTube search request failed", e, {
          query: q,
        });
        youtubeApiFailed = true;
        break;
      }

      const ids = (Array.isArray(searchData?.items) ? searchData.items : [])
        .map((it) => it?.id?.videoId)
        .filter((x) => YT_ID_RE.test(String(x || "")));

      if (!fallbackSearchId && ids.length) {
        fallbackSearchId = String(ids[0] || "");
      }

      if (!ids.length) continue;

      let videosData;

      try {
        videosData = await youtubeRequest("/videos", {
          part: "snippet,contentDetails,status",
          id: ids.join(","),
          key: YOUTUBE_CONFIG.API_KEY,
        });
      } catch (e) {
        logRecoverableError("YouTube videos request failed", e, {
          query: q,
          idsCount: ids.length,
        });
        youtubeApiFailed = true;
        break;
      }

      const items = (Array.isArray(videosData?.items) ? videosData.items : [])
        .filter((v) => v?.status?.privacyStatus === "public")
        .filter((v) => v?.status?.embeddable === true);

      for (const v of items) {
        const id = String(v?.id || "");
        if (!YT_ID_RE.test(id)) continue;

        const title = v?.snippet?.title || "";
        const channelTitle = v?.snippet?.channelTitle || "";
        const durationSec = parseIsoDurationToSeconds(
          v?.contentDetails?.duration || "",
        );

        // Возрастные ограничения часто делают встраивание недоступным.
        if (
          String(v?.contentDetails?.contentRating?.ytRating || "") ===
          "ytAgeRestricted"
        ) {
          continue;
        }

        const match = titleMatchScore(titles, title);

        if (isBannedVideoTitle(title, { isSeries })) continue;

        // Очень длинные ролики чаще всего не являются трейлерами.
        let durPenalty = 0;
        if (durationSec > 20 * 60) durPenalty = 999;
        else if (durationSec > 12 * 60) durPenalty = 10;
        // Слишком короткий ролик чаще оказывается клипом или тизером.
        else if (durationSec > 0 && durationSec < 25) durPenalty = 3;

        const score =
          match * 60 +
          trailerScore(title, { isSeries }) * 5 +
          channelBonus(channelTitle) +
          yearBonus(title, safeYear) -
          durPenalty;
        // Сохраняем общий пул кандидатов для финального резервного выбора.
        {
          const prevAny = anyCandidates.get(id);

          if (!prevAny || score > prevAny.score) {
            anyCandidates.set(id, {
              id,
              title,
              channelTitle,
              durationSec,
              score,
              queryUsed: q,
              match,
            });
          }
        }

        // Используем два порога совпадения: строгий и мягкий.
        if (match < looseMinMatch) continue;

        const target = match >= minMatch ? candidates : looseCandidates;
        const prev = target.get(id);

        if (!prev || score > prev.score) {
          const obj = {
            id,
            title,
            channelTitle,
            durationSec,
            score,
            queryUsed: q,
            match,
          };
          target.set(id, obj);
        }

        if (match >= minMatch) {
          const cur = candidates.get(id) || target.get(id);

          if (!bestSoFar || (cur && cur.score > bestSoFar.score)) {
            bestSoFar = cur;
          }
        }
      }

      // Досрочно завершаем цикл при уверенном лучшем попадании.
      if (bestSoFar && bestSoFar.match >= 0.85 && bestSoFar.score >= 70) break;
    }

    if (youtubeApiFailed) {
      // Для страницы деталей нужен корректный URL встраивания по ID видео,
      // поэтому резерв строим только через валидный ID.
      if (fallbackSearchId && YT_ID_RE.test(fallbackSearchId)) {
        const fallback = [
          {
            site: "youtube",
            url: `https://www.youtube.com/watch?v=${fallbackSearchId}`,
            embedUrl: buildYoutubeEmbedUrl(fallbackSearchId),
            name: "Трейлер (YouTube)",
          },
        ];
        __YT_CACHE__.set(cacheKey, { t: Date.now(), items: fallback });
        return fallback;
      }
      __YT_CACHE__.set(cacheKey, { t: Date.now(), items: [] });
      return [];
    }

    const sorted = Array.from(candidates.values()).sort(
      (a, b) => b.score - a.score,
    );

    let out = sorted.slice(0, 3).map((x) => ({
      site: "youtube",
      url: `https://www.youtube.com/watch?v=${x.id}`,
      embedUrl: buildYoutubeEmbedUrl(x.id),
      name: x.title || "Trailer",
    }));

    // Если нет строгих кандидатов, пробуем мягкое совпадение.
    if (!out.length) {
      const looseSorted = Array.from(looseCandidates.values()).sort(
        (a, b) => b.score - a.score,
      );
      const best = looseSorted[0];
      if (best && YT_ID_RE.test(String(best.id || ""))) {
        out = [
          {
            site: "youtube",
            url: `https://www.youtube.com/watch?v=${best.id}`,
            embedUrl: buildYoutubeEmbedUrl(best.id),
            name: best.title || "Trailer",
          },
        ];
      }
    }

    // Финальный резерв: лучший ролик из общего пула с признаками трейлера.
    if (!out.length) {
      const anySorted = Array.from(anyCandidates.values()).sort(
        (a, b) => b.score - a.score,
      );
      const bestAny = anySorted.find(
        (x) => trailerScore(x.title || "", { isSeries }) >= 3,
      );
      if (bestAny && YT_ID_RE.test(String(bestAny.id || ""))) {
        out = [
          {
            site: "youtube",
            url: `https://www.youtube.com/watch?v=${bestAny.id}`,
            embedUrl: buildYoutubeEmbedUrl(bestAny.id),
            name: bestAny.title || "Trailer",
          },
        ];
      }
    }

    __YT_CACHE__.set(cacheKey, { t: Date.now(), items: out });
    return out;
  };

  const getMovieVideos = async (movieOrId) => {
    let id = null;
    let titles = [];
    let year = "";
    let isSeries = false;

    if (movieOrId && typeof movieOrId === "object") {
      id = movieOrId.id || movieOrId.kinopoiskId || movieOrId.filmId || null;

      const t1 =
        movieOrId.title ||
        movieOrId.nameRu ||
        movieOrId.nameOriginal ||
        movieOrId.nameEn ||
        movieOrId.name ||
        "";
      const t2 = movieOrId.nameOriginal || movieOrId.nameEn || "";
      titles = [t1, t2].map((x) => String(x || "").trim()).filter(Boolean);

      year = movieOrId.year ? String(movieOrId.year).trim() : "";

      if (!year && movieOrId.startYear) {
        year = String(movieOrId.startYear).trim();
      }

      const type = String(
        movieOrId.type || movieOrId.typeFilm || "",
      ).toUpperCase();
      isSeries = Boolean(movieOrId.serial) || type.includes("SERIES");
    } else {
      id = movieOrId;
    }

    if (!id) return [];

    // Шаг 1: пытаемся получить официальный набор роликов Kinopoisk по ID.
    try {
      const kp = await getMovieVideosFromKinopoisk(id);
      if (Array.isArray(kp) && kp.length) return kp;
    } catch (e) {
      logRecoverableError("Kinopoisk videos request failed", e, { id });
      // Ошибка не критична: продолжаем резервным поиском на YouTube.
    }

    // Шаг 2: резервный поиск на YouTube с проверкой релевантности.
    if (!titles.length) {
      logRecoverableError("No titles for YouTube fallback", null, {
        id,
      });

      return [];
    }

    return getMovieVideosFromYouTubeSearch({
      expectedTitles: titles,
      year,
      isSeries,
      kpId: id,
    });
  };

  // ==================================================
  // НОРМАЛИЗАЦИЯ ДАННЫХ ФИЛЬМОВ
  // ==================================================

  // Приводит входной формат постера к строковому URL.
  const pickPosterUrl = (value) => {
    // В ответах API постер может приходить как строка или как объект.
    if (!value) return null;

    if (typeof value === "string") return value;

    if (typeof value === "object") {
      return value.url || value.previewUrl || value.posterUrl || null;
    }

    return null;
  };

  // Нормализует карточку фильма/сериала к единому формату приложения.
  const normalizeMovie = (movie) => {
    if (!movie) return null;

    const id = movie.kinopoiskId || movie.id || movie.filmId;

    const title =
      movie.nameRu ||
      movie.name ||
      movie.nameEn ||
      movie.nameOriginal ||
      movie.alternativeName ||
      movie.title ||
      "Без названия";
    const year = movie.year || movie.startYear || null;

    const ratingRaw =
      movie.ratingKinopoisk ??
      movie.rating?.kp ??
      movie.ratingImdb ??
      movie.rating?.imdb ??
      movie.rating ??
      0;
    const ratingParsed = parseFloat(String(ratingRaw).replace(",", "."));
    const rating = Number.isFinite(ratingParsed) ? ratingParsed : 0;

    const ratingImdbRaw = movie.ratingImdb ?? movie.rating?.imdb ?? null;
    const ratingImdbParsed =
      ratingImdbRaw === null
        ? null
        : parseFloat(String(ratingImdbRaw).replace(",", "."));
    const ratingImdb =
      ratingImdbParsed !== null && Number.isFinite(ratingImdbParsed)
        ? ratingImdbParsed
        : null;

    // Защита от ошибки src="[object Object]" при объектном формате постера.
    const poster =
      pickPosterUrl(movie.posterUrl) || pickPosterUrl(movie.poster);
    const posterPreview =
      pickPosterUrl(movie.posterUrlPreview) ||
      (movie.poster && typeof movie.poster === "object"
        ? movie.poster.previewUrl || null
        : null);

    const genres = Array.isArray(movie.genres)
      ? movie.genres
          .map((g) => g.genre || g.nameRu || g.nameEn || g.name)
          .filter(Boolean)
      : [];
    const countries = Array.isArray(movie.countries)
      ? movie.countries
          .map((c) => c.country || c.nameRu || c.nameEn || c.name)
          .filter(Boolean)
      : [];

    const description = movie.description || movie.shortDescription || "";
    const shortDescription = movie.shortDescription || null;

    const rawPersons = Array.isArray(movie.persons)
      ? movie.persons
      : Array.isArray(movie.staff)
        ? movie.staff
        : [];

    const directors = uniqStrings([
      ...rawPersons.filter(hasDirectorProfession).map(personName),
      ...splitPeopleText(movie.director),
      ...(Array.isArray(movie.directors)
        ? movie.directors.map((x) => String(x || "").trim())
        : []),
    ]);

    const actors = uniqStrings([
      ...rawPersons.filter(hasActorProfession).map(personName),
      ...splitPeopleText(movie.actors),
      ...(Array.isArray(movie.actors)
        ? movie.actors.map((x) => String(x || "").trim())
        : []),
    ]);

    const type = movie.type || null;

    let ageRating = null;

    if (movie.ratingAgeLimits) {
      const m = String(movie.ratingAgeLimits).match(/age(\d+)/);

      if (m?.[1]) ageRating = `${m[1]}+`;
    }

    const movieLength = movie.filmLength || movie.movieLength || null;
    const seriesLength = movie.seriesLength || null;
    const totalSeriesLength = movie.totalSeriesLength || null;

    return {
      id,
      title,
      alternativeTitle:
        movie.nameOriginal || movie.alternativeName || movie.nameEn || null,
      year,
      rating,
      ratingImdb,
      poster,
      posterPreview,
      backdrop: movie.coverUrl || null,
      genres,
      countries,
      description,
      shortDescription,
      type,
      ageRating,
      movieLength,
      seriesLength,
      totalSeriesLength,
      directors,
      actors,
      trailer: null,
      trailers: [],
      frames: [],
      reviews: [],
    };
  };

  // ==================================================
  // СПРАВОЧНИКИ ЖАНРОВ И СТРАН
  // ==================================================
  // Нужны для согласования значений фильтров между интерфейсом и API.
  const GENRE_MAP = {
    фэнтези: "fantasy",
    драма: "drama",
    боевик: "action",
    триллер: "thriller",
    фантастика: "scifi",
    ужасы: "horror",
    комедия: "comedy",
    криминал: "crime",
    приключения: "adventure",
    мелодрама: "romance",
    детектив: "detective",
    мультфильм: "animation",
    документальный: "documentary",
    биография: "biography",
    военный: "war",
    история: "history",
    семейный: "family",
    спорт: "sport",
    музыка: "music",
    вестерн: "western",
  };

  const GENRE_MAP_REVERSE = Object.fromEntries(
    Object.entries(GENRE_MAP).map(([k, v]) => [v, k]),
  );

  const COUNTRY_MAP = {
    usa: "США",
    uk: "Великобритания",
    russia: "Россия",
    france: "Франция",
    germany: "Германия",
    italy: "Италия",
    spain: "Испания",
    japan: "Япония",
    korea: "Южная Корея",
    china: "Китай",
    india: "Индия",
    canada: "Канада",
    australia: "Австралия",
  };

  const COUNTRY_MAP_REVERSE = Object.fromEntries(
    Object.entries(COUNTRY_MAP).map(([k, v]) => [v, k]),
  );

  // ==================================================
  // ПУБЛИЧНЫЙ ИНТЕРФЕЙС МОДУЛЯ
  // ==================================================
  window.MovieAPI = {
    getMovieById,
    getMovieDetails: getMovieById,
    searchMovies,
    getMovies,
    getSeries,
    getMoviesByIds,
    getRandomMovies,
    getGenres,
    getCountries,
    getMovieReviews,
    getMovieImages,
    getMovieVideos,
    getMovieStaff,
    normalizeMovie,
    GENRE_MAP,
    GENRE_MAP_REVERSE,
    COUNTRY_MAP,
    COUNTRY_MAP_REVERSE,
    postJson,
    CONFIG: API_CONFIG,
  };
})();
