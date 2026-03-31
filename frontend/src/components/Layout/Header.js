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
  AccountCircle as AccountIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = '/api'; // works with ingress

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deploymentGuid, setDeploymentGuid] = useState('');
  const [serviceGuids, setServiceGuids] = useState({
    frontend: '',
    product: '',
    user: '',
    search: ''
  });

  // Generate deployment GUID on component mount and fetch all service GUIDs
  useEffect(() => {
    // Frontend GUID
    const guid = process.env.REACT_APP_DEPLOYMENT_GUID || uuidv4();
    setDeploymentGuid(guid);
    setServiceGuids(prev => ({ ...prev, frontend: guid.substring(0, 8) }));

    // Fetch backend service GUIDs
    const fetchServiceGuids = async () => {
      try {
        // Product Service
        const productRes = await axios.get(`${API_BASE_URL}/products/health/info`)
          .catch(() => ({ data: { deploymentGuid: 'offline' } }));
        setServiceGuids(prev => ({ 
          ...prev, 
          product: productRes.data?.deploymentGuid?.substring(0, 8) || 'unknown' 
        }));
      } catch (e) {
        console.log('Product service info fetch failed');
      }

      try {
        // User Service
        const userRes = await axios.get(`${API_BASE_URL}/users/health/info`)
          .catch(() => ({ data: { deploymentGuid: 'offline' } }));
        setServiceGuids(prev => ({ 
          ...prev, 
          user: userRes.data?.deploymentGuid?.substring(0, 8) || 'unknown' 
        }));
      } catch (e) {
        console.log('User service info fetch failed');
      }

      try {
        // Search Service
        const searchRes = await axios.get(`${API_BASE_URL}/search/health/info`)
          .catch(() => ({ data: { deploymentGuid: 'offline' } }));
        setServiceGuids(prev => ({ 
          ...prev, 
          search: searchRes.data?.deploymentGuid?.substring(0, 8) || 'unknown' 
        }));
      } catch (e) {
        console.log('Search service info fetch failed');
      }
    };

    fetchServiceGuids();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  const handleProfile = () => {
    navigate('/profile');
    handleMenuClose();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const renderMobileMenu = () => (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
    >
      <Box sx={{ width: 250, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Menu</Typography>
          <IconButton onClick={() => setMobileMenuOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <List>
          <ListItem button onClick={() => { navigate('/'); setMobileMenuOpen(false); }}>
            <ListItemIcon><HomeIcon /></ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>
          
          <ListItem button onClick={() => { navigate('/search'); setMobileMenuOpen(false); }}>
            <ListItemIcon><SearchIcon /></ListItemIcon>
            <ListItemText primary="Search" />
          </ListItem>
          
          {isAuthenticated ? (
            <>
              <ListItem button onClick={handleProfile}>
                <ListItemIcon><PersonIcon /></ListItemIcon>
                <ListItemText primary="Profile" />
              </ListItem>
              {isAdmin && (
                <>
                  <ListItem button onClick={() => { navigate('/add-product'); setMobileMenuOpen(false); }}>
                    <ListItemIcon><InventoryIcon /></ListItemIcon>
                    <ListItemText primary="Add Product" />
                  </ListItem>
                  <ListItem button onClick={() => { navigate('/add-category'); setMobileMenuOpen(false); }}>
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
              <ListItem button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>
                <ListItemText primary="Login" />
              </ListItem>
              <ListItem button onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}>
                <ListItemText primary="Register" />
              </ListItem>
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );

  return (
    <>
      <AppBar position="sticky" elevation={2}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{ 
                cursor: 'pointer',
                fontWeight: 700,
                mr: 3,
                '&:hover': { color: 'primary.light' }
              }}
              onClick={() => navigate('/')}
            >
              E-Commerce
            </Typography>
            
            {/* Deployment GUIDs from all services */}
            <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
              <Chip
                label={`FE: ${serviceGuids.frontend || '...'}`}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: '0.65rem',
                  height: 20,
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'rgba(255,255,255,0.7)',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
              <Chip
                label={`PR: ${serviceGuids.product || '...'}`}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: '0.65rem',
                  height: 20,
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'rgba(255,255,255,0.7)',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
              <Chip
                label={`US: ${serviceGuids.user || '...'}`}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: '0.65rem',
                  height: 20,
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'rgba(255,255,255,0.7)',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
              <Chip
                label={`SE: ${serviceGuids.search || '...'}`}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: '0.65rem',
                  height: 20,
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'rgba(255,255,255,0.7)',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>
          </Box>

          {/* Search Bar */}
          {!isMobile && (
            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 2,
                px: 2,
                py: 0.5,
                mx: 2,
                width: '40%',
                maxWidth: 400,
              }}
            >
              <InputBase
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ 
                  color: 'white', 
                  flex: 1,
                  '&::placeholder': { color: 'rgba(255,255,255,0.7)' }
                }}
              />
              <IconButton type="submit" sx={{ color: 'white', p: 0.5 }}>
                <SearchIcon />
              </IconButton>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Add Product & Category Buttons - Show for admin users only */}
            {!isMobile && isAuthenticated && isAdmin && (
              <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                <Button
                  startIcon={<InventoryIcon />}
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/add-product')}
                  sx={{ 
                    textTransform: 'none',
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Add Product
                </Button>
                <Button
                  startIcon={<CategoryIcon />}
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/add-category')}
                  sx={{ 
                    textTransform: 'none',
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Add Category
                </Button>
              </Box>
            )}

            {/* Mobile Menu */}
            {isMobile && (
              <IconButton color="inherit" onClick={toggleMobileMenu}>
                <MenuIcon />
              </IconButton>
            )}

            {/* Cart */}
            <IconButton color="inherit" onClick={() => navigate('/cart')}>
              <Badge badgeContent={0} color="secondary">
                <CartIcon />
              </Badge>
            </IconButton>

            {/* User Menu */}
            {isAuthenticated ? (
              <>
                <IconButton color="inherit" onClick={handleMenuOpen}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                    {user?.firstName?.charAt(0) || 'U'}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{
                    elevation: 3,
                    sx: { mt: 1.5 }
                  }}
                >
                  <MenuItem onClick={handleProfile}>
                    <PersonIcon sx={{ mr: 1 }} />
                    Profile
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              !isMobile && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    color="inherit"
                    onClick={() => navigate('/login')}
                    sx={{ textTransform: 'none' }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => navigate('/register')}
                    sx={{ textTransform: 'none', borderColor: 'white' }}
                  >
                    Register
                  </Button>
                </Box>
              )
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Menu Drawer */}
      {renderMobileMenu()}
    </>
  );
};

export default Header;
