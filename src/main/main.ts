import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initDb, seedData, getChats, getMessages, searchMessages, markAsRead, addMessage } from './db/database';
import { MessageSimulator } from './ws/server';
import { WebSocket } from 'ws';

let mainWindow: BrowserWindow | null = null;
const simulator = new MessageSimulator();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  initDb();
  seedData();
  simulator.start();
  createWindow();

  // Setup WS Client in Main Process to handle DB writes
  setupWSClient();
});

function setupWSClient() {
  let ws: WebSocket;
  let reconnectTimer: NodeJS.Timeout;
  let backoff = 1000;

  const connect = () => {
    ws = new WebSocket('ws://localhost:8080');

    ws.on('open', () => {
      console.log('Main process WS connected');
      backoff = 1000;
      mainWindow?.webContents.send('ws:status', 'Connected');
      
      // Heartbeat
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        } else {
          clearInterval(heartbeat);
        }
      }, 10000);
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'new_message') {
        const message = msg.data;
        addMessage({
          id: message.messageId,
          chatId: message.chatId,
          ts: message.ts,
          sender: message.sender,
          body: message.body
        });
        mainWindow?.webContents.send('ws:new_message', message);
      }
    });

    ws.on('close', () => {
      mainWindow?.webContents.send('ws:status', 'Reconnecting');
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, backoff);
      backoff = Math.min(backoff * 2, 30000);
    });

    ws.on('error', () => {
      ws.close();
    });
  };

  connect();
}

// IPC Handlers
ipcMain.handle('db:getChats', (_, limit, offset) => getChats(limit, offset));
ipcMain.handle('db:getMessages', (_, chatId, limit, offset) => getMessages(chatId, limit, offset));
ipcMain.handle('db:searchMessages', (_, chatId, query, limit) => searchMessages(chatId, query, limit));
ipcMain.handle('db:markAsRead', (_, chatId) => markAsRead(chatId));
ipcMain.handle('ws:simulateDrop', () => simulator.simulateDrop());

app.on('window-all-closed', () => {
  simulator.stop();
  if (process.platform !== 'darwin') app.quit();
});
