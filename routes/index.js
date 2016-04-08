var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Movie = require('../models/movie');
var underscore = require('underscore');
var request = require('request');
var User = require('../models/user');
var http = require("http");




var Cat = mongoose.model('Cat', { name: String });
//服务器mongodb端口号为12345
mongoose.connect('mongodb://localhost:12345/yoouda');


router.get('/', function(req, res) {
	res.render("index");	
});

router.get('/genFangData',function(req,res){
	
	console.log("genFangData.............");
	
	//上海所有的行政区
	var region =[{"name":"pudong","num":34},{"name":"minhang","num":14},
	,{"name":"xuhui","num":16},{"name":"putuo","num":10},{"name":"changning","num":15},
	{"name":"jingan","num":10},{"name":"huangpu","num":8},{"name":"luwan","num":7},
	{"name":"hongkou","num":14},{"name":"zhabei","num":10},{"name":"yangpu","num":14},
	{"name":"baoshan","num":9},{"name":"songjiang","num":9},{"name":"jiading","num":9},
	{"name":"qingpu","num":5}];
	
	
	var baseUrl = "http://www.anjuke.com/shanghai/cm/";
	
	var testUrl = "http://www.anjuke.com/shanghai/cm/pudong/p2/";

//  region.forEach(function(district){
//  	    //区域有分页，循环分页
//	    	for(var i =0 ;i < district.num ;i++){
//  	   	   (function(){
//              var temp = i;
//              var url = baseUrl + district.name +"/p"+temp+"/";
//              
//             	request(url, function (error, response, body) {  		
//				    if (!error && response.statusCode == 200) {
//				        console.log(body); 
//				        body.indexOf("<P3>");
//				    }
//			    });
//  	   	   })
//	    	}    	      	  
//  })

	request(testUrl, function (error, response, body) {
	    if (!error && response.statusCode == 200) {
	        var i = body.indexOf("P3");
	        var j = body.indexOf("P4");
	        var a = body.slice(i, j);
	       
//	         var reg = /[\u4E00-\u9FA5\uF900-\uFA2D]{2,10}$/g ;
             var reg = /[\u4e00-\u9fa5]{2,20}/g ;  //匹配所有的中文
             console.log(a.match(reg));
	    }
    });
    
   
    
    
	



	
//	for(key in region){
//		var num = regin[key];
//		for(var i = 0 ; i < num ; i ++){
//			var url = "http://www.anjuke.com/shanghai/cm/"+key+"/p"+i+"/";
//			request.get(url)
//				   .on('response', function(response) {
//				    
//				  })
//		}
//		
//		
//	}
	
	
	//根据行政区得到小区
	
	
})

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
