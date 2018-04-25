'use strict';

const { PassThrough } = require('stream');
const errTo = require('errto');

const getComments = (r, { sub, id }, cb) => {
  r.get(`/r/${sub}/comments/${id}`, {
    query: {
      limit: 100,
      depth: 1
    }
  }, errTo(cb, (res) => {
    cb(null, res.body.map(t => t.data).map(t => t.children).reduce((acc, c) => {
      return acc.concat(c);
    }, []));
  }));
};

const getTopLevelCmts = (items) => {
  return items
    .filter(t => t.kind === 't1') // comments
    .filter(t => /t3/.test(t.data.parent_id)) // top level comments
    .map(t => t.data);
};

const filterMoreItem = (items) => {
  // only interested in replies to the main post, not replies to comments
  let more = items.find(t => t.kind === 'more' && /t3/.test(t.data.parent_id));

  return more ? more.data : null;
};

module.exports = ({ r, sub, id }) => {
  const stream = new PassThrough({
    readableObjectMode: true,
    writableObjectMode: true
  });

  const fail = (err) => stream.destroy(err);
  const write = (items) => stream.write(items);
  const getMoreOrEnd = (more) => more ? getMore(r, more) : stream.end();

  getComments(r, { sub, id }, errTo(fail, (items) => {
    write(getTopLevelCmts(items));

    getMoreOrEnd(filterMoreItem(items));
  }));


  const getMore = (r, { children, id, parent_id }) => {
    const query = {
      limit: 100,
      api_type: 'json',
      id,
      link_id: parent_id,
      children: children.join(','),
      limit_children: false
    };

    r.get('/api/morechildren', { query }, errTo(fail, (res) => {
      write(getTopLevelCmts(res.body.json.data.things));

      getMoreOrEnd(filterMoreItem(res.body.json.data.things));
    }));
  };

  return stream;
};
