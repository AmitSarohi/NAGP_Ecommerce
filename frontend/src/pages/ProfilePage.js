import React, { useState, useEffect } from 'react';
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
import { Edit as EditIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateProfile, isLoading } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  /* =========================
     FIX: sync form with user
  ========================= */
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    const result = await updateProfile({
      firstName: data.firstName,
      lastName: data.lastName,
    });

    if (result.success) {
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } else {
      toast.error('Failed to update profile');
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
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          My Profile
        </Typography>

        {/* =========================
           HEADER
        ========================= */}
        <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
          <Avatar sx={{ width: 80, height: 80 }}>
            {user.firstName?.[0]}{user.lastName?.[0]}
          </Avatar>

          <Box>
            <Typography variant="h5">
              {user.firstName} {user.lastName}
            </Typography>
            <Typography>{user.email}</Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* =========================
           FORM
        ========================= */}
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Personal Info</Typography>

            {!isEditing && (
              <Button
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                disabled={!isEditing}
                {...register('firstName', { required: 'Required' })}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                disabled={!isEditing}
                {...register('lastName', { required: 'Required' })}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={user.email}
                disabled
              />
            </Grid>
          </Grid>

          {isEditing && (
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button onClick={handleCancel}>Cancel</Button>

              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={20} /> : 'Save'}
              </Button>
            </Box>
          )}

        </Box>

        <Divider sx={{ my: 4 }} />

        {/* =========================
           STATS
        ========================= */}
        <Typography variant="h6">Account Activity</Typography>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {['Orders', 'Wishlist', 'Reviews'].map((label) => (
            <Grid item xs={4} key={label}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5">0</Typography>
                <Typography variant="body2">{label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

      </Paper>
    </Container>
  );
};

export default ProfilePage;