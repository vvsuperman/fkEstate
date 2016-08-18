var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var underscore = require('underscore');
var request = require('request');
var Zone = require('../models/zone');
var MetaPoint = require('../models/Metapoint');

var http = require("http");
var ZonePrice = require('../models/zonePrice');
var unirest = require('unirest');
var httpinvoke = require('httpinvoke');
var async = require("async");
var EventEmitter = require('events').EventEmitter;

var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var pageSize = 10; //每页十条记录

var LJ_Zone = require("../models/LJ_zone");
var LJ_ZoneHouse = require("../models/LJ_ZoneHouse")

 

var Cat = mongoose.model('Cat', { name: String });

var priceUrl ="http://sh.fangjia.com/trend/yearData?defaultCityName=上海&block=&keyword=&__ajax=1&districtName=";//=建新小区&region=杨浦

var region =[{"name":"pudong","cname":"浦东","num":34},{"name":"minhang","cname":"闵行","num":14},
	{"name":"xuhui","cname":"徐汇","num":20},{"name":"putuo","cname":"普陀","num":10},{"name":"changning","cname":"长宁","num":15},
	{"name":"jingan","cname":"静安","num":10},{"name":"huangpu","cname":"黄浦","num":8},{"name":"luwan","cname":"卢湾","num":7},
	{"name":"hongkou","cname":"虹口","num":14},{"name":"zhabei","cname":"闸北","num":10},{"name":"yangpu","cname":"杨浦","num":14},
	{"name":"baoshan","cname":"宝山","num":9},{"name":"songjiang","cname":"松江","num":9},{"name":"jiading","cname":"嘉定","num":9},
	{"name":"qingpu","cname":"青浦","num":5}];

var new_region =[{"name":"pudongxinqu","cname":"浦东","num":100},{"name":"minhang","cname":"闵行","num":76},
	{"name":"xuhui","cname":"徐汇","num":100},{"name":"putuo","cname":"普陀","num":52},{"name":"changning","cname":"长宁","num":81},
	{"name":"jingan","cname":"静安","num":64},{"name":"huangpu","cname":"黄浦","num":100},{"name":"fengxian","cname":"奉贤","num":26},
	{"name":"hongkou","cname":"虹口","num":72},{"name":"zhabei","cname":"闸北","num":53},{"name":"yangpu","cname":"杨浦","num":71},
	{"name":"baoshan","cname":"宝山","num":48},{"name":"songjiang","cname":"松江","num":49},{"name":"jiading","cname":"嘉定","num":49},
	{"name":"qingpu","cname":"青浦","num":33},{"name":"jinshan","cname":"金山","num":20},{"name":"chongming","cname":"崇明","num":11}];
	
	
var BJRegion = ["chaoyang","haidian","fengtai","dongchenga","xicheng","chongwen","xuanwu",
"shijingshan","changping","tongzhou","daxing","shunyi","huairou","fangshan",
"mentougou","miyun","pinggua","yanqing","zhoubiana"]
	

var district ={"pudong":"浦东","yangpu":"杨浦","minhang":"闵行","xuhui":"徐汇",
               "putuo":"普陀", "changning":"长宁", "jingan":"静安","huangpu":"黄浦","luwan":"卢湾",
               "hongkou":"虹口","zhabei":"闸北","yangpu":"杨浦","baoshan":"宝山",
 			   "songjiang":"松江","jiading":"嘉定","qingpu":"青浦"};


 			 



//服务器mongodb端口号为12345
mongoose.connect('mongodb://localhost:27017/map');


router.get('/', function(req, res) {
	res.render("index");	

});

