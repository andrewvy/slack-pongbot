var expect = require('chai').expect;
var Player = require('../../models/Player');

describe('Player', function () {
  describe("toString", function(){
    var currentPlayer = new Player({
      user_name: 'ZhangJike',
      wins: 1,
      losses: 2,
      elo: 56
    });

    it("includes wins, losses and elo", function () {
      expect(currentPlayer.toString()).to.eql("ZhangJike: 1 win 2 losses (elo: 56)");
    });
  });

  describe("toString(Array)", function() {
    var player1 = new Player({
      user_name: 'ZhangJike',
      wins: 1,
      losses: 2,
      elo: 56
    });

    var player2 = new Player({
      user_name: 'DengYaping',
      wins: 1,
      losses: 3,
      elo: 42
    });

    it("includes wins, losses and elo", function () {
      expect(Player.toString([player1, player2])).to.eql(
        "1. ZhangJike: 1 win 2 losses (elo: 56)\n" +
        "2. DengYaping: 1 win 3 losses (elo: 42)\n"
      );
    });

    it("ranks players with the same elo equally", function () {
      var player3 = new Player({
        user_name: 'WangHoe',
        wins: 1,
        losses: 3,
        elo: 56
      });

      expect(Player.toString([player1, player3, player2])).to.eql(
        "1. ZhangJike: 1 win 2 losses (elo: 56)\n" +
        "1. WangHoe: 1 win 3 losses (elo: 56)\n" +
        "3. DengYaping: 1 win 3 losses (elo: 42)\n"
      );
    });
  });
});
