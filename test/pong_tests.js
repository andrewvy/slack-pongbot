var chai = require('chai');
chai.use(require('chai-string'));
var expect = chai.expect;
var pong = require('../lib/pong.js');
var Player = require('../models/Player');
var Challenge = require('../models/Challenge');
var mongoose = require('mongoose');
var sinon = require('sinon');

describe('Pong', function () {
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

  describe('#init()', function () {
    it('sets channel', function () {
      expect(pong.channel).to.eq('#pongbot');
    });

    it('sets deltaTau', function () {
      expect(pong.deltaTau).to.eq(0.94);
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

      it('finds a @player', function (done) {
        pong.findPlayer('@ZhangJike', function (err, user) {
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

  describe('#findPlayers', function () {
    describe('with two players', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function() {
          pong.registerPlayer('DengYaping', function () {
            done();
          });
        });
      });

      it('finds both players', function (done) {
        pong.findPlayers(['ZhangJike', 'DengYaping'], function (err, players) {
          expect(err).to.be.null;
          expect(players.length).to.eq(2);
          expect(players[0].user_name).to.eq('ZhangJike');
          expect(players[1].user_name).to.eq('DengYaping');
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
      pong.updateWins(['ZhangJike'], function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("User 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function () {
          pong.updateWins(['ZhangJike'], done);
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
        pong.updateWins(['ZhangJike'], function () {
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
      pong.updateLosses(['ZhangJike'], function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("User 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function () {
          pong.updateLosses(['ZhangJike'], done);
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
        pong.updateLosses(['ZhangJike'], function () {
          pong.findPlayer('ZhangJike', function (err, user) {
            expect(err).to.be.null;
            expect(user.losses).to.eq(2);
            done();
          });
        });
      });
    });
  });

  describe('createSingleChallenge', function () {
    it('returns an error when the challenger cannot be found', function (done) {
      pong.createSingleChallenge('ZhangJike', 'DengYaping', function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("User 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a challenger', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', done);
      });

      it('requires all players to be unique', function (done) {
        pong.createSingleChallenge('ZhangJike', 'ZhangJike', function (err, challenge) {
          expect(err).to.not.be.null;
          expect(err.message).to.eq("Does ZhangJike have 4 hands?");
          done();
        });
      });

      it('returns an error when the challenged cannot be found', function (done) {
        pong.createSingleChallenge('ZhangJike', 'DengYaping', function (err) {
          expect(err).not.to.be.null;
          expect(err.message).to.eq("User 'DengYaping' does not exist.");
          done();
        });
      });

      describe('with a challenged', function () {
        beforeEach(function (done) {
          pong.registerPlayer('DengYaping', done);
        });

        it('creates a challenge', function (done) {
          pong.createSingleChallenge('ZhangJike', 'DengYaping', function (err, challenge) {
            expect(err).to.not.be.null;
            expect(err.message).to.eq("ZhangJike has challenged DengYaping to a ping pong match!");
            expect(challenge).to.not.be.null;
            pong.findPlayer('ZhangJike', function (err, challenger) {
              expect(challenger.currentChallenge).to.not.be.undefined;
              expect(challenge._id.equals(challenger.currentChallenge)).to.be.true;
              pong.findPlayer('DengYaping', function (err, challenged) {
                expect(challenged.currentChallenge).to.not.be.undefined;
                expect(challenged.currentChallenge.equals(challenger.currentChallenge)).to.be.true;
                done();
              });
            });
          });
        });

        describe('with an existing challenge', function (done) {
          beforeEach(function (done) {
            pong.createSingleChallenge('ZhangJike', 'DengYaping', function() {
              done();
            });
          });

          it('fails to create a challenge', function (done) {
            pong.createSingleChallenge('ZhangJike', 'DengYaping', function (err, challenge) {
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
        pong.registerPlayer('ZhangJike', function () {
          pong.registerPlayer('DengYaping', function () {
            pong.registerPlayer('ChenQi', function () {
              pong.registerPlayer('ViktorBarna', function () {
                done();
              });
            });
          });
        });
      });

      it('creates a challenge', function (done) {
        pong.createDoubleChallenge('ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna', function (err, challenge) {
          expect(err).to.not.be.null;
          expect(err.message).to.eq("ZhangJike and DengYaping have challenged ChenQi and ViktorBarna to a ping pong match!");
          expect(challenge).to.not.be.null;
          pong.findPlayer('ZhangJike', function (err, c1) {
            expect(c1.currentChallenge.equals(challenge._id)).to.be.true;
            pong.findPlayer('DengYaping', function (err, c2) {
              expect(c2.currentChallenge.equals(challenge._id)).to.be.true;
              pong.findPlayer('ChenQi', function (err, c3) {
                expect(c3.currentChallenge.equals(challenge._id)).to.be.true;
                pong.findPlayer('ViktorBarna', function (err, c4) {
                  expect(c4.currentChallenge.equals(challenge._id)).to.be.true;
                  done();
                });
              });
            });
          });
        });
      });

      it('with an existing challenge between two of the players', function (done) {
        pong.createSingleChallenge('ZhangJike', 'DengYaping', function (err, challenge) {
          pong.createDoubleChallenge('ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna', function (err, challenge) {
            expect(err).to.not.be.null;
            expect(err.message).to.eq("There's already an active challenge between ZhangJike and DengYaping.");
            done();
          });
        });
      });

      it('requires all players to be unique', function (done) {
        pong.createDoubleChallenge('ZhangJike', 'ZhangJike', 'ChenQi', 'ViktorBarna', function (err, challenge) {
          expect(err).to.not.be.null;
          expect(err.message).to.eq("Does ZhangJike have 4 hands?");
          done();
        });
      });
    });
  });

  describe('findChallenge', function () {
    it('returns an error when a user cannot be found', function (done) {
      pong.findChallenge('ZhangJike', function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("User 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function (err, user) {
          var challenge = new Challenge({
            state: 'Proposed',
            type: 'Singles',
            date: Date.now(),
            challenger: [],
            challenged: []
          });
          challenge.save(function () {
            user.currentChallenge = challenge.id;
            user.save(done);
          });
        });
      });

      it('returns current challenge', function (done) {
        pong.findChallenge('ZhangJike', function (err, challenge) {
          expect(err).to.be.null;
          expect(challenge.type).to.eq('Singles');
          done();
        });
      });
    });
  });

  describe('ensureNoChallenges', function () {
    it('returns an error when a user cannot be found', function (done) {
      pong.ensureNoChallenges(['ZhangJike'], function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("User 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function (err, user) {
          var challenge = new Challenge({
            state: 'Proposed',
            type: 'Singles',
            date: Date.now(),
            challenger: ['ZhangJike'],
            challenged: ['DengYaping']
          });
          challenge.save(function () {
            user.currentChallenge = challenge.id;
            user.save(done);
          });
        });
      });

      it('errors with current challenge', function (done) {
        pong.ensureNoChallenges(['ZhangJike'], function (err) {
          expect(err).to.not.be.null;
          expect(err.message).to.eq("There's already an active challenge between ZhangJike and DengYaping.");
          done();
        });
      });
    });
  });

  describe('setChallenge', function () {
    it('returns an error when a user cannot be found', function (done) {
      pong.setChallenge(['ZhangJike'], null, function(err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("User 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', done);
      });

      it('sets challenge', function(done) {
        var challenge = new Challenge({
          state: 'Proposed',
          type: 'Singles',
          date: Date.now(),
          challenger: [],
          challenged: []
        });
        challenge.save(function (err, challenge) {
          pong.setChallenge(['ZhangJike'], challenge._id, function () {
            pong.findPlayer('ZhangJike', function (err, user) {
              expect(user.currentChallenge.equals(challenge._id)).to.be.true;
              done();
            });
          });
        });
      });
    });
  });

  describe('removeChallenge', function () {
    describe('with a challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function () {
          pong.registerPlayer('DengYaping', function () {
            pong.createSingleChallenge('ZhangJike', 'DengYaping', function () {
              done();
            });
          });
        });
      });

      it('removes challenge', function (done) {
        pong.removeChallenge('DengYaping', function () {
          pong.findPlayer('DengYaping', function (err, user) {
            expect(err).to.be.null;
            expect(user.currentChallenge).to.be.undefined;
            done();
          });
        });
      });
    });
  });

  describe('acceptChallenge', function () {
    describe('with a challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function () {
          pong.registerPlayer('DengYaping', function () {
            pong.createSingleChallenge('ZhangJike', 'DengYaping', function () {
              done();
            });
          });
        });
      });

      it('accepts challenge', function (done) {
        pong.acceptChallenge('DengYaping', function (err, challenge) {
          expect(err.message).to.eq("DengYaping accepted ZhangJike's challenge.");
          expect(challenge.state).to.eq('Accepted');
          done();
        });
      });

      it("can't accept a challenge twice", function (done) {
        pong.acceptChallenge('DengYaping', function (err, challenge) {
          pong.acceptChallenge('DengYaping', function (err, challenge) {
            expect(err.message).to.eq("You have already accepted ZhangJike's challenge.");
            done();
          });
        });
      });
    });
  });

  describe('declineChallenge', function () {
    describe('with a challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function () {
          pong.registerPlayer('DengYaping', function () {
            pong.createSingleChallenge('ZhangJike', 'DengYaping', function () {
              done();
            });
          });
        });
      });

      it('declines challenge', function (done) {
        pong.declineChallenge('DengYaping', function (err, challenge) {
          expect(err.message).to.eq("DengYaping declined ZhangJike's challenge.");
          expect(challenge.state).to.eq('Declined');
          pong.findPlayer('DengYaping', function (err, user) {
            expect(user.currentChallenge).to.be.null;
            done();
          });
        });
      });

      it("can't decline a challenge twice", function (done) {
        pong.declineChallenge('DengYaping', function (err, challenge) {
          pong.declineChallenge('DengYaping', function (err, challenge) {
            expect(err.message).to.eq("No challenge to decline.");
            done();
          });
        });
      });
    });
  });

  describe('calculateTeamElo', function () {
    beforeEach('with two players', function (done) {
      pong.registerPlayer('ZhangJike', function (err, user1) {
        user1.elo = 4;
        user1.save(function () {
          pong.registerPlayer('DengYaping', function (err, user2) {
            user2.elo = 2;
            user2.save(function () {
              done();
            });
          });
        });
      });
    });

    it('returns average of elo', function (done) {
      pong.calculateTeamElo('ZhangJike', 'DengYaping', function(err, elo) {
        expect(elo).to.eq(3);
        done();
      });
    });
  });

  describe('eloSinglesChange', function () {
    beforeEach(function (done) {
      pong.registerPlayer('ZhangJike', function (err, user1) {
        pong.registerPlayer('DengYaping', function (err, user2) {
          done();
        });
      });
    });

    it('updates elo after a challenge', function (done) {
      pong.eloSinglesChange('ZhangJike', 'DengYaping', function(err, winner, loser) {
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
      pong.registerPlayer('ZhangJike', function () {
        pong.registerPlayer('DengYaping', function () {
          pong.registerPlayer('ChenQi', function () {
            pong.registerPlayer('ViktorBarna', function () {
              done();
            });
          });
        });
      });
    });

    it('updates elo after a challenge', function (done) {
      pong.eloDoublesChange('ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna', function(err, u1, u2, u3, u4) {
        expect(u1.elo).to.eq(48);
        expect(u1.tau).to.eq(0.5);
        expect(u2.elo).to.eq(48);
        expect(u2.tau).to.eq(0.5);
        expect(u3.elo).to.eq(-48);
        expect(u3.tau).to.eq(0.5);
        expect(u4.elo).to.eq(-48);
        expect(u4.tau).to.eq(0.5);
        done();
      });
    });
  });

  describe('win and lose', function () {
    describe('with a single challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function () {
          pong.registerPlayer('DengYaping', function () {
            pong.createSingleChallenge('ZhangJike', 'DengYaping', function () {
              done();
            });
          });
        });
      });

      it('challenge must be accepted', function (done) {
        pong.win('ZhangJike', function (err) {
          expect(err).not.to.be.null;
          expect(err.message).to.eq("Challenge needs to be accepted before recording match.");
          done();
        });
      });

      describe('challenge accepted', function () {
        beforeEach(function (done) {
          pong.acceptChallenge('DengYaping', function () {
            done();
          });
        });

        it('player one wins', function (done) {
          pong.win('ZhangJike', function (err, challenge) {
            expect(err).not.to.be.null;
            expect(err.message).to.eq("Match has been recorded, ZhangJike has defeated DengYaping.");
            pong.findPlayer('ZhangJike', function (err, user) {
              expect(err).to.be.null;
              expect(user.wins).to.eq(1);
              expect(user.tau).to.eq(0.5);
              expect(user.elo).to.eq(48);
              expect(user.losses).to.eq(0);
              pong.findPlayer('DengYaping', function (err, user) {
                expect(err).to.be.null;
                expect(user.wins).to.eq(0);
                expect(user.tau).to.eq(0.5);
                expect(user.elo).to.eq(-48);
                expect(user.losses).to.eq(1);
                done();
              });
            });
          });
        });

        it('player two wins', function (done) {
          pong.win('DengYaping', function (err, challenge) {
            expect(err).not.to.be.null;
            expect(err.message).to.eq("Match has been recorded, DengYaping has defeated ZhangJike.");
            pong.findPlayer('DengYaping', function (err, user) {
              expect(err).to.be.null;
              expect(user.wins).to.eq(1);
              expect(user.tau).to.eq(0.5);
              expect(user.elo).to.eq(48);
              expect(user.losses).to.eq(0);
              pong.findPlayer('ZhangJike', function (err, user) {
                expect(err).to.be.null;
                expect(user.wins).to.eq(0);
                expect(user.tau).to.eq(0.5);
                expect(user.elo).to.eq(-48);
                expect(user.losses).to.eq(1);
                done();
              });
            });
          });
        });

        it('player one loses', function (done) {
          pong.lose('ZhangJike', function (err, challenge) {
            expect(err).not.to.be.null;
            expect(err.message).to.eq("Match has been recorded, DengYaping has defeated ZhangJike.");
            pong.findPlayer('ZhangJike', function (err, user) {
              expect(err).to.be.null;
              expect(user.wins).to.eq(0);
              expect(user.tau).to.eq(0.5);
              expect(user.elo).to.eq(-48);
              expect(user.losses).to.eq(1);
              pong.findPlayer('DengYaping', function (err, user) {
                expect(err).to.be.null;
                expect(user.wins).to.eq(1);
                expect(user.tau).to.eq(0.5);
                expect(user.elo).to.eq(48);
                expect(user.losses).to.eq(0);
                done();
              });
            });
          });
        });

        it('player two loses', function (done) {
          pong.lose('DengYaping', function (err, challenge) {
            expect(err).not.to.be.null;
            expect(err.message).to.eq("Match has been recorded, ZhangJike has defeated DengYaping.");
            pong.findPlayer('DengYaping', function (err, user) {
              expect(err).to.be.null;
              expect(user.wins).to.eq(0);
              expect(user.tau).to.eq(0.5);
              expect(user.elo).to.eq(-48);
              expect(user.losses).to.eq(1);
              pong.findPlayer('ZhangJike', function (err, user) {
                expect(err).to.be.null;
                expect(user.wins).to.eq(1);
                expect(user.tau).to.eq(0.5);
                expect(user.elo).to.eq(48);
                expect(user.losses).to.eq(0);
                done();
              });
            });
          });
        });
      });
    });

    describe('with an accepted doubles challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function () {
          pong.registerPlayer('DengYaping', function () {
            pong.registerPlayer('ChenQi', function () {
              pong.registerPlayer('ViktorBarna', function () {
                pong.createDoubleChallenge('ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna', function (err, challenge) {
                  pong.acceptChallenge('DengYaping', function (err) {
                    done();
                  });
                });
              });
            });
          });
        });
      });

      it('player one wins', function (done) {
        pong.win('ZhangJike', function (err, challenge) {
          expect(err).not.to.be.null;
          expect(err.message).to.eq("Match has been recorded, ZhangJike and DengYaping have defeated ChenQi and ViktorBarna.");
          pong.findPlayer('ZhangJike', function (err, user) {
            expect(err).to.be.null;
            expect(user.wins).to.eq(1);
            expect(user.tau).to.eq(0.5);
            expect(user.elo).to.eq(48);
            expect(user.losses).to.eq(0);
            pong.findPlayer('DengYaping', function (err, user) {
              expect(err).to.be.null;
              expect(user.wins).to.eq(1);
              expect(user.tau).to.eq(0.5);
              expect(user.elo).to.eq(48);
              expect(user.losses).to.eq(0);
              pong.findPlayer('ChenQi', function (err, user) {
                expect(err).to.be.null;
                expect(user.wins).to.eq(0);
                expect(user.tau).to.eq(0.5);
                expect(user.elo).to.eq(-48);
                expect(user.losses).to.eq(1);
                pong.findPlayer('ViktorBarna', function (err, user) {
                  expect(err).to.be.null;
                  expect(user.wins).to.eq(0);
                  expect(user.tau).to.eq(0.5);
                  expect(user.elo).to.eq(-48);
                  expect(user.losses).to.eq(1);
                  done();
                });
              });
            });
          });
        });
      });

      it('player two wins', function (done) {
        pong.win('DengYaping', function (err, challenge) {
          expect(err).not.to.be.null;
          expect(err.message).to.eq("Match has been recorded, ZhangJike and DengYaping have defeated ChenQi and ViktorBarna.");
          pong.findPlayer('ZhangJike', function (err, user) {
            expect(err).to.be.null;
            expect(user.wins).to.eq(1);
            expect(user.tau).to.eq(0.5);
            expect(user.elo).to.eq(48);
            expect(user.losses).to.eq(0);
            pong.findPlayer('DengYaping', function (err, user) {
              expect(err).to.be.null;
              expect(user.wins).to.eq(1);
              expect(user.tau).to.eq(0.5);
              expect(user.elo).to.eq(48);
              expect(user.losses).to.eq(0);
              pong.findPlayer('ChenQi', function (err, user) {
                expect(err).to.be.null;
                expect(user.wins).to.eq(0);
                expect(user.tau).to.eq(0.5);
                expect(user.elo).to.eq(-48);
                expect(user.losses).to.eq(1);
                pong.findPlayer('ViktorBarna', function (err, user) {
                  expect(err).to.be.null;
                  expect(user.wins).to.eq(0);
                  expect(user.tau).to.eq(0.5);
                  expect(user.elo).to.eq(-48);
                  expect(user.losses).to.eq(1);
                  done();
                });
              });
            });
          });
        });
      });

      it('player three wins', function (done) {
        pong.win('ChenQi', function (err, challenge) {
          expect(err).not.to.be.null;
          expect(err.message).to.eq("Match has been recorded, ChenQi and ViktorBarna have defeated ZhangJike and DengYaping.");
          pong.findPlayer('ChenQi', function (err, user) {
            expect(err).to.be.null;
            expect(user.wins).to.eq(1);
            expect(user.tau).to.eq(0.5);
            expect(user.elo).to.eq(48);
            expect(user.losses).to.eq(0);
            pong.findPlayer('ViktorBarna', function (err, user) {
              expect(err).to.be.null;
              expect(user.wins).to.eq(1);
              expect(user.tau).to.eq(0.5);
              expect(user.elo).to.eq(48);
              expect(user.losses).to.eq(0);
              pong.findPlayer('DengYaping', function (err, user) {
                expect(err).to.be.null;
                expect(user.wins).to.eq(0);
                expect(user.tau).to.eq(0.5);
                expect(user.elo).to.eq(-48);
                expect(user.losses).to.eq(1);
                pong.findPlayer('ZhangJike', function (err, user) {
                  expect(err).to.be.null;
                  expect(user.wins).to.eq(0);
                  expect(user.tau).to.eq(0.5);
                  expect(user.elo).to.eq(-48);
                  expect(user.losses).to.eq(1);
                  done();
                });
              });
            });
          });
        });
      });

      it('player four wins', function (done) {
        pong.win('ViktorBarna', function (err, challenge) {
          expect(err).not.to.be.null;
          expect(err.message).to.eq("Match has been recorded, ChenQi and ViktorBarna have defeated ZhangJike and DengYaping.");
          pong.findPlayer('ChenQi', function (err, user) {
            expect(err).to.be.null;
            expect(user.wins).to.eq(1);
            expect(user.tau).to.eq(0.5);
            expect(user.elo).to.eq(48);
            expect(user.losses).to.eq(0);
            pong.findPlayer('ViktorBarna', function (err, user) {
              expect(err).to.be.null;
              expect(user.wins).to.eq(1);
              expect(user.tau).to.eq(0.5);
              expect(user.elo).to.eq(48);
              expect(user.losses).to.eq(0);
              pong.findPlayer('DengYaping', function (err, user) {
                expect(err).to.be.null;
                expect(user.wins).to.eq(0);
                expect(user.tau).to.eq(0.5);
                expect(user.elo).to.eq(-48);
                expect(user.losses).to.eq(1);
                pong.findPlayer('ZhangJike', function (err, user) {
                  expect(err).to.be.null;
                  expect(user.wins).to.eq(0);
                  expect(user.tau).to.eq(0.5);
                  expect(user.elo).to.eq(-48);
                  expect(user.losses).to.eq(1);
                  done();
                });
              });
            });
          });
        });
      });

      it('player one loses', function (done) {
        pong.lose('ZhangJike', function (err, challenge) {
          expect(err).not.to.be.null;
          expect(err.message).to.eq("Match has been recorded, ChenQi and ViktorBarna have defeated ZhangJike and DengYaping.");
          pong.findPlayer('ChenQi', function (err, user) {
            expect(err).to.be.null;
            expect(user.wins).to.eq(1);
            expect(user.tau).to.eq(0.5);
            expect(user.elo).to.eq(48);
            expect(user.losses).to.eq(0);
            pong.findPlayer('ViktorBarna', function (err, user) {
              expect(err).to.be.null;
              expect(user.wins).to.eq(1);
              expect(user.tau).to.eq(0.5);
              expect(user.elo).to.eq(48);
              expect(user.losses).to.eq(0);
              pong.findPlayer('DengYaping', function (err, user) {
                expect(err).to.be.null;
                expect(user.wins).to.eq(0);
                expect(user.tau).to.eq(0.5);
                expect(user.elo).to.eq(-48);
                expect(user.losses).to.eq(1);
                pong.findPlayer('ZhangJike', function (err, user) {
                  expect(err).to.be.null;
                  expect(user.wins).to.eq(0);
                  expect(user.tau).to.eq(0.5);
                  expect(user.elo).to.eq(-48);
                  expect(user.losses).to.eq(1);
                  done();
                });
              });
            });
          });
        });
      });

      it('player two loses', function (done) {
        pong.lose('DengYaping', function (err, challenge) {
          expect(err).not.to.be.null;
          expect(err.message).to.eq("Match has been recorded, ChenQi and ViktorBarna have defeated ZhangJike and DengYaping.");
          pong.findPlayer('ChenQi', function (err, user) {
            expect(err).to.be.null;
            expect(user.wins).to.eq(1);
            expect(user.tau).to.eq(0.5);
            expect(user.elo).to.eq(48);
            expect(user.losses).to.eq(0);
            pong.findPlayer('ViktorBarna', function (err, user) {
              expect(err).to.be.null;
              expect(user.wins).to.eq(1);
              expect(user.tau).to.eq(0.5);
              expect(user.elo).to.eq(48);
              expect(user.losses).to.eq(0);
              pong.findPlayer('DengYaping', function (err, user) {
                expect(err).to.be.null;
                expect(user.wins).to.eq(0);
                expect(user.tau).to.eq(0.5);
                expect(user.elo).to.eq(-48);
                expect(user.losses).to.eq(1);
                pong.findPlayer('ZhangJike', function (err, user) {
                  expect(err).to.be.null;
                  expect(user.wins).to.eq(0);
                  expect(user.tau).to.eq(0.5);
                  expect(user.elo).to.eq(-48);
                  expect(user.losses).to.eq(1);
                  done();
                });
              });
            });
          });
        });
      });

      it('player three loses', function (done) {
        pong.lose('ChenQi', function (err, challenge) {
          expect(err).not.to.be.null;
          expect(err.message).to.eq("Match has been recorded, ZhangJike and DengYaping have defeated ChenQi and ViktorBarna.");
          pong.findPlayer('ZhangJike', function (err, user) {
            expect(err).to.be.null;
            expect(user.wins).to.eq(1);
            expect(user.tau).to.eq(0.5);
            expect(user.elo).to.eq(48);
            expect(user.losses).to.eq(0);
            pong.findPlayer('DengYaping', function (err, user) {
              expect(err).to.be.null;
              expect(user.wins).to.eq(1);
              expect(user.tau).to.eq(0.5);
              expect(user.elo).to.eq(48);
              expect(user.losses).to.eq(0);
              pong.findPlayer('ChenQi', function (err, user) {
                expect(err).to.be.null;
                expect(user.wins).to.eq(0);
                expect(user.tau).to.eq(0.5);
                expect(user.elo).to.eq(-48);
                expect(user.losses).to.eq(1);
                pong.findPlayer('ViktorBarna', function (err, user) {
                  expect(err).to.be.null;
                  expect(user.wins).to.eq(0);
                  expect(user.tau).to.eq(0.5);
                  expect(user.elo).to.eq(-48);
                  expect(user.losses).to.eq(1);
                  done();
                });
              });
            });
          });
        });
      });

      it('player four loses', function (done) {
        pong.lose('ViktorBarna', function (err, challenge) {
          expect(err).not.to.be.null;
          expect(err.message).to.eq("Match has been recorded, ZhangJike and DengYaping have defeated ChenQi and ViktorBarna.");
          pong.findPlayer('ZhangJike', function (err, user) {
            expect(err).to.be.null;
            expect(user.wins).to.eq(1);
            expect(user.tau).to.eq(0.5);
            expect(user.elo).to.eq(48);
            expect(user.losses).to.eq(0);
            pong.findPlayer('DengYaping', function (err, user) {
              expect(err).to.be.null;
              expect(user.wins).to.eq(1);
              expect(user.tau).to.eq(0.5);
              expect(user.elo).to.eq(48);
              expect(user.losses).to.eq(0);
              pong.findPlayer('ChenQi', function (err, user) {
                expect(err).to.be.null;
                expect(user.wins).to.eq(0);
                expect(user.tau).to.eq(0.5);
                expect(user.elo).to.eq(-48);
                expect(user.losses).to.eq(1);
                pong.findPlayer('ViktorBarna', function (err, user) {
                  expect(err).to.be.null;
                  expect(user.wins).to.eq(0);
                  expect(user.tau).to.eq(0.5);
                  expect(user.elo).to.eq(-48);
                  expect(user.losses).to.eq(1);
                  done();
                });
              });
            });
          });
        });
      });
    });
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

  describe('resetAll', function () {
    describe('with two players', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike', function (err, user) {
          user.wins = 42;
          user.losses = 24;
          user.tau = 3;
          user.elo = 158;
          user.save(function () {
            pong.registerPlayer('ViktorBarna', function (err, user) {
              user.wins = 4;
              user.losses = 4;
              user.tau = 3;
              user.elo = 18;
              done();
            });
          });
        });
      });

      it('resets all users', function (done) {
        pong.resetAll(function () {
          pong.findPlayer('ZhangJike', function (err, user) {
            expect(err).to.be.null;
            expect(user.wins).to.eq(0);
            expect(user.tau).to.eq(1);
            expect(user.elo).to.eq(0);
            expect(user.losses).to.eq(0);
            pong.findPlayer('ViktorBarna', function (err, user) {
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
  });

  describe('getDuelGif', function () {
    it('returns a gif', function (done) {
      pong.getDuelGif(function (gif) {
        expect(gif).to.startsWith('http');
        done();
      });
    });
  });

  describe("playerToS", function(){
    var currentUser = null;
    beforeEach(function(done){
      pong.registerPlayer('ZhangJike', function (err, user) {
        currentUser = user;
        done();
      });
    });

    it("prints a newly registered user", function () {
      expect(pong.playerToS(currentUser)).to.eq("ZhangJike: 0 wins 0 losses (elo: 0)");
    });
  });

  describe("playersToS", function() {
    var sortedPlayers = null;
    beforeEach(function() {
      var worst = new Player({ user_name: 'worst', wins: 0, losses: 2, elo: 0, tau: 0 });
      var middle = new Player({ user_name: 'middle', wins: 1, losses: 1, elo: 10, tau: 0 });
      var best = new Player({ user_name: 'best', wins: 2, losses: 0, elo: 20, tau: 0 });
      sortedPlayers = [best, middle, worst];
    });

    it("prints a leaderboard correctly", function () {
      expect(pong.playersToS(sortedPlayers)).to.eq(
        "1. best: 2 wins 0 losses (elo: 20)\n" +
        "2. middle: 1 win 1 loss (elo: 10)\n" +
        "3. worst: 0 wins 2 losses (elo: 0)\n"
      );
    });

    it("prints a leaderboard with ties correctly", function () {
      sortedPlayers = sortedPlayers.concat(sortedPlayers[2]);
      sortedPlayers = [sortedPlayers[0]].concat(sortedPlayers);
      expect(pong.playersToS(sortedPlayers)).to.eq(
        "1. best: 2 wins 0 losses (elo: 20)\n" +
        "1. best: 2 wins 0 losses (elo: 20)\n" +
        "3. middle: 1 win 1 loss (elo: 10)\n" +
        "4. worst: 0 wins 2 losses (elo: 0)\n" +
        "4. worst: 0 wins 2 losses (elo: 0)\n"
      );
    });
  });

  describe('ensureUniquePlayers', function () {
    it('fails with a duplicate', function (done) {
      pong.ensureUniquePlayers([ 'ZhangJike', 'ZhangJike', 'ZhangJike', 'ChenQi' ], function (err, players) {
        expect(err).to.not.be.null;
        expect(err.message).to.eq('Does ZhangJike have 6 hands?');
        done();
      });
    });

    it('succeeds with a duplicate', function (done) {
      pong.ensureUniquePlayers([ 'ZhangJike', 'ViktorBarna' ], function (err, players) {
        expect(err).to.be.null;
        done();
      });
    });
  });
});
