let {expect} = require 'chai'
let {spawn, exec} = require 'child_process'
require! path
require! fs
require! os
let {inspect} = require 'util'
let egs = require '../index'

let egs-bin = path.join(__dirname, "..", "bin", "egs")

let exec-with-stdin(binary, argv, stdin, callback)
  let proc = spawn binary, argv
  let mutable stdout = ""
  proc.stdout.on 'data', #(data) stdout &= data.to-string()
  let mutable stderr = ""
  proc.stderr.on 'data', #(data) stderr &= data.to-string()
  proc.on 'exit', #(code, signal)
    let mutable err = void
    if code != 0
      err := Error("$binary exited with code $(String code) and signal $(String signal)")
      err.code := code
      err.signal := signal
    callback(err, stdout, stderr)
  proc.stdin.write stdin
  proc.stdin.end()

describe "egs binary", #
  describe "passing in code with --stdin", #
    it "should be able to render a simple template", #(cb)
      async error, stdout, stderr <- exec-with-stdin egs-bin, ["--stdin", "--context", JSON.stringify(name: "world")], "Hello, <%= name %>!"
      expect(error).to.not.exist
      expect(stderr).to.be.empty
      expect(stdout.trim()).to.equal "Hello, world!"
      cb()
  
  describe "rendering an .egs file", #
    it "should be able to render a simple template", #(cb)
      let tmp-template = path.join(fs.realpath-sync(os.tmpdir()), "hello.egs")
      async! cb <- fs.write-file tmp-template, "Hello, <%= name %>!", "utf8"
      async error, stdout, stderr <- exec "$egs-bin $tmp-template --context '$(JSON.stringify name: \world)'"
      expect(error).to.not.exist
      expect(stderr).to.be.empty
      expect(stdout.trim()).to.equal "Hello, world!"
      async! cb <- fs.unlink tmp-template
      cb()
      
    it "can be passed custom tokens", #(cb)
      let tmp-template = path.join(fs.realpath-sync(os.tmpdir()), "hello.egs")
      async! cb <- fs.write-file tmp-template, "Hello, {{ name }}!", "utf8"
      async error, stdout, stderr <- exec "$egs-bin $tmp-template --context '$(JSON.stringify name: \world)' --tokens '{{'"
      expect(error).to.not.exist
      expect(stderr).to.be.empty
      expect(stdout.trim()).to.equal "Hello, world!"
      async! cb <- fs.unlink tmp-template
      cb()
  
  describe "compiling a package", #
    it "outputs to stdout file normally", #(cb)
      async error, stdout, stderr <- exec "$egs-bin -p $(__dirname)/fixtures"
      expect(error).to.not.exist
      expect(stderr).to.be.empty
      let sandbox = { EGSRuntime: egs }
      Function(stdout).call(sandbox)
      expect(sandbox.EGSTemplates).to.be.an.instanceof egs.Package
      expect(sandbox.EGSTemplates.render-sync "hello.egs", name: "world")
        .to.equal "Hello, world!"
      cb()
  
    it "creates a single .js file normally", #(cb)
      let package-js = path.join(fs.realpath-sync(os.tmpdir()), "package.js")
      async error, stdout, stderr <- exec "$egs-bin -p $(__dirname)/fixtures -o '$package-js'"
      expect(error).to.not.exist
      expect(stderr).to.be.empty
      expect(stdout.trim()).to.match r"Compiling fixtures ... \d\.\d+ s"
      async! cb, js-code <- fs.read-file package-js, "utf8"
      async! cb <- fs.unlink package-js
      let sandbox = { EGSRuntime: egs }
      Function(js-code).call(sandbox)
      expect(sandbox.EGSTemplates).to.be.an.instanceof egs.Package
      expect(sandbox.EGSTemplates.render-sync "hello.egs", name: "world")
        .to.equal "Hello, world!"
      cb()
    
    it "can specify a custom browser export", #(cb)
      async error, stdout, stderr <- exec "$egs-bin -p $(__dirname)/fixtures --export Monkey"
      expect(error).to.not.exist
      expect(stderr).to.be.empty
      let sandbox = { EGSRuntime: egs }
      Function(stdout).call(sandbox)
      expect(sandbox.Monkey).to.be.an.instanceof egs.Package
      expect(sandbox.Monkey.render-sync "hello.egs", name: "world")
        .to.equal "Hello, world!"
      cb()
    
    it "can use custom tokens", #(cb)
      async error, stdout, stderr <- exec "$egs-bin -p $(__dirname)/fixtures --tokens '{{'"
      expect(error).to.not.exist
      expect(stderr).to.be.empty
      let sandbox = { EGSRuntime: egs }
      Function(stdout).call(sandbox)
      expect(sandbox.EGSTemplates).to.be.an.instanceof egs.Package
      expect(sandbox.EGSTemplates.render-sync "hello-curly.egs", name: "world")
        .to.equal "Hello, world!"
      cb()
    
    it "can add coverage support", #(cb)
      async error, stdout, stderr <- exec "$egs-bin -p $(__dirname)/fixtures --coverage"
      expect(error).to.not.exist
      expect(stderr).to.be.empty
      let sandbox = { EGSRuntime: egs }
      let coverage = {}
      Function(\_$jscoverage, stdout).call(sandbox, coverage)
      expect(sandbox.EGSTemplates).to.be.an.instanceof egs.Package
      expect(sandbox.EGSTemplates.render-sync "hello.egs", name: "world")
        .to.equal "Hello, world!"
      expect(coverage).to.not.be.empty
      for k, v of coverage
        expect(v.source).to.be.an \array
        if k.match r'hello.egs$'
          // should have run line #1, at least
          expect(v[1]).to.equal 1
      cb()
    
    it "can add SourceMap support", #(cb)
      let package-js = path.join(fs.realpath-sync(os.tmpdir()), "package.js")
      let package-map = "$package-js.map"
      async error, stdout, stderr <- exec "$egs-bin -p $(__dirname)/fixtures -o '$package-js' -m '$package-map'"
      expect(error).to.not.exist
      expect(stderr).to.be.empty
      expect(stdout.trim()).to.match r"Compiling fixtures ... \d\.\d+ s"
      async! cb, js-code <- fs.read-file package-js, "utf8"
      async! cb <- fs.unlink package-js
      async! cb, sourcemap <- fs.read-file package-map, "utf8"
      async! cb <- fs.unlink package-map
      let parsed-sourcemap = JSON.parse(sourcemap)
      expect(parsed-sourcemap.version).to.equal 3
      expect(parsed-sourcemap.file).to.equal "package.js"
      expect(parsed-sourcemap.sources).to.not.be.empty
      // if it only has semicolons, then it doesn't have any mapping info
      expect(parsed-sourcemap.mappings).to.not.match r'^;*$'
      let sandbox = { EGSRuntime: egs }
      Function(js-code).call(sandbox)
      expect(sandbox.EGSTemplates).to.be.an.instanceof egs.Package
      expect(sandbox.EGSTemplates.render-sync "hello.egs", name: "world")
        .to.equal "Hello, world!"
      cb()
    
    it "can be uglified", #(cb)
      async error, stdout, stderr <- exec "$egs-bin -p $(__dirname)/fixtures -u"
      expect(error).to.not.exist
      expect(stderr).to.be.empty
      expect(stdout).to.not.match r"write"
      let sandbox = { EGSRuntime: egs }
      Function(stdout).call(sandbox)
      expect(sandbox.EGSTemplates).to.be.an.instanceof egs.Package
      expect(sandbox.EGSTemplates.render-sync "hello.egs", name: "world")
        .to.equal "Hello, world!"
      cb()
