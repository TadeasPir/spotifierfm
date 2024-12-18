import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia } from '@mui/material';

const featuredArtists = [
  { name: 'Taylor Swift', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Taylor_Swift_NOW_Super_Saturday_Night_IMG_0792_edited_%2833159476015%29.jpg/640px-Taylor_Swift_NOW_Super_Saturday_Night_IMG_0792_edited_%2833159476015%29.jpg' },
  { name: 'Drake', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Drake_Summer_Sixteen_Tour.jpg/640px-Drake_Summer_Sixteen_Tour.jpg' },
  { name: 'Billie Eilish', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Billie_Eilish_at_Pukkelpop_Festival_-_18_AUGUST_2019_%2804%29.jpg/640px-Billie_Eilish_at_Pukkelpop_Festival_-_18_AUGUST_2019_%2804%29.jpg' },
  { name: 'The Weeknd', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/The_Weeknd_at_Bumbershoot_2015_%2821367628469%29.jpg/640px-The_Weeknd_at_Bumbershoot_2015_%2821367628469%29.jpg' },
  { name: 'Ed Sheeran', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Ed_Sheeran%2C_V_Festival_2014%2C_Chelmsford_%2814974992562%29.jpg/640px-Ed_Sheeran%2C_V_Festival_2014%2C_Chelmsford_%2814974992562%29.jpg' },
];

const FeaturedArtists = () => {
  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" align="center" gutterBottom>
          Featured Artists
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {featuredArtists.map((artist, index) => (
            <Grid item key={index} xs={12} sm={6} md={4}>
              <Card sx={{ maxWidth: 345, m: 'auto' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={artist.image}
                  alt={artist.name}
                />
                <CardContent>
                  <Typography variant="h6" align="center">
                    {artist.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default FeaturedArtists;