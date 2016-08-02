


var hotdistrict = ["徐汇","静安","浦东新区","杨浦","闵行","普陀区","长宁","黄浦","卢湾","虹口","闸北","宝山","松江","嘉定","青浦"]
var num = [1499, 965, 2990, 1347, 1298, 894, 1347, 750, 641, 1333, 956, 824, 809, 816, 409]


map = new BMap.Map("container");          // 创建地图实例  
// 初始化地图，设置中心点坐标和地图级别  
map.addControl(new BMap.NavigationControl());    
map.addControl(new BMap.ScaleControl());    
map.addControl(new BMap.OverviewMapControl());    
map.addControl(new BMap.MapTypeControl());    
map.centerAndZoom("上海",11); 


var allOverlays = []; //储存所有的图层

 map.addEventListener('load', function () {

    
     var bs = map.getBounds();   //获取可视区域
	 var sw = bs.getSouthWest();   //可视区域左下角
	 var ne = bs.getNorthEast();   //可视区域右上角
		 		 
	 console.log("ne",ne.lng, ne.lat);
     console.log("sw",  sw.lng, sw.lat); 


     // getMapZones(ne,sw);

});


map.addEventListener("dragend", function(){    
 var center = map.getCenter();    
 console.log("地图中心点变更为：" + center.lng + ", " + center.lat);    

 
     var bs = map.getBounds();   //获取可视区域
	 var sw = bs.getSouthWest();   //可视区域左下角
	 var ne = bs.getNorthEast();   //可视区域右上角
	var level = this.getZoom();

	console.log("ne",ne.lng, ne.lat);
	console.log("sw",  sw.lng, sw.lat);  
	removeLabels(ne, sw);
	getNewMap(ne,sw,level);

	 // getMapZones(ne,sw);
});

map.addEventListener("zoomend", function(){  //放大缩小地图
	var level = this.getZoom();
 	// alert("地图缩放至：" + level + "级");  
    var bs = map.getBounds();   //获取可视区域
	var sw = bs.getSouthWest();   //可视区域左下角
	var ne = bs.getNorthEast();   //可视区域右上角  

	removeLabels(ne, sw);
	// getMapZones(ne, sw);
	getNewMap(ne,sw,level);
})


// $("#genBJZone").click(function(){
// 	$.get("genBJFangData");
// })

function getNewMap(ne,sw,level){
	if (level < 16 ){
		removeLabels()
		makeDistrictLabel(hotdistrict);

		// alert("展示上海行政区及其平均房价")
	}
	else if (level > 15){
		// getHotXq(ne, sw);
		removeLabels()
		getMapZones(ne, sw);
		// alert("展示PriceRate最高的小区及其平均房价")
	}
}

//划区
function makeDistrictLabel(list){
	var myGeo = new BMap.Geocoder();      
	var x = 0; 	
 	
 	async.whilst(
 		function (){
 			return x < list.length;
 		},
 		function (callback){
 			//在行政区上做标记
 			myGeo.getPoint(list[x], function(point){    
 				var txt = list[x]; 
 				var count = num[x]
 				var mouseoverTxt = txt + " " + count + "套" ; 
 				
 				Complexlabel(point, list[x], mouseoverTxt)
    			x++;
    			callback();

	     	}, "上海市");		
 		},
 		function (err){
 		}
 	)

}
 
