var express = require('express');
var hal = require("express-hal");
var bodyParser = require('body-parser');
var request = require('request');

var pong = require('./pong');
var pong_routes = require('./routes');
var api_routes = require('./api');

var Player = require('../models/Player');
var Challenge = require('../models/Challenge');

module.exports.instance = function () {
  var app = express();
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(hal.middleware);

  app.use(require('./url').middleware);
  app.use(require('./hal').middleware);
  app.use(require('./player_middleware').middleware);

  app.post('/', pong_routes.index);

  app.get('/', api_routes.root);
  app.get('/players', api_routes.players);
  app.get('/players/:id', api_routes.player);
  app.get('/challenges', api_routes.challenges);
  app.get('/challenges/:id', api_routes.challenge);
  app.get('/leaderboard', api_routes.leaderboard);

  app.get('/info', pong_routes.leaderboard);


  return app;
};

