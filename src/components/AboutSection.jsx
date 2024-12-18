import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const AboutSection = () => {
  return (
    <Box sx={{ py: 4, backgroundColor: '#f5f5f5' }}>
      <Container maxWidth="md">
        <Typography variant="h4" align="center" gutterBottom>
          About SpotifierFM
        </Typography>
        <Typography variant="body1" align="center" color="textSecondary">
          SpotifierFM is your ultimate music discovery companion. Powered by the Spotify API, our app makes it easier than ever to explore trending playlists, discover new music tailored to your tastes, and enjoy personalized dashboards featuring your most listened-to songs and artists. Whether you are a casual listener or a dedicated music enthusiast, SpotifierFM helps you connect with the music you love.
        </Typography>
      </Container>
    </Box>
  );
};

export default AboutSection;