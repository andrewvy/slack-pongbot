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
    mongoose.connection.db.dropDatabase(done);
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
  });

  describe('#findPlayer', function () {
    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', done);
      });

      it('finds a player', function (done) {
        pong.findPlayer('ZhangJike', function (user) {
          expect(user).not.to.be.null;
          expect(user.user_name).to.eq('ZhangJike');
          done();
        });
      });
    });

    describe('without a player', function () {
      it('doesn\'t find player', function (done) {
        pong.findPlayer('ZhangJike', function (user) {
          expect(user).to.be.false;
          done();
        });
      });
    });
  });

  describe('getEveryone', function () {
    describe('with a player', function () {
      beforeEach(function (done) {
        sinon.spy(console, 'log');
        pong.registerPlayer('ZhangJike', function () {
          pong.getEveryone(done);
        });
      });

      afterEach(function () {
        console.log.restore();
      });

      it('logs user', function () {
        expect(console.log.calledOnce).to.be.true;
        expect(console.log.firstCall.args[0][0].user_name).to.eq('ZhangJike');
      });
    });
  });

  describe('updateWins', function () {
  });

  describe('updateLosses', function () {
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
  });

  describe('getDuelGif', function () {
  });
});