router.post("/search", function(req, res){
	var district = req.body.district;
	var sign = req.body.sign;
	var pricerate = req.body.pricerate
	var pricerateyear = req.body.year;
	var price = req.body.price;
	if (sign == ">"){
		Zone.find({})
			.where("district").equals(district)
			.where(pricerateyear).gt(pricerate)
			.sort(pricerateyear)
			.exec(function(err, results){	
				var rtResults=[];
				for (var i =0; i<results.length;i++){ //返回的小区数量
					var now = results[i].zonePrices.length - 1;
					if (now > 0){
						var price_now = results[i].zonePrices[now].price//现在的价格
						if (price_now > price){
							rtResults.push(results[i]);
						}
					}				
				}
				rtResults = rtResults.reverse()
				res.json({
					state: 0,
					rtResults: rtResults			
				})
			})
	}
	else {
		Zone.find({})
			.where("district").equals(district)
			.where(pricerateyear).gt(pricerate)
			.sort(pricerateyear)
			.exec(function(err, results){	
				var rtResults=[];
				for (var i =0; i<results.length;i++){ //返回的小区数量
					var now = results[i].zonePrices.length - 1;					
					if (now > 0){
						var price_now = results[i].zonePrices[now].price//现在的价格
						if (price_now < price){
							rtResults.push(results[i]);
						}
					}				
				}
				rtResults = rtResults.reverse()
				res.json({
					state: 0,
					rtResults: rtResults			
				})
			})
	}
	
})


function saveBJZone(name,id,district){
	
	 	var priceUrl = "http://beijing.anjuke.com/ajax/pricetrend/comm?cid=";
       	var zone = new Zone({
			    	city: "Beijing",
				district: district,
				name: name,
		        x:0,
			    y:0
		    });
		    
	    //保存小区
	    zone.save(function(error,pZone){
		    	if (error) console.log(error);
		    	 console.log("save zone success.......",pZone.name); 
		    	  //生成小区房价
		    	  request(priceUrl+id,function(err,response,body){
			        
			     if (!err && response.statusCode == 200) {
			     	
			        var body =  eval ("(" + body + ")");
			        console.log("get price success.......",body,"..........",body["comm"]);
			          	var comms = body["comm"];			          	
			          	comms.forEach(function(comm){			          		
			          		for(var i in comm){
			          		
			          		    //生成价格
				    	          	var zonePrice = new ZonePrice({
									zone: pZone._id,
									time: i,
									price: comm[i],
									district:"Beijing"
		
								});
		
								zonePrice.save(function(error, pZonePrice) {
									if (error) console.log(error);		
								});			          			
			          		}	     		
			          	})			          				          	
			          }
	       })  					   							    	
	    });		
}


//对北京的房价进行处理
function praseBody(body, district,url){
	
	 if(typeof(body) == undefined) return false;
	
	 body=body.replace(/[\r\n]/g,"");
	
	 var reg =/xqlb(.+?)title/g;
	 var chReg = /[\u4e00-\u9fa5][\u4e00-\u9fa5_0-9_/+]{2,20}/ ;
	 var numReg = /[0-9]{5,}/  ;
	 var zones = body.match(reg);
	 
	 if(zones!=null && zones.length != 0){
	 	zones.forEach(function(zone){
	 			 		
	 		var name = zone.match(chReg);   //小区名称
	 		var AJKId = zone.match(numReg);  //小区在安居客的id
            if(name!=null){
            	   console.log("name.......",name[0], AJKId[0]);
          	   saveBJZone(name[0], AJKId[0],district)
            }
	 		
	 	})
	 }else{
	 	console.log("not matched",url);
	 }
}


//生成北京的小区以及房价
router.get("/genBJFangData",function(req,res){
	
	var url = "http://beijing.anjuke.com/community/";
	var testUrl ="http://beijing.anjuke.com/community/chaoyang/p100/";
	
//	request(testUrl,function(err,response,body){
//        if (!err && response.statusCode == 200) {
//        	 praseBody(body,'chaoyang');
//        	 
//        }
//	})
	
//	BJRegion.forEach(function(region){
        
        //不可用for，异步并发太多会被anjuke所屏蔽， 用async模块，并模拟随机事件
		var createZones = function(region, count){
			
			 	 console.log("create zones...............",region, count);
				 var rurl =  url+region+"p"+count;
				 request(rurl,function(err,response,body){
			            console.log("request url...............",rurl);
//						var zones = praseBody(body,region,rurl);
				 });
		}
		
//		var foo ＝ function(){
//			
//			console.log("I am do nothing");
//			
//		}

    async.forEachSeries(BJRegion,function (region, key, callback){
    	  
    	    var count = 0;

 	    console.log("region.....",region);

		async.whilst(
		    function () { return count < 100; },
		    function (cb) {
		        count++;
		        createZones(region,count);
		        console.log("count",count);
                setTimeout(cb,500);
		    }
		    ,
		    function (err, count) {
		    	
		        console.log("err...........",err,count);
		        
		        
		    }
		); //whilst
    	
     });//for eachof
		

			
	res.json({state:0});
})

