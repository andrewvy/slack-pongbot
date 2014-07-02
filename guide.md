## Pongbot 0.9

#Quickstart guide:

1) Make sure you're registered with pongbot.

```
Run "pongbot register".
```

2) Challenge someone, or a team.

If singles:


```
pongbot challenge single <opponent's name>
```

If doubles:

```
pongbot challenge double <teammate's name> against <opponent_1> <opponent_2>
```

3) Let them run this, to accept the challenge. Only one other person (teammate or opponent) needs to accept to confirm the challenge.

```
pongbot accept
```

4) Game on!

5) Record the match. Only one person from the match needs to record the match, it'll automatically change everyone's scores/rankings.

If you've won.

```
pongbot won
```

If you've lost.
```
pongbot lost
```


#Other commands
```
pongbot decline - Decline's any proposed match.
pongbot rank <someone's name> - Gets that person's stats. If none given, it will return your own stats.
pongbot source - Get's Pongbot's current source file.
pongbot reset <name> - Admin-only command that reset's a person's stats.
```
#API

API Server: andrewvy.com:3000

###Endpoints:

##/api/rankings
```
GET /api/rankings

Returns an array of all player objects, sorted by elo.

{user_name: String, wins: Number, losses: Number, elo: Number, _id: ObjectId}

Example:

[
  {
    "user_name": "brandon",
    "wins": 0,
    "losses": 0,
    "elo": 1000,
    "_id": "53adf57837567d3535d5d5d7",
    "__v": 0
  },
  {
    "user_name": "mcpants",
    "wins": 1,
    "losses": 0,
    "elo": 1000,
    "_id": "53adf7074cf27d7135e4a999",
    "__v": 0
  },
  {
    "user_name": "boek",
    "wins": 0,
    "losses": 0,
    "elo": 1000,
    "_id": "53b1afef013005ad444723f6",
    "__v": 0
  }
]
```

##/api/matches

```
GET /api/matches

Returns the last 10 matches, ordered by date.

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
