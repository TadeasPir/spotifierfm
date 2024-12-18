import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, List, ListItem, ListItemText } from '@mui/material';
import axios from 'axios';

const TopArtistsSection = () => {
  const [artists, setArtists] = useState([]);

  useEffect(() => {
    const fetchTopArtists = async () => {
      try {
        const response = await axios.get('/api/top-artists');
        setArtists(response.data);
      } catch (error) {
        console.error('Error fetching top artists:', error);
      }
    };

    fetchTopArtists();
  }, []);

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" align="center" gutterBottom>
          Current Top Artists
        </Typography>
        <List>
          {artists.map((artist, index) => (
            <ListItem key={artist.id || index} divider>
              <ListItemText primary={artist.name} />
            </ListItem>
          ))}
        </List>
      </Container>
    </Box>
  );
};

export default TopArtistsSection;