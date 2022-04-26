var socket = io();

var messages = document.getElementById('messages');
var sendmessage = document.getElementById('send-message-form');
var input = document.getElementById('message-input');
var login = document.getElementById('login-form');
var username = document.getElementById('username');
var color = document.getElementById('color');
var peers = document.getElementById('peers');

var myusername = "";
var peersArray = [];

// Handle user joining
login.addEventListener('submit', function(e) {
    e.preventDefault();

    // Test for empty string
    if (color.value.length == 0) {
        socket.emit('join', username.value, color.value);
    }
    // Test format
    else {
        var hex = /^#([0-9a-f]{3}){1,2}$/i;
        if (hex.test(color.value))
            socket.emit('join', username.value, color.value);
        else {
            document.getElementById("error-label").textContent = "Color not valid";
        }
    } 
});


// Handle send chat messages
sendmessage.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', input.value);
        input.value = '';
    };
});


// Handle join approval
socket.on('approve join', function(username) {

    myusername = username;

    document.getElementsByClassName("login-border-wrap")[0].style.display = "none";
    document.getElementsByClassName("login-window")[0].style.display = "none";
    document.getElementById("message-input").disabled = false;
    document.getElementById("send-btn").disabled = false;
});

// Handle approval declined
socket.on('decline join', function(reason) {

    if (reason == "not unique")
        document.getElementById("error-label").textContent = "Username needs to be unqiue";
    else if (reason == "too short")
        document.getElementById("error-label").textContent = "Username needs to be longer";
    else if (reason == "too long")
        document.getElementById("error-label").textContent = "Username needs to be shorter";
    else
        document.getElementById("error-label").textContent = "The username is invalid";
});


// Handle received chat messages
socket.on('chat message', function(user, color, time, msg) {

    // Username
    var messageUsername = document.createElement('span');
    messageUsername.textContent = user;
    messageUsername.classList.add("username");
    messageUsername.style.color = color;

    if (user == myusername) {
        messageUsername.style.fontWeight = "bolder";
    }

    // Timestamp
    var messageTimestamp = document.createElement('span');
    messageTimestamp.textContent = time;
    messageTimestamp.classList.add("timestamp");

    // Header = Username + Timestamp
    var messageHeader = document.createElement('div');
    messageHeader.appendChild(messageUsername);
    messageHeader.appendChild(messageTimestamp);
    messageHeader.classList.add("message-header");

    // Message
    var messageText = document.createElement('span');
    messageText.textContent = msg;

    // Item = Header + msg
    var item = document.createElement('li');
    item.appendChild(messageHeader);
    item.appendChild(messageText);

    messages.append(item);
    document.getElementById("messages").scrollTo(0, document.getElementById("messages").scrollHeight);
});


// Handle rename declined
socket.on('decline rename', function(reason) {

    // Message
    var messageText = document.createElement('span');
    messageText.textContent = "Rename declined. Reason given: "+reason;

    // Item = Header + msg
    var item = document.createElement('li');
    item.appendChild(messageText);
    item.classList.add("server-message");

    messages.append(item);
    document.getElementById("messages").scrollTo(0, document.getElementById("messages").scrollHeight);
});


// Handle name change message
socket.on('name change', function(userOld, userNew, color, time) {
    // Add to online list
    const index = peersArray.indexOf(userOld);
    peersArray[index] = userNew;
    updateUsers();

    if (myusername == userOld) myusername = userNew;

    var item = document.createElement('li');
    item.classList.add("server-message");
    item.textContent = userOld+" is now "+userNew;
    item.style.color = color;

    messages.append(item);
    document.getElementById("messages").scrollTo(0, document.getElementById("messages").scrollHeight);
});


// Handle rename declined
socket.on('approve newcolor', () => {

    // Message
    var messageText = document.createElement('span');
    messageText.textContent = "Your color been changed.";

    // Item = Header + msg
    var item = document.createElement('li');
    item.appendChild(messageText);
    item.classList.add("server-message");

    messages.append(item);
    document.getElementById("messages").scrollTo(0, document.getElementById("messages").scrollHeight);
});

// Handle decline newcolor
socket.on('decline newcolor', function(reason) {

    // Message
    var messageText = document.createElement('span');
    messageText.textContent = "New color declined. Reason given: "+reason;

    // Item = Header + msg
    var item = document.createElement('li');
    item.appendChild(messageText);
    item.classList.add("server-message");

    messages.append(item);
    document.getElementById("messages").scrollTo(0, document.getElementById("messages").scrollHeight);
});

// Handle user joined
socket.on('user joined', function(user, color, time) {
    // Add to online list
    peersArray.push(user);
    updateUsers();

    var item = document.createElement('li');
    item.classList.add("server-message");
    item.textContent = user + " has joined! ("+time+")";
    item.style.color = color;

    if (user == myusername) {
        item.style.fontWeight = "bolder";
    }

    messages.append(item);
    document.getElementById("messages").scrollTo(0, document.getElementById("messages").scrollHeight);
});


// Handle user left
socket.on('user left', function(user, color, time) {
    // Remove from online list
    const index = peersArray.indexOf(user);
    if (index > -1) {
      peersArray.splice(index, 1);
    }
    updateUsers();

    var item = document.createElement('li');
    item.classList.add("server-message");
    item.textContent = user + " has left. ("+time+")";
    item.style.color = color;

    messages.append(item);
    document.getElementById("messages").scrollTo(0, document.getElementById("messages").scrollHeight);
});


// Update list displayed of online users to reflect what is stored
function updateUsers () {
    peers = document.getElementById('peers');
    peers.innerHTML = "";

    peersArray.forEach( (peer) => {
        let item = document.createElement('li');
        item.textContent = peer;
        peers.append(item)
    });
}