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
          {isAuthenticated && isAdmin && <Chip label="ADMIN" color="secondary" />}
          {isAuthenticated && !isAdmin && <Chip label="USER" />}
        </Box>

        {/* 🔥 ADMIN ACTIONS */}
        {isAuthenticated && isAdmin && (
          <Box sx={{ ml: 3, display: 'flex', gap: 1 }}>
            <Button color="inherit" onClick={() => navigate('/add-product')}>
              Add Product
            </Button>

            <Button color="inherit" onClick={() => navigate('/add-category')}>
              Add Category
            </Button>
          </Box>
        )}

        {/* 🔍 COMMON ACTION */}
        {isAuthenticated && (
          <Button
            color="inherit"
            sx={{ ml: 2 }}
            onClick={() => navigate('/search')}
          >
            Search
          </Button>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {/* USER MENU */}
        {isAuthenticated ? (
          <>
            <IconButton onClick={handleOpenMenu}>
              <Avatar>
                {user?.email?.charAt(0)?.toUpperCase()}
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