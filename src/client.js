'use strict';

const net = require('net');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const client = new net.Socket();

client.connect(8000, 'localhost', () => {
  console.log('Connected to the server.');

  rl.on('line', (input) => {
    client.write(input);
  });

  client.on('data', (data) => {
    console.log(data.toString());
  });

  client.on('close', () => {
    console.log('Connection closed.');
    process.exit(0);
  });
});

client.on('error', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
