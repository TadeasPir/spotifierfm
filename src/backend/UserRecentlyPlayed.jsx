import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';
import axios from 'axios';

const UserRecentlyPlayed = () => {
  const [recentTracks, setRecentTracks] = useState([]);

  useEffect(() => {
    const fetchRecentlyPlayed = async () => {
      try {
        const response = await axios.get('http://localhost:8888/recently-played');
        setRecentTracks(response.data.items);
      } catch (error) {
        console.error('Error fetching recently played tracks:', error);
      }
    };

    fetchRecentlyPlayed();
  }, []);

  
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Recently Played Tracks
      </Typography>
      <List>
        {recentTracks.map((track, index) => (
          <ListItem key={index} divider>
            <ListItemText primary={track.track.name} secondary={track.track.artists[0].name} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default UserRecentlyPlayed;
