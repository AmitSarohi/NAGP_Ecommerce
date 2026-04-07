import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    // 🔥 IMPORTANT: clear old token
    localStorage.removeItem('token');

    const result = await registerUser({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
    });

    if (result.success) {
      // ✅ Better UX (recommended)
      navigate('/login');
      // OR if auto-login desired:
      // navigate('/');
    }

    setIsSubmitting(false);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Paper sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Create Account
          </Typography>

          <Typography variant="body2" sx={{ mb: 3 }}>
            Join us today!
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  {...register('firstName', {
                    required: 'Required',
                    minLength: { value: 2, message: 'Min 2 chars' },
                  })}
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  {...register('lastName', {
                    required: 'Required',
                    minLength: { value: 2, message: 'Min 2 chars' },
                  })}
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                />
              </Grid>

            </Grid>

            <TextField
              fullWidth
              margin="normal"
              label="Email"
              type="email"
              {...register('email', {
                required: 'Email required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email',
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              {...register('password', {
                required: 'Password required',
                minLength: { value: 6, message: 'Min 6 chars' },
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Confirm Password"
              type="password"
              {...register('confirmPassword', {
                required: 'Confirm password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              sx={{ mt: 3 }}
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? (
                <CircularProgress size={20} />
              ) : (
                'Create Account'
              )}
            </Button>

            <Typography sx={{ mt: 2, textAlign: 'center' }}>
              Already have an account?{' '}
              <Link component="button" onClick={() => navigate('/login')}>
                Sign In
              </Link>
            </Typography>

          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;