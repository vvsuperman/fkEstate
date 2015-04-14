;(function (root) {
  "use strict";
  var _runtime = function () {
    var exports = {}
    var module = { exports: exports };

    (function (GLOBAL) {
      "use strict";
      var __create, __defer, __fromPromise, __generatorToPromise, __import,
          __isArray, __owns, __promise, __slice, __toArray, __typeof, _ref, _this,
          EGSError, escapeHTML, guessFilepath, helpers, helpersProto,
          makeHelpersFactory, Package, setImmediate, simpleHelpersProto;
      _this = this;
      __create = typeof Object.create === "function" ? Object.create
        : function (x) {
          function F() {}
          F.prototype = x;
          return new F();
        };
      __defer = (function () {
        function __defer() {
          var deferred, isError, value;
          isError = false;
          value = null;
          deferred = [];
          function complete(newIsError, newValue) {
            var funcs;
            if (deferred) {
              funcs = deferred;
              deferred = null;
              isError = newIsError;
              value = newValue;
              if (funcs.length) {
                setImmediate(function () {
                  var _end, i;
                  for (i = 0, _end = funcs.length; i < _end; ++i) {
                    funcs[i]();
                  }
                });
              }
            }
          }
          return {
            promise: {
              then: function (onFulfilled, onRejected, allowSync) {
                var _ref, fulfill, promise, reject;
                if (allowSync !== true) {
                  allowSync = void 0;
                }
                _ref = __defer();
                promise = _ref.promise;
                fulfill = _ref.fulfill;
                reject = _ref.reject;
                _ref = null;
                function step() {
                  var f, result;
                  try {
                    if (isError) {
                      f = onRejected;
                    } else {
                      f = onFulfilled;
                    }
                    if (typeof f === "function") {
                      result = f(value);
                      if (result && typeof result.then === "function") {
                        result.then(fulfill, reject, allowSync);
                      } else {
                        fulfill(result);
                      }
                    } else {
                      (isError ? reject : fulfill)(value);
                    }
                  } catch (e) {
                    reject(e);
                  }
                }
                if (deferred) {
                  deferred.push(step);
                } else if (allowSync) {
                  step();
                } else {
                  setImmediate(step);
                }
                return promise;
              },
              sync: function () {
                var result, state;
                state = 0;
                result = 0;
                this.then(
                  function (ret) {
                    state = 1;
                    result = ret;
                  },
                  function (err) {
                    state = 2;
                    result = err;
                  },
                  true
                );
                switch (state) {
                case 0: throw new Error("Promise did not execute synchronously");
                case 1: return result;
                case 2: throw result;
                default: throw new Error("Unknown state");
                }
              }
            },
            fulfill: function (value) {
              complete(false, value);
            },
            reject: function (reason) {
              complete(true, reason);
            }
          };
        }
        __defer.fulfilled = function (value) {
          var d;
          d = __defer();
          d.fulfill(value);
          return d.promise;
        };
        __defer.rejected = function (reason) {
          var d;
          d = __defer();
          d.reject(reason);
          return d.promise;
        };
        return __defer;
      }());
      __fromPromise = function (promise) {
        if (typeof promise !== "object" || promise === null) {
          throw new TypeError("Expected promise to be an Object, got " + __typeof(promise));
        } else if (typeof promise.then !== "function") {
          throw new TypeError("Expected promise.then to be a Function, got " + __typeof(promise.then));
        }
        return function (callback) {
          if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a Function, got " + __typeof(callback));
          }
          promise.then(
            function (value) {
              return setImmediate(callback, null, value);
            },
            function (reason) {
              return setImmediate(callback, reason);
            }
          );
        };
      };
      __generatorToPromise = function (generator, allowSync) {
        if (typeof generator !== "object" || generator === null) {
          throw new TypeError("Expected generator to be an Object, got " + __typeof(generator));
        } else {
          if (typeof generator.send !== "function") {
            throw new TypeError("Expected generator.send to be a Function, got " + __typeof(generator.send));
          }
          if (typeof generator["throw"] !== "function") {
            throw new TypeError("Expected generator.throw to be a Function, got " + __typeof(generator["throw"]));
          }
        }
        if (allowSync == null) {
          allowSync = false;
        } else if (typeof allowSync !== "boolean") {
          throw new TypeError("Expected allowSync to be a Boolean, got " + __typeof(allowSync));
        }
        function continuer(verb, arg) {
          var item;
          try {
            item = generator[verb](arg);
          } catch (e) {
            return __defer.rejected(e);
          }
          if (item.done) {
            return __defer.fulfilled(item.value);
          } else {
            return item.value.then(callback, errback, allowSync);
          }
        }
        function callback(value) {
          return continuer("send", value);
        }
        function errback(value) {
          return continuer("throw", value);
        }
        return callback(void 0);
      };
      __import = function (dest, source) {
        var k;
        for (k in source) {
          if (__owns.call(source, k)) {
            dest[k] = source[k];
          }
        }
        return dest;
      };
      __isArray = typeof Array.isArray === "function" ? Array.isArray
        : (function (_toString) {
          return function (x) {
            return _toString.call(x) === "[object Array]";
          };
        }(Object.prototype.toString));
      __owns = Object.prototype.hasOwnProperty;
      __promise = function (value, allowSync) {
        var factory;
        if (allowSync == null) {
          allowSync = false;
        } else if (typeof allowSync !== "boolean") {
          throw new TypeError("Expected allowSync to be a Boolean, got " + __typeof(allowSync));
        }
        if (typeof value === "function") {
          factory = function () {
            return __generatorToPromise(value.apply(this, arguments));
          };
          factory.sync = function () {
            return __generatorToPromise(
              value.apply(this, arguments),
              true
            ).sync();
          };
          factory.maybeSync = function () {
            return __generatorToPromise(
              value.apply(this, arguments),
              true
            );
          };
          return factory;
        } else {
          return __generatorToPromise(value, allowSync);
        }
      };
      __slice = Array.prototype.slice;
      __toArray = function (x) {
        if (x == null) {
          throw new TypeError("Expected an object, got " + __typeof(x));
        } else if (__isArray(x)) {
          return x;
        } else if (typeof x === "string") {
          return x.split("");
        } else if (typeof x.length === "number") {
          return __slice.call(x);
        } else {
          throw new TypeError("Expected an object with a length property, got " + __typeof(x));
        }
      };
      __typeof = (function () {
        var _toString;
        _toString = Object.prototype.toString;
        return function (o) {
          if (o === void 0) {
            return "Undefined";
          } else if (o === null) {
            return "Null";
          } else {
            return o.constructor && o.constructor.name || _toString.call(o).slice(8, -1);
          }
        };
      }());
      setImmediate = typeof GLOBAL.setImmediate === "function" ? GLOBAL.setImmediate
        : typeof process !== "undefined" && typeof process.nextTick === "function"
        ? (function (nextTick) {
          return function (func) {
            var args;
            if (typeof func !== "function") {
              throw new TypeError("Expected func to be a Function, got " + __typeof(func));
            }
            args = __slice.call(arguments, 1);
            if (args.length) {
              return nextTick(function () {
                func.apply(void 0, __toArray(args));
              });
            } else {
              return nextTick(func);
            }
          };
        }(process.nextTick))
        : function (func) {
          var args;
          if (typeof func !== "function") {
            throw new TypeError("Expected func to be a Function, got " + __typeof(func));
          }
          args = __slice.call(arguments, 1);
          if (args.length) {
            return setTimeout(
              function () {
                func.apply(void 0, args);
              },
              0
            );
          } else {
            return setTimeout(func, 0);
          }
        };
      helpers = (function () {
        var helpers, RawHTML;
        helpers = {};
        RawHTML = (function () {
          var _RawHTML_prototype;
          function RawHTML(text) {
            var _this;
            _this = this instanceof RawHTML ? this : __create(_RawHTML_prototype);
            _this.text = text;
            return _this;
          }
          _RawHTML_prototype = RawHTML.prototype;
          RawHTML.displayName = "RawHTML";
          _RawHTML_prototype.toHTML = function () {
            return this.text;
          };
          return RawHTML;
        }());
        helpers.h = helpers.html = function (text) {
          return RawHTML(String(text));
        };
        helpers.j = helpers.javascript = (function () {
          var escapes, regex;
          escapes = {
            "\\": "\\\\",
            "\r": "\\r",
            "\u2028": "\\u2028",
            "\u2029": "\\u2029",
            "\n": "\\n",
            "\f": "\\f",
            "'": "\\'",
            '"': '\\"',
            "\t": "\\t"
          };
          function replacer(x) {
            return escapes[x];
          }
          regex = /[\\\r\u2028\u2029\n\f'"\t]/g;
          return function (text) {
            return RawHTML(String(text).replace(regex, replacer));
          };
        }());
        helpers.__maybeEscape = function (escape, arr) {
          if (arr[1]) {
            return escape(arr[0]);
          } else {
            return arr[0];
          }
        };
        return helpers;
      }());
      EGSError = (function (Error) {
        var _EGSError_prototype, _Error_prototype;
        function EGSError(message) {
          var _this, err;
          _this = this instanceof EGSError ? this : __create(_EGSError_prototype);
          if (message == null) {
            message = "";
          }
          _this.message = message;
          err = Error.call(_this, message);
          if (typeof Error.captureStackTrace === "function") {
            Error.captureStackTrace(_this, EGSError);
          } else if ("stack" in err) {
            _this.stack = err.stack;
          }
          return _this;
        }
        _Error_prototype = Error.prototype;
        _EGSError_prototype = EGSError.prototype = __create(_Error_prototype);
        _EGSError_prototype.constructor = EGSError;
        EGSError.displayName = "EGSError";
        if (typeof Error.extended === "function") {
          Error.extended(EGSError);
        }
        _EGSError_prototype.name = "EGSError";
        return EGSError;
      }(Error));
      function pathBasename(filepath) {
        var match;
        match = /.*?[\/\\](.*)/.exec(filepath);
        if (match) {
          return match[1];
        } else {
          return filepath;
        }
      }
      function pathDirname(filepath) {
        var match;
        match = /(.*)[\/\\]/.exec(filepath);
        if (match) {
          return match[1];
        } else {
          return ".";
        }
      }
      function pathJoin(head, tail) {
        if (head === ".") {
          return tail;
        } else {
          return head + "/" + tail;
        }
      }
      function fullExtname(filename) {
        var match;
        match = /^[^\.]+(\..*)$/.exec(pathBasename(filename));
        if (match) {
          return match[1];
        } else {
          return "";
        }
      }
      function hasExtension(filepath) {
        return /.\./.test(pathBasename(filepath));
      }
      function pathResolve(fromPath, toPath) {
        if (/^[\/\\]/.test(toPath)) {
          return toPath;
        } else if (/^..[\/\\]/.test(toPath)) {
          return pathResolve(pathDirname(fromPath), toPath.substring(3));
        } else {
          return pathJoin(fromPath, toPath);
        }
      }
      guessFilepath = (function () {
        var cache;
        cache = {};
        return function (name, fromFilepath) {
          var filename, key;
          key = name + "\u0000" + fromFilepath;
          return cache[key] || (filename = name, !hasExtension(filename) && (filename += "" + fullExtname(fromFilepath)), cache[key] = pathResolve(pathDirname(fromFilepath), filename));
        };
      }());
      function returnSame(value) {
        return function () {
          return value;
        };
      }
      function toMaybeSync(promiseFactory) {
        var k, maybeSync, v;
        maybeSync = promiseFactory.maybeSync;
        for (k in promiseFactory) {
          if (__owns.call(promiseFactory, k)) {
            v = promiseFactory[k];
            maybeSync[k] = v;
          }
        }
        return maybeSync;
      }
      function flushStream(streamSend, write) {
        if (write && streamSend) {
          streamSend(write);
          return "";
        } else {
          return write;
        }
      }
      simpleHelpersProto = __import({}, helpers);
      _ref = __import({}, helpers);
      _ref["extends"] = function (name, locals) {
        if (!this.__currentFilepath$) {
          throw EGSError("Can only use extends if the 'filename' option is specified");
        }
        if (this.__inPartial$) {
          throw EGSError("Cannot use extends when in a partial");
        }
        if (this.__extendedBy$) {
          throw EGSError("Cannot use extends more than once");
        }
        this.__extendedBy$ = this.__fetchCompiled$(name);
        this.__extendedByLocals$ = locals;
      };
      _ref.partial = toMaybeSync(__promise(function (name, write, locals) {
        var _e, _o, _ref, _send, _state, _step, _this, _throw, filepath, func,
            partialHelpers;
        _this = this;
        _state = 0;
        function _close() {
          _state = 5;
        }
        function _step(_received) {
          while (true) {
            switch (_state) {
            case 0:
              if (locals == null) {
                locals = {};
              }
              if (!_this.__currentFilepath$) {
                throw EGSError("Can only use partial if the 'filename' option is specified");
              }
              name = pathJoin(pathDirname(name), "" + _this.__partialPrefix$ + pathBasename(name));
              write = flushStream(_this.__streamSend$, write);
              ++_state;
              return { done: false, value: _this.__fetchCompiled$(name) };
            case 1:
              _ref = _received;
              filepath = _ref.filepath;
              func = _ref.compiled.func;
              _ref = null;
              _o = __create(_this);
              _o.__currentFilepath$ = filepath;
              _o.__inPartial$ = true;
              partialHelpers = _o;
              _state = func.maybeSync ? 2 : 4;
              break;
            case 2:
              ++_state;
              return {
                done: false,
                value: func.maybeSync(write, locals, partialHelpers)
              };
            case 3:
              _state = 5;
              return { done: true, value: _received };
            case 4:
              ++_state;
              return {
                done: true,
                value: func(write, locals, partialHelpers)
              };
            case 5:
              return { done: true, value: void 0 };
            default: throw new Error("Unknown state: " + _state);
            }
          }
        }
        function _throw(_e) {
          _close();
          throw _e;
        }
        function _send(_received) {
          try {
            return _step(_received);
          } catch (_e) {
            _throw(_e);
          }
        }
        return {
          close: _close,
          iterator: function () {
            return this;
          },
          next: function () {
            return _send(void 0);
          },
          send: _send,
          "throw": function (_e) {
            _throw(_e);
            return _send(void 0);
          }
        };
      }));
      _ref.block = toMaybeSync(__promise(function (name, write, inside) {
        var _e, _send, _state, _step, _this, _throw, block, blocks, result,
            rootHelpers;
        _this = this;
        _state = 0;
        function _close() {
          _state = 6;
        }
        function _step(_received) {
          while (true) {
            switch (_state) {
            case 0:
              if (inside == null) {
                inside = null;
              }
              if (_this.__inPartial$) {
                throw EGSError("Cannot use block when in a partial");
              }
              write = flushStream(_this.__streamSend$, write);
              blocks = _this.__blocks$;
              rootHelpers = _this.__helpers$;
              _state = _this.__extendedBy$ && !rootHelpers.__inBlock$ ? 1 : 2;
              break;
            case 1:
              if (inside != null && !__owns.call(blocks, name)) {
                blocks[name] = inside;
              }
              _state = 6;
              return { done: true, value: write };
            case 2:
              block = __owns.call(blocks, name) && blocks[name] || inside;
              result = write;
              _state = block ? 3 : 5;
              break;
            case 3:
              rootHelpers.__inBlock$ = true;
              ++_state;
              return {
                done: false,
                value: __promise(block(write), true)
              };
            case 4:
              result = _received;
              rootHelpers.__inBlock$ = false;
              ++_state;
            case 5:
              ++_state;
              return { done: true, value: result };
            case 6:
              return { done: true, value: void 0 };
            default: throw new Error("Unknown state: " + _state);
            }
          }
        }
        function _throw(_e) {
          _close();
          throw _e;
        }
        function _send(_received) {
          try {
            return _step(_received);
          } catch (_e) {
            _throw(_e);
          }
        }
        return {
          close: _close,
          iterator: function () {
            return this;
          },
          next: function () {
            return _send(void 0);
          },
          send: _send,
          "throw": function (_e) {
            _throw(_e);
            return _send(void 0);
          }
        };
      }));
      _ref.__handleExtends$ = toMaybeSync(__promise(function (currentWrite) {
        var _e, _o, _ref, _send, _state, _step, _this, _throw, filepath, func,
            locals, newHelpers, text;
        _this = this;
        _state = 0;
        function _close() {
          _state = 9;
        }
        function _step(_received) {
          while (true) {
            switch (_state) {
            case 0:
              ++_state;
              return { done: false, value: _this.__extendedBy$ };
            case 1:
              _ref = _received;
              filepath = _ref.filepath;
              func = _ref.compiled.func;
              _ref = null;
              _o = __create(_this);
              _o.__currentFilepath$ = filepath;
              _o.__extendedBy$ = null;
              _o.__extendedByLocals$ = null;
              newHelpers = _o;
              locals = _this.__extendedByLocals$ || {};
              _state = func.maybeSync ? 2 : 4;
              break;
            case 2:
              ++_state;
              return {
                done: false,
                value: func.maybeSync("", locals, newHelpers)
              };
            case 3:
              text = _received;
              _state = 5;
              break;
            case 4:
              text = func("", locals, newHelpers);
              ++_state;
            case 5:
              _state = newHelpers.__extendedBy$ ? 6 : 8;
              break;
            case 6:
              ++_state;
              return {
                done: false,
                value: newHelpers.__handleExtends$.call(newHelpers, text)
              };
            case 7:
              _state = 9;
              return { done: true, value: _received };
            case 8:
              ++_state;
              return { done: true, value: text };
            case 9:
              return { done: true, value: void 0 };
            default: throw new Error("Unknown state: " + _state);
            }
          }
        }
        function _throw(_e) {
          _close();
          throw _e;
        }
        function _send(_received) {
          try {
            return _step(_received);
          } catch (_e) {
            _throw(_e);
          }
        }
        return {
          close: _close,
          iterator: function () {
            return this;
          },
          next: function () {
            return _send(void 0);
          },
          send: _send,
          "throw": function (_e) {
            _throw(_e);
            return _send(void 0);
          }
        };
      }));
      helpersProto = _ref;
      escapeHTML = (function () {
        var ampRegex, fullRegex, gtRegex, ltRegex, quotRegex;
        fullRegex = /[&<>"]/;
        ampRegex = /&/g;
        ltRegex = /</g;
        gtRegex = />/g;
        quotRegex = /"/g;
        function escaper(text) {
          if (fullRegex.test(text)) {
            return text.replace(ampRegex, "&amp;").replace(ltRegex, "&lt;").replace(gtRegex, "&gt;").replace(quotRegex, "&quot;");
          } else {
            return text;
          }
        }
        return function (value) {
          if (typeof value === "string") {
            return escaper(value);
          } else if (typeof value === "number") {
            return value.toString();
          } else if (value && typeof value.toHTML === "function") {
            return String(value.toHTML());
          } else {
            throw new TypeError("Expected a String, Number, or Object with a toHTML method, got " + __typeof(value));
          }
        };
      }());
      makeHelpersFactory = (function () {
        function makeFactory(partialPrefix, currentFilepath, fetchCompiled, escaper, optionsContext) {
          var baseHelpers, simpleHelpers;
          baseHelpers = __create(helpersProto);
          baseHelpers.__currentFilepath$ = currentFilepath;
          baseHelpers.__partialPrefix$ = partialPrefix;
          baseHelpers.__fetchCompiled$ = fetchCompiled;
          baseHelpers.__extendedBy$ = null;
          baseHelpers.__extendedByLocals$ = null;
          baseHelpers.__inPartial$ = false;
          baseHelpers.__inBlock$ = false;
          baseHelpers.escape = escaper;
          simpleHelpers = __create(simpleHelpersProto);
          simpleHelpers.__currentFilepath$ = currentFilepath;
          simpleHelpers.escape = escaper;
          if (optionsContext) {
            __import(simpleHelpers, optionsContext);
            __import(baseHelpers, optionsContext);
          }
          return function (isSimple) {
            var helpers;
            if (isSimple) {
              return simpleHelpers;
            } else {
              helpers = __create(baseHelpers);
              helpers.__helpers$ = helpers;
              helpers.__blocks$ = {};
              return helpers;
            }
          };
        }
        return function (options, fetchAndCompileFile) {
          return makeFactory(
            typeof options.partialPrefix === "string" ? options.partialPrefix : "_",
            options.filename,
            function (name) {
              return fetchAndCompileFile(name, this.__currentFilepath$);
            },
            typeof options.escape === "function" ? options.escape : escapeHTML,
            __owns.call(options, "context") ? options.context : options
          );
        };
      }());
      function makeTemplate(getCompilationP, makeHelpers, cacheCompilation) {
        var compilation, template;
        if (cacheCompilation == null) {
          cacheCompilation = false;
        }
        template = __promise(function (data) {
          var _e, _send, _state, _step, _throw, helpers, result, tmp;
          _state = 0;
          function _close() {
            _state = 10;
          }
          function _step(_received) {
            while (true) {
              switch (_state) {
              case 0:
                tmp = cacheCompilation && compilation;
                _state = !tmp ? 1 : 3;
                break;
              case 1:
                ++_state;
                return { done: false, value: getCompilationP() };
              case 2:
                tmp = _received;
                if (cacheCompilation) {
                  compilation = tmp;
                }
                ++_state;
              case 3:
                helpers = makeHelpers(tmp.isSimple);
                result = tmp.func("", data || {}, helpers);
                _state = result && result.then ? 4 : 6;
                break;
              case 4:
                ++_state;
                return { done: false, value: result };
              case 5:
                result = _received;
                ++_state;
              case 6:
                _state = helpers.__extendedBy$ ? 7 : 9;
                break;
              case 7:
                ++_state;
                return {
                  done: false,
                  value: helpers.__handleExtends$.maybeSync.call(helpers, result)
                };
              case 8:
                _state = 10;
                return { done: true, value: _received };
              case 9:
                ++_state;
                return { done: true, value: result };
              case 10:
                return { done: true, value: void 0 };
              default: throw new Error("Unknown state: " + _state);
              }
            }
          }
          function _throw(_e) {
            _close();
            throw _e;
          }
          function _send(_received) {
            try {
              return _step(_received);
            } catch (_e) {
              _throw(_e);
            }
          }
          return {
            close: _close,
            iterator: function () {
              return this;
            },
            next: function () {
              return _send(void 0);
            },
            send: _send,
            "throw": function (_e) {
              _throw(_e);
              return _send(void 0);
            }
          };
        });
        template.sync = function (data) {
          var func, helpers, result, tmp;
          tmp = cacheCompilation && compilation;
          if (!tmp) {
            tmp = getCompilationP().sync();
            if (cacheCompilation) {
              compilation = tmp;
            }
          }
          helpers = makeHelpers(tmp.isSimple);
          func = tmp.func;
          result = (func.sync || func)("", data || {}, helpers);
          if (typeof result !== "string") {
            result = result.sync();
          }
          if (helpers.__extendedBy$) {
            return helpers.__handleExtends$.sync.call(helpers, result);
          } else {
            return result;
          }
        };
        template.stream = function (data) {
          var _ref, promise, streamEnd, streamPublic, streamSend, streamThrow;
          _ref = Stream();
          streamSend = _ref.send;
          streamEnd = _ref.end;
          streamThrow = _ref["throw"];
          streamPublic = _ref["public"];
          _ref = null;
          promise = __generatorToPromise((function () {
            var _e, _send, _state, _step, _throw, extension, func, helpers, result,
                tmp;
            _state = 0;
            function _close() {
              _state = 11;
            }
            function _step(_received) {
              while (true) {
                switch (_state) {
                case 0:
                  tmp = cacheCompilation && compilation;
                  _state = !tmp ? 1 : 3;
                  break;
                case 1:
                  ++_state;
                  return { done: false, value: getCompilationP() };
                case 2:
                  tmp = _received;
                  if (cacheCompilation) {
                    compilation = tmp;
                  }
                  ++_state;
                case 3:
                  helpers = makeHelpers(tmp.isSimple);
                  helpers.__streamSend$ = streamSend;
                  ++_state;
                  return { done: false, value: __defer.fulfilled() };
                case 4:
                  func = tmp.func;
                  if (func.stream) {
                    result = func.stream(streamSend, "", data || {}, helpers);
                  } else {
                    result = func("", data || {}, helpers);
                  }
                  _state = result && result.then ? 5 : 7;
                  break;
                case 5:
                  ++_state;
                  return { done: false, value: result };
                case 6:
                  result = _received;
                  ++_state;
                case 7:
                  _state = helpers.__extendedBy$ ? 8 : 10;
                  break;
                case 8:
                  extension = helpers.__handleExtends$;
                  ++_state;
                  return {
                    done: false,
                    value: extension.call(helpers, result)
                  };
                case 9:
                  _state = 11;
                  return { done: true, value: _received };
                case 10:
                  ++_state;
                  return { done: true, value: result };
                case 11:
                  return { done: true, value: void 0 };
                default: throw new Error("Unknown state: " + _state);
                }
              }
            }
            function _throw(_e) {
              _close();
              throw _e;
            }
            function _send(_received) {
              try {
                return _step(_received);
              } catch (_e) {
                _throw(_e);
              }
            }
            return {
              close: _close,
              iterator: function () {
                return this;
              },
              next: function () {
                return _send(void 0);
              },
              send: _send,
              "throw": function (_e) {
                _throw(_e);
                return _send(void 0);
              }
            };
          }()));
          promise.then(function (value) {
            if (value) {
              streamSend(value);
            }
            streamEnd();
          }).then(null, streamThrow);
          return streamPublic;
        };
        template.ready = __promise(function () {
          var _e, _send, _state, _step, _throw, func, helpers;
          _state = 0;
          function _close() {
            _state = 6;
          }
          function _step(_received) {
            while (true) {
              switch (_state) {
              case 0:
                _state = cacheCompilation ? 1 : 5;
                break;
              case 1:
                _state = !compilation ? 2 : 4;
                break;
              case 2:
                ++_state;
                return { done: false, value: getCompilationP() };
              case 3:
                compilation = _received;
                ++_state;
              case 4:
                func = compilation.func;
                if (func.sync) {
                  func = func.sync;
                }
                if (compilation.isSimple) {
                  helpers = makeHelpers(true);
                  template.sync = function (data) {
                    var result;
                    result = func("", data || {}, helpers);
                    if (typeof result !== "string") {
                      return result.sync();
                    } else {
                      return result;
                    }
                  };
                }
                _state = 6;
                break;
              case 5:
                ++_state;
                return { done: false, value: getCompilationP() };
              case 6:
                return { done: true, value: void 0 };
              default: throw new Error("Unknown state: " + _state);
              }
            }
          }
          function _throw(_e) {
            _close();
            throw _e;
          }
          function _send(_received) {
            try {
              return _step(_received);
            } catch (_e) {
              _throw(_e);
            }
          }
          return {
            close: _close,
            iterator: function () {
              return this;
            },
            next: function () {
              return _send(void 0);
            },
            send: _send,
            "throw": function (_e) {
              _throw(_e);
              return _send(void 0);
            }
          };
        });
        return template;
      }
      Package = (function () {
        var _Package_prototype;
        function Package(version, options) {
          var _this;
          _this = this instanceof Package ? this : __create(_Package_prototype);
          if (version && typeof version === "object" && version !== null) {
            return Package.call(_this, null, version);
          }
          if (version && version !== "0.3.1") {
            throw new Error("EGS Packages must be compiled with the same version as the EGS runtime: '" + version + "' vs. '0.3.1'");
          }
          _this.factories = {};
          _this.templates = {};
          if (options != null) {
            _this.options = options;
          } else {
            _this.options = {};
          }
          return _this;
        }
        _Package_prototype = Package.prototype;
        Package.displayName = "Package";
        function withLeadingSlash(filepath) {
          if (filepath.charCodeAt(0) !== 47) {
            return "/" + filepath;
          } else {
            return filepath;
          }
        }
        function find(factories, name, fromFilepath) {
          var filepath;
          filepath = guessFilepath(name, fromFilepath);
          if (!__owns.call(factories, filepath)) {
            return __defer.rejected(EGSError("Cannot find '" + name + "' from '" + filepath + "', tried '" + filepath + "'"));
          } else {
            return __defer.fulfilled({
              filepath: filepath,
              compiled: { func: factories[filepath], isSimple: false }
            });
          }
        }
        function set(isSimple, filepath, generator, options) {
          var factories, factory;
          if (options == null) {
            options = {};
          }
          filepath = withLeadingSlash(filepath);
          factories = this.factories;
          if (isSimple) {
            factory = factories[filepath] = generator;
          } else {
            factory = factories[filepath] = __promise(generator);
          }
          this.templates[filepath] = makeTemplate(
            returnSame(__defer.fulfilled({ func: factory, isSimple: false })),
            makeHelpersFactory(
              __import(
                __import(
                  { __inPackage$: this, filename: filepath },
                  this.options
                ),
                options
              ),
              function (name, currentFilepath) {
                return find(factories, name, currentFilepath);
              }
            ),
            true
          );
        }
        _Package_prototype.set = function (filepath, generator, options) {
          if (options == null) {
            options = {};
          }
          set.call(
            this,
            false,
            filepath,
            generator,
            options
          );
          return this;
        };
        _Package_prototype.setSimple = function (filepath, generator, options) {
          if (options == null) {
            options = {};
          }
          set.call(
            this,
            true,
            filepath,
            generator,
            options
          );
          return this;
        };
        _Package_prototype.get = function (filepath) {
          var templates;
          filepath = withLeadingSlash(filepath);
          templates = this.templates;
          if (!__owns.call(templates, filepath)) {
            throw EGSError("Unknown filepath: '" + filepath + "'");
          } else {
            return templates[filepath];
          }
        };
        _Package_prototype.render = __promise(function (filepath, data) {
          var _e, _send, _state, _step, _this, _throw, template;
          _this = this;
          _state = 0;
          function _close() {
            _state = 2;
          }
          function _step(_received) {
            while (true) {
              switch (_state) {
              case 0:
                if (data == null) {
                  data = {};
                }
                template = _this.get(filepath);
                ++_state;
                return { done: false, value: template(data) };
              case 1:
                ++_state;
                return { done: true, value: _received };
              case 2:
                return { done: true, value: void 0 };
              default: throw new Error("Unknown state: " + _state);
              }
            }
          }
          function _throw(_e) {
            _close();
            throw _e;
          }
          function _send(_received) {
            try {
              return _step(_received);
            } catch (_e) {
              _throw(_e);
            }
          }
          return {
            close: _close,
            iterator: function () {
              return this;
            },
            next: function () {
              return _send(void 0);
            },
            send: _send,
            "throw": function (_e) {
              _throw(_e);
              return _send(void 0);
            }
          };
        });
        _Package_prototype.renderSync = function (filepath, data) {
          var template;
          if (data == null) {
            data = {};
          }
          template = this.get(filepath);
          return template.sync(data);
        };
        _Package_prototype.renderStream = function (filepath, data) {
          var template;
          if (data == null) {
            data = {};
          }
          template = this.get(filepath);
          return template.stream(data);
        };
        _Package_prototype.express = function () {
          var _this;
          _this = this;
          return function (path, data, callback) {
            __fromPromise(_this.render(path, data))(callback);
          };
        };
        return Package;
      }());
      function Stream() {
        var events;
        events = {};
        function complete(type, value) {
          var event;
          if (events) {
            event = events[type];
            events = null;
            if (event) {
              setImmediate(event, value);
            }
          }
        }
        return {
          send: function (value) {
            var event;
            if (events) {
              event = events.data;
              if (event) {
                event(value);
              }
            }
          },
          "throw": function (err) {
            complete("error", err);
          },
          end: function () {
            complete("end");
          },
          "public": {
            on: function (type, callback) {
              if (events) {
                events[type] = callback;
              }
              return this;
            }
          }
        };
      }
      module.exports = {
        version: "0.3.1",
        Package: Package,
        EGSError: EGSError,
        makeTemplate: makeTemplate,
        makeHelpersFactory: makeHelpersFactory,
        guessFilepath: guessFilepath,
        helperNames: (function () {
          var _arr, k;
          _arr = [];
          for (k in helpers) {
            if (__owns.call(helpers, k)) {
              _arr.push(k);
            }
          }
          return _arr;
        }())
      };
    }.call(this, typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this));
    

    return module.exports;
  };

  if (typeof define === "function" && define.amd) {
    define(_runtime);
  } else if (typeof module !== "undefined" && typeof require === "function") {
    module.exports = _runtime();
  } else {
    root.EGSRuntime = _runtime();
  }
}(this));