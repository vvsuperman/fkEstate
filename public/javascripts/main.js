


map = new BMap.Map("container");          // 创建地图实例  
// 初始化地图，设置中心点坐标和地图级别  
map.addControl(new BMap.NavigationControl());    
map.addControl(new BMap.ScaleControl());    
map.addControl(new BMap.OverviewMapControl());    
map.addControl(new BMap.MapTypeControl());    
map.centerAndZoom("上海",15); 


var allOverlays = []; //储存所有的图层

 map.addEventListener('load', function () {

    
     var bs = map.getBounds();   //获取可视区域
	 var sw = bs.getSouthWest();   //可视区域左下角
	 var ne = bs.getNorthEast();   //可视区域右上角
		 		 
	 console.log("ne",ne.lng, ne.lat);
     console.log("sw",  sw.lng, sw.lat); 
     getMapZones(ne,sw);

});


map.addEventListener("dragend", function(){    
 var center = map.getCenter();    
 console.log("地图中心点变更为：" + center.lng + ", " + center.lat);    
 
     var bs = map.getBounds();   //获取可视区域
	 var sw = bs.getSouthWest();   //可视区域左下角
	 var ne = bs.getNorthEast();   //可视区域右上角
		 		 
	 console.log("ne",ne.lng, ne.lat);
	 console.log("sw",  sw.lng, sw.lat);   
	 removeLabels(ne, sw);
	 getMapZones(ne,sw);
});


$("#genBJZone").click(function(){
	$.get("genBJFangData");
})


//获取当前可见范围的所有小区
function getMapZones(ne,sw){
	     var xy = JSON.stringify({"leftX":ne.lat,"leftY":ne.lng,"rightX":sw.lat,"rightY":sw.lng});
	     
	     console.log(xy);
	     $.ajax({
				url: 'getMapZones',
				type: "POST",
				data:  xy,
				contentType: "application/json; charset=utf-8",
				dataType: "json",
				success: function(data) {
					//生成地图标注
					makeLabel(data.zones);
				}
			})
	
}



//根据返回值生成标注物
function makeLabel(zones){
	zones.forEach(function(zone){
		var point = new BMap.Point(zone.y, zone.x);
		var mylabel = new BMap.Label(
			zone.name,
			{
				offset:new BMap.Size(-60,-60),
				position:point
			}
			);
		var fontColor="";
		
		if(zone.priceRate >= 4000){
			fontColor = "red";
		}else if(zone.priceRate <4000 && zone.priceRate>=2000){
			fontColor="blue";
		}else if(zone.priceRate <2000 && zone.priceRate>=1000){
			fontColor="green";
		}else{
			fontColor="black";
		}
		
		
		
		mylabel.setStyle({
			"color":fontColor,
			"border":"0",
			"textAlign":"center",
			"fontSize":"14px",
			"height":"18px",
			"width":"100px",
//			"background-color":"red"
		});
		map.addOverlay(mylabel);
		allOverlays.push(mylabel);
		
	});
	
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
  
  
  
  $("#testXy").click(function(){
  	
  	var zoneResult=[];
  	  	 
	
	//获取所有有价格的小区
	 $.get("getPricedZone",function(result){
  		var zones = result.zones;
  		var length = zones.length;
  		var countNum =0;
  		
  		for(var i=0; i<length; i++){
  				  			  			
  			function getXy(i){
  			
  				var options = {
				      onSearchComplete: function(results){      
				          if (local.getStatus() == BMAP_STATUS_SUCCESS){      
				                // 判断状态是否正确      
				                    
			
				                var x = results.getPoi(0).point.lat;
				                var y = results.getPoi(0).point.lng;
				                zones[i].x = x;
				                zones[i].y = y;
								
								console.log("countNum",countNum,length);
								 
								
						        $.ajax({
									url: 'saveXy',
									type: "POST",
									data:  JSON.stringify({"zone":zones[i]}),
									contentType: "application/json; charset=utf-8",
									dataType: "json",
									success: function(data) {
										console.log(data)
									}
								})
					            //取完最后一条记录，进行上传 					            
//								if (++countNum == length) {
//									
//									//上传时做下控制，分批上传
//								   for(var j=0; j< length;j+=100){
//								   	
//								   	    var end = 0;
//								   	    (j+100 > length) ? end = length: end = j+100;
//								        var rtZone = zones.slice(j,end);								       
								        
								   
								   	
//								   }
//				            	
//					            }
					             
//				                console.log(i,zones[i].name, x,y);
//				                var point = new BMap.Point(y, x);  
//				                var marker = new BMap.Marker(point);
//				                marker.setTitle(zones[i].name);				              
//				                // 创建标注
//							    map.addOverlay(marker);                     // 将标注添加到地图中 				               				                
//				                map.centerAndZoom(point,15);
				                                               
				          }else{
				          	  console.log("百度地图获取Xy错误"+(++countNum));
				          	
				          }
				      }      
				 	}; 
  				
  				//限制options中i的作用范围
  				var local = new BMap.LocalSearch(map, options); 
  				return local.search( zones[i].name );
  				
  			};
  			//settimeout的机制,将i做形参
			setTimeout(getXy(i),300*i);
//          getXy(i);
  			
  			
  			
  			 
  		}
  			  			     
           
            
  	
  		
  		
  	});
	
  	
  })
