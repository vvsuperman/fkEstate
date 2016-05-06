var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Movie = require('../models/movie');
var underscore = require('underscore');
var request = require('request');
var User = require('../models/user');
var Zone = require('../models/zone');
var http = require("http");
var ZonePrice = require('../models/zonePrice');
var unirest = require('unirest');
var httpinvoke = require('httpinvoke');
var async = require("async");

var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var pageSize = 10; //每页十条记录




var Cat = mongoose.model('Cat', { name: String });

var priceUrl ="http://sh.fangjia.com/trend/yearData?defaultCityName=上海&block=&keyword=&__ajax=1&districtName=";//=建新小区&region=杨浦

var region =[{"name":"pudong","cname":"浦东","num":34},{"name":"minhang","cname":"闵行","num":14},
	,{"name":"xuhui","cname":"徐汇","num":16},{"name":"putuo","cname":"普陀","num":10},{"name":"changning","cname":"长宁","num":15},
	{"name":"jingan","cname":"静安","num":10},{"name":"huangpu","cname":"黄浦","num":8},{"name":"luwan","cname":"卢湾","num":7},
	{"name":"hongkou","cname":"虹口","num":14},{"name":"zhabei","cname":"闸北","num":10},{"name":"yangpu","cname":"杨浦","num":14},
	{"name":"baoshan","cname":"宝山","num":9},{"name":"songjiang","cname":"松江","num":9},{"name":"jiading","cname":"嘉定","num":9},
	{"name":"qingpu","cname":"青浦","num":5}];
	
	
var BJRegion = ["chaoyang","haidian","fengtai","dongchenga","xicheng","chongwen","xuanwu",
"shijingshan","changping","tongzhou","daxing","shunyi","huairou","fangshan",
"mentougou","miyun","pinggua","yanqing","zhoubiana"]
	

var district ={"pudong":"浦东","yangpu":"杨浦","minhang":"闵行","xuhui":"徐汇",
               "putuo":"普陀", "changning":"长宁", "jingan":"静安","huangpu":"黄浦","luwan":"卢湾",
               "hongkou":"虹口","zhabei":"闸北","yangpu":"杨浦","baoshan":"宝山",
 			   "songjiang":"松江","jiading":"嘉定","qingpu":"青浦"};

//服务器mongodb端口号为12345
mongoose.connect('mongodb://localhost:12345/yoouda');


router.get('/', function(req, res) {
	res.render("index");	
});



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
		    function () { return count < 10; },
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
	  		            	  
	  		       name;     	  
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
	var i=0;
			
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



//获取所有有房价的小区
router.get('/getPricedZone',function(req,res){
	
	//返回小区名
	Zone.find({})
	    .where("priceRate").gt(0)
	    .select("name _id")
	    .exec(function(err, zones){
	    	    res.json({
				     state:0,
				     zones:zones
				        	    	
			});
	    })
})

