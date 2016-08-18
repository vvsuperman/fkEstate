var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ObjectId = Schema.Types.ObjectId;


var LJ_ZoneSchema = new mongoose.Schema({
	city: String ,     //城市
	district: String,  //行政区域，浦东
	name: String,      //小区名字
	x: Number,         //百度地图经度
    y: Number,	       //百度地图纬度
    cid: String,		//小区的ID
    house: [ObjectId], //关联小区内的房子
    amount: Number		//房子数量

	
});


LJ_ZoneSchema.pre('save', function(next) {
	

	// console.log("save zone...........",this.name,this.cid);

	next();
})

LJ_ZoneSchema.statics = {
	fetch: function(callback) {
		return this.find({}).sort('meta.updatedAt').exec(callback);
	},

	findById: function(id, callback) {
		return this.findOne({_id: id}).exec(callback);
	}
}

module.exports = LJ_ZoneSchema;