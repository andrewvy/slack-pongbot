var chai = require('chai');
chai.use(require('chai-string'));
var expect = chai.expect;
var app = require('../lib/app').instance();
var pong = require('../lib/pong');
var request = require('supertest');

describe('Routes', function () {
  require('./shared').setup();

  describe('root', function () {
    it('returns links', function (done) {
      request(app)
        .get('/')
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          expect(res.body._links.self.href).to.endsWith('/');
          expect(res.body._links.players.href).to.endsWith('/players');
          expect(res.body._links.challenges.href).to.endsWith('/challenges');
          done();
        });
    });
  });

  describe('challenges', function() {
    describe('with a challenge', function () {
      var playerWangHoe = null;
      var playerZhangJike = null;
      var challengeBetweenWangHoeAndZhangJike = null;

      beforeEach(function (done) {
        pong.registerPlayers(['WangHao', 'ZhangJike']).then().spread(function (p1, p2) {
          playerWangHoe = p1;
          playerZhangJike = p2;
          pong.createSingleChallenge('WangHao', 'ZhangJike').then(function (result) {
            challengeBetweenWangHoeAndZhangJike = result.challenge;
            done();
          });
        });
      });

      it('returns challenges', function (done) {
        request(app)
          .get('/challenges')
          .expect(200)
          .end(function(err, res) {
            if (err) throw err;
            var challenges = res.body._embedded.challenges;
            expect(challenges.length).to.eq(1);
            var challenge = challenges[0];
            expect(challenge.state).to.eq('Proposed');
            expect(challenge.type).to.eq('Singles');
            expect(challenge._links.challengers[0].href).to.endsWith('/players/WangHao');
            expect(challenge._links.challenged[0].href).to.endsWith('/players/ZhangJike');
            done();
          });
      });

      it('returns a challenge by id', function (done) {
        request(app)
          .get('/challenges/' + challengeBetweenWangHoeAndZhangJike._id)
          .expect(200)
          .end(function(err, res) {
            if (err) throw err;
            var challenge = res.body;
            expect(challenge.state).to.eq('Proposed');
            expect(challenge.type).to.eq('Singles');
            expect(challenge._links.challengers[0].href).to.endsWith('/players/WangHao');
            expect(challenge._links.challenged[0].href).to.endsWith('/players/ZhangJike');
            done();
          });
      });
    });
  });

  describe('players', function() {
    describe('with 3 players', function () {
      var playerZhangJike = null;
      var playerDengYaping = null;
      var playerChenQi = null;
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping', 'ChenQi']).then().spread(function (p1, p2, p3) {
          playerZhangJike = p1;
          playerDengYaping = p2;
          playerWangHoe = p3;
          done();
        });
      });

      it('paginates players on page 1', function (done) {
        request(app)
          .get('/players?size=1')
          .expect(200)
          .end(function(err, res) {
            if (err) throw err;
            var players = res.body._embedded.players;
            expect(players.length).to.eq(1);
            var player = players[0];
            expect(player.user_name).to.eq('ZhangJike');
            expect(res.body._links.next.href).to.endsWith('/players?size=1&anchor=' + playerZhangJike._id);
            done();
          });
      });

      it('paginates players on page 2', function (done) {
        request(app)
          .get('/players?size=1&anchor=' + playerZhangJike._id)
          .expect(200)
          .end(function(err, res) {
            if (err) throw err;
            var players = res.body._embedded.players;
            expect(players.length).to.eq(1);
            var player = players[0];
            expect(player.user_name).to.eq('DengYaping');
            expect(res.body._links.next.href).to.endsWith('/players?size=1&anchor=' + playerDengYaping._id);
            done();
          });
      });

      it('paginates players on page 3', function (done) {
        request(app)
          .get('/players?size=1&anchor=' + playerDengYaping._id)
          .expect(200)
          .end(function(err, res) {
            if (err) throw err;
            var players = res.body._embedded.players;
            expect(players.length).to.eq(1);
            var player = players[0];
            expect(player.user_name).to.eq('ChenQi');
            expect(res.body._links.next.href).to.be.null;
            done();
          });
      });
    });

    describe('with a player', function () {
      var playerWangHoe = null;
      beforeEach(function (done) {
        pong.registerPlayer('WangHao').then(function (player) {
          playerWangHoe = player;
          done();
        });
      });

      it('returns players', function (done) {
        request(app)
          .get('/players')
          .expect(200)
          .end(function(err, res) {
            if (err) throw err;
            var players = res.body._embedded.players;
            expect(players.length).to.eq(1);
            var player = players[0];
            expect(player.user_name).to.eq('WangHao');
            done();
          });
      });

      it('returns a player by id', function (done) {
        request(app)
          .get('/players/' + playerWangHoe._id)
          .expect(200)
          .end(function(err, res) {
            if (err) throw err;
            var player = res.body;
            expect(player.user_name).to.eq('WangHao');
            done();
          });
      });

      it('redirects to a player by name', function (done) {
        request(app)
          .get('/players/WangHao')
          .expect(302)
          .end(function(err, res) {
            if (err) throw err;
            expect(res.headers.location).to.endsWith('/players/' + playerWangHoe._id);
            done();
          });
      });
    });
  });

  describe('leaderboard', function () {
    describe('with 3 players', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping', 'ChenQi']).then().spread(function (p1, p2, p3) {
          done();
        });
      });

      describe('without challenge', function () {
        it('returns no player', function (done) {
          request(app)
            .get('/leaderboard')
            .expect(200)
            .end(function(err, res) {
              if (err) throw err;
              var players = res.body._embedded.players;
              expect(players.length).to.eq(0);
              done();
            });
        });
      });

      describe('with 1 challenge', function () {
        beforeEach(function (done) {
          pong.createSingleChallenge('ZhangJike', 'DengYaping').then(function () {
            pong.acceptChallenge('DengYaping').then(function () {
              pong.lose('DengYaping').then(function () {
                done();
              });
            });
          });
        });

        it('returns 2 players', function (done) {
          request(app)
            .get('/leaderboard')
            .expect(200)
            .end(function(err, res) {
              if (err) throw err;
              var players = res.body._embedded.players;
              expect(players.length).to.eq(2);
              var player = players[0];
              expect(player.user_name).to.eq('ZhangJike');
              done();
            });
        });
      });
    });
  });
});
