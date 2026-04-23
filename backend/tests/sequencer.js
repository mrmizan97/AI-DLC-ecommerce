const TestSequencer = require("@jest/test-sequencer").default;

const ORDER = [
  "auth.test.js",
  "user.test.js",
  "category.test.js",
  "tag.test.js",
  "product.test.js",
  "order.test.js",
  "review.test.js",
];

class CustomSequencer extends TestSequencer {
  sort(tests) {
    return tests.sort((a, b) => {
      const aIndex = ORDER.findIndex((name) => a.path.endsWith(name));
      const bIndex = ORDER.findIndex((name) => b.path.endsWith(name));
      return aIndex - bIndex;
    });
  }
}

module.exports = CustomSequencer;
