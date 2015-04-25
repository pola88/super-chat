var windowsFocus = true;
var ws;
var user;
var userToken;
var addNewLine = false;

(function() {
  window.addEventListener('focus', function() {
    titlenotifier.reset();
    windowsFocus = true;
    addNewLine = false;

    setTimeout( function() {
      var element = document.getElementsByClassName('missingMessages')[0];
      if(element) {
        element.parentNode.removeChild(element);
      }
    }, 1000);
  });

  window.addEventListener('blur', function() {
    windowsFocus = false;
    addNewLine = true;
  });
})();

function start() {
  if(ws) {
    return;
  }

  var host = location.origin.replace(/^http/, 'ws')
  ws = new WebSocket(host);

  ws.onmessage = function (event) {
    var data = JSON.parse(event.data);

    if(!windowsFocus) {
      titlenotifier.add();
      if(addNewLine) {
        createMissingMessages();
        addNewLine = false;
      }
    }

    switch(data.action) {
      case 'new':
        addNewUser(data.data);
        break;
      case 'message':
        writeNewMessage(data.data);
        break;
      case 'delete':
        deleteUser(data.data);
        break;
      default:
        console.log('Invalid action');
    }
  };

  ws.onopen = function() {
    var chatContainer = document.getElementById('chat-container');
    chatContainer.style.display = 'block';

    var login = document.getElementById('login');
    login.style.display = 'none';

    var name = document.getElementById('name').value;
    user = name;
    document.getElementById("showUserName").innerHTML = "Username: " + name;

    userToken = token();

    var data = {
      action: 'new',
      data: {
        token: userToken,
        userName: name
      }
    }

    sendData(data);
    ping();
    addNewUser(data.data);
  }

  return false;
}

function deleteUser(data) {
  var userElement = document.getElementsByClassName(data.userName)[0];
  userElement.parentNode.removeChild(userElement);

  var removeUserMessage = document.createElement('p');
  removeUserMessage.className = 'bg-danger';
  removeUserMessage.innerHTML = 'User ' + data.userName + ' disconnected';

  addElementToMessages(removeUserMessage);
}

function addNewUser(data) {
  var userList = document.getElementById('userList');
  var li = document.createElement('li');

  li.className = data.userName;
  li.innerHTML = data.userName;

  userList.appendChild(li);

  if(data.token === userToken) {
    return;
  }

  var newUserMessage = document.createElement('p');
  newUserMessage.className = 'bg-success';
  newUserMessage.innerHTML = 'User ' + data.userName + ' connected';

  addElementToMessages(newUserMessage);
}

function writeNewMessage(data) {
  var div = document.createElement('div');
  var nameDiv = document.createElement('div');

  nameDiv.className = 'userName';
  nameDiv.innerHTML = data.name + ':';

  var txtDiv = document.createElement('div');
  txtDiv.className = 'message';
  txtDiv.innerHTML = data.message;

  div.appendChild(nameDiv);
  div.appendChild(txtDiv);

  addElementToMessages(div);
}

function sendMsg() {
  var message = document.getElementById('message').value;

  var data = {
    action: 'message',
    data: {
      name: user,
      message: message
    }
  }
  sendData(data);
  document.getElementById('message').value = '';
  writeNewMessage(data.data);
  return false;
}

function addElementToMessages(element) {
  var allMessages = document.getElementById('allMessages');

  allMessages.appendChild(element);
  allMessages.scrollTop = allMessages.scrollHeight;
}

function token() {
  return Math.random().toString(36).substr(2); // remove `0.`
}

function ping() {
  setTimeout( function() {
    sendData({action: 'ping'});
    ping();
  }, 30000);
}

function sendData(data) {
  if(!ws) {
    return;
  }

  ws.send(JSON.stringify(data));
}

function createMissingMessages() {
  var div = document.createElement('div');

  div.className = 'missingMessages';
  addElementToMessages(div);
}
