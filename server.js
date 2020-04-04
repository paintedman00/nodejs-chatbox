const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io')

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const formatMessage = require('./utils/messages')
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')



app.use(express.static(path.join(__dirname, 'public')))

const botName = 'ChatBox Bot'

// Run when a user connect 
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room)

    // Welcome the logged in user
    socket.emit('message', formatMessage(botName, 'Welcome to ChatBox'));

    // Broadcast when a user connects
    socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the Room`));

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });

  })


  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id)

    io.to(user.room).emit('message', formatMessage(user.username, msg))
  })

  // Run when user disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id)

    if (user) {
      io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the Room`))

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });

    }


  })

});


const PORT = 4000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server is running on ${PORT}`))