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
  const { login, isLoading, error, setAuthData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (token) {
      const user = userParam
        ? JSON.parse(decodeURIComponent(userParam))
        : null;

      localStorage.removeItem('token');
      setAuthData(user, token);
      navigate('/');
    }
  }, [searchParams]);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    localStorage.removeItem('token'); // important fix
    const result = await login(data.email, data.password);
    if (result.success) navigate('/');
    setIsSubmitting(false);
  };

  return (
    <Container maxWidth="sm">
      <Box mt={8}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4">Sign In</Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField fullWidth label="Email" {...register('email')} />
            <TextField fullWidth label="Password" type="password" {...register('password')} />

            <Button type="submit" fullWidth disabled={isSubmitting || isLoading}>
              {isSubmitting ? <CircularProgress size={20} /> : 'Login'}
            </Button>
          </form>

          <Divider>OR</Divider>

          <Button
            fullWidth
            startIcon={<GoogleIcon />}
            onClick={() => window.location.href = '/api/auth/google'}
          >
            Google Login
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;