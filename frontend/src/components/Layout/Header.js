import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Badge,
  InputBase,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = '/api';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // ✅ UPDATED: isAdmin is now boolean
  const { user, isAuthenticated, logout, isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [serviceGuids, setServiceGuids] = useState({
    frontend: '',
    product: '',
    user: '',
    search: '',
  });

  /* =========================
     Fetch Service GUIDs
  ========================= */
  useEffect(() => {
    const guid = process.env.REACT_APP_DEPLOYMENT_GUID || uuidv4();

    setServiceGuids((prev) => ({
      ...prev,
      frontend: guid.substring(0, 8),
    }));

    const fetchServiceGuids = async () => {
      try {
        const productRes = await axios
          .get(`${API_BASE_URL}/products/health/info`)
          .catch(() => ({ data: { deploymentGuid: 'offline' } }));

        const userRes = await axios
          .get(`${API_BASE_URL}/users/health/info`)
          .catch(() => ({ data: { deploymentGuid: 'offline' } }));

        const searchRes = await axios
          .get(`${API_BASE_URL}/search/health/info`)
          .catch(() => ({ data: { deploymentGuid: 'offline' } }));

        setServiceGuids((prev) => ({
          ...prev,
          product:
            productRes.data?.deploymentGuid?.substring(0, 8) ||
            'unknown',
          user:
            userRes.data?.deploymentGuid?.substring(0, 8) ||
            'unknown',
          search:
            searchRes.data?.deploymentGuid?.substring(0, 8) ||
            'unknown',
        }));
      } catch (e) {
        console.log('Service GUID fetch failed');
      }
    };

    fetchServiceGuids();
  }, []);

  /* =========================
     Handlers
  ========================= */

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // ✅ CLEAN logout
  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login', { replace: true });
  };

  const handleProfile = () => {
    navigate('/profile');
    handleMenuClose();
  };

  const toggleMobileMenu = () =>
    setMobileMenuOpen((prev) => !prev);

  /* =========================
     Mobile Menu
  ========================= */

  const renderMobileMenu = () => (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
    >
      <Box sx={{ width: 250, p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant="h6">Menu</Typography>
          <IconButton onClick={() => setMobileMenuOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <List>
          <ListItem button onClick={() => navigate('/')}>
            <ListItemIcon><HomeIcon /></ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>

          <ListItem button onClick={() => navigate('/search')}>
            <ListItemIcon><SearchIcon /></ListItemIcon>
            <ListItemText primary="Search" />
          </ListItem>

          {isAuthenticated ? (
            <>
              <ListItem button onClick={handleProfile}>
                <ListItemIcon><PersonIcon /></ListItemIcon>
                <ListItemText primary="Profile" />
              </ListItem>

              {/* ✅ FIXED: no function call */}
              {isAdmin && (
                <>
                  <ListItem button onClick={() => navigate('/add-product')}>
                    <ListItemIcon><InventoryIcon /></ListItemIcon>
                    <ListItemText primary="Add Product" />
                  </ListItem>

                  <ListItem button onClick={() => navigate('/add-category')}>
                    <ListItemIcon><CategoryIcon /></ListItemIcon>
                    <ListItemText primary="Add Category" />
                  </ListItem>
                </>
              )}

              <ListItem button onClick={handleLogout}>
                <ListItemIcon><LogoutIcon /></ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItem>
            </>
          ) : (
            <>
              <ListItem button onClick={() => navigate('/login')}>
                <ListItemText primary="Login" />
              </ListItem>
              <ListItem button onClick={() => navigate('/register')}>
                <ListItemText primary="Register" />
              </ListItem>
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );

  /* =========================
     Render
  ========================= */

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ cursor: 'pointer', mr: 3 }}
            onClick={() => navigate('/')}
          >
            E-Commerce
          </Typography>

          {/* Role Chips */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isAuthenticated && isAdmin && (
              <Chip label="ADMIN" size="small" color="secondary" />
            )}
            {isAuthenticated && !isAdmin && (
              <Chip label="USER" size="small" />
            )}
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Desktop Buttons */}
          {!isMobile && isAuthenticated && isAdmin && (
            <>
              <Button onClick={() => navigate('/add-product')}>
                Add Product
              </Button>
              <Button onClick={() => navigate('/add-category')}>
                Add Category
              </Button>
            </>
          )}

          {/* User Menu */}
          {isAuthenticated ? (
            <>
              <IconButton onClick={handleMenuOpen}>
                <Avatar>
                  {user?.firstName?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleProfile}>
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

          {isMobile && (
            <IconButton onClick={toggleMobileMenu}>
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {renderMobileMenu()}
    </>
  );
};

export default Header;