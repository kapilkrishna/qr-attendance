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

const API_BASE_URL = 'http://localhost:8001/api';

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
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Enter your password to access coach features
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
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
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={!password.trim() || loading}
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Coach Features:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Take attendance using QR codes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Cancel classes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • View attendance records
        </Typography>
      </Box>
    </Box>
  );
} 