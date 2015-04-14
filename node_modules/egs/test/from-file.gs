let egs = require '../index'
let {expect} = require 'chai'
let {stub} = require 'sinon'
require! fs

describe "from a file", #
  for cache in [false, true]
    describe "with$(if cache then '' else 'out') caching", #
      describe "can build a template", #
        it "can render", #
          let template = egs.from-file "$__dirname/fixtures/hello.egs", { cache }
          expect(template).to.be.a \function
          expect(template name: "world")
            .to.eventually.equal "Hello, world!"

        it "can be reused", #
          let template = egs.from-file "$__dirname/fixtures/hello.egs", { cache }
          
          every-promise! [
            expect(template())
              .to.be.rejected.with TypeError
            expect(template name: "friend")
              .to.eventually.equal "Hello, friend!"
            expect(template name: '"friend"')
              .to.eventually.equal "Hello, &quot;friend&quot;!"
          ]
  
      describe "can render immediately", #
        it "without making a template first", #
          expect(egs.render-file "$__dirname/fixtures/hello.egs", { cache, name: "friend" })
            .to.eventually.equal "Hello, friend!"

        it "uses the context property instead of options if provided", #
          expect(egs.render-file "$__dirname/fixtures/hello.egs", { cache, context: { name: "friend" } })
            .to.eventually.equal "Hello, friend!"
    
        it "allows for a data argument that overrides anything in the context", #
          expect(egs.render-file "$__dirname/fixtures/hello.egs", { cache, context: { name: "friend" } }, name: "world")
            .to.eventually.equal "Hello, world!"
        
        it "can be streamed", #(cb)
          let stream = egs.render-file-stream "$__dirname/fixtures/hello.egs", { cache, name: "world" }
          let buffer = []
          let on-data(data as String) -> buffer.push data
          stream
            .on 'data', on-data
            .on 'error', cb
            .on 'end', #
              expect(buffer.join '').to.equal 'Hello, world!'
              cb()
  
      describe "partials", #
        it "can render a partial with a static name", #
          let template = egs.from-file "$__dirname/fixtures/use-static-partial.egs"
          expect(template partial-locals: { text: "Hello" })
            .to.eventually.equal '["Hello"]'
        
        it "can render a partial with a dynamic name and locals", #
          let template = egs.from-file "$__dirname/fixtures/use-partial.egs", { cache }
          expect(template partial-name: "quote-text", partial-locals: { text: "Hello" })
            .to.eventually.equal '["Hello"]'
    
        it "can render a partial within a partial", #
          let template = egs.from-file "$__dirname/fixtures/use-partial.egs", { cache }
          expect(template partial-name: "render-other-partial", partial-locals: {
            partial-name: "quote-text"
            partial-locals: {
              text: "Hello"
            }
          })
            .to.eventually.equal '[("Hello")]'
    
        it "can specify a custom partial prefix", #
          let template = egs.from-file "$__dirname/fixtures/use-partial.egs", { cache, partial-prefix: "" }
          expect(template partial-name: "hello", partial-locals: {
            name: "buddy"
          })
            .to.eventually.equal '[Hello, buddy!]'
        
        it "can be streamed", #(cb)
          let template = egs.from-file "$__dirname/fixtures/use-partial.egs", { cache }
          let stream = template.stream partial-name: "render-other-partial", partial-locals: {
            partial-name: "quote-text"
            partial-locals: {
              text: "Hello"
            }
          }
          let buffer = []
          let on-data(data as String) -> buffer.push data
          stream
            .on 'data', on-data
            .on 'error', cb
            .on 'end', #
              expect(buffer.join '').to.equal '[("Hello")]'
              expect(buffer.length).to.not.equal 1
              cb()
      
      describe "extends and blocks", #
        it "can render the layout on its own", #
          let template = egs.from-file "$__dirname/fixtures/layout.egs", { cache }
          expect(template())
            .to.eventually.equal """
            header[Default header]
            body[]
            footer[Default footer]
            """
    
        it "can extend a layout and override blocks", #
          let template = egs.from-file "$__dirname/fixtures/use-layout.egs", { cache }
          expect(template())
            .to.eventually.equal """
            header[Overridden header]
            body[Overridden body]
            footer[Default footer]
            """
    
        it "can extend a layout which has its own extends", #
          let template = egs.from-file "$__dirname/fixtures/use-sublayout.egs", { cache }
          expect(template())
            .to.eventually.equal """
            header[Overridden header]
            body[sub-body[Overridden sub-body]]
            footer[Default footer]
            """
        
        it "can be streamed", #(cb)
          let template = egs.from-file "$__dirname/fixtures/use-sublayout.egs", { cache }
          let stream = template.stream()
          let buffer = []
          let on-data(data as String) -> buffer.push data
          stream
            .on 'data', on-data
            .on 'error', cb
            .on 'end', #
              expect(buffer.join '').to.equal """
                header[Overridden header]
                body[sub-body[Overridden sub-body]]
                footer[Default footer]
                """
              expect(buffer.length).to.not.equal 1
              cb()
    
      describe "when the template file changes", #
        let filename = "$__dirname/tmp.egs"
        it (if cache then "still uses the old layout" else "updates to the new layout"), #
          promise!
            yield to-promise! fs.write-file filename, """
            Version one
            """
            let template = egs.from-file filename, { cache }
            expect(yield template()).to.equal "Version one"

            yield delay! 1000 // have to wait one second for mtime to catch up
            
            yield to-promise! fs.write-file filename, """
            Version two
            """
            
            expect(yield template()).to.equal (if cache then "Version one" else "Version two")
            
            yield to-promise! fs.unlink filename
