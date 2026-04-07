import React, { useState } from 'react';
import {
  Box, Container, Typography, Paper, TextField,
  Button, Grid, FormControl, InputLabel,
  Select, MenuItem, IconButton, CircularProgress
} from '@mui/material';

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { productAPI, categoryAPI } from '../services/api';

const AddProductPage = () => {
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState(['']);
  const [attributes, setAttributes] = useState([{ key: '', value: '' }]);

  const { control, handleSubmit, formState: { errors }, reset } = useForm();

  /* =========================
     LOAD CATEGORIES (FIXED)
  ========================= */
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryAPI.getCategories,
  });

  /* =========================
     IMAGE HANDLERS
  ========================= */
  const addImageField = () => setImages([...images, '']);
  const removeImageField = (i) =>
    setImages(images.filter((_, idx) => idx !== i));

  const handleImageChange = (i, value) => {
    const arr = [...images];
    arr[i] = value;
    setImages(arr);
  };

  /* =========================
     ATTRIBUTE HANDLERS
  ========================= */
  const addAttributeField = () =>
    setAttributes([...attributes, { key: '', value: '' }]);

  const removeAttributeField = (i) =>
    setAttributes(attributes.filter((_, idx) => idx !== i));

  const handleAttributeChange = (i, field, value) => {
    const arr = [...attributes];
    arr[i][field] = value;
    setAttributes(arr);
  };

  /* =========================
     SUBMIT
  ========================= */
  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      const productData = {
        ...data,
        images: images.filter((i) => i.trim()),
        attributes: attributes.reduce((acc, a) => {
          if (a.key && a.value) acc[a.key] = a.value;
          return acc;
        }, {}),
        price: parseFloat(data.price),
        inventoryCount: parseInt(data.inventoryCount || 0),
      };

      const res = await productAPI.createProduct(productData);

      toast.success('Product created!');
      reset();
      navigate(`/product/${res.productId}`);

    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <Box textAlign="center" py={6}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>

      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
        Back
      </Button>

      <Typography variant="h4" gutterBottom>
        Add Product
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>

            {/* BASIC */}
            <Grid item xs={6}>
              <Controller
                name="sku"
                control={control}
                rules={{ required: 'SKU required' }}
                render={({ field }) => (
                  <TextField {...field} label="SKU" fullWidth
                    error={!!errors.sku}
                    helperText={errors.sku?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name required' }}
                render={({ field }) => (
                  <TextField {...field} label="Name" fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                rules={{ required: 'Description required' }}
                render={({ field }) => (
                  <TextField {...field} label="Description" fullWidth multiline
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            {/* PRICING */}
            <Grid item xs={4}>
              <Controller
                name="price"
                control={control}
                rules={{
                  required: 'Price required',
                  min: { value: 1, message: 'Must be > 0' }
                }}
                render={({ field }) => (
                  <TextField {...field} label="Price" type="number" fullWidth
                    error={!!errors.price}
                    helperText={errors.price?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={4}>
              <Controller
                name="inventoryCount"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Inventory" type="number" fullWidth />
                )}
              />
            </Grid>

            {/* CATEGORY */}
            <Grid item xs={4}>
              <Controller
                name="categoryId"
                control={control}
                rules={{ required: 'Category required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.categoryId}>
                    <InputLabel>Category</InputLabel>
                    <Select {...field} label="Category">
                      {categories.map((c) => (
                        <MenuItem key={c.categoryId} value={c.categoryId}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* IMAGES */}
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
            <Grid item xs={12} textAlign="right">
              <Button
                type="submit"
                variant="contained"
                startIcon={!submitting && <SaveIcon />}
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={20} /> : 'Create'}
              </Button>
            </Grid>

          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default AddProductPage;