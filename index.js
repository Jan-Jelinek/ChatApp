const { Console } = require('console');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = 3000;


const usernames = new Map(); // key = socket.id, value = username
const colors = new Map(); // key = socket.id, value = color hex value
var messagehistory = []; // Stores the message history

app.use(express.static(__dirname + '/public'));
app.get('/', (req, res) => {
  res.sendFile('index.html');
});

io.on('connection', (socket) => {
    console.log(`${socket.id} connected`);

    // Handle join requests
    socket.on('join', (username, color) => {
      
      if (username.length == 0) {
        let newusername = "User";
        let i = 1;
        while (!checkIfUsernameIsUnique(newusername)) {
           newusername = "User" + i;
           i++;
        }
        username = newusername;
      }

      // Check is username is unique
      // Add it to the map of users
      if (!checkIfUsernameIsUnique(username)) {
        io.to(socket.id).emit('decline join', 'not unique');
      } else if (username.length < 3) {
        io.to(socket.id).emit('decline join', 'too short');
      } else if (username.length > 16) {
        io.to(socket.id).emit('decline join', 'too long');
      }
      else {

        usernames.set(socket.id, username);

        // If no color choosen, set to black
        if (color.length == 0)
          colors.set(socket.id, "#000000")
        else
          colors.set(socket.id, color);
  
        io.to(socket.id).emit('approve join', username);

        // Send message history
        messagehistory.forEach((msg) => {
          if (msg.length == 4)
            io.to(socket.id).emit(msg[0], msg[1], msg[2], msg[3]);
          else
            io.to(socket.id).emit(msg[0], msg[1], msg[2], msg[3], msg[4]);
        });

        let d = new Date()
        io.emit('user joined', usernames.get(socket.id), colors.get(socket.id), d.toLocaleTimeString());
        messagehistory.push(['user joined', usernames.get(socket.id).toString(), colors.get(socket.id).toString(), d.toLocaleTimeString().toString()])
      }
    });

    // Handle chat messages
    socket.on('chat message', msg => handleChatMessage(socket, msg));

    // Handle user disconnects
    socket.on('disconnect', () => {
      console.log(`${socket.id} disconnected`);
      let d = new Date()
      if (usernames.get(socket.id) != null && usernames.get(socket.id) != undefined) {
        io.emit('user left', usernames.get(socket.id), colors.get(socket.id), d.toLocaleTimeString());
        messagehistory.push(['user left', usernames.get(socket.id), colors.get(socket.id), d.toLocaleTimeString()])
      }
    });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});


// Handles chat messages
function handleChatMessage(socket, msg) {

  // Check for commands
  let index = msg.indexOf(" ");
  if (index != -1) {
    let command = msg.substring(0, index);
    if (command == "/rename") {
      let name = msg.substring(index+1).trim();
      handleRename(socket, name);
      return;
    }
    else if (command == "/newcolor") {
      let color = msg.substring(index+1).trim();
      handleNewColor(socket, color);
      return;
    }
  }
  let d = new Date()
  io.emit('chat message', usernames.get(socket.id), colors.get(socket.id), d.toLocaleTimeString(), msg);
  messagehistory.push(['chat message', usernames.get(socket.id), colors.get(socket.id), d.toLocaleTimeString(), msg])
}

// Handles renaming request
function handleRename(socket, name) {

  // Check if username is between 3 and 16 characters
  if (!checkIfUsernameIsUnique(name)) {
    io.to(socket.id).emit('decline rename', 'not unique');
  } else if (name.length < 3) {
    io.to(socket.id).emit('decline rename', 'too short');
  } else if (name.length > 16) {
    io.to(socket.id).emit('decline rename', 'too long');
  }
  else {
    let d = new Date()
    io.emit('name change', usernames.get(socket.id), name, colors.get(socket.id), d.toLocaleTimeString());
    messagehistory.push(['name change', usernames.get(socket.id), name, colors.get(socket.id), d.toLocaleTimeString()])
    usernames.set(socket.id, name);
  }
}

// Handles new color request
function handleNewColor(socket, newcolor) {

  let hex = /^#([0-9a-f]{3}){1,2}$/i;
  if (hex.test(newcolor)) {
    io.to(socket.id).emit('approve newcolor');
    colors.set(socket.id, newcolor);
  }
  else {
    io.to(socket.id).emit('decline newcolor', 'invalid format');
  }
}

// Checks if username exists in usernames map
function checkIfUsernameIsUnique(username) {
  let unique = true
  usernames.forEach(function(value, key) {
    if (username == value) {
      unique = false;
    }
  });
  return unique;
}