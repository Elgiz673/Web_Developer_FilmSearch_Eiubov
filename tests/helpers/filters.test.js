const { applyLocalFilters, normalizeGenreKey } = require("./filters");

describe("normalizeGenreKey", () => {
  test("мапит значение через genreMap", () => {
    expect(normalizeGenreKey("драма", { драма: "drama" })).toBe("drama");
  });

  test("возвращает нормализованное исходное значение, если мапа пуста", () => {
    expect(normalizeGenreKey("Fantasy")).toBe("fantasy");
  });
});

describe("applyLocalFilters", () => {
  const dataset = [
    {
      title: "Фильм A",
      genre: "драма",
      country: "russia",
      year: 2024,
      rating: 9.1,
    },
    {
      title: "Фильм B",
      genre: "комедия",
      country: "usa",
      year: 2023,
      rating: 7.8,
    },
    {
      title: "Фильм C",
      genre: "драма",
      country: "russia",
      year: 2022,
      rating: 8.5,
    },
  ];

  test("фильтрует и сортирует по рейтингу", () => {
    const result = applyLocalFilters(
      dataset,
      {
        query: "фильм",
        genre: "drama",
        country: "russia",
        year: "",
        rating: "8",
      },
      { genreMap: { драма: "drama" } },
    );

    expect(result).toHaveLength(2);
    expect(result[0].rating).toBeGreaterThanOrEqual(result[1].rating);
    expect(result[0].title).toBe("Фильм A");
  });
});
