var mongoose = require('mongoose');
var ZonePriceSchema = require('../schemas/zonePrice');
var ZonePrice = mongoose.model('ZonePrice', ZonePriceSchema);

module.exports = ZonePrice;

