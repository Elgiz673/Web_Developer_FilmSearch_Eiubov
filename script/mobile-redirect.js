/*
 * Маршрутизатор desktop/mobile версий страниц.
 * Перенаправляет между соответствующими маршрутами без изменения query-параметров.
 */

(function () {
  try {
    // Мобильным считаем узкий viewport либо touch-устройство в портретной ориентации.
    const isNarrowViewport =
      window.matchMedia && window.matchMedia("(max-width: 480px)").matches;
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isPortraitTablet =
      window.matchMedia &&
      window.matchMedia("(max-width: 768px) and (orientation: portrait)")
        .matches;

    // Правило выбора mobile-layout.
    const isMobile = isNarrowViewport || (isTouchDevice && isPortraitTablet);

    const path = window.location.pathname;
    const search = window.location.search || "";
    const isInMobile = path.includes("/mobile/");

    // Нормализация случая, когда маршрут заканчивается на '/'.
    const normalizedPath = path.endsWith("/") ? path + "index.html" : path;

    let target = null;

    function toMobile(p) {
      if (p.endsWith("/movie_list/index.html"))
        return p.replace(
          "/movie_list/index.html",
          "/mobile/movie_list/index.html"
        );
      if (p.endsWith("/series_list/index.html"))
        return p.replace(
          "/series_list/index.html",
          "/mobile/series_list/index.html"
        );
      if (p.endsWith("/movie/index.html"))
        return p.replace("/movie/index.html", "/mobile/movie/index.html");
      if (p.endsWith("/index.html"))
        return p.replace("/index.html", "/mobile/index.html");
      return null;
    }

    function toDesktop(p) {
      if (p.endsWith("/mobile/movie_list/index.html"))
        return p.replace(
          "/mobile/movie_list/index.html",
          "/movie_list/index.html"
        );
      if (p.endsWith("/mobile/series_list/index.html"))
        return p.replace(
          "/mobile/series_list/index.html",
          "/series_list/index.html"
        );
      if (p.endsWith("/mobile/movie/index.html"))
        return p.replace("/mobile/movie/index.html", "/movie/index.html");
      if (p.endsWith("/mobile/index.html"))
        return p.replace("/mobile/index.html", "/index.html");
      return null;
    }

    if (isMobile && !isInMobile) {
      target = toMobile(normalizedPath);
    }

    if (!isMobile && isInMobile) {
      target = toDesktop(normalizedPath);
    }

    if (target && target !== normalizedPath) {
      // Сохраняем query-параметры (поиск, фильтры и т.п.).
      window.location.replace(target + search);
    }
  } catch (e) {
    // Не скрываем ошибку полностью: оставляем диагностический след,
    // но не прерываем загрузку страницы.
    const text =
      e instanceof Error
        ? `${e.name}: ${e.message}`
        : String(e || "Unknown error");
    console.warn("[MobileRedirect] Redirect logic failed", {
      error: text,
      path: window.location.pathname,
    });
  }
})();
