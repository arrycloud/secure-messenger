import React from 'react';
import * as RW from 'react-window';
const List = (RW as any).FixedSizeList || (RW as any).default?.FixedSizeList || RW;
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setCurrentChat } from '../store/store';
import { ListItem, ListItemText, ListItemAvatar, Avatar, Badge, Typography, Box } from '@mui/material';

export const ChatList: React.FC = () => {
  const { chats, currentChatId } = useSelector((state: RootState) => state.app);
  const dispatch = useDispatch();

  const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const chat = chats[index];
    const isSelected = currentChatId === chat.id;

    return (
      <ListItem 
        button 
        style={style} 
        selected={isSelected}
        onClick={() => {
          dispatch(setCurrentChat(chat.id));
          (window as any).electronAPI.markAsRead(chat.id);
        }}
        sx={{ borderBottom: '1px solid #eee' }}
      >
        <ListItemAvatar>
          <Badge color="primary" badgeContent={chat.unreadCount} invisible={chat.unreadCount === 0}>
            <Avatar>{chat.title[0]}</Avatar>
          </Badge>
        </ListItemAvatar>
        <ListItemText 
          primary={chat.title} 
          secondary={
            <Typography variant="caption" color="textSecondary">
              {new Date(chat.lastMessageAt).toLocaleTimeString()}
            </Typography>
          } 
        />
      </ListItem>
    );
  };

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <List
        height={700}
        itemCount={chats.length}
        itemSize={72}
        width={'100%'}
      >
        {Row}
      </List>
    </Box>
  );
};
