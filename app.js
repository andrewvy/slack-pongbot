//  _____             _____     _
// |  _  |___ ___ ___| __  |___| |
// |   __| . |   | . | __ -| . |  _|
// |__|  |___|_|_|_  |_____|___|_|
//               |___|

'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var mongoose = require('mongoose');

var app = express();

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/pingpong';
mongoose.connect(mongoUri);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var pong = require('./lib/pong');
var routes = require('./lib/routes');

var Player = require('./models/Player');
var Challenge = require('./models/Challenge');

pong.init();

app.get('/', function (req, res) {
  res.send('pong');
});

app.post('/', routes.index);

app.post('/commands', routes.commands);

app.get('/api/rankings', function(req, res) {
	Player.find({}).sort({'elo': 'descending'}).find( function(err, players) {
		if (err) return res.status(500).send(err);
		res.json(players);
	});
});

app.get('/api/matches', function(req, res) {
	Challenge.find({}).sort({'date': 'desc'}).find( function(err, challenges) {
		if (err) return res.status(500).send(err);
		res.json(challenges);
	});
});

var port = process.env.PORT || 3000;
app.listen(port);
console.log('Listening on port', port);
