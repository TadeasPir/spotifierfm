import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';
import axios from 'axios';

const UserTopArtists = () => {
  const [topArtists, setTopArtists] = useState([]);

  useEffect(() => {
    const fetchTopArtists = async () => {
      try {
        const response = await axios.get('http://localhost:8888/top-artists');
        setTopArtists(response.data.items);
      } catch (error) {
        console.error('Error fetching top artists:', error);
      }
    };

    fetchTopArtists();
  }, []);

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Your Top Artists
      </Typography>
      <List>
        {topArtists.map((artist, index) => (
          <ListItem key={index} divider>
            <ListItemText primary={artist.name} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default UserTopArtists;