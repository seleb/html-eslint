const { RuleTester: ESLintRuleTester } = require("eslint");

const FILE_NAME = "test.html";

class RuleTester extends ESLintRuleTester {
  constructor(options) {
    super(options);
  }
  run(name, rule, tests) {
    super.run(name, rule, {
      valid: tests.valid.map((test) => ({
        ...test,
        filename: FILE_NAME,
      })),
      invalid: tests.invalid.map((test) => ({
        ...test,
        filename: FILE_NAME,
      })),
    });
  }
}

module.exports = function createRuleTester(parser) {
  return new RuleTester({
    languageOptions: !parser
      ? {
          parser: require("@html-eslint/parser"),
        }
      : {
          parserOptions: {
            ecmaVersion: 2015,
          },
        },
  });
};
