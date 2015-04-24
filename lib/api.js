var Player = require('../models/Player');
var Challenge = require('../models/Challenge');

module.exports = {
  players: function (req, res) {
    Player.find({}).sort({'elo': 'descending'}).then(
      function(players) {
        res.json(players);
      },
      function(err) {
        res.status(500).send(err);
      }
    );
  },

  challenges: function (req, res) {
    Challenge.find({}).sort({'date': 'desc'}).then(
      function(challenges) {
        res.json(challenges);
      },
      function(err) {
        res.status(500).send(err);
      }
    );
  }
};
