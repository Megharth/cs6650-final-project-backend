const {serverInit} = require('./src/server');
const {socketInit} = require('./src/socketServer');
const User = require('./src/User');
const DB = require('./src/db');
const timesync = require('timesync/dist/timesync');

const ports = [4000, 4020, 4040, 4060, 4080];

const serverPort = parseInt(process.argv[2]);
const socketPort = serverPort + 10;

const ts = timesync.create({
    peers: ports.filter((port) => port !== serverPort).map(port => `http://localhost:${port}`),
    interval: 1000,
});

ts.on('error', (err) => {
    const error = err.message.split(' ');
    if(error[1] === 'ECONNREFUSED'){
        const port = error[error.length-1].split(':')[1];
        const url = `http://localhost:${port}`;
        console.log('Peer disconnected:', url);
        ts.options.peers = ts.options.peers.filter(peer => peer !== url);
    }
})
const user = new User();
const db = new DB();
serverInit(serverPort, user, db);
socketInit(socketPort, user, db, ts);