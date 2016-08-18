var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;



var LJ_ZoneHouseSchema = new mongoose.Schema({
	
	LJ_zone:{type:ObjectId, ref:'LJ_Zone'},
	xq: String,
	name: String,
	totalprice: Number, 		//总价
	area: Number,				//面积
	style: String,				//样式
	other: String,				//其他信息
    averageprice: Number,	   //平方米价格
    image: String,				//图片URL
    id: String
});


LJ_ZoneHouseSchema.pre('save', function(next) {
	

	// console.log("save zonePrice...........",this.zone);

	next();
})

LJ_ZoneHouseSchema.statics = {
	fetch: function(callback) {
		return this.find({}).sort('meta.updatedAt').exec(callback);
	},

	findById: function(id, callback) {
		return this.findOne({_id: id}).exec(callback);
	}
}

module.exports = LJ_ZoneHouseSchema;