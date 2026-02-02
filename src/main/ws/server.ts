import { WebSocketServer, WebSocket } from 'ws';
import { SyncMessage } from '../../shared/types';

export class MessageSimulator {
  private wss: WebSocketServer | null = null;
  private interval: NodeJS.Timeout | null = null;
  private port: number = 8080;

  start() {
    this.wss = new WebSocketServer({ port: this.port });
    console.log(`WS Server started on port ${this.port}`);

    this.wss.on('connection', (ws) => {
      console.log('Client connected to simulator');
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      });
    });

    this.startEmitting();
  }

  private startEmitting() {
    const emit = () => {
      if (this.wss && this.wss.clients.size > 0) {
        const chatId = `chat_${Math.floor(Math.random() * 200)}`;
        const message: SyncMessage = {
          chatId,
          messageId: `sync_${Date.now()}`,
          ts: Date.now(),
          sender: 'Contact',
          body: `Simulated secure message at ${new Date().toLocaleTimeString()}`
        };

        this.wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'new_message', data: message }));
          }
        });
      }
      
      const nextDelay = 1000 + Math.random() * 2000;
      this.interval = setTimeout(emit, nextDelay);
    };

    emit();
  }

  stop() {
    if (this.interval) clearTimeout(this.interval);
    if (this.wss) this.wss.close();
  }

  simulateDrop() {
    if (this.wss) {
      this.wss.clients.forEach(client => client.terminate());
    }
  }
}
