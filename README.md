## reddit-api-client

Barebones Reddit API client for Node.js. Just pass in your credentials and make
requests yourself by passing the url and the params needed for the call.
`https://www.reddit.com/dev/api` is your friend, no classes and no sugar
included.

### usage

`npm i reddit-api-client`

```js
const RedditClient = require('reddit-api-client');
// insert real credentials below
const r = new RedditClient({
  "redditKey": "XXXXXXXXXXXXXX",
  "redditSecret": "YYYYYYYYYYYYYYYYYYYYYYYYYYY",
  "redditUser": "ZZZZZZZZZZZZZZ",
  "redditPass": "TTTTTTTTTTTTTTTTTTTT",
  "redditUserAgent": "QQQQQQQQQQQQQQ"
});

r.get('/r/node/new', {
  query: {
    limit: 10
  }
}, (err, res) => {
  if (err) { throw err; }

  res.body.data.children.forEach(c => {
    const { data } = c;

    console.log(data);
  });
});
```

Checkout the `/example` folders for more examples and advanced usage. Read
the source code as well (100ish LOC).

### alternatives

If you want a fully-featured JavaScript wrapper for the reddit API use https://github.com/not-an-aardvark/snoowrap instead.

### license MIT

https://alessioalex.mit-license.org/
