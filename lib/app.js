var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');

var pong = require('./pong');
var pong_routes = require('./routes');
var api_routes = require('./api');

var Player = require('../models/Player');
var Challenge = require('../models/Challenge');

module.exports.instance = function () {
  var app = express();
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json());

  // Pongbot Routes

  app.get('/', function (req, res) {
    res.send('pong');
  });

  app.post('/', pong_routes.index);

  // Pongbot API Routes
  app.get('/api/players', api_routes.players);
  app.get('/api/challenges', api_routes.challenges);

  return app;
};

