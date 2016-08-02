var mongoose = require('mongoose');


var ZoneSchema = new mongoose.Schema({
	city: String ,     //城市
	district: String,  //行政区域，浦东
	name: String,      //小区名字
	x: Number,         //百度地图经度
    y: Number,	       //百度地图纬度
    priceRate:Number,     //房价增加速率
    priceRateOneY:Number,  //一年上涨率
    priceRateTwoY:Number,  //两年
    priceRateThreeY:Number,//三年
    zonePrices:[],
    cid: String,
	
	
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


ZoneSchema.pre('save', function(next) {


	// this.priceRate = this.priceRateThreeY = this.priceRateTwoY = this.priceRateOneY = 0;
	if (this.isNew) {
		this.meta.createdAt = this.meta.updatedAt = Date.now();
	} else {
		this.meta.updatedAt = Date.now();
	}

	console.log("save zone...........",this.name,this.cid);

	next();
})

ZoneSchema.statics = {
	fetch: function(callback) {
		return this.find({}).sort('meta.updatedAt').exec(callback);
	},

	findById: function(id, callback) {
		return this.findOne({_id: id}).exec(callback);
	}
}

module.exports = ZoneSchema;
