var Player = require('../models/Player');
var Challenge = require('../models/Challenge');
var pong = require('./pong');
var Q = require('q');

// a middlware that keeps player IDs and names in sync
module.exports.middleware = function(req, res, next) {
  var hook = req.body;
  if (hook && hook.user_name && hook.user_id) {
    Player.where({
      '$or' : [
        { user_name: hook.user_name },
        { user_id: hook.user_id }
      ]}).findOne().then(
        function (player) {
          if (player && ((player.user_id !== hook.user_id) || (player.user_name !== hook.user_name))) {

            if (process.env.LOG_LEVEL === 'debug') {
              console.log("Updating player '" + player.user_name + "' (" + player.user_id + ').');
            }

            player.user_id = hook.user_id;
            player.user_name = hook.user_name;
            player.save().then(
              function () {
                return next();
              },
              function (err) {
                return next();
              }
            );
          } else {
            return next();
          }
        },
        function (err) {
          return next();
        }
      );
  } else {
    return next();
  }
};
