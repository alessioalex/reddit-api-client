'use strict';

const { redditClient, formatComment } = require('./');
const chalk = require('chalk');

// https://www.reddit.com/dev/api/#GET_comments_{article}
redditClient.get('/r/soccer/comments/8d33ky', {
  query: {
    limit: 300,
    depth: 0,
    raw_json: 1
  }
}, (err, res) => {
  if (err) { throw err; }

  console.log();

  res.body.forEach(c => {
    const { data } = c;
    const { children } = data;

    const comments = children.filter(c => c.kind === 't1');
    if (!comments.length) { return; }

    console.log(comments.map(formatComment).join('\n'));
  });
});

