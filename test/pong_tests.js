var expect = require("chai").expect;
var pong = require("../lib/pong.js");
var Player = require('../models/Player');
var mongoose = require('mongoose');

describe("Pong", function() {
  beforeEach(function(done) {
    mongoose.connect('mongodb://localhost/pingpong_test', function(){
      mongoose.connection.db.dropDatabase(done);
    });

    pong.init();
  });

  describe("#init()", function() {
    it("sets channel", function() {
      expect(pong.channel).to.eq('#pongbot');
    });
    it("sets deltaTau", function() {
      expect(pong.deltaTau).to.eq(0.94);
    });
    it("unsets currentChallenge", function() {
      expect(pong.currentChallenge).to.be.false;
    });
  });

  describe("#registerPlayer", function() {
    beforeEach(function(done) {
      pong.registerPlayer('ZhangJike', done);
    });

    it("creates a player record", function(done) {
      Player.where({ user_name: 'ZhangJike' }).findOne(function (err, user) {
        expect(user).not.to.be.null;
        expect(user.user_name).to.eq('ZhangJike');
        expect(user.wins).to.eq(0);
        expect(user.losses).to.eq(0);
        expect(user.elo).to.eq(0);
        expect(user.tau).to.eq(0);
        done();
      });
    });
  });

  describe("#findPlayer", function() {
    describe("with a player", function() {
      beforeEach(function(done) {
        pong.registerPlayer('ZhangJike', done);
      });

      it("finds a player", function(done) {
        pong.findPlayer('ZhangJike', function(user) {
          expect(user).not.to.be.null;
          expect(user.user_name).to.eq('ZhangJike');
          done();
        });
      });
    });
    describe("without a player", function() {
      it("doesn't find player", function(done) {
        pong.findPlayer('ZhangJike', function(user) {
          expect(user).to.be.false;
          done();
        });
      });
    });
  });
});
