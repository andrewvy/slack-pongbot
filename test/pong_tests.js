var expect = require("chai").expect;
var pong = require("../lib/pong.js");

describe("Pong", function() {
  describe("#init()", function() {
    before(function() {
      pong.init();
    });
    it("sets channel", function() {
      expect(pong.channel).to.eq('#pongbot');
    });
  });
});
