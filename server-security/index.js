var net = require('net');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(express.static('public'));
var SSE = require('sse-node');

var _ = require('lodash');

var client;

// SOCKET

const start = new Date().getTime();

var data = [];
var unsentData = [0];
var armed = false;

const ALARM_KEY = '!';
const DISARM_KEY = '-';

var primary_socket;

function timeFromStart() {
  return Math.trunc((new Date().getTime() - start) / 1000);
}

function sendBlank() {
  var value = -timeFromStart();
  if (value == 0) value = '-0';
  if (client) {
    client.send('' + value);
    data.push(value);
  } else {
    unsentData.push(value);
  }
  setTimeout(sendBlank, 1000);
}
setTimeout(sendBlank);

var server = net.createServer((socket) => {
  console.log('SOCKET CONNECTED');
  primary_socket = socket;
  socket.setEncoding('ascii');
  socket.on('data', (msg) => {
    console.log('PIC: ' + msg);
    if (msg.includes('event')) {
      if (armed) {
        socket.write(ALARM_KEY + '\n');
      } else {
        socket.write(DISARM_KEY + '\n');
      }
      if (client) {
        var value = timeFromStart();
        client.send('' + value);
        data.push(value);
      } else {
        unsentData.push(value);
      }
    }
  });
  socket.on('close', (msg) => {
    console.log('SOCKET CLOSED');
  });
});
server.listen(3002);

// APPLICATION

app.get('/data', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  client = SSE(req, res);
  _.forEach(unsentData, (x) => client.send((x == 0 ? '-' : '') + x));
  data = _.concat(data, unsentData);
  unsentData = [];
  client.onClose(() => {
    console.log('SSE closed')
    unsentData = _.concat(data, unsentData);
    data = [];
  });
});

app.get('/sound', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  armed = true;
  if (primary_socket) {
    primary_socket.write(ALARM_KEY + '\n');
    res.send();
  } else {
    res.status(503).send();
  }
});

app.get('/arm', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  armed = true;
  res.send();
});

app.get('/disarm', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  armed = false;
  if (primary_socket) {
    primary_socket.write(DISARM_KEY + '\n');
    res.send();
  } else {
    res.status(503).send();
  }
});

app.listen(3001);
