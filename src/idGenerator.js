'use strict';

function uniqueID() {
  const id = Math.floor(Math.random() * Math.floor(Math.random() * Date.now()));
  return id;
}

module.exports = uniqueID;
