import React from 'react';
import Navbar from '../components/Navbar';
import BottomBar from '../components/BottomBar';
import ArticlesSection from '../components/ArticlesSection';
import AboutSection from '../components/AboutSection';
import Box from '@mui/material/Box';
import FeaturedArtists from '../components/FeaturedArtists';


const Landing = () => {
  return (
    <Box >
      <Navbar />
      <Box sx={{ flex: 1 }}>
        <AboutSection />
        <ArticlesSection />
      </Box>
      <FeaturedArtists />
      <BottomBar />
    </Box>
  );
};

export default Landing;
