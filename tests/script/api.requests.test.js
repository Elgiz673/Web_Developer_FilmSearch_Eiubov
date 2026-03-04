const vm = require("vm");
const fs = require("fs");
const path = require("path");

function loadMovieApi(fetchMock) {
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
    fetch: fetchMock,
    setTimeout,
    clearTimeout,
  };

  vm.runInNewContext(code, sandbox);
  return sandbox.window.MovieAPI;
}

describe("MovieAPI requests: GET and POST", () => {
  test("GET: getMovieById вызывает fetch с методом GET", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: 42, nameRu: "Тест" }),
    });

    const api = loadMovieApi(fetchMock);
    await api.getMovieById(42);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe("GET");
  });

  test("POST: postJson отправляет JSON-body и метод POST", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    });

    const api = loadMovieApi(fetchMock);
    const payload = { query: "matrix", page: 1 };

    await api.postJson("/v1.4/movie/search", payload);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/v1.4/movie/search");
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.body).toBe(JSON.stringify(payload));
  });
});
