//  _____             _____     _
// |  _  |___ ___ ___| __  |___| |
// |   __| . |   | . | __ -| . |  _|
// |__|  |___|_|_|_  |_____|___|_|
//               |___|


// Version 0.9
//
// Right now, this is just a single monolithic file that I would like to split up into their own modules. It should be easy to abstract all the DB stuff and Pongbot Lib stuff into their own modules.
//
// In the next few versions, I would like to:
//
// - Update/tweak the elo algorithm and allow for placement matches
// - More helpful command syntax
// - An API for you guys to play around with, socket.io for live updates
// - Rankings
// - Matchmaking Service (Matches people up with similar skill levels.)

var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var mongoose = require('mongoose');

var app = express();

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/pingpong';
mongoose.connect(mongoUri);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var db = require('./lib/db');
var pong = require('./lib/pong');
var routes = require('./lib/routes');

var Player = require('./models/Player');
var Challenge = require('./models/Challenge');

pong.init();

app.post('/', routes.index);

app.post('/commands', routes.commands);

app.get('/api/rankings', function(req, res) {
	Player.find({}).sort({'elo': 'descending'}).find( function(err, players) {
		if (err) return handleError(err);
		res.json(players);
	});
});

app.get('/api/matches', function(req, res) {
	Challenge.find({}).sort({'date': 'desc'}).find( function(err, challenges) {
		if (err) return handleError(err);
		res.json(challenges);
	});
});

app.listen(process.env.PORT || 3000);
console.log("Listening on port 3000!");
