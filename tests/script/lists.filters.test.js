const { applyLocalFilters } = require("../helpers/filters");

describe("lists filters (director + rating)", () => {
  const dataset = [
    {
      title: "Фильм A",
      genre: "драма",
      country: "russia",
      year: 2024,
      rating: 9.1,
      director: "Иван Петров",
    },
    {
      title: "Фильм B",
      genre: "драма",
      country: "russia",
      year: 2024,
      rating: 8.2,
      director: "Анна Сидорова",
    },
  ];

  test("комбинация рейтинг + режиссёр оставляет только подходящие карточки", () => {
    const byBaseFilters = applyLocalFilters(
      dataset,
      {
        query: "",
        genre: "",
        country: "",
        year: "",
        rating: "9",
      },
      { genreMap: { драма: "drama" } },
    );

    const byDirector = byBaseFilters.filter((item) =>
      String(item.director || "")
        .toLowerCase()
        .includes("иван"),
    );

    expect(byDirector).toHaveLength(1);
    expect(byDirector[0].title).toBe("Фильм A");
  });
});
