'use strict';

const net = require('net');
const uniqueID = require('./idGenerator.js');

const clients = [];

const server = net.createServer();

server.on('connection', (socket) => {
  socket.id = uniqueID();

  socket.on('end', () => {
    console.log('socket end');
  });

  socket.on('close', () => {
    console.log('socket close');
  });

  socket.on('error', (e) => {
    if (e.code === 'ECONNRESET') {
      return;
    }
    console.log(e);
  });

  clients.push(socket);

});

server.on('error', (e) => {
  console.log(e);
});

server.listen(8000);
