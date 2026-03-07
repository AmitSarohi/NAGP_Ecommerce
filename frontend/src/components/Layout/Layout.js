import React from 'react';
import { Container } from '@mui/material';

const Layout = ({ children }) => {
  return (
    <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
      {children}
    </Container>
  );
};

export default Layout;
