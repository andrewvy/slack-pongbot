'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ChallengeSchema = new Schema({
  state: {
    type: String,
    index: true
  },
  type: String,
  date: {
    type: Date,
    index: true
  },
  challenger: Array,
  challenged: Array
});

var Challenge = mongoose.model('Challenge', ChallengeSchema);

module.exports = Challenge;