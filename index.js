const {serverInit} = require('./src/server');
const {socketInit} = require('./src/socketServer');
const User = require('./src/User');
const DB = require('./src/db');

const serverPort = 8000;
const socketPort = 8080;

const user = new User();
const db = new DB();
serverInit(serverPort, user, db);
socketInit(socketPort, user, db);