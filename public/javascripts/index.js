(function($) {
	$(function() {
  	     $("#submitBtn2").click(function(){
  	     	/*console.log("btn2 click");
  	     	$("#submitBtn").click();*/
             $.ajax({
                 "method": "POST",
                 "url":"/userneed/new",
                 "data": {
                     "email": $("#mdEmail").val(),
                     "domain":$("#mdDomain").val(),
                     "level":$("#mdLevel").val(),
                     "method":$("#mdMethod").val(),
                     "area":$("#mdArea").val()
                 },
                 "dataType": "json",
                 "success": function(data) {
                     alert("提交成功!，感谢您的参加");
                 }
             });
  	     });
		 $("#submitBtn").click(function(){	 	
			$.ajax({
				"method": "POST",
				"url":"/userneed/new",
				"data": {
					"email": $("#email").val(),
					"domain":$("#domain").val(),
					"level":$("#level").val(),
                    "method":$("#method").val(),
					"area":$("#area").val()
				},
				"dataType": "json",
				"success": function(data) {
					alert("提交成功，感谢您的参加");
				}
			});
		 });
	});
})(jQuery);
