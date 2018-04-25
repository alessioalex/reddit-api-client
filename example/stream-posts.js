'use strict';

const { redditClient, formatThread } = require('./');
const chalk = require('chalk');

let items = 0;

// https://www.reddit.com/dev/api/#GET_subreddits_{where}
// Note: max 1000 items returned by the API :/
redditClient.stream('/r/node/new')
  .on('data', (children) => {
    items += children.length;

    children.forEach(c => {
      const { data } = c;

      console.log(formatThread(data));
    });
  })
  .on('end', () => {
    console.log(`\nItems retrieved: ${items}`);
  });

