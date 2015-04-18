var expect = require('chai').expect;
var pong = require('../lib/pong.js');
var Player = require('../models/Player');
var mongoose = require('mongoose');
var sinon = require('sinon');

describe('Pong', function () {
  before(function (done) {
    pong.init();
    mongoose.connect('mongodb://localhost/pingpong_test', done);
  });

  beforeEach(function (done) {
    Player.remove(done);
  });

  describe('#init()', function () {
    it('sets channel', function () {
      expect(pong.channel).to.eq('#pongbot');
    });
    it('sets deltaTau', function () {
      expect(pong.deltaTau).to.eq(0.94);
    });
    it('unsets currentChallenge', function () {
      expect(pong.currentChallenge).to.be.false;
    });
  });

  describe('#registerPlayer', function () {
    beforeEach(function (done) {
      pong.registerPlayer('ZhangJike', done);
    });

    it('creates a player record', function (done) {
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

    it('does not create a duplicate player', function (done) {
      pong.registerPlayer('ZhangJike', function (err, user) {
        expect(err).to.not.be.undefined;
        expect(err.code).to.eq(11000);
        done();
      });
    });
  });

  describe('#findPlayer', function () {
    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', done);
      });

      it('finds a player', function (done) {
        pong.findPlayer('ZhangJike', function (err, user) {
          expect(err).to.be.null;
          expect(user).not.to.be.null;
          expect(user.user_name).to.eq('ZhangJike');
          done();
        });
      });
    });

    describe('without a player', function () {
      it("doesn't find player", function (done) {
        pong.findPlayer('ZhangJike', function (err, user) {
          expect(err).to.not.be.null;
          expect(err.message).to.eq("User 'ZhangJike' does not exist.");
          expect(user).to.be.null;
          done();
        });
      });
    });
  });

  describe('getEveryone', function () {
    describe('with a player', function (done) {
      beforeEach(function (done) {
        sinon.spy(console, 'log');
        pong.registerPlayer('ZhangJike', done);
      });

      afterEach(function () {
        console.log.restore();
      });

      it('logs and returns users', function (done) {
        pong.getEveryone(function (err, users) {
          expect(users.length).to.eq(1);
          expect(console.log.calledOnce).to.be.true;
          expect(console.log.firstCall.args[0][0].user_name).to.eq('ZhangJike');
          done();
        });
      });
    });
  });

  describe('updateWins', function () {
    it('returns an error when a user cannot be found', function (done) {
      pong.updateWins('ZhangJike', function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("User 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function () {
          pong.updateWins('ZhangJike', done);
        });
      });

      it('increments the number of wins', function (done) {
        pong.findPlayer('ZhangJike', function (err, user) {
          expect(err).to.be.null;
          expect(user.wins).to.eq(1);
          done();
        });
      });

      it('increments the number of wins twice', function (done) {
        pong.updateWins('ZhangJike', function () {
          pong.findPlayer('ZhangJike', function (err, user) {
            expect(err).to.be.null;
            expect(user.wins).to.eq(2);
            done();
          });
        });
      });
    });
  });

  describe('updateLosses', function () {
    it('returns an error when a user cannot be found', function (done) {
      pong.updateLosses('ZhangJike', function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("User 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function () {
          pong.updateLosses('ZhangJike', done);
        });
      });

      it('increments the number of losses', function (done) {
        pong.findPlayer('ZhangJike', function (err, user) {
          expect(err).to.be.null;
          expect(user.losses).to.eq(1);
          done();
        });
      });

      it('increments the number of losses twice', function (done) {
        pong.updateLosses('ZhangJike', function () {
          pong.findPlayer('ZhangJike', function (err, user) {
            expect(err).to.be.null;
            expect(user.losses).to.eq(2);
            done();
          });
        });
      });
    });
  });

  describe('reateSingleChallenge', function () {
  });

  describe('createDoubleChallenge', function () {
  });

  describe('checkChallenge', function () {
  });

  describe('setChallenge', function () {
  });

  describe('removeChallenge', function () {
  });

  describe('acceptChallenge', function () {
  });

  describe('declineChallenge', function () {
  });

  describe('calculateTeamElo', function () {
  });

  describe('eloSinglesChange', function () {
  });

  describe('eloDoublesChange', function () {
  });

  describe('win', function () {
  });

  describe('lose', function () {
  });

  describe('findDoublesPlayers', function () {
  });

  describe('reset', function () {
    it('returns an error when a user cannot be found', function (done) {
      pong.reset('ZhangJike', function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("User 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function (err, user) {
          user.wins = 42;
          user.losses = 24;
          user.tau = 3;
          user.elo = 158;
          user.save(done);
        });
      });

      it('resets user fields', function (done) {
        pong.reset('ZhangJike', function () {
          pong.findPlayer('ZhangJike', function (err, user) {
            expect(err).to.be.null;
            expect(user.wins).to.eq(0);
            expect(user.tau).to.eq(1);
            expect(user.elo).to.eq(0);
            expect(user.losses).to.eq(0);
            done();
          });
        });
      });
    });
  });

  describe('getDuelGif', function () {
  });
});
