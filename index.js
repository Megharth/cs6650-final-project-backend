const {serverInit} = require('./src/server');
const {socketInit} = require('./src/socketServer');
const User = require('./src/User');
const serverPort = 8000;
const socketPort = 8080;

const user = new User();
serverInit(serverPort, user);
socketInit(socketPort, user);