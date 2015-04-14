let egs = require '../index'
let {expect} = require 'chai'

describe "built-in helpers", #
  describe "'h'", #
    it "can allow HTML code to be unescaped", #
      let template = egs "Hello, <%=h name %>!"
      expect(template name: '<script>')
        .to.eventually.equal 'Hello, <script>!'
    
    it "can also be the full 'html' helper", #
      let template = egs "Hello, <%=html name %>!"
      expect(template name: '<script>')
        .to.eventually.equal 'Hello, <script>!'
    
    it "can allow numbers", #
      let template = egs "Hello, <%=h name %>!"
      expect(template name: 1234)
        .to.eventually.equal 'Hello, 1234!'
    
    it "can be used outside of a write", #
      let template = egs "<% let x = h name %>Hello, <%= x %>!"
      expect(template name: '<script>')
        .to.eventually.equal 'Hello, <script>!'
      
    it "can have a default with 'or'", #
      let template = egs "Hello, <%=h name or 'world' %>!"
      every-promise! [
        expect(template())
          .to.eventually.equal 'Hello, world!'
        expect(template {})
          .to.eventually.equal 'Hello, world!'
        expect(template name: "friend")
          .to.eventually.equal 'Hello, friend!'
      ]

  describe "'j'", #
    it "can allow JavaScript code to be unescaped", #
      let template = egs '"<%=j name %>"'
      expect(template name: '''\\\r\u2028\u2029\n\f\t'"''')
        .to.eventually.equal '''"\\\\\\r\\u2028\\u2029\\n\\f\\t\\'\\""'''
    
    it "can also be the full 'javascript' helper", #
      let template = egs '"<%=javascript name %>"'
      expect(template name: '''\\\r\u2028\u2029\n\f\t'"''')
        .to.eventually.equal '''"\\\\\\r\\u2028\\u2029\\n\\f\\t\\'\\""'''
    
    it "can allow numbers", #
      let template = egs "'<%=j name %>!'"
      expect(template name: 1234)
        .to.eventually.equal "'1234!'"
