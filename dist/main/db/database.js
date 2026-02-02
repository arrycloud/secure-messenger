"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = initDb;
exports.seedData = seedData;
exports.getChats = getChats;
exports.getMessages = getMessages;
exports.searchMessages = searchMessages;
exports.addMessage = addMessage;
exports.markAsRead = markAsRead;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const dbPath = path_1.default.join(electron_1.app.getPath('userData'), 'messenger.db');
const db = new better_sqlite3_1.default(dbPath);
function initDb() {
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
function seedData() {
    const chatCount = 200;
    const totalMessages = 20000;
    const checkEmpty = db.prepare('SELECT count(*) as count FROM chats').get();
    if (checkEmpty.count > 0)
        return;
    console.log('Seeding database...');
    const insertChat = db.prepare('INSERT INTO chats (id, title, lastMessageAt, unreadCount) VALUES (?, ?, ?, ?)');
    const insertMessage = db.prepare('INSERT INTO messages (id, chatId, ts, sender, body) VALUES (?, ?, ?, ?, ?)');
    const transaction = db.transaction(() => {
        const chatIds = [];
        for (let i = 0; i < chatCount; i++) {
            const id = `chat_${i}`;
            chatIds.push(id);
            insertChat.run(id, `Contact ${i + 1}`, Date.now() - Math.random() * 10000000, 0);
        }
        for (let i = 0; i < totalMessages; i++) {
            const chatId = chatIds[Math.floor(Math.random() * chatIds.length)];
            insertMessage.run(`msg_${i}`, chatId, Date.now() - Math.random() * 10000000, Math.random() > 0.5 ? 'Me' : 'Contact', `Sample message content ${i}`);
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
function getChats(limit, offset) {
    return db.prepare('SELECT * FROM chats ORDER BY lastMessageAt DESC LIMIT ? OFFSET ?').all(limit, offset);
}
function getMessages(chatId, limit, offset) {
    return db.prepare('SELECT * FROM messages WHERE chatId = ? ORDER BY ts DESC LIMIT ? OFFSET ?').all(chatId, limit, offset);
}
function searchMessages(chatId, query, limit) {
    return db.prepare('SELECT * FROM messages WHERE chatId = ? AND body LIKE ? ORDER BY ts DESC LIMIT ?')
        .all(chatId, `%${query}%`, limit);
}
function addMessage(message) {
    const insert = db.prepare('INSERT INTO messages (id, chatId, ts, sender, body) VALUES (?, ?, ?, ?, ?)');
    const updateChat = db.prepare('UPDATE chats SET lastMessageAt = ?, unreadCount = unreadCount + 1 WHERE id = ?');
    const transaction = db.transaction(() => {
        insert.run(message.id, message.chatId, message.ts, message.sender, message.body);
        updateChat.run(message.ts, message.chatId);
    });
    transaction();
}
function markAsRead(chatId) {
    db.prepare('UPDATE chats SET unreadCount = 0 WHERE id = ?').run(chatId);
}
