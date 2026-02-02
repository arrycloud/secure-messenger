"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    getChats: (limit, offset) => electron_1.ipcRenderer.invoke('db:getChats', limit, offset),
    getMessages: (chatId, limit, offset) => electron_1.ipcRenderer.invoke('db:getMessages', chatId, limit, offset),
    searchMessages: (chatId, query, limit) => electron_1.ipcRenderer.invoke('db:searchMessages', chatId, query, limit),
    markAsRead: (chatId) => electron_1.ipcRenderer.invoke('db:markAsRead', chatId),
    simulateDrop: () => electron_1.ipcRenderer.invoke('ws:simulateDrop'),
    onNewMessage: (callback) => electron_1.ipcRenderer.on('ws:new_message', (_event, value) => callback(value)),
    onConnectionStatus: (callback) => electron_1.ipcRenderer.on('ws:status', (_event, value) => callback(value)),
});
