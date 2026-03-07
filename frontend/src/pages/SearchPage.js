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

  // Fetch search results
  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['search', searchQuery, filters, page],
    async () => {
      const params = new URLSearchParams({
        q: searchQuery,
        page: page.toString(),
        limit: '12',
        ...filters,
      });

      const response = await axios.get(
        `${process.env.REACT_APP_SEARCH_SERVICE_URL || 'http://localhost:3003'}/api/search?${params}`
      );
      return response.data;
    },
    {
      enabled: !!searchQuery,
      keepPreviousData: true,
    }
  );

  // Fetch categories for filter
  const { data: categories } = useQuery(
    'categories',
    async () => {
      const response = await axios.get(
        `${process.env.REACT_APP_PRODUCT_SERVICE_URL || 'http://localhost:3002'}/api/categories`
      );
      return response.data;
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
    
    // Update URL
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
      {/* Search Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight={600}>
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
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<SearchIcon />}
              sx={{ minWidth: 120 }}
            >
              Search
            </Button>
          </Box>
        </form>

        {searchQuery && (
          <Typography variant="body2" color="text.secondary">
            {isLoading ? 'Searching...' : 
             searchResults ? `Found ${searchResults.total} results for "${searchQuery}"` :
             'No results found'}
          </Typography>
        )}
      </Box>

      <Grid container spacing={4}>
        {/* Filters Sidebar */}
        <Grid item xs={12} md={3}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon />
                Filters
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Category Filter */}
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.categoryId}
                    label="Category"
                    onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories?.map((category) => (
                      <MenuItem key={category.categoryId} value={category.categoryId}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Price Range */}
                <Box>
                  <Typography gutterBottom>Price Range</Typography>
                  <Slider
                    value={[filters.minPrice, filters.maxPrice]}
                    onChange={(e, newValue) => {
                      handleFilterChange('minPrice', newValue[0]);
                      handleFilterChange('maxPrice', newValue[1]);
                    }}
                    valueLabelDisplay="auto"
                    min={0}
                    max={1000}
                    marks={[
                      { value: 0, label: '$0' },
                      { value: 250, label: '$250' },
                      { value: 500, label: '$500' },
                      { value: 750, label: '$750' },
                      { value: 1000, label: '$1000' },
                    ]}
                  />
                </Box>

                {/* Sort By */}
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={filters.sortBy}
                    label="Sort By"
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <MenuItem value="relevance">Relevance</MenuItem>
                    <MenuItem value="price_asc">Price: Low to High</MenuItem>
                    <MenuItem value="price_desc">Price: High to Low</MenuItem>
                    <MenuItem value="name_asc">Name: A to Z</MenuItem>
                    <MenuItem value="name_desc">Name: Z to A</MenuItem>
                    <MenuItem value="newest">Newest First</MenuItem>
                  </Select>
                </FormControl>

                {/* In Stock Filter */}
                <Button
                  variant={filters.inStock ? "contained" : "outlined"}
                  onClick={() => handleFilterChange('inStock', !filters.inStock)}
                  fullWidth
                >
                  In Stock Only
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={9}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Error loading search results. Please try again.
            </Alert>
          )}

          {isLoading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress size={60} />
            </Box>
          ) : searchResults?.products?.length > 0 ? (
            <>
              <Grid container spacing={3}>
                {searchResults.products.map((product) => (
                  <Grid item xs={12} sm={6} md={4} key={product.productId}>
                    <Card className="product-card">
                      <CardMedia
                        component="div"
                        sx={{
                          height: 200,
                          bgcolor: 'grey.200',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '3rem',
                          fontWeight: 'bold',
                          color: 'text.secondary',
                        }}
                      >
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          '📦'
                        )}
                      </CardMedia>
                      <CardContent>
                        <Typography gutterBottom variant="h6" component="h3">
                          {product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {product.description?.substring(0, 100)}...
                        </Typography>
                        <Typography variant="h6" color="primary.main" fontWeight={600}>
                          {formatPrice(product.price)}
                        </Typography>
                        {product.inventoryCount > 0 ? (
                          <Chip
                            label="In Stock"
                            color="success"
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        ) : (
                          <Chip
                            label="Out of Stock"
                            color="error"
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => navigate(`/product/${product.productId}`)}
                        >
                          View Details
                        </Button>
                        <Button
                          size="small"
                          startIcon={<CartIcon />}
                          disabled={product.inventoryCount === 0}
                        >
                          Add to Cart
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {searchResults.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={searchResults.totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          ) : searchQuery && !isLoading ? (
            <Box textAlign="center" py={8}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No products found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search terms or filters
              </Typography>
            </Box>
          ) : (
            <Box textAlign="center" py={8}>
              <Typography variant="h6" color="text.secondary">
                Enter a search term to find products
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default SearchPage;
