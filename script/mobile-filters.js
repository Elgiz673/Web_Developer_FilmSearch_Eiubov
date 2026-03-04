/*
 * Модуль синхронизации мобильных фильтров.
 *
 * По макету мобильные фильтры выглядят как статичные поля,
 * но фактически должны работать как интерактивные селекты.
 *
 * Реализация без изменения визуала:
 * - поверх визуального поля используется нативный <select> с прозрачностью;
 * - при изменении значения обновляется текст метки внутри поля.
 */

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  const isMobileMovies = path.includes("/mobile/movie_list");
  const isMobileSeries = path.includes("/mobile/series_list");

  if (!isMobileMovies && !isMobileSeries) return;

  // ====== Поиск и валидация элементов фильтров ======

  // Все наши селекты на мобильных страницах помечены data-filter-label на span,
  // который должен отображать выбранное значение.
  const selects = document.querySelectorAll("select.filter-select-overlay");
  if (!selects.length) return;

  selects.forEach((select) => {
    const wrapper = select.closest(
      ".rectangle-2, .rectangle-3, .rectangle-5, .rectangle-7, .rectangle-6, .rectangle-8",
    );
    if (!wrapper) return;
    const label = wrapper.querySelector("[data-filter-label]");
    if (!label) return;

    const initialText = label.textContent;

    const sync = () => {
      const opt = select.options[select.selectedIndex];

      // При пустом значении возвращаем исходный текст-плейсхолдер из макета.
      if (!select.value) {
        label.textContent = initialText;

        // Снимаем фокус: иначе стрелка может оставаться в состоянии "раскрыто".
        select.blur();
        return;
      }

      label.textContent = opt ? opt.text : initialText;

      // После выбора также снимаем фокус для корректного визуального состояния.
      select.blur();
    };

    select.addEventListener("change", sync);
    sync();
  });
});
