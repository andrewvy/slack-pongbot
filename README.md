# Pongbot
Slack Bot for Ping Pong tracking.

[![Build Status](https://travis-ci.org/andrewvy/slack-pongbot.svg)](https://travis-ci.org/andrewvy/slack-pongbot)

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

# Installation

Deploy with your preferred solution, eg. with [Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs).

Administrative commands require the `ADMIN_SECRET` environment to be set.

```
heroku config:add ADMIN_SECRET=secret
```

Visit `https://yourteamname.slack.com/services/new` and choose "Outgoing WebHooks." Choose which channels you would like pongbot active in, a trigger word with `pongbot`, and the url that you deployed to.

# Using Pongbot:

Make sure you're registered with pongbot.

```
pongbot register
```

Challenge someone, or a team.

Singles:


```
pongbot challenge singles <opponent's name>
```

Doubles:

```
pongbot challenge doubles <teammate's name> against <opponent_1> <opponent_2>
```

Let them run this, to accept the challenge. Only one other person (teammate or opponent) needs to accept to confirm the challenge.

```
pongbot accept
```

If you can't play now, `pongbot decline`.

Game On!

Record the match. Only the person/team that lost can record, it'll automatically change everyone's scores/rankings.

```
pongbot lost
```

# Other commands

* `pongbot decline` - Decline's any proposed match.
* `pongbot leaderboard <1-infinity>` - Shows the top players, sorted by Elo.
* `pongbot rank <someone's name>` - Gets that person's stats. If none given, it will return your own stats.
* `pongbot source` - Get's Pongbot's Github repository.
* `pongbot reset <name> <secret>` - Admin-only command that reset's a person's stats.
* `pongbot new_season <secret>` - Admin-only command that reset's all stats and begins a new season.

# API

### Endpoints:

## /api/rankings

```
GET /api/rankings
```

Returns an array of all player objects, sorted by elo.

```
{ user_name: String, wins: Number, losses: Number, elo: Number, _id: ObjectId }
```

Example:

```json
[
  {
    "user_name": "foo",
    "wins": 0,
    "losses": 0,
    "elo": 1000,
    "_id": "53adf57837567d3535d5d5d7",
    "__v": 0
  },
  {
    "user_name": "bar",
    "wins": 1,
    "losses": 0,
    "elo": 1000,
    "_id": "53adf7074cf27d7135e4a999",
    "__v": 0
  },
  {
    "user_name": "baz",
    "wins": 0,
    "losses": 0,
    "elo": 1000,
    "_id": "53b1afef013005ad444723f6",
    "__v": 0
  }
]
```

## /api/matches

```
GET /api/matches
```

Returns the last 10 matches, ordered by date.

```json
[
  {
    "state": "Accepted",
    "type": "Single",
    "date": "2014-06-30T19:51:05.995Z",
    "_id": "53b1bfa98cbfa893455cf920",
    "__v": 0,
    "challenged": [
      "testbot"
    ],
    "challenger": [
      "vy"
    ]
  },
  {
    "state": "Accepted",
    "type": "Single",
    "date": "2014-06-30T20:02:18.015Z",
    "_id": "53b1c24acb726ded45be4927",
    "__v": 0,
    "challenged": [
      "test"
    ],
    "challenger": [
      "vy"
    ]
  }
]
```
