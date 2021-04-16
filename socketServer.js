const socketInit = async (port) => {
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
        const users = {};
        console.log(`-- New user connected: ${socket.email}`);
        for(let [id, socket] of io.of('/').sockets) {
            users[socket.email] = id;
        }
        socket.emit('users', users);
        socket.broadcast.emit('new connection', {email: socket.email, id: users[socket.email]});

        socket.on('disconnect', () => {
            console.log(`${socket.email} disconnected`);
            delete users[socket.email];
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