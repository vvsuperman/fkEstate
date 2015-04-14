(function (GLOBAL) {
  "use strict";
  var __defer, __generatorToPromise, __import, __isArray, __num, __owns,
      __slice, __strnum, __toArray, __toPromise, __typeof, argv, egs, filenames,
      fs, main, optimist, os, path, setImmediate;
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
  __num = function (num) {
    if (typeof num !== "number") {
      throw new TypeError("Expected a number, got " + __typeof(num));
    } else {
      return num;
    }
  };
  __owns = Object.prototype.hasOwnProperty;
  __slice = Array.prototype.slice;
  __strnum = function (strnum) {
    var type;
    type = typeof strnum;
    if (type === "string") {
      return strnum;
    } else if (type === "number") {
      return String(strnum);
    } else {
      throw new TypeError("Expected a string or number, got " + __typeof(strnum));
    }
  };
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
  __toPromise = function (func, context, args) {
    var _ref, fulfill, promise, reject;
    if (typeof func !== "function") {
      throw new TypeError("Expected func to be a Function, got " + __typeof(func));
    }
    _ref = __defer();
    promise = _ref.promise;
    reject = _ref.reject;
    fulfill = _ref.fulfill;
    _ref = null;
    func.apply(context, __toArray(args).concat([
      function (err, value) {
        if (err != null) {
          reject(err);
        } else {
          fulfill(value);
        }
      }
    ]));
    return promise;
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
  egs = require("./egs");
  fs = require("fs");
  path = require("path");
  os = require("os");
  optimist = require("optimist").usage("$0 [OPTIONS] path/to/template.egs", {
    help: { boolean: true, desc: "Show this help screen" },
    v: { alias: "version", boolean: true, desc: "EGS v" + __strnum(egs.version) },
    p: {
      alias: "package",
      boolean: true,
      desc: "Compile an EGS package to JavaScript and save as a .js file"
    },
    o: {
      alias: "output",
      string: true,
      desc: "Set the file for compiled JavaScript, otherwise use stdout"
    },
    s: { alias: "stdin", boolean: true, desc: "Listen for and compile EGS from stdin" },
    u: { alias: "uglify", boolean: true, desc: "Uglify compiled code with UglifyJS2" },
    m: { alias: "map", string: true, desc: "Build a SourceMap" },
    e: {
      alias: "export",
      string: true,
      desc: "The global exported to the browser when compiling a package, defaults to 'EGSTemplates'"
    },
    "include-runtime": {
      boolean: true,
      desc: "When compiling, include runtime in output (no-dependency mode)"
    },
    "source-root": {
      string: true,
      desc: "Specify a sourceRoot in a SourceMap, defaults to ''"
    },
    options: { string: true, desc: "a JSON object of options to pass into the compiler" },
    context: {
      string: true,
      desc: "a JSON object to pass as the context to an executed template"
    },
    coverage: { boolean: true, desc: "Instrument with _$jscoverage support" },
    tokens: {
      string: true,
      desc: "Default to '<%'-style tokens, can specify '{{' as an alternative"
    }
  });
  optimist.check(function (argv) {
    var _ref;
    function exclusive() {
      var _i, _len, found, opt, opts;
      opts = __slice.call(arguments);
      found = null;
      for (_i = 0, _len = opts.length; _i < _len; ++_i) {
        opt = opts[_i];
        if (opt === "_") {
          if (argv._.length) {
            if (!found) {
              found = "filenames";
            } else {
              throw "Cannot specify both " + __strnum(found) + " and filenames";
            }
          }
        } else if (argv[opt]) {
          if (!found) {
            found = "--" + __strnum(opt);
          } else {
            throw "Cannot specify both " + __strnum(found) + " and --" + __strnum(opt);
          }
        }
      }
    }
    function depend(mainOpt) {
      var _i, _len, opt, opts;
      opts = __slice.call(arguments, 1);
      if (argv[mainOpt]) {
        for (_i = 0, _len = opts.length; _i < _len; ++_i) {
          opt = opts[_i];
          if (!argv[opt]) {
            throw "Must specify --" + __strnum(opt) + " if specifying --" + __strnum(mainOpt);
          }
        }
      }
    }
    if (__num(argv._.length) > 1) {
      throw "Can only specify one filename or directory";
    }
    exclusive("nodes", "cov");
    exclusive("stdin", "package");
    exclusive("context", "package");
    depend("output", "_");
    depend("package", "_");
    depend("include-runtime", "package");
    depend("map", "output", "package");
    depend("source-root", "map");
    depend("uglify", "package");
    exclusive("stdin", "_");
    if (argv.map && typeof argv.map !== "string") {
      throw "Must specify a filename with --map";
    }
    if (argv.tokens && (_ref = argv.tokens) !== "<%" && _ref !== "{{") {
      throw "Unknown token: '" + __strnum(argv.tokens) + "', can only specify '<%' or '{{'";
    }
    if (argv.options) {
      try {
        if (typeof JSON.parse(argv.options) !== "object" || JSON.parse(argv.options) === null) {
          throw "Expected --options to provide an object";
        }
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw "Unable to parse options: " + __strnum(e.message);
        } else {
          throw e;
        }
      }
    }
    if (argv.context) {
      try {
        if (typeof JSON.parse(argv.context) !== "object" || JSON.parse(argv.context) === null) {
          throw "Expected --context to provide an object";
        }
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw "Unable to parse context: " + __strnum(e.message);
        } else {
          throw e;
        }
      }
    }
  });
  argv = optimist.argv;
  function readStdin() {
    var buffer, defer;
    defer = __defer();
    buffer = "";
    process.stdin.on("data", function (chunk) {
      return buffer += chunk.toString();
    });
    process.stdin.on("end", function () {
      return defer.fulfill(buffer);
    });
    process.stdin.resume();
    return defer.promise;
  }
  function readFile(filename) {
    return __toPromise(fs.readFile, fs, [filename, "utf8"]);
  }
  function writeFile(filename, text) {
    return __toPromise(fs.writeFile, fs, [filename, text, "utf8"]);
  }
  filenames = argv._;
  main = __generatorToPromise((function () {
    var _e, _send, _state, _step, _throw, code, context, e, gorilla, options,
        output, result, sourceDirectory, startTime, stat, text;
    _state = 0;
    function _close() {
      _state = 30;
    }
    function _step(_received) {
      while (true) {
        switch (_state) {
        case 0:
          _state = argv.help || !argv["package"] && !argv.stdin && !argv._.length && !argv.version ? 1 : 2;
          break;
        case 1:
          _state = 30;
          return { done: true, value: optimist.showHelp(console.log) };
        case 2:
          gorilla = require("gorillascript");
          _state = argv.version ? 3 : 4;
          break;
        case 3:
          _state = 30;
          return { done: true, value: console.log("EGS v" + __strnum(egs.version) + " on GorillaScript v" + __strnum(gorilla.version)) };
        case 4:
          options = {};
          if (argv.options) {
            __import(options, JSON.parse(argv.options));
          }
          if (argv.uglify) {
            options.undefinedName = "undefined";
            options.uglify = true;
          }
          if (argv.coverage) {
            options.coverage = true;
          }
          switch (argv.tokens) {
          case "{{":
            options.open = "{%";
            options.close = "%}";
            options.openWrite = "{{";
            options.closeWrite = "}}";
            options.openComment = "{#";
            options.closeComment = "#}";
            options.openLiteral = "{@";
            options.closeLiteral = "@}";
            break;
          }
          if (argv["export"]) {
            options.globalExport = argv["export"];
          }
          ++_state;
          return { done: false, value: gorilla.init() };
        case 5:
          _state = !argv["package"] ? 6 : 18;
          break;
        case 6:
          context = {};
          if (argv.context) {
            __import(context, JSON.parse(argv.context));
          }
          _state = argv.stdin ? 7 : 9;
          break;
        case 7:
          ++_state;
          return { done: false, value: readStdin() };
        case 8:
          code = _received;
          _state = 13;
          break;
        case 9:
          _state = argv._.length ? 10 : 12;
          break;
        case 10:
          ++_state;
          return { done: false, value: readFile(argv._[0]) };
        case 11:
          code = _received;
          _state = 13;
          break;
        case 12: throw new Error("Expected at least one filename by this point");
        case 13:
          _state = argv.output ? 14 : 17;
          break;
        case 14:
          ++_state;
          return {
            done: false,
            value: egs.render(code, options, context)
          };
        case 15:
          result = _received;
          ++_state;
          return {
            done: false,
            value: writeFile(argv.output, result)
          };
        case 16:
          _state = 30;
          return { done: true, value: _received };
        case 17:
          _state = 30;
          return {
            done: true,
            value: egs.renderStream(code, options, context).on("data", function (data) {
              return process.stdout.write(data);
            }).on("error", function (error) {
              return console.error(error != null && error.stack || error);
            })
          };
        case 18:
          sourceDirectory = argv._[0];
          ++_state;
        case 19:
          ++_state;
          return {
            done: false,
            value: __toPromise(fs.stat, fs, [sourceDirectory])
          };
        case 20:
          stat = _received;
          _state = 22;
          break;
        case 21:
          _state = 30;
          return { done: true, value: console.error("Unable to open " + __strnum(sourceDirectory) + ": " + String(e)) };
        case 22:
          _state = !stat.isDirectory() ? 23 : 24;
          break;
        case 23:
          _state = 30;
          return { done: true, value: console.error("Must provide a directory when using --package") };
        case 24:
          if (argv.output) {
            process.stdout.write("Compiling " + __strnum(path.basename(sourceDirectory)) + " ...");
          }
          startTime = Date.now();
          output = argv.output || path.join(os.tmpdir(), "egs-" + Math.random().toString(36).slice(2) + ".js");
          if (argv.map) {
            options.sourceMap = { file: argv.map, sourceRoot: argv["source-root"] || "" };
          }
          options.includeEgsRuntime = !!argv["include-runtime"];
          ++_state;
          return {
            done: false,
            value: egs.compilePackage(sourceDirectory, output, options)
          };
        case 25:
          _state = argv.output ? 26 : 27;
          break;
        case 26:
          _state = 30;
          return {
            done: true,
            value: process.stdout.write(" " + ((Date.now() - startTime) / 1000).toFixed(3) + " s\n")
          };
        case 27:
          ++_state;
          return { done: false, value: readFile(output) };
        case 28:
          text = _received;
          ++_state;
          return {
            done: false,
            value: __toPromise(fs.unlink, fs, [output])
          };
        case 29:
          ++_state;
          return { done: true, value: process.stdout.write(text) };
        case 30:
          return { done: true, value: void 0 };
        default: throw new Error("Unknown state: " + _state);
        }
      }
    }
    function _throw(_e) {
      if (_state === 19 || _state === 20) {
        e = _e;
        _state = 21;
      } else {
        _close();
        throw _e;
      }
    }
    function _send(_received) {
      while (true) {
        try {
          return _step(_received);
        } catch (_e) {
          _throw(_e);
        }
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
  main.then(null, function (e) {
    console.error(e != null && e.stack || e);
    return process.exit(1);
  });
}.call(this, typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this));