//根据小区id获取zoneprices
router.post("/getPrices",function(req,res){
	
	var id = req.body.id;
	var name = req.body.name;
	
	console.log("getprices...........",id);
	
	 ZonePrice.find({"zone":id})
	 		  .sort({"time":1})
	 		  .exec(function(err, zoneprices){	  		            	  
  	  			   res.json({
						     state:0,
						     name:name,
						     zoneprices:zoneprices		        	    	
		        	    });
					  	  		
	})
})






//根据屏幕区域获取所有小区
router.post('/getMapZones',function(req,res){
	
	console.log("/getMapZones........");
	
	var leftX = req.body.leftX;
	var leftY = req.body.leftY;
	var rightX = req.body.rightX;
	var rightY = req.body.rightY;
	
	console.log("/getMapZones........",rightX,leftY,rightX,rightY);
	
	Zone.find({})
		.select("name x y priceRate")
	    .where("x").gt(rightX).lt(leftX)
	    .where("y").gt(rightY).lt(leftY)
	    .exec(function(err,zones){
	    	   if(err !=null) console.log("find zone err",err);
	    	    
	    	   res.json({
             	   	  "state":0, 
             	   	  "zones":zones 
             	   })
	    	   
	    })
	
})


router.get('/modifyXy',function(req,res){
	
	var i=0;
	Zone.find({}).exec( 
         function(err,zones){  
         	zones.forEach(function(zone){
         		console.log(zone.name,i++);
                zone.x = parseFloat(zone.x);
                zone.y = parseFloat(zone.y);
                zone.save(function(err, zones){
               	
             	   if (err!=null) console.log("save error",err);
             	  
                })
         		
         	})
             
         }  
   );
   
   res.json({state:0});
});


//根据房价增长率倒序排列小区名
router.post('/getZoneByPrice',function(req,res){
	//分页的起始页
	
	console.log("getzone by price");
	var pageNum = req.body.pageNum;
	
	//按照pricerate的倒序排列	
	Zone.find({})
	    .where("priceRate").gt(0)
	    .sort({"priceRate":-1})
	    .skip((pageNum-1)*pageSize)
	    .limit(pageSize)
	    .exec(function(err,zones){
	    	  
	    	   var length= zones.length;
	    	   var zoneNum =0;
	    	   if(err!=null) console.log(err);
	    	   //获取每一个小区的房价,并倒序排列
	    	   
	    	   for(var i=0;i<length;i++){
	    	   	  (function(i){
	    	   	  	
	    	   	  	 ZonePrice.find({"zone":zones[i]},function(err, zoneprices){	  		      
	  		            zones[i].zonePrices = zoneprices;	  		         	         	
	  		         	//获取全部数据了才能返回
			  		    if(++zoneNum == length){			  			  
		  	  			   res.json({
								     state:0,
								     zones:zones
				        	    	
				        	    });
					  	}		  		
		  		})
	    	   	  })(i)	    	   	      	    	   	
	    	   }	 
        })	
})

//上传小区的x,y数据

