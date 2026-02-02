export interface Chat {
  id: string;
  title: string;
  lastMessageAt: number;
  unreadCount: number;
}

export interface Message {
  id: string;
  chatId: string;
  ts: number;
  sender: string;
  body: string;
}

export interface SyncMessage {
  chatId: string;
  messageId: string;
  ts: number;
  sender: string;
  body: string;
}

export type ConnectionStatus = 'Connected' | 'Reconnecting' | 'Offline';
