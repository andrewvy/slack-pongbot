var mongoose = require('../lib/db.js');
var Schema = mongoose.Schema;

var PlayerSchema = new Schema({
	user_name: String,
	wins: Number,
	losses: Number,
	elo: Number,
	tau: Number,
	currentChallenge: Schema.Types.ObjectId
});

var Player = mongoose.model('Player', PlayerSchema);

module.exports = Player;