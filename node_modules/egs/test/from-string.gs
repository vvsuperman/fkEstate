let egs = require '../index'
let {expect} = require 'chai'
let {stub} = require 'sinon'

describe "from a string", #
  describe "can build a template", #
    it "can render", #
      let template = egs "Hello, <%= name %>!"
      expect(template).to.be.a \function
      let promise = template(name: "friend")
      expect(promise).to.have.property(\then)
        .that.is.a \function
      
      expect(promise).to.eventually.equal 'Hello, friend!'
  
    it "allows reuse of the template", #
      let template = egs "Hello, <%= name %>!"
      
      every-promise! [
        expect(template()).to.be.rejected.with TypeError
        expect(template({})).to.be.rejected.with TypeError
        expect(template(name: "friend")).to.eventually.equal "Hello, friend!"
        expect(template(name: 1234)).to.eventually.equal "Hello, 1234!"
        expect(template(name: '"friend"')).to.eventually.equal "Hello, &quot;friend&quot;!"
        expect(template(name: {})).to.be.rejected.with TypeError
      ]
    
    it "allows a template to work even if a context variable is not provided", #
      let template = egs "Hello, <%= name or 'world' %>!"
      
      every-promise! [
        expect(template()).to.eventually.equal "Hello, world!"
        expect(template name: "egs").to.eventually.equal "Hello, egs!"
      ]
    
    it "allows if statements", #
      let template = egs """
      Hello, <%= name %>!
      <% if awesome: %>
      You're awesome!
      <% end %>
      """
      
      every-promise! [
        expect(template { name: "world", -awesome })
          .to.eventually.match r'^Hello, world!\s*$'
        expect(template { name: "egs", +awesome })
          .to.eventually.match r'^Hello, egs!\s*You''re awesome!\s*$'
      ]
    
    it "allows if-else statements", #
      let template = egs """
      Hello, <%= name %>!
      <% if awesome: %>
      You're awesome!
      <% else: %>
      Hope you're feeling better.
      <% end %>
      """
      
      every-promise! [
        expect(template { name: "world", -awesome })
          .to.eventually.match r'^Hello, world!\n\s*Hope you''re feeling better.\s*$'
        expect(template { name: "egs", +awesome })
          .to.eventually.match r'^Hello, egs!\n\s*You''re awesome!\s*$'
      ]
    
    it "allows custom tokens to be specified", #
      let template = egs """
      {% if awesome: %}
      You're awesome, {{ name }}!
      {% else: %}
      Hello, {{ name }}!
      {% end %}
      {# this part is ignored #}
      <%= name %>
      {@{{ name }}@}
      """, { open: "{%", close: "%}", open-write: "{{", close-write: "}}", open-comment: "{#", close-comment: "#}", open-literal: "{@", close-literal: "@}" }
      
      every-promise! [
        expect(template { name: "world", -awesome })
          .to.eventually.match r'^\s*Hello, world!\s*<%= name %>\s*{{ name }}$'
        expect(template { name: "egs", +awesome })
          .to.eventually.match r'^\s*You''re awesome, egs!\s*<%= name %>\s*{{ name }}$'
      ]
    
    it "allows helper functions to be called", #
      let template = egs """
      Hello, <%= get-name() %>!
      """
      
      every-promise! [
        expect(template { get-name() "world" })
          .to.eventually.equal "Hello, world!"
        expect(template { get-name() "friend" })
          .to.eventually.equal "Hello, friend!"
        expect(template { get-name() throw RangeError() })
          .to.be.rejected.with RangeError
        expect(template {})
          .to.be.rejected.with TypeError
      ]
    
    it "allows helper promises to be yielded", #
      let template = egs """
      Hello, <%= yield get-name() %>!
      """
      
      every-promise! [
        expect(template { get-name() fulfilled! "world" })
          .to.eventually.equal "Hello, world!"
        expect(template { get-name() fulfilled! "friend" })
          .to.eventually.equal "Hello, friend!"
        expect(template { get-name() rejected! RangeError() })
          .to.be.rejected.with RangeError
        expect(template {})
          .to.be.rejected.with TypeError
      ]
    
    it "can use a custom escape", #
      let template = egs """
      Hello, <%= name %>!
      """, escape: #(x) -> x.to-upper-case()
      
      every-promise! [
        expect(template name: "world")
          .to.eventually.equal "Hello, WORLD!"
        expect(template name: "friend")
          .to.eventually.equal "Hello, FRIEND!"
        expect(template name: '"friend"')
          .to.eventually.equal 'Hello, "FRIEND"!'
      ]
    
    it "fails if attempting to use extends", #
      let template = egs """
      <% extends "blah" %>
      """
      
      expect(template())
        .to.be.rejected.with egs.EGSError
    
    it "fails if attempting to use partial", #
      let template = egs """
      <% partial "blah" %>
      """
      
      expect(template())
        .to.be.rejected.with egs.EGSError
    
    it "does not add two numbers that are next to each other", #
      let template = egs """
      <% let x = 1234 %><% let y = 5678 %><%= x %><%= y %>
      """
      
      expect(template())
        .to.eventually.equal "12345678"
    
    it "does not add two numbers that are next to each other, even if unescaped", #
      let template = egs """
      <% let x = 1234 %><% let y = 5678 %><%=h x %><%=h y %>
      """
      
      expect(template())
        .to.eventually.equal "12345678"
    
    it "allows calling write directly", #
      let template = egs """
      <% write "Hello, <world>!" %>
      """
      
      expect(template())
        .to.eventually.equal "Hello, <world>!"
    
    it "allows calling write w/true directly", #
      let template = egs """
      <% write "Hello, <world>!", true %>
      """
      
      expect(template())
        .to.eventually.equal "Hello, &lt;world&gt;!"
    
    it "allows calling write.call directly", #
      let template = egs """
      <% write.call null, "Hello, <world>!" %>
      """
      
      expect(template())
        .to.eventually.equal "Hello, <world>!"
    
    it "allows calling write.call w/true directly", #
      let template = egs """
      <% write.call null, "Hello, <world>!", true %>
      """
      
      expect(template())
        .to.eventually.equal "Hello, &lt;world&gt;!"
    
    it "allows calling write.apply directly", #
      let template = egs """
      <% write.apply null, ["Hello, <world>!"] %>
      """
      
      expect(template())
        .to.eventually.equal "Hello, <world>!"
    
    it "allows calling write.apply w/true directly", #
      let template = egs """
      <% write.apply null, ["Hello, <world>!", true] %>
      """
      
      expect(template())
        .to.eventually.equal "Hello, &lt;world&gt;!"
  
    it "allows calling write.apply directly with an ident", #
      let template = egs """
      <% let x = ["Hello, <world>!"]
         write.apply null, x %>
      """
      
      expect(template())
        .to.eventually.equal "Hello, <world>!"
    
    it "allows calling write.apply w/true directly with an ident", #
      let template = egs """
      <% let x = ["Hello, <world>!", true]
         write.apply null, x %>
      """
      
      expect(template())
        .to.eventually.equal "Hello, &lt;world&gt;!"
  
    it "allows calling write.apply directly with a call", #
      let template = egs """
      <% let x() ["Hello, <world>!"]
         write.apply null, x() %>
      """
      
      expect(template())
        .to.eventually.equal "Hello, <world>!"
    
    it "allows calling write.apply w/true directly with a call", #
      let template = egs """
      <% let x() ["Hello, <world>!", true]
         write.apply null, x() %>
      """
      
      expect(template())
        .to.eventually.equal "Hello, &lt;world&gt;!"
    
    it "allows literal chunks", #
      let template = egs """
      <script type="text/egs-template"><%@
      Hello, <%= name %>
      <%-- a comment --%>
      <% some-func() %>
      @%></script>
      """
      
      expect(template())
        .to.eventually.equal """
        <script type="text/egs-template">
        Hello, <%= name %>
        <%-- a comment --%>
        <% some-func() %>
        </script>
        """
  
  describe "can render immediately", #
    it "without making a template first", #
      expect(egs.render "Hello, <%= name %>!", name: "friend")
        .to.eventually.equal "Hello, friend!"
    
    it "uses the context property instead of options if provided", #
      expect(egs.render "Hello, <%= name %>!", context: { name: "friend" })
        .to.eventually.equal "Hello, friend!"
    
    it "allows for a data argument that overrides anything in the context", #
      expect(egs.render "Hello, <%= name %>!", { context: { name: "friend" } }, name: "world")
        .to.eventually.equal "Hello, world!"
  
  describe "can render synchronously", #
    it "using a template", #
      let template = egs "Hello, <%= name %>!"
      promise!
        yield template.ready()
        expect(template.sync name: "world").to.equal "Hello, world!"
  
  describe "can render as a stream", #
    it "building the template first", #(cb)
      let template = egs "Hello, <%= name %>!"
      let on-data = stub().with-args "Hello, world!"
      template.stream(name: "world")
        .on 'data', on-data
        .on 'error', cb
        .on 'end', #
          expect(on-data).to.be.called-once
          cb()
    
    it "without making a template", #(cb)
      let on-data = stub().with-args "Hello, world!"
      egs.render-stream("Hello, <%= name %>!", name: "world")
        .on 'data', on-data
        .on 'error', cb
        .on 'end', #
          expect(on-data).to.be.called-once
          cb()
    
    it "streams in chunks based on yielded values", #(cb)
      let template = egs """
      Hello, <%= yield get-name() %>!
      """
      
      let buffer = []
      let on-data = #(data as String)
        buffer.push data
      let data = {
        get-name: promise! #*
          yield delay! 20_ms
          "world"
      }
      template.stream(data)
        .on 'data', on-data
        .on 'error', cb
        .on 'end', #
          expect(buffer.join "").to.equal "Hello, world!"
          expect(buffer.length).to.not.equal 1
          cb()
    
    it "receives the error message if a throw occurs", #(cb)
      let template = egs """
      Hello, <% throw Error("oh noes!") %>!
      """
      
      let buffer = []
      let on-data = #(data as String)
        buffer.push data
      template.stream()
        .on 'data', on-data
        .on('error', #(err)
          expect(err).to.be.an.instanceof Error
          expect(err.message).to.equal "oh noes!"
          cb())
        .on 'end', #
          throw Error "not expecting the 'end' event"
    
    it "receives the error message if a throw occurs within 'data'", #(cb)
      let template = egs """
      Hello!
      """
      
      let my-error = {}
      template.stream()
        .on('data', #(data)
          throw my-error)
        .on('error', #(err)
          expect(err).to.equal my-error
          cb())
        .on 'end', #
          throw Error "not expecting the 'end' event"
    
    it "does not handle an error thrown in 'error'", #(cb)
      let domain = require('domain').create()
      let my-error = {}
      domain.on 'error', #(err)!
        expect(err).to.equal my-error
        cb()
      
      domain.run #!
        let template = egs """
        Hello!
        """
        template.stream()
          .on('data', #(v)
            throw my-error)
          .on('error', #(err)
            expect(err).to.equal my-error
            throw my-error)
          .on 'end', #
            throw Error "not expecting the 'end' event"
    
    it "does not handle an error thrown in 'end'", #(cb)
      let domain = require('domain').create()
      let my-error = {}
      domain.on 'error', #(err)!
        expect(err).to.equal my-error
        cb()
      
      domain.run #!
        let template = egs """
        Hello!
        """
        template.stream()
          .on('error', #(err)
            throw Error "not expecting the 'error' event")
          .on 'end', #
            throw my-error