router.post('/saveXy',function(req,res){
	console.log('savexy');
	var zone = req.body.zone;
			
//	zones.forEach(function(zone){		
		Zone.findById(zone._id,function(err,pzone){  
			 if(err!=null) console.log("save zone error...",err);				 
			   pzone.x = zone.x;
		       pzone.y = zone.y;
		       pzone.save(function(err, ppzone){
		       	
			  		if(err!=null) consoel.log("save zone error...",err);
			  		console.log("update zones.........x:",ppzone.x);
			  		res.json({
			  			state:0,
			  			zoneX:ppzone.x
			  		})
			  		
		  	})
			
		})
		
//	})
	
})
router.post('/savesub', function(req, res){
	// console.log(req)
	var zone1 = req.body.zone;
	var subwayName = zone1.subwayName
	MetaPoint.find({'name':subwayName}, function (err, metapoints){ //找数据库里面有没有这个名字	
		// console.log(subwayName)
		// console.log(metapoints)
		// console.log(metapoints.name)	
		if (metapoints.length == 0){ //如果数组为空，建立新数组
			// console.log("wsooooooo?")
			var metapoint = new MetaPoint ({
		  		name: subwayName,
		  		x: zone1.x,
		  		y: zone1.y
	  		})
	  		// console.log(zone1._id)
	  		metapoint.save(function(err, pmetapoint){ //保存地铁信息
	  			if (err){
	  				console.log(err)
	  			}
	  			Zone.findById(zone1._id, function(err, pzone){
	  				if (err){
	  					console.log(err)
	  				}
	  				pzone.subway.push(pmetapoint)
	  				pzone.save(function(err){
	  					if (err){
	  						console.log(err)
	  					}
	  					res.json({
	  						state: 0
	  					})
	  				})
	  			})
	  		})
	  		// metapoint.save(function(err,pmetapoint){
	  		// 	if (err){
	  		// 		console.log(err)
	  		// 	}
	  		// 	Zone.findById(zone1._id, function(err,pzone){
	  		// 		if (err) {
	  		// 			console.log(err)
	  		// 		}
	  		// 		pzone.subway.push(pmetapoint);
	  				
	  		// 		pzone.save(err, function(err){
	  		// 			if (err){
	  		// 				console.log(err)
	  		// 			}
	  		// 			res.json({
			  // 				state:0
			  // 			})
	  		// 		});
	  		// 	})	
	  		// })
		}
		else {
			res.json({
				state: 1
			})
				
		}
		  	
	})
})



//获取所有有房价的小区
router.get('/getPricedZone',function(req,res){
	//返回小区名
	// var x1 = 0;
	// var x2 = 2000;
		// Zone.find({ field: { $gt: x1, $lt: x2 } }) //在数据库里找到pricerate大于0的
		Zone.find({})
			 .where("priceRate").gt(0)
			 // .select("name _id x y") //选择其中的name，_id
			 .limit(3000)
			 .skip(11300)
			 .exec(function(err,zones){
			 	// console.log('zone_length........',zones.length);
		    		res.json({  //返回了data
					   state:0,
					   zones:zones		        	    	
					});

		})
		// console.log("are u here?") //上面是异步请求，所以这个先触发

	
	
})




var getPriceAndSave = function(pZone) {
	
	    var pUrl = encodeURI(priceUrl + pZone.name + "&region=" + district[pZone.district]);
												
		//request库得不到数据， http库直接报错，初步判断原因是header头不规范。需要将url中的中文进行转义，转义完毕后才可以访问。
		httpinvoke(pUrl, 'GET', function(err, body, statusCode, headers) {

				if (err) {
					return console.log('Failure', err);
				}				
				//body也不规范，需要先转化好	    
				var series = (JSON.parse(body)).series;				
				//如果小区有房价
				if (series.length != 0) {

					var prices = series[0].data;

					for (i in prices) {
						
						var zonePrice = new ZonePrice({
							zone: pZone._id,
							time: prices[i][0],
							price: prices[i][1]

						});

						zonePrice.save(function(error, pZonePrice) {
							if (error) console.log(error);
							
						});

					}
				}
		}) //http invoke
		
} //getpriceandsave

//生成房价的基础数据
router.get('/genFangPrice',function(req,res){
			
	Zone.find({},function(err, zones){
						
		zones.forEach(function(pZone){
			  		
		   getPriceAndSave(pZone);
				  				  					
		})// for each
		

	})
	
})






