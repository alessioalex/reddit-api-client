'use strict';

const chalk = require('chalk');
const RedditClient = require('../');
const {
  redditKey, redditSecret, redditUser, redditPass, redditUserAgent
} = require('./credentials.json');

const BR = (c) => new Array(process.stdout.columns).join(c);

const formatThread = (thread) => {
    // title, permalink, url, selftext
    return `➜  ${chalk.green(thread.title)}
${BR('-')}
${chalk.italic(thread.url.includes(thread.permalink) ? thread.permalink : thread.url)}
${thread.selftext ? '\n' + thread.selftext + '\n' : ''}${BR('=')}`;
};

const formatComment = (c) => {
  return `➜  ${chalk.bold(c.data.author)}: ${c.data.body}\n${BR('-')}`;
};

module.exports = {
  redditClient: new RedditClient({
    redditKey, redditSecret, redditUser, redditUserAgent,
    // password originally stored as base64
    redditPass: new Buffer(redditPass, 'base64').toString('utf8')
  }),
  formatThread,
  formatComment
};
