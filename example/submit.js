'use strict';

const { redditClient } = require('./');
const chalk = require('chalk');

// https://www.reddit.com/dev/api/#POST_api_submit
redditClient.post('/api/submit', {
  payload: {
    sr: 'test',
    title: 'This is just a test (title)',
    text: 'This is just a test (text)',
    kind: 'self',
    resubmit: true,
    send_replies: false,
    // really need to include this unless you want the response to be gibberish
    api_type: 'json'
  }
}, (err, res) => {
  if (err) { throw err; }

  const jsonResponse = res.body.json;
  const { errors } = jsonResponse;

  console.log('\n');

  if (!errors.length) {
    console.log(`➜  ${jsonResponse.data.url}`)
  } else {
    console.error(chalk.red('An error occured:\n'));
    console.error(chalk.bold(JSON.stringify(errors, null, 2)));
    process.exit(1);
  }
});

