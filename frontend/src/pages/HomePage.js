import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  ShoppingBag as ShoppingBagIcon,
} from '@mui/icons-material';

const HomePage = () => {
  const navigate = useNavigate();

  /* =========================
     STATIC CATEGORIES (can replace with API later)
  ========================= */
  const featuredCategories = [
    { id: 1, name: 'Electronics', description: 'Latest gadgets', color: '#1976d2' },
    { id: 2, name: 'Clothing', description: 'Fashion apparel', color: '#dc004e' },
    { id: 3, name: 'Books', description: 'Knowledge & stories', color: '#2e7d32' },
    { id: 4, name: 'Home & Garden', description: 'Home essentials', color: '#ed6c02' },
  ];

  const features = [
    { title: 'Fast Delivery', description: 'Quick shipping', icon: '🚚' },
    { title: 'Secure Payment', description: 'Safe transactions', icon: '🔒' },
    { title: '24/7 Support', description: 'Always here', icon: '💬' },
    { title: 'Quality Products', description: 'Best quality', icon: '⭐' },
  ];

  return (
    <Box>

      {/* =========================
         HERO
      ========================= */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={700}>
            Welcome to E-Commerce Platform
          </Typography>

          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
            Discover amazing products at unbeatable prices
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => navigate('/search')}
              sx={{ bgcolor: 'white', color: 'primary.main' }}
            >
              Browse Products
            </Button>

            {/* 🔥 FIXED: removed broken /categories route */}
            <Button
              variant="outlined"
              startIcon={<ShoppingBagIcon />}
              onClick={() => navigate('/search')}
              sx={{ borderColor: 'white', color: 'white' }}
            >
              View Categories
            </Button>
          </Box>
        </Container>
      </Box>

      {/* =========================
         CATEGORIES
      ========================= */}
      <Container sx={{ py: 8 }}>
        <Typography variant="h3" textAlign="center" fontWeight={600}>
          Shop by Category
        </Typography>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          {featuredCategories.map((category) => (
            <Grid item xs={12} sm={6} md={3} key={category.id}>
              <Card
                sx={{
                  textAlign: 'center',
                  transition: '0.3s',
                  '&:hover': { transform: 'translateY(-5px)' },
                }}
              >
                <Box
                  sx={{
                    height: 120,
                    bgcolor: category.color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                  }}
                >
                  {category.name[0]}
                </Box>

                <CardContent>
                  <Typography variant="h6">{category.name}</Typography>
                  <Typography variant="body2">
                    {category.description}
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button
                    onClick={() =>
                      navigate(`/search?category=${category.name.toLowerCase()}`)
                    }
                  >
                    Shop
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* =========================
         FEATURES
      ========================= */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container>
          <Typography variant="h3" textAlign="center" fontWeight={600}>
            Why Choose Us
          </Typography>

          <Grid container spacing={4} sx={{ mt: 4 }}>
            {features.map((f, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Box textAlign="center">
                  <Typography variant="h3">{f.icon}</Typography>
                  <Typography variant="h6">{f.title}</Typography>
                  <Typography>{f.description}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* =========================
         CTA
      ========================= */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 6 }}>
        <Container sx={{ textAlign: 'center' }}>
          <Typography variant="h4">Start Shopping Now</Typography>

          <Button
            variant="contained"
            sx={{ mt: 3, bgcolor: 'white', color: 'primary.main' }}
            onClick={() => navigate('/search')}
          >
            Browse Products
          </Button>
        </Container>
      </Box>

    </Box>
  );
};

export default HomePage;