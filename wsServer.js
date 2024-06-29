// wsServer.js
const WebSocket = require('ws');

let wss;

const initializeWebSocket = (server) => {
  wss = new WebSocket.Server({ server });
  wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
};

const broadcast = (data) => {
  if (wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
};

module.exports = { initializeWebSocket, broadcast };
