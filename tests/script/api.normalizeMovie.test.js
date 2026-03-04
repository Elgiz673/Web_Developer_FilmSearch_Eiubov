const vm = require("vm");
const fs = require("fs");
const path = require("path");

function loadMovieApi() {
  const code = fs.readFileSync(
    path.resolve(__dirname, "../../script/api.js"),
    "utf8",
  );
  const sandbox = {
    window: {},
    location: { hostname: "localhost", origin: "http://localhost" },
    console: { warn: jest.fn(), log: jest.fn(), error: jest.fn() },
    URL,
    URLSearchParams,
    fetch: jest.fn(),
    setTimeout,
    clearTimeout,
  };

  vm.runInNewContext(code, sandbox);
  return sandbox.window.MovieAPI;
}

describe("MovieAPI.normalizeMovie", () => {
  test("извлекает режиссёров и актёров из persons", () => {
    const api = loadMovieApi();

    const movie = {
      id: 101,
      nameRu: "Тест",
      persons: [
        { nameRu: "Иван Режиссёр", profession: "режиссеры" },
        { nameRu: "Пётр Актёр", profession: "актеры" },
      ],
    };

    const normalized = api.normalizeMovie(movie);

    expect(normalized.directors).toEqual(["Иван Режиссёр"]);
    expect(normalized.actors).toEqual(["Пётр Актёр"]);
  });

  test("дополняет режиссёров/актёров из строковых полей", () => {
    const api = loadMovieApi();

    const movie = {
      id: 202,
      nameRu: "Тест 2",
      director: "Анна Режиссёр, Иван Режиссёр",
      actors: "Мария Актриса, Пётр Актёр",
    };

    const normalized = api.normalizeMovie(movie);

    expect(normalized.directors).toEqual(["Анна Режиссёр", "Иван Режиссёр"]);
    expect(normalized.actors).toEqual(["Мария Актриса", "Пётр Актёр"]);
  });
});
