/*
 * Общий клиентский модуль для всех страниц.
 * Отвечает за тему, мобильное меню, общий поиск и UI-патчи мобильной версии.
 */

/**
 * Набор общих утилит, которыми пользуются остальные скрипты проекта.
 * Утилиты не меняют бизнес-логику, а стандартизируют повторяющиеся операции.
 */
window.AppUtils = window.AppUtils || {
  /**
   * Проверяет, относится ли текущий путь к мобильным страницам проекта.
   *
   * @returns {boolean}
   */
  isMobilePath() {
    // Проверяем конкретные маршруты проекта, чтобы не спутать их с частью имени родительской папки.
    const path = window.location.pathname || "";
    const normalizedPath = path.endsWith("/") ? path + "index.html" : path;

    return (
      normalizedPath.endsWith("/mobile/index.html") ||
      normalizedPath.endsWith("/mobile/movie_list/index.html") ||
      normalizedPath.endsWith("/mobile/series_list/index.html") ||
      normalizedPath.endsWith("/mobile/movie/index.html")
    );
  },

  qs(selector, root = document) {
    return root.querySelector(selector);
  },

  qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  },

  byId(id) {
    return document.getElementById(id);
  },

  setText(el, value) {
    if (!el) return;
    el.textContent = value == null ? "" : String(value);
  },

  setHTML(el, html) {
    if (!el) return;
    el.innerHTML = html == null ? "" : String(html);
  },

  setBgImage(el, url) {
    if (!el) return;
    if (!url) {
      el.style.backgroundImage = "";
      return;
    }
    const safeUrl = String(url).startsWith("http") ? url : encodeURI(url);
    el.style.backgroundImage = `url("${safeUrl}")`;
  },

  toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  },

  clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  },

  /**
   * Логирование recoverable-ошибок без падения приложения.
   *
   * @param {string} context
   * @param {unknown} error
   * @param {Record<string, unknown>} [details]
   */
  logError(context, error, details = {}) {
    const text =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error || "Unknown error");
    console.warn(`[App] ${context}`, { error: text, ...details });
  },

  /**
   * Безопасно получить значение из localStorage/sessionStorage.
   * Возвращает fallback, если storage недоступен.
   */
  safeStorageGet(key, fallback = null, storage = window.localStorage) {
    try {
      const value = storage.getItem(key);
      return value == null ? fallback : value;
    } catch (error) {
      this.logError("Storage get failed", error, { key });
      return fallback;
    }
  },

  /**
   * Безопасно записать значение в localStorage/sessionStorage.
   *
   * @returns {boolean}
   */
  safeStorageSet(key, value, storage = window.localStorage) {
    try {
      storage.setItem(key, String(value));
      return true;
    } catch (error) {
      this.logError("Storage set failed", error, { key });
      return false;
    }
  },

  /**
   * Безопасный JSON.parse с fallback.
   */
  safeJsonParse(raw, fallback = null) {
    if (typeof raw !== "string") return fallback;
    try {
      return JSON.parse(raw);
    } catch (error) {
      this.logError("JSON parse failed", error, { sample: raw.slice(0, 150) });
      return fallback;
    }
  },
};