function Complexlabel(point, text, mouseoverText){
	function ComplexCustomOverlay(point, text, mouseoverText){
      this._point = point;
      this._text = text;
      this._overText = mouseoverText;
    }
    ComplexCustomOverlay.prototype = new BMap.Overlay();
    ComplexCustomOverlay.prototype.initialize = function(map){
	    this._map = map;
	    var div = this._div = document.createElement("div");
	   	div.style = "border-radius:50px; width:75px; height:75px; border:3px solid #666;";
	    div.style.position = "absolute";
	    div.style.zIndex = BMap.Overlay.getZIndex(this._point.lat);
	    div.style.backgroundColor = "#EE5D5B";
	    // div.style.border = "1px solid #BC3B3A";
	    div.style.color = "black";
	    div.style.textAlign = "center"
	    div.style.height = "75px";
	    div.style.padding = "2px";
	    div.style.lineHeight = "55px";
	    div.style.whiteSpace = "nowrap";
	    div.style.MozUserSelect = "none";
	    div.style.fontSize = "20px"
	    var span = this._span = document.createElement("span");
	     div.appendChild(span);
	    span.appendChild(document.createTextNode(this._text));      
	    var that = this;

	    var arrow = this._arrow = document.createElement("div");
	    arrow.style.background = "url(images/niu.jpg) no-repeat";
	    arrow.style.position = "absolute";
	    arrow.style.width = "0px";
	    arrow.style.height = "0px";
	    arrow.style.top = "22px";
	    arrow.style.left = "10px";
	    arrow.style.overflow = "hidden";
	    div.appendChild(arrow);
	     
	    div.onmouseover = function(){
	      this.style.backgroundColor = "#6BADCA";
	      this.style.borderColor = "#0000ff";
	      this.getElementsByTagName("span")[0].innerHTML = that._overText;
	      arrow.style.backgroundPosition = "0px -20px";
	    }

	    div.onmouseout = function(){
	      this.style.backgroundColor = "#EE5D5B";
	      this.style.borderColor = "#BC3B3A";
	      this.getElementsByTagName("span")[0].innerHTML = that._text;
	      arrow.style.backgroundPosition = "0px 0px";
	    }
	    div.addEventListener("click", function(){
	    	myCompOverlay.hide()
	    	map.centerAndZoom(point,16); 

	    })

	    map.getPanes().labelPane.appendChild(div);
	      
	    return div;
    }
    ComplexCustomOverlay.prototype.hide = function (){
		if (this._div){
			this._div.style.display = "none"
		}    		
	}
    ComplexCustomOverlay.prototype.draw = function(){
      var map = this._map;
      var pixel = map.pointToOverlayPixel(this._point);
      this._div.style.left = pixel.x - parseInt(this._arrow.style.left) + "px";
      this._div.style.top  = pixel.y - 30 + "px";
    }
	var myCompOverlay = new ComplexCustomOverlay(point, text, mouseoverText);
	map.addOverlay(myCompOverlay);
	allOverlays.push(myCompOverlay);
}


 



//获取当前可见范围的所有小区
function getMapZones(ne,sw){
    var xy = JSON.stringify({"leftX":ne.lat,"leftY":ne.lng,"rightX":sw.lat,"rightY":sw.lng});
    console.log("Getting Map Zones......");
    $.ajax({
			url: 'getMapZones',
			type: "POST",
			data:  xy,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			success: function(data) {
				//生成地图标注

				//console.log('data........',data);	
				makeLabel(data.zones);

				//go on.........willion  create list on index.html

				// sort by priceRate
					data.zones.sort(function(a,b){
						return b.priceRate - a.priceRate;
					});// 排序, 倒序

				//在移动地图时，移除先前产生的table
				$('tr').not('#title').remove();
				// 	生成table
   				for (var x=0; x < data.zones.length; x++){
    				var td1 = data.zones[x].name;
    				var _item = $("<tr></tr>").html(td1).click(function(){
    					var num = ($(this).index()-1)
    					//console.log(num)
    					var graph_data = data.zones[num];
    					//console.log(data.zones[num])
    					//console.log(graph_data)
    					pop_chart(graph_data._id, graph_data.name);
    				});

    				$('#data').append(_item);
  				 }
			 }
	})
}


//点击tr弹出曲线图
function pop_chart(zoneId, content){
	//console.log(zoneId);
	$.ajax({

					url: 'getPrices',
					type: "POST",
					data: JSON.stringify({"id":zoneId,"name":content}),
					contentType: "application/json; charset=utf-8",
					dataType: "json",
					success: function(result) {
						//生成地图标注
//						var data =  eval ("(" + data + ")");
						labels =[];
						data =[];
						
						var tempDateTime="";
						result.zoneprices.forEach(function(price){
							
							var date = new Date(Number(price.time));
							
							var dateTime = date.getFullYear()+"/"+date.getMonth();
							
							if(dateTime != tempDateTime){
								labels.push(dateTime);
							    data.push(price.price);
							    tempDateTime = dateTime;
							}
							
							
						})
						
						$('#myModal').modal();
						
						var ctx = $("#myChart");
						
						var modalData = {
							labels : labels,
							datasets : [
								{
									label: "房价曲线",
//									fillColor : "rgba(51,153,255,0.5)",
									strokeColor : "rgba(51,153,255,1)",
//									pointColor : "rgba(51,153,255,1)",
//									pointStrokeColor : "#CC0000",
									fill:false,
									
									
									data : data
								}								
							]
						}
						
						
						new Chart(ctx, {
						    type: 'line',
						    data: modalData,
						    options: {
						        responsive: true
						    }
						});
						
						$("#myModalLabel").html(result.name);
					}
			})
}


