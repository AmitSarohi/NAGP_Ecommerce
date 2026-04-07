import React, { useState } from 'react';
import {
  Box, Container, Grid, Paper, Typography,
  Button, Chip, CircularProgress, Alert,
  Divider, IconButton
} from '@mui/material';

import {
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import api from '../services/api'; // ✅ FIX

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState(0);

  /* =========================
     FETCH PRODUCT
  ========================= */
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const res = await api.get(`/products/${productId}`);
      return res.data;
    },
    enabled: !!productId,
  });

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);

  /* =========================
     HANDLERS
  ========================= */
  const handleAddToCart = () => {
    toast.success('Added to cart');
    console.log(product);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied!');
      }
    } catch {
      toast.error('Share failed');
    }
  };

  /* =========================
     STATES
  ========================= */
  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">Product not found</Alert>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </Container>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>

      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
        Back
      </Button>

      <Grid container spacing={4}>

        {/* IMAGES */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ height: 400 }}>
            {product.images?.[selectedImage] ? (
              <img
                src={product.images[selectedImage]}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : '📦'}
          </Paper>

          {/* THUMBNAILS */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            {product.images?.map((img, i) => (
              <Box
                key={i}
                onClick={() => setSelectedImage(i)} // ✅ FIX
                sx={{
                  width: 60,
                  height: 60,
                  cursor: 'pointer',
                  border: i === selectedImage ? '2px solid blue' : '1px solid #ccc',
                }}
              >
                <img src={img} width="100%" height="100%" />
              </Box>
            ))}
          </Box>
        </Grid>

        {/* DETAILS */}
        <Grid item xs={12} md={6}>
          <Typography variant="h4">{product.name}</Typography>
          <Typography variant="h5" color="primary">
            {formatPrice(product.price)}
          </Typography>

          <Chip
            label={
              product.inventoryCount > 0
                ? `${product.inventoryCount} in stock`
                : 'Out of stock'
            }
            color={product.inventoryCount > 0 ? 'success' : 'error'}
          />

          <Typography sx={{ mt: 2 }}>{product.description}</Typography>

          {/* ACTIONS */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<CartIcon />}
              disabled={!product.inventoryCount}
              onClick={handleAddToCart}
            >
              Add to Cart
            </Button>

            <IconButton><FavoriteIcon /></IconButton>

            <IconButton onClick={handleShare}>
              <ShareIcon />
            </IconButton>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2">
            SKU: {product.sku}
          </Typography>

        </Grid>

      </Grid>
    </Container>
  );
};

export default ProductDetailsPage;