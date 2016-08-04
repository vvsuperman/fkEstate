var mongoose = require('mongoose');
var MetapointSchema = require('../schemas/Metapoint');
var Metapoint = mongoose.model('Metapoint', MetapointSchema);

module.exports = Metapoint;