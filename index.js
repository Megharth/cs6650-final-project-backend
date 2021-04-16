const {serverInit} = require('./server');
const {socketInit} = require('./socketServer');
const serverPort = 8000;
const socketPort = 8080;

serverInit(serverPort);
socketInit(socketPort);