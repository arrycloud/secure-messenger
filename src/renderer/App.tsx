import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, setChats, updateStatus, handleNewMessage, setSearchQuery } from './store/store';
import { ChatList } from './components/ChatList';
import { MessageView } from './components/MessageView';
import { 
  Box, Grid, AppBar, Toolbar, Typography, Chip, 
  TextField, InputAdornment, Button, Container 
} from '@mui/material';
import { Search as SearchIcon, Wifi as WifiIcon, WifiOff as WifiOffIcon } from '@mui/icons-material';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { status, searchQuery } = useSelector((state: RootState) => state.app);

  useEffect(() => {
    // Initial load
    (window as any).electronAPI.getChats(50, 0).then((chats: any) => {
      dispatch(setChats(chats));
    });

    // WS Listeners
    (window as any).electronAPI.onNewMessage((msg: any) => {
      dispatch(handleNewMessage(msg));
    });

    (window as any).electronAPI.onConnectionStatus((newStatus: any) => {
      dispatch(updateStatus(newStatus));
    });
  }, [dispatch]);

  const handleSimulateDrop = () => {
    (window as any).electronAPI.simulateDrop();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense">
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Secure Messenger</Typography>
          
          <Chip 
            icon={status === 'Connected' ? <WifiIcon /> : <WifiOffIcon />}
            label={status} 
            color={status === 'Connected' ? 'success' : status === 'Reconnecting' ? 'warning' : 'error'}
            size="small"
            sx={{ mr: 2 }}
          />
          
          <Button variant="outlined" size="small" onClick={handleSimulateDrop}>
            Simulate Drop
          </Button>
        </Toolbar>
      </AppBar>

      <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Grid item xs={4} sx={{ borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search chats..."
              variant="outlined"
            />
          </Box>
          <ChatList />
        </Grid>
        
        <Grid item xs={8} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid #eee' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search messages in current chat..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon size="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <MessageView />
        </Grid>
      </Grid>
    </Box>
  );
};

export default App;
