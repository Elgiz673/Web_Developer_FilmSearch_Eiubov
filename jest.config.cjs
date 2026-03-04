module.exports = {
  collectCoverageFrom: ["tests/helpers/**/*.js", "tests/script/**/*.test.js"],
  projects: [
    {
      displayName: "node",
      testEnvironment: "node",
      roots: ["<rootDir>/tests"],
      testMatch: ["**/*.test.js"],
      testPathIgnorePatterns: ["\\.dom\\.test\\.js$"],
    },
    {
      displayName: "dom",
      testEnvironment: "jsdom",
      roots: ["<rootDir>/tests"],
      testMatch: ["**/*.dom.test.js"],
      testEnvironmentOptions: {
        url: "http://localhost/",
      },
    },
  ],
};
