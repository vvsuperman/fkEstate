var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var ejs = require('ejs');
var app = express();

/*

// view engine setup
app.set('views', path.join(__dirname, 'views'));
// app.engine('html', require('ejs').renderFile);
// app.set('view engine', 'ejs');
app.set('view engine', 'jade');

app.set('views', path.join(__dirname, 'views/pages'));    //设置视图路径为当前文件所在目录下的views子目录
app.set('view engine', 'hbs');  //设置视图引擎为hbs
//app.set('view cache', 'true');  //设置模板缓存
var hbs = require('hbs');   //加载hbs模块
hbs.registerPartials(__dirname + '/views/partials'); //注册模板的partials，并指定目录，partials相当于可复用组建
*/

app.engine('.html', ejs.__express);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
//require('./views/helper.js')(hbs);  //执行hbs.registerHelper()方法，注册所有Helper

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.locals.moment = require('moment');

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {

        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    // res.status(err.status || 500);
    // res.render('error', {
    //     message: err.message,
    //     error: {}
    // });
});
app.listen(8080);

console.log('Server running at http://localhost:3000');

module.exports = app;
