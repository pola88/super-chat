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

wss.on("connection", function(ws) {
  // var current_user;

  console.log("websocket connection open")
  clients.forEach(function(client) {
    ws.send(client.user);
  });

  clients.push(ws);

  ws.on('message', function(msg) {
    var data = JSON.parse(msg);

    sendToAllUsers(msg);

    if(data.action === 'new') {
      ws.user = msg;
    } else if(data.action === 'delete') {
      console.log(data.userName);
    }

  });

  ws.on("close", function(evt) {
    var current_user = ws.user;
    var removeIndex;

    clients.forEach(function(client, index) {
      if(client.user === current_user) {
        removeIndex = index;
        return;
      }
    });

    clients.splice(removeIndex,1);
    var data = JSON.parse(current_user);

    data.action = 'delete';

    sendToAllUsers(JSON.stringify(data));
    // console.log(current_user);
    console.log("websocket connection close")
    // clearInterval(id)
  })
});


function sendToAllUsers (msg) {
  clients.forEach(function(client) {
    client.send(msg, function() {});
  });
}
