var Player = require('../models/Player');
var Challenge = require('../models/Challenge');
var pluralize = require('pluralize');
var Q = require('q');

var pong = {

  init: function () {
    pong.channel = '#pongbot';
    pong.deltaTau = 0.94;
  },

  registerPlayer: function (player_name, options) {
    var data = {
      user_name: player_name,
      wins: 0,
      losses: 0,
      elo: 0,
      tau: 0
    };

    if (options) {
      for (var attrname in options) {
        data[attrname] = options[attrname];
      }
    }

    return new Player(data).save();
  },

  registerPlayers: function (player_names) {
    return Q.all(player_names.map(pong.registerPlayer));
  },

  findPlayer: function (player_name) {
    if (player_name[0] == '@') {
      player_name = player_name.substring(1, player_name.length);
    }
    return Player.where({ user_name: player_name })
      .findOne()
      .then(function (player) {
        var deferred = Q.defer();
        if (player) {
          deferred.resolve(player);
        } else {
          deferred.reject(new Error("Player '" + player_name + "' does not exist."));
        }
        return deferred.promise;
      });
  },

  findPlayers: function(player_names) {
    return Q.all(player_names.map(pong.findPlayer));
  },

  updateWins: function (player_names) {
    return pong.findPlayers(player_names).then(function(players) {
      return Q.all(players.map(function (player) {
        player.wins++;
        return player.save();
      }));
    });
  },

  updateLosses: function (player_names) {
    return pong.findPlayers(player_names).then(function(players) {
      return Q.all(players.map(function (player) {
        player.losses++;
        return player.save();
      }));
    });
  },

  setChallenge: function (player_names, challenge_id) {
    return pong.findPlayers(player_names).then(function(players) {
      return Q.all(players.map(function (player) {
        var deferred = Q.defer();
        Challenge.findOne({ _id: player.currentChallenge }).then(function (challenge) {
          if (challenge) {
            deferred.reject(new Error("There's already an active challenge between " + challenge.challenger.join(' and ') + ' and ' + challenge.challenged.join(' and ') + '.'));
          } else {
            player.currentChallenge = challenge_id;
            Q.when(player.save(), deferred.resolve);
          }
        }, function(err) {
          deferred.reject(err);
        });
        return deferred.promise;
      }));
    });
  },

  ensureUniquePlayers: function(players, cb) {
    var playerCounts = players.reduce(function (acc, curr) {
      if (typeof acc[curr] == 'undefined') {
        acc[curr] = 1;
      } else {
        acc[curr] += 1;
      }
      return acc;
    }, {});

    return Q.all(Object.keys(playerCounts).map(function (key) {
      var deferred = Q.defer();
      var count = playerCounts[key];
      if (count > 1) {
        deferred.reject(new Error('Does ' + key + ' have ' + 2 * count + ' hands?'));
      } else {
        deferred.resolve(key);
      }
      return deferred.promise;
    }));
  },

  createSingleChallenge: function (c1, c2) {
    return pong.ensureUniquePlayers([c1, c2]).then(function (players) {
      return new Challenge({
        state: 'Proposed',
        type: 'Singles',
        date: Date.now(),
        challenger: [c1],
        challenged: [c2]
      }).save().then(function (challenge) {
        return pong.setChallenge([c1, c2], challenge._id).then(function () {
          var deferred = Q.defer();
          deferred.resolve({ message: c1 + ' has challenged ' + c2 + ' to a ping pong match!', challenge: challenge });
          return deferred.promise;
        });
      });
    });
  },

  createDoubleChallenge: function (c1, c2, c3, c4, cb) {
    return pong.ensureUniquePlayers([c1, c2, c3, c4]).then(function (players) {
      return new Challenge({
        state: 'Proposed',
        type: 'Doubles',
        date: Date.now(),
        challenger: [c1, c2],
        challenged: [c3, c4]
      }).save().then(function (challenge) {
        return pong.setChallenge([c1, c2, c3, c4], challenge._id).then(function () {
          var deferred = Q.defer();
          deferred.resolve({ message: c1 + ' and ' + c2 + ' have challenged ' + c3 + ' and ' + c4 + ' to a ping pong match!', challenge: challenge });
          return deferred.promise;
        });
      });
    });
  },

  acceptChallenge: function (player_name) {
    return pong.findPlayer(player_name).then(function(player) {
      return Challenge.findOne({ _id: player.currentChallenge }).then(function (challenge) {
        var deferred = Q.defer();
        if (challenge && challenge.state == 'Proposed') {
          challenge.state = 'Accepted';
          Q.when(challenge.save(), function (challenge) {
            deferred.resolve({ message: player_name + ' accepted ' + challenge.challenger.join(' and ') + "'s challenge.", challenge: challenge });
          });
        } else if (challenge && challenge.state == 'Accepted') {
          deferred.reject(new Error('You have already accepted ' + challenge.challenger.join(' and ') + "'s challenge."));
        } else {
          deferred.reject(new Error("No challenge to accept."));
        }
        return deferred.promise;
      });
    });
  },

  declineChallenge: function (player_name) {
    return pong.findPlayer(player_name).then(function(player) {
      return Challenge.findOne({ _id: player.currentChallenge }).then(function (challenge) {
        var deferred = Q.defer();
        if (challenge && challenge.state == 'Proposed') {
          challenge.state = 'Declined';
          Q.when(challenge.save(), function (challenge) {
            Player.update({ currentChallenge: challenge._id }, { currentChallenge: null }, { multi: true }).then(function () {
              deferred.resolve({ message: player_name + ' declined ' + challenge.challenger.join(' and ') + "'s challenge.", challenge: challenge });
            });
          });
        } else {
          deferred.reject(new Error("No challenge to decline."));
        }
        return deferred.promise;
      });
    });
  },

  calculateTeamElo: function (p1, p2, cb) {
    return pong.findPlayers([p1, p2]).then(function(players) {
      var deferred = Q.defer();
      deferred.resolve((players[0].elo + players[1].elo) / 2);
      return deferred.promise;
    });
  },

  eloSinglesChange: function (winner_name, loser_name, cb) {
    return pong.findPlayers([winner_name, loser_name]).then(function(players) {
      var winner = players[0];
      var loser = players[1];
      var e = 100 - Math.round(1 / (1 + Math.pow(10, (loser.elo - winner.elo) / 400)) * 100);
      winner.tau = winner.tau || 0;
      winner.tau = winner.tau + 0.5;
      winner.elo = winner.elo + Math.round(e * Math.pow(pong.deltaTau, winner.tau));
      loser.tau = loser.tau || 0;
      loser.tau = loser.tau + 0.5;
      loser.elo = loser.elo - Math.round(e * Math.pow(pong.deltaTau, loser.tau));
      return Q.all([winner.save(), loser.save()]);
    });
  },

  eloDoublesChange: function (p1, p2, p3, p4, cb) {
    return pong.calculateTeamElo(p1, p2).then(function (t1) {
      return pong.calculateTeamElo(p3, p4).then(function (t2) {
        return pong.findPlayers([p1, p2, p3, p4]).then(function(players) {

          var u1 = players[0];
          var u2 = players[1];
          var u3 = players[2];
          var u4 = players[3];

          var e = 100 - Math.round(1 / (1 + Math.pow(10, (t2 - u1.elo) / 400)) * 100);
          var e2 = 100 - Math.round(1 / (1 + Math.pow(10, (t2 - u2.elo) / 400)) * 100);
          var e3 = 100 - Math.round(1 / (1 + Math.pow(10, (u3.elo - t1) / 400)) * 100);
          var e4 = 100 - Math.round(1 / (1 + Math.pow(10, (u4.elo - t1) / 400)) * 100);

          u1.tau = u1.tau || 0;
          u1.tau = u1.tau + 0.5;
          u1.elo = u1.elo + Math.round(e * Math.pow(pong.deltaTau, u1.tau));
          u2.tau = u2.tau || 0;
          u2.tau = u2.tau + 0.5;
          u2.elo = u2.elo + Math.round(e2 * Math.pow(pong.deltaTau, u2.tau));
          u3.tau = u3.tau || 0;
          u3.tau = u3.tau + 0.5;
          u3.elo = u3.elo - Math.round(e3 * Math.pow(pong.deltaTau, u3.tau));
          u4.tau = u4.tau || 0;
          u4.tau = u4.tau + 0.5;
          u4.elo = u4.elo - Math.round(e4 * Math.pow(pong.deltaTau, u4.tau));

          return Q.all([u1.save(), u2.save(), u3.save(), u4.save()]);
        });
      });
    });
  },

  win: function (player_name) {
    return pong.findPlayer(player_name).then(function(player) {
      return Challenge.findOne({ _id: player.currentChallenge }).then(function (challenge) {
        var deferred = Q.defer();
        if (challenge && challenge.state == 'Proposed') {
          deferred.reject(new Error("Challenge needs to be accepted before recording match."));
        } else if (challenge && challenge.state == 'Accepted') {
          challenge.state = 'Finished';
          Q.when(challenge.save(), function (challenge) {
            Player.update({ currentChallenge: challenge._id }, { currentChallenge: null }, { multi: true }).then(function () {
              var winners, losers;
              if (player_name === challenge.challenger[0] || (challenge.challenger[1] && player_name === challenge.challenger[1])) {
                winners = challenge.challenger;
                losers = challenge.challenged;
              } else {
                losers = challenge.challenger;
                winners = challenge.challenged;
              }
              return (challenge.type == 'Singles' ? pong.eloSinglesChange(winners[0], losers[0]) : pong.eloDoublesChange(winners[0], winners[1], losers[0], losers[1])).then(function () {
                return pong.updateWins(winners).then(function () {
                  return pong.updateLosses(losers).then(function () {
                    deferred.resolve({ message: 'Match has been recorded, ' + winners.join(' and ') + ' defeated ' + losers.join(' and ') + '.', challenge: challenge });
                  });
                });
              });
            });
          });
        } else {
          deferred.reject(new Error("No challenge to record."));
        }
        return deferred.promise;
      });
    });
  },

  lose: function (player_name, cb) {
    return pong.findPlayer(player_name).then(function(player) {
      return Challenge.findOne({ _id: player.currentChallenge }).then(function (challenge) {
        var deferred = Q.defer();
        if (challenge && ((player_name === challenge.challenged[0]) || (challenge.challenged[1] && player_name === challenge.challenged[1]))) {
          return pong.win(challenge.challenger[0]);
        } else if (challenge) {
          return pong.win(challenge.challenged[0]);
        } else {
          deferred.reject(new Error("No challenge to record."));
        }
        return deferred.promise;
      });
    });
  },

  resetAll: function() {
    return Player.update(
      {},
      { currentChallenge: null, wins: 0, losses: 0, elo: 0, tau: 1 },
      { multi: true }
    );
  },

  reset: function (player_name) {
    return pong.findPlayer(player_name).then(function (player) {
      player.wins = 0;
      player.losses = 0;
      player.elo = 0;
      player.tau = 1;
      return player.save();
    });
  },

  getDuelGif: function (cb) {
    var gifs = [
      'http://i235.photobucket.com/albums/ee210/f4nt0mh43d/BadDuel.gif',
      'http://31.media.tumblr.com/99b8b1af381990801020079ae223a526/tumblr_mrbe6wQqR91sdds6qo1_500.gif',
      'http://stream1.gifsoup.com/view3/1147041/duel-dollars-ending-o.gif',
      'https://i.chzbgr.com/maxW500/5233508864/hC54C768C/',
      'http://global3.memecdn.com/it-amp-039-s-time-to-duel_o_1532701.jpg',
      'http://iambrony.dget.cc/mlp/gif/172595__UNOPT__safe_animated_trixie_spoiler-s03e05_magic-duel.gif',
      'https://i.chzbgr.com/maxW500/2148438784/h7857A12F/',
      'https://i.chzbgr.com/maxW500/3841869568/h2814E598/',
      'http://24.media.tumblr.com/4e71f3df088eefed3d08ce4ce34e8d62/tumblr_mhyjqdJZ1g1s3r24zo1_500.gif',
      'http://i.imgur.com/P5LVOmg.gif',
      'http://i.imgur.com/SqF0q3h.gif',
      'http://i.imgur.com/CvUl6jj.gif',
      'http://i.imgur.com/FH4GErU.gif',
      'http://i.imgur.com/Y9i4axg.gif',
      'http://i.imgur.com/ib7O7VW.gif',
      'http://i.imgur.com/rABWS5B.gif',
      'http://i.imgur.com/r6JqmcQ.gif',
      'http://i.imgur.com/rbZimEm.gif',
      'http://i.imgur.com/st4lx7J.gif',
      'http://i.imgur.com/xVHUe.gif',
      'http://i.imgur.com/NDCUDvZ.gif',
      'http://i.imgur.com/849OAOZ.gif',
      'http://i.imgur.com/uAKLmb8.gif',
      'http://i.imgur.com/VMZhdeW.gif',
      'http://i.imgur.com/IfFqf.gif',
      'http://i.imgur.com/ICuvQ92.gif',
      'http://i.imgur.com/UiDlw3K.gif',
      'http://i.imgur.com/9HwUmYY.gif'
    ];
    var deferred = Q.defer();
    deferred.resolve(gifs[Math.floor(Math.random() * gifs.length)]);
    return deferred.promise;
  },

  playerToS: function(player) {
    return player.user_name + ": " + pluralize('win', player.wins, true) + " " + pluralize('loss', player.losses, true) + " (elo: " + player.elo + ")";
  },

  playersToS: function(players) {
    var rank = 1;
    var out = "";
    players.forEach(function(player, i){
      if (players[i - 1]) {
        if (players[i - 1].elo != player.elo){
          rank = i + 1;
        }
      }
      out += rank + ". " + pong.playerToS(player) + "\n";
    });
    return out;
  }
};

module.exports = pong;
