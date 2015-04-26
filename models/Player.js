var mongoose = require('mongoose');
var mongoosePages = require('mongoose-pages');
var Schema = mongoose.Schema;

var PlayerSchema = new Schema({
  user_id: String,
  user_name: { type: String, index: { unique: true }, required: true },
  wins: Number,
  losses: Number,
  elo: Number,
  tau: Number,
  currentChallenge: { type: Schema.Types.ObjectId, ref: 'Challenge' }
});

mongoosePages.anchor(PlayerSchema);

PlayerSchema.methods = {
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
  }
};

var Player = mongoose.model('Player', PlayerSchema);
module.exports = Player;
