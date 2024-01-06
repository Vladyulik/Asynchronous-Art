'use strict';

const fs = require('fs');
const net = require('net');
const uniqueID = require('./idGenerator.js');

const clients = [];
const rooms = [];

const server = net.createServer();

server.on('connection', (socket) => {

  socket.id = uniqueID();

  socket.on('end', () => {
    console.log('socket end');
  });

  socket.on('close', () => {
    console.log('socket close');
    removeClient(socket);
  });

  socket.on('error', (e) => {
    if (e.code === 'ECONNRESET') {
      return;
    }
    console.log(e);
  });

  const client = {
    socket,
    inGame: false
  };

  clients.push(client);

  if (clients.length === 1) {
    console.log('The first player connected. Creating room in 10 seconds...');
    setTimeout(() => createRoom(), 10000);
  }

});

server.on('error', (e) => {
  console.log(e);
});

async function createRoom() {
  console.log('Creating room for active players not in the game...');
  const availablePlayers = clients.filter((client) => !client.inGame);

  const room = {
    players: availablePlayers,
    status: true,
    wordList: [],
    time: 60000
  };

  rooms.push(room);

  startGame(room);
}

async function startGame(room) {
  console.log('Starting the game...');

  for (const client of clients) {
    client.inGame = true;
  }

  const stream = fs.createReadStream('DiscourseOnMethod.txt', 'utf8');

  let buffer = '';

  stream.on('data', (chunk) => {
    buffer += chunk;
    const words = buffer.split(/\s+/);
    buffer = words.pop();
    room.wordList.push(...words);
  });

  stream.on('end', () => {
    if (buffer) {
      room.wordList.push(buffer);
    }
  });

  stream.on('error', (err) => {
    console.error('Error reading the text file:', err);
    process.exit(1);
  });

  function sendNextWord() {
    if (room.wordList.length > 0) {
      const word = room.wordList.shift();
      broadcast(`Next word: ${word}`);
      setTimeout(sendNextWord, 5000);
    } else {
      setTimeout(() => {
        if (room.wordList.length === 0) {
          finishGame();
        }
      }, 1000);
    }
  }

  sendNextWord();
}

function broadcast(message) {
  for (const client of clients) {
    client.socket.write(`${message}\n`);
  }
}

function finishGame() {
  console.log('Game finished');
}

function removeClient(socket) {
  const index = clients.indexOf(socket);
  if (index !== -1) {
    clients.splice(index, 1);
  }
}

server.listen(8000);