router.get('/genFangData',function(req,res){
	
	
	
	//上海所有的行政区			
	var baseUrl = "http://www.anjuke.com/shanghai/cm/";
    region.forEach(function(district){
    	    //区域有分页，循环分页  	 
	    	for(var i =0 ;i < district.num ;i++){    	   	                                                               
             (function(pageNum, district){
             	var url =  baseUrl + district.name +"/p"+pageNum+"/"; 
             	
             	request(url, function (error, response, body) {
               		              
				    if (!error && response.statusCode == 200) {						    		
				       var zones = [];
				       zones =  getZone(body);
				       zones.forEach(function(zoneName){				       	
				       	   
				       	var zone = new Zone({
							    	city: "Shanghai",
								district: district.name,
								name: zoneName,
						        x:0,
							    y:0
						    });
					
					    zone.save(function(error,pZone){
						    	if (error) console.log(error);
						    	//根据小区名称查询价格
						  					   						    	
					    });				       	
				       });				       
				    }
			    });
             	
             })(i, district)
	   
	    	}    	      	  
    });//for each
              	
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

//生成房价的差额数据
router.get('/genPriceChange', function(req,res){

	
	Zone.find({},function(err, zones){
						
		zones.forEach(function(pZone){
         
		  ZonePrice.find({"zone":pZone}).exec(function(err,zoneprices){
		  	  var length = zoneprices.length;
		      if( length != 0){
	       	  	 //求出平均上涨率
	       	  	 var max =0;
	       	  	 var min =0;
	       	  	 //获取最大最小值
	       	  	 zoneprices.forEach(function(zoneprice){
	       	  	 	(zoneprice.price > max)?max=zoneprice.price:null;
	       	  	 	(zoneprice.price < min)?min=zoneprice.price:null;
	       	  	 	
	       	  	 });
	       	  	 
	       	  	 var priceRate = (max-min)/length;
	             //保存到zone表
	             console.log("priceRate........",priceRate);
		  	     pZone.priceRate =priceRate;
		  	     pZone.save(function(err){
		  	     	if(err!=null) consoel.log("save zone error...",err);
		  	     	console.log("update zone.........");
		  	     })
		  	     
		  	     
     		  }

		  })
				  				  					
		})// for each		
	})
})




 function getZone(body){
    	
	   	var i = body.indexOf("P3");
        var j = body.indexOf("P4");
        var a = body.slice(i, j);
       
        var reg = /[\u4e00-\u9fa5][\u4e00-\u9fa5_0-9]{2,20}/g ;  //匹配所有的中文及数字
        return a.match(reg);
    
}

router.post('/userneed/new',function(req,res){
    var _user;
    _user = new User({
    	email: req.body.email,
		domain: req.body.domain,
		level: req.body.level,
        method:req.body.method,
	    area: req.body.area
    });

    _user.save(function(error){
    	if (error) console.log(error);
    	res.json({"email":req.body.domain});

    });

  
});

router.get('/movie/:id', function(req, res, next) {
	var id = req.params.id;

	Movie.findById(id, function(error, movie) {
		res.render('detail', { 
			title: '影片详情 - ' + movie.title,
			active: '',
			movie: movie
		});
	});
});

router.get('/admin/list', function(req, res, next) {
	Movie.fetch(function(error, movies) {
		if (error) console.log(error);

		res.render('list', { 
			title: '影片列表', 
			active: 'list',
			movies: movies
		});
	});
});

router.get('/admin/movie', function(req, res, next) {
	var movie = {
		id: '',
		title: '',
		doctor: '',
		country: '',
		language: '',
		year: '',
		poster: '',
		flash: '',
		summary: ''
	};

	res.render('admin', { 
		title: '添加影片', 
		active: 'movie',
		movie: movie 
	});
});

router.get('/admin/update/:id', function(req, res) {
	var id = req.params.id;

	if (id) {
		Movie.findById(id, function(error, movie) {
			if (error) console.log(error);

			res.render('admin', {
				title: '更新影片' + movie.title,
				active: 'movie',
				movie: movie
			});
		});
	}
});

router.post('/admin/movie/new', function(req, res) {
	var id = req.body.movie._id;
	var movieObj = req.body.movie;
	var _movie;
	
	if (id !== 'undefined') {
		Movie.findById(id, function(error, movie) {
			if (error) console.log(error);

			_movie = underscore.extend(movie, movieObj);
			
			_movie.save(function(error, movie) {
				if (error) console.log(error);

				res.redirect('/movie/' + movie._id);
			});
		});
	} else {
		_movie = new Movie({
			title: movieObj.title,
			doctor: movieObj.doctor,
			country: movieObj.country,
			language: movieObj.language,
			year: movieObj.year,
			poster: movieObj.poster,
			summary: movieObj.summary,
			flash: movieObj.flash
		});
		
		_movie.save(function(error, movie) {
			if (error) console.log(error);

			res.redirect('/movie/' + movie._id);
		});
	}
});

router.delete('/admin/list', function(req, res) {
	var id = req.body.id;

	if (id) {
		Movie.remove({_id: id}, function(error, movie) {
			if (error) {
				console.log(error);
			} else {
				res.json({
					status: 0,
					message: '删除成功'
				});
			}
		});
	} else {
		res.json({
			status: 1,
			message: '无效的 id 值'
		});
	}
});

module.exports = router;
