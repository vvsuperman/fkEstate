//require('source-map-support').install();
module.exports = require(process.env.EGS_COV
  ? './lib-cov/egs'
  : './lib/egs');