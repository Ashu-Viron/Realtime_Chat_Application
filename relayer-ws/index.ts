import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 3001 });
const servers: WebSocket[] = [];

wss.on('connection', (ws) => {
  console.log('🔌 New server connected');
  servers.push(ws);

  ws.on('error', (error) => {
    console.error('❌ Server connection error:', error);
  });

ws.on('message', (data) => {
  try {
    const jsonStr = data.toString(); // Safely convert Buffer or Blob to string
    // console.log(`🔁 Relaying message: ${jsonStr}`);

    // Broadcast to all other servers
    servers.forEach(server => {
      if (server.readyState === WebSocket.OPEN) {
        server.send(jsonStr); // Always send stringified JSON
      }
    });
  }catch (e) {
      console.error('❌ Relaying error:', e);
    }
  });

  ws.on('close', () => {
    console.log('🔌 Server disconnected');
    const index = servers.indexOf(ws);
    if (index !== -1) servers.splice(index, 1);
  });
});