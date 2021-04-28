const {serverInit} = require('./src/server');
const {socketInit} = require('./src/socketServer');
const RedisUserStore = require('./src/User');
const DB = require('./src/db');
const timesync = require('timesync/dist/timesync');
const ioredis = require('ioredis');

const redisClient = new ioredis();

const ports = [4000, 4020, 4040, 4060, 4080];

const serverPort = parseInt(process.argv[2]);
const socketPort = serverPort + 10;

const peers = ports.filter((port) => port !== serverPort).map(port => `http://localhost:${port}`);
    
const ts = timesync.create({
    peers: [],
    interval: 1000,
});

// console.log(ts);

ts.on('error', (err) => {
    const error = err.message.split(' ');
    if(error[1] === 'ECONNREFUSED'){
        const port = error[error.length-1].split(':')[1];
        const url = `http://localhost:${port}`;
        console.log('Peer disconnected:', url);
        ts.options.peers = ts.options.peers.filter(peer => peer !== url);
    }
});

const user = new RedisUserStore(redisClient);
const db = new DB();

serverInit(serverPort, user, db, peers, ts);
socketInit(socketPort, user, db, peers, ts, redisClient);