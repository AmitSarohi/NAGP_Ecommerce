import React, { useState } from 'react';
import {
  Box, Container, Typography, Paper, TextField,
  Button, Grid, CircularProgress, Alert,
  List, ListItem, ListItemText, Chip, IconButton
} from '@mui/material';

import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { categoryAPI } from '../services/api';

const AddCategoryPage = () => {
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  /* =========================
     FETCH CATEGORIES (FIXED)
  ========================= */
  const {
    data: categories = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryAPI.getCategories,
  });

  /* =========================
     SUBMIT
  ========================= */
  const onSubmit = async (formData) => {
    try {
      setSubmitting(true);

      if (editingCategory) {
        await categoryAPI.updateCategory(
          editingCategory.categoryId,
          formData
        );
        toast.success('Category updated!');
      } else {
        await categoryAPI.createCategory(formData);
        toast.success('Category created!');
      }

      reset();
      setEditingCategory(null);
      refetch();

    } catch (error) {
      toast.error('Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     EDIT
  ========================= */
  const handleEdit = (cat) => {
    setEditingCategory(cat);
    setValue('name', cat.name);
    setValue('description', cat.description || '');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    reset();
  };

  /* =========================
     DELETE
  ========================= */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;

    try {
      await categoryAPI.deleteCategory(id);
      toast.success('Deleted!');
      refetch();
    } catch {
      toast.error('Delete failed');
    }
  };

  if (isLoading) {
    return (
      <Box textAlign="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">

      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
        Back
      </Button>

      <Typography variant="h4" mt={2}>
        {editingCategory ? 'Edit Category' : 'Add Category'}
      </Typography>

      <Grid container spacing={4} mt={1}>

        {/* FORM */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>

            <form onSubmit={handleSubmit(onSubmit)}>

              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message} // ✅ FIX
                  />
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    sx={{ mt: 2 }}
                  />
                )}
              />

              <Box mt={2} display="flex" gap={2}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={!submitting && <SaveIcon />}
                  fullWidth
                  disabled={submitting}
                >
                  {submitting ? <CircularProgress size={20} /> :
                    editingCategory ? 'Update' : 'Create'}
                </Button>

                {editingCategory && (
                  <Button onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                )}
              </Box>

            </form>
          </Paper>
        </Grid>

        {/* LIST */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>

            <Typography>{categories.length} Categories</Typography>

            {categories.length === 0 ? (
              <Alert>No categories found</Alert>
            ) : (
              <List>
                {categories.map((cat) => (
                  <ListItem key={cat.categoryId}>
                    <ListItemText
                      primary={cat.name}
                      secondary={cat.description}
                    />

                    <Chip
                      label={cat.isActive ? 'Active' : 'Inactive'}
                      color={cat.isActive ? 'success' : 'default'}
                      sx={{ mr: 1 }}
                    />

                    <IconButton onClick={() => handleEdit(cat)}>
                      <EditIcon />
                    </IconButton>

                    <IconButton onClick={() => handleDelete(cat.categoryId)}>
                      <DeleteIcon />
                    </IconButton>

                  </ListItem>
                ))}
              </List>
            )}

          </Paper>
        </Grid>

      </Grid>
    </Container>
  );
};

export default AddCategoryPage;