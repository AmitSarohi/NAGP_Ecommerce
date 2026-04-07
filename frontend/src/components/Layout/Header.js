import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();

  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleCloseMenu();
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky">
      <Toolbar>

        {/* LOGO */}
        <Typography
          onClick={() => navigate('/')}
          sx={{ cursor: 'pointer', fontWeight: 600 }}
        >
          E-Commerce
        </Typography>

        {/* ROLE CHIP */}
        <Box sx={{ ml: 2 }}>
          {isAuthenticated && isAdmin && <Chip label="ADMIN" />}
          {isAuthenticated && !isAdmin && <Chip label="USER" />}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* RIGHT SIDE */}
        {isAuthenticated ? (
          <>
            <IconButton onClick={handleOpenMenu}>
              <Avatar>
                {user?.firstName?.charAt(0)?.toUpperCase() ||
                  user?.email?.charAt(0)?.toUpperCase()}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem
                onClick={() => {
                  handleCloseMenu();
                  navigate('/profile');
                }}
              >
                Profile
              </MenuItem>

              <MenuItem onClick={handleLogout}>
                Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Button onClick={() => navigate('/login')}>
            Login
          </Button>
        )}

      </Toolbar>
    </AppBar>
  );
};

export default Header;