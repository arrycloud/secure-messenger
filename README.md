# Secure Messenger Desktop — Chat List + Sync Simulator

A production-ready Electron + React + TypeScript desktop application focusing on efficient local data access, real-time synchronization, and security hygiene.

## Features

- **Local Data Persistence**: Uses SQLite (`better-sqlite3`) for efficient storage of chats and messages.
- **Real-time Sync**: Built-in WebSocket server simulator that pushes new messages periodically.
- **Virtualized UI**: The chat list uses `react-window` to handle hundreds of contacts with zero performance lag.
- **Connection Health**: Robust heartbeat mechanism with exponential backoff reconnection strategy.
- **Security Hygiene**: Module boundaries for encryption/decryption and secure logging to prevent data leaks.
- **Marketable UI**: Clean, modern interface built with Material UI.

## Architecture Overview

### Modules
- **Main Process**: Handles SQLite database operations, WebSocket server simulator, and system-level events.
- **Renderer Process**: React application managing the UI state via Redux Toolkit.
- **Shared**: Common TypeScript interfaces and types used by both processes.
- **SecurityService**: A dedicated boundary for encryption logic and secure data handling.

### Data Flow
1. **Initial Load**: Renderer requests the first 50 chats from SQLite via IPC.
2. **Real-time Sync**: WebSocket server emits a `new_message` event.
3. **Main Process**: Receives the event, writes to SQLite, and forwards it to the Renderer via IPC.
4. **Renderer**: Updates Redux state, moving the active chat to the top and updating unread counts.

## Setup & Run

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation
```bash
npm install
```

### Development
```bash
# Run the app in development mode
npm run build && npm start
```

### Build/Distribute
```bash
# Build for production
npm run dist
```

## Security Considerations

### Encryption
In a real-world system, encryption would happen at the **SecurityService** boundary:
- **Outbound**: Messages would be encrypted using a session key (AES-GCM) before being sent over WebSocket or stored in SQLite.
- **Inbound**: Encrypted blobs would be decrypted only when needed for display in the UI.
- **Key Management**: Keys would be stored in the system's secure enclave (e.g., macOS Keychain, Windows Credential Manager).

### Data Leaks Prevention
- **Logs**: The `SecurityService.log` method redacts sensitive fields before they reach the console.
- **Crash Dumps**: Production builds should disable full memory dumps or ensure they are encrypted.
- **DevTools**: In production, Electron DevTools should be disabled to prevent inspection of the decrypted state.

## Trade-offs & Future Improvements

1. **Trade-off**: Used `better-sqlite3` which is synchronous. For extremely high-volume writes, an asynchronous wrapper or worker threads for the database might be better to avoid blocking the main thread.
2. **Improvement**: Implement **End-to-End Encryption (E2EE)** using the Signal Protocol or similar.
3. **Improvement**: Add **Delta Sync** - if the client goes offline for a long time, it should request missed messages by timestamp when reconnecting.
4. **Improvement**: Add **Media Support** - handling file attachments and image previews.
