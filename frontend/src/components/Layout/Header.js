import React from 'react';
import {
  AppBar, Toolbar, Typography, Box,
  Button, Avatar, Chip, IconButton, Menu, MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();

  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography onClick={() => navigate('/')}>E-Commerce</Typography>

        <Box sx={{ ml: 2 }}>
          {isAuthenticated && isAdmin && <Chip label="ADMIN" />}
          {isAuthenticated && !isAdmin && <Chip label="USER" />}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {isAuthenticated ? (
          <>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar>{user?.firstName?.charAt(0)}</Avatar>
            </IconButton>

            <Menu open={Boolean(anchorEl)} anchorEl={anchorEl}>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </>
        ) : (
          <Button onClick={() => navigate('/login')}>Login</Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;