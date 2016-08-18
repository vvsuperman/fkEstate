var mongoose = require('mongoose');
var LJ_ZoneHouseSchema = require('../schemas/LJ_ZoneHouse');
var LJ_ZoneHouse = mongoose.model('LJ_ZoneHouse', LJ_ZoneHouseSchema);

module.exports = LJ_ZoneHouse;