'use strict';

const fs = require('fs');
const net = require('net');
const uniqueID = require('./idGenerator.js');

class GameServer {
  constructor() {
    this.clients = [];
    this.rooms = [];
    this.server = net.createServer();

    this.server.on('connection', (socket) => this.handleConnection(socket));
    this.server.on('error', (e) => this.handleError(e));
  }

  handleConnection(socket) {
    socket.id = uniqueID();

    socket.on('end', () => {
      console.log('socket end');
    });

    socket.on('close', () => {
      console.log('socket close');
      this.removeClient(socket);
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

    this.clients.push(client);

    if (this.clients.length === 1) {
      console.log('The first player connected. Creating room in 10 seconds...');
      setTimeout(() => this.createRoom(), 10000);
    }
  }

  handleError(e) {
    console.log(e);
  }

  async createRoom() {
    console.log('Creating room for active players not in the game...');
    const availablePlayers = this.clients.filter((client) => !client.inGame);

    const room = {
      players: availablePlayers,
      status: true,
      wordList: [],
      time: 60000
    };

    this.rooms.push(room);

    this.startGame(room);
  }

  async startGame(room) {
    console.log('Starting the game...');

    for (const client of this.clients) {
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
        this.broadcast(room, `Next word: ${word}`);
        setTimeout(sendNextWord, 5000);
      } else {
        setTimeout(() => {
          room.wordList.length === 0 ? this.finishGame(room) : sendNextWord();
        }, 1000);
      }
    }

    sendNextWord.bind(this)();
  }

  broadcast(room, message) {
    for (const client of room.players) {
      client.socket.write(`${message}\n`);
    }
  }

  finishGame() {
    console.log('Game finished');
  }

  removeClient(socket) {
    const index = this.clients.findIndex((client) => client.socket === socket);
    if (index !== -1) {
      this.clients.splice(index, 1);
    }
  }

  listen(port, callback) {
    this.server.listen(port, callback);
  }
}

const gameServer = new GameServer();
gameServer.listen(8000, () => {
  console.log('Server listening on port 8000');
});
