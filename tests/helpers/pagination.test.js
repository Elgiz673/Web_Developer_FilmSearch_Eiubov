const { getPaginationState } = require("./pagination");

describe("getPaginationState", () => {
  test("корректно рассчитывает первую страницу", () => {
    const state = getPaginationState(1, 50, 9);

    expect(state.currentPage).toBe(1);
    expect(state.totalPages).toBe(6);
    expect(state.hasPrev).toBe(false);
    expect(state.hasNext).toBe(true);
  });

  test("ограничивает currentPage верхней границей", () => {
    const state = getPaginationState(999, 10, 9);

    expect(state.currentPage).toBe(2);
    expect(state.totalPages).toBe(2);
    expect(state.hasPrev).toBe(true);
    expect(state.hasNext).toBe(false);
  });
});
