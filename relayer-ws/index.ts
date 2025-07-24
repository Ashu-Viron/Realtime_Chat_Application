import { WebSocketServer,WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 3001 });
const servers:WebSocket[]=[];


wss.on('connection', function connection(ws) {
  ws.on('error', console.error);
servers.push(ws);
  ws.on('message', function message(data:string) {
    const message = JSON.parse(data);
    // Handle different message types
  switch(message.type) {
    case 'chat':
    case 'user-joined':
    case 'user-left':
      // Broadcast to all connected servers
      servers.filter(socket => socket !== ws).forEach(socket => {
        socket.send(JSON.stringify(message));
      });
      break;
    default:
      console.log('Unknown message type:', message.type);
  }
        // servers.filter(socket => socket!=ws).map(socket=>{
        //     socket.send(data);
        // })
        servers
      .filter(socket => socket !== ws) // 💡 exclude sender
      .forEach(socket => {
        socket.send(data);
      });
  });

//   ws.send('you are connected');
});

//relayer websocket server helps broadcast messages to all participants in a room