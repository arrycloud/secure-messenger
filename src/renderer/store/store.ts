import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Chat, Message, ConnectionStatus } from '../../shared/types';

interface AppState {
  chats: Chat[];
  currentChatId: string | null;
  messages: Message[];
  status: ConnectionStatus;
  searchQuery: string;
}

const initialState: AppState = {
  chats: [],
  currentChatId: null,
  messages: [],
  status: 'Offline',
  searchQuery: '',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setChats: (state, action: PayloadAction<Chat[]>) => {
      state.chats = action.payload;
    },
    appendChats: (state, action: PayloadAction<Chat[]>) => {
      state.chats = [...state.chats, ...action.payload];
    },
    setCurrentChat: (state, action: PayloadAction<string | null>) => {
      state.currentChatId = action.payload;
      state.messages = [];
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    prependMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = [...state.messages, ...action.payload];
    },
    updateStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.status = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    handleNewMessage: (state, action: PayloadAction<any>) => {
      const msg = action.payload;
      // Update chat list if message is for an existing chat
      const chatIndex = state.chats.findIndex(c => c.id === msg.chatId);
      if (chatIndex !== -1) {
        const chat = state.chats[chatIndex];
        chat.lastMessageAt = msg.ts;
        if (state.currentChatId !== msg.chatId) {
          chat.unreadCount += 1;
        }
        // Move chat to top
        state.chats.splice(chatIndex, 1);
        state.chats.unshift(chat);
      }
      
      // Update message list if it's the current chat
      if (state.currentChatId === msg.chatId) {
        state.messages.unshift({
          id: msg.messageId,
          chatId: msg.chatId,
          ts: msg.ts,
          sender: msg.sender,
          body: msg.body
        });
      }
    }
  }
});

export const { 
  setChats, appendChats, setCurrentChat, setMessages, 
  prependMessages, updateStatus, setSearchQuery, handleNewMessage 
} = appSlice.actions;

export const store = configureStore({
  reducer: {
    app: appSlice.reducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
