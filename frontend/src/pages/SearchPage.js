import React, { useState, useEffect } from 'react';
import {
  Box, Container, Grid, Card, CardMedia,
  CardContent, CardActions, Typography,
  TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Pagination,
  Slider, Accordion, AccordionSummary,
  AccordionDetails, CircularProgress, Alert
} from '@mui/material';

import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';

import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import api from '../services/api'; // ✅ FIX

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    categoryId: searchParams.get('categoryId') || '',
    minPrice: parseInt(searchParams.get('minPrice') || 0),
    maxPrice: parseInt(searchParams.get('maxPrice') || 1000),
  });

  const [page, setPage] = useState(1);

  /* =========================
     SEARCH API
  ========================= */
  const { data, isLoading, error } = useQuery({
    queryKey: ['search', searchQuery, filters, page],
    queryFn: async () => {
      const res = await api.get('/search', {
        params: {
          q: searchQuery,
          page,
          limit: 12,
          ...filters,
        },
      });
      return res.data;
    },
    enabled: !!searchQuery,
    keepPreviousData: true,
  });

  /* =========================
     CATEGORY API
  ========================= */
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  /* =========================
     URL SYNC
  ========================= */
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      setPage(1);
    }
  }, [searchParams]);

  /* =========================
     HANDLERS
  ========================= */
  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Search clicked:", searchQuery); // 👈 ADD
    if (!searchQuery.trim()) return;

    setSearchParams({ q: searchQuery.trim() });
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPage(1);
  };

  const handlePriceChange = (_, val) => {
    setFilters((prev) => ({
      ...prev,
      minPrice: val[0],
      maxPrice: val[1],
    }));
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>

      {/* SEARCH BAR */}
      <form onSubmit={handleSearch}>
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1 }} />,
            }}
          />
          <Button type="submit" variant="contained">Search</Button>
        </Box>
      </form>

      <Grid container spacing={4}>

        {/* FILTERS */}
        <Grid item xs={12} md={3}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              Filters
            </AccordionSummary>

            <AccordionDetails>

              {/* CATEGORY */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.categoryId}
                  label="Category"
                  onChange={(e) =>
                    handleFilterChange('categoryId', e.target.value)
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  {categories?.map((c) => (
                    <MenuItem key={c.categoryId} value={c.categoryId}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* PRICE */}
              <Typography gutterBottom>Price</Typography>
              <Slider
                value={[filters.minPrice, filters.maxPrice]}
                onChange={handlePriceChange} // ✅ FIX
                min={0}
                max={1000}
              />

            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* RESULTS */}
        <Grid item xs={12} md={9}>

          {error && <Alert severity="error">Failed to load</Alert>}

          {isLoading ? (
            <Box textAlign="center" py={6}>
              <CircularProgress />
            </Box>
          ) : data?.products?.length ? (

            <Grid container spacing={3}>
              {data.products.map((p) => (
                <Grid item xs={12} sm={6} md={4} key={p.productId}>
                  <Card>

                    <CardMedia sx={{ height: 200 }}>
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt="" width="100%" />
                      ) : '📦'}
                    </CardMedia>

                    <CardContent>
                      <Typography variant="h6">{p.name}</Typography>
                      <Typography>{formatPrice(p.price)}</Typography>
                    </CardContent>

                    <CardActions>
                      <Button onClick={() => navigate(`/product/${p.productId}`)}>
                        View
                      </Button>

                      <Button disabled={!p.inventoryCount}>
                        Add to Cart
                      </Button>
                    </CardActions>

                  </Card>
                </Grid>
              ))}
            </Grid>

          ) : (
            <Typography>No results found</Typography>
          )}

        </Grid>

      </Grid>
    </Container>
  );
};

export default SearchPage;