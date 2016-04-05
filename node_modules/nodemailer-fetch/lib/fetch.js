'use strict';

var http = require('http');
var https = require('https');
var urllib = require('url');
var zlib = require('zlib');
var PassThrough = require('stream').PassThrough;
var Cookies = require('./cookies');

var MAX_REDIRECTS = 5;

module.exports = function (url, options) {
    return fetch(url, options);
};

module.exports.Cookies = Cookies;

function fetch(url, options) {
    options = options || {};

    options.fetchRes = options.fetchRes || new PassThrough();
    options.cookies = options.cookies || new Cookies();
    options.redirects = options.redirects || 0;
    options.maxRedirects = isNaN(options.maxRedirects) ? MAX_REDIRECTS : options.maxRedirects;

    if (options.cookie) {
        [].concat(options.cookie || []).forEach(function (cookie) {
            options.cookies.set(cookie, url);
        });
        options.cookie = false;
    }

    var fetchRes = options.fetchRes;
    var parsed = urllib.parse(url);
    var finished = false;
    var cookies;

    var handler = parsed.protocol === 'https:' ? https : http;

    var headers = {
        'accept-encoding': 'gzip,deflate'
    };

    if (options.userAgent) {
        headers['User-Agent'] = options.userAgent;
    }

    if (parsed.auth) {
        headers.Authorization = 'Basic ' + new Buffer(parsed.auth).toString('base64');
    }

    if ((cookies = options.cookies.get(url))) {
        headers.cookie = cookies;
    }

    var req;

    try {
        req = handler.get({
            host: parsed.hostname,
            path: parsed.path,
            port: parsed.port ? parsed.port : (parsed.protocol === 'https:' ? 443 : 80),
            headers: headers,
            rejectUnauthorized: false,
            agent: false
        });
    } catch (E) {
        finished = true;
        setImmediate(function () {
            fetchRes.emit('error', E);
        });
        return fetchRes;
    }

    req.on('error', function (err) {
        if (finished) {
            return;
        }
        finished = true;
        fetchRes.emit('error', err);
    });

    req.on('response', function (res) {
        var inflate;

        if (finished) {
            return;
        }

        switch (res.headers['content-encoding']) {
            case 'gzip':
            case 'deflate':
                inflate = zlib.createUnzip();
                break;
        }

        if (res.headers['set-cookie']) {
            [].concat(res.headers['set-cookie'] || []).forEach(function (cookie) {
                options.cookies.set(cookie, url);
            });
        }

        if ([301, 302, 303, 307, 308].indexOf(res.statusCode) >= 0 && res.headers.location) {
            // redirect
            options.redirects++;
            if (options.redirects > options.maxRedirects) {
                finished = true;
                fetchRes.emit('error', new Error('Maximum redirect count exceeded'));
                req.abort();
                return;
            }
            return fetch(urllib.resolve(url, res.headers.location), options);
        }

        if (res.statusCode >= 300) {
            finished = true;
            fetchRes.emit('error', new Error('Invalid status code ' + res.statusCode));
            req.abort();
            return;
        }

        res.on('error', function (err) {
            if (finished) {
                return;
            }
            finished = true;
            fetchRes.emit('error', err);
            req.abort();
        });

        if (inflate) {
            res.pipe(inflate).pipe(fetchRes);
            inflate.on('error', function (err) {
                if (finished) {
                    return;
                }
                finished = true;
                fetchRes.emit('error', err);
                req.abort();
            });
        } else {
            res.pipe(fetchRes);
        }
    });

    return fetchRes;
}
