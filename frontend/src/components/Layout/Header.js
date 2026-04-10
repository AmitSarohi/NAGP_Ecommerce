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
import api from '../../services/api'; // ✅ use existing axios instance

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();

  const [anchorEl, setAnchorEl] = React.useState(null);

  // 🔥 GUID STATE
  const [guids, setGuids] = React.useState({
    frontend: process.env.REACT_APP_DEPLOYMENT_GUID || 'N/A',
    user: '',
    product: '',
    search: '',
  });

  // 🔥 FETCH SERVICE GUIDS
  React.useEffect(() => {
    const loadGuids = async () => {
      try {
        const [userRes, productRes, searchRes] = await Promise.all([
          api.get('/users/deployment-info'),
          api.get('/products/deployment-info'),
          api.get('/search/deployment-info'),
        ]);

        setGuids({
          frontend: process.env.REACT_APP_DEPLOYMENT_GUID || 'N/A',
          user: userRes.data?.deploymentGuid || 'N/A',
          product: productRes.data?.deploymentGuid || 'N/A',
          search: searchRes.data?.deploymentGuid || 'N/A',
        });

      } catch (err) {
        console.error('Failed to load GUIDs', err);
      }
    };

    loadGuids();
  }, []);

  const short = (val) => (val ? val.substring(0, 6) : 'NA');

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
          E-Commerce-Test
        </Typography>

        {/* ROLE CHIP */}
        <Box sx={{ ml: 2 }}>
          {isAuthenticated && isAdmin && (
            <Chip label="ADMIN" color="secondary" size="small" />
          )}
          {isAuthenticated && !isAdmin && (
            <Chip label="USER" size="small" />
          )}
        </Box>

        {/* 🔥 GUID CHIPS */}
        <Box sx={{ ml: 2, display: 'flex', gap: 1 }}>
          <Chip label={`FE: ${short(guids.frontend)}`} size="small" sx={{ background: '#1976d2', color: '#fff' }} />
          <Chip label={`USR: ${short(guids.user)}`} size="small" sx={{ background: '#2e7d32', color: '#fff' }} />
          <Chip label={`PRD: ${short(guids.product)}`} size="small" sx={{ background: '#6a1b9a', color: '#fff' }} />
          <Chip label={`SRCH: ${short(guids.search)}`} size="small" sx={{ background: '#ef6c00', color: '#fff' }} />
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