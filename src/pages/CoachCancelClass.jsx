import { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  TextField,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function CoachCancelClass() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Check authentication
    if (!localStorage.getItem('coachAuthenticated')) {
      navigate('/coach');
      return;
    }
    
    fetchPackages();
  }, [navigate]);

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/packages`);
      if (!response.ok) throw new Error('Failed to fetch packages');
      const data = await response.json();
      setPackages(data);
      if (data.length > 0) {
        setSelectedPackage(data[0].id);
      }
    } catch (err) {
      setError('Failed to load packages');
      console.error('Error fetching packages:', err);
    }
  };

  useEffect(() => {
    if (selectedPackage && selectedDate) {
      fetchClasses();
    }
  }, [selectedPackage, selectedDate]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/classes?package_id=${selectedPackage}&date=${selectedDate}`
      );
      if (!response.ok) throw new Error('Failed to fetch classes');
      const data = await response.json();
      setClasses(data);
      if (data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (err) {
      setError('Failed to load classes');
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClass = async () => {
    if (!selectedClass) {
      setError('Please select a class to cancel');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/cancel_class/${selectedClass}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to cancel class');
      }

      setSuccess('Class cancelled successfully! Students will be notified via email.');
      
      // Refresh classes list
      fetchClasses();
      
    } catch (err) {
      setError(err.message || 'Failed to cancel class');
      console.error('Cancel class error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('coachAuthenticated');
    navigate('/coach');
  };

  const getSelectedClassInfo = () => {
    return classes.find(cls => cls.id == selectedClass);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Cancel Class
        </Typography>
        <Button variant="outlined" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{
            background: 'rgba(30, 44, 80, 0.92)',
            borderRadius: '22px',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
            color: '#fff',
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 700 }}>
                Select Class to Cancel
              </Typography>
              <FormControl fullWidth sx={{ mb: 2, '& .MuiInputBase-root': { borderRadius: '12px', background: 'rgba(44, 62, 100, 0.85)', color: '#fff' }, '& .MuiInputLabel-root': { color: '#bdbdbd' }, '& .MuiSelect-icon': { color: '#fff' } }}>
                <InputLabel>Package</InputLabel>
                <Select
                  value={selectedPackage}
                  onChange={(e) => setSelectedPackage(e.target.value)}
                  label="Package"
                  sx={{ color: '#fff' }}
                >
                  {packages.map((pkg) => (
                    <MenuItem key={pkg.id} value={pkg.id} sx={{ color: '#fff', background: 'rgba(44, 62, 100, 0.98)' }}>{pkg.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true, sx: { color: '#bdbdbd' } }}
                InputProps={{
                  sx: {
                    borderRadius: '12px',
                    background: 'rgba(44, 62, 100, 0.85)',
                    color: '#fff',
                    input: { color: '#fff' },
                    '& .MuiInputBase-input::placeholder': { color: '#bdbdbd', opacity: 1 }
                  }
                }}
              />
              <FormControl fullWidth sx={{ mb: 2, '& .MuiInputBase-root': { borderRadius: '12px', background: 'rgba(44, 62, 100, 0.85)', color: '#fff' }, '& .MuiInputLabel-root': { color: '#bdbdbd' }, '& .MuiSelect-icon': { color: '#fff' } }}>
                <InputLabel>Class</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  label="Class"
                  disabled={loading || classes.length === 0}
                  sx={{ color: '#fff' }}
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id} sx={{ color: '#fff', background: 'rgba(44, 62, 100, 0.98)' }}>
                      {cls.date} - {cls.cancelled ? 'CANCELLED' : 'Active'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedClass && getSelectedClassInfo() && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(44, 62, 100, 0.85)', borderRadius: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
                    Class Information:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                    <strong>Date:</strong> {getSelectedClassInfo().date}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                    <strong>Status:</strong> 
                    <Chip 
                      label={getSelectedClassInfo().cancelled ? 'CANCELLED' : 'Active'} 
                      color={getSelectedClassInfo().cancelled ? 'error' : 'success'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
              )}
              <Button 
                variant="contained" 
                color="error"
                onClick={handleCancelClass}
                fullWidth
                disabled={submitting || !selectedClass || getSelectedClassInfo()?.cancelled}
                sx={{
                  mt: 2,
                  background: 'linear-gradient(90deg, #ff5f6d 0%, #ffc371 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  borderRadius: '12px',
                  py: 1.2,
                  boxShadow: '0 4px 16px 0 rgba(255,95,109,0.18)',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #ffc371 0%, #ff5f6d 100%)',
                    boxShadow: '0 8px 24px 0 rgba(255,95,109,0.28)'
                  }
                }}
              >
                {submitting ? <CircularProgress size={24} /> : 'Cancel Class'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{
            background: 'rgba(30, 44, 80, 0.92)',
            borderRadius: '22px',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
            color: '#fff',
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 700 }}>
                Available Classes
              </Typography>
              {loading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {classes.map((cls) => (
                    <ListItem key={cls.id}>
                      <ListItemText
                        primary={<span style={{ color: '#fff' }}>{cls.date}</span>}
                        secondary={
                          <Box>
                            <Chip 
                              label={cls.cancelled ? 'CANCELLED' : 'Active'} 
                              color={cls.cancelled ? 'error' : 'success'}
                              size="small"
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              {classes.length === 0 && !loading && (
                <Typography variant="body2" sx={{ color: '#bdbdbd' }} align="center">
                  No classes found for the selected date and package.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
        <Typography variant="body2" color="warning.contrastText">
          <strong>Note:</strong> Cancelling a class will:
        </Typography>
        <Typography variant="body2" color="warning.contrastText" sx={{ ml: 2 }}>
          • Notify all registered students via email
        </Typography>
        <Typography variant="body2" color="warning.contrastText" sx={{ ml: 2 }}>
          • Exclude this class from monthly billing
        </Typography>
        <Typography variant="body2" color="warning.contrastText" sx={{ ml: 2 }}>
          • Mark the class as cancelled in the system
        </Typography>
      </Box>
    </Box>
  );
} 