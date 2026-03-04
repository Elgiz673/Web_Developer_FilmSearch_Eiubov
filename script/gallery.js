/*
 * Клиентский модуль галереи карточки фильма/сериала.
 * Отвечает за:
 * 1) отображение и перелистывание кадров (десктоп/мобильная версия),
 * 2) базовый плейсхолдер трейлера,
 * 3) инфраструктуру полноэкранного просмотра (без автоподключения по клику на кадры).
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==================================================
  // ГАЛЕРЕЯ КАДРОВ
  // ==================================================

  const framesContainer = document.querySelector(
    ".flex-row-f, .frames-container",
  );

  const frameSlots = [
    document.querySelector(".rectangle-4"),
    document.querySelector(".rectangle-5"),
  ];

  const frameNextArrow = document.querySelector(".vector-6");
  const framePrevArrow = document.querySelector(".gallery-arrow--prev");
  const frameNextArrowMobile = document.querySelector(".gallery-arrow--next");

  const isMobileGallery =
    Boolean(document.querySelector(".frames-container")) &&
    !Boolean(document.querySelector(".flex-row-f"));

  let frames = [];
  let frameIndex = 0;

  // Пустой набор по умолчанию.
  // Реальные кадры подставляет внешний модуль через window.Gallery.initGallery(...).
  const defaultFrames = [];

  /**
   * Инициализирует список кадров и сбрасывает индекс показа.
   *
   * @param {string[]} [newFrames] URL-адреса изображений кадров
   */
  function initGallery(newFrames) {
    frames = newFrames && newFrames.length > 0 ? newFrames : defaultFrames;
    frameIndex = 0;
    updateFrames();
  }

  /**
   * Перерисовывает слоты кадров в зависимости от режима галереи:
   * - мобильный режим: циклический показ,
   * - десктопный режим: попарный показ в пределах списка.
   */
  function updateFrames() {
    if (!frameSlots[0] && !frameSlots[1]) return;

    if (!frames.length) {
      frameSlots.forEach((slot) => {
        if (!slot) return;
        slot.style.display = "none";
      });

      updateArrowState();
      return;
    }

    if (isMobileGallery) {
      frameSlots.forEach((slot, idx) => {
        if (!slot) return;

        if (frames.length === 1 && idx === 1) {
          slot.style.display = "none";
          return;
        }

        const imgIdx = (frameIndex + idx) % frames.length;
        slot.style.backgroundImage = `url(${frames[imgIdx]})`;
        slot.style.backgroundSize = "cover";
        slot.style.backgroundPosition = "center";
        slot.style.display = "block";
      });

      updateArrowState();
      return;
    }

    // Десктопный режим: показываем по 2 кадра за шаг.
    frameSlots.forEach((slot, idx) => {
      if (!slot) return;

      const imgIdx = frameIndex + idx;

      if (imgIdx < frames.length) {
        slot.style.backgroundImage = `url(${frames[imgIdx]})`;
        slot.style.backgroundSize = "cover";
        slot.style.backgroundPosition = "center";
        slot.style.display = "block";
      } else {
        slot.style.display = "none";
      }
    });

    // После рендера синхронизируем состояние стрелок навигации.
    updateArrowState();
  }

  /**
   * Обновляет визуальное состояние стрелок (opacity/cursor)
   * в зависимости от доступности навигации.
   */
  function updateArrowState() {
    const setArrowVisual = (arrowEl, enabled) => {
      if (!arrowEl) return;

      arrowEl.style.opacity = enabled ? "1" : "0.3";
      arrowEl.style.cursor = enabled ? "pointer" : "default";
      arrowEl.style.pointerEvents = enabled ? "auto" : "none";
      arrowEl.classList.toggle("disabled", !enabled);
      arrowEl.setAttribute("aria-disabled", enabled ? "false" : "true");
    };

    if (isMobileGallery) {
      const canNavigate = frames.length > 1;

      setArrowVisual(framePrevArrow, canNavigate);
      setArrowVisual(frameNextArrowMobile, canNavigate);
      return;
    }

    const canPrev = frameIndex - 2 >= 0;
    const canNext = frameIndex + 2 < frames.length;

    setArrowVisual(framePrevArrow, canPrev);
    setArrowVisual(frameNextArrow, canNext);
  }

  /**
   * Переход к следующему шагу кадров.
   * - мобильная версия: +1 по кругу,
   * - десктопная версия: +2, либо возврат в начало.
   */
  function nextFrames() {
    if (!frames.length) return;

    if (isMobileGallery) {
      if (frameIndex + 1 >= frames.length) return;
      frameIndex += 1;
      updateFrames();
      return;
    }

    if (frameIndex + 2 < frames.length) {
      frameIndex += 2;
      updateFrames();
    }
  }

  /**
   * Переход к предыдущему шагу кадров.
   * - мобильная версия: -1 по кругу,
   * - десктопная версия: -2, либо переход к последней полной паре.
   */
  function prevFrames() {
    if (!frames.length) return;

    if (isMobileGallery) {
      if (frameIndex <= 0) return;
      frameIndex -= 1;
      updateFrames();
      return;
    }

    if (frameIndex - 2 >= 0) {
      frameIndex -= 2;
      updateFrames();
    }
  }

  // ==================================================
  // ОБРАБОТЧИКИ НАВИГАЦИИ ПО СТРЕЛКАМ
  // ==================================================
  if (frameNextArrow) {
    frameNextArrow.style.cursor = "pointer";
    frameNextArrow.addEventListener("click", nextFrames);
  }

  if (framePrevArrow) {
    framePrevArrow.style.cursor = "pointer";
    framePrevArrow.addEventListener("click", prevFrames);
  }

  if (frameNextArrowMobile) {
    frameNextArrowMobile.style.cursor = "pointer";
    frameNextArrowMobile.addEventListener("click", nextFrames);
  }

  // ==================================================
  // БЛОК ПЛЕЙСХОЛДЕРА ТРЕЙЛЕРА
  // ==================================================

  const trailerContainer = document.querySelector(".rectangle-3");
  const playButton = trailerContainer?.querySelector(".vector");

  // На странице деталей трейлером управляет script/movie.js.
  // Здесь не вмешиваемся, чтобы не перезаписывать контейнер плеера
  // и не провоцировать визуальный конфликт двух рендеров.
  const isMoviePageManaged = Boolean(
    document.getElementById("movie-title") &&
    document.getElementById("movie-poster-container"),
  );

  if (playButton && trailerContainer && !isMoviePageManaged) {
    playButton.style.cursor = "pointer";

    playButton.addEventListener("click", () => {
      // Если iframe уже подставлен внешним кодом, повторный рендер не нужен.
      const existingIframe = trailerContainer.querySelector("iframe");

      if (existingIframe) {
        return;
      }

      // Временный статус загрузки до подстановки реального плеера.
      trailerContainer.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #686868;
          font-size: 16px;
          text-align: center;
          padding: 20px;
        ">
          Трейлер загружается...
        </div>
      `;
    });
  }

  // ==================================================
  // ПОЛНОЭКРАННЫЙ ПРОСМОТР КАДРОВ
  // ==================================================

  let lightboxOpen = false;
  let currentLightboxIndex = 0;

  /**
   * Открывает полноэкранный просмотр кадра.
   *
   * @param {number} imgIndex индекс кадра в массиве frames
   */
  function openLightbox(imgIndex) {
    if (lightboxOpen) return;

    currentLightboxIndex = imgIndex;
    lightboxOpen = true;

    // Создаем корневой контейнер затемнения.
    const lightbox = document.createElement("div");
    lightbox.id = "lightbox";
    lightbox.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      cursor: pointer;
    `;

    const img = document.createElement("img");
    img.src = frames[currentLightboxIndex];
    img.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border-radius: 8px;
    `;

    // Кнопка закрытия.
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "×";
    closeBtn.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: transparent;
      border: none;
      color: white;
      font-size: 48px;
      cursor: pointer;
      line-height: 1;
    `;

    // Кнопки навигации по кадрам.
    const prevBtn = document.createElement("button");
    prevBtn.innerHTML = "‹";
    prevBtn.style.cssText = `
      position: absolute;
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255,255,255,0.1);
      border: none;
      color: white;
      font-size: 48px;
      cursor: pointer;
      padding: 20px;
      border-radius: 50%;
    `;

    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = "›";
    nextBtn.style.cssText = `
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255,255,255,0.1);
      border: none;
      color: white;
      font-size: 48px;
      cursor: pointer;
      padding: 20px;
      border-radius: 50%;
    `;

    lightbox.appendChild(img);
    lightbox.appendChild(closeBtn);

    if (frames.length > 1) {
      lightbox.appendChild(prevBtn);
      lightbox.appendChild(nextBtn);
    }

    document.body.appendChild(lightbox);
    document.body.style.overflow = "hidden";

    // Локальные обработчики закрытия/кликов.
    const closeLightbox = () => {
      lightbox.remove();
      document.body.style.overflow = "";
      lightboxOpen = false;
    };

    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeLightbox();
    });

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      currentLightboxIndex =
        (currentLightboxIndex - 1 + frames.length) % frames.length;
      img.src = frames[currentLightboxIndex];
    });

    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      currentLightboxIndex = (currentLightboxIndex + 1) % frames.length;
      img.src = frames[currentLightboxIndex];
    });

    // Клавиатурная навигация.
    const handleKeydown = (e) => {
      if (!lightboxOpen) return;

      if (e.key === "Escape") closeLightbox();

      if (e.key === "ArrowLeft") {
        currentLightboxIndex =
          (currentLightboxIndex - 1 + frames.length) % frames.length;
        img.src = frames[currentLightboxIndex];
      }

      if (e.key === "ArrowRight") {
        currentLightboxIndex = (currentLightboxIndex + 1) % frames.length;
        img.src = frames[currentLightboxIndex];
      }
    };

    document.addEventListener("keydown", handleKeydown);

    lightbox.addEventListener("remove", () => {
      document.removeEventListener("keydown", handleKeydown);
    });
  }

  // Намеренно не вешаем клик на карточки кадров:
  // по текущему требованию интерфейса кадры некликабельны.

  // ==================================================
  // СВАЙП-НАВИГАЦИЯ ДЛЯ МОБИЛЬНОЙ ГАЛЕРЕИ
  // ==================================================
  if (framesContainer) {
    let touchStartX = 0;
    let touchStartY = 0;

    const swipeThreshold = 30;

    framesContainer.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches && e.touches[0];
        if (!t) return;

        touchStartX = t.clientX;
        touchStartY = t.clientY;
      },
      { passive: true },
    );

    framesContainer.addEventListener(
      "touchend",
      (e) => {
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;

        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;

        if (Math.abs(dx) < swipeThreshold || Math.abs(dx) < Math.abs(dy)) {
          return;
        }

        if (dx < 0) {
          nextFrames();
        } else {
          prevFrames();
        }
      },
      { passive: true },
    );
  }

  // ==================================================
  // ПЕРВИЧНАЯ ИНИЦИАЛИЗАЦИЯ
  // ==================================================
  initGallery();

  // ==================================================
  // ПУБЛИЧНЫЙ ИНТЕРФЕЙС МОДУЛЯ
  // ==================================================
  window.Gallery = {
    initGallery,
    updateFrames,
    nextFrames,
    prevFrames,
  };
});
