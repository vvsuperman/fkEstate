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
	
	
var district ={"pudong":"浦东","yangpu":"杨浦","minhang":"闵行","xuhui":"徐汇",
               "putuo":"普陀", "changning":"长宁", "jingan":"静安","huangpu":"黄浦","luwan":"卢湾",
               "hongkou":"虹口","zhabei":"闸北","yangpu":"杨浦","baoshan":"宝山",
 			   "songjiang":"松江","jiading":"嘉定","qingpu":"青浦"};

//服务器mongodb端口号为12345
mongoose.connect('mongodb://localhost:12345/yoouda');


router.get('/', function(req, res) {
	res.render("index");	
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
