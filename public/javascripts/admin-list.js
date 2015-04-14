/**
 * @file: 后台影片列表页面 js 效果
 * @author: sqrtthree@foxmail.com
 * @update: 2015年02月28日
 */
(function($) {
	$(function() {
		/**
		 * 删除影片
		 */
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
})(jQuery);
