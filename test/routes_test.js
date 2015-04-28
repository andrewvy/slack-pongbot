var chai = require('chai');
chai.use(require('chai-string'));
var expect = chai.expect;
var pong = require('../lib/pong');
var Player = require('../models/Player');
var Challenge = require('../models/Challenge');
var sinon = require('sinon');

var request = require('supertest');
var routes = require('../lib/routes');
var app = require('../lib/app').instance();

describe('Routes', function () {
  require('./shared').setup();

  it('unknown command', function () {
    request(app)
      .post('/')
      .send({ text: 'pongbot foobar' })
      .expect(200)
      .end(function(err, res){
        if (err) throw err;
        expect(res.body.text).to.eq("I couldn't understand that command. Use _pongbot help_ to get a list of available commands.");
      });
  });

  describe('register', function() {
    it('registers a new player', function (done) {
      request(app)
        .post('/')
        .send({ text: 'pongbot register', user_name: 'WangHao' })
        .expect(200)
        .end(function(err, res){
          if (err) throw err;
          expect(res.body.text).to.eq("Successfully registered! Welcome to the system, WangHao.");
          done();
        });
    });

    describe('with a pre-registered player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('WangHao', { user_id: 'U02BEFY4U' }).then(function() {
          done();
        });
      });

      it('does not register twice by name', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot register', user_name: 'WangHao' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.eq("You've already registered!");
            done();
          });
      });

      it('does not register twice by ID', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot register', user_name: 'WangHaoWasRenamed', user_id: 'U02BEFY4U' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.eq("You've already registered!");
            done();
          });
      });
    });
  });

  describe('challenge', function() {
    describe('not registered', function () {
      it('advises to register', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot challenge singles ZhangJike', user_name: 'WangHao' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.eq("Player 'WangHao' does not exist. Are you registered? Use _pongbot register_ first.");
            done();
          });
      });
    });

    describe('with two players', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['WangHao', 'ZhangJike']).then(function () {
          done();
        });
      });

      it('creates a challenge', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot challenge singles ZhangJike', user_name: 'WangHao' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.startsWith("WangHao has challenged ZhangJike to a ping pong match!");
            done();
          });
      });

      it('creates a challenge with case insensitive usernames', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot challenge singles zhangjike', user_name: 'wanghao' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.startsWith("WangHao has challenged ZhangJike to a ping pong match!");
            done();
          });
      });
    });

    describe('with four players', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['WangHao', 'ZhangJike', 'ChenQi', 'ViktorBarna']).then(function () {
          done();
        });
      });

      it('yields an error when user does not exist', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot challenge doubles ChenQi against ZhangJike GuoYue', user_name: 'WangHao' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.eq("Error: Player 'GuoYue' does not exist.");
            done();
          });
      });

      it('creates a challenge', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot challenge doubles ChenQi against ZhangJike ViktorBarna', user_name: 'WangHao' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.startsWith("WangHao and ChenQi have challenged ZhangJike and ViktorBarna to a ping pong match!");
            done();
          });
      });

      it('creates a challenge with case-insensitive usernames', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot challenge doubles chenQi against zhangJike viktorBarna', user_name: 'wangHao' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.startsWith("WangHao and ChenQi have challenged ZhangJike and ViktorBarna to a ping pong match!");
            done();
          });
      });
    });
  });

  describe('accept and decline', function() {
    describe('with a challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['WangHao', 'ZhangJike']).then(function () {
          pong.createSingleChallenge('WangHao', 'ZhangJike').then(function () {
            done();
          });
        });
      });

      it('accepts a challenge', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot accept', user_name: 'ZhangJike' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.eq("ZhangJike accepted WangHao's challenge.");
            done();
          });
      });

      it('declines a challenge', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot decline', user_name: 'ZhangJike' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.eq("ZhangJike declined WangHao's challenge.");
            done();
          });
      });

      it('chickens out of a challenge', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot chicken', user_name: 'WangHao' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.eq("WangHao chickened out of the challenge against ZhangJike.");
            done();
          });
      });

      it('cannot create an opposite challenge', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot challenge singles WangHao', user_name: 'ZhangJike' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.eq("Error: There's already an active challenge between WangHao and ZhangJike.");
            Challenge.count().then(function (count) {
              expect(count).to.eq(1);
              done();
            });
          });
      });
    });
  });

  describe('won and lost', function() {
    describe('with an accepted challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['WangHao', 'ZhangJike']).then(function () {
          pong.createSingleChallenge('WangHao', 'ZhangJike').then(function () {
            pong.acceptChallenge('ZhangJike').then(function () {
              done();
            });
          });
        });
      });

      it('won', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot won', user_name: 'ZhangJike' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.eq("Only the player/team that lost can record the game.");
            done();
          });
      });

      it('lost', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot lost', user_name: 'ZhangJike' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.eq("Match has been recorded, WangHao defeated ZhangJike.");
            done();
          });
      });
    });
  });

  describe('rank', function() {
    describe('with a pre-registered player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('WangHao').then(function() {
          done();
        });
      });

      it('returns elo', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot rank', user_name: 'WangHao' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.eq("WangHao: 0 wins 0 losses (elo: 0)");
            done();
          });
      });

      it('tolerates lots of spaces', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot  rank  WangHao  ' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.eq("WangHao: 0 wins 0 losses (elo: 0)");
            done();
          });
      });
    });
  });

  describe('leaderboard', function() {
    beforeEach(function (done) {
      pong.registerPlayer('WangHao', { wins: 4, losses: 3, tau: 3, elo: 58 }).then(function (player) {
        pong.registerPlayer('ZhangJike', { wins: 42, losses: 24, tau: 3, elo: 158 }).then(function (player) {
          pong.registerPlayer('A', { wins: 20, losses: 3, tau: 3, elo: 57 }).then(function (player) {
            pong.registerPlayer('B', { wins: 19, losses: 3, tau: 3, elo: 56 }).then(function (player) {
              pong.registerPlayer('C', { wins: 18, losses: 3, tau: 3, elo: 55 }).then(function (player) {
                pong.registerPlayer('D', { wins: 17, losses: 3, tau: 3, elo: 54 }).then(function (player) {
                  done();
                });
              });
            });
          });
        });
      });
    });

    it('infinity', function (done) {
      request(app)
        .post('/')
        .send({ text: 'pongbot leaderboard infinity', user_name: 'WangHao' })
        .expect(200)
        .end(function(err, res) {
          expect(res.body.text).to.eq(
            "1. ZhangJike: 42 wins 24 losses (elo: 158)\n" +
            "2. WangHao: 4 wins 3 losses (elo: 58)\n" +
            "3. A: 20 wins 3 losses (elo: 57)\n" +
            "4. B: 19 wins 3 losses (elo: 56)\n" +
            "5. C: 18 wins 3 losses (elo: 55)\n" +
            "6. D: 17 wins 3 losses (elo: 54)\n"
          );
          done();
        });
    });

    it('Infinity', function (done) {
      request(app)
        .post('/')
        .send({ text: 'pongbot leaderboard Infinity', user_name: 'WangHao' })
        .expect(200)
        .end(function(err, res) {
          expect(res.body.text).to.eq(
            "1. ZhangJike: 42 wins 24 losses (elo: 158)\n" +
            "2. WangHao: 4 wins 3 losses (elo: 58)\n" +
            "3. A: 20 wins 3 losses (elo: 57)\n" +
            "4. B: 19 wins 3 losses (elo: 56)\n" +
            "5. C: 18 wins 3 losses (elo: 55)\n" +
            "6. D: 17 wins 3 losses (elo: 54)\n"
          );
          done();
        });
    });

    it('99', function (done) {
      request(app)
        .post('/')
        .send({ text: 'pongbot leaderboard infinity', user_name: 'WangHao' })
        .expect(200)
        .end(function(err, res) {
          expect(res.body.text).to.eq(
            "1. ZhangJike: 42 wins 24 losses (elo: 158)\n" +
            "2. WangHao: 4 wins 3 losses (elo: 58)\n" +
            "3. A: 20 wins 3 losses (elo: 57)\n" +
            "4. B: 19 wins 3 losses (elo: 56)\n" +
            "5. C: 18 wins 3 losses (elo: 55)\n" +
            "6. D: 17 wins 3 losses (elo: 54)\n"
          );
          done();
        });
    });

    it('without arguments', function (done) {
      request(app)
        .post('/')
        .send({ text: 'pongbot leaderboard', user_name: 'WangHao' })
        .expect(200)
        .end(function(err, res) {
          expect(res.body.text).to.eq(
            "1. ZhangJike: 42 wins 24 losses (elo: 158)\n" +
            "2. WangHao: 4 wins 3 losses (elo: 58)\n" +
            "3. A: 20 wins 3 losses (elo: 57)\n" +
            "4. B: 19 wins 3 losses (elo: 56)\n" +
            "5. C: 18 wins 3 losses (elo: 55)\n"
          );
          done();
        });
    });

    it('eLiTe', function (done) {
      request(app)
        .post('/')
        .send({ text: 'pongbot LeADeRBoaRD', user_name: 'WangHao' })
        .expect(200)
        .end(function(err, res) {
          expect(res.body.text).to.eq(
            "1. ZhangJike: 42 wins 24 losses (elo: 158)\n" +
            "2. WangHao: 4 wins 3 losses (elo: 58)\n" +
            "3. A: 20 wins 3 losses (elo: 57)\n" +
            "4. B: 19 wins 3 losses (elo: 56)\n" +
            "5. C: 18 wins 3 losses (elo: 55)\n"
          );
          done();
        });
    });
    it('2', function (done) {
      request(app)
        .post('/')
        .send({ text: 'pongbot leaderboard 2', user_name: 'WangHao' })
        .expect(200)
        .end(function(err, res) {
          expect(res.body.text).to.eq(
            "1. ZhangJike: 42 wins 24 losses (elo: 158)\n" +
            "2. WangHao: 4 wins 3 losses (elo: 58)\n"
          );
          done();
        });
    });

  });

  describe('reset', function() {
    describe('with a pre-registered player', function () {
      beforeEach(function (done) {
        process.env.ADMIN_SECRET = 'admin_secret';
        pong.registerPlayer('WangHao').then(function() {
          done();
        });
      });

      afterEach(function () {
        delete process.env.ADMIN_SECRET;
      });

      it('with the wrong admin secret', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot reset WangHao invalid', user_name: 'WangHao' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.eq("Invalid secret. Use _pongbot reset <username> <secret>_.");
            done();
          });
      });

      it('with the correct admin secret', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot reset WangHao admin_secret', user_name: 'vy' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.eq("WangHao's stats have been reset.");
            done();
          });
      });
    });
  });

  describe('new_season', function() {
    beforeEach(function () {
      process.env.ADMIN_SECRET = 'admin_secret';
    });

    afterEach(function () {
      delete process.env.ADMIN_SECRET;
    });

    it('with the wrong admin secret', function (done) {
      request(app)
        .post('/')
        .send({ text: 'pongbot new_season invalid', user_name: 'WangHao' })
        .expect(200)
        .end(function(err, res) {
          expect(res.body.text).to.eq("Invalid secret. Use _pongbot new_season <secret>_.");
          done();
        });
    });

    describe('with two players', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', { wins: 42, losses: 24, tau: 3, elo: 158 }).then(function (player) {
          pong.registerPlayer('ViktorBarna', { wins: 4, losses: 4, tau: 3, elo: 18 }).then(function (player) {
            done();
          });
        });
      });

      it('with the correct admin secret', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot new_season admin_secret', user_name: 'WangHao' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.eq("Welcome to the new season!");
            pong.findPlayers(['ZhangJike', 'ViktorBarna']).then().spread(function (p1, p2) {
              expect(p1.wins).to.eq(0);
              expect(p2.wins).to.eq(0);
              done();
            });
          });
      });
    });
  });

  describe('source', function() {
    it('is helpful', function () {
      request(app)
        .post('/')
        .send({ text: 'pongbot source' })
        .expect(200)
        .end(function(err, res){
          if (err) throw err;
          expect(res.body.text).to.eq("https://github.com/andrewvy/slack-pongbot");
        });
    });
  });

  describe('help', function() {
    it('is helpful', function () {
      request(app)
        .post('/')
        .send({ text: 'pongbot help' })
        .expect(200)
        .end(function(err, res){
          if (err) throw err;
          expect(res.body.text).to.eq("https://github.com/andrewvy/slack-pongbot");
        });
    });
  });

  describe('LOG_LEVEL', function() {
    beforeEach(function () {
      sinon.spy(console, 'log');
    });

    afterEach(function () {
      console.log.restore();
    });

    it("doesn't log", function (done) {
      request(app)
        .post('/')
        .send({ text: 'pongbot help' })
        .expect(200)
        .end(function(err, res){
          if (err) throw err;
          expect(console.log.calledOnce).to.be.false;
          done();
        });
    });

    describe('with LOG_LEVEL=debug', function () {
      beforeEach(function () {
        process.env.LOG_LEVEL = 'debug';
      });

      afterEach(function () {
        delete(process.env.LOG_LEVEL);
      });

      it("logs hook", function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot help' })
          .expect(200)
          .end(function(err, res){
            if (err) throw err;
            expect(console.log.calledOnce).to.be.true;
            done();
          });
      });
    });
  });

  describe('hug', function() {
    it('mean pongbot', function () {
      request(app)
        .post('/')
        .send({ text: 'pongbot hug' })
        .expect(200)
        .end(function(err, res){
          if (err) throw err;
          expect(res.body.text).to.eq("No.");
        });
    });
  });

  describe('sucks', function() {
    it('no, you suck', function () {
      request(app)
        .post('/')
        .send({ text: 'pongbot sucks' })
        .expect(200)
        .end(function(err, res){
          if (err) throw err;
          expect(res.body.text).to.eq("No, you suck.");
        });
    });
  });
});
