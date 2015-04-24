var mongoose = require('mongoose');

var Player = require('../models/Player');
var Challenge = require('../models/Challenge');

exports.setup = function(){
  before(function (done) {
    mongoose.connect('mongodb://localhost/pingpong_test', done);
  });

  after(function (done) {
    mongoose.disconnect(done);
  });

  beforeEach(function (done) {
    Player.remove().then(function () {
      Challenge.remove().then(function () {
        done();
      });
    });
  });
};
