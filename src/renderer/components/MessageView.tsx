import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setMessages, prependMessages } from '../store/store';
import { Box, Typography, Paper, TextField, Button, CircularProgress } from '@mui/material';
import { SecurityService } from '../services/SecurityService';

export const MessageView: React.FC = () => {
  const { currentChatId, messages, searchQuery } = useSelector((state: RootState) => state.app);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentChatId) {
      loadMessages(true);
    }
  }, [currentChatId, searchQuery]);

  const loadMessages = async (reset = false) => {
    setLoading(true);
    const newOffset = reset ? 0 : offset + 50;
    
    let result;
    if (searchQuery) {
      result = await (window as any).electronAPI.searchMessages(currentChatId, searchQuery, 50);
    } else {
      result = await (window as any).electronAPI.getMessages(currentChatId, 50, newOffset);
    }

    if (reset) {
      dispatch(setMessages(result));
    } else {
      dispatch(prependMessages(result));
    }
    
    setOffset(newOffset);
    setLoading(false);
  };

  if (!currentChatId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography color="textSecondary">Select a chat to start messaging</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse' }} ref={scrollRef}>
        {messages.map((msg) => (
          <Box 
            key={msg.id} 
            sx={{ 
              alignSelf: msg.sender === 'Me' ? 'flex-end' : 'flex-start',
              mb: 1,
              maxWidth: '70%'
            }}
          >
            <Paper sx={{ p: 1, bgcolor: msg.sender === 'Me' ? '#e3f2fd' : '#f5f5f5' }}>
              <Typography variant="body2">{SecurityService.decrypt(msg.body)}</Typography>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'right' }}>
                {new Date(msg.ts).toLocaleTimeString()}
              </Typography>
            </Paper>
          </Box>
        ))}
        {!searchQuery && (
          <Button onClick={() => loadMessages()} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Load Older Messages'}
          </Button>
        )}
      </Box>
    </Box>
  );
};
