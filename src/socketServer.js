const fetch = require('node-fetch');
const redis = require('socket.io-redis');


const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
}

const socketInit = async (port, users, db, peers, ts, logs, redisClient) => {
    const socketOnConnection = async (socket) => {
        console.log(`-- New user connected: ${socket.email}`);
        const [user] = await db.findUsers({email: socket.email});
    
        socket.join(socket.email);
    
        if(user.chats) {
            const rooms = user.chats.filter(chat => chat.room)
            rooms.forEach(room => socket.join(room.email));
        }
    
        for(let [id, socket] of io.of('/').sockets) {
            users.addUser(socket.email);
        }

        users.getUsers();
    
        // let promises = {};
        // const pid = logs.getNextLogNum();
    
        // await asyncForEach(peers, async (peer) => {
        //     const response = await fetch(peer + '/propose', {
        //         method: 'POST',
        //         body: JSON.stringify({pid, port}),
        //         headers: {
        //             'Content-Type': 'Application/json'
        //         }
        //     });
        //     const body = await response.json();
        //     promises[peer] = body;
        // });
    
        // if(Object.values(promises).filter(promise => promise.status === 200).length > (peers.length/2 + 1)) {
        //     console.log('Consensus achieved. Going for Accept phase');
        //     await asyncForEach(peers, async(peer) => {
        //         const response = await fetch(peer + '/accept', {
        //             method: 'POST',
        //             body: JSON.stringify({pid, port}),
        //             headers: {
        //                 'Content-Type': 'Application/json'
        //             }
        //         });
        //         const body = await response.json();
        //         promises[peer] = body;
        //     });
    
        //     const logsData = Object.values(promises).filter(promise => promise.data !== logs.getLastLog())
        //     if(logsData.length > (peers.length/2 + 1)) {
        //         logs.addLogs(logsData[0]);
        //     }
    
        //     await asyncForEach(peers, async(peer) => {
        //         await fetch(peer + '/learn', {
        //             method: 'POST',
        //             body: JSON.stringify({
        //                 pid, 
        //                 port,
        //                 data: {
        //                     users: users.getUsers(),
        //                 }
        //             }),
        //             headers: {
        //                 'Content-Type': 'Application/json'
        //             }
        //         });
        //     });
        // }
    
        // socket.emit('users', users);
        // socket.broadcast.emit('new connection', {email: socket.email, id: users[socket.email]});
    
        socket.on('disconnect', () => {
            console.log(`${socket.email} disconnected`);
            // delete users[socket.email];
            users.removeUser(socket.email);
            socket.broadcast.emit('user disconnected', socket.email);
        });
    
        socket.on('message', async ({message, to}) => {
            await db.insertMessage(message);
    
            socket.to(to).emit('message', {
                message,
                from: socket.email,
            });
        });
    
        socket.on('groupMessage', async ({message, to}) => {
            await db.insertMessage(message);
            socket.to(to).emit('groupMessage', {
                message,
                from: to,
            });
        });
    
        socket.on('joinRoom', async({roomCode}) => {
            socket.join(roomCode);
        })
    
        ///// timesync in place on backend side ////
        socket.on('timesync', function (data) {
          //console.log('message', data);
            ts.sync();
            
            socket.emit('timesync', {
                // Change to month/date/year hour/min/sec date/time format
                time: ts.now()
            });
        });
    
        socket.on('register', ({peer}) => {
            console.log(`handshake successfull with peer ${peer}`);
        })
    
    }

    const io = require('socket.io')(port, {
        cors: {
            origin: '*'
        },
        adapter: redis({
            pubClient: redisClient,
            subClient: redisClient.duplicate(),
        })
    });

    console.log(`Listening for sockets on ${port}`)
    io.use((socket, next) => {
        const {email} = socket.handshake.auth
        if(!email)
            return next(new Error("Invalid email"))
        socket.email = email;
        next();
    });

    io.on('connection', socketOnConnection);
}

module.exports = {socketInit};
