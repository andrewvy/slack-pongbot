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

var express = require('express')
,   bodyParser = require('body-parser')
,   mongoose = require('mongoose')
,   request = require('request')
,   Schema = mongoose.Schema;

var app = express();
mongoose.connect('mongodb://localhost/pingpong');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var PlayerSchema = new Schema({
	user_name: String,
	wins: Number,
	losses: Number,
	elo: Number,
	tau: Number,
	currentChallenge: { type: Schema.Types.ObjectId, ref: 'Challenge' }
});

var ChallengeSchema = new Schema({
	state: String,
	type: String,
	date: Date,
	challenger: Array,
	challenged: Array
});

var Player = mongoose.model('Player', PlayerSchema);
var Challenge = mongoose.model('Challenge', ChallengeSchema);

var pong = {
	init: function() {
		pong.channel = "#pongbot";
		pong.deltaTau = 0.94;
	},
	registerPlayer: function(user_name, cb) {
		var p = new Player({
			user_name: user_name,
			wins: 0,
			losses: 0,
			elo: 0,
			tau: 0
		});
		p.save( function(err) {
			if (err) return new Error(err);
			if (cb) cb();
		});
	},
	findPlayer: function(user_name, cb) {
		var q = Player.where({ user_name: user_name });
		q.findOne(function (err, user) {
			if (err) return handleError(err);
			if (user) {
				cb(user);
			} else {
				cb(false);
			}
		});
	},
	getEveryone: function() {
		Player.find({}, function(users) {
			if (err) return handleError(err);
			console.log(users)
		});
	},
	updateWins: function(user_name, cb) {
		var q = Player.where({ user_name: user_name });
		q.findOne(function (err, user) {
			if (err) return handleError(err);
			if (user) {
				user.wins++;
				user.save(function (err, user) {
					if (err) return handleError(err);
					if (cb) cb();
				});
			}
		});
	},
	updateLosses: function(user_name, cb) {
		var q = Player.where({ user_name: user_name });
		q.findOne(function (err, user) {
			if (err) return handleError(err);
			if (user) {
				user.losses++;
				user.save(function (err, user) {
					if (err) return handleError(err);
					if (cb) cb();
				});
			}
		});
	},
	createSingleChallenge: function(challenger, challenged, cb) {
		var message = "";
		pong.checkChallenge(challenger, function(y) {
			if (y === false) {
				pong.checkChallenge(challenged, function(y2) {
					if (y2 === false) {
						var c = new Challenge({
							state: "Proposed",
							type: "Single",
							date: Date.now(),
							challenger: [challenger],
							challenged: [challenged]
						});
						c.save( function(err, nc) {
							if (err) return new Error(err);
							pong.setChallenge(challenger, nc._id);
							pong.setChallenge(challenged, nc._id);
							message = "You've challenged " + challenged + " to a ping pong match!";
							console.log(nc);
							cb(message);
						});
					} else {
						cb("There's already an active challenge for " + challenged);
					}
				});
			} else {
				cb("There's already an active challenge for " + challenger);
			}
		});
	},
	createDoubleChallenge: function(c1, c2, c3, c4, cb) {
		var message = "";
		pong.checkChallenge(c1, function(y) {
			if (y === false) {
				pong.checkChallenge(c2, function(y) {
					if (y === false) {
						pong.checkChallenge(c3, function(y) {
							if (y === false) {
								pong.checkChallenge(c4, function(y) {
									if (y === false) {
											var c = new Challenge({
												state: "Proposed",
												type: "Doubles",
												date: Date.now(),
												challenger: [c1, c2],
												challenged: [c3, c4]
											});
											c.save( function(err, nc) {
												console.log(nc);
												if (err) return new Error(err);
												pong.setChallenge(c1, nc._id);
												pong.setChallenge(c2, nc._id);
												pong.setChallenge(c3, nc._id);
												pong.setChallenge(c4, nc._id);
												message = "You and " + c2 + " have challenged " + c3 + " and " + c4 + " to a ping pong match!";
												cb(message);
											});
									} else {
										cb("There's already an active challenge for " + c4);
									}
								});
							} else {
								cb("There's already an active challenge for " + c3);
							}
						});
					} else {
						cb("There's already an active challenge for " + c2);
					}
				});
			} else {
				cb("There's already an active challenge for " + c1);
			}
		});
	},
	checkChallenge: function(user_name, cb) {
		var q = Player.where({ user_name: user_name});
		q.findOne(function(err, u) {
			if (err) return handleError(err);
			if (u) {
				if (u.currentChallenge) {
					cb(u);
				} else {
					cb(false);
				}
			}
		});
	},
	setChallenge: function(user_name, id) {
		var q = Player.where({ user_name: user_name});
		q.findOne(function(err, u) {
			if (err) return handleError(err);
				if (u) {
					u.currentChallenge = id;
					u.save( function(err) {
						if (err) return new Error(err);
					});
				}
		});
	},
	removeChallenge: function(user_name, id) {
		var q = Player.where({ user_name: user_name});
		q.findOne(function(err, u) {
			if (err) return handleError(err);
				if (u) {
					u.currentChallenge = "";
					u.save( function(err) {
						if (err) return new Error(err);
					});
				}
		});
	},
	acceptChallenge: function(user_name, cb) {
		pong.checkChallenge(user_name, function(y) {
			if (y) {
				Challenge.findOne({ _id: y.currentChallenge }, function(err, c) {
					if (c.state === "Proposed") {
						c.state = "Accepted";
						var message = user_name + " accepted " + c.challenger[0] + "'s challenge."
						cb(message);
						c.save(function (err) {
							if (err) return handleError(err);
						});
					} else if (challenge.state == "Accepted") {
						cb("You've already accepted the challenge.");
					} else {
						cb("No challenge to accept.")
					}
				});
			} else {
				cb("No challenge to accept.");
			}
		});
	},
	declineChallenge: function(user_name, cb) {
		pong.checkChallenge(user_name, function(y) {
			if (y) {
				Challenge.findOne({ _id: y.currentChallenge }, function(err, nc) {
					if (nc.state === "Proposed" || "Accepted") {
						nc.state = "Declined";
						nc.save(function(err) {
							if (err) return handleError(err);
								console.log(y.currentChallenge);
							Player.update( {currentChallenge: nc._id}, {currentChallenge: null}, {multi: true}, function(err) {
								if (err) return handleError(err);
							});
							cb("Declined the match.");
						});
					}
				});
			} else {
				cb("No challenge to decline!");
			}
		});
	},
	calculateTeamElo: function(p1, p2, cb) {
		var q = Player.where({ user_name: p1 });
		q.findOne(function (err, user) {
			if (err) return handleError(err);
			if (user) {
				var playerOneElo = user.elo;
				var qq = Player.where({ user_name: p2 });
				qq.findOne(function (err, user2) {
					if (err) return handleError(err);
					var playerTwoElo = user2.elo;
					var avgElo = (playerOneElo+playerTwoElo)/2;
					cb(avgElo);
				});
			}
		});
	},
	eloSinglesChange: function(w, l) {
		var q = Player.where({ user_name: w});
		q.findOne(function(err, winner) {
			if (err) return handleError(err);
			if (winner) {
				var qq = Player.where({ user_name: l});
				qq.findOne(function (err, loser) {
					if (err) return handleError(err);
						var e = 100 - Math.round(1 / (1 + Math.pow(10, ((loser.elo - winner.elo) / 400))) * 100);
						winner.tau = winner.tau || 0;
						winner.tau = winner.tau + .5;
						winner.elo = winner.elo + Math.round((e * Math.pow(pong.deltaTau,winner.tau)));
						loser.tau = loser.tau || 0;
						loser.tau = loser.tau + .5;
						loser.elo = loser.elo - Math.round((e * Math.pow(pong.deltaTau,loser.tau)));
						console.log("Elo: " + winner.elo);
						console.log("Elo: " + loser.elo);
						winner.save(function(err) {
							if (err) return handleError(err);
						});
						loser.save(function(err) {
							if (err) return handleError(err);
						});
				});
			}
		});
	},
	eloDoublesChange: function(p1, p2, p3, p4) {
		pong.calculateTeamElo(p1, p2, function(t1) {
			pong.calculateTeamElo(p3, p4, function(t2) {
				var q = Player.where({ user_name: p1});
				q.findOne(function(err, u1){
					if (err) return handleError(err);
					var q = Player.where({ user_name: p2});
					q.findOne(function(err, u2){
						if (err) return handleError(err);
							var q = Player.where({ user_name: p3});
							q.findOne(function(err, u3){
								if (err) return handleError(err);
									var q = Player.where({ user_name: p4});
									q.findOne(function(err, u4){
										if (err) return handleError(err);
										var e = 100 - Math.round(1 / (1 + Math.pow(10, ((t2 - u1.elo) / 400))) * 100);
										var e2 = 100 - Math.round(1 / (1 + Math.pow(10, ((t2 - u2.elo) / 400))) * 100);
										var e3 = 100 - Math.round(1 / (1 + Math.pow(10, ((u3.elo - t1) / 400))) * 100);
										var e4 = 100 - Math.round(1 / (1 + Math.pow(10, ((u4.elo - t1) / 400))) * 100);
										u1.tau = u1.tau || 0;
										u1.tau = u1.tau + .5;
										u1.elo = u1.elo + Math.round((e * Math.pow(pong.deltaTau,u1.tau)));
										u2.tau = u2.tau || 0;
										u2.tau = u2.tau + .5;
										u2.elo = u2.elo + Math.round((e2 * Math.pow(pong.deltaTau,u2.tau)));
										u3.tau = u3.tau || 0;
										u3.tau = u3.tau + .5;
										u3.elo = u3.elo - Math.round((e3 * Math.pow(pong.deltaTau,u3.tau)));
										u4.tau = u4.tau || 0;
										u4.tau = u4.tau + .5;
										u4.elo = u4.elo - Math.round((e4 * Math.pow(pong.deltaTau,u4.tau)));
										console.log("Elo: " + u1.elo);
										console.log("Elo: " + u2.elo);
										console.log("Elo: " + u3.elo);
										console.log("Elo: " + u4.elo);
										u1.save(function(err) {
											if (err) return handleError(err);
										});
										u2.save(function(err) {
											if (err) return handleError(err);
										});
										u3.save(function(err) {
											if (err) return handleError(err);
										});
										u4.save(function(err) {
											if (err) return handleError(err);
										});
									});
							});
					});
				});
			});
		});
	},
	win: function(user_name, cb) {
		pong.checkChallenge(user_name, function(y) {
			if (y) {
				Challenge.findOne({ _id: y.currentChallenge }, function(err, nc) {
				if (nc.state === "Proposed") {
					cb("Challenge needs to be accepted before recording match.");
				} else if (nc.type === "Doubles") {
					if (user_name === nc.challenger[0] || user_name === nc.challenger[1]) {
						Player.update( {currentChallenge: nc._id}, {currentChallenge: null}, {multi: true}, function(err) {
							if (err) return handleError(err);
								console.log("Recorded challenge.")
						});
						pong.eloDoublesChange(nc.challenger[0], nc.challenger[1], nc.challenged[0], nc.challenged[1]);
						pong.updateWins(nc.challenger[0]);
						pong.updateWins(nc.challenger[1]);
						pong.updateLosses(nc.challenged[0]);
						pong.updateLosses(nc.challenged[1]);
						nc.state = "Finished";
						y.save(function(err) {
							if (err) return handleError(err);
							cb("Match has been recorded.");
						});
					} else {
						Player.update( {currentChallenge: nc._id}, {currentChallenge: null}, {multi: true}, function(err) {
							if (err) return handleError(err);
								console.log("Recorded challenge.")
						});
						pong.eloDoublesChange(nc.challenged[0], nc.challenged[1], nc.challenger[0], nc.challenger[1]);
						pong.updateWins(nc.challenged[0]);
						pong.updateWins(nc.challenged[1]);
						pong.updateLosses(nc.challenger[0]);
						pong.updateLosses(nc.challenger[1]);
						nc.state = "Finished";
						y.save(function(err) {
							if (err) return handleError(err);
							cb("Match has been recorded.");
						});
					}
				} else if (nc.type === "Single") {
					if (user_name === nc.challenger[0]) {
						Player.update( {currentChallenge: nc._id}, {currentChallenge: null}, {multi: true}, function(err) {
							if (err) return handleError(err);
								console.log("Recorded challenge.")
						});
						pong.eloSinglesChange(nc.challenger[0], nc.challenged[0]);
						pong.updateWins(nc.challenger[0]);
						pong.updateLosses(nc.challenged[0]);
						nc.state = "Finished";
						y.save(function(err) {
							if (err) return handleError(err);
							cb("Match has been recorded.");
						});
					} else {
						Player.update( {currentChallenge: nc._id}, {currentChallenge: null}, {multi: true}, function(err) {
							if (err) return handleError(err);
								console.log("Recorded challenge.")
						});
						pong.eloSinglesChange(nc.challenged[0], nc.challenger[0]);
						pong.updateWins(nc.challenged[0]);
						pong.updateLosses(nc.challenger[0]);
						nc.state = "Finished";
						y.save(function(err) {
							if (err) return handleError(err);
							cb("Match has been recorded.");
						});
					}
				}
			});
			} else {
				cb("Challenge does not exist, or has been recorded already.");
			}
		});
	},
	lose: function(user_name, cb) {
		pong.checkChallenge(user_name, function(y) {
			if (y) {
				Challenge.findOne({ _id: y.currentChallenge }, function(err, nc) {
				if (nc.state === "Proposed") {
					cb("Challenge needs to be accepted before recording match.");
				} else if (nc.type === "Doubles") {
					if (user_name === nc.challenged[0] || user_name === nc.challenged[1]) {
						Player.update( {currentChallenge: nc._id}, {currentChallenge: null}, {multi: true}, function(err) {
							if (err) return handleError(err);
								console.log("Recorded challenge.")
						});
						pong.eloDoublesChange(nc.challenger[0], nc.challenger[1], nc.challenged[0], nc.challenged[1]);
						pong.updateWins(nc.challenger[0]);
						pong.updateWins(nc.challenger[1]);
						pong.updateLosses(nc.challenged[0]);
						pong.updateLosses(nc.challenged[1]);
						nc.state = "Finished";
						nc.save(function(err) {
							if (err) return handleError(err);
							cb("Match has been recorded.");
						});
					} else {
						Player.update( {currentChallenge: nc._id}, {currentChallenge: null}, {multi: true}, function(err) {
							if (err) return handleError(err);
								console.log("Recorded challenge.")
						});
						pong.eloDoublesChange(nc.challenged[0], nc.challenged[1], nc.challenger[0], nc.challenger[1]);
						pong.updateWins(nc.challenged[0]);
						pong.updateWins(nc.challenged[1]);
						pong.updateLosses(nc.challenger[0]);
						pong.updateLosses(nc.challenger[1]);
						nc.state = "Finished";
						nc.save(function(err) {
							if (err) return handleError(err);
							cb("Match has been recorded.");
						});
					}
				} else if (nc.type === "Single") {
					if (user_name === nc.challenged[0]) {
						Player.update( {currentChallenge: nc._id}, {currentChallenge: null}, {multi: true}, function(err) {
							if (err) return handleError(err);
								console.log("Recorded challenge.")
						});
						pong.eloSinglesChange(nc.challenger[0], nc.challenged[0]);
						pong.updateWins(nc.challenger[0]);
						pong.updateLosses(nc.challenged[0]);
						nc.state = "Finished";
						nc.save(function(err) {
							if (err) return handleError(err);
							cb("Match has been recorded.");
						});
					} else {
						Player.update( {currentChallenge: nc._id}, {currentChallenge: null}, {multi: true}, function(err) {
							if (err) return handleError(err);
								console.log("Recorded challenge.")
						});
						pong.eloSinglesChange(nc.challenged[0], nc.challenger[0]);
						pong.updateWins(nc.challenged[0]);
						pong.updateLosses(nc.challenger[0]);
						nc.state = "Finished";
						nc.save(function(err) {
							if (err) return handleError(err);
							cb("Match has been recorded.");
						});
					}
				}
			});
			} else {
				cb("Challenge does not exist, or has been recorded already.");
			}
		});
	},
	findDoublesPlayers: function(p2, p3, p4, cb) {
		var q = Player.where({ user_name: p2});
		q.findOne(function(err, u2){
			if (err) return handleError(err);
			if(u2) {
				var q = Player.where({ user_name: p3});
				q.findOne(function(err, u3){
					if (err) return handleError(err);
					if(u3) {
						var q = Player.where({ user_name: p4});
						q.findOne(function(err, u4){
							if (err) return handleError(err);
							if(u4) {
								cb(true);
							} else {
								cb("Opponent 2 could not be found.");
							}
						});
					} else {
						cb("Opponent 1 could not be found.");
					}
				});
			} else {
				cb("Teammate could not be found.");
			}
		});
	},
	reset: function(user_name, cb) {
		var q = Player.where({ user_name: user_name });
		q.findOne(function (err, user) {
			if (err) return handleError(err);
			if (user) {
				user.wins = 0;
				user.losses = 0;
				user.elo = 0;
				user.tau = 1;
				user.save(function (err, user) {
					if (err) return handleError(err);
					cb();
				});
			}
		});
	},
	getDuelGif: function(cb) {
		var gifs = [
			"http://i235.photobucket.com/albums/ee210/f4nt0mh43d/BadDuel.gif",
			"http://31.media.tumblr.com/99b8b1af381990801020079ae223a526/tumblr_mrbe6wQqR91sdds6qo1_500.gif",
			"http://stream1.gifsoup.com/view3/1147041/duel-dollars-ending-o.gif",
			"https://i.chzbgr.com/maxW500/5233508864/hC54C768C/",
			"http://global3.memecdn.com/it-amp-039-s-time-to-duel_o_1532701.jpg",
			"http://iambrony.dget.cc/mlp/gif/172595__UNOPT__safe_animated_trixie_spoiler-s03e05_magic-duel.gif",
			"https://i.chzbgr.com/maxW500/2148438784/h7857A12F/",
			"https://i.chzbgr.com/maxW500/3841869568/h2814E598/",
			"http://24.media.tumblr.com/4e71f3df088eefed3d08ce4ce34e8d62/tumblr_mhyjqdJZ1g1s3r24zo1_500.gif"
		]
		var rand = gifs[Math.floor(Math.random() * gifs.length)];
		cb(rand);
	}
};

