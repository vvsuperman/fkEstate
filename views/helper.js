/*此文件用于注册各种Handlerbars的Helper*/
var help=function(obj){ //测试用的行级helper
    return obj.firstName+obj.lastName+'  '+obj.message;
}
//此段函数可以直接复制，无需更改
var section=function(name, options){    //此块级helper用于在页面中向layout的section部分添加代码，有无options参数用于区别是不是块级Helper
    if(!this._sections) this._sections = {};    //this代码handlebars的context即接收的参数总和对象，我们会在layout定义_section对象
    this._sections[name] = options.fn(this);    //因为layout中的_section对象为空，所以可以将该块级Helper的代码(options.fn(this))赋值给_section[name]
    console.log(this);
    return null;                                //options.fn(this)表示该块级Helper包含的代码
}

module.exports=function(hbs) {
    hbs.registerHelper('helper', help);
    hbs.registerHelper('section',section);
}