function toDecimal(x) { 
      var f = parseFloat(x); 
      if (isNaN(f)) { 
        return; 
      } 
      f = Math.round(x*100)/100; 
      return f; 
    } 
//生成房价的差额数据
router.get('/genPriceChange', function(req,res){
	
	Zone.find({},function(err, zones){
						
		zones.forEach(function(pZone){
         
		  	ZonePrice.find({"zone":pZone}).exec(function(err,zoneprices){
		  	  	var length = zoneprices.length;
	  	  		if (length != 0) {
		  	  		var p_now = parseInt(zoneprices[length-1].price);

		  	  		if (p_now != 0){
		  	  			var p_threeM = parseInt(zoneprices[length-3].price);
			  	  		var p_oneY = parseInt(zoneprices[length-12].price);
			  	  		var p_threeY = (length < 36)?0:parseInt(zoneprices[length-36].price);
			  	  		var p_twoY = (length < 24)?0:parseInt(zoneprices[length-24].price);

			  	  		if (p_oneY == 0){
			  	  			var priceRate = toDecimal((p_now-p_threeM)/p_threeM);
			  	  			pZone.priceRate = priceRate;
			  	  			pZone.priceRateOneY = pZone.priceRateTwoY = pZone.priceRateThreeY = 0;
			  	  		}
			  	  		else if(p_twoY == 0){
			  	  			var priceRate = toDecimal((p_now-p_oneY)/p_oneY);
			  	  			pZone.priceRate = priceRate;
			  	  			pZone.priceRateOneY = toDecimal((p_now - p_oneY)/p_oneY);
			  	  			pZone.priceRateTwoY= pZone.priceRateThreeY = 0;
			  	  		}
			  	  		else if(p_threeY ==0){
			  	  			var priceRate = toDecimal(((p_now-p_oneY)/p_oneY + (p_oneY-p_twoY)/p_twoY) /2);
			  	  			pZone.priceRate = priceRate;	
			  	  			pZone.priceRateOneY = toDecimal((p_now - p_oneY)/p_oneY);
				  	  		pZone.priceRateTwoY = toDecimal((p_now - p_twoY)/p_twoY);
			  	  			pZone.priceRateThreeY=0
			  	  		}
			  	  		else{
							var priceRate = toDecimal(((p_now-p_oneY)/p_oneY + (p_oneY-p_twoY)/p_twoY + (p_twoY-p_threeY)/p_threeY)/3);
			  	  			pZone.priceRate = priceRate;
			  	  			pZone.priceRateOneY = toDecimal((p_now - p_oneY)/p_oneY);
				  	  		pZone.priceRateTwoY = toDecimal((p_now - p_twoY)/p_twoY);
				  	  		pZone.priceRateThreeY = toDecimal((p_now - p_threeY)/p_threeY);

			  	  		}	
			  	  		// console.log('pZone.........',pZone); 		
			  	  		pZone.save(function(err){
			  	  			if (err){
			  	  				console.log("errrrrrrr......", err);
			  	  			}
			  	  			console.log("update zone.........");
			  	  		});
		  	  		};
	  	  		};
     		});				  				  					
		})	
	})
	res.json({  //返回了data
		state: 0 	    	
	});
})

