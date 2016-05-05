//小区价格走势
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;



var ZonePriceSchema = new mongoose.Schema({
	
	zone:{type:ObjectId, ref:'Zone'},
	time: String,      //时间
    price: Number,	   //价格
    district:String,   //区域
	
	
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


ZonePriceSchema.pre('save', function(next) {
	if (this.isNew) {
		this.meta.createdAt = this.meta.updatedAt = Date.now();
	} else {
		this.meta.updatedAt = Date.now();
	}

	console.log("save zonePrice...........");

	next();
})

ZonePriceSchema.statics = {
	fetch: function(callback) {
		return this.find({}).sort('meta.updatedAt').exec(callback);
	},

	findById: function(id, callback) {
		return this.findOne({_id: id}).exec(callback);
	}
}

module.exports = ZonePriceSchema;
