const fs = require("fs");
const path = require("path");
const userEvent = require("@testing-library/user-event").default;

describe("main.js search form user-events", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="search-form">
        <input id="search-query" type="text" />
        <button type="submit">Найти</button>
      </form>
      <input id="theme-checkbox" type="checkbox" />
      <span class="theme-label"></span>
    `;

    window.AppUtils = {
      isMobilePath: jest.fn(() => false),
      safeStorageGet: jest.fn(() => "light"),
      safeStorageSet: jest.fn(() => true),
      logError: jest.fn(),
    };

    window.history.pushState({}, "", "/index.html");

    const code = fs.readFileSync(
      path.resolve(__dirname, "../../script/main.js"),
      "utf8",
    );
    // eslint-disable-next-line no-eval
    eval(code);
    document.dispatchEvent(new Event("DOMContentLoaded"));
  });

  test("hover через user-event добавляет и убирает класс hovered у кнопки поиска", async () => {
    const user = userEvent.setup();
    const button = document.querySelector("button[type='submit']");

    expect(button.classList.contains("hovered")).toBe(false);

    await user.hover(button);
    expect(button.classList.contains("hovered")).toBe(true);

    await user.unhover(button);
    expect(button.classList.contains("hovered")).toBe(false);
  });

  test("submit с пустым вводом не запускает навигацию и не логирует ошибку", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const initialHref = window.location.href;

    await user.click(document.querySelector("button[type='submit']"));

    expect(window.location.href).toBe(initialHref);
    expect(window.AppUtils.logError).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
