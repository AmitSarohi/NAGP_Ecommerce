import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Person as PersonIcon, Edit as EditIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
  const { user, updateProfile, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const result = await updateProfile({
      firstName: data.firstName,
      lastName: data.lastName,
    });
    
    if (result.success) {
      setIsEditing(false);
    }
    
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    reset({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">
          Please log in to view your profile.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
          My Profile
        </Typography>

        <Grid container spacing={4}>
          {/* Profile Header */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                }}
              >
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Divider sx={{ width: '100%', mb: 3 }} />

          {/* Profile Form */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Personal Information
              </Typography>
              {!isEditing && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </Box>

            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    disabled={!isEditing}
                    {...register('firstName', {
                      required: 'First name is required',
                      minLength: {
                        value: 2,
                        message: 'First name must be at least 2 characters',
                      },
                    })}
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    disabled={!isEditing}
                    {...register('lastName', {
                      required: 'Last name is required',
                      minLength: {
                        value: 2,
                        message: 'Last name must be at least 2 characters',
                      },
                    })}
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    disabled
                    value={user.email}
                    helperText="Email cannot be changed"
                  />
                </Grid>
              </Grid>

              {isEditing && (
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              )}
            </Box>
          </Grid>

          <Divider sx={{ width: '100%', my: 3 }} />

          {/* Account Statistics */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Account Activity
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" fontWeight={600}>
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Orders Placed
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" fontWeight={600}>
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Wishlist Items
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" fontWeight={600}>
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reviews
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ width: '100%', my: 3 }} />

          {/* Account Actions */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Account Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button variant="outlined" sx={{ justifyContent: 'flex-start' }}>
                View Order History
              </Button>
              <Button variant="outlined" sx={{ justifyContent: 'flex-start' }}>
                Manage Addresses
              </Button>
              <Button variant="outlined" sx={{ justifyContent: 'flex-start' }}>
                Payment Methods
              </Button>
              <Button variant="outlined" sx={{ justifyContent: 'flex-start' }}>
                Notification Preferences
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ProfilePage;
