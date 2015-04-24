var chai = require('chai');
var expect = chai.expect;
var app = require('../lib/app').instance();
var pong = require('../lib/pong');
var request = require('supertest');

describe('Routes', function () {
  require('./shared').setup();

  describe('challenges', function() {
    describe('with a challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['WangHao', 'ZhangJike']).then(function () {
          pong.createSingleChallenge('WangHao', 'ZhangJike').then(function () {
            done();
          });
        });
      });

      it('returns challenges', function (done) {
        request(app)
          .get('/api/challenges')
          .expect(200)
          .end(function(err, res) {
            if (err) throw err;
            var challenges = res.body;
            expect(challenges.length).to.eq(1);
            var challenge = challenges[0];
            expect(challenge.state).to.eq('Proposed');
            expect(challenge.type).to.eq('Singles');
            expect(challenge.challenger).to.eql(['WangHao']);
            expect(challenge.challenged).to.eql(['ZhangJike']);
            done();
          });
      });
    });
  });

  describe('players', function() {
    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('WangHao').then(function () {
          done();
        });
      });

      it('returns players', function (done) {
        request(app)
          .get('/api/players')
          .expect(200)
          .end(function(err, res) {
            if (err) throw err;
            var players = res.body;
            expect(players.length).to.eq(1);
            var player = players[0];
            expect(player.user_name).to.eq('WangHao');
            done();
          });
      });
    });
  });
});
