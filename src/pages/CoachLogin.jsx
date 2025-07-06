import { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function CoachLogin() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/coach/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password })
      });

      if (!response.ok) {
        throw new Error('Invalid password');
      }

      const data = await response.json();
      if (data.authenticated) {
        // Store authentication state (in a real app, use proper session management)
        localStorage.setItem('coachAuthenticated', 'true');
        navigate('/coach/attendance');
      } else {
        setError('Authentication failed');
      }
    } catch (err) {
      setError('Invalid password. Please try again.');
      console.error('Authentication error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Coach Portal
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{
        background: 'rgba(30, 44, 80, 0.92)',
        borderRadius: '22px',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
        color: '#fff',
        mt: 2
      }}>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
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
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={!password.trim() || loading}
              sx={{
                mt: 3,
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
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 