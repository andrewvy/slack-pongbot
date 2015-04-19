var Player = require('../models/Player');
var Challenge = require('../models/Challenge');
pluralize = require('pluralize');

var pong = {

  init: function () {
    pong.channel = '#pongbot';
    pong.deltaTau = 0.94;
    pong.currentChallenge = false;
  },

  registerPlayer: function (user_name, cb) {
    new Player({
      user_name: user_name,
      wins: 0,
      losses: 0,
      elo: 0,
      tau: 0
    }).save(cb);
  },

  findPlayer: function (user_name, cb) {
    Player.where({ user_name: user_name }).findOne(function (err, user) {
      if (user) {
        cb(null, user);
      } else {
        cb(err || new Error("User '" + user_name + "' does not exist."), user);
      }
    });
  },

  getEveryone: function (cb) {
    Player.find({}, function (err, users) {
      if (users) {
        console.log(users);
      }
      cb(err, users);
    });
  },

  updateWins: function (user_name, cb) {
    pong.findPlayer(user_name, function (err, user) {
      if (user) {
        user.wins++;
        user.save(cb);
      } else {
        cb(err || new Error("User '" + user_name + "' does not exist."), null);
      }
    });
  },

  updateLosses: function (user_name, cb) {
    pong.findPlayer(user_name, function (err, user) {
      if (user) {
        user.losses++;
        user.save(cb);
      } else {
        cb(err || new Error("User '" + user_name + "' does not exist."), null);
      }
    });
  },

  createSingleChallenge: function (challenger_name, challenged_name, cb) {
    pong.findChallenge(challenger_name, function (err, challenge) {
      if (challenge || err) {
        cb(err || new Error("There's already an active challenge for " + challenger_name), null);
      } else {
        pong.findChallenge(challenged_name, function (err, challenge) {
          if (challenge || err) {
            cb(err || new Error("There's already an active challenge for " + challenged_name), null);
          } else {
            new Challenge({
              state: 'Proposed',
              type: 'Singles',
              date: Date.now(),
              challenger: [challenger_name],
              challenged: [challenged_name]
            }).save(function (err, challenge) {
              if (err) {
                cb(err, null);
              } else {
                pong.setChallenge(challenger_name, challenge._id, function (err) {
                  if (err) return cb(err, null);
                  pong.setChallenge(challenged_name, challenge._id, function (err) {
                    if (err) return cb(err, null);
                    cb(new Error(challenger_name + ' has challenged ' + challenged_name + ' to a ping pong match!'), challenge);
                  });
                });
              }
            });
          }
        });
      }
    });
  },

  createDoubleChallenge: function (c1, c2, c3, c4, cb) {
    pong.findChallenge(c1, function (err, challenge) {
      if (challenge || err) {
        cb(err || new Error("There's already an active challenge for " + c1), null);
      } else {
        pong.findChallenge(c2, function (err, challenge) {
          if (challenge || err) {
            cb(err || new Error("There's already an active challenge for " + c2), null);
          } else {
            pong.findChallenge(c3, function (err, challenge) {
              if (challenge || err) {
                cb(err || new Error("There's already an active challenge for " + c3), null);
              } else {
                pong.findChallenge(c4, function (err, challenge) {
                  if (challenge || err) {
                    cb(err || new Error("There's already an active challenge for " + c4), null);
                  } else {
                    new Challenge({
                      state: 'Proposed',
                      type: 'Doubles',
                      date: Date.now(),
                      challenger: [
                        c1,
                        c2
                      ],
                      challenged: [
                        c3,
                        c4
                      ]
                    }).save(function (err, challenge) {
                      if (err) {
                        cb(err, null);
                      } else {
                        pong.setChallenge(c1, challenge._id, function (err) {
                          if (err) return cb(err, null);
                          pong.setChallenge(c2, challenge._id, function (err) {
                            if (err) return cb(err, null);
                            pong.setChallenge(c3, challenge._id, function (err) {
                            if (err) return cb(err, null);
                              pong.setChallenge(c4, challenge._id, function (err) {
                                if (err) return cb(err, null);
                                cb(new Error(c1 + ' and ' + c2 + ' have challenged ' + c3 + ' and ' + c4 + ' to a ping pong match!'), challenge);
                              });
                            });
                          });
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  },

  findChallenge: function (user_name, cb) {
    pong.findPlayer(user_name, function (err, user) {
      if (user) {
        Challenge.findOne({ _id: user.currentChallenge }, cb);
      } else {
        cb(err || new Error("User '" + user_name + "' does not exist."), null);
      }
    });
  },

  setChallenge: function (user_name, id, cb) {
    pong.findPlayer(user_name, function (err, user) {
      if (user) {
        user.currentChallenge = id;
        user.save(cb);
      } else {
        cb(err || new Error("User '" + user_name + "' does not exist."), null);
      }
    });
  },

  removeChallenge: function (user_name, cb) {
    pong.findPlayer(user_name, function (err, user) {
      if (user) {
        if (user.currentChallenge) {
          user.currentChallenge = undefined;
          user.save(cb);
        } else {
          cb(new Error("User '" + user_name + "' has not been challenged."), null);
        }
      } else {
        cb(err || new Error("User '" + user_name + "' does not exist."), null);
      }
    });
  },

  acceptChallenge: function (user_name, cb) {
    pong.findChallenge(user_name, function (err, challenge) {
      if (err || !challenge) {
        cb(err || new Error("No challenge to accept."), null);
      } else if (challenge.state == 'Proposed') {
        challenge.state = 'Accepted';
        challenge.save(function (err) {
          if (err) return cb(err, challenge);
          // TODO: reimplement who serves first
          cb(new Error(user_name + ' accepted ' + challenge.challenger[0] + "'s challenge."), challenge);
        });
      } else if (challenge.state == 'Accepted') {
        cb(new Error('You have already accepted ' + challenge.challenger[0] + "'s challenge."), challenge);
      } else {
        cb(new Error("No challenge to accept."), null);
      }
    });
  },

  declineChallenge: function (user_name, cb) {
    pong.findChallenge(user_name, function (err, challenge) {
      if (err || !challenge) {
        cb(err || new Error("No challenge to decline."), null);
      } else if (challenge.state == 'Proposed' || challenge.state == 'Accepted') {
        challenge.state = 'Declined';
        challenge.save(function (err) {
          if (err) return cb(err, challenge);
          Player.update({ currentChallenge: challenge._id }, { currentChallenge: null }, { multi: true }, function (err) {
            pong.currentChallenge = false;
            if (err) return cb(err, challenge);
            cb(new Error(user_name + ' declined ' + challenge.challenger[0] + "'s challenge."), challenge);
          });
        });
      } else {
        cb(new Error("No challenge to decline."), null);
      }
    });
  },

  calculateTeamElo: function (p1, p2, cb) {
    pong.findPlayer(p1, function (err, user1) {
      if (err) return cb(err, user1);
      pong.findPlayer(p2, function (err, user2) {
        if (err) return cb(err, user2);
        cb(null, (user1.elo + user2.elo) / 2);
      });
    });
  },

  eloSinglesChange: function (winner_name, loser_name, cb) {
    pong.findPlayer(winner_name, function (err, winner) {
      if (err) return cb(err, winner);
      pong.findPlayer(loser_name, function (err, loser) {
        if (err) return cb(err, loser);
        var e = 100 - Math.round(1 / (1 + Math.pow(10, (loser.elo - winner.elo) / 400)) * 100);
        winner.tau = winner.tau || 0;
        winner.tau = winner.tau + 0.5;
        winner.elo = winner.elo + Math.round(e * Math.pow(pong.deltaTau, winner.tau));
        loser.tau = loser.tau || 0;
        loser.tau = loser.tau + 0.5;
        loser.elo = loser.elo - Math.round(e * Math.pow(pong.deltaTau, loser.tau));
        winner.save(function (err) {
          if (err) return cb(err, winner, loser);
          loser.save(function (err) {
            if (err) return cb(err, winner, loser);
            cb(null, winner, loser);
          });
        });
      });
    });
  },

  eloDoublesChange: function (p1, p2, p3, p4, cb) {
    pong.calculateTeamElo(p1, p2, function (err, t1) {
      if (err) return cb(err, t1);
      pong.calculateTeamElo(p3, p4, function (err, t2) {
        if (err) return cb(err, t2);
        pong.findPlayer(p1, function (err, u1) {
          if (err) return cb(err, u1);
          pong.findPlayer(p2, function (err, u2) {
            if (err) return cb(err, u2);
            pong.findPlayer(p3, function (err, u3) {
              if (err) return cb(err, u3);
              pong.findPlayer(p4, function (err, u4) {
                if (err) return cb(err, u4);
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
                u1.save(function (err) {
                  if (err) return cb(err, u1, u2, u3, u4);
                  u2.save(function (err) {
                    if (err) return cb(err, u1, u2, u3, u4);
                    u3.save(function (err) {
                      if (err) return cb(err, u1, u2, u3, u4);
                      u4.save(function (err) {
                        if (err) return cb(err, u1, u2, u3, u4);
                        cb(null, u1, u2, u3, u4);
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  },

  win: function (user_name, cb) {
    pong.findChallenge(user_name, function (err, challenge) {
      if (err || !challenge) return cb(err || new Error('Challenge does not exist.'), challenge);
      if (challenge.state == 'Proposed') {
        cb(new Error('Challenge needs to be accepted before recording match.'), challenge);
      } else {
        challenge.state = 'Finished';
        challenge.save(function (err) {
          if (err) return cb(err, challenge);
          Player.update({ currentChallenge: challenge._id }, { currentChallenge: null }, { multi: true }, function (err) {
            if (err) return cb(err, challenge);
            if (challenge.type === 'Doubles') {
              var winners, losers;
              if (user_name === challenge.challenger[0] || user_name === challenge.challenger[1]) {
                winners = challenge.challenger;
                losers = challenge.challenged;
              } else {
                losers = challenge.challenger;
                winners = challenge.challenged;
              }
              pong.eloDoublesChange(winners[0], winners[1], losers[0], losers[1], function(err) {
                if (err) return cb(err, challenge);
                pong.updateWins(winners[0], function (err) {
                  if (err) return cb(err, challenge);
                  pong.updateWins(winners[1], function (err) {
                    if (err) return cb(err, challenge);
                    pong.updateLosses(losers[0], function (err) {
                      if (err) return cb(err, challenge);
                      pong.updateLosses(losers[1], function (err) {
                        cb(new Error('Match has been recorded.'));
                      });
                    });
                  });
                });
              });
            } else if (challenge.type == 'Singles') {
              var winner, loser;
              if (user_name === challenge.challenger[0]) {
                winner = challenge.challenger[0];
                loser = challenge.challenged[0];
              } else {
                loser = challenge.challenger[0];
                winner = challenge.challenged[0];
              }
              pong.eloSinglesChange(winner, loser, function(err) {
                if (err) return cb(err, challenge);
                pong.updateWins(winner, function (err) {
                  if (err) return cb(err, challenge);
                  pong.updateLosses(loser, function (err) {
                    if (err) return cb(err, challenge);
                    cb(new Error('Match has been recorded.'));
                  });
                });
              });
            }
          });
        });
      }
    });
  },

  lose: function (user_name, cb) {
    pong.findChallenge(user_name, function (err, challenge) {
      if (err || !challenge) return cb(err || new Error('Challenge does not exist.'), challenge);
      if (challenge.type === 'Doubles') {
        if (user_name === challenge.challenged[0] || user_name === challenge.challenged[1]) {
          pong.win(challenge.challenger[0], cb);
        } else {
          pong.win(challenge.challenged[0], cb);
        }
      } else if (challenge.type == 'Singles') {
        if (user_name === challenge.challenged[0]) {
          pong.win(challenge.challenger[0], cb);
        } else {
          pong.win(challenge.challenged[0], cb);
        }
      }
    });
  },

  reset: function (user_name, cb) {
    pong.findPlayer(user_name, function (err, user) {
      if (user) {
        user.wins = 0;
        user.losses = 0;
        user.elo = 0;
        user.tau = 1;
        user.save(cb);
      } else {
        cb(err || new Error("User '" + user_name + "' does not exist."), user);
      }
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
      'http://i.imgur.com/FH4GErU.gif'
    ];
    var rand = gifs[Math.floor(Math.random() * gifs.length)];
    cb(rand);
  },

  playerToS: function(user) {
    return user.user_name + ": " + pluralize('win', user.wins, true) + " " + pluralize('loss', user.losses, true) + " (elo: " + user.elo + ")";
  },

  playersToS: function(players) {
    var rank = 1;
    var out = "";
    players.forEach(function(user, i){
      if (players[i - 1]) {
        if (players[i - 1].elo != user.elo){
          rank = i + 1;
        }
      }
      out += rank + ". " + pong.playerToS(user) + "\n";
    });
    return out;
  },
};

module.exports = pong;
