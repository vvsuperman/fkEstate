var mongoose = require('mongoose');
var LJ_ZoneSchema = require('../schemas/LJ_Zone');
var LJ_Zone = mongoose.model('LJ_Zone', LJ_ZoneSchema);

module.exports = LJ_Zone;