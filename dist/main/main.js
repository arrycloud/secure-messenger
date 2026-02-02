"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const database_1 = require("./db/database");
const server_1 = require("./ws/server");
const ws_1 = require("ws");
let mainWindow = null;
const simulator = new server_1.MessageSimulator();
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../renderer/index.html'));
    }
}
electron_1.app.whenReady().then(() => {
    (0, database_1.initDb)();
    (0, database_1.seedData)();
    simulator.start();
    createWindow();
    // Setup WS Client in Main Process to handle DB writes
    setupWSClient();
});
function setupWSClient() {
    let ws;
    let reconnectTimer;
    let backoff = 1000;
    const connect = () => {
        ws = new ws_1.WebSocket('ws://localhost:8080');
        ws.on('open', () => {
            console.log('Main process WS connected');
            backoff = 1000;
            mainWindow?.webContents.send('ws:status', 'Connected');
            // Heartbeat
            const heartbeat = setInterval(() => {
                if (ws.readyState === ws_1.WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'ping' }));
                }
                else {
                    clearInterval(heartbeat);
                }
            }, 10000);
        });
        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            if (msg.type === 'new_message') {
                const message = msg.data;
                (0, database_1.addMessage)({
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
electron_1.ipcMain.handle('db:getChats', (_, limit, offset) => (0, database_1.getChats)(limit, offset));
electron_1.ipcMain.handle('db:getMessages', (_, chatId, limit, offset) => (0, database_1.getMessages)(chatId, limit, offset));
electron_1.ipcMain.handle('db:searchMessages', (_, chatId, query, limit) => (0, database_1.searchMessages)(chatId, query, limit));
electron_1.ipcMain.handle('db:markAsRead', (_, chatId) => (0, database_1.markAsRead)(chatId));
electron_1.ipcMain.handle('ws:simulateDrop', () => simulator.simulateDrop());
electron_1.app.on('window-all-closed', () => {
    simulator.stop();
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
