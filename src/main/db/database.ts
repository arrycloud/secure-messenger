import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { Chat, Message } from '../../shared/types';

const dbPath = path.join(app.getPath('userData'), 'messenger.db');
const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      title TEXT,
      lastMessageAt INTEGER,
      unreadCount INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chatId TEXT,
      ts INTEGER,
      sender TEXT,
      body TEXT,
      FOREIGN KEY (chatId) REFERENCES chats(id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_chatId_ts ON messages(chatId, ts DESC);
    CREATE INDEX IF NOT EXISTS idx_chats_lastMessageAt ON chats(lastMessageAt DESC);
  `);
}

export function seedData() {
  const chatCount = 200;
  const totalMessages = 20000;

  const checkEmpty = db.prepare('SELECT count(*) as count FROM chats').get() as { count: number };
  if (checkEmpty.count > 0) return;

  console.log('Seeding database...');

  const insertChat = db.prepare('INSERT INTO chats (id, title, lastMessageAt, unreadCount) VALUES (?, ?, ?, ?)');
  const insertMessage = db.prepare('INSERT INTO messages (id, chatId, ts, sender, body) VALUES (?, ?, ?, ?, ?)');

  const transaction = db.transaction(() => {
    const chatIds: string[] = [];
    for (let i = 0; i < chatCount; i++) {
      const id = `chat_${i}`;
      chatIds.push(id);
      insertChat.run(id, `Contact ${i + 1}`, Date.now() - Math.random() * 10000000, 0);
    }

    for (let i = 0; i < totalMessages; i++) {
      const chatId = chatIds[Math.floor(Math.random() * chatIds.length)];
      insertMessage.run(
        `msg_${i}`,
        chatId,
        Date.now() - Math.random() * 10000000,
        Math.random() > 0.5 ? 'Me' : 'Contact',
        `Sample message content ${i}`
      );
    }

    // Update lastMessageAt for each chat based on its latest message
    db.exec(`
      UPDATE chats 
      SET lastMessageAt = (
        SELECT MAX(ts) FROM messages WHERE messages.chatId = chats.id
      )
    `);
  });

  transaction();
  console.log('Seeding complete.');
}

export function getChats(limit: number, offset: number): Chat[] {
  return db.prepare('SELECT * FROM chats ORDER BY lastMessageAt DESC LIMIT ? OFFSET ?').all(limit, offset) as Chat[];
}

export function getMessages(chatId: string, limit: number, offset: number): Message[] {
  return db.prepare('SELECT * FROM messages WHERE chatId = ? ORDER BY ts DESC LIMIT ? OFFSET ?').all(chatId, limit, offset) as Message[];
}

export function searchMessages(chatId: string, query: string, limit: number): Message[] {
  return db.prepare('SELECT * FROM messages WHERE chatId = ? AND body LIKE ? ORDER BY ts DESC LIMIT ?')
    .all(chatId, `%${query}%`, limit) as Message[];
}

export function addMessage(message: Message) {
  const insert = db.prepare('INSERT INTO messages (id, chatId, ts, sender, body) VALUES (?, ?, ?, ?, ?)');
  const updateChat = db.prepare('UPDATE chats SET lastMessageAt = ?, unreadCount = unreadCount + 1 WHERE id = ?');
  
  const transaction = db.transaction(() => {
    insert.run(message.id, message.chatId, message.ts, message.sender, message.body);
    updateChat.run(message.ts, message.chatId);
  });
  
  transaction();
}

export function markAsRead(chatId: string) {
  db.prepare('UPDATE chats SET unreadCount = 0 WHERE id = ?').run(chatId);
}
