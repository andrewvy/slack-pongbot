var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PlayerSchema = new Schema({
	user_name: String,
	wins: Number,
	losses: Number,
	elo: Number,
	tau: Number,
	currentChallenge: { type: Schema.Types.ObjectId, ref: 'Challenge' }
});

var Player = mongoose.model('Player', PlayerSchema);

module.exports = Player;