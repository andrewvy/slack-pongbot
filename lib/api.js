var Player = require('../models/Player');
var Challenge = require('../models/Challenge');
var pjson = require('../package.json');
var mongoose = require('mongoose');
var Q = require('q');

module.exports = {
  root: function (req, res) {
    res.hal({
      data: {
        version: pjson.version
      },
      links: {
        self: req.rootUrl() + '/',
        players: req.rootUrl() + '/players',
        challenges: req.rootUrl() + '/challenges',
        leaderboard: req.rootUrl() + '/leaderboard',
      }
    });
  },

  players: function (req, res) {
    res.halWithPagination(Player, req, res, function(players, req) {
      return {
        players: players.map(function(player) {
          return player.halJSON(req);
        })
      };
    });
  },

  leaderboard: function (req, res) {
    Player.find({
      "$or" : [
        { 'wins' : { '$ne' : 0 } },
        { 'losses' : { '$ne' : 0 }
      }]
    })
    .sort({ 'elo' : 'descending', 'wins' : 'descending' })
    .find()
    .then(function (players) {
      res.hal({
        data: {
          totalPages: 1
        },
        embeds: {
          players: players.map(function(player) {
            return player.halJSON(req);
          }),
        },
        links: {
          self: req.fullPath(),
        }
      });
    },
    function (err) {
      res.json({ text: "Error: " + err.message });
    });
  },

  player: function (req, res) {
    var promises = [];
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      promises.push(Player.findById(req.params.id));
    }
    promises.push(Player.findOne({ user_name: req.params.id }));
    Q.any(promises).then(
      function (player) {
        if (player && player._id.toString() !== req.params.id) {
          res.redirect(302, req.rootUrl() + '/players/' + player._id);
        } else if (player) {
          res.hal(player.halJSON(req));
        } else {
          res.status(404).send('Not Found');
        }
      },
      function (err) {
        return res.status(500).send(err);
      }
    );
  },

  challenges: function (req, res) {
    res.halWithPagination(Challenge, req, res, function(challenges, req) {
      return {
        challenges: challenges.map(function(challenge) {
          return challenge.halJSON(req);
        })
      };
    });
  },

  challenge: function (req, res) {
    Challenge.findById(req.params.id).then(
      function (challenge) {
        if (challenge) {
          res.hal(challenge.halJSON(req));
        } else {
          res.status(404).send('Not Found');
        }
      },
      function (err) {
        return res.status(500).send(err);
      }
    );
  }
};
