# API

The Pongbot Hypermedia API provides access to players and challenges. Explore the API from the root.

```json
{
  version: "0.9.0",
  _links: {
    self: {
      href: "http://localhost:3000/"
    },
    players: {
      href: "http://localhost:3000/players"
    },
    challenges: {
      href: "http://localhost:3000/challenges"
    }
  }
}
```

### Players

Returns a collection of players.

### Challenges

Returns a collection of challenges.

## Pagination

Use `size` to limit the number of items returned and `anchor` to paginate through large collections.

