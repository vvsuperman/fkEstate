require('mocha-as-promised')(process.argv[1].match(/mocha$/)
  ? void 0
  : require("grunt-mocha-test/node_modules/mocha"));
require('chai').use(require('chai-as-promised'));
