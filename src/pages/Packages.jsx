import { useState } from 'react';
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
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert
} from '@mui/material';

const ELITE_DAYS = [
  { value: '2025-07-07', label: 'Monday, July 7' },
  { value: '2025-07-08', label: 'Tuesday, July 8' },
  { value: '2025-07-09', label: 'Wednesday, July 9' },
  { value: '2025-07-10', label: 'Thursday, July 10' },
  { value: '2025-07-11', label: 'Friday, July 11' },
];

const ELITE_PACKAGE_ID = 4; // Update this if the ID changes in the backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function Packages() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setName('');
    setSelectedDay('');
    setSuccess('');
    setError('');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSuccess('');
    setError('');
  };

  const handleSubmit = async () => {
    if (!name.trim() || !selectedDay) {
      setError('Please enter your name and select a day.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      // 1. Create user (or get existing)
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
      // 2. Register user for Elite package
      let regRes = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          package_id: ELITE_PACKAGE_ID,
          start_date: selectedDay,
          end_date: selectedDay,
          status: 'active'
        })
      });
      if (!regRes.ok) {
        const regErr = await regRes.json();
        setError(regErr.detail || 'Failed to register for Elite package.');
        return;
      }
      setDialogOpen(false);
      navigate('/qr', { state: { name, selectedDay } });
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <Box>
      <Grid container spacing={4} alignItems="flex-start" sx={{ mt: 2, mb: 4, maxWidth: '900px', mx: 'auto' }}>
        <Grid item xs={12} sm={8} md={6} display="flex" justifyContent="center">
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
                Elite Summer 2025
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, flexGrow: 1, color: '#e0e0e0', fontWeight: 500, lineHeight: 1.6, fontSize: '1.2rem' }}>
                1 - 5 PM <br />
                Holmes Middle School<br />
                6525 Montrose Street, Alexandria, Virginia
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
                onClick={handleOpenDialog}
              >
                Select Day
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} PaperProps={{
        sx: {
          background: 'rgba(30, 44, 80, 0.98)',
          borderRadius: '22px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
          color: '#fff',
        }
      }}>
        <DialogTitle sx={{ color: '#fff', fontWeight: 700, fontSize: '1.5rem' }}>Select Day</DialogTitle>
        <DialogContent>
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
            <InputLabel>Select Day *</InputLabel>
            <Select
              value={selectedDay}
              label="Select Day *"
              onChange={e => setSelectedDay(e.target.value)}
              sx={{ color: '#fff' }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: 'rgba(44, 62, 100, 0.98)',
                    color: '#fff',
                  },
                },
                MenuListProps: {
                  sx: {
                    '& .Mui-selected': {
                      bgcolor: '#3a3a5a !important',
                      color: '#fff',
                    },
                    '& .MuiMenuItem-root:hover': {
                      bgcolor: '#3a3a5a',
                      color: '#fff',
                    },
                  },
                },
              }}
            >
              {ELITE_DAYS.map(day => (
                <MenuItem key={day.value} value={day.value} sx={{ color: '#fff', background: 'rgba(44, 62, 100, 0.98)' }}>{day.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
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
            disabled={!name.trim() || !selectedDay}
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
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      {success && <Alert severity="success" sx={{ mt: 4, maxWidth: 500, mx: 'auto' }}>{success}</Alert>}
    </Box>
  );
} 