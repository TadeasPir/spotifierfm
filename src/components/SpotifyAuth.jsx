import React from 'react';
import { Button, Container, Typography, Box } from '@mui/material';

const SpotifyAuth = () => {
  const handleLogin = () => {
    window.location.href = 'http://localhost:8888/login';
  };

  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', py: 5 }}>
      <Typography variant="h4" gutterBottom>
        Connect to Spotify
      </Typography>
      <Typography variant="body1" gutterBottom>
        To see your top songs, artists, and playlists, please log in with your Spotify account.
      </Typography>
      <Box sx={{ mt: 3 }}>
        <Button variant="contained" color="primary" onClick={handleLogin}>
          Log in with Spotify
        </Button>
      </Box>
    </Container>
  );
};

export default SpotifyAuth;