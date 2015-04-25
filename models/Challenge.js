var mongoose = require('mongoose');
var mongoosePages = require('mongoose-pages');
var Schema = mongoose.Schema;

var ChallengeSchema = new Schema({
	state: String,
	type: String,
	date: Date,
	challenger: Array,
	challenged: Array
});

mongoosePages.anchor(ChallengeSchema);

ChallengeSchema.methods = {
  halJSON: function (req) {
    return {
      data: {
        type: this.type,
        state: this.state,
        date: this.date
      },
      links: {
        self: req.rootUrl() + '/challenges/' + this._id,
        challengers: this.challenger.map(function(player) {
          return { href: req.rootUrl() + '/players/' + player };
        }),
        challenged: this.challenged.map(function(player) {
          return { href: req.rootUrl() + '/players/' + player };
        })
      }
    };
  }
};

var Challenge = mongoose.model('Challenge', ChallengeSchema);
module.exports = Challenge;
