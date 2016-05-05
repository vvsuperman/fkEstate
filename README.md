
# 运行程序
1. 在项目根目录运行 `npm install` 命令，静待安装完成；
2. 进入 `public` 目录，执行 `bower install` 命令安装所依赖的前端框架;
3. 在已开启 `mongodb` 服务之后在项目根目录执行 `npm start` 启动程序；
4. 打开浏览器并访问 `http://localhost:8000`.

根据行政区查询小区接口:
http://www.anjuke.com/shanghai/cm/pudong/p2/


查询小区房价接口：
http://sh.fangjia.com/trend/yearData?defaultCityName={{城市名}}&districtName={{小区名}}&region={{行政区}}&block=&keyword=&__ajax=1
中文需进行转义：
http://sh.fangjia.com/trend/yearData?defaultCityName=%E4%B8%8A%E6%B5%B7&districtName=%E9%87%91%E6%9D%A8%E6%96%B0%E6%9D%91&region=%E6%B5%A6%E4%B8%9C&block=&keyword=&__ajax=1# fkEstate
小区坐标：通过百度地图获得

颜色根据
7000 3000 2000 1000
来划分

北京房价url：

获取小区
http://beijing.anjuke.com/community/chaoyang/p60/ 

价格趋势：
http://beijing.anjuke.com/ajax/pricetrend/comm?cid=309070



