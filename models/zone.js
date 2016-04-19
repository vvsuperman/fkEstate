var mongoose = require('mongoose');
var ZoneSchema = require('../schemas/zone');
var Zone = mongoose.model('Zone', ZoneSchema);

module.exports = Zone;

