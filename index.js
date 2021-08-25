const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let users = {};
io.on('connection', (socket) => {
    socket.on('enter room', (nickname) => {
        users[socket.id] = nickname;
        msg = nickname + ' joined the room';
        socket.broadcast.emit('user connected', msg, {userId: socket.id, nickname: nickname});
        socket.emit('users', users);
    });

    socket.on('private message', ({message, to}) => {
        console.log(message, to);
        socket.to(to).emit('private message', {
            message,
            from: socket.id
        });
    })

    socket.on('chat message', (msg) => {
        io.emit('chat message', users[socket.id] + ': ' + msg);
    });

    socket.on('disconnect', () => {
        socket.broadcast.emit('user disconnected', users[socket.id] + ' left the room');

        delete users[socket.id];
        io.emit('update online users', socket.id);
    });

    socket.on('typing', () => {
        socket.broadcast.emit('typing', users[socket.id] + "'s typing");
    });

    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing');
    })
});

var port = process.env.PORT || 3000
server.listen(port, () => {
    console.log(`listening on *:${port}`);
})