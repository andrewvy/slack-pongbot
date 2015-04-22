var Player = require('../models/Player');
var Challenge = require('../models/Challenge');
var pong = require('./pong');

module.exports.index = function (req, res) {
  var hook = req.body;

  if (hook) {

    if (process.env.LOG_LEVEL === 'debug') {
      console.log(hook);
    }

    var params = hook.text.split(' ');
    var command = params[1];

    switch (command) {
    case 'register':
      if (params.length != 2) {
        res.json({ text: "Invalid params, use 'pongbot register'." });
      } else {
        pong.findPlayer(hook.user_name).then(
          function (player) {
            res.json({ text: "You've already registered!" });
          },
          function (err) {
            pong.registerPlayer(hook.user_name).then(function (player) {
              res.json({ text: 'Successfully registered! Welcome to the system, ' + hook.user_name + '.' });
            }, function (err) {
              res.json({ text: err.toString() });
            });
          }
        );
      }
      break;

    case 'challenge':
      pong.findPlayer(hook.user_name).then(
        function (player) {
          if ((params[2] == 'double' || params[2] == 'doubles') && (params[4] == 'against') && (params.length == 7)) {
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
          } else {
            res.json({ text: "Invalid params, use 'pongbot challenge _<singles|doubles> <opponent|teammate>_ against _<opponent> <opponent>_'." });
          }
        },
        function (err) {
          res.json({ text: err.message + " Are you registered? Use 'pongbot register' first." });
        }
      );
      break;

    case 'accept':
      if (params.length != 2) {
        res.json({ text: "Invalid params, use 'pongbot accept'." });
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

    case 'decline':
      if (params.length != 2) {
        res.json({ text: "Invalid params, use 'pongbot decline'." });
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
        res.json({ text: "Invalid params, use 'pongbot chicken'." });
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
        res.json({ text: "Invalid params, use 'pongbot lost'." });
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
        res.json({ text: "Invalid params, use 'pongbot rank _<username>_'." });
      } else {
        pong.findPlayer(params[2] || hook.user_name).then(
          function (player) {
            res.json({ text: pong.playerToS(player) });
          },
          function (err) {
            res.json({ text: err.message });
          }
        );
      }
      break;

    case 'leaderboard':
      var topN = parseFloat(params[2]) || 5;
      if (topN < 0) {
        res.json({ text: "Invalid params, use 'pongbot leaderboard _<1-Infinity>_'." });
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
            res.json({ text: pong.playersToS(players) });
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
        res.json({ text: "Invalid secret. Use 'pongbot reset _<username>_ _<secret>_." });
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
        res.json({ text: "Invalid secret. Use 'pongbot new_season _<secret>_." });
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
      res.json({ text: "I couldn't understand that command. Use 'pongbot help' to get a list of available commands." });
      break;
    }
  }
};
