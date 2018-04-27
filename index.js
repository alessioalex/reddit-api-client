'use strict';

const { PassThrough } = require('stream');
const qs = require('querystring');
const request = require('superagent');
const Throttle = require('superagent-throttle');

module.exports = class RedditClient {
  constructor(opts) {
    [
      'redditKey', 'redditSecret', 'redditUser', 'redditPass', 'redditUserAgent'
    ].forEach(p => {
      if (!(p in opts)) {
        throw new Error(`${p} missing from RedditClient options`);
      }

      this[`_${p}`] = opts[p];
    });


    this._defaultEndpoint = 'https://www.reddit.com';
    this._oauthEndpoint = 'https://oauth.reddit.com';
    this._tokenRetries = 0;
    this._maxRetries = 5;
    this._defaultQueryOpts = {
      limit: 100,
      raw_json: 1
    };

    this._token = '';
    this._throttle = null;

    this._setThrottle();
    this._constructMethods();
  }

  // set a hard limit of 60 requests per second
  _setThrottle() {
    const throttleOpts = {
      active: true,
      rate: 60,
      ratePer: 60 * 1000, // 60 requests per minute
      concurrent: 2
    };

    this._throttle = new Throttle(throttleOpts);
  }

  _getToken(forceReload, cb) {
    if (!forceReload && this._token) {
      return cb();
    }

    request
      .post(`${this._defaultEndpoint}/api/v1/access_token`)
      .auth(this._redditKey, this._redditSecret)
      .type('application/x-www-form-urlencoded')
      .send(qs.stringify({
        'grant_type': 'password',
        'username': this._redditUser,
        'password': this._redditPass
      }))
      .set('User-Agent', this._redditUserAgent)
      .set('accept', 'json')
      .end((err, res) => {
        if (err) { return cb(err); }

        this._token = res.body.access_token;
        cb();
      });
  }

  _shouldRetryToken(res) {
    this._tokenRetries++;

    if (this._tokenRetries >= this._maxRetries) {
      return false;
    }

    const authHeader = res.headers['www-authenticate'];
    return authHeader && /invalid_token/ig.test(authHeader);
  }

  _constructMethods() {
    ['get', 'post', 'put', 'del'].forEach(method => {
      this[method] = (url, opts = {}, cb) => {
        this._getToken(false, (err) => {
          if (err) { return cb(err); }

          let r = request[method](`${this._oauthEndpoint}${url}`)
            .auth(this._token, { type: 'bearer' })
            .set('User-Agent', this._redditUserAgent)
            .set('accept', 'json');

          if (this._throttle) {
            r.use(this._throttle.plugin());
          }

          if (method !== 'get') {
            r = r.type('application/x-www-form-urlencoded')

            if (opts.payload) {
              r = r.send(qs.stringify(opts.payload));
            }
          }

          if (method === 'get' || opts.query) {
            r = r.query(opts.query ? Object.assign(this._defaultQueryOpts, opts.query)
                                   : this._defaultQueryOpts);
          }

          r.end((err, res) => {
            // retrying in case of expired token (after 1h)
            // TODO: queue concurrent token requests
            if (err && this._shouldRetryToken(res)) {
              this._token = '';

              return this[method](url, opts, cb);
            }

            this._tokenRetries = 0;

            cb(err, res);
          });
        });
      };
    });
  }

  stream(url, opts = {}) {
    const listStream = new PassThrough({
      readableObjectMode: true,
      writableObjectMode: true
    });

    let requestsMade = 0;
    let maxRequests = opts.maxRequests || 0;
    opts.query = opts.query || this._defaultQueryOpts;

    const next = (retries = 0) => {
      this.get(url, opts, (err, res) => {
        if (err && retries > this._maxRetries) {
          return listStream.destroy(err);
        } else if (err) {
          retries++;
          return next(retries);
        }

        opts.query.after = res.body.data.after;

        listStream.write(res.body.data.children);
        requestsMade++;

        if (!opts.query.after || (maxRequests && requestsMade >= maxRequests)) {
          listStream.end();
        } else {
          next();
        }
      });
    };

    setImmediate(next.bind(null, 0));

    return listStream;
  }

};
