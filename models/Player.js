var mongoose = require('mongoose');
var mongoosePages = require('mongoose-pages');
var Schema = mongoose.Schema;
var pluralize = require('pluralize');

var playerSchema = new Schema({
  user_id: String,
  user_name: { type: String, index: { unique: true }, required: true },
  wins: Number,
  losses: Number,
  elo: Number,
  tau: Number,
  currentChallenge: { type: Schema.Types.ObjectId, ref: 'Challenge' }
});

playerSchema.methods = {
  halJSON: function (req) {
    return {
      data: {
        user_id: this.user_id,
        user_name: this.user_name,
        wins: this.wins,
        losses: this.losses,
        elo: this.elo
      },
      links: {
        self: req.rootUrl() + '/players/' + this._id,
      }
    };
  },

  toString: function() {
    return this.user_name + ": " + pluralize('win', this.wins, true) + " " + pluralize('loss', this.losses, true) + " (elo: " + this.elo + ")";
  }
};

playerSchema.statics = {
  toString: function(players) {
    var rank = 1;
    var out = '';
    players.forEach(function(player, i) {
      if (players[i - 1] && players[i - 1].elo != player.elo) {
        rank = i + 1;
      }
      out += rank + ". " + player.toString() + "\n";
    });
    return out;
  }
};

mongoosePages.anchor(playerSchema);

var Player = mongoose.model('Player', playerSchema);
module.exports = Player;
