'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PlayerSchema = new Schema({
	user_name: {
    type: String,
    index: true
  },
	wins: {
    type: Number,
    index: true
  },
	losses: Number,
	elo: {
    type: Number,
    index: true
  },
	tau: Number,
	currentChallenge: {
    type: Schema.Types.ObjectId,
    ref: 'Challenge'
  }
});

var Player = mongoose.model('Player', PlayerSchema);

module.exports = Player;