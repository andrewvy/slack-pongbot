var mongoose = require('../lib/db.js');
var Schema = mongoose.Schema;

var ChallengeSchema = new Schema({
	state: String,
	type: String,
	date: Date,
	challenger: Array,
	challenged: Array
});

var Challenge = mongoose.model('Challenge', ChallengeSchema);

module.exports = Challenge;