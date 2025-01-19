import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const clients = new Map();

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Initialize the client's channels Set when they connect
  clients.set(ws, new Set());

  ws.on('message', (data) => {
    try {
      const { type, channel, message } = JSON.parse(data.toString());

      switch(type) {
        case 'subscribe':
          const channels = clients.get(ws);
          channels.add(channel);
          console.log(`Client subscribed to ${channel}`);
          break;

        case 'unsubscribe':
          const subChannels = clients.get(ws);
          subChannels.delete(channel);
          console.log(`Client unsubscribed from ${channel}`);
          break;

        case 'message':
          // Broadcast to all clients subscribed to this channel
          clients.forEach((subscribedChannels, client) => {
            if (client !== ws && subscribedChannels.has(channel)) {
              client.send(JSON.stringify({ type: 'message', channel, message }));
            }
          });
          console.log(`Message broadcast to ${channel}`);
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

console.log('WebSocket server running on port 8080');