// 尝试一个新的爬虫方式
router.get('/fang', function(req, res){


	// //先把网页上所有的小区名称拉下来
	var baseUrl = 'http://www.anjuke.com/shanghai/cm/';
	var region_len = region.length;
	var x = 0;
	async.whilst(
		function (){
			return x < region_len;
		},
		function (region_cb){
			var district_name = region[x].name;
			var district_cname = region[x].cname;
			var pagelimit = region[x].num;	
			var district_URL = baseUrl + district_name + "/"
			var pageNum = 1;

			async.whilst(
				function (){
					return pageNum < pagelimit;
				},
				function (page_cb){ //获取每页上的小区＋cid
					var page_URL = district_URL + "p" + pageNum + "/";
					request(page_URL, function (error, response, body){
						if (!error && response.statusCode == 200){
							var zones = getZone(body);
							if (zones[0] !== null || zones[0] !== undefined){
								var xq = 0;

								async.whilst(
								   	function () {
								   		console.log("pageNum........",pageNum)
								   		console.log('xq............',xq);
								   		return xq < zones[0].length;
								   	},
								   	function (xqcallback) {
							   		   var cid = zones[1][xq];
							       		var name = zones[0][xq];

							       		Zone.find({'cid':cid},function(error, pZone){
							       			

							       			if(pZone.length != 0 ){
							       				xq++;
													console.log("repeated.........");
													xqcallback();
							       			}
					      					
					      					else{

													var zone = new Zone ({
									       			city: "shanghai",
									       			name: name,
									       			cid: cid,
									       			district: district_cname,
									       			x: 0,
									       			y: 0
								       			});
								       			zone.save(function(error, pZone){ //保存zones
									       			(function(pZone){
									       				var pricebaseUrl = "http://shanghai.anjuke.com/ajax/pricetrend/comm?cid=";
															var tempUrl = pricebaseUrl+pZone.get('cid');
															request(tempUrl, function(error, response, body){
																if (!error && response.statusCode == 200) {
																	var body =  eval ("(" + body + ")");
																	var comms = body["comm"]

																	async.eachSeries(comms,function(comm, commcallback){
																			for (var t in comm){
																				var zoneprice = new ZonePrice({
																					zone: pZone._id,
																					time: t,
																					price: comm[t]
																				});
																			};
																			zoneprice.save(function(error, pZonePrice){
																				pZone.zonePrices.push(pZonePrice);
																				pZone.save(function(err){
																					if (err){
																						console.log(err)
																					}
																				})

																			})
																			commcallback();
																		},
																		function (error) {
																			//xq++;
																			xq++;
														       				xqcallback();
																		}
																	)																
																}					    		
															})
									       			})(pZone);
													});	
					      					}		       						       			
							       		})				
								   	},
								   	function (err) {
								   		pageNum++;
								   		//pagecallback();
								   		page_cb();
								   	}
								);

							}
							else{
								pageNum++;
								page_cb();
							}
							
						}
					})
				}
			)
		x++;
		region_cb()			
		},
		function (err){
			
			console.log(err)
		}
	)
	// var pageNum = 1; // max 198 pages
	// async.whilst(
	// 	function () {
	// 		console.log('pageNum............',pageNum);
	// 		return pageNum < 35;
	// 	},
	// 	function (pagecallback) { //获取每个网页上的小区名称＋cid
	// 		var url = baseUrl + "p" + pageNum + "/";
	// 		request(url, function (error, response, body) {   		              
	// 		   if (!error && response.statusCode == 200) {						    		
	// 		      var zones = getZone(body)
	// 		      var xq = 0;

	// 		   
			  
	// 		    };
	// 		});    
			
	// 	},
	// 	function (error){
	// 		console.log("Page Return Completed!")
	// 	}
	// );
});        


