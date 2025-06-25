import { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Button, 
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';

const API_BASE_URL = 'http://localhost:8000/api';

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [purchaseError, setPurchaseError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/packages`)
      .then(res => res.json())
      .then(data => {
        setPackages(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load packages. Please try again later.');
        setLoading(false);
      });
  }, []);

  // Fetch options when a package is selected
  useEffect(() => {
    if (selectedPackage) {
      setOptions([]);
      setSelectedOptionId('');
      fetch(`${API_BASE_URL}/packages/${selectedPackage.id}/options`)
        .then(res => res.json())
        .then(data => setOptions(data))
        .catch(() => setOptions([]));
    }
  }, [selectedPackage]);

  const handleOpenPurchase = (pkg) => {
    setSelectedPackage(pkg);
    setPurchaseOpen(true);
    setFormData({ name: '', email: '' });
    setSuccess('');
    setPurchaseError('');
  };

  const handleClosePurchase = () => {
    setPurchaseOpen(false);
    setSelectedPackage(null);
    setOptions([]);
    setSelectedOptionId('');
  };

  const handlePurchase = async () => {
    setSubmitting(true);
    setSuccess('');
    setPurchaseError('');
    try {
      let userId = null;
      // Try to create user first
      try {
        const createUserRes = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, email: formData.email, role: 'student' })
        });
        if (createUserRes.ok) {
          const user = await createUserRes.json();
          userId = user.id;
        } else {
          const errorData = await createUserRes.json();
          if (errorData.detail === 'Email already registered') {
            // Fetch all users and find by email
            const userRes = await fetch(`${API_BASE_URL}/users`);
            const users = await userRes.json();
            const user = users.find(u => u.email === formData.email);
            if (user) userId = user.id;
          } else {
            throw new Error(errorData.detail || 'Failed to create user');
          }
        }
      } catch (err) {
        setSubmitting(false);
        setPurchaseError('Failed to create user.');
        return;
      }
      if (!userId) {
        setSubmitting(false);
        setPurchaseError('User not found or created.');
        return;
      }
      // Find selected option
      const selectedOption = options.find(opt => String(opt.id) === String(selectedOptionId));
      if (!selectedOption) {
        setSubmitting(false);
        setPurchaseError('Please select a date or week.');
        return;
      }
      // Register for package
      const regRes = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          package_id: selectedPackage.id,
          start_date: selectedOption.start_date,
          end_date: selectedOption.end_date,
          status: 'active'
        })
      });
      if (regRes.ok) {
        setSuccess('Purchase successful!');
        setPurchaseOpen(false);
      } else {
        const errorData = await regRes.json();
        setPurchaseError(errorData.detail || 'Failed to create registration.');
      }
    } catch (err) {
      setPurchaseError('Failed to complete purchase.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom align="center">
        Tennis Academy Packages
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Choose the perfect package for your tennis journey
      </Typography>

      <Grid container spacing={4} alignItems="flex-start" sx={{ mt: 2, mb: 4, maxWidth: '900px', mx: 'auto' }}>
        {packages.map((pkg, idx) => (
          <Grid item xs={12} sm={8} md={6} key={pkg.id} display="flex" sx={{
            ml: { md: idx % 2 === 0 ? 0 : 'auto' },
            mr: { md: idx % 2 === 0 ? 'auto' : 0 },
            justifyContent: 'flex-start'
          }}>
            <Card 
              sx={{ 
                height: '100%', 
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
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#fff', fontSize: '1.3rem' }}>
                  {pkg.name}
                </Typography>
                <Chip 
                  label={pkg.duration_type === 'class' ? 'Per Class' : 'Per Week'}
                  sx={{ mb: 2, alignSelf: 'flex-start', background: '#a259ff', color: '#fff', fontWeight: 600, fontSize: '0.9rem', borderRadius: '8px' }}
                />
                <Typography variant="body2" sx={{ mb: 2, flexGrow: 1, color: '#e0e0e0', fontWeight: 500 }}>
                  {pkg.description}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', mt: 2, mb: 1 }}>
                  ${pkg.price}
                  <Typography component="span" variant="body2" sx={{ color: '#bdbdbd', fontWeight: 400 }}>
                    /{pkg.duration_type}
                  </Typography>
                </Typography>
                <Typography variant="body2" sx={{ color: '#bdbdbd', mb: 2 }}>
                  {pkg.classes_included} classes included<br/>
                  {pkg.weeks_included} weeks included
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
                  onClick={() => handleOpenPurchase(pkg)}
                >
                  Buy Now
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={purchaseOpen} onClose={handleClosePurchase} PaperProps={{
        sx: {
          background: 'rgba(30, 44, 80, 0.98)',
          borderRadius: '22px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
          color: '#fff',
        }
      }}>
        <DialogTitle sx={{ color: '#fff', fontWeight: 700, fontSize: '1.5rem' }}>Purchase Package</DialogTitle>
        <DialogContent>
          <TextField
            label="Full Name *"
            fullWidth
            margin="normal"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
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
          <TextField
            label="Email *"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
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
          {options.length > 0 && (
            <FormControl fullWidth margin="normal" sx={{
              '& .MuiInputBase-root': {
                borderRadius: '12px',
                background: 'rgba(44, 62, 100, 0.85)',
                color: '#fff',
              },
              '& .MuiInputLabel-root': { color: '#bdbdbd' },
              '& .MuiSelect-icon': { color: '#fff' },
              '& .MuiMenu-paper': {
                background: 'rgba(44, 62, 100, 0.98)',
                color: '#fff',
              }
            }}>
              <InputLabel>Select {selectedPackage?.duration_type === 'class' ? 'Date' : 'Week'}</InputLabel>
              <Select
                value={selectedOptionId}
                label={`Select ${selectedPackage?.duration_type === 'class' ? 'Date' : 'Week'}`}
                onChange={e => setSelectedOptionId(e.target.value)}
                sx={{ color: '#fff' }}
              >
                {options.map(opt => (
                  <MenuItem key={opt.id} value={opt.id} sx={{ color: '#fff', background: 'rgba(44, 62, 100, 0.98)' }}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {purchaseError && <Alert severity="error" sx={{ mt: 2 }}>{purchaseError}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 3 }}>
          <Button onClick={handleClosePurchase} sx={{
            color: '#fff',
            borderRadius: '12px',
            fontWeight: 600,
            px: 3,
            py: 1.2,
            background: 'rgba(44, 62, 100, 0.7)',
            '&:hover': { background: 'rgba(44, 62, 100, 1)' }
          }}>Cancel</Button>
          <Button
            onClick={handlePurchase}
            variant="contained"
            disabled={submitting || !formData.name || !formData.email || !selectedOptionId}
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
            Purchase
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 