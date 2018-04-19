'use strict';

const { redditClient, formatThread } = require('./');
const chalk = require('chalk');

// https://www.reddit.com/dev/api/#GET_subreddits_{where}
redditClient.get('/r/node/new', {
  query: {
    limit: 10
  }
}, (err, res) => {
  if (err) { throw err; }

  res.body.data.children.forEach(c => {
    const { data } = c;

    console.log(formatThread(data));
  });
});

