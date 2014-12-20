'use strict';

var mongoose = require('mongoose');
var handleError = require('./errorhandler.js');

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/pingpong';

function dbConnect () {
  mongoose.connect(mongoUri, handleError);
}

dbConnect();

mongoose.connection.once('open', function () {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', function (err) {
  console.error(err);
  setTimeout(dbConnect, 5000);
});
