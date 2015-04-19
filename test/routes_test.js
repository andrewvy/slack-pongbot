var chai = require('chai');
chai.use(require('chai-string'));
var expect = chai.expect;
var mongoose = require('mongoose');
var pong = require('../lib/pong.js');
var Player = require('../models/Player');
var Challenge = require('../models/Challenge');

var request = require('supertest');
var express = require('express');
var routes = require('../lib/routes.js');

var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.post('/', routes.index);

describe('Routes', function () {
  before(function (done) {
    pong.init();
    mongoose.connect('mongodb://localhost/pingpong_test', done);
  });

  after(function (done) {
    mongoose.disconnect(done);
  });

  beforeEach(function (done) {
    Player.remove(function () {
      Challenge.remove(done);
    });
  });

  it('unknown command', function () {
    request(app)
      .post('/')
      .send({ text: 'pongbot foobar' })
      .expect(200)
      .end(function(err, res){
        if (err) throw err;
        expect(res.body.text).to.eq("I couldn't understand that command. Use 'pongbot help' to get a list of available commands.");
      });
  });

  describe('register', function() {
    it('registers a new player', function () {
      request(app)
        .post('/')
        .send({ text: 'pongbot register', user_name: 'WangHao' })
        .expect(200)
        .end(function(err, res){
          if (err) throw err;
          expect(res.body.text).to.eq("Successfully registered! Welcome to the system, WangHao.");
        });
    });

    describe('with a pre-registered player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('WangHao', function() {
          done();
        });
      });

      it('does not register twice', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot register', user_name: 'WangHao' })
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
            expect(res.body.text).to.eq("User 'WangHao' does not exist. Are you registered? Use 'pongbot register' first.");
            done();
          });
      });
    });

    describe('with two players', function () {
      beforeEach(function (done) {
        pong.registerPlayer('WangHao', function () {
          pong.registerPlayer('ZhangJike', function () {
            done();
          });
        });
      });

      it('creates a challenge', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot challenge singles ZhangJike', user_name: 'WangHao' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.startsWith("You have challenged ZhangJike to a ping pong match!");
            done();
          });
      });
    });

    describe('with four players', function () {
      beforeEach(function (done) {
        pong.registerPlayer('WangHao', function () {
          pong.registerPlayer('ZhangJike', function () {
            pong.registerPlayer('ChenQi', function () {
              pong.registerPlayer('ViktorBarna', function () {
                done();
              });
            });
          });
        });
      });

      it('yields an error when user does not exist', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot challenge doubles ChenQi against ZhangJike GuoYue', user_name: 'WangHao' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.eq("Error: User 'GuoYue' does not exist.");
            done();
          });
      });

      it('creates a challenge', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot challenge doubles ChenQi against ZhangJike ViktorBarna', user_name: 'WangHao' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.startsWith("You and ChenQi have challenged ZhangJike and ViktorBarna to a ping pong match!");
            done();
          });
      });
    });
  });

  describe('accept and decline', function() {
    describe('with a challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayer('WangHao', function () {
          pong.registerPlayer('ZhangJike', function () {
            pong.createSingleChallenge('WangHao', 'ZhangJike', function () {
              done();
            });
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
    });

  });

  describe('won and lost', function() {
    describe('with an accepted challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayer('WangHao', function () {
          pong.registerPlayer('ZhangJike', function () {
            pong.createSingleChallenge('WangHao', 'ZhangJike', function () {
              pong.acceptChallenge('ZhangJike', function () {
                done();
              });
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
            expect(res.body.text).to.eq("Match has been recorded.");
            done();
          });
      });
    });
  });

  describe('rank', function() {
    describe('with a pre-registered player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('WangHao', function() {
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
    });
  });

  describe('leaderboard', function() {
    beforeEach(function (done) {
      pong.registerPlayer('WangHao', function (err, user) {
        user.wins = 4;
        user.losses = 3;
        user.tau = 3;
        user.elo = 58;
        user.save(function () {
          pong.registerPlayer('ZhangJike', function (err, user) {
            user.wins = 42;
            user.losses = 24;
            user.tau = 3;
            user.elo = 158;
            user.save(function () {
              done();
            });
          });
        });
      });
    });

    it('returns leaderboard', function (done) {
      request(app)
        .post('/')
        .send({ text: 'pongbot leaderboard 5', user_name: 'WangHao' })
        .expect(200)
        .end(function(err, res) {
          expect(res.body.text).to.eq("1. ZhangJike: 42 wins 24 losses (elo: 158)\n2. WangHao: 4 wins 3 losses (elo: 58)\n");
          done();
        });
    });
  });

  describe('reset', function() {
    describe('with a pre-registered player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('WangHao', function() {
          done();
        });
      });

      it('without admin rights', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot reset WangHao', user_name: 'WangHao' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.eq("You do not have admin rights.");
            done();
          });
      });

      it('with admin rights', function (done) {
        request(app)
          .post('/')
          .send({ text: 'pongbot reset WangHao', user_name: 'vy' })
          .expect(200)
          .end(function(err, res) {
            expect(res.body.text).to.eq("WangHao's stats have been reset.");
            done();
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
