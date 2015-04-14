let egs = require '../index'
let {expect} = require 'chai'

describe "custom prelude", #
  it "should allow for a custom prelude to be specified", #
    let template = egs """
    <%= hello() %>
    """, prelude: "$__dirname/fixtures/custom-prelude.gs"
    expect(template())
      .to.eventually.equal "Why, hello there!"