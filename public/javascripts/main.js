
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
