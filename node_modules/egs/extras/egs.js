;(function (root) {
  "use strict";
  var _EGS = function (realRequire) {
    function require(path) {
      var has = Object.prototype.hasOwnProperty;
      if (has.call(require._cache, path)) {
        return require._cache[path];
      } else if (has.call(require, path)) {
        var func = require[path];
        delete require[path];
        return require._cache[path] = func.call({});
      } else if (realRequire) {
        return realRequire(path);
      }
    }
    require._cache = {};
    require['./egs'] = function () {
      var module = { exports: this };
      var exports = this;
      (function (GLOBAL) {
        "use strict";
        var __defer, __fromPromise, __generatorToPromise, __import, __in, __isArray,
            __owns, __promise, __promiseLoop, __slice, __toArray, __toPromise,
            __typeof, _ref, compile, compileCode, compileFile, compilePackage,
            EGSError, egsRuntime, egsRuntimeVersion, findAllExtensionedFilepaths,
            findAndCompileFile, fs, getAstPipe, getPreludeMacros, gorillascript,
            guessFilepath, makeHelpersFactory, makeTemplate, os, Package,
            packageFromDirectory, path, render, renderFile, setImmediate,
            standardHelperNames, withEgsPrelude, wrapModule_resolveFilename;
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
        __in = typeof Array.prototype.indexOf === "function"
          ? (function (indexOf) {
            return function (child, parent) {
              return indexOf.call(parent, child) !== -1;
            };
          }(Array.prototype.indexOf))
          : function (child, parent) {
            var i, len;
            len = +parent.length;
            i = -1;
            while (++i < len) {
              if (child === parent[i] && i in parent) {
                return true;
              }
            }
            return false;
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
        __promiseLoop = function (limit, length, body) {
          var _ref, done, fulfill, index, promise, reject, result, slotsUsed;
          if (typeof limit !== "number") {
            throw new TypeError("Expected limit to be a Number, got " + __typeof(limit));
          }
          if (typeof length !== "number") {
            throw new TypeError("Expected length to be a Number, got " + __typeof(length));
          }
          if (typeof body !== "function") {
            throw new TypeError("Expected body to be a Function, got " + __typeof(body));
          }
          if (limit < 1 || limit !== limit) {
            limit = 1/0;
          }
          result = [];
          done = false;
          slotsUsed = 0;
          _ref = __defer();
          fulfill = _ref.fulfill;
          reject = _ref.reject;
          promise = _ref.promise;
          _ref = null;
          index = 0;
          function handle(index) {
            ++slotsUsed;
            return body(index).then(
              function (value) {
                result[index] = value;
                --slotsUsed;
                return flush();
              },
              function (reason) {
                done = true;
                return reject(reason);
              }
            );
          }
          function flush() {
            for (; !done && slotsUsed < limit && index < length; ++index) {
              handle(index);
            }
            if (!done && index >= length && slotsUsed === 0) {
              done = true;
              return fulfill(result);
            }
          }
          setImmediate(flush);
          return promise;
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
        fs = require("fs");
        os = require("os");
        path = require("path");
        function amdRequire(localName, amdName, globalName) {
          var library;
          library = require(localName);
          if (library) {
            return library;
          } else if (typeof define === "function" && define.amd) {
            return realRequire(amdName);
          } else if (typeof root === "object" && root !== null) {
            library = root[globalName];
            if (!library) {
              throw new Error(globalName + " must be available before EGS is loaded");
            }
            return library;
          } else {
            throw new Error("Unable to detect runtime environment of EGS");
          }
        }
        egsRuntime = amdRequire("./runtime", "egs-runtime", "EGSRuntime");
        Package = egsRuntime.Package;
        EGSError = egsRuntime.EGSError;
        guessFilepath = egsRuntime.guessFilepath;
        standardHelperNames = egsRuntime.helperNames;
        makeTemplate = egsRuntime.makeTemplate;
        makeHelpersFactory = egsRuntime.makeHelpersFactory;
        egsRuntimeVersion = egsRuntime.version;
        if (egsRuntimeVersion !== "0.3.1") {
          throw new Error("EGS and its runtime must have the same version: '0.3.1' vs. '" + egsRuntimeVersion + "'");
        }
        gorillascript = amdRequire("gorillascript", "gorillascript", "GorillaScript");
        function memoize(func) {
          var result;
          return function () {
            if (func) {
              result = func();
              func = null;
            }
            return result;
          };
        }
        _ref = (function () {
          var egsPreludeCode, getEgsPreludeP, preludePathCache;
          getEgsPreludeP = memoize(__promise(function () {
            var _e, _send, _state, _step, _throw, result, text;
            _state = 0;
            function _close() {
              _state = 5;
            }
            function _step(_received) {
              while (true) {
                switch (_state) {
                case 0:
                  text = egsPreludeCode;
                  _state = text ? 3 : 1;
                  break;
                case 1:
                  ++_state;
                  return {
                    done: false,
                    value: __toPromise(fs.readFile, fs, [__dirname + "/../src/egs-prelude.gs", "utf8"])
                  };
                case 2:
                  text = _received;
                  ++_state;
                case 3:
                  ++_state;
                  return { done: false, value: gorillascript.parse(text) };
                case 4:
                  result = _received;
                  ++_state;
                  return { done: true, value: result.macros };
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
          preludePathCache = {};
          return [
            function (preludePath) {
              var egsPreludeP;
              if (preludePath == null) {
                preludePath = null;
              }
              egsPreludeP = getEgsPreludeP();
              if (!preludePath) {
                return egsPreludeP;
              } else {
                return preludePathCache[preludePath] || (preludePathCache[preludePath] = __generatorToPromise((function () {
                  var _e, _send, _state, _step, _throw, egsPrelude, result, text;
                  _state = 0;
                  function _close() {
                    _state = 4;
                  }
                  function _step(_received) {
                    while (true) {
                      switch (_state) {
                      case 0:
                        ++_state;
                        return { done: false, value: egsPreludeP };
                      case 1:
                        egsPrelude = _received;
                        ++_state;
                        return {
                          done: false,
                          value: __toPromise(fs.readFile, fs, [preludePath, "utf8"])
                        };
                      case 2:
                        text = _received;
                        ++_state;
                        return {
                          done: false,
                          value: gorillascript.parse(text, { macros: egsPrelude })
                        };
                      case 3:
                        result = _received;
                        ++_state;
                        return { done: true, value: result.macros };
                      case 4:
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
                }())));
              }
            },
            function (code) {
              egsPreludeCode = code;
              return this;
            }
          ];
        }());
        getPreludeMacros = _ref[0];
        withEgsPrelude = _ref[1];
        _ref = null;
        getAstPipe = (function () {
          var ast;
          ast = gorillascript.AST;
          function isCall(node, functionName) {
            var func;
            if (node instanceof ast.Call) {
              func = node.func;
              return func instanceof ast.Ident && func.name === functionName;
            }
          }
          function isContextCall(node, functionName) {
            var func, left, right;
            if (node instanceof ast.Call) {
              func = node.func;
              if (func instanceof ast.Binary && func.op === ".") {
                left = func.left;
                right = func.right;
                return left instanceof ast.Ident && left.name === "context" && right.isConst() && right.constValue() === functionName;
              }
            }
            return false;
          }
          function convertWriteCallToWrite(node) {
            var func;
            if (node instanceof ast.Call) {
              func = node.func;
              if (func instanceof ast.Binary && func.op === "." && func.left instanceof ast.Ident && func.left.name === "write" && func.right.isConst()) {
                switch (func.right.constValue()) {
                case "call":
                  return ast.Block(node.pos, [
                    node.args[0],
                    ast.Call(node.pos, func.left, __slice.call(node.args, 1))
                  ]);
                case "apply":
                  return ast.Block(node.pos, [
                    node.args[0],
                    node.args[1].isNoop()
                      ? ast.Call(node.pos, func.left, [
                        ast.IfExpression(
                          node.args[1].pos,
                          ast.Access(node.args[1].pos, node.args[1], ast.Const(node.args[1], 1)),
                          ast.Call(
                            node.pos,
                            ast.Access(
                              node.pos,
                              ast.Ident(node.pos, "context"),
                              ast.Const(node.pos, "escape")
                            ),
                            [
                              ast.Access(node.args[1].pos, node.args[1], ast.Const(node.args[1], 0))
                            ]
                          ),
                          ast.Access(node.args[1].pos, node.args[1], ast.Const(node.args[1], 0))
                        )
                      ])
                      : ast.Call(node.pos, func.left, [
                        ast.Call(
                          node.args[1].pos,
                          ast.Access(
                            node.pos,
                            ast.Ident(node.pos, "context"),
                            ast.Const(node.args[1].pos, "__maybeEscape")
                          ),
                          [
                            ast.Access(
                              node.pos,
                              ast.Ident(node.pos, "context"),
                              ast.Const(node.pos, "escape")
                            ),
                            node.args[1]
                          ]
                        )
                      ])
                  ]);
                default: return;
                }
              }
            }
          }
          function convertWriteTrueToWriteEscape(node) {
            if (isCall(node, "write") && node.args.length === 2 && node.args[1].isConst() && node.args[1].constValue()) {
              return ast.Call(node.pos, node.func, [
                ast.Call(
                  node.pos,
                  ast.Access(
                    node.pos,
                    ast.Ident(node.pos, "context"),
                    ast.Const(node.pos, "escape")
                  ),
                  [node.args[0]]
                )
              ]);
            }
          }
          function unwrapEscapeH(node) {
            var arg;
            if (isContextCall(node, "escape") && node.args.length === 1) {
              arg = node.args[0];
              if (arg && (isContextCall(arg, "h") || isContextCall(arg, "html")) && arg.args.length === 1) {
                return arg.args[0];
              }
            }
          }
          function canBeNumeric(node) {
            var _ref;
            if (node.isConst()) {
              return typeof node.constValue() !== "string";
            } else if (node instanceof ast.Binary) {
              if (node.op === "+") {
                return canBeNumeric(node.left) && canBeNumeric(node.right);
              } else {
                return true;
              }
            } else if (node instanceof ast.IfExpression) {
              return canBeNumeric(node.whenTrue) || canBeNumeric(node.whenFalse);
            } else if (node instanceof ast.BlockExpression || node instanceof ast.BlockStatement) {
              return canBeNumeric((_ref = node.body)[_ref.length - 1]);
            } else {
              return !isContextCall(node, "escape");
            }
          }
          function mergeWrites(node) {
            var _arr, _len, body, changed, i, left, newSubnode, right, subnode,
                whenFalse, whenTrue;
            if (node instanceof ast.BlockExpression || node instanceof ast.BlockStatement) {
              body = node.body.slice();
              changed = false;
              for (_arr = __toArray(body), i = 0, _len = _arr.length; i < _len; ++i) {
                subnode = _arr[i];
                body[i] = newSubnode = subnode.walkWithThis(mergeWrites);
                if (newSubnode !== subnode) {
                  changed = true;
                }
              }
              i = 0;
              while (i < body.length - 1) {
                left = body[i];
                right = body[i + 1];
                if (isCall(left, "write") && left.args.length === 1 && isCall(right, "write") && right.args.length === 1) {
                  changed = true;
                  body.splice(i, 2, ast.Call(left.pos, left.func, [
                    ast.Binary(
                      left.pos,
                      canBeNumeric(left.args[0]) && canBeNumeric(right.args[0])
                        ? ast.Binary(
                          left.pos,
                          ast.Const(left.pos, ""),
                          "+",
                          left.args[0]
                        )
                        : left.args[0],
                      "+",
                      right.args[0]
                    )
                  ]));
                } else {
                  ++i;
                }
              }
              if (changed) {
                return ast.Block(node.pos, body, node.label);
              }
            } else if ((node instanceof ast.IfStatement || node instanceof ast.IfExpression) && !node.label) {
              whenTrue = node.whenTrue.walkWithThis(mergeWrites);
              whenFalse = node.whenFalse.walkWithThis(mergeWrites);
              if (isCall(whenTrue, "write") && (isCall(whenFalse, "write") || whenFalse.isNoop())) {
                return ast.Call(node.pos, whenTrue.func, [
                  ast.IfExpression(node.pos, node.test.walkWithThis(mergeWrites), whenTrue.args[0], whenFalse.isNoop() ? ast.Const(whenFalse.pos, "") : whenFalse.args[0])
                ]);
              }
            }
          }
          function hasExtends(node) {
            var FOUND;
            FOUND = {};
            try {
              node.walk(function (subnode) {
                if (subnode instanceof ast.Func) {
                  return subnode;
                } else if (isContextCall(subnode, "extends")) {
                  throw FOUND;
                }
              });
            } catch (e) {
              if (e === FOUND) {
                return true;
              } else {
                throw e;
              }
            }
            return false;
          }
          function removeWritesInFunction(node) {
            if (node instanceof ast.Func) {
              return node;
            } else if (isCall(node, "write")) {
              return ast.Noop(node.pos);
            }
          }
          function removeWritesAfterExtends(node) {
            if (node instanceof ast.Func && hasExtends(node)) {
              return node.walk(removeWritesInFunction);
            }
          }
          function convertWriteToStringConcat(node) {
            if (isCall(node, "write")) {
              return ast.Binary(node.pos, node.func, "+=", node.args[0]).walk(convertWriteToStringConcat);
            }
          }
          function prepend(left, node) {
            if (node instanceof ast.Binary && node.op === "+") {
              return ast.Binary(
                left.pos,
                prepend(left, node.left),
                "+",
                node.right
              );
            } else {
              return ast.Binary(left.pos, left, "+", node);
            }
          }
          function convertLastWrite(node) {
            var _ref, beforeLast, last;
            if (node instanceof ast.BlockStatement) {
              last = (_ref = node.body)[_ref.length - 1];
              if (last instanceof ast.Return && last.node instanceof ast.Ident && last.node.name === "write") {
                beforeLast = (_ref = node.body)[_ref.length - 2];
                if (beforeLast && beforeLast instanceof ast.Binary && beforeLast.op === "+=" && beforeLast.left instanceof ast.Ident && beforeLast.left.name === "write") {
                  return ast.BlockStatement(
                    node.pos,
                    __toArray(__slice.call(node.body, 0, -2)).concat([
                      ast.Return(beforeLast.pos, prepend(beforeLast.left, beforeLast.right))
                    ]),
                    node.label
                  );
                }
              }
            }
          }
          function removeContextNullCheck(node) {
            if (node instanceof ast.Binary && node.op === "==" && node.left instanceof ast.Ident && node.left.name === "context" && node.right.isConst() && node.right.constValue() == null) {
              return ast.Const(node.pos, false);
            }
          }
          function changeContextToHelpers(helperNames) {
            return function (node) {
              if (node instanceof ast.Binary && node.op === "." && node.left instanceof ast.Ident && node.left.name === "context" && node.right.isConst() && __in(node.right.constValue(), helperNames)) {
                return ast.Binary(
                  node.pos,
                  ast.Ident(node.left.pos, "helpers"),
                  ".",
                  node.right
                );
              }
            };
          }
          function addHelpersToParams(node) {
            if (node instanceof ast.Func && node.params.length === 2 && node.params[0].name === "write" && node.params[1].name === "context") {
              return ast.Func(
                node.pos,
                node.name,
                [
                  node.params[0],
                  node.params[1],
                  ast.Ident(node.pos, "helpers")
                ],
                node.variables,
                node.body,
                node.declarations
              );
            }
          }
          function addFlushToGeneratorReturn(node) {
            var _ref, lastStatement, pos;
            if (node instanceof ast.Func && node.params.length === 3 && node.params[0].name === "write" && node.params[1].name === "context" && node.params[2].name === "helpers" && node.body instanceof ast.BlockStatement) {
              lastStatement = (_ref = node.body.body)[_ref.length - 1];
              if (lastStatement instanceof ast.Return && lastStatement.node instanceof ast.Obj) {
                pos = lastStatement.pos;
                return ast.Func(
                  node.pos,
                  node.name,
                  node.params,
                  node.variables,
                  ast.BlockStatement(node.body.pos, __toArray(__slice.call(node.body.body, 0, -1)).concat([
                    ast.Return(pos, ast.Obj(lastStatement.node.pos, __toArray(lastStatement.node.elements).concat([
                      ast.Obj.Pair(pos, "flush", ast.Func(
                        pos,
                        null,
                        [],
                        ["flushed"],
                        ast.Block(pos, [
                          ast.Assign(
                            pos,
                            ast.Ident(pos, "flushed"),
                            ast.Ident(pos, "write")
                          ),
                          ast.Assign(
                            pos,
                            ast.Ident(pos, "write"),
                            ast.Const(pos, "")
                          ),
                          ast.Return(pos, ast.Ident(pos, "flushed"))
                        ])
                      ))
                    ])))
                  ])),
                  node.declarations
                );
              }
            }
          }
          function remove__generatorWrap(node, parent) {
            var subnode;
            if (isCall(node, "__generator")) {
              subnode = node.args[0];
              if (subnode instanceof ast.Func && subnode.params.length === 3 && subnode.params[0].name === "write" && subnode.params[1].name === "context" && subnode.params[2].name === "helpers") {
                return subnode;
              }
            }
          }
          return function (helperNames) {
            return function (root) {
              return root.walk(convertWriteCallToWrite).walk(convertWriteTrueToWriteEscape).walk(unwrapEscapeH).walk(mergeWrites).walk(removeWritesAfterExtends).walk(convertWriteToStringConcat).walk(convertLastWrite).walk(removeContextNullCheck).walk(changeContextToHelpers(helperNames)).walk(addHelpersToParams).walk(addFlushToGeneratorReturn).walk(remove__generatorWrap);
            };
          };
        }());
        compileCode = __promise(function (egsCode, compileOptions, helperNames) {
          var _e, _err, _ref, _send, _state, _step, _throw, _tmp, astPipe, code,
              isGenerator, macros, options;
          _state = 0;
          function _close() {
            _state = 7;
          }
          function _step(_received) {
            while (true) {
              switch (_state) {
              case 0:
                ++_state;
                return { done: false, value: getPreludeMacros(compileOptions.prelude) };
              case 1:
                macros = _received;
                astPipe = getAstPipe(helperNames);
                _ref = __import({}, compileOptions);
                _ref.embedded = true;
                _ref.noindent = true;
                _ref.macros = macros;
                _ref.prelude = null;
                _ref.astPipe = astPipe;
                options = _ref;
                isGenerator = false;
                ++_state;
              case 2:
                ++_state;
                return {
                  done: false,
                  value: gorillascript.compile(egsCode, options)
                };
              case 3:
                _tmp = _received;
                code = _tmp.code;
                _state = 6;
                break;
              case 4:
                options.embeddedGenerator = true;
                isGenerator = true;
                ++_state;
                return {
                  done: false,
                  value: gorillascript.compile(egsCode, options)
                };
              case 5:
                _tmp = _received;
                code = _tmp.code;
                ++_state;
              case 6:
                ++_state;
                return {
                  done: true,
                  value: { isGenerator: isGenerator, code: code }
                };
              case 7:
                return { done: true, value: void 0 };
              default: throw new Error("Unknown state: " + _state);
              }
            }
          }
          function _throw(_e) {
            if (_state === 2 || _state === 3) {
              _err = _e;
              _state = 4;
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
        });
        function generatorToPromiseWithStreaming(generator, streamSend) {
          function continuer(verb, arg) {
            var item, text;
            try {
              item = generator[verb](arg);
            } catch (e) {
              return __defer.rejected(e);
            }
            if (item.done) {
              return __defer.fulfilled(item.value);
            } else {
              text = generator.flush();
              if (text) {
                try {
                  streamSend(text);
                } catch (e) {
                  return __defer.rejected(e);
                }
              }
              return item.value.then(callback, errback, true);
            }
          }
          function callback(value) {
            return continuer("send", value);
          }
          function errback(value) {
            return continuer("throw", value);
          }
          return callback(void 0);
        }
        compile = __promise(function (egsCode, compileOptions, helperNames) {
          var _e, _ref, _send, _state, _step, _throw, code, factory, isGenerator,
              promiseFactory;
          _state = 0;
          function _close() {
            _state = 2;
          }
          function _step(_received) {
            while (true) {
              switch (_state) {
              case 0:
                ++_state;
                return {
                  done: false,
                  value: compileCode(egsCode, compileOptions, helperNames)
                };
              case 1:
                _ref = _received;
                isGenerator = _ref.isGenerator;
                code = _ref.code;
                _ref = null;
                ++_state;
                return {
                  done: true,
                  value: {
                    func: isGenerator
                      ? (factory = Function("return " + code)(), promiseFactory = __promise(factory), promiseFactory.stream = function (streamSend) {
                        var args, generator;
                        args = __slice.call(arguments, 1);
                        generator = factory.apply(this, args);
                        if (generator.flush) {
                          return generatorToPromiseWithStreaming(generator, streamSend);
                        } else {
                          return __generatorToPromise(generator);
                        }
                      }, promiseFactory)
                      : Function("return " + code)(),
                    isSimple: (function () {
                      var _arr, _every, _i, _len, special;
                      _every = true;
                      for (_arr = ["extends", "partial", "block"], _i = 0, _len = _arr.length; _i < _len; ++_i) {
                        special = _arr[_i];
                        if (code.indexOf("helpers." + special) !== -1 || code.indexOf('helpers["' + special + '"]') !== -1) {
                          _every = false;
                          break;
                        }
                      }
                      return _every;
                    }())
                  }
                };
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
        function makeCacheKey(options) {
          return (options.open || "\u0000") + "\u0000" + (options.openWrite || "\u0000") + "\u0000" + (options.openComment || "\u0000") + "\u0000" + (options.openLiteral || "\u0000") + "\u0000" + (options.close || "\u0000") + "\u0000" + (options.closeWrite || "\u0000") + "\u0000" + (options.closeComment || "\u0000") + "\u0000" + (options.closeLiteral || "\u0000") + "\u0000" + String(options.cache) + "\u0000" + (options.prelude || "\u0000");
        }
        function returnSame(value) {
          return function () {
            return value;
          };
        }
        compileFile = (function () {
          var cache;
          cache = {};
          return function (filepath, compileOptions, helperNames) {
            var _ref, innerCache;
            innerCache = cache[filepath] || (cache[filepath] = {});
            return innerCache[_ref = makeCacheKey(compileOptions) + "\u0000" + helperNames.join("\u0000")] || (innerCache[_ref] = (function () {
              var currentCompilationP, currentTimeP, recompileFile, retime;
              recompileFile = __promise(function () {
                var _e, _send, _state, _step, _throw, egsCode;
                _state = 0;
                function _close() {
                  _state = 3;
                }
                function _step(_received) {
                  while (true) {
                    switch (_state) {
                    case 0:
                      ++_state;
                      return {
                        done: false,
                        value: __toPromise(fs.readFile, fs, [filepath, "utf8"])
                      };
                    case 1:
                      egsCode = _received;
                      ++_state;
                      return {
                        done: false,
                        value: compile(egsCode, compileOptions, helperNames)
                      };
                    case 2:
                      ++_state;
                      return { done: true, value: _received };
                    case 3:
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
              if (compileOptions.cache) {
                return returnSame(recompileFile());
              } else {
                retime = __promise(function () {
                  var _e, _send, _state, _step, _throw, stat;
                  _state = 0;
                  function _close() {
                    _state = 2;
                  }
                  function _step(_received) {
                    while (true) {
                      switch (_state) {
                      case 0:
                        ++_state;
                        return {
                          done: false,
                          value: __toPromise(fs.stat, fs, [filepath])
                        };
                      case 1:
                        stat = _received;
                        ++_state;
                        return { done: true, value: stat.mtime.getTime() };
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
                currentCompilationP = recompileFile();
                currentTimeP = retime();
                return __promise(function () {
                  var _e, _send, _state, _step, _throw, _tmp, newTimeP;
                  _state = 0;
                  function _close() {
                    _state = 4;
                  }
                  function _step(_received) {
                    while (true) {
                      switch (_state) {
                      case 0:
                        newTimeP = retime();
                        ++_state;
                        return { done: false, value: currentTimeP };
                      case 1:
                        _tmp = _received;
                        ++_state;
                        return { done: false, value: newTimeP };
                      case 2:
                        _tmp = _tmp !== _received;
                        if (_tmp) {
                          currentCompilationP = recompileFile();
                          currentTimeP = newTimeP;
                        }
                        ++_state;
                        return { done: false, value: currentCompilationP };
                      case 3:
                        ++_state;
                        return { done: true, value: _received };
                      case 4:
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
              }
            }()));
          };
        }());
        findAndCompileFile = __promise(function (name, fromFilepath, compileOptions, helperNames) {
          var _e, _send, _state, _step, _throw, compiled, filepath;
          _state = 0;
          function _close() {
            _state = 2;
          }
          function _step(_received) {
            while (true) {
              switch (_state) {
              case 0:
                if (compileOptions == null) {
                  compileOptions = {};
                }
                filepath = guessFilepath(name, fromFilepath);
                ++_state;
                return {
                  done: false,
                  value: compileFile(filepath, compileOptions, helperNames)()
                };
              case 1:
                compiled = _received;
                ++_state;
                return {
                  done: true,
                  value: { filepath: filepath, compiled: compiled }
                };
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
        function getCompileOptions(options) {
          if (options == null) {
            options = {};
          }
          return {
            filename: options.filename,
            embeddedOpen: options.open,
            embeddedOpenWrite: options.openWrite,
            embeddedOpenComment: options.openComment,
            embeddedOpenLiteral: options.openLiteral,
            embeddedClose: options.close,
            embeddedCloseWrite: options.closeWrite,
            embeddedCloseComment: options.closeComment,
            embeddedCloseLiteral: options.closeLiteral,
            prelude: options.prelude,
            cache: options.cache,
            undefinedName: options.undefinedName,
            uglify: options.uglify
          };
        }
        function siftOptions(options) {
          return {
            filename: options.filename,
            open: options.open,
            openWrite: options.openWrite,
            openComment: options.openComment,
            openLiteral: options.openLiteral,
            close: options.close,
            closeWrite: options.closeWrite,
            closeComment: options.closeComment,
            closeLiteral: options.closeLiteral,
            cache: options.cache,
            escape: options.escape,
            partialPrefix: options.partialPrefix,
            prelude: options.prelude,
            context: null
          };
        }
        function getHelperNames(options) {
          var context, k, result;
          if (__owns.call(options, "context")) {
            context = options.context;
          } else {
            context = options;
          }
          result = ["escape", "extends", "partial", "block"].concat(__toArray(standardHelperNames));
          if (context) {
            for (k in context) {
              if (__owns.call(context, k) && !__in(k, result)) {
                result.push(k);
              }
            }
          }
          return result.sort();
        }
        function compileTemplateFromTextOrFile(isFilepath, egsCodeOrFilepath, options) {
          var compileOptions, helperNames;
          if (isFilepath == null) {
            isFilepath = false;
          }
          if (options == null) {
            options = { context: null };
          }
          helperNames = getHelperNames(options);
          compileOptions = getCompileOptions(options);
          return makeTemplate(
            isFilepath ? compileFile(egsCodeOrFilepath, compileOptions, helperNames)
              : returnSame(compile(egsCodeOrFilepath, compileOptions, helperNames)),
            makeHelpersFactory(options, function (name, currentFilepath) {
              return findAndCompileFile.maybeSync(name, currentFilepath, compileOptions, helperNames);
            }),
            isFilepath ? options.cache : true
          );
        }
        function compileTemplate(egsCode, options) {
          if (options == null) {
            options = { context: null };
          }
          return compileTemplateFromTextOrFile(false, egsCode, options);
        }
        function compileTemplateFromFile(filepath, options) {
          if (options == null) {
            options = { context: null };
          }
          options.filename = filepath;
          return compileTemplateFromTextOrFile(true, filepath, options);
        }
        render = __promise(function (egsCode, options, context) {
          var _e, _send, _state, _step, _throw, template;
          _state = 0;
          function _close() {
            _state = 2;
          }
          function _step(_received) {
            while (true) {
              switch (_state) {
              case 0:
                if (options == null) {
                  options = { context: null };
                }
                template = compileTemplate(egsCode, siftOptions(options));
                if (!context) {
                  if (__owns.call(options, "context")) {
                    context = options.context;
                  } else {
                    context = options;
                  }
                }
                ++_state;
                return { done: false, value: template.maybeSync(context) };
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
        function renderStream(egsCode, options, context) {
          var template;
          if (options == null) {
            options = { context: null };
          }
          template = compileTemplate(egsCode, siftOptions(options));
          if (!context) {
            if (__owns.call(options, "context")) {
              context = options.context;
            } else {
              context = options;
            }
          }
          return template.stream(context);
        }
        renderFile = __promise(function (filepath, options, context) {
          var _e, _send, _state, _step, _throw, template;
          _state = 0;
          function _close() {
            _state = 2;
          }
          function _step(_received) {
            while (true) {
              switch (_state) {
              case 0:
                if (options == null) {
                  options = { context: null };
                }
                options.filename = filepath;
                template = compileTemplateFromFile(filepath, siftOptions(options));
                if (!context) {
                  if (__owns.call(options, "context")) {
                    context = options.context;
                  } else {
                    context = options;
                  }
                }
                ++_state;
                return { done: false, value: template.maybeSync(context) };
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
        function renderFileStream(filepath, options, context) {
          var template;
          if (options == null) {
            options = { context: null };
          }
          options.filename = filepath;
          template = compileTemplateFromFile(filepath, siftOptions(options));
          if (!context) {
            if (__owns.call(options, "context")) {
              context = options.context;
            } else {
              context = options;
            }
          }
          return template.stream(context);
        }
        function express(path, options, callback) {
          if (options == null) {
            options = { context: null };
          }
          __fromPromise(renderFile(path, options))(callback);
        }
        findAllExtensionedFilepaths = __promise(function (dirpath, ext) {
          var _e, _send, _state, _step, _throw, paths, result;
          _state = 0;
          function _close() {
            _state = 3;
          }
          function _step(_received) {
            while (true) {
              switch (_state) {
              case 0:
                ++_state;
                return {
                  done: false,
                  value: __toPromise(fs.readdir, fs, [dirpath])
                };
              case 1:
                paths = _received;
                result = [];
                ++_state;
                return {
                  done: false,
                  value: __promiseLoop(3, +paths.length, __promise(function (_i) {
                    var _arr, _e2, _send2, _state2, _step2, _throw2, joinedPath, p,
                        stat;
                    _state2 = 0;
                    function _close2() {
                      _state2 = 6;
                    }
                    function _step2(_received) {
                      while (true) {
                        switch (_state2) {
                        case 0:
                          p = paths[_i];
                          joinedPath = path.join(dirpath, p);
                          ++_state2;
                          return {
                            done: false,
                            value: __toPromise(fs.stat, fs, [joinedPath])
                          };
                        case 1:
                          stat = _received;
                          _state2 = stat.isDirectory() ? 2 : 4;
                          break;
                        case 2:
                          _arr = [];
                          ++_state2;
                          return {
                            done: false,
                            value: findAllExtensionedFilepaths(joinedPath, ext)
                          };
                        case 3:
                          _arr.push.apply(_arr, __toArray(_received));
                          _state2 = 6;
                          return {
                            done: true,
                            value: result.push.apply(result, _arr)
                          };
                        case 4:
                          _state2 = stat.isFile() && path.extname(p) === ext ? 5 : 6;
                          break;
                        case 5:
                          ++_state2;
                          return { done: true, value: result.push(joinedPath) };
                        case 6:
                          return { done: true, value: void 0 };
                        default: throw new Error("Unknown state: " + _state2);
                        }
                      }
                    }
                    function _throw2(_e2) {
                      _close2();
                      throw _e2;
                    }
                    function _send2(_received) {
                      try {
                        return _step2(_received);
                      } catch (_e2) {
                        _throw2(_e2);
                      }
                    }
                    return {
                      close: _close2,
                      iterator: function () {
                        return this;
                      },
                      next: function () {
                        return _send2(void 0);
                      },
                      send: _send2,
                      "throw": function (_e2) {
                        _throw2(_e2);
                        return _send2(void 0);
                      }
                    };
                  }))
                };
              case 2:
                ++_state;
                return { done: true, value: result.sort() };
              case 3:
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
        compilePackage = __promise(function (inputDirpath, outputFilepath, options) {
          var _e, _send, _state, _step, _throw, astPipe, dirstat, includeEgsRuntime,
              inputFilepaths, macros, runtimeCode;
          _state = 0;
          function _close() {
            _state = 9;
          }
          function fullAstPipe(root, _p, ast) {
            var filesAssigned;
            filesAssigned = {};
            function isDoWrap(node) {
              var _ref;
              return node instanceof ast.Call && (node.func instanceof ast.Func || node.func instanceof ast.Binary && node.func.op === "." && node.func.left instanceof ast.Func && node.func.right.isConst() && ((_ref = node.func.right.constValue()) === "call" || _ref === "apply"));
            }
            function unwrapDoWrap(node) {
              while (isDoWrap(node)) {
                if (node.func instanceof ast.Func) {
                  node = node.func.body;
                } else {
                  node = node.func.left.body;
                }
              }
              return node;
            }
            function lastNode(node) {
              var _ref;
              if (node instanceof ast.BlockStatement || node instanceof ast.BlockExpression) {
                return (_ref = node.body)[_ref.length - 1];
              } else {
                return node;
              }
            }
            function isReturningGenerator(node) {
              var funcReturn;
              node = lastNode(unwrapDoWrap(node));
              if (node instanceof ast.Return && node.node instanceof ast.Func) {
                funcReturn = lastNode(unwrapDoWrap(node.node.body));
                if (funcReturn instanceof ast.Return && !(funcReturn.node instanceof ast.Obj)) {
                  return false;
                }
              }
              return true;
            }
            function assignFiles(node) {
              if (node.pos.file && !__owns.call(filesAssigned, node.pos.file) && isDoWrap(node)) {
                filesAssigned[node.pos.file] = true;
                return ast.Call(
                  node.pos,
                  ast.Access(
                    node.pos,
                    ast.Ident(node.pos, "templates"),
                    ast.Const(node.pos, isReturningGenerator(node) ? "set" : "setSimple")
                  ),
                  [
                    ast.Const(node.pos, path.relative(inputDirpath, node.pos.file)),
                    node
                  ]
                );
              }
            }
            root = astPipe(root).walk(assignFiles);
            if (includeEgsRuntime) {
              return ast.Root(
                root.pos,
                ast.Call(
                  root.pos,
                  ast.Access(
                    root.pos,
                    ast.Func(
                      root.pos,
                      null,
                      [ast.Ident(root.pos, "factory")],
                      [],
                      ast.IfStatement(
                        root.pos,
                        ast.And(
                          root.pos,
                          ast.Binary(
                            root.pos,
                            ast.Unary(root.pos, "typeof", ast.Ident(root.pos, "module")),
                            "!==",
                            ast.Const(root.pos, "undefined")
                          ),
                          ast.Access(
                            root.pos,
                            ast.Ident(root.pos, "module"),
                            ast.Const(root.pos, "exports")
                          )
                        ),
                        ast.Assign(
                          root.pos,
                          ast.Access(
                            root.pos,
                            ast.Ident(root.pos, "module"),
                            ast.Const(root.pos, "exports")
                          ),
                          ast.Call(root.pos, ast.Ident(root.pos, "factory"))
                        ),
                        ast.IfStatement(
                          root.pos,
                          ast.And(
                            root.pos,
                            ast.Binary(
                              root.pos,
                              ast.Unary(root.pos, "typeof", ast.Ident(root.pos, "define")),
                              "===",
                              ast.Const(root.pos, "function")
                            ),
                            ast.Access(
                              root.pos,
                              ast.Ident(root.pos, "define"),
                              ast.Const(root.pos, "amd")
                            )
                          ),
                          ast.Call(
                            root.pos,
                            ast.Ident(root.pos, "define"),
                            [ast.Ident(root.pos, "factory")]
                          ),
                          ast.Assign(
                            root.pos,
                            ast.Access(root.pos, ast.This(root.pos), ast.Const(root.pos, options.globalExport || "EGSTemplates")),
                            ast.Call(root.pos, ast.Ident(root.pos, "factory"))
                          )
                        )
                      )
                    ),
                    ast.Const(root.pos, "call")
                  ),
                  [
                    ast.This(root.pos),
                    ast.Func(
                      root.pos,
                      null,
                      [],
                      ["templates", "EGSRuntime"],
                      ast.Block(root.pos, [
                        ast.Assign(
                          root.pos,
                          ast.Ident(root.pos, "EGSRuntime"),
                          ast.Eval(root.pos, ("(function () {\n  var exports = {};\n  var module = { exports: exports };\n\n  " + runtimeCode.split("\n").join("\n  ") + "\n\n  return module.exports;\n}.call(this))").split("\n").join("\n  "))
                        ),
                        ast.Assign(
                          root.pos,
                          ast.Ident(root.pos, "templates"),
                          ast.Call(
                            root.pos,
                            ast.Access(
                              root.pos,
                              ast.Ident(root.pos, "EGSRuntime"),
                              ast.Const(root.pos, "Package")
                            ),
                            [ast.Const(root.pos, "0.3.1")]
                          )
                        ),
                        root.body,
                        ast.Return(root.pos, ast.Ident(root.pos, "templates"))
                      ])
                    )
                  ]
                ),
                [],
                []
              );
            } else {
              return ast.Root(
                root.pos,
                ast.Call(
                  root.pos,
                  ast.Access(
                    root.pos,
                    ast.Func(
                      root.pos,
                      null,
                      [ast.Ident(root.pos, "factory")],
                      [],
                      ast.IfStatement(
                        root.pos,
                        ast.And(
                          root.pos,
                          ast.Binary(
                            root.pos,
                            ast.Unary(root.pos, "typeof", ast.Ident(root.pos, "module")),
                            "!==",
                            ast.Const(root.pos, "undefined")
                          ),
                          ast.Access(
                            root.pos,
                            ast.Ident(root.pos, "module"),
                            ast.Const(root.pos, "exports")
                          )
                        ),
                        ast.Assign(
                          root.pos,
                          ast.Access(
                            root.pos,
                            ast.Ident(root.pos, "module"),
                            ast.Const(root.pos, "exports")
                          ),
                          ast.Call(
                            root.pos,
                            ast.Ident(root.pos, "factory"),
                            [
                              ast.Call(
                                root.pos,
                                ast.Ident(root.pos, "require"),
                                [ast.Const(root.pos, "egs")]
                              )
                            ]
                          )
                        ),
                        ast.IfStatement(
                          root.pos,
                          ast.And(
                            root.pos,
                            ast.Binary(
                              root.pos,
                              ast.Unary(root.pos, "typeof", ast.Ident(root.pos, "define")),
                              "===",
                              ast.Const(root.pos, "function")
                            ),
                            ast.Access(
                              root.pos,
                              ast.Ident(root.pos, "define"),
                              ast.Const(root.pos, "amd")
                            )
                          ),
                          ast.Call(
                            root.pos,
                            ast.Ident(root.pos, "define"),
                            [
                              ast.Arr(root.pos, [ast.Const(root.pos, "egs-runtime")]),
                              ast.Ident(root.pos, "factory")
                            ]
                          ),
                          ast.Assign(
                            root.pos,
                            ast.Access(root.pos, ast.This(root.pos), ast.Const(root.pos, options.globalExport || "EGSTemplates")),
                            ast.Call(
                              root.pos,
                              ast.Ident(root.pos, "factory"),
                              [
                                ast.Access(root.pos, ast.This(root.pos), ast.Const(root.pos, "EGSRuntime"))
                              ]
                            )
                          )
                        )
                      )
                    ),
                    ast.Const(root.pos, "call")
                  ),
                  [
                    ast.This(root.pos),
                    ast.Func(
                      root.pos,
                      null,
                      [ast.Ident(root.pos, "EGSRuntime")],
                      ["templates"],
                      ast.Block(root.pos, [
                        ast.IfStatement(
                          root.pos,
                          ast.Unary(root.pos, "!", ast.Ident(root.pos, "EGSRuntime")),
                          ast.Throw(root.pos, ast.Call(
                            root.pos,
                            ast.Ident(root.pos, "Error"),
                            [ast.Const(root.pos, "Expected EGSRuntime to be available")]
                          ))
                        ),
                        ast.Assign(
                          root.pos,
                          ast.Ident(root.pos, "templates"),
                          ast.Call(
                            root.pos,
                            ast.Access(
                              root.pos,
                              ast.Ident(root.pos, "EGSRuntime"),
                              ast.Const(root.pos, "Package")
                            ),
                            [ast.Const(root.pos, "0.3.1")]
                          )
                        ),
                        root.body,
                        ast.Return(root.pos, ast.Ident(root.pos, "templates"))
                      ])
                    )
                  ]
                ),
                [],
                []
              );
            }
          }
          function _step(_received) {
            while (true) {
              switch (_state) {
              case 0:
                if (options == null) {
                  options = {};
                }
                ++_state;
                return {
                  done: false,
                  value: __toPromise(fs.stat, fs, [inputDirpath])
                };
              case 1:
                dirstat = _received;
                if (!dirstat.isDirectory()) {
                  throw new Error("Expected '" + inputDirpath + "' to be a directory.");
                }
                ++_state;
                return {
                  done: false,
                  value: findAllExtensionedFilepaths(inputDirpath, ".egs")
                };
              case 2:
                inputFilepaths = _received;
                ++_state;
                return { done: false, value: getPreludeMacros(options.prelude) };
              case 3:
                macros = _received;
                astPipe = getAstPipe(getHelperNames({}));
                includeEgsRuntime = options.includeEgsRuntime;
                _state = includeEgsRuntime ? 4 : 6;
                break;
              case 4:
                ++_state;
                return {
                  done: false,
                  value: __toPromise(fs.readFile, fs, [
                    path.join(__dirname, "..", "lib", "runtime.js"),
                    "utf8"
                  ])
                };
              case 5:
                runtimeCode = _received;
                _state = 7;
                break;
              case 6: ++_state;
              case 7:
                ++_state;
                return {
                  done: false,
                  value: gorillascript.compileFile({
                    input: inputFilepaths,
                    output: outputFilepath,
                    embedded: true,
                    embeddedGenerator: true,
                    noindent: true,
                    embeddedOpen: options.open,
                    embeddedOpenWrite: options.openWrite,
                    embeddedOpenComment: options.openComment,
                    embeddedOpenLiteral: options.openLiteral,
                    embeddedClose: options.close,
                    embeddedCloseWrite: options.closeWrite,
                    embeddedCloseComment: options.closeComment,
                    embeddedCloseLiteral: options.closeLiteral,
                    coverage: options.coverage,
                    sourceMap: options.sourceMap,
                    undefinedName: options.undefinedName,
                    uglify: options.uglify,
                    encoding: options.encoding,
                    linefeed: options.linefeed,
                    macros: macros,
                    astPipe: fullAstPipe
                  })
                };
              case 8:
                ++_state;
                return { done: true, value: _received };
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
        });
        wrapModule_resolveFilename = memoize(function () {
          var Module, old_resolveFilename;
          Module = require("module");
          old_resolveFilename = Module._resolveFilename;
          return Module._resolveFilename = function (request, parent) {
            if (request === "egs") {
              return path.resolve(__dirname, "../index.js");
            } else {
              return old_resolveFilename.apply(this, arguments);
            }
          };
        });
        packageFromDirectory = __promise(function (inputDirpath, options) {
          var _e, _send, _state, _step, _throw, templates, tmpName, tmpPath;
          _state = 0;
          function _close() {
            _state = 3;
          }
          function _step(_received) {
            while (true) {
              switch (_state) {
              case 0:
                if (options == null) {
                  options = {};
                }
                tmpName = "egs-package-" + new Date().getTime() + "-" + Math.random().toString(36).slice(2) + ".js";
                tmpPath = path.join(os.tmpdir(), tmpName);
                ++_state;
                return {
                  done: false,
                  value: compilePackage(inputDirpath, tmpPath, options)
                };
              case 1:
                wrapModule_resolveFilename();
                templates = require(tmpPath);
                if (!(templates instanceof Package)) {
                  throw new Error("Package did not build successfully");
                }
                ++_state;
                return {
                  done: false,
                  value: __toPromise(fs.unlink, fs, [tmpPath])
                };
              case 2:
                ++_state;
                return { done: true, value: templates };
              case 3:
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
        compileTemplate.version = "0.3.1";
        compileTemplate.fromFile = compileTemplateFromFile;
        compileTemplate.render = render;
        compileTemplate.renderFile = renderFile;
        compileTemplate.renderStream = renderStream;
        compileTemplate.renderFileStream = renderFileStream;
        compileTemplate.withEgsPrelude = withEgsPrelude;
        compileTemplate.compilePackage = compilePackage;
        compileTemplate.packageFromDirectory = packageFromDirectory;
        compileTemplate.Package = Package;
        compileTemplate.EGSError = EGSError;
        compileTemplate.compile = function (egsCode, options, helperNames) {
          if (egsCode == null) {
            egsCode = "";
          }
          if (options == null) {
            options = {};
          }
          if (helperNames == null) {
            helperNames = [];
          }
          return compileCode(egsCode, getCompileOptions(options), helperNames);
        };
        compileTemplate.__express = express;
        compileTemplate.express = function (options) {
          if (options == null) {
            options = {};
          }
          return function (path, suboptions, callback) {
            if (suboptions == null) {
              suboptions = {};
            }
            express(
              path,
              __import(
                __import({}, options),
                suboptions
              ),
              callback
            );
          };
        };
        module.exports = compileTemplate;
      }.call(this, typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this));
      
      return module.exports;
    };

    return require("./egs").withEgsPrelude("macro extends(name, locals)\n  let new-context = if locals and not locals.is-const()\n    ASTE {} <<< context <<< $locals\n  else\n    ASTE context\n  ASTE context.extends $name, $new-context\n\nmacro block\n  syntax ident as Identifier, body as GeneratorBody?\n    let name = @const ident.name\n    if body?\n      ASTE! write := yield context.block $name, first!(write, (write := '')), #(write)*\n        $body\n        write\n    else\n      ASTE! write := yield context.block $name, first!(write, (write := ''))\n\nmacro partial(name, locals)\n  let new-context = if locals and not locals.is-const()\n    ASTE {} <<< context <<< $locals\n  else\n    ASTE context\n  \n  ASTE! write := yield context.partial $name, first!(write, (write := '')), $new-context\n");
  };

  if (typeof define === "function" && define.amd) {
    define(["require","gorillascript","egs-runtime"], function (require) { return _EGS(require); });
  } else if (typeof module !== "undefined" && typeof require === "function") {
    module.exports = _EGS(require);
  } else {
    root.EGS = _EGS();
  }
}(this));