router.get('/fangprice', function(req, res){
	// //先把网页上所有的小区名称拉下来
	var baseUrl = "http://sh.lianjia.com/xiaoqu" ;
	var xq_page = 1;
	var district_page = 0;
	async.whilst(
		function (){
			return district_page < new_region.length;
		},
		function (district_cb){ //行政区循环
			async.whilst(
				function (){
					// console.log(new_region[district_page].num)
					return xq_page < new_region[district_page]&&new_region[district_page].num;
				},
				function(page_cb){ //每个行政区有xq-page页小区
					var page_URL = baseUrl + "/" + new_region[district_page].name + "/d" + xq_page;		
					request(page_URL, function(error, response, body){	
						console.log("小区分页。。。。",page_URL)

						var num = 0;
						var info = getXQID(body)//拿到小区ID列表，我需要知道我下面需要循坏多少次
					
						async.whilst(
							function (){
								return num < info.length;
							},
							function (xq_cb){ //循环INFO.length次，因为每页上有这么多个小区
								var xq_URL = baseUrl + "/" + info[num] + ".html"
								request(xq_URL, function(error, response, body){
									console.log("小区的网址......", xq_URL, new_region[district_page].cname)
									var xq_info = getXQINFO(body)//这里拿到了小区的名称和坐标
									// console.log(xq_info)
									var xq_amount = getXQAMOUNT(body) //在这里拿到小区里面有多少套房子，下面要做循环

									LJ_Zone.find({"cid":info[num]}, function(error, pZone){
										if(pZone.length != 0 ){
											console.log("repeated.........");
											list_pos++;
											xq_cb()
						       			}
						       			else{
						       				var lj_zone = new LJ_Zone ({
												city: "shanghai",
												district: new_region[district_page].name,
												name: xq_info[1],
												cid: info[num],
												x: xq_info[0][0],
												y: xq_info[0][1],
												amount: xq_amount
											});
											// console.log(lj_zone)
											lj_zone.save(function(err, pZone){
												if (err){console.log("errrrrr......",err)}
												var base_house_URL = "sh.lianjia.com/ershoufang/"
												var house_page = 1;
												var max_house_page = Math.ceil(pZone.amount/20); //分页
												async.whilst(
													function (){
														return house_page < max_house_page;
													},
													function (house_cb){
														var houseURL = "http://"+ base_house_URL + "d" + house_page + "q" + pZone.cid;

														request(houseURL, function(error, response, body){ //进到了小区里面，查看所有房子
															console.log("house URL......", houseURL)

															var houseINFO = getHouseINFO(body);
															console.log(houseINFO)

															// console.log(houseINFO)
															for (var x=0;x<houseINFO[0].length;x++){
																var lj_zonehouse = new LJ_ZoneHouse ({
																	LJ_zone: pZone._id,
																	xq: pZone.name,
																	name: houseINFO[0][x],
																	totalprice: houseINFO[1][x],
																	area: houseINFO[2][x][1],
																	style: houseINFO[2][x][0],
																	other: houseINFO[3][x],
																	averageprice: houseINFO[4][x],
																	image: houseINFO[5][x],
																	id: houseINFO[6][x]
																})
																console.log(lj_zonehouse)
																lj_zonehouse.save(function(err, phousezone){
																	pZone.house.push(phousezone);
																	pZone.save(function(err){
																		house_page++;
																		house_cb();
																	})
																})
															}


														})
													},
													function (err){
														num++;
														xq_cb();
														
													}
												)

											})
						       			}
									})
									
								})


							},
							function (err){
								xq_page++;
								page_cb()
								
							}
						)
					});

				},
				function(err){
					district_page++;
					district_cb();
					
				}
			)

		},
		function(err){
			

		}
	)
	
		
		
	
}); 