document.addEventListener("DOMContentLoaded", () => {
  // ==================================================
  // БАЗОВАЯ ИНИЦИАЛИЗАЦИЯ ОБЩЕГО UI
  // ==================================================

  const isMobilePage = window.AppUtils?.isMobilePath
    ? window.AppUtils.isMobilePath()
    : window.location.pathname.includes("/mobile/");

  // ==================================================
  // ПЕРЕКЛЮЧЕНИЕ ТЕМЫ
  // ==================================================
  const themeCheckbox = document.getElementById("theme-checkbox");
  const themeLabel = document.querySelector(".theme-label");

  function syncThemeLabel() {
    if (!themeLabel) return;
    // По ТЗ: при активной светлой теме отображается "Тёмная тема",
    // при активной тёмной теме отображается "Светлая тема".
    themeLabel.textContent = document.body.classList.contains("dark-theme")
      ? "Светлая тема"
      : "Тёмная тема";
  }

  // ==================================================
  // МОБИЛЬНЫЕ UI-ПАТЧИ ПО МАКЕТУ
  // ==================================================
  function ensureMobilePatchStyles() {
    if (!isMobilePage) return;
    if (document.getElementById("js-mobile-ui-patch")) return;

    const style = document.createElement("style");
    style.id = "js-mobile-ui-patch";
    style.textContent = `
      /* ---- Мобильное меню: убрать лишний заголовок "Меню" ---- */
      .menu-caption { display: none !important; }

      /* ---- Мобильное меню: крестик закрытия строго справа сверху ---- */
      .mobile-nav__close {
        position: absolute !important;
        top: 16px !important;
        right: 20px !important;
        left: auto !important;
        transform: none !important;
      }

      /* ---- Мобильное меню: расстояние между пунктами 32.53px ---- */
      .mobile-nav__link + .mobile-nav__link { margin-top: 32.53px !important; }

      /* ---- Мобильные иконки футера: полностью убрать hover/active ---- */
      @media (hover: none), (pointer: coarse) {
        .footer-mobile .social-media a:hover,
        .footer-mobile .social-media a:active,
        .footer-mobile .social-media a:focus,
        footer .social-icons a:hover,
        footer .social-icons a:active,
        footer .social-icons a:focus {
          background: transparent !important;
          filter: none !important;
          opacity: 1 !important;
          box-shadow: none !important;
          outline: none !important;
        }
      }

      /* ---- Тёмная тема (моб): фон по макету ---- */
      body.dark-theme,
      body.dark-theme .main-container {
        background: #1d1d1d !important;
      }

      /* ---- Хедер/верхняя панель в тёмной теме становится тёмным ---- */
      body.dark-theme .mobile-menu {
        filter: invert(1) hue-rotate(180deg);
      }

      /* ---- Поиск (моб): в тёмной теме поле НЕ должно становиться чёрным ---- */
      body.dark-theme .js-search-container {
        background: #ffffff !important;
        background-image: none !important;
        border: none !important;
        box-shadow: none !important;
        outline: none !important;
        filter: none !important;
        opacity: 1 !important;
        border-radius: 50.452px !important;
        overflow: hidden !important;
      }
      body.dark-theme .js-search-container .search-input {
        color: #010101 !important;
      }
      body.dark-theme .js-search-container .search-input::placeholder {
        color: #010101 !important;
        opacity: 1 !important;
      }

      /* ---- Фильтры (моб, тёмная тема): фон чёрный, плейсхолдер серый ---- */
      body.dark-theme .js-filter-container {
        background: #000000 !important;
      }
      body.dark-theme .js-filter-container.is-placeholder [data-filter-label] {
        color: #8f8f8f !important;
      }
      body.dark-theme .js-filter-container:not(.is-placeholder) [data-filter-label] {
        color: #ffffff !important;
      }

      /* ---- Постеры (моб): без боковых полос (cover + center top) ---- */
      .movie-card, .movie-card-b, .card-film {
        background-repeat: no-repeat !important;
        background-position: center top !important;
        background-size: cover !important;
      }
    `;
    document.head.appendChild(style);
  }

  function applyMobilePatches() {
    if (!isMobilePage) return;

    ensureMobilePatchStyles();

    // Удаляем лишний заголовок меню, если он снова появился в DOM.
    document.querySelectorAll(".menu-caption").forEach((el) => el.remove());

    // По макету в мобильном меню не нужен пункт «Главная».
    const nav = document.getElementById("main-nav");
    nav?.querySelectorAll("a").forEach((a) => {
      const text = (a.textContent || "").trim().toLowerCase();
      if (text === "главная") a.remove();
    });

    // Добавляем служебный класс только к реальному контейнеру поиска.
    const searchForm = document.getElementById("search-form");
    if (searchForm) {
      const searchContainer = searchForm.closest(".rectangle-1, .rectangle-3");
      if (searchContainer) searchContainer.classList.add("js-search-container");
    }

    // Синхронизируем состояние «плейсхолдер/выбрано» для фильтров.
    const filterSelects = document.querySelectorAll(
      "select.filter-select-overlay",
    );
    filterSelects.forEach((select) => {
      const wrapper = select.closest(
        ".rectangle-2, .rectangle-3, .rectangle-5, .rectangle-7, .rectangle-6, .rectangle-8",
      );
      if (!wrapper) return;

      wrapper.classList.add("js-filter-container");

      const label = wrapper.querySelector("[data-filter-label]");
      if (!label) return;

      // Сохраняем исходный текст как плейсхолдер.
      const placeholderText = (
        label.getAttribute("data-placeholder") ||
        label.textContent ||
        ""
      ).trim();
      label.setAttribute("data-placeholder", placeholderText);

      const sync = () => {
        const isPlaceholder = !select.value;
        wrapper.classList.toggle("is-placeholder", isPlaceholder);

        if (isPlaceholder) {
          label.textContent = placeholderText;
        } else {
          const opt = select.options[select.selectedIndex];
          label.textContent = opt ? opt.text : placeholderText;
        }
      };

      // Защита от дублирования обработчиков при повторном вызове патча.
      if (!select.__mobilePatched) {
        select.__mobilePatched = true;
        select.addEventListener("change", sync);
      }
      sync();
    });

    // Клик по левой части мобильной шапки возвращает на мобильную главную.
    const mobileMenu = document.querySelector(".mobile-menu");
    if (mobileMenu && !mobileMenu.__mobileLogoPatched) {
      mobileMenu.__mobileLogoPatched = true;
      mobileMenu.style.cursor = "pointer";
      mobileMenu.addEventListener("click", (e) => {
        // Клик по зоне бургера (правый край ~64px) не перехватываем.
        const rect = mobileMenu.getBoundingClientRect();
        if (e.clientX >= rect.right - 64) return;

        const path = window.location.pathname;
        if (!path.endsWith("/mobile/index.html")) {
          const up = path.includes("/mobile/") ? path.split("/mobile/")[0] : "";
          window.location.href = `${up}/mobile/index.html`;
        }
      });
    }

    // Страховка от «залипшего» overlay/scroll-lock после закрытия меню.
    const burger = document.getElementById("burger-menu");
    const overlay = document.getElementById("nav-overlay");
    const isNavActive = document
      .getElementById("main-nav")
      ?.classList.contains("active");
    if (!isNavActive) {
      burger?.classList.remove("active");
      overlay?.classList.remove("active");
      document.body.style.overflow = "";
    }

    // Подложка страницы в iOS при скролле (без белых полос в тёмной теме).
    document.documentElement.style.backgroundColor =
      document.body.classList.contains("dark-theme") ? "#1d1d1d" : "#ffffff";
  }

  // Инициализация темы: по умолчанию используется светлая тема.
  const savedTheme = window.AppUtils.safeStorageGet("theme", null);
  const isDark = savedTheme === "dark";
  document.body.classList.toggle("dark-theme", isDark);
  if (themeCheckbox) themeCheckbox.checked = isDark;
  if (!savedTheme) window.AppUtils.safeStorageSet("theme", "light");
  syncThemeLabel();
  applyMobilePatches();

  // Переключение темы с сохранением выбора пользователя.
  if (themeCheckbox) {
    themeCheckbox.addEventListener("change", function () {
      if (this.checked) {
        document.body.classList.add("dark-theme");
        window.AppUtils.safeStorageSet("theme", "dark");
      } else {
        document.body.classList.remove("dark-theme");
        window.AppUtils.safeStorageSet("theme", "light");
      }
      syncThemeLabel();
      applyMobilePatches();
    });
  }

  // ==================================================
  // МОБИЛЬНОЕ МЕНЮ
  // ==================================================
  const burgerMenu = document.getElementById("burger-menu");
  const mainNav = document.getElementById("main-nav");
  const navOverlay = document.getElementById("nav-overlay");

  function toggleMobileMenu() {
    burgerMenu?.classList.toggle("active");
    mainNav?.classList.toggle("active");
    navOverlay?.classList.toggle("active");
    document.body.style.overflow = mainNav?.classList.contains("active")
      ? "hidden"
      : "";
    if (isMobilePage) applyMobilePatches();
  }

  function closeMobileMenu() {
    burgerMenu?.classList.remove("active");
    mainNav?.classList.remove("active");
    navOverlay?.classList.remove("active");
    document.body.style.overflow = "";
  }

  burgerMenu?.addEventListener("click", toggleMobileMenu);
  navOverlay?.addEventListener("click", closeMobileMenu);

  // Любой переход из мобильного меню должен его закрывать.
  mainNav?.querySelectorAll("a")?.forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  // Явное закрытие меню по кнопке-крестику.
  mainNav
    ?.querySelector(".mobile-nav__close")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeMobileMenu();
    });

  // Поддержка клавиши Escape для доступности.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mainNav?.classList.contains("active")) {
      closeMobileMenu();
    }
  });

  // Если страница восстановилась из bfcache — сбрасываем залипший оверлей/scroll-lock
  window.addEventListener("pageshow", () => {
    if (isMobilePage) {
      closeMobileMenu();
      applyMobilePatches();
    }
  });

  // ==================================================
  // HOVER-ЭФФЕКТЫ (ТОЛЬКО ДЕСКТОП)
  // ==================================================

  // Hover-эффекты применяем только на десктопе.
  if (!isMobilePage) {
    const searchButtons = document.querySelectorAll(
      ".search-section button, .search-btn, #search-form button",
    );
    searchButtons.forEach((btn) => {
      btn.addEventListener("mouseenter", () => btn.classList.add("hovered"));
      btn.addEventListener("mouseleave", () => btn.classList.remove("hovered"));
    });

    const socialLinks = document.querySelectorAll(
      "footer .social-icons a, .social-media a",
    );
    socialLinks.forEach((link) => {
      link.addEventListener("mouseenter", () => link.classList.add("hovered"));
      link.addEventListener("mouseleave", () =>
        link.classList.remove("hovered"),
      );
    });
  }

  // ==================================================
  // ФОРМА ПОИСКА
  // ==================================================
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-query");

  searchForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = searchInput?.value.trim();
    if (!query) return;

    try {
      // На вложенных страницах переход в списки идет через ../
      const isSubPage =
        window.location.pathname.includes("/movie") ||
        window.location.pathname.includes("/series") ||
        window.location.pathname.includes("/movie_list") ||
        window.location.pathname.includes("/series_list");
      const basePath = isSubPage ? "../" : "";

      // На странице сериалов поиск не должен уводить в список фильмов.
      const targetList = window.location.pathname.includes("/series_list")
        ? "series_list"
        : "movie_list";
      window.location.href = `${basePath}${targetList}/index.html?search=${encodeURIComponent(
        query,
      )}`;
    } catch (error) {
      window.AppUtils.logError("Search navigation failed", error, {
        query,
        pathname: window.location.pathname,
      });
    }
  });

  // ==================================================
  // ПЛАВНЫЙ СКРОЛЛ ПО ЯКОРЯМ
  // ==================================================
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href && href !== "#") {
        e.preventDefault();
        const target = document.querySelector(href);
        target?.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
});

// ==================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==================================================

/**
 * Форматирует рейтинг до одного знака после запятой.
 */
function formatRating(rating) {
  return rating ? rating.toFixed(1) : "—";
}

/**
 * Обрезает текст до заданной длины.
 */
function truncateText(text, maxLength) {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

/**
 * Формирует HTML со звездами рейтинга.
 */
function createStarRating(rating, maxStars = 5) {
  const fullStars = Math.floor(rating / 2);
  const emptyStars = maxStars - fullStars;

  let html = "";
  for (let i = 0; i < fullStars; i++) {
    html += '<span class="star">★</span>';
  }
  for (let i = 0; i < emptyStars; i++) {
    html += '<span class="star empty">★</span>';
  }
  return html;
}

/**
 * Возвращает инициалы из имени.
 */
function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}
