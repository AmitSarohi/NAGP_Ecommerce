import React, { useState, useEffect } from 'react';
import {
  Box, Container, Paper, TextField, Button,
  Typography, Alert, CircularProgress, Divider
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading, error, setAuthData, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  /* =========================
     ✅ Redirect if already logged in
  ========================= */
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  /* =========================
     ✅ Handle Google OAuth redirect
  ========================= */
  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (token) {
      const user = userParam
        ? JSON.parse(decodeURIComponent(userParam))
        : null;

      setAuthData(user, token);
      navigate('/');
    }
  }, [searchParams, setAuthData, navigate]);

  /* =========================
     LOGIN
  ========================= */
  const onSubmit = async (data) => {
    setIsSubmitting(true);

    const result = await login(data.email, data.password);

    if (result.success) {
      navigate('/');
    }

    setIsSubmitting(false);
  };

  return (
    <Container maxWidth="sm">
      <Box mt={8}>
        <Paper sx={{ p: 4 }}>

          <Typography variant="h4" mb={2}>
            Sign In
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>

            <TextField
              fullWidth
              label="Email"
              margin="normal"
              {...register('email', {
                required: 'Email is required',
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              margin="normal"
              {...register('password', {
                required: 'Password is required',
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2 }}
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? (
                <CircularProgress size={20} />
              ) : (
                'Login'
              )}
            </Button>

          </form>

          <Divider sx={{ my: 2 }}>OR</Divider>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={() => (window.location.href = '/api/auth/google')}
          >
            Google Login
          </Button>

          {/* REGISTER */}
          <Box mt={3} textAlign="center">
            <Typography variant="body2">
              Don’t have an account?
            </Typography>

            <Button
              variant="text"
              onClick={() => navigate('/register')}
            >
              Register
            </Button>
          </Box>

        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;