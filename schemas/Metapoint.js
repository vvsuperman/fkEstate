 //小区价格走势
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;



var MetapointSchema = new mongoose.Schema({

	name: String,      
    x: Number,	   
    y: Number,   
	
	
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


MetapointSchema.pre('save', function(next) {
	if (this.isNew) {
		this.meta.createdAt = this.meta.updatedAt = Date.now();
	} else {
		this.meta.updatedAt = Date.now();
	}

	// console.log("save zonePrice...........",this.zone);

	next();
})

MetapointSchema.statics = {
	fetch: function(callback) {
		return this.find({}).sort('meta.updatedAt').exec(callback);
	},

	findById: function(id, callback) {
		return this.findOne({_id: id}).exec(callback);
	}
}

module.exports = MetapointSchema;
