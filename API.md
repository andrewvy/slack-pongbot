# API

### Endpoints:

## /api/players

```
GET /api/players
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

## /api/challenges

```
GET /api/challenges
```

Returns the last 10 challenges, ordered by date.

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
