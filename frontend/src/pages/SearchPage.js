import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Pagination,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';

const API_BASE_URL = '/api'; // ✅ works with ingress

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    categoryId: searchParams.get('categoryId') || '',
    minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')) : 0,
    maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')) : 1000,
    inStock: searchParams.get('inStock') === 'true',
    sortBy: searchParams.get('sortBy') || 'relevance',
  });

  const [page, setPage] = useState(1);

  // 🔥 SEARCH API (DIRECT AXIOS)
  const {
    data: searchResults,
    isLoading,
    error,
  } = useQuery(
    ['search', searchQuery, filters, page],
    async () => {
      const response = await axios.get(`${API_BASE_URL}/search`, {
        params: {
          q: searchQuery,
          page,
          limit: 12,
          ...filters,
        },
      });

      return response.data;
    },
    {
      enabled: !!searchQuery,
      keepPreviousData: true,
    }
  );

  // 🔥 CATEGORY API (DIRECT AXIOS)
  const { data: categories } = useQuery(
    'categories',
    async () => {
      const res = await axios.get(`${API_BASE_URL}/categories`);
      return Array.isArray(res.data) ? res.data : res.data.data || [];
    }
  );

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      setPage(1);
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams({ q: searchQuery.trim() });

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== false && value !== 0) {
          params.set(key, value);
        }
      });

      setSearchParams(params);
      setPage(1);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    const params = new URLSearchParams(searchParams);

    if (value !== '' && value !== false && value !== 0) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    setSearchParams(params);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>

      {/* HEADER */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom fontWeight={600}>
          Search Products
        </Typography>

        <form onSubmit={handleSearch}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1 }} />,
              }}
            />
            <Button type="submit" variant="contained">
              Search
            </Button>
          </Box>
        </form>
      </Box>

      <Grid container spacing={4}>

        {/* FILTERS */}
        <Grid item xs={12} md={3}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ display: 'flex', gap: 1 }}>
                <FilterIcon /> Filters
              </Typography>
            </AccordionSummary>

            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                {/* CATEGORY */}
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.categoryId}
                    label="Category"
                    onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories?.map((cat) => (
                      <MenuItem key={cat.categoryId} value={cat.categoryId}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* PRICE */}
                <Box>
                  <Typography gutterBottom>Price Range</Typography>
                  <Slider
                    value={[filters.minPrice, filters.maxPrice]}
                    onChange={(e, val) => {
                      handleFilterChange('minPrice', val[0]);
                      handleFilterChange('maxPrice', val[1]);
                    }}
                    min={0}
                    max={1000}
                  />
                </Box>

              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* RESULTS */}
        <Grid item xs={12} md={9}>
          {error && <Alert severity="error">Error loading results</Alert>}

          {isLoading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : searchResults?.products?.length > 0 ? (
            <Grid container spacing={3}>
              {searchResults.products.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.productId}>
                  <Card>
                    <CardMedia sx={{ height: 200 }}>
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt="" style={{ width: '100%' }} />
                      ) : '📦'}
                    </CardMedia>

                    <CardContent>
                      <Typography variant="h6">{product.name}</Typography>
                      <Typography>{formatPrice(product.price)}</Typography>
                    </CardContent>

                    <CardActions>
                      <Button onClick={() => navigate(`/product/${product.productId}`)}>
                        View Details
                      </Button>
                      <Button startIcon={<CartIcon />} disabled={product.inventoryCount === 0}>
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