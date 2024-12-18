import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';
import axios from 'axios';

const UserTopSongs = () => {
  const [topSongs, setTopSongs] = useState([]);

  useEffect(() => {
    const fetchTopSongs = async () => {
      try {
        const response = await axios.get('http://localhost:8888/top-songs');
        setTopSongs(response.data.items);
      } catch (error) {
        console.error('Error fetching top songs:', error);
      }
    };

    fetchTopSongs();
  }, []);

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Your Top Songs
      </Typography>
      <List>
        {topSongs.map((song, index) => (
          <ListItem key={index} divider>
            <ListItemText primary={song.name} secondary={song.artists[0].name} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default UserTopSongs;