function getHouseINFO(body){ //拿到房子ID，总房价，房子样式，平米价，房子名称, 图片url, 房子面积，房子其他信息
	var	 a = body.replace(/[\r\n]/g,"");

	var reg_imgURL = /data-original=..{100}/g
	var IMG_URL = body.match(reg_imgURL) //list of IMG URL
	var house_IMGURL = [];
	for (var x = 0; x< IMG_URL.length;x++){
		var url = IMG_URL[x].slice(15)
		house_IMGURL.push(url)
	}
	
	var reg_houseID = /key=.{10}/g; 
	var house_ID =[];
	var houseID = body.match(reg_houseID); //list of house ID
	for (var x=0;x<houseID.length;x++){
		var id = houseID[x].slice(7)
		house_ID.push(id)
	}
	
	var reg_houseTPRICE = /class="num".[0-9]{1,4}/g
	var L_houseTPRICE = body.match(reg_houseTPRICE)
	var houseTPRICE = []; //房价总价列表
	for (var x = 0; x<L_houseTPRICE.length;){
		var num = L_houseTPRICE[x].slice(12)
		houseTPRICE.push(num);
		x = x +2;
	}
	var reg_houseSTYLE = /class="con"..{600}/g
	var reg_chinese =  /[\u4e00-\u9fa5_0-9_][^\s*|]{1,6}/g

	var b = a.match(reg_houseSTYLE)
	var houseOTHER=[]
	for (var x =0; x<b.length; x++){
		var c = b[x].match(reg_chinese)
		c = c.slice(2,4)
		houseOTHER.push(c)//房子其他信息
	}
	
	var reg_AVGPRICE = /price-pre..[0-9]{2,10}/g
	var avgprice = body.match(reg_AVGPRICE)
	var house_AVGPRICE = [];
	for (var x =0; x<avgprice.length;x++){
		var price = avgprice[x].slice(11)
		house_AVGPRICE.push(price) //平米价格

	}

	var reg_areaSTYLE = /class="laisuzhou"..{500}/g 
	var boom = a.match(reg_areaSTYLE)
	var houseAREASTYLE= [];
	for (var x=0;x<boom.length;x++){
		var style_pos = boom[x].indexOf("室")
		var style = boom[x].slice(style_pos-1,style_pos+3)
		var sth = [];
		var area_pos = boom[x].indexOf("平")
		var area_str = boom[x].slice(area_pos-6,area_pos)
		var area_reg = /[0-9]{1,4}.[0-9]/g
		var area = area_str.match(area_reg) 
		// console.log("hihihihihihih, my area!", area)
		sth.push(style, area[0])
		// console.log("come, sth", sth)
		
		houseAREASTYLE.push(sth); //房间面积，和样式
	}

	var reg_title = /class="lj-lazy".alt="..{5,20}[\u4e00-\u9fa5_0-9_][^\s*|]{2,20}/g
	var title = body.match(reg_title)
	var houseTITLE=[];
	for (var x=0;x<title.length;x++){
		var name = title[x].slice(21)
		houseTITLE.push(name) //所有房子名称拿下
	}
	var data = [houseTITLE, houseTPRICE, houseAREASTYLE, houseOTHER, house_AVGPRICE, house_IMGURL, house_ID];
	return data;
}

function getXQAMOUNT(body){
	var reg_amount = /在售二手房..[0-9]{0,3}/g;
	var a = body.match(reg_amount);
	var amount = a[0].slice(6);
	return amount;
}

function getXQINFO(body){
	var reg_name = /<h1>..{2,20}[\u4e00-\u9fa5_0-9_][^\s*|]/g
	var a = body.match(reg_name)
	name = a[0].slice(4,-5)

	var reg_XY = /xiaoqu=..{50}/g
	
	var b = body.match(reg_XY)
	b = b[0].slice(9)
	var comma1 = b.indexOf(",")
	var y = b.slice(0,comma1)
	b = b.slice(comma1+2)
	var comma2 = b.indexOf(",")
	var x = b.slice(0,comma2)
	var pos = [x, y]
	var data = [pos, name]
	return data;

}

function getXQID(body){
    // var	 come_id=body.replace(/[\r\n]/g,"");
	// var i = come_id.indexOf("con-box")
	// var j = come_id.indexOf("page-box house-lst-page-box")
	// come_id = come_id.slice(i,j)
  
    // console.log(body);
	var reg_id = /key=.{14}/g
	var id_isthatyou = body.match(reg_id)
	// console.log(id_isthatyou.length)
	var data = [];
	for (var x =0; x<id_isthatyou.length;){
		var id = id_isthatyou[x].slice(5)
		data.push(id)
		x = x+2;
	}
	return data;
}



 function getZone(body){
    	
	   	var i = body.indexOf("P3");
        var j = body.indexOf("P4");
        var a = body.slice(i, j);
        
        //var reg1 = /[\u4e00-\u9fa5]{2,20}\(.*\)/g ;  //匹配所有的中文及数字
        var reg1 = /[u4e00-u9fa5]{2,20}/g ;
        var arrName = a.match(reg1)
       
        for (item in arrName){
          arrName[item] =arrName[item].replace("</a></em>","")
          arrName[item] =arrName[item].replace("</a></e","")
        }

        var reg2 = /[0-9]{1,20}/g;
  		var arrCid = a.match(reg2)
  		
  		if (arrCid != null){
  			arrCid = arrCid.slice(1)
  		}

  		var data = [arrName, arrCid];
        return (data)
        //return a.match(reg1);

    
}



module.exports = router;
