import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, ShoppingBag as ShoppingBagIcon } from '@mui/icons-material';

const HomePage = () => {
  const navigate = useNavigate();

  const featuredCategories = [
    {
      id: 1,
      name: 'Electronics',
      description: 'Latest gadgets and devices',
      image: 'https://via.placeholder.com/300x200/1976d2/ffffff?text=Electronics',
      color: '#1976d2',
    },
    {
      id: 2,
      name: 'Clothing',
      description: 'Fashion and apparel',
      image: 'https://via.placeholder.com/300x200/dc004e/ffffff?text=Clothing',
      color: '#dc004e',
    },
    {
      id: 3,
      name: 'Books',
      description: 'Educational and entertainment',
      image: 'https://via.placeholder.com/300x200/2e7d32/ffffff?text=Books',
      color: '#2e7d32',
    },
    {
      id: 4,
      name: 'Home & Garden',
      description: 'Home improvement essentials',
      image: 'https://via.placeholder.com/300x200/ed6c02/ffffff?text=Home+Garden',
      color: '#ed6c02',
    },
  ];

  const features = [
    {
      title: 'Fast Delivery',
      description: 'Quick and reliable shipping to your doorstep',
      icon: '🚚',
    },
    {
      title: 'Secure Payment',
      description: 'Safe and secure payment processing',
      icon: '🔒',
    },
    {
      title: '24/7 Support',
      description: 'Round-the-clock customer service',
      icon: '💬',
    },
    {
      title: 'Quality Products',
      description: 'Curated selection of high-quality items',
      icon: '⭐',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom fontWeight={700}>
            Welcome to E-Commerce Platform
          </Typography>
          <Typography variant="h5" paragraph sx={{ mb: 4, opacity: 0.9 }}>
            Discover amazing products at unbeatable prices
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SearchIcon />}
              onClick={() => navigate('/search')}
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
            >
              Browse Products
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<ShoppingBagIcon />}
              onClick={() => navigate('/categories')}
              sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              View Categories
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Featured Categories */}
      <Container sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" gutterBottom textAlign="center" fontWeight={600}>
          Shop by Category
        </Typography>
        <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 6 }}>
          Explore our wide range of product categories
        </Typography>

        <Grid container spacing={4}>
          {featuredCategories.map((category) => (
            <Grid item xs={12} sm={6} md={3} key={category.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardMedia
                  component="div"
                  sx={{
                    height: 140,
                    bgcolor: category.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '3rem',
                    fontWeight: 'bold',
                  }}
                >
                  {category.name.charAt(0)}
                </CardMedia>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h3">
                    {category.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {category.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/search?category=${category.name.toLowerCase()}`)}
                  >
                    Shop Now
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container>
          <Typography variant="h3" component="h2" gutterBottom textAlign="center" fontWeight={600}>
            Why Choose Us
          </Typography>
          <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 6 }}>
            We offer the best shopping experience
          </Typography>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ mb: 2 }}>
                    {feature.icon}
                  </Typography>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Call to Action */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 6 }}>
        <Container textAlign="center">
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Ready to Start Shopping?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of satisfied customers
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/search')}
            sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
          >
            Start Shopping Now
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
