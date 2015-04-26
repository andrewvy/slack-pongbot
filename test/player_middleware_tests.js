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

describe('Player Middleware', function () {
  require('./shared').setup();

  describe('with a pre-registered player with username', function () {
    beforeEach(function (done) {
      pong.registerPlayer('WangHao').then(function() {
        done();
      });
    });

    it('automatically updates ID', function (done) {
      request(app)
        .post('/')
        .send({ text: 'pongbot foobar', user_id: 'U02BEFY4U', user_name: 'WangHao' })
        .expect(200)
        .end(function(err, res){
          if (err) throw err;
          pong.findPlayer('<@U02BEFY4U>').then(function (player) {
            expect(player.user_id).to.eq('U02BEFY4U');
            expect(player.user_name).to.eq('WangHao');
            done();
          });
        });
    });

    it('does not update with a different ID', function (done) {
      request(app)
        .post('/')
        .send({ text: 'pongbot foobar', user_id: 'ZZZZZZZZ', user_name: 'NotWangHao' })
        .expect(200)
        .end(function(err, res){
          if (err) throw err;
          pong.findPlayer('WangHao').then(function (player) {
            expect(player.user_id).to.be.undefined;
            expect(player.user_name).to.eq('WangHao');
            done();
          });
        });
    });
  });

  describe('with a pre-registered player with username and ID', function () {
    beforeEach(function (done) {
      pong.registerPlayer('WangHao', { user_id: 'U02BEFY4U' }).then(function() {
        done();
      });
    });

    it('automatically keeps name in sync', function (done) {
      request(app)
        .post('/')
        .send({ text: 'pongbot foobar', user_id: 'U02BEFY4U', user_name: 'WangHaoWasRenamed' })
        .expect(200)
        .end(function(err, res){
          if (err) throw err;
          pong.findPlayer('<@U02BEFY4U>').then(function (player) {
            expect(player.user_id).to.eq('U02BEFY4U');
            expect(player.user_name).to.eq('WangHaoWasRenamed');
            done();
          });
        });
    });
  });
});


