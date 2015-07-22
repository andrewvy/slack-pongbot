var Player = require('../models/Player');
var Challenge = require('../models/Challenge');
var pong = require('./pong');
var Q = require('q');
var _ = require('underscore');
var path = require('path');


module.exports.leaderboard = function (req, res) {
  res.sendFile(path.join(__dirname + '/../index.html'));
};

module.exports.index = function (req, res) {
  var hook = req.body;

  if (hook) {

    if (process.env.LOG_LEVEL === 'debug') {
      console.log(hook);
    }

    var params = _.compact(hook.text.split(' '));
    var command = params[1].toLowerCase();

    switch (command) {
    case 'register':
      if (params.length != 2) {
        res.json({ text: "Invalid params, use _pongbot register_." });
      } else {
        var promises = [];
        promises.push(pong.findPlayer(hook.user_name));
        if (hook.user_id) {
          promises.push(pong.findPlayer('<@' + hook.user_id + '>'));
        }
        Q.any(promises).then(
          function (player) {
            res.json({ text: "You've already registered!" });
          },
          function (err) {
            pong.registerPlayer(hook.user_name, { user_id: hook.user_id }).then(function (player) {
              res.json({ text: 'Successfully registered! Welcome to the system, ' + hook.user_name + '.' });
            }, function (err) {
              res.json({ text: err.toString() });
            });
          }
        );
      }
      break;

    case 'vs':
    case 'challenge':
      pong.findPlayer(hook.user_name).then(
        function (player) {
          if ((params[2] == 'double' || params[2] == 'doubles') && (params[4] == 'against' || params[4] == 'vs') && (params.length == 7)) {
            return pong.createDoubleChallenge(hook.user_name, params[3], params[5], params[6]).then(
              function (result) {
                return pong.getDuelGif().then(function (url) {
                  res.json({ text: result.message + ' ' + url });
                });
              },
              function (err) {
                return res.json({ text: err.toString() });
              }
            );
          } else if ((params[2] == 'single' || params[2] == 'singles') && (params.length == 4)) {
            return pong.createSingleChallenge(hook.user_name, params[3]).then(
              function (result) {
                return pong.getDuelGif().then(function (url) {
                  res.json({ text: result.message + ' ' + url });
                });
              },
              function (err) {
                return res.json({ text: err.toString() });
              }
            );
          } else if (params.length == 3) {
            return pong.createSingleChallenge(hook.user_name, params[2]).then(
              function (result) {
                return pong.getDuelGif().then(function (url) {
                  res.json({ text: result.message + ' ' + url });
                });
              },
              function (err) {
                return res.json({ text: err.toString() });
              }
            );
          } else {
            res.json({ text: "Invalid params, use _pongbot challenge <singles|doubles> <opponent|teammate> against <opponent> <opponent>_." });
          }
        },
        function (err) {
          res.json({ text: err.message + " Are you registered? Use _pongbot register_ first." });
        }
      );
      break;

    case 'ok':
    case 'accept':
      if (params.length != 2) {
        res.json({ text: "Invalid params, use _pongbot accept_." });
      } else {
        pong.acceptChallenge(hook.user_name).then(
          function (result) {
            res.json({ text: result.message });
          },
          function (err) {
            res.json({ text: err.message });
          }
        );
      }
      break;

    case 'no':
    case 'decline':
      if (params.length != 2) {
        res.json({ text: "Invalid params, use _pongbot decline_." });
      } else {
        pong.declineChallenge(hook.user_name).then(
          function (result) {
            res.json({ text: result.message });
          },
          function (err) {
            res.json({ text: err.message });
          }
        );
      }
      break;

    case 'chicken':
      if (params.length != 2) {
        res.json({ text: "Invalid params, use _pongbot chicken_." });
      } else {
        pong.chickenChallenge(hook.user_name).then(
          function (result) {
            res.json({ text: result.message });
          },
          function (err) {
            res.json({ text: err.message });
          }
        );
      }
      break;

    case 'lost':
      if (params.length != 2) {
        res.json({ text: "Invalid params, use _pongbot lost_." });
      } else {
        pong.lose(hook.user_name).then(
          function (result) {
            res.json({ text: result.message });
          },
          function (err) {
            res.json({ text: err.message });
          }
        );
      }
      break;

    case 'won':
      res.json({ text: 'Only the player/team that lost can record the game.' });
      break;

    case 'rank':
      if ((params.length != 2) && (params.length != 3)) {
        res.json({ text: "Invalid params, use _pongbot rank <username>_." });
      } else {
        pong.findPlayer(params[2] || hook.user_name).then(
          function (player) {
            res.json({ text: player.toString() });
          },
          function (err) {
            res.json({ text: err.message });
          }
        );
      }
      break;

    case 'leaderboard':
      var topN = null;

      if (params[2] && params[2].toLowerCase() === 'infinity') {
        topN = Infinity;
      } else if (params[2] && !isNaN(parseFloat(params[2])) && isFinite(params[2])) {
        topN = +params[2];
      } else {
        topN = 5;
      }

      if (topN <= 0) {
        res.json({ text: "Invalid params, use _pongbot leaderboard <1-Infinity>_." });
      } else {
        Player.find({
          "$or" : [
            { 'wins' : { '$ne' : 0 } },
            { 'losses' : { '$ne' : 0 }
          }]
        })
        .sort({ 'elo' : 'descending', 'wins' : 'descending' })
        .limit(topN)
        .find().then(
          function (players) {
            res.json({ text: Player.toString(players) });
          },
          function (err) {
            res.json({ text: "Error: " + err.message });
          }
        );
      }
      break;

    case 'reset':
      if (!process.env.ADMIN_SECRET) {
        res.json({ text: 'Error: ADMIN_SECRET not set.' });
      } else if (process.env.ADMIN_SECRET !== params[3]) {
        res.json({ text: "Invalid secret. Use _pongbot reset <username> <secret>_." });
      } else {
        pong.reset(params[2]).then(
          function (result) {
            res.json({ text: params[2] + "'s stats have been reset." });
          },
          function (err) {
            res.json({ text: err.message });
          }
        );
      }
      break;

    case 'new_season':
      if (!process.env.ADMIN_SECRET) {
        res.json({ text: 'Error: ADMIN_SECRET not set.' });
      } else if (process.env.ADMIN_SECRET !== params[2]) {
        res.json({ text: "Invalid secret. Use _pongbot new_season <secret>_." });
      } else {
        pong.resetAll().then(
          function (result) {
            res.json({ text: 'Welcome to the new season!' });
          },
          function (err) {
            res.json({ text: err.message });
          }
        );
      }
      break;

    case 'source':
      res.json({ text: 'https://github.com/andrewvy/slack-pongbot' });
      break;

    case 'help':
      res.json({ text: 'https://github.com/andrewvy/slack-pongbot' });
      break;

    case 'hug':
      res.json({ text: 'No.' });
      break;

    case 'sucks':
      res.json({ text: 'No, you suck.' });
      break;

    default:
      res.json({ text: "I couldn't understand that command. Use _pongbot help_ to get a list of available commands." });
      break;
    }
  }
};