pong.init();

app.post('/', function(req, res){
		console.log("Got a post from " + req.body.user_name);
		var hook = req.body;
		if(hook) {
			var params = hook.text.split(" ");
			var command = params[1];
			switch(command) {
			case "register":
					var message = "";
					pong.findPlayer(hook.user_name, function(user) {
						if (user) {
							message = "You've already registered!";
						} else if (user === false) {
							pong.registerPlayer(hook.user_name);
							message = "Successfully registered! Welcome to the system, " + hook.user_name + ".";
						}
						res.json({text: message});
					});
					break;
			case "challenge":
					var message = "";
					// check if registered
					pong.findPlayer(hook.user_name, function(user) {
						if (user) {
							if (params[2] == "doubles")  {
								pong.findDoublesPlayers(params[3], params[5], params[6], function(m) {
									if (m === true) {
										pong.createDoubleChallenge(hook.user_name, params[3], params[5], params[6], function(m) {
											pong.getDuelGif( function(gif) {
												var responder = m + " " + gif;
												res.json({text: responder});
											});
										});
									} else {
										res.json({text: m});
									}
								});
							} else if (params[2] == "single") {
								pong.findPlayer(params[3], function(user) {
									if (user) {
										pong.createSingleChallenge(hook.user_name, params[3], function(m) {
											pong.getDuelGif( function(gif) {
												var responder = m + " " + gif;
												res.json({text: responder});
											});
										});
									} else {
										message = "Could not find a player with that name. Have they registered?";
										res.json({text: message});
									}
								});
							} else {
								message = "Invalid params. 'pongbot challenge _<single|doubles> <opponent|teammate>_ against _<opponent> <opponent>_ '";
								res.json({text: message});
							}
						} else if (user === false) {
							message = "You're not registered! Use the command 'pongbot register' to get into the system.";
							res.json({text: message});
						}
					});
					break;
			case "accept":
					pong.acceptChallenge(hook.user_name, function(message) {
						res.json({text: message});
					});
					break;
			case "decline":
					pong.declineChallenge(hook.user_name, function(message) {
						res.json({text: message});
					});
					break;
			case "lost":
					pong.findPlayer(hook.user_name, function(user) {
						if (user) {
							pong.lose(hook.user_name, function(m) {
								res.json({text: m});
							});
						} else if (user === false) {
							message = "You're not registered! Use the command 'pongbot register' to get into the system.";
							res.json({text: message});
						}
					});
					break;
			case "won":
					res.json({text: "Only the player/team that lost can record the game."});
					break;
			case "rank":
					var message = "";
					var usertosearch = params[2] || hook.user_name;
					pong.findPlayer(usertosearch, function(user){
						if (user) {
							message = user.user_name + ": " + user.wins + " wins, " + user.losses + " losses. Elo: " + user.elo * 10;
						} else if (user === false) {
							message = "Could not find a player with that name. Have they registered?"
						}
						res.json({text: message});
					});
					break;
			case "leaderboard":
					var message = "";
					res.json({text: "Use /leaderboard to access the leaderboards."})
					break;
			case "reset":
					var message = "";
					if (hook.user_name === "vy") {
						pong.findPlayer(params[2], function(user) {
							if (user) {
								pong.reset(params[2], function() {
									message = params[2] + "'s stats have been reset.";
									res.json({text: message});
								});
							} else if (user === false) {
								message = "You're not registered! Use the command 'pongbot register' to get into the system.";
								res.json({text: message});
							}
						});
					} else {
						message = "You do not have admin rights.";
						res.json({text: message});
					}
					break;
			case "source":
					res.json({text: "https://github.com/andrewvy/opal-pongbot"});
					break;
			case "help":
					res.json({text: "https://github.com/andrewvy/opal-pongbot"});
					break;
			default:
					res.json({text: "I couldn't understand that command. Use 'pongbot help' to get a list of available commands."});
					break;
			}
		}
});

