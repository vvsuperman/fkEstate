
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
