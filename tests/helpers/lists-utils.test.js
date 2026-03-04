const { normalizePagesCount } = require("./lists-utils");

describe("normalizePagesCount", () => {
  test("возвращает целое количество страниц для валидного числа", () => {
    expect(normalizePagesCount(4.8, 1)).toBe(4);
  });

  test("возвращает fallback при невалидном количестве", () => {
    expect(normalizePagesCount("bad", 3)).toBe(3);
    expect(normalizePagesCount(0, 2)).toBe(2);
  });

  test("минимум одна страница", () => {
    expect(normalizePagesCount(-10, 0)).toBe(1);
  });
});
