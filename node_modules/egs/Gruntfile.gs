require! path
require! fs

module.exports := #(grunt)
  grunt.init-config
    gorilla:
      build:
        options: {
          +verbose
        }
        files: [{
          expand: true
          cwd: "src/"
          src: for filter file in fs.readdir-sync('./src')
            path.extname(file) == ".gs" and not file.match(r"prelude\.gs\$")
          dest: "lib/"
          ext: ".js"
        }]
      
      "build-cov":
        options: {
          +verbose
          +coverage
        }
        files: [{
          expand: true
          cwd: "src/"
          src: for filter file in fs.readdir-sync('./src')
            path.extname(file) == ".gs" and not file.match(r"prelude\.gs\$")
          dest: "lib-cov/"
          ext: ".js"
        }]
    
    uglify:
      browser:
        files: {
          "extras/egs.min.js": ["extras/egs.js"]
          "extras/egs-runtime.min.js": ["extras/egs-runtime.js"]
        }
    
    mochaTest:
      test:
        options:
          timeout: 10_000_ms
          require: "test/setup"
        src: ["test/*.gs"]
      
      "test-cov":
        options:
          reporter: "html-cov"
          timeout: 10_000_ms
          require: "test/setup"
          quiet: true
        src: ["test/*.gs"]
        dest: "coverage.html"
  
  let build-browser = promise! #(files, return-module, global-export, addendum, requires)*
    let filename-path = yield to-promise! fs.realpath __filename
    let src-path = path.join(path.dirname(filename-path), "src")
    let lib-path = path.join(path.dirname(filename-path), "lib")
    let parts = []
    for file in files
      let text = yield to-promise! fs.read-file path.join(lib-path, file & ".js"), "utf8"
      parts.push """
        require['./$file'] = function () {
          var module = { exports: this };
          var exports = this;
          $(text.split("\n").join("\n  "))
          return module.exports;
        };
        """

    """
      ;(function (root) {
        "use strict";
        var _$global-export = function (realRequire) {
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
          $(parts.join("\n").split("\n").join("\n    "))
          
          return require("./$return-module")$addendum;
        };
    
        if (typeof define === "function" && define.amd) {
          define($(if requires? then JSON.stringify([\require, ...requires]) & ', ' else '')function (require) { return _$global-export(require); });
        } else if (typeof module !== "undefined" && typeof require === "function") {
          module.exports = _$global-export(require);
        } else {
          root.$global-export = _$global-export();
        }
      }(this));
      """
  
  grunt.register-task "browser", "Build extras/egs.js", #
    let done = @async()
    let promise = promise!
      let egs-prelude = yield to-promise! fs.read-file "$__dirname/src/egs-prelude.gs", "utf8"
      let code = yield build-browser(
        ["egs"]
        "egs"
        "EGS"
        ".withEgsPrelude($(JSON.stringify egsPrelude))"
        ["gorillascript", "egs-runtime"])
      grunt.file.write "extras/egs.js", code
      grunt.log.writeln 'File "extras/egs.js" created.'
    promise.then(
      #-> done()
      #(e)
        grunt.log.error e?.stack or e
        done(false))
  
  grunt.register-task "browser-runtime", "Build extras/egs-runtime.js", #
    let done = @async()
    let promise = promise!
      let filename-path = yield to-promise! fs.realpath __filename
      let lib-path = path.join(path.dirname(filename-path), "lib")
      let text = yield to-promise! fs.read-file path.join(lib-path, "runtime.js"), "utf8"

      let code = """
        ;(function (root) {
          "use strict";
          var _runtime = function () {
            var exports = {}
            var module = { exports: exports };

            $(text.split("\n").join("\n    "))
            
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
        """

      grunt.file.write "extras/egs-runtime.js", code
      grunt.log.writeln 'File "extras/egs-runtime.js" created.'

    promise.then(
      #-> done()
      #(e)
        grunt.log.error e?.stack or e
        done(false))
  
  grunt.load-npm-tasks "grunt-gorilla"
  grunt.load-npm-tasks "grunt-mocha-test"
  grunt.load-npm-tasks "grunt-contrib-uglify"
  grunt.register-task "build", ["gorilla:build"]
  grunt.register-task "build-cov", ["gorilla:build-cov"]
  grunt.register-task "test", ["mochaTest:test"]
  grunt.register-task "check-env-cov", "Verify that EGS_COV is set", #
    unless process.env.EGS_COV
      grunt.log.error "You must set the EGS_COV environment variable"
      false
  grunt.register-task "test-cov", ["check-env-cov", "mochaTest:test-cov"]
  grunt.register-task "default", ["build", "test", "browser", "browser-runtime"]
  grunt.register-task "full", ["default", "uglify"]
