
(function($) {
    $(function() {
        $('#userInfo').click(function(){
            $.ajax({
                "method": "get",

            })
        })
    })
})

/*(function($) {
	$(function() {
		*//**
		 * 删除影片
		 *//*
		$('.del').click(function() {
			var id = $(this).data('id');
			var that = this;

			$.ajax({
				"method": "DELETE",
				"data": {
					"id": id
				},
				"dataType": "json",
				"success": function(data) {
					if (!data.status) {
						$(that).parents('tr').remove();
					} else {
						alert(data.message);
					}
				}
			});
		});
	});
})(jQuery);*/
