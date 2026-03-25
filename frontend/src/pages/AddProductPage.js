import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { productAPI, categoryAPI } from '../services/api';

const AddProductPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState(['']);
  const [attributes, setAttributes] = useState([{ key: '', value: '' }]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryAPI.getCategories();
      setCategories(data.data || []);
    } catch (error) {
      toast.error('Failed to load categories');
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const addImageField = () => {
    setImages([...images, '']);
  };

  const removeImageField = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handleImageChange = (index, value) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const addAttributeField = () => {
    setAttributes([...attributes, { key: '', value: '' }]);
  };

  const removeAttributeField = (index) => {
    const newAttributes = attributes.filter((_, i) => i !== index);
    setAttributes(newAttributes);
  };

  const handleAttributeChange = (index, field, value) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = value;
    setAttributes(newAttributes);
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      // Filter out empty images and attributes
      const validImages = images.filter(img => img.trim() !== '');
      const validAttributes = attributes
        .filter(attr => attr.key.trim() !== '' && attr.value.trim() !== '')
        .reduce((acc, attr) => {
          acc[attr.key] = attr.value;
          return acc;
        }, {});

      const productData = {
        ...data,
        images: validImages,
        attributes: validAttributes,
        inventoryCount: parseInt(data.inventoryCount) || 0,
        price: parseFloat(data.price),
      };

      const result = await productAPI.createProduct(productData);
      toast.success('Product created successfully!');
      
      // Reset form
      reset();
      setImages(['']);
      setAttributes([{ key: '', value: '' }]);
      
      // Navigate to product details or products list
      setTimeout(() => {
        navigate(`/product/${result.productId}`);
      }, 1500);
      
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to create product');
      console.error('Error creating product:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Add New Product
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Fill in the details below to add a new product to your catalog.
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="sku"
                control={control}
                defaultValue=""
                rules={{ required: 'SKU is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="SKU"
                    fullWidth
                    error={!!errors.sku}
                    helperText={errors.sku?.message}
                    placeholder="e.g., LAPTOP-001"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="name"
                control={control}
                defaultValue=""
                rules={{ required: 'Product name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Product Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    placeholder="e.g., Premium Laptop Pro"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                defaultValue=""
                rules={{ required: 'Description is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    multiline
                    rows={4}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    placeholder="Describe your product in detail..."
                  />
                )}
              />
            </Grid>

            {/* Pricing and Inventory */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Pricing & Inventory
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="price"
                control={control}
                defaultValue=""
                rules={{ 
                  required: 'Price is required',
                  pattern: {
                    value: /^\d+(\.\d{1,2})?$/,
                    message: 'Please enter a valid price'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Price ($)"
                    fullWidth
                    type="number"
                    error={!!errors.price}
                    helperText={errors.price?.message}
                    placeholder="0.00"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="inventoryCount"
                control={control}
                defaultValue="0"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Inventory Count"
                    fullWidth
                    type="number"
                    error={!!errors.inventoryCount}
                    helperText={errors.inventoryCount?.message}
                    placeholder="0"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="categoryId"
                control={control}
                defaultValue=""
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.categoryId}>
                    <InputLabel>Category</InputLabel>
                    <Select {...field} label="Category">
                      {categories.map((category) => (
                        <MenuItem key={category.categoryId} value={category.categoryId}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.categoryId && (
                      <Typography variant="caption" color="error">
                        {errors.categoryId.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Images */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Product Images
              </Typography>
            </Grid>

            {images.map((image, index) => (
              <Grid item xs={12} key={index}>
                <Box display="flex" gap={1} alignItems="center">
                  <TextField
                    value={image}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    label={`Image URL ${index + 1}`}
                    fullWidth
                    placeholder="https://example.com/product-image.jpg"
                  />
                  {images.length > 1 && (
                    <IconButton
                      color="error"
                      onClick={() => removeImageField(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Button
                startIcon={<AddIcon />}
                onClick={addImageField}
                variant="outlined"
                size="small"
              >
                Add Another Image
              </Button>
            </Grid>

            {/* Custom Attributes */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Custom Attributes
              </Typography>
            </Grid>

            {attributes.map((attr, index) => (
              <Grid item xs={12} key={index}>
                <Box display="flex" gap={1} alignItems="center">
                  <TextField
                    value={attr.key}
                    onChange={(e) => handleAttributeChange(index, 'key', e.target.value)}
                    label="Attribute Name"
                    placeholder="e.g., Brand, Color, Size"
                  />
                  <TextField
                    value={attr.value}
                    onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                    label="Attribute Value"
                    placeholder="e.g., Nike, Red, Large"
                  />
                  {attributes.length > 1 && (
                    <IconButton
                      color="error"
                      onClick={() => removeAttributeField(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Button
                startIcon={<AddIcon />}
                onClick={addAttributeField}
                variant="outlined"
                size="small"
              >
                Add Another Attribute
              </Button>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={submitting}
                  size="large"
                >
                  {submitting ? 'Creating...' : 'Create Product'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default AddProductPage;
