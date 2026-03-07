import React from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const {
    data: product,
    isLoading,
    error,
  } = useQuery(
    ['product', productId],
    async () => {
      const response = await axios.get(
        `${process.env.REACT_APP_PRODUCT_SERVICE_URL || 'http://localhost:3002'}/api/products/${productId}`
      );
      return response.data;
    },
    {
      enabled: !!productId,
    }
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleAddToCart = () => {
    // TODO: Implement cart functionality
    console.log('Add to cart:', product);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error?.response?.data?.error?.message || 'Product not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back to Products
      </Button>

      <Grid container spacing={4}>
        {/* Product Image */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              height: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.50',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Box textAlign="center">
                <Typography variant="h2" color="text.secondary">
                  📦
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No image available
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Image Gallery */}
          {product.images && product.images.length > 1 && (
            <Box sx={{ display: 'flex', gap: 2, mt: 2, overflowX: 'auto' }}>
              {product.images.slice(1).map((image, index) => (
                <Paper
                  key={index}
                  sx={{
                    width: 80,
                    height: 80,
                    flexShrink: 0,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 2,
                    },
                  }}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 2}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Paper>
              ))}
            </Box>
          )}
        </Grid>

        {/* Product Details */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Title and Price */}
            <Box>
              <Typography variant="h3" component="h1" gutterBottom fontWeight={600}>
                {product.name}
              </Typography>
              <Typography variant="h4" color="primary.main" fontWeight={600}>
                {formatPrice(product.price)}
              </Typography>
            </Box>

            {/* Stock Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {product.inventoryCount > 0 ? (
                <Chip
                  label={`${product.inventoryCount} in stock`}
                  color="success"
                  variant="outlined"
                />
              ) : (
                <Chip
                  label="Out of Stock"
                  color="error"
                  variant="outlined"
                />
              )}
              <Typography variant="body2" color="text.secondary">
                SKU: {product.sku}
              </Typography>
            </Box>

            {/* Description */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {product.description}
              </Typography>
            </Box>

            {/* Attributes */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Specifications
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <Box
                      key={key}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        py: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<CartIcon />}
                onClick={handleAddToCart}
                disabled={product.inventoryCount === 0}
                sx={{ flex: 1, minWidth: 200 }}
              >
                {product.inventoryCount === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              
              <IconButton
                size="large"
                sx={{ border: 1, borderColor: 'divider' }}
              >
                <FavoriteIcon />
              </IconButton>
              
              <IconButton
                size="large"
                sx={{ border: 1, borderColor: 'divider' }}
                onClick={handleShare}
              >
                <ShareIcon />
              </IconButton>
            </Box>

            {/* Additional Info */}
            <Divider />
            
            <Box>
              <Typography variant="h6" gutterBottom>
                Product Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Product ID:</strong> {product.productId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Category:</strong> {product.categoryName || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Added on:</strong> {new Date(product.createdAt).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Last updated:</strong> {new Date(product.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProductDetailsPage;
