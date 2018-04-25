'use strict';

const { redditClient, formatComment } = require('./');
const commentStream = require('./lib/stream-top-level-cmts');
const chalk = require('chalk');

let items = 0;

// https://www.reddit.com/dev/api/#GET_comments_{article}
// https://www.reddit.com/dev/api/#GET_api_morechildren

const sub = process.env.SUB || 'soccer';
const id = process.env.ID || '8enji7';

commentStream({ r: redditClient, sub, id })
  .on('data', (children) => {
    items += children.length;

    children.forEach(c => {
      console.log(formatComment({ data: c }));
    });
  })
  .on('end', () => {
    console.log(`\nItems retrieved: ${items}`);
  });

