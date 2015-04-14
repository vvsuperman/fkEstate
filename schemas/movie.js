
var mongoose = require('mongoose');
var MovieSchema = new mongoose.Schema({
	title: String,
	doctor: String,
	country: String,
	language: String,
	year: Number,
	summary: String,
	flash: String,
	poster: String,
	meta: {
		createdAt: {
			type: Date,
			default: Date.now()
		},

		updatedAt: {
			type: Date,
			default: Date.now()
		}
	}
});

MovieSchema.pre('save', function(next) {
	if (this.isNew) {
		this.meta.createdAt = this.meta.updatedAt = Date.now();
	} else {
		this.meta.updatedAt = Date.now();
	}

	next();
})

MovieSchema.statics = {
	fetch: function(callback) {
		return this.find({}).sort('meta.updatedAt').exec(callback);
	},

	findById: function(id, callback) {
		return this.findOne({_id: id}).exec(callback);
	}
}

module.exports = MovieSchema;