function complexXQLabel (point, text, mouseoverText){
	function ComplexCustomOverlay(point, text, mouseoverText){
      this._point = point;
      this._text = text;
      this._overText = mouseoverText;
    }
    ComplexCustomOverlay.prototype = new BMap.Overlay();
    ComplexCustomOverlay.prototype.initialize = function(map){
	    this._map = map;
	    var div = this._div = document.createElement("div");
	   	div.style = "border-radius:50px; width:20px; height:20px; border:3px solid #666;";
	    div.style.position = "absolute";
	    div.style.zIndex = BMap.Overlay.getZIndex(this._point.lat);
	    div.style.backgroundColor = "#EE5D5B";
	    // div.style.border = "1px solid #BC3B3A";
	    div.style.color = "";
	    div.style.textAlign = "center"
	    div.style.height = "20px";
	    div.style.padding = "2px";
	    div.style.lineHeight = "20px";
	    div.style.whiteSpace = "nowrap";
	    div.style.MozUserSelect = "none";
	    div.style.fontSize = "10px"
	    var span = this._span = document.createElement("span");
	     div.appendChild(span);
	    span.appendChild(document.createTextNode(this._text));      
	    var that = this;

	    var arrow = this._arrow = document.createElement("div");
	    arrow.style.background = "url(images/niu.jpg) no-repeat";
	    arrow.style.position = "absolute";
	    arrow.style.width = "0px";
	    arrow.style.height = "0px";
	    arrow.style.top = "22px";
	    arrow.style.left = "10px";
	    arrow.style.overflow = "hidden";
	    div.appendChild(arrow);
	     
	    div.onmouseover = function(){
	      this.style.backgroundColor = "#6BADCA";
	      this.style.borderColor = "#0000ff";
	      this.getElementsByTagName("span")[0].innerHTML = that._overText;
	      arrow.style.backgroundPosition = "0px -20px";
	    }

	    div.onmouseout = function(){
	      this.style.backgroundColor = "#EE5D5B";
	      this.style.borderColor = "#BC3B3A";
	      this.getElementsByTagName("span")[0].innerHTML = that._text;
	      arrow.style.backgroundPosition = "0px 0px";
	    }
	    div.addEventListener("click", function(){
	    	myCompOverlay.hide()
	    	map.centerAndZoom(point,18); 

	    })

	    map.getPanes().labelPane.appendChild(div);
	      
	    return div;
    }
    ComplexCustomOverlay.prototype.hide = function (){
		if (this._div){
			this._div.style.display = "none"
		}    		
	}
    ComplexCustomOverlay.prototype.draw = function(){
      var map = this._map;
      var pixel = map.pointToOverlayPixel(this._point);
      this._div.style.left = pixel.x - parseInt(this._arrow.style.left) + "px";
      this._div.style.top  = pixel.y - 30 + "px";
    }
	var myCompOverlay = new ComplexCustomOverlay(point, text, mouseoverText);
	map.addOverlay(myCompOverlay);
	allOverlays.push(myCompOverlay);
}

//根据返回值生成标注物
function makeLabel(zones){
	var x = 0;
	async.whilst(
		function (){
			return x < zones.length;
		},
		function (){
			console.log(zones[x])
			var point = new BMap.Point(zones[x].y, zones[x].x);
			var mouseoverText = zones[x].name + " " + zones[x].priceRate;
			var mylabel = complexXQLabel(point, zones[x].name, mouseoverText);
			// var mymarker = new BMap.Marker(point)
			// var mylabel = new BMap.Label(
			// 	zone.name,
			// 	{
			// 		offset:new BMap.Size(0,0),
			// 		position:point
			// 	}
			// 	);
			// var fontColor= "";
			// mylabel.zoneId = zones[x]._id;
			
			if(zones[x].priceRate >= 0.5){
				div.style.fontColor = "red";
			}else if(zones[x].priceRate <0.5 && zones[x].priceRate>=0.2){
				div.style.fontColor="blue";
			}else if(zones[x].priceRate <0.2 && zones[x].priceRate>=0.0){
				div.style.fontColor="green";
			}else{
				div.style.fontColor="black";
			}
			
			
			
	// 		mylabel.setStyle({
	// 			"color":fontColor,
	// 			"border":"0",
	// 			"textAlign":"center",
	// 			"fontSize":"13px",
	// 			"height":"18px",
	// 			"width":"100px",
	// //			"background-color":"red"，
	// 	        "background":"url(images/niu.jpg)"
	// 		});
			
			
			mylabel.addEventListener('click',function(){
	                  
	               $.ajax({
						url: 'getPrices',
						type: "POST",
						data: JSON.stringify({"id":this.zoneId,"name":this.content}),
						contentType: "application/json; charset=utf-8",
						dataType: "json",
						success: function(result) {
							//生成地图标注
	//						var data =  eval ("(" + data + ")");
							labels =[];
							data =[];
							
							var tempDateTime="";
							result.zoneprices.forEach(function(price){
								
								var date = new Date(Number(price.time));
								
								var dateTime = date.getFullYear()+"/"+date.getMonth();
								
								if(dateTime != tempDateTime){
									labels.push(dateTime);
								    data.push(price.price);
								    tempDateTime = dateTime;
								}
								
								
							})
							
							$('#myModal').modal();
							
							var ctx = $("#myChart");
							
							var modalData = {
								labels : labels,
								datasets : [
									{
										label: "房价曲线",
	//									fillColor : "rgba(51,153,255,0.5)",
										strokeColor : "rgba(51,153,255,1)",
	//									pointColor : "rgba(51,153,255,1)",
	//									pointStrokeColor : "#CC0000",
										fill:false,
										
										
										data : data
									}								
								]
							}
							
							
							new Chart(ctx, {
							    type: 'line',
							    data: modalData,
							    options: {
							        responsive: true
							    }
							});
							
							$("#myModalLabel").html(result.name);
						}
				})
	   	     });
	   	     
			map.addOverlay(mylabel);
			// map.addOverlay(mymarker)
			// allOverlays.push(mymarker)
			allOverlays.push(mylabel);

		},
		function (err){

		}
	)
	// zones.forEach(function(zone){
		
		
	// });
	
}