app.post('/commands', function(req, res){
	console.log("Got a post from " + req.body.user_name);
			switch(req.body.command) {
				case "/rank":
					var message = "";
					var usertosearch = req.body.text || req.body.user_name;
					pong.findPlayer(usertosearch, function(user){
						if (user) {
							message = user.user_name + ": " + user.wins + " wins, " + user.losses + " losses. Elo: " + user.elo * 10;
						} else if (user === false) {
							message = "Could not find a player with that name."
						}
						res.send(message);
					});
				break;
				case "/leaderboard":
					var message = "";
					Player.find({ "wins": { $gt: 3}}).sort({'elo': 'descending'}).find( function(err, players) {
						if (err) return handleError(err);
						for (var i=0;i<players.length;i++) {
								console.log(message);
								var actual = i + 1;
								message = message + actual + ") " + players[i].user_name + ": " + players[i].wins + "-" + players[i].losses + " Elo: " + players[i].elo * 10 + "\n";
						}
						res.send(message);
					});
				break;
				case "/challenges":
					var message ="";
					Challenge.find({ "state": "Proposed"}).sort({'date': 'desc'}).find( function(err, challenges) {
						if(err) return handleError(err);
						for (var i=0;i<challenges.length;i++) {
							var actual = i + 1;
							if (challenges[i].type == "Singles") {
								message = message + actual + ") " + challenges[i].challenger[0] + " challenged " + challenges[i].challenged[0] + " on " + challenges[i].created_at + "\n";
							} else {
								message = message + actual + ") " + challenges[i].challenger[0] + " and " + challenges[i].challenger[1] + " challenged " + challenges[i].challenged[0] + " and " + challenges[i].challenged[1] + " on " + challenges[i].created_at + "\n";
							}
						}
						res.send(message);
					});
				break;

			}
});

app.get('/api/rankings', function(req, res) {
	Player.find({}).sort({'elo': 'descending'}).find( function(err, players) {
		if (err) return handleError(err);
		res.json(players);
	});
});

app.get('/api/matches', function(req, res) {
	Challenge.find({}).sort({'date': 'desc'}).limit(10).find( function(err, challenges) {
		if (err) return handleError(err);
		res.json(challenges);
	});
});

app.listen(process.env.PORT || 3000);
console.log("Listening on port 3000!");
