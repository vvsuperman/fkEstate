let egs-runtime = require if process.env.EGS_COV then '../lib-cov/runtime' else '../lib/runtime'
let {expect} = require 'chai'
let {stub} = require 'sinon'
require! os
require! fs
require! path

describe "package", #
  it "should be able to set and render text", #
    let templates = egs-runtime.Package()
    templates.set "hello.egs", #(write, context, helpers)*
      "$(write)Hello, $(helpers.escape context.name)!"
    
    let promises = []
    for [context, result] in [
        [{name: "world"}, "Hello, world!"]
        [{name: "friend"}, "Hello, friend!"]]
      expect(templates.render-sync "hello.egs", context)
        .to.equal result
      promises.push(expect(templates.render "hello.egs", context)
        .to.eventually.equal result)
    every-promise! promises
  
  it "should be able to reference another file as a partial", #
    let templates = egs-runtime.Package()
    templates.set "_hello.egs", #(write, context, helpers)*
      "$(write)Hello, $(helpers.escape context.name)!"
    
    templates.set "use-hello.egs", #(mutable write, context, helpers)*
      write &= "["
      write := yield helpers.partial "hello", write, context
      write & "]"
    
    let promises = []
    for [context, result] in [
        [{name: "world"}, "[Hello, world!]"]
        [{name: "friend"}, "[Hello, friend!]"]]
      expect(templates.render-sync "use-hello.egs", context)
        .to.equal result
      promises.push(expect(templates.render "use-hello.egs", context)
        .to.eventually.equal result)
    every-promise! promises
  
  it "should be able to stream a render", #(cb)
    let templates = egs-runtime.Package()
    templates.set "_hello.egs", #(write, context, helpers)*
      "$(write)Hello, $(helpers.escape context.name)!"
    
    templates.set "use-hello.egs", #(mutable write, context, helpers)*
      write &= "["
      write := yield helpers.partial "hello", first!(write, (write := '')), context
      write & "]"
    
    let buffer = []
    let on-data(data) -> buffer.push data
    templates.render-stream "use-hello.egs", {name: "world"}
      .on 'data', on-data
      .on 'error', cb
      .on 'end', #
        expect(buffer.join "").to.equal "[Hello, world!]"
        expect(buffer.length).to.not.equal 1
        cb()
  
  it "should be able to reference another file as a partial without extensions", #
    let templates = egs-runtime.Package()
    templates.set "_hello", #(write, context, helpers)*
      "$(write)Hello, $(helpers.escape context.name)!"
    
    templates.set "use-hello", #(mutable write, context, helpers)*
      write &= "["
      write := yield helpers.partial "hello", write, context
      write & "]"
    
    expect(templates.render "use-hello", name: "world")
      .to.eventually.equal "[Hello, world!]"
  
  it "should be able to reference another file as a layout", #
    let templates = egs-runtime.Package()
    templates.set "layout.egs", #(mutable write, context, helpers)*
      write &= "["
      write := yield helpers.block "start", write
      write & "]"
    
    templates.set "use-layout.egs", #(write, context, helpers)*
      helpers.extends "layout"
      
      yield helpers.block "start", write, #(write)*
        write & "Hello!"
    
    expect(templates.render-sync "use-layout.egs")
      .to.equal "[Hello!]"
    expect(templates.render "use-layout.egs")
      .to.eventually.equal "[Hello!]"
  
  it "fails if attempting to extend two layouts", #
    let templates = egs-runtime.Package()
    templates.set "layout.egs", #(mutable write, context, helpers)*
      write &= "["
      write := yield helpers.block "start", write
      write & "]"
    
    templates.set "other-layout.egs", #(mutable write, context, helpers)*
      write &= "("
      write := yield helpers.block "start", write
      write & ")"
    
    templates.set "use-layout.egs", #(mutable write, context, helpers)*
      helpers.extends "layout"
      helpers.extends "other-layout"
      
      yield helpers.block "start", write, #(write)*
        write & "Hello!"
    
    expect(templates.render "use-layout.egs")
      .to.be.rejected.with egs-runtime.EGSError
  
  it "errors if an unknown file is rendered", #
    let templates = egs-runtime.Package()
    
    expect(#-> templates.render-sync "unknown.egs")
      .throws egs-runtime.EGSError
    expect(templates.render "unknown.egs")
      .to.be.rejected.with egs-runtime.EGSError
  
  it "errors if an unknown file is referenced as a partial", #
    let templates = egs-runtime.Package()
    templates.set "use-unknown.egs", #(mutable write, context, helpers)*
      write &= "["
      write := yield helpers.partial "unknown", write
      write & "]"
    
    expect(templates.render "use-unknown.egs", name: "world")
      .to.be.rejected.with egs-runtime.EGSError
  
  it "errors if a partial extends a layout", #
    let templates = egs-runtime.Package()
    templates.set "layout.egs", #(mutable write, context, helpers)*
      write &= "["
      write := yield helpers.block "start", write
      write & "]"
    
    templates.set "_hello.egs", #(mutable write, context, helpers)*
      helpers.extends "layout.egs"
    
    templates.set "use-hello.egs", #(mutable write, context, helpers)*
      write &= "["
      write := yield helpers.partial "hello", write
      write & "]"
    
    expect(templates.render "use-hello.egs", name: "world")
      .to.be.rejected.with egs-runtime.EGSError
  
  it "errors if a partial uses a block", #
    let templates = egs-runtime.Package()
    templates.set "_hello.egs", #(write, context, helpers)*
      yield helpers.block "blah", write, #* ->
    
    templates.set "use-hello.egs", #(mutable write, context, helpers)*
      write &= "["
      write := yield helpers.partial "hello", write
      write & "]"
    
    expect(templates.render "use-hello.egs", name: "world")
      .to.be.rejected.with egs-runtime.EGSError
  
  it "can retrieve individual templates from the package", #
    let templates = egs-runtime.Package()
    templates.set "hello.egs", #(write, context, helpers)*
      "$(write)Hello, $(helpers.escape context.name)!"
    let hello = templates.get "hello.egs"
    expect(hello name: "world")
      .to.eventually.equal "Hello, world!"
  
  it "can retrieve individual templates from the package and run them synchronously", #
    let templates = egs-runtime.Package()
    templates.set "hello.egs", #(write, context, helpers)*
      "$(write)Hello, $(helpers.escape context.name)!"
    let hello = templates.get("hello.egs").sync
    expect(hello name: "world")
      .to.equal "Hello, world!"
  
  it "can provide an express-friendly API", #(cb)
    let express = do
      let templates = egs-runtime.Package()
      templates.set "hello.egs", #(write, context, helpers)*
        "$(write)Hello, $(helpers.escape context.name)!"
    
      templates.express()
    
    express "hello.egs", { name: "world" }, #(err, value)
      expect(err).to.not.exist
      expect(value).to.equal "Hello, world!"
      cb()

let run-package-tests(templates)
  expect(templates).to.be.an.instanceof egs-runtime.Package
  expect(templates.render-sync "hello.egs", name: "world")
    .to.equal "Hello, world!"
  expect(templates.render-sync "use-partial.egs", partial-name: "quote-text", partial-locals: { text: "Hello" })
    .to.equal '["Hello"]'
  expect(templates.render-sync "use-layout.egs")
    .to.equal """
      header[Overridden header]
      body[Overridden body]
      footer[Default footer]
      """
  expect(templates.render-sync "use-sublayout.egs")
    .to.equal """
      header[Overridden header]
      body[sub-body[Overridden sub-body]]
      footer[Default footer]
      """
describe "compile-package", #
  let egs = require '../index'
  describe "can package a folder into a single js file which creates a Package", #
    it "in a browser-like environment (eval'd code with custom global)", #
      let tmp-package-js = path.join(fs.realpath-sync(os.tmpdir()), "egs-package.js")
      promise!
        yield egs.compile-package("$__dirname/fixtures", tmp-package-js)
        let js-code = yield to-promise! fs.read-file tmp-package-js, "utf8"
        yield to-promise! fs.unlink tmp-package-js
        let sandbox = {
          EGSRuntime: egs-runtime
        }
        Function(js-code).call(sandbox)
        run-package-tests sandbox.EGSTemplates
    
    it "in a node.js-like environment", #
      let tmp-package-js = path.join(fs.realpath-sync(os.tmpdir()), "egs-package.js")
      promise!
        yield egs.compile-package("$__dirname/fixtures", tmp-package-js)
        let js-code = yield to-promise! fs.read-file tmp-package-js, "utf8"
        yield to-promise! fs.unlink tmp-package-js
        let sandbox = {}
        let module = { exports: {} }
        Function("""
        return function (module, require) {
          $js-code
        }
        """)().call(module, module, stub().with-args('egs').returns(egs))
        run-package-tests module.exports
    
    it "in an AMD-like environment", #
      let tmp-package-js = path.join(fs.realpath-sync(os.tmpdir()), "egs-package.js")
      promise!
        yield egs.compile-package("$__dirname/fixtures", tmp-package-js)
        let js-code = yield to-promise! fs.read-file tmp-package-js, "utf8"
        yield to-promise! fs.unlink tmp-package-js
        let sandbox = {}
        let mutable definition = void
        let define(dependencies, factory)!
          // this testing is slightly brittle, but it's easier than building a whole AMD loader.
          expect(arguments.length).to.equal 2
          expect(dependencies).to.be.eql ['egs-runtime']
          expect(factory).to.be.a \function
          definition := factory(egs-runtime)
        define.amd := {}
        Function("""
        return function (define) {
          $js-code
        }
        """)().call sandbox, define
        run-package-tests definition
        expect(sandbox).to.be.empty

describe "package-from-directory", #
  let egs = require '../index'
  it "can create a Package from a directory", #
    promise!
      let templates = yield egs.package-from-directory("$__dirname/fixtures")
      
      run-package-tests templates
