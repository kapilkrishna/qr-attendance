import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

console.log('API_BASE_URL:', API_BASE_URL);
console.log('VITE_API_BASE_URL env var:', import.meta.env.VITE_API_BASE_URL);

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [name, setName] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      console.log('Fetching packages from:', `${API_BASE_URL}/packages`);
      const response = await fetch(`${API_BASE_URL}/packages`);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      if (!response.ok) throw new Error('Failed to fetch packages');
      const data = await response.json();
      console.log('Packages data:', data);
      setPackages(data);
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (pkg) => {
    setDialogOpen(true);
    setSelectedPackage(pkg);
    setName('');
    setSuccess('');
    setError('');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPackage(null);
    setSuccess('');
    setError('');
  };

  const handleSubmit = async () => {
    if (!name.trim() || !selectedPackage) {
      setError('Please enter your name.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      // Create user (or get existing)
      let userId = null;
      let userEmail = `${name.trim().toLowerCase().replace(/ /g, '.') + '@tennisacademy.com'}`;
      let userRes = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: userEmail, role: 'student' })
      });
      if (userRes.ok) {
        const user = await userRes.json();
        userId = user.id;
      } else {
        // If user already exists, fetch all users and find by name
        const allUsersRes = await fetch(`${API_BASE_URL}/users`);
        const users = await allUsersRes.json();
        const user = users.find(u => u.name.trim().toLowerCase() === name.trim().toLowerCase());
        if (user) userId = user.id;
      }
      if (!userId) {
        setError('Could not create or find user.');
        return;
      }
      
      setDialogOpen(false);
      navigate('/qr', { state: { name, packageName: selectedPackage.name } });
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (packages.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Alert severity="info" sx={{ maxWidth: 500, mx: 'auto' }}>
          No packages are currently available. Please check back later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={4} alignItems="flex-start" sx={{ mt: 2, mb: 4, maxWidth: '900px', mx: 'auto' }}>
        {packages.map((pkg) => (
          <Grid item xs={12} sm={8} md={6} key={pkg.id} display="flex" justifyContent="center">
            <Card
              sx={{
                width: { xs: '90vw', sm: 380, md: 420 },
                minWidth: { xs: '90vw', sm: 380, md: 420 },
                maxWidth: { xs: '90vw', sm: 500, md: 500 },
                minHeight: { xs: 320, md: 400 },
                height: { xs: 'auto', md: 400 },
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(30, 44, 80, 0.92)',
                borderRadius: '22px',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
                color: '#fff',
                p: 3,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-6px) scale(1.03)',
                  boxShadow: '0 16px 40px 0 rgba(31, 38, 135, 0.35)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#fff', fontSize: '1.8rem' }}>
                  {pkg.name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, flexGrow: 1, color: '#e0e0e0', fontWeight: 500, lineHeight: 1.6, fontSize: '1.2rem' }}>
                  {pkg.description}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: '#a259ff', fontWeight: 600, fontSize: '1.1rem' }}>
                  Class Date: {new Date(pkg.start_date).toLocaleDateString()}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 'auto',
                    background: 'linear-gradient(90deg, #a259ff 0%, #3a8dde 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    borderRadius: '12px',
                    py: 1.2,
                    boxShadow: '0 4px 16px 0 rgba(162,89,255,0.18)',
                    textTransform: 'none',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #3a8dde 0%, #a259ff 100%)',
                      boxShadow: '0 8px 24px 0 rgba(162,89,255,0.28)'
                    }
                  }}
                  onClick={() => handleOpenDialog(pkg)}
                >
                  Register
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} PaperProps={{
        sx: {
          background: 'rgba(30, 44, 80, 0.98)',
          borderRadius: '22px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
          color: '#fff',
        }
      }}>
        <DialogTitle sx={{ color: '#fff', fontWeight: 700, fontSize: '1.5rem' }}>
          Register for {selectedPackage?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2, color: '#e0e0e0' }}>
            Class Date: {selectedPackage ? new Date(selectedPackage.start_date).toLocaleDateString() : ''}
          </Typography>
          <TextField
            label="Full Name *"
            fullWidth
            margin="normal"
            value={name}
            onChange={e => setName(e.target.value)}
            InputProps={{
              sx: {
                borderRadius: '12px',
                background: 'rgba(44, 62, 100, 0.85)',
                color: '#fff',
                input: { color: '#fff' },
                '& .MuiInputBase-input::placeholder': { color: '#bdbdbd', opacity: 1 }
              }
            }}
            InputLabelProps={{ sx: { color: '#bdbdbd' } }}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 3 }}>
          <Button onClick={handleCloseDialog} sx={{
            color: '#fff',
            borderRadius: '12px',
            fontWeight: 600,
            px: 3,
            py: 1.2,
            background: 'rgba(44, 62, 100, 0.7)',
            '&:hover': { background: 'rgba(44, 62, 100, 1)' }
          }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!name.trim()}
            sx={{
              background: 'linear-gradient(90deg, #a259ff 0%, #3a8dde 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1.1rem',
              borderRadius: '12px',
              py: 1.2,
              px: 4,
              boxShadow: '0 4px 16px 0 rgba(162,89,255,0.18)',
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(90deg, #3a8dde 0%, #a259ff 100%)',
                boxShadow: '0 8px 24px 0 rgba(162,89,255,0.28)'
              }
            }}
          >
            Generate QR Code
          </Button>
        </DialogActions>
      </Dialog>
      {success && <Alert severity="success" sx={{ mt: 4, maxWidth: 500, mx: 'auto' }}>{success}</Alert>}
    </Box>
  );
} 