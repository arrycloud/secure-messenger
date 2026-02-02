import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getChats: (limit: number, offset: number) => ipcRenderer.invoke('db:getChats', limit, offset),
  getMessages: (chatId: string, limit: number, offset: number) => ipcRenderer.invoke('db:getMessages', chatId, limit, offset),
  searchMessages: (chatId: string, query: string, limit: number) => ipcRenderer.invoke('db:searchMessages', chatId, query, limit),
  markAsRead: (chatId: string) => ipcRenderer.invoke('db:markAsRead', chatId),
  simulateDrop: () => ipcRenderer.invoke('ws:simulateDrop'),
  onNewMessage: (callback: (message: any) => void) => ipcRenderer.on('ws:new_message', (_event, value) => callback(value)),
  onConnectionStatus: (callback: (status: string) => void) => ipcRenderer.on('ws:status', (_event, value) => callback(value)),
});