//清除标注
function removeLabels(ne, sw){
	
	allOverlays.forEach(function(label){
		map.removeOverlay(label);
	})
	
}


//根据页数获取小区列表
function getZones(pageNum){
	
	$.post(
		 "getZoneByPrice",
		 {"pageNum":pageNum},
	 	 function(zones){
	 	 	var ul = $("#zoneList");
	 	 	zones.forEach(function(zone){
	 	 		
	 	 	})
	 	 }
	)
	
}



 $("#testBtn").click(function(){
  	  $.get("genFangData",function(data){
  	  	console.log(data);
  	  });
  })
  
  $("#genPrice").click(function(){
  
  	$.get("genFangPrice",function(data){
  		console.log(data);
  	});
  })
  
  
  $("#priceChange").click(function(){
     
    $.get("genPriceChange",function(data){
  		console.log(data);
  	});
  })
  
  
  $("#priceTest").click(function(){
  	
  	console.log("price test");
    $.post("getZoneByPrice",
           {"pageNum":1},
           function(data){
           	console.log(data);
           }
    )
  	
  })
  
  
$("#modifyXy").click(function(){
	$.get("modifyXy");
})
  
  
  
$("#getPricedZone").click(function(){
  		
  	var zoneResult=[];
  	console.log("Dude...")

	
	//获取所有有价格的小区
	$.get("getPricedZone",function(result){
		// if (err){
		// 	console.log(err)
		// }
		console.log("result.......", result)


  		var zones = result.zones;

  		console.log('results........',result,zones);
  		var length = zones.length;
  		var countNum =0;
  		var zoneNum = 0;
  		//for(var i=0; i<length; i++){
  		async.whilst(
  			function (){
  				return zoneNum < length;
  			},

  			function(callback){
	  				
	  				
	  				var options = {
					    
					    onSearchComplete: function(results){  //这里是回调

					        if (local.getStatus() == BMAP_STATUS_SUCCESS){      
					            // 判断状态是否正确      

					            var x = results.getPoi(0).point.lat;
					            var y = results.getPoi(0).point.lng;
					            zones[zoneNum].x = x;
					            zones[zoneNum].y = y;
									
								console.log("countNum",countNum,zoneNum);
									 
									
							    $.ajax({ //这里是保存
									url: 'saveXy',
									type: "POST",
									data:  JSON.stringify({"zone":zones[zoneNum]}),
									contentType: "application/json; charset=utf-8",
									dataType: "json",
									success: function(data) {
										console.log(zones[zoneNum].name,data);
										zoneNum++;
										setTimeout(callback, 20);
									}
								})

						    }
						    else{
					          	console.log("百度地图获取Xy错误",zones[zoneNum].name, (++countNum));
					          	zoneNum++;
								setTimeout(callback, 20);
					          	
					        }
					      }      
					};
	  				
	  				//限制options中i的作用范围 这里是搜索
	  				var local = new BMap.LocalSearch(map, options); 

	  				var pos1 = zones[zoneNum].name.indexOf("(");
	  				var pos2 = zones[zoneNum].name.indexOf("（")

					if (pos1 == -1){ //没有"("
						if (pos2 != -1){ //有“（”
							return local.search( zones[zoneNum].name.slice(0,pos2) )
						}	
						else{
							return local.search( zones[zoneNum].name )
						}

					}
					else {
						return local.search( zones[zoneNum].name.slice(0,pos1) )						
					}
						  				

	  				
	  				// return local.search( zones[i].name );
	  			
  			},
  			function (err){
  				console.log(err)

  			}
  		)	  			     
 		
  	});
	
 	
});


