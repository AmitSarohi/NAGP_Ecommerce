import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { categoryAPI } from '../services/api';

const AddCategoryPage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  // Load categories on component mount
  React.useEffect(() => {
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

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      if (editingCategory) {
        // Update existing category
        await categoryAPI.updateCategory(editingCategory.categoryId, data);
        toast.success('Category updated successfully!');
        setEditingCategory(null);
      } else {
        // Create new category
        await categoryAPI.createCategory(data);
        toast.success('Category created successfully!');
      }

      // Reset form
      reset();
      
      // Reload categories
      await loadCategories();
      
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to save category');
      console.error('Error saving category:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setValue('name', category.name);
    setValue('description', category.description || '');
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await categoryAPI.deleteCategory(categoryId);
      toast.success('Category deleted successfully!');
      await loadCategories();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete category');
      console.error('Error deleting category:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    reset();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {editingCategory 
            ? 'Update the category details below.'
            : 'Create a new category to organize your products.'
          }
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Add/Edit Category Form */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Controller
                    name="name"
                    control={control}
                    defaultValue=""
                    rules={{ 
                      required: 'Category name is required',
                      minLength: {
                        value: 1,
                        message: 'Category name must be at least 1 character'
                      },
                      maxLength: {
                        value: 100,
                        message: 'Category name must be less than 100 characters'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Category Name"
                        fullWidth
                        error={!!errors.name}
                        helperText={errors.name?.message}
                        placeholder="e.g., Electronics"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="description"
                    control={control}
                    defaultValue=""
                    rules={{
                      maxLength: {
                        value: 500,
                        message: 'Description must be less than 500 characters'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Description"
                        fullWidth
                        multiline
                        rows={4}
                        error={!!errors.description}
                        helperText={errors.description?.message}
                        placeholder="Describe this category..."
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    {editingCategory && (
                      <Button
                        variant="outlined"
                        onClick={handleCancelEdit}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                      disabled={submitting}
                      size="large"
                    >
                      {submitting 
                        ? (editingCategory ? 'Updating...' : 'Creating...') 
                        : (editingCategory ? 'Update Category' : 'Create Category')
                      }
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        {/* Existing Categories List */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Existing Categories
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {categories.length} categories total
            </Typography>

            {categories.length === 0 ? (
              <Alert severity="info">
                No categories found. Create your first category!
              </Alert>
            ) : (
              <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                {categories.map((category) => (
                  <ListItem
                    key={category.categoryId}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight={500}>
                            {category.name}
                          </Typography>
                          {category.isActive ? (
                            <Chip label="Active" size="small" color="success" />
                          ) : (
                            <Chip label="Inactive" size="small" color="default" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          {category.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {category.description}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            ID: {category.categoryId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                            Created: {new Date(category.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditCategory(category)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteCategory(category.categoryId)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
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
