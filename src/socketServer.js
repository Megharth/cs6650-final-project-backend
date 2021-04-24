const { Db } = require('mongodb');

const socketInit = async (port, users, db) => {
    const io = require('socket.io')(port, {
        cors: {
            origin: '*'
        }
    });

    io.use((socket, next) => {
        const {email} = socket.handshake.auth
        if(!email)
            return next(new Error("Invalid email"))
        socket.email = email;
        next();
    });

    io.on('connection', async (socket) => {
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

        socket.emit('users', users);
        socket.broadcast.emit('new connection', {email: socket.email, id: users[socket.email]});

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

        ///// timesync in place on backend side ////
        socket.on('timesync', function (data) {
          //console.log('message', data);
          socket.emit('timesync', {
            // Change to month/date/year hour/min/sec date/time format
            time: Date.now()
          });
        });
        ///////////////////////////////////////////

    });
}

module.exports = {socketInit};
