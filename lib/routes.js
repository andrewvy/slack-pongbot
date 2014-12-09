var Player = require('../models/Player');
var Challenge = require('../models/Challenge');
var pong = require('./pong');

module.exports.index = function(req, res) {
	var hook = req.body;
	if (hook) {
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
							} else if (params[2] == "single" || params[2] == "singles") {
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
								message = "Invalid params. 'pongbot challenge _<singles|doubles> <opponent|teammate>_ against _<opponent> <opponent>_ '";
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
						message = user.user_name + ": " + user.wins + " wins, " + user.losses + " losses. Elo: " + user.elo;
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
			case "hug":
				var message = "No."
				res.json({text: message});
			break;
			case "sucks":
				var message = "No, you suck."
				res.json({text: message});
			break;
			default:
				res.json({text: "I couldn't understand that command. Use 'pongbot help' to get a list of available commands."});
			break;
		}
	}
};

module.exports.commands = function(req, res) {
	console.log("Got a post from " + req.body.user_name);
	switch(req.body.command) {
		case "/rank":
			var message = "";
			var usertosearch = req.body.text || req.body.user_name;
			pong.findPlayer(usertosearch, function(user){
				if (user) {
					message = user.user_name + ": " + user.wins + " wins, " + user.losses + " losses. Elo: " + user.elo;
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
					message = message + actual + ") " + players[i].user_name + ": " + players[i].wins + "-" + players[i].losses + " Elo: " + players[i].elo + "\n";
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
					if (challenges[i].type == "Single") {
						message = message + actual + ") " + challenges[i].challenger[0] + " challenged " + challenges[i].challenged[0] + " on " + challenges[i].date + "\n";
				} else {
					message = message + actual + ") " + challenges[i].challenger[0] + " and " + challenges[i].challenger[1] + " challenged " + challenges[i].challenged[0] + " and " + challenges[i].challenged[1] + " on " + challenges[i].date + "\n";
				}
			}
			res.send(message);
			});
		break;

	}
}