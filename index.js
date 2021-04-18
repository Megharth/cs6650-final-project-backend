const {serverInit} = require('./server');
const {socketInit} = require('./socketServer');
const User = require('./User');
const serverPort = 8000;
const socketPort = 8080;

const user = new User();
serverInit(serverPort, user);
socketInit(socketPort, user);