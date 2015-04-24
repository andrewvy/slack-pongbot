//  _____             _____     _
// |  _  |___ ___ ___| __  |___| |
// |   __| . |   | . | __ -| . |  _|
// |__|  |___|_|_|_  |_____|___|_|
//               |___|

'use strict';

var mongoose = require('mongoose');
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/pingpong';
mongoose.connect(mongoUri);

var app = require('./lib/app').instance();

var port = process.env.PORT || 3000;
app.listen(port);
console.log('Listening on port', port);
