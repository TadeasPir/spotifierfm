import React from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';
import ArticleCard from './ArticleCard';

const ArticlesSection = () => {
  const articles = [
    { title: 'Discover Trending Playlists', content: 'Find the hottest playlists curated just for you.' },
    { title: 'Explore New Music', content: 'Use SpotifierFM to discover tracks that match your taste.' },
    { title: 'Personalized Dashboard', content: 'See your most listened-to songs and artists in one place.' },
  ];

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" align="center" gutterBottom>
          Why Use SpotifierFM?
        </Typography>
        <Grid container spacing={2} justifyContent="center" alignItems="stretch">
          {articles.map((article, index) => (
            <Grid item key={index} xs={12} sm={6} md={4} display="flex">
              <ArticleCard title={article.title} content={article.content} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};


export default ArticlesSection;