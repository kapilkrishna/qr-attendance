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

const API_BASE_URL = 'http://localhost:8001/api';

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

      <Grid container spacing={3}>
        {packages.map((pkg) => (
          <Grid item xs={12} md={6} lg={3} key={pkg.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom>
                  {pkg.name}
                </Typography>
                <Chip 
                  label={pkg.duration_type === 'class' ? 'Per Class' : 'Per Week'}
                  color="primary"
                  size="small"
                  sx={{ mb: 2, alignSelf: 'flex-start' }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                  {pkg.description}
                </Typography>
                <Box sx={{ mt: 'auto' }}>
                  <Typography variant="h5" color="primary" gutterBottom>
                    ${pkg.price}
                    <Typography component="span" variant="body2" color="text.secondary">
                      {pkg.duration_type === 'class' ? '/class' : '/week'}
                    </Typography>
                  </Typography>
                  {pkg.num_classes && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {pkg.num_classes} classes included
                    </Typography>
                  )}
                  {pkg.num_weeks && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {pkg.num_weeks} weeks included
                    </Typography>
                  )}
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={() => handleOpenPurchase(pkg)}
                    sx={{ mt: 2 }}
                  >
                    Buy Now
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={purchaseOpen} onClose={handleClosePurchase}>
        <DialogTitle>Purchase Package</DialogTitle>
        <DialogContent>
          <TextField
            label="Full Name *"
            fullWidth
            margin="normal"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            label="Email *"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
          {options.length > 0 && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Select {selectedPackage?.duration_type === 'class' ? 'Date' : 'Week'}</InputLabel>
              <Select
                value={selectedOptionId}
                label={`Select ${selectedPackage?.duration_type === 'class' ? 'Date' : 'Week'}`}
                onChange={e => setSelectedOptionId(e.target.value)}
              >
                {options.map(opt => (
                  <MenuItem key={opt.id} value={opt.id}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {purchaseError && <Alert severity="error" sx={{ mt: 2 }}>{purchaseError}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePurchase}>Cancel</Button>
          <Button
            onClick={handlePurchase}
            variant="contained"
            disabled={submitting || !formData.name || !formData.email || !selectedOptionId}
          >
            Purchase
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 