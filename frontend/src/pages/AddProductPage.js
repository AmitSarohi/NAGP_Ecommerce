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
  CircularProgress,
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

  // 🔥 LOAD CATEGORIES (FIXED)
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);

      const data = await categoryAPI.getCategories();

      console.log("🔥 Categories API response:", data);

      // ✅ FIXED RESPONSE HANDLING
      const categoriesArray = Array.isArray(data)
        ? data
        : data.data || [];

      setCategories(categoriesArray);

    } catch (error) {
      toast.error('Failed to load categories');
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Images
  const addImageField = () => setImages([...images, '']);
  const removeImageField = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };
  const handleImageChange = (index, value) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  // Attributes
  const addAttributeField = () =>
    setAttributes([...attributes, { key: '', value: '' }]);

  const removeAttributeField = (index) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index, field, value) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = value;
    setAttributes(newAttributes);
  };

  // 🔥 SUBMIT
  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      const validImages = images.filter(img => img.trim() !== '');

      const validAttributes = attributes
        .filter(attr => attr.key && attr.value)
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

      reset();
      setImages(['']);
      setAttributes([{ key: '', value: '' }]);

      setTimeout(() => {
        navigate(`/product/${result.productId}`);
      }, 1200);

    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to create product');
      console.error('Error creating product:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // 🔄 LOADING UI
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
        Back
      </Button>

      <Typography variant="h4" gutterBottom>
        Add New Product
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>

            {/* BASIC */}
            <Grid item xs={12}>
              <Typography variant="h6">Basic Info</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="sku"
                control={control}
                defaultValue=""
                rules={{ required: 'SKU required' }}
                render={({ field }) => (
                  <TextField {...field} label="SKU" fullWidth error={!!errors.sku} />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="name"
                control={control}
                defaultValue=""
                rules={{ required: 'Name required' }}
                render={({ field }) => (
                  <TextField {...field} label="Product Name" fullWidth error={!!errors.name} />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                defaultValue=""
                rules={{ required: 'Description required' }}
                render={({ field }) => (
                  <TextField {...field} label="Description" fullWidth multiline rows={3} />
                )}
              />
            </Grid>

            {/* PRICING */}
            <Grid item xs={12}>
              <Typography variant="h6">Pricing & Inventory</Typography>
            </Grid>

            <Grid item xs={4}>
              <Controller
                name="price"
                control={control}
                defaultValue=""
                rules={{ required: 'Price required' }}
                render={({ field }) => (
                  <TextField {...field} label="Price" type="number" fullWidth />
                )}
              />
            </Grid>

            <Grid item xs={4}>
              <Controller
                name="inventoryCount"
                control={control}
                defaultValue="0"
                render={({ field }) => (
                  <TextField {...field} label="Inventory" type="number" fullWidth />
                )}
              />
            </Grid>

            {/* 🔥 CATEGORY FIXED */}
            <Grid item xs={4}>
              <Controller
                name="categoryId"
                control={control}
                defaultValue=""
                rules={{ required: 'Category required' }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select {...field} label="Category" value={field.value || ''}>
                      {categories.length === 0 ? (
                        <MenuItem disabled>No categories found</MenuItem>
                      ) : (
                        categories.map((category) => (
                          <MenuItem
                            key={category.categoryId}
                            value={category.categoryId}
                          >
                            {category.name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* IMAGES */}
            <Grid item xs={12}>
              <Typography variant="h6">Images</Typography>
            </Grid>

            {images.map((img, i) => (
              <Grid item xs={12} key={i}>
                <Box display="flex" gap={1}>
                  <TextField
                    value={img}
                    onChange={(e) => handleImageChange(i, e.target.value)}
                    fullWidth
                    label={`Image ${i + 1}`}
                  />
                  {images.length > 1 && (
                    <IconButton onClick={() => removeImageField(i)}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Button onClick={addImageField} startIcon={<AddIcon />}>
                Add Image
              </Button>
            </Grid>

            {/* ATTRIBUTES */}
            <Grid item xs={12}>
              <Typography variant="h6">Attributes</Typography>
            </Grid>

            {attributes.map((attr, i) => (
              <Grid item xs={12} key={i}>
                <Box display="flex" gap={1}>
                  <TextField
                    value={attr.key}
                    onChange={(e) => handleAttributeChange(i, 'key', e.target.value)}
                    label="Key"
                  />
                  <TextField
                    value={attr.value}
                    onChange={(e) => handleAttributeChange(i, 'value', e.target.value)}
                    label="Value"
                  />
                  {attributes.length > 1 && (
                    <IconButton onClick={() => removeAttributeField(i)}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Button onClick={addAttributeField} startIcon={<AddIcon />}>
                Add Attribute
              </Button>
            </Grid>

            {/* SUBMIT */}
            <Grid item xs={12}>
              <Box textAlign="right">
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={submitting}
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