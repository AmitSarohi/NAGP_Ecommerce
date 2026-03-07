import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Grid,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
} from '@mui/icons-material';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Shop',
      links: [
        { text: 'All Products', href: '/search' },
        { text: 'Categories', href: '/categories' },
        { text: 'Deals', href: '/deals' },
        { text: 'New Arrivals', href: '/new' },
      ],
    },
    {
      title: 'Customer Service',
      links: [
        { text: 'Contact Us', href: '/contact' },
        { text: 'Shipping Info', href: '/shipping' },
        { text: 'Returns', href: '/returns' },
        { text: 'FAQ', href: '/faq' },
      ],
    },
    {
      title: 'About',
      links: [
        { text: 'About Us', href: '/about' },
        { text: 'Careers', href: '/careers' },
        { text: 'Press', href: '/press' },
        { text: 'Partners', href: '/partners' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { text: 'Privacy Policy', href: '/privacy' },
        { text: 'Terms of Service', href: '/terms' },
        { text: 'Cookie Policy', href: '/cookies' },
        { text: 'Accessibility', href: '/accessibility' },
      ],
    },
  ];

  const socialLinks = [
    { icon: FacebookIcon, href: '#', label: 'Facebook' },
    { icon: TwitterIcon, href: '#', label: 'Twitter' },
    { icon: InstagramIcon, href: '#', label: 'Instagram' },
    { icon: LinkedInIcon, href: '#', label: 'LinkedIn' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'primary.main',
        color: 'white',
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        {/* Main Footer Content */}
        <Box sx={{ py: 6 }}>
          <Grid container spacing={4}>
            {/* Brand Section */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                E-Commerce Platform
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
                Your trusted online shopping destination for quality products and exceptional service.
              </Typography>
              
              {/* Social Links */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {socialLinks.map((social) => (
                  <IconButton
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{
                      color: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.2)',
                      },
                    }}
                    aria-label={social.label}
                  >
                    <social.icon fontSize="small" />
                  </IconButton>
                ))}
              </Box>
            </Grid>

            {/* Footer Links */}
            {footerSections.map((section) => (
              <Grid item xs={6} md={2} key={section.title}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  {section.title}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {section.links.map((link) => (
                    <Link
                      key={link.text}
                      href={link.href}
                      color="inherit"
                      underline="none"
                      sx={{
                        opacity: 0.8,
                        fontSize: '0.875rem',
                        '&:hover': {
                          opacity: 1,
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {link.text}
                    </Link>
                  ))}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />

        {/* Bottom Section */}
        <Box
          sx={{
            py: 3,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'flex-start' },
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            © {currentYear} E-Commerce Platform. All rights reserved.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Powered by AWS Microservices Architecture
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
