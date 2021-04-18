const socketInit = async (port, users) => {
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

    io.on('connection', (socket) => {
        console.log(`-- New user connected: ${socket.email}`);
        socket.join(socket.email);
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

        socket.on('message', ({message, to}) => {
            socket.to(to).emit('message', {
                message,
                from: socket.email,
            })
        })
    });    
}

module.exports = {socketInit};