var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000

app.use(express.static(__dirname + "/"))

var server = http.createServer(app)
server.listen(port)

console.log("http server listening on %d", port)

var wss = new WebSocketServer({server: server})
console.log("websocket server created")

var clients = [];
var latestMessages = [];

wss.on("connection", function(ws) {
  var currentUserToken;
  console.log("websocket connection open");

  clients.forEach(function(client) {
    ws.send(client.createUser);
  });

  clients.push(ws);

  latestMessages.forEach(function(msg) {
    ws.send(msg);
  });

  ws.on('message', function(msg) {
    var data = JSON.parse(msg);

    if(data.action === 'new') {
      ws.createUser = msg;
      ws.userToken = data.data.token;
      currentUserToken = ws.userToken;
    } else if (data.action === 'ping'){
      console.log('ping from: ' + ws.userToken)
      return;
    } else {
      addLastMessage(msg);
    }

    sendToAllUsers(msg, currentUserToken);
  });

  ws.on("close", function(evt) {
    var removeIndex;

    clients.forEach(function(client, index) {
      if(client.userToken === currentUserToken) {
        removeIndex = index;
        return;
      }
    });

    clients.splice(removeIndex,1);
    var data = JSON.parse(ws.createUser);

    data.action = 'delete';

    sendToAllUsers(JSON.stringify(data), currentUserToken);
    console.log("websocket connection close for " + currentUserToken);
  });
});


function sendToAllUsers (msg, userToken) {
  clients.forEach(function(client) {
    if(client.userToken !== userToken)
      client.send(msg, function() {});
  });
}

function addLastMessage(msg) {
  if(latestMessages.length >= 10) {
    latestMessages.splice(0,1);
  }

  latestMessages.push(msg);
}
