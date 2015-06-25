var chai = require('chai');
chai.use(require('chai-string'));
var expect = chai.expect;
var pong = require('../lib/pong.js');
var Player = require('../models/Player');
var Challenge = require('../models/Challenge');
var sinon = require('sinon');

describe('Pong', function () {
  require('./shared').setup();

  describe('#registerPlayer', function () {
    beforeEach(function (done) {
      pong.registerPlayer('ZhangJike').then(function () {
        done();
      });
    });

    it('creates a player record', function (done) {
      Player.where({ user_name: 'ZhangJike' }).findOne(function (err, player) {
        expect(player).not.to.be.null;
        expect(player.user_name).to.eq('ZhangJike');
        expect(player.wins).to.eq(0);
        expect(player.losses).to.eq(0);
        expect(player.elo).to.eq(0);
        expect(player.tau).to.eq(0);
        done();
      });
    });

    it('does not create a duplicate player', function (done) {
      pong.registerPlayer('ZhangJike').then(null).then(undefined, function (err) {
        expect(err).to.not.be.undefined;
        expect(err.code).to.eq(11000);
        done();
      });
    });
  });

  describe('#findPlayer', function () {
    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', { user_id: 'U02BEFY4U' }).then(function () {
          done();
        });
      });

      it('finds a player by name', function (done) {
        pong.findPlayer('ZhangJike').then(function (player) {
          expect(player).not.to.be.null;
          expect(player.user_id).to.eq('U02BEFY4U');
          expect(player.user_name).to.eq('ZhangJike');
          done();
        });
      });

      it('finds a player by lowercase name', function (done) {
        pong.findPlayer('zhangjike').then(function (player) {
          expect(player).not.to.be.null;
          expect(player.user_id).to.eq('U02BEFY4U');
          expect(player.user_name).to.eq('ZhangJike');
          done();
        });
      });

      it('finds a player by ID', function (done) {
        pong.findPlayer('<@U02BEFY4U>').then(function (player) {
          expect(player).not.to.be.null;
          expect(player.user_id).to.eq('U02BEFY4U');
          expect(player.user_name).to.eq('ZhangJike');
          done();
        });
      });
    });

    describe('without a player', function () {
      it("doesn't find player", function (done) {
        pong.findPlayer('ZhangJike').then(undefined, function(err) {
          expect(err).to.not.be.null;
          expect(err.message).to.eq("Player 'ZhangJike' does not exist.");
          done();
        });
      });
    });
  });

  describe('#findPlayers', function () {
    describe('with two players', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping']).then(function () {
          done();
        });
      });

      it('finds both players', function (done) {
        pong.findPlayers(['ZhangJike', 'DengYaping']).then(function (players) {
          expect(players.length).to.eq(2);
          expect(players[0].user_name).to.eq('ZhangJike');
          expect(players[1].user_name).to.eq('DengYaping');
          done();
        });
      });
    });

    describe('without a player', function () {
      it("doesn't find player", function (done) {
        pong.findPlayer('ZhangJike').then(undefined).then(undefined, function (err) {
          expect(err).to.not.be.null;
          expect(err.message).to.eq("Player 'ZhangJike' does not exist.");
          done();
        });
      });
    });
  });

  describe('updateWins', function () {
    it('returns an error when a user cannot be found', function (done) {
      pong.updateWins(['ZhangJike']).then(undefined, function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("Player 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike').then(function () {
          done();
        });
      });

      it('increments the number of wins', function (done) {
        pong.updateWins(['ZhangJike']).then(function (player) {
          pong.findPlayer('ZhangJike').then(function (player) {
            expect(player.wins).to.eq(1);
            done();
          });
        });
      });

      it('increments the number of wins twice', function (done) {
        pong.updateWins(['ZhangJike']).then(function (player) {
          pong.updateWins(['ZhangJike']).then(function (player) {
            pong.findPlayer('ZhangJike').then(function (player) {
              expect(player.wins).to.eq(2);
              done();
            });
          });
        });
      });
    });

    describe('with two players', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping']).then(function () {
          done();
        });
      });

      it('increments the number of wins', function (done) {
        pong.updateWins(['ZhangJike', 'DengYaping']).then(function (players) {
          pong.findPlayers(['ZhangJike', 'DengYaping']).then(function(players) {
            expect(players[0].wins).to.eq(1);
            expect(players[1].wins).to.eq(1);
          }).then(function () {
            done();
          });
        });
      });
    });

  });

  describe('updateLosses', function () {
    it('returns an error when a player cannot be found', function (done) {
      pong.updateLosses(['ZhangJike']).then(undefined, function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("Player 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike').then(function () {
          done();
        });
      });

      it('increments the number of loss', function (done) {
        pong.updateLosses(['ZhangJike']).then(function (player) {
          pong.findPlayer('ZhangJike').then(function (player) {
            expect(player.losses).to.eq(1);
            done();
          });
        });
      });

      it('increments the number of loss twice', function (done) {
        pong.updateLosses(['ZhangJike']).then(function (player) {
          pong.updateLosses(['ZhangJike']).then(function (player) {
            pong.findPlayer('ZhangJike').then(function (player) {
              expect(player.losses).to.eq(2);
              done();
            });
          });
        });
      });

      describe('with another player', function () {
        beforeEach(function (done) {
          pong.registerPlayer('DengYaping').then(function () {
            done();
          });
        });

        it('increments the number of losses for multiple players', function (done) {
          pong.updateLosses(['ZhangJike', 'DengYaping']).then(function () {
            pong.findPlayers(['ZhangJike', 'DengYaping']).then(function(players) {
              expect(players[0].losses).to.eq(1);
              expect(players[1].losses).to.eq(1);
            }).then(function () {
              done();
            });
          });
        });
      });

    });
  });

  describe('setChallenge', function () {
    it('returns an error when a player cannot be found', function (done) {
      pong.setChallenge(['ZhangJike'], null).then(undefined, function(err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("Player 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike').then(function() {
          done();
        });
      });

      it('sets challenge', function(done) {
        new Challenge({
          state: 'Proposed',
          type: 'Singles',
          date: Date.now(),
          challenger: ['ZhangJike'],
          challenged: ['DengYaping']
        }).save().then(function(challenge) {
          pong.setChallenge(['ZhangJike'], challenge._id).then(function () {
            pong.findPlayer('ZhangJike').then(function (player) {
              expect(player.currentChallenge.equals(challenge._id)).to.be.true;
              done();
            });
          });
        });
      });
    });

    describe('with two players', function () {
      var challenge = null;
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping']).then(function() {
          challenge = new Challenge({
            state: 'Proposed',
            type: 'Singles',
            date: Date.now(),
            challenger: ['ZhangJike'],
            challenged: ['DengYaping']
          });
          challenge.save().then(function () {
            done();
          });
        });
      });

      it('sets challenge', function(done) {
        pong.setChallenge(['ZhangJike', 'DengYaping'], challenge._id).then(function () {
          pong.findPlayers(['ZhangJike', 'DengYaping']).then(function(players) {
            expect(players[0].currentChallenge.equals(challenge._id)).to.be.true;
            expect(players[1].currentChallenge.equals(challenge._id)).to.be.true;
          }).then(function () {
            done();
          });
        });
      });
    });
  });

  describe('checkChallenge', function () {
    describe('with a challenge already set', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping']).then(function(players) {
          pong.createSingleChallenge('ZhangJike', 'DengYaping').then(function (challenge) {
            done();
          });
        });
      });

      it('fails on check challenge from challenger', function(done) {
        pong.checkChallenge(['ZhangJike', 'DengYaping']).then(undefined, function (err) {
          expect(err.message).to.eq("There's already an active challenge between ZhangJike and DengYaping.");
          done();
        });
      });

      it('fails on check challenge from chellenged', function(done) {
        pong.checkChallenge(['DengYaping', 'ZhangJike']).then(undefined, function (err) {
          expect(err.message).to.eq("There's already an active challenge between ZhangJike and DengYaping.");
          done();
        });
      });
    });
  });

  describe('ensureUniquePlayers', function () {
    beforeEach(function (done) {
      pong.registerPlayers(['ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna']).then(function () {
        done();
      });
    });

    it('fails with a duplicate', function (done) {
      pong.ensureUniquePlayers(['ZhangJike', 'ZhangJike', 'ZhangJike', 'ChenQi']).then(undefined, function (err) {
        expect(err).to.not.be.null;
        expect(err.message).to.eq('Does ZhangJike have 6 hands?');
        done();
      });
    });

    it('succeeds without a duplicate', function (done) {
      pong.ensureUniquePlayers(['ZhangJike', 'ViktorBarna']).then(function (players) {
        expect(players).to.eql(['ZhangJike','ViktorBarna']);
        done();
      });
    });
  });

  describe('createSingleChallenge', function () {
    it('returns an error when the challenger cannot be found', function (done) {
      pong.createSingleChallenge('ZhangJike', 'DengYaping').then(undefined, function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("Player 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a challenger', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike').then(function () {
          done();
        });
      });

      it('requires all players to be unique', function (done) {
        pong.createSingleChallenge('ZhangJike', 'ZhangJike').then(undefined, function (err) {
          expect(err).to.not.be.null;
          expect(err.message).to.eq("Does ZhangJike have 4 hands?");
          done();
        });
      });

      it('returns an error when the challenged cannot be found', function (done) {
        pong.createSingleChallenge('ZhangJike', 'DengYaping').then(undefined, function (err) {
          expect(err).not.to.be.null;
          expect(err.message).to.eq("Player 'DengYaping' does not exist.");
          done();
        });
      });

      describe('with a challenged', function () {
        beforeEach(function (done) {
          pong.registerPlayer('DengYaping').then(function () {
            done();
          });
        });

        it('creates a challenge', function (done) {
          pong.createSingleChallenge('ZhangJike', 'DengYaping').then(function (result) {
            expect(result.message).to.eq("ZhangJike has challenged DengYaping to a ping pong match!");
            expect(result.challenge).to.not.be.null;
            pong.findPlayers(['ZhangJike', 'DengYaping']).then(function(players) {
              var challenger = players[0];
              var challenged = players[1];
              expect(challenger.currentChallenge).to.not.be.undefined;
              expect(result.challenge._id.equals(challenger.currentChallenge)).to.be.true;
              expect(challenged.currentChallenge).to.not.be.undefined;
              expect(challenged.currentChallenge.equals(challenger.currentChallenge)).to.be.true;
              done();
            });
          });
        });

        describe('with an existing challenge', function (done) {
          beforeEach(function (done) {
            pong.createSingleChallenge('ZhangJike', 'DengYaping').then(function() {
              done();
            });
          });

          it('fails to create a challenge', function (done) {
            pong.createSingleChallenge('ZhangJike', 'DengYaping').then(undefined, function (err) {
              expect(err).to.not.be.null;
              expect(err.message).to.eq("There's already an active challenge between ZhangJike and DengYaping.");
              done();
            });
          });
        });
      });
    });
  });

  describe('createDoubleChallenge', function () {
    describe('with 4 players', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna']).then(function () {
          done();
        });
      });

      it('creates a challenge', function (done) {
        pong.createDoubleChallenge('ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna').then(function (result) {
          expect(result).to.not.be.null;
          expect(result.message).to.eq("ZhangJike and DengYaping have challenged ChenQi and ViktorBarna to a ping pong match!");
          expect(result.challenge).to.not.be.null;
          pong.findPlayers(['ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna']).then(function (players) {
            expect(players[0].currentChallenge.equals(result.challenge._id)).to.be.true;
            expect(players[1].currentChallenge.equals(result.challenge._id)).to.be.true;
            expect(players[2].currentChallenge.equals(result.challenge._id)).to.be.true;
            expect(players[3].currentChallenge.equals(result.challenge._id)).to.be.true;
          }).then(function () {
            done();
          });
        });
      });

      it('with an existing challenge between two of the players', function (done) {
        pong.createSingleChallenge('ZhangJike', 'DengYaping').then(function (challenge) {
          pong.createDoubleChallenge('ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna').then(undefined, function (err) {
            expect(err).to.not.be.null;
            expect(err.message).to.eq("There's already an active challenge between ZhangJike and DengYaping.");
            done();
          });
        });
      });

      it('requires all players to be unique', function (done) {
        pong.createDoubleChallenge('ZhangJike', 'ZhangJike', 'ChenQi', 'ViktorBarna').then(undefined, function (err) {
          expect(err).to.not.be.null;
          expect(err.message).to.eq("Does ZhangJike have 4 hands?");
          done();
        });
      });
    });
  });

  describe('acceptChallenge', function () {
    describe('with a singles challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping']).then(function () {
          pong.createSingleChallenge('ZhangJike', 'DengYaping').then(function () {
            done();
          });
        });
      });

      it('accepts challenge', function (done) {
        pong.acceptChallenge('DengYaping').then(function (result) {
          expect(result.message).to.eq("DengYaping accepted ZhangJike's challenge.");
          expect(result.challenge.state).to.eq('Accepted');
          done();
        });
      });

      it("can't accept a challenge twice", function (done) {
        pong.acceptChallenge('DengYaping').then(function (challenge) {
          pong.acceptChallenge('DengYaping').then(undefined, function (err) {
            expect(err.message).to.eq("You have already accepted ZhangJike's challenge.");
            done();
          });
        });
      });

      it("can't accept your own challenge", function (done) {
        pong.acceptChallenge('ZhangJike').then(undefined, function (err) {
          expect(err.message).to.eq('Please wait for DengYaping to accept your challenge.');
          done();
        });
      });

      it("can't accept a challenge that doesn't exist", function (done) {
        pong.registerPlayer('ChenQi').then(function () {
          pong.acceptChallenge('DengYaping').then(function (challenge) {
            pong.acceptChallenge('ChenQi').then(undefined, function (err) {
              expect(err.message).to.eq('No challenge to accept.');
              done();
            });
          });
        });
      });
    });

    describe('with a doubles challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna']).then(function () {
          pong.createDoubleChallenge('ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna').then(function () {
            done();
          });
        });
      });

      it('accepts challenge with opponent one', function (done) {
        pong.acceptChallenge('ChenQi').then(function (result) {
          expect(result.message).to.eq("ChenQi accepted ZhangJike and DengYaping's challenge.");
          expect(result.challenge.state).to.eq('Accepted');
          done();
        });
      });

      it('accepts challenge with opponent two', function (done) {
        pong.acceptChallenge('ViktorBarna').then(function (result) {
          expect(result.message).to.eq("ViktorBarna accepted ZhangJike and DengYaping's challenge.");
          expect(result.challenge.state).to.eq('Accepted');
          done();
        });
      });

      it("can't accept your own challenge with player one", function (done) {
        pong.acceptChallenge('ZhangJike').then(undefined, function (err) {
          expect(err.message).to.eq('Please wait for ChenQi or ViktorBarna to accept your challenge.');
          done();
        });
      });

      it("can't accept your own challenge with player two", function (done) {
        pong.acceptChallenge('DengYaping').then(undefined, function (err) {
          expect(err.message).to.eq('Please wait for ChenQi or ViktorBarna to accept your challenge.');
          done();
        });
      });
    });
  });

  describe('declineChallenge', function () {
    describe('with a singles challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping']).then(function () {
          pong.createSingleChallenge('ZhangJike', 'DengYaping').then(function () {
            done();
          });
        });
      });

      it('declines challenge', function (done) {
        pong.declineChallenge('DengYaping').then(function (result) {
          expect(result.message).to.eq("DengYaping declined ZhangJike's challenge.");
          expect(result.challenge.state).to.eq('Declined');
          done();
        });
      });

      it("can't decline your own challenge", function (done) {
        pong.declineChallenge('ZhangJike').then(undefined, function (err) {
          expect(err.message).to.eq("Please wait for DengYaping to accept or decline your challenge.");
          done();
        });
      });

      it("can't decline a challenge twice", function (done) {
        pong.declineChallenge('DengYaping').then(function (challenge) {
          pong.declineChallenge('DengYaping').then(undefined, function (err) {
            expect(err.message).to.eq("No challenge to decline.");
            done();
          });
        });
      });
    });

    describe('with a doubles challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna']).then(function () {
          pong.createDoubleChallenge('ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna').then(function () {
            done();
          });
        });
      });

      it('declines challenge with opponent one', function (done) {
        pong.declineChallenge('ChenQi').then(function (result) {
          expect(result.message).to.eq("ChenQi declined ZhangJike and DengYaping's challenge.");
          expect(result.challenge.state).to.eq('Declined');
          done();
        });
      });

      it('declines challenge with opponent two', function (done) {
        pong.declineChallenge('ViktorBarna').then(function (result) {
          expect(result.message).to.eq("ViktorBarna declined ZhangJike and DengYaping's challenge.");
          expect(result.challenge.state).to.eq('Declined');
          done();
        });
      });

      it("can't decline your own challenge with player one", function (done) {
        pong.declineChallenge('ZhangJike').then(undefined, function (err) {
          expect(err.message).to.eq('Please wait for ChenQi or ViktorBarna to accept or decline your challenge.');
          done();
        });
      });

      it("can decline your own challenge with player two", function (done) {
        pong.declineChallenge('DengYaping').then(function (result) {
          expect(result.message).to.eq("DengYaping declined ZhangJike's challenge against ChenQi and ViktorBarna.");
          expect(result.challenge.state).to.eq('Declined');
          done();
        });
      });
    });
  });

  describe('chickenChallenge', function () {
    describe('with a singles challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping']).then(function () {
          pong.createSingleChallenge('ZhangJike', 'DengYaping').then(function () {
            done();
          });
        });
      });

      it('chickens out of the challenge', function (done) {
        pong.chickenChallenge('ZhangJike').then(function (result) {
          expect(result.message).to.eq("ZhangJike chickened out of the challenge against DengYaping.");
          expect(result.challenge.state).to.eq('Chickened');
          done();
        });
      });

      it("can't chicken out of the challenge twice", function (done) {
        pong.chickenChallenge('ZhangJike').then(function (result) {
          pong.chickenChallenge('ZhangJike').then(undefined, function (err) {
            expect(err.message).to.eq("First, challenge someone!");
            done();
          });
        });
      });

      it("can't chicken out of someone else's challenge", function (done) {
        pong.chickenChallenge('DengYaping').then(undefined, function (err) {
          expect(err.message).to.eq("Only ZhangJike can do that.");
          done();
        });
      });

      describe('after it is accepted', function () {
        beforeEach(function (done) {
          pong.acceptChallenge('DengYaping').then(function (result) {
            done();
          });
        });

        it('chickens out of the challenge for the challenger', function (done) {
          pong.chickenChallenge('ZhangJike').then(function (result) {
            expect(result.message).to.eq("ZhangJike chickened out of the challenge against DengYaping.");
            expect(result.challenge.state).to.eq('Chickened');
            done();
          });
        });

        it('chickens out of the challenge for the challenged', function (done) {
          pong.chickenChallenge('DengYaping').then(function (result) {
            expect(result.message).to.eq("DengYaping chickened out of the challenge against ZhangJike.");
            expect(result.challenge.state).to.eq('Chickened');
            done();
          });
        });
      });
    });

    describe('with a doubles challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna']).then(function () {
          pong.createDoubleChallenge('ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna').then(function () {
            done();
          });
        });
      });

      it('chickens out of the challenge with opponent one', function (done) {
        pong.chickenChallenge('ZhangJike').then(function (result) {
          expect(result.message).to.eq("ZhangJike chickened out of the challenge against ChenQi and ViktorBarna.");
          expect(result.challenge.state).to.eq('Chickened');
          done();
        });
      });

      it("can't chicken out of the the challenge with player two", function (done) {
        pong.chickenChallenge('DengYaping').then(undefined, function (err) {
          expect(err.message).to.eq('Only ZhangJike can do that.');
          done();
        });
      });

      it("can't chicken out of the the challenge with player three", function (done) {
        pong.chickenChallenge('ChenQi').then(undefined, function (err) {
          expect(err.message).to.eq('Only ZhangJike can do that.');
          done();
        });
      });

      it("can't chicken out of the the challenge with player four", function (done) {
        pong.chickenChallenge('ViktorBarna').then(undefined, function (err) {
          expect(err.message).to.eq('Only ZhangJike can do that.');
          done();
        });
      });

      describe('after it is accepted', function () {
        beforeEach(function (done) {
          pong.acceptChallenge('ChenQi').then(function (result) {
            done();
          });
        });

        it('chickens out of the challenge for the challenger', function (done) {
          pong.chickenChallenge('ZhangJike').then(function (result) {
            expect(result.message).to.eq("ZhangJike chickened out of the challenge against ChenQi and ViktorBarna.");
            expect(result.challenge.state).to.eq('Chickened');
            done();
          });
        });

        it('chickens out of the challenge for player two', function (done) {
          pong.chickenChallenge('DengYaping').then(function (result) {
            expect(result.message).to.eq("DengYaping chickened out of the challenge against ChenQi and ViktorBarna.");
            expect(result.challenge.state).to.eq('Chickened');
            done();
          });
        });

        it('chickens out of the challenge for player three', function (done) {
          pong.chickenChallenge('ChenQi').then(function (result) {
            expect(result.message).to.eq("ChenQi chickened out of the challenge against ZhangJike and DengYaping.");
            expect(result.challenge.state).to.eq('Chickened');
            done();
          });
        });

        it('chickens out of the challenge for player four', function (done) {
          pong.chickenChallenge('ViktorBarna').then(function (result) {
            expect(result.message).to.eq("ViktorBarna chickened out of the challenge against ZhangJike and DengYaping.");
            expect(result.challenge.state).to.eq('Chickened');
            done();
          });
        });
      });
    });
  });

  describe('calculateTeamElo', function () {
    beforeEach(function (done) {
      pong.registerPlayer('ZhangJike', { elo: 4 }).then(function () {
        pong.registerPlayer('DengYaping', { elo: 2 }).then(function () {
          done();
        });
      });
    });

    it('returns average of elo', function (done) {
      pong.calculateTeamElo('ZhangJike', 'DengYaping').then(function (elo) {
        expect(elo).to.eq(3);
        done();
      });
    });
  });

  describe('eloSinglesChange', function () {
    beforeEach(function (done) {
      pong.registerPlayers(['ZhangJike', 'DengYaping']).then(function () {
        done();
      });
    });

    it('updates elo after a challenge', function (done) {
      pong.eloSinglesChange('ZhangJike', 'DengYaping').then().spread(function (winner, loser) {
        expect(winner.elo).to.eq(48);
        expect(winner.tau).to.eq(0.5);
        expect(loser.elo).to.eq(-48);
        expect(loser.tau).to.eq(0.5);
        done();
      });
    });
  });

  describe('eloDoublesChange', function () {
    beforeEach(function (done) {
      pong.registerPlayers(['ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna']).then(function () {
        done();
      });
    });

    it('updates elo after a challenge', function (done) {
      pong.eloDoublesChange('ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna').then().spread(function (p1, p2, p3, p4) {
        expect(p1.elo).to.eq(48);
        expect(p1.tau).to.eq(0.5);
        expect(p2.elo).to.eq(48);
        expect(p2.tau).to.eq(0.5);
        expect(p3.elo).to.eq(-48);
        expect(p3.tau).to.eq(0.5);
        expect(p4.elo).to.eq(-48);
        expect(p4.tau).to.eq(0.5);
        done();
      });
    });
  });

  describe('win and lose', function () {
    describe('with a single challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping']).then(function () {
          pong.createSingleChallenge('ZhangJike', 'DengYaping').then(function () {
            done();
          });
        });
      });

      it('challenge must be accepted', function (done) {
        pong.win('ZhangJike').then(undefined, function (err) {
          expect(err).not.to.be.null;
          expect(err.message).to.eq("Challenge needs to be accepted before recording match.");
          done();
        });
      });

      describe('challenge accepted', function () {
        beforeEach(function (done) {
          pong.acceptChallenge('DengYaping').then(function () {
            done();
          });
        });

        it('player one wins', function (done) {
          pong.win('ZhangJike').then(function (result) {
            expect(result.message).to.eq("Match has been recorded, ZhangJike defeated DengYaping.");
            pong.findPlayers(['ZhangJike', 'DengYaping']).then().spread(function (p1, p2) {
              expect(p1.wins).to.eq(1);
              expect(p1.tau).to.eq(0.5);
              expect(p1.elo).to.eq(48);
              expect(p1.losses).to.eq(0);
              expect(p2.wins).to.eq(0);
              expect(p2.tau).to.eq(0.5);
              expect(p2.elo).to.eq(-48);
              expect(p2.losses).to.eq(1);
              done();
            });
          });
        });

        it('player two wins', function (done) {
          pong.win('DengYaping').then(function (result) {
            expect(result.message).to.eq("Match has been recorded, DengYaping defeated ZhangJike.");
            pong.findPlayers(['DengYaping', 'ZhangJike']).then().spread(function (p1, p2) {
              expect(p1.wins).to.eq(1);
              expect(p1.tau).to.eq(0.5);
              expect(p1.elo).to.eq(48);
              expect(p1.losses).to.eq(0);
              expect(p2.wins).to.eq(0);
              expect(p2.tau).to.eq(0.5);
              expect(p2.elo).to.eq(-48);
              expect(p2.losses).to.eq(1);
              done();
            });
          });
        });

        it('player one loses', function (done) {
          pong.lose('ZhangJike').then(function (result) {
            expect(result.message).to.eq("Match has been recorded, DengYaping defeated ZhangJike.");
            pong.findPlayers(['DengYaping', 'ZhangJike']).then().spread(function (p1, p2) {
              expect(p1.wins).to.eq(1);
              expect(p1.tau).to.eq(0.5);
              expect(p1.elo).to.eq(48);
              expect(p1.losses).to.eq(0);
              expect(p2.wins).to.eq(0);
              expect(p2.tau).to.eq(0.5);
              expect(p2.elo).to.eq(-48);
              expect(p2.losses).to.eq(1);
              done();
            });
          });
        });

        it('player two loses', function (done) {
          pong.lose('DengYaping').then(function (result) {
            expect(result.message).to.eq("Match has been recorded, ZhangJike defeated DengYaping.");
            pong.findPlayers(['ZhangJike', 'DengYaping']).then().spread(function (p1, p2) {
              expect(p1.wins).to.eq(1);
              expect(p1.tau).to.eq(0.5);
              expect(p1.elo).to.eq(48);
              expect(p1.losses).to.eq(0);
              expect(p2.wins).to.eq(0);
              expect(p2.tau).to.eq(0.5);
              expect(p2.elo).to.eq(-48);
              expect(p2.losses).to.eq(1);
              done();
            });
          });
        });
      });
    });

    describe('with an accepted doubles challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna']).then(function () {
          pong.createDoubleChallenge('ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna').then(function (challenge) {
            pong.acceptChallenge('ChenQi').then(function () {
                done();
            });
          });
        });
      });

      it('player one wins', function (done) {
        pong.win('ZhangJike').then(function (result) {
          expect(result).not.to.be.null;
          expect(result.message).to.eq("Match has been recorded, ZhangJike and DengYaping defeated ChenQi and ViktorBarna.");
          pong.findPlayers(['ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna']).then().spread(function (p1, p2, p3, p4) {
            expect(p1.wins).to.eq(1);
            expect(p1.tau).to.eq(0.5);
            expect(p1.elo).to.eq(48);
            expect(p1.losses).to.eq(0);
            expect(p2.wins).to.eq(1);
            expect(p2.tau).to.eq(0.5);
            expect(p2.elo).to.eq(48);
            expect(p2.losses).to.eq(0);
            expect(p3.wins).to.eq(0);
            expect(p3.tau).to.eq(0.5);
            expect(p3.elo).to.eq(-48);
            expect(p3.losses).to.eq(1);
            expect(p4.wins).to.eq(0);
            expect(p4.tau).to.eq(0.5);
            expect(p4.elo).to.eq(-48);
            expect(p4.losses).to.eq(1);
            done();
          });
        });
      });

      it('player two wins', function (done) {
        pong.win('DengYaping').then(function (result) {
          expect(result).not.to.be.null;
          expect(result.message).to.eq("Match has been recorded, ZhangJike and DengYaping defeated ChenQi and ViktorBarna.");
          pong.findPlayers(['ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna']).then().spread(function (p1, p2, p3, p4) {
            expect(p1.wins).to.eq(1);
            expect(p1.tau).to.eq(0.5);
            expect(p1.elo).to.eq(48);
            expect(p1.losses).to.eq(0);
            expect(p2.wins).to.eq(1);
            expect(p2.tau).to.eq(0.5);
            expect(p2.elo).to.eq(48);
            expect(p2.losses).to.eq(0);
            expect(p3.wins).to.eq(0);
            expect(p3.tau).to.eq(0.5);
            expect(p3.elo).to.eq(-48);
            expect(p3.losses).to.eq(1);
            expect(p4.wins).to.eq(0);
            expect(p4.tau).to.eq(0.5);
            expect(p4.elo).to.eq(-48);
            expect(p4.losses).to.eq(1);
            done();
          });
        });
      });

      it('player three wins', function (done) {
        pong.win('ChenQi').then(function (result) {
          expect(result).not.to.be.null;
          expect(result.message).to.eq("Match has been recorded, ChenQi and ViktorBarna defeated ZhangJike and DengYaping.");
          pong.findPlayers(['ChenQi', 'ViktorBarna', 'ZhangJike', 'DengYaping']).then().spread(function (p1, p2, p3, p4) {
            expect(p1.wins).to.eq(1);
            expect(p1.tau).to.eq(0.5);
            expect(p1.elo).to.eq(48);
            expect(p1.losses).to.eq(0);
            expect(p2.wins).to.eq(1);
            expect(p2.tau).to.eq(0.5);
            expect(p2.elo).to.eq(48);
            expect(p2.losses).to.eq(0);
            expect(p3.wins).to.eq(0);
            expect(p3.tau).to.eq(0.5);
            expect(p3.elo).to.eq(-48);
            expect(p3.losses).to.eq(1);
            expect(p4.wins).to.eq(0);
            expect(p4.tau).to.eq(0.5);
            expect(p4.elo).to.eq(-48);
            expect(p4.losses).to.eq(1);
            done();
          });
        });
      });

      it('player four wins', function (done) {
        pong.win('ViktorBarna').then(function (result) {
          expect(result).not.to.be.null;
          expect(result.message).to.eq("Match has been recorded, ChenQi and ViktorBarna defeated ZhangJike and DengYaping.");
          pong.findPlayers(['ChenQi', 'ViktorBarna', 'ZhangJike', 'DengYaping']).then().spread(function (p1, p2, p3, p4) {
            expect(p1.wins).to.eq(1);
            expect(p1.tau).to.eq(0.5);
            expect(p1.elo).to.eq(48);
            expect(p1.losses).to.eq(0);
            expect(p2.wins).to.eq(1);
            expect(p2.tau).to.eq(0.5);
            expect(p2.elo).to.eq(48);
            expect(p2.losses).to.eq(0);
            expect(p3.wins).to.eq(0);
            expect(p3.tau).to.eq(0.5);
            expect(p3.elo).to.eq(-48);
            expect(p3.losses).to.eq(1);
            expect(p4.wins).to.eq(0);
            expect(p4.tau).to.eq(0.5);
            expect(p4.elo).to.eq(-48);
            expect(p4.losses).to.eq(1);
            done();
          });
        });
      });

      it('player one loses', function (done) {
        pong.lose('ZhangJike').then(function (result) {
          expect(result).not.to.be.null;
          expect(result.message).to.eq("Match has been recorded, ChenQi and ViktorBarna defeated ZhangJike and DengYaping.");
          pong.findPlayers(['ChenQi', 'ViktorBarna', 'ZhangJike', 'DengYaping']).then().spread(function (p1, p2, p3, p4) {
            expect(p1.wins).to.eq(1);
            expect(p1.tau).to.eq(0.5);
            expect(p1.elo).to.eq(48);
            expect(p1.losses).to.eq(0);
            expect(p2.wins).to.eq(1);
            expect(p2.tau).to.eq(0.5);
            expect(p2.elo).to.eq(48);
            expect(p2.losses).to.eq(0);
            expect(p3.wins).to.eq(0);
            expect(p3.tau).to.eq(0.5);
            expect(p3.elo).to.eq(-48);
            expect(p3.losses).to.eq(1);
            expect(p4.wins).to.eq(0);
            expect(p4.tau).to.eq(0.5);
            expect(p4.elo).to.eq(-48);
            expect(p4.losses).to.eq(1);
            done();
          });
        });
      });

      it('player two loses', function (done) {
        pong.lose('DengYaping').then(function (result) {
          expect(result).not.to.be.null;
          expect(result.message).to.eq("Match has been recorded, ChenQi and ViktorBarna defeated ZhangJike and DengYaping.");
          pong.findPlayers(['ChenQi', 'ViktorBarna', 'ZhangJike', 'DengYaping']).then().spread(function (p1, p2, p3, p4) {
            expect(p1.wins).to.eq(1);
            expect(p1.tau).to.eq(0.5);
            expect(p1.elo).to.eq(48);
            expect(p1.losses).to.eq(0);
            expect(p2.wins).to.eq(1);
            expect(p2.tau).to.eq(0.5);
            expect(p2.elo).to.eq(48);
            expect(p2.losses).to.eq(0);
            expect(p3.wins).to.eq(0);
            expect(p3.tau).to.eq(0.5);
            expect(p3.elo).to.eq(-48);
            expect(p3.losses).to.eq(1);
            expect(p4.wins).to.eq(0);
            expect(p4.tau).to.eq(0.5);
            expect(p4.elo).to.eq(-48);
            expect(p4.losses).to.eq(1);
            done();
          });
        });
      });

      it('player three loses', function (done) {
        pong.lose('ChenQi').then(function (result) {
          expect(result).not.to.be.null;
          expect(result.message).to.eq("Match has been recorded, ZhangJike and DengYaping defeated ChenQi and ViktorBarna.");
          pong.findPlayers(['ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna']).then().spread(function (p1, p2, p3, p4) {
            expect(p1.wins).to.eq(1);
            expect(p1.tau).to.eq(0.5);
            expect(p1.elo).to.eq(48);
            expect(p1.losses).to.eq(0);
            expect(p2.wins).to.eq(1);
            expect(p2.tau).to.eq(0.5);
            expect(p2.elo).to.eq(48);
            expect(p2.losses).to.eq(0);
            expect(p3.wins).to.eq(0);
            expect(p3.tau).to.eq(0.5);
            expect(p3.elo).to.eq(-48);
            expect(p3.losses).to.eq(1);
            expect(p4.wins).to.eq(0);
            expect(p4.tau).to.eq(0.5);
            expect(p4.elo).to.eq(-48);
            expect(p4.losses).to.eq(1);
            done();
          });
        });
      });

      it('player four loses', function (done) {
        pong.lose('ViktorBarna').then(function (result) {
          expect(result).not.to.be.null;
          expect(result.message).to.eq("Match has been recorded, ZhangJike and DengYaping defeated ChenQi and ViktorBarna.");
          pong.findPlayers(['ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna']).then().spread(function (p1, p2, p3, p4) {
            expect(p1.wins).to.eq(1);
            expect(p1.tau).to.eq(0.5);
            expect(p1.elo).to.eq(48);
            expect(p1.losses).to.eq(0);
            expect(p2.wins).to.eq(1);
            expect(p2.tau).to.eq(0.5);
            expect(p2.elo).to.eq(48);
            expect(p2.losses).to.eq(0);
            expect(p3.wins).to.eq(0);
            expect(p3.tau).to.eq(0.5);
            expect(p3.elo).to.eq(-48);
            expect(p3.losses).to.eq(1);
            expect(p4.wins).to.eq(0);
            expect(p4.tau).to.eq(0.5);
            expect(p4.elo).to.eq(-48);
            expect(p4.losses).to.eq(1);
            done();
          });
        });
      });
    });
  });

  describe('reset', function () {
    it('returns an error when a player cannot be found', function (done) {
      pong.reset('ZhangJike').then(undefined, function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("Player 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', { wins: 42, losses: 24, tau: 3, elo: 158 }).then(function (player) {
          done();
        });
      });

      it('resets player fields', function (done) {
        pong.reset('ZhangJike').then(function () {
          pong.findPlayer('ZhangJike').then(function (player) {
            expect(player.wins).to.eq(0);
            expect(player.tau).to.eq(1);
            expect(player.elo).to.eq(0);
            expect(player.losses).to.eq(0);
            done();
          });
        });
      });
    });
  });

  describe('resetAll', function () {
    describe('with two players', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', { wins: 42, losses: 24, tau: 3, elo: 158 }).then(function (player) {
          pong.registerPlayer('ViktorBarna', { wins: 4, losses: 4, tau: 3, elo: 18 }).then(function (player) {
            done();
          });
        });
      });

      it('resets all players', function (done) {
        pong.resetAll().then(function () {
          pong.findPlayers(['ZhangJike', 'ViktorBarna']).then().spread(function (p1, p2) {
            expect(p1.wins).to.eq(0);
            expect(p1.tau).to.eq(1);
            expect(p1.elo).to.eq(0);
            expect(p1.losses).to.eq(0);
            expect(p2.wins).to.eq(0);
            expect(p2.tau).to.eq(1);
            expect(p2.elo).to.eq(0);
            expect(p2.losses).to.eq(0);
            done();
          });
        });
      });
    });
  });

  describe('getDuelGif', function () {
    it('returns a gif', function (done) {
      pong.getDuelGif().then(function (gif) {
        expect(gif).to.startsWith('http');
        done();
      });
    });
  });
});
