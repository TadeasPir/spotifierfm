import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

const BottomBar = () => {
  return (
    <AppBar position="static" sx={{ backgroundColor: '#333', top: 'auto', bottom: 0 }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'center' }}>
          <Box>
            <Typography variant="body2" align="center" color="inherit">
              &copy; {new Date().getFullYear()} SpotifierFM. All rights reserved.
            </Typography>
            <Typography variant="body2" align="center" color="inherit">
              <Link href="#" color="inherit" underline="none" sx={{ mx: 1 }}>
                Privacy Policy
              </Link>
              |
              <Link href="#" color="inherit" underline="none" sx={{ mx: 1 }}>
                Terms of Service
              </Link>
            </Typography>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};


export default BottomBar;