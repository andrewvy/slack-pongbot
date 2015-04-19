var Player = require('../models/Player');
var Challenge = require('../models/Challenge');
var pong = require('./pong');

module.exports.index = function (req, res) {
  var hook = req.body;

  if (hook) {

    var params = hook.text.split(' ');
    var command = params[1];

    switch (command) {
    case 'register':
      if (params.length != 2) {
        res.json({ text: "Invalid params, use 'pongbot register'." });
      } else {
        pong.findPlayer(hook.user_name, function (err, user) {
          if (user) {
            res.json({ text: "You've already registered!" });
          } else {
            pong.registerPlayer(hook.user_name, function (err, user) {
              if (err) return res.json({ text: err.toString() });
              res.json({ text: 'Successfully registered! Welcome to the system, ' + hook.user_name + '.' });
            });
          }
        });
      }
      break;

    case 'challenge':
      pong.findPlayer(hook.user_name, function (err, user) {
        if (err && !user) {
          res.json({ text: err.message + " Are you registered? Use 'pongbot register' first." });
        } else if ((params[2] == 'double' || params[2] == 'doubles') && (params[4] == 'against') && (params.length == 7)) {
          pong.createDoubleChallenge(hook.user_name, params[3], params[5], params[6], function (err, challenge) {
            if (err && !challenge) return res.json({ text: err.toString() });
            pong.getDuelGif(function (url) {
              res.json({ text: err.message + ' ' + url });
            });
          });
        } else if ((params[2] == 'single' || params[2] == 'singles') && (params.length == 4)) {
          pong.createSingleChallenge(hook.user_name, params[3], function (err, challenge) {
            if (err && !challenge) return res.json({ text: err.toString() });
            pong.getDuelGif(function (url) {
              res.json({ text: err.message + ' ' + url });
            });
          });
        } else {
          res.json({ text: "Invalid params, use 'pongbot challenge _<singles|doubles> <opponent|teammate>_ against _<opponent> <opponent>_'." });
        }
      });
      break;

    case 'accept':
      if (params.length != 2) {
        res.json({ text: "Invalid params, use 'pongbot accept'." });
      } else {
        pong.acceptChallenge(hook.user_name, function (err) {
          res.json({ text: err.message });
        });
      }
      break;

    case 'decline':
      if (params.length != 2) {
        res.json({ text: "Invalid params, use 'pongbot decline'." });
      } else {
        pong.declineChallenge(hook.user_name, function (err) {
          res.json({ text: err.message });
        });
      }
      break;

    case 'lost':
      if (params.length != 2) {
        res.json({ text: "Invalid params, use 'pongbot lost'." });
      } else {
        pong.lose(hook.user_name, function (err, user) {
          res.json({ text: err.message });
        });
      }
      break;

    case 'won':
      res.json({ text: 'Only the player/team that lost can record the game.' });
      break;

    case 'rank':
      if ((params.length != 2) && (params.length != 3)) {
        res.json({ text: "Invalid params, use 'pongbot rank _<username>_'." });
      } else {
        pong.findPlayer(params[2] || hook.user_name, function (err, user) {
          if (err && !user) {
            res.json({ text: err.message });
          } else {
            res.json({ text: pong.playerToS(user) });
          }
        });
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
        .find(function(err, players) {
          if (err) return res.json({ text: "Error: " + err.message });
          res.json({ text: pong.playersToS(players) });
        });
      }
      break;

    case 'reset':
      if (hook.user_name === 'vy') {
        pong.reset(params[2], function (err, user) {
          if (err) {
            res.json({ text: err.message });
          } else {
            res.json({ text: params[2] + "'s stats have been reset." });
          }
        });
      } else {
        res.json({ text: 'You do not have admin rights.' });
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

module.exports.commands = function (req, res) {
  console.log('Got a post from ' + req.body.user_name);

  switch (req.body.command) {
  case '/rank':
    pong.findPlayer(req.body.text || req.body.user_name, function (err, user) {
      var message = '';
      if (user) {
        message = user.user_name + ': ' + user.wins + ' wins, ' + user.losses + ' losses. Elo: ' + user.elo;
      } else if (user === false) {
        message = 'Could not find a player with that name.';
      }
      res.send(message);
    });
    break;

  case '/leaderboard':
    Player.find({ 'wins': { $gt: 3 } }).sort({ 'elo': 'descending' }).find(function (err, players) {
      var message = '';
      if (err)
        return handleError(err);
      for (var i = 0; i < players.length; i++) {
        console.log(message);
        var actual = i + 1;
        message = message + actual + ') ' + players[i].user_name + ': ' + players[i].wins + '-' + players[i].losses + ' Elo: ' + players[i].elo + '\n';
      }
      res.send(message);
    });
    break;

  case '/challenges':
    Challenge.find({ 'state': 'Proposed' }).sort({ 'date': 'desc' }).find(function (err, challenges) {
      var message = '';
      if (err)
        return handleError(err);
      for (var i = 0; i < challenges.length; i++) {
        var actual = i + 1;
        if (challenges[i].type == 'Singles') {
          message = message + actual + ') ' + challenges[i].challenger[0] + ' challenged ' + challenges[i].challenged[0] + ' on ' + challenges[i].date + '\n';
        } else {
          message = message + actual + ') ' + challenges[i].challenger[0] + ' and ' + challenges[i].challenger[1] + ' challenged ' + challenges[i].challenged[0] + ' and ' + challenges[i].challenged[1] + ' on ' + challenges[i].date + '\n';
        }
      }
      res.send(message);
    });
    break;
  }
};
