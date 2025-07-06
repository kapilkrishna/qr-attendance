import { useState, useEffect } from 'react';
import { Box, TextField, Button, Paper, Typography, Alert, CircularProgress } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { useLocation } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function GenerateQR() {
  const location = useLocation();
  const [name, setName] = useState(location.state?.name || '');
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (location.state?.name && !showQR && !userInfo) {
      handleGenerate(location.state.name);
    }
    // eslint-disable-next-line
  }, [location.state]);

  const handleGenerate = async (overrideName) => {
    const inputName = overrideName !== undefined ? overrideName : name;
    if (!inputName.trim()) return;
    setLoading(true);
    setError('');
    setShowQR(false);
    setUserInfo(null);
    try {
      console.log('Making API call to:', `${API_BASE_URL}/generate_qr`);
      console.log('Request body:', { name: inputName.trim() });
      
      const response = await fetch(`${API_BASE_URL}/generate_qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: inputName.trim() })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error data:', errorData);
        throw new Error(errorData.detail || 'Failed to generate QR code');
      }

      const data = await response.json();
      console.log('Success data:', data);
      setUserInfo(data.user_info);
      setShowQR(true);
    } catch (err) {
      console.error('Error generating QR:', err);
      setError(err.message || 'Failed to generate QR code. Please check the name and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
      {showQR && userInfo && (
        <Paper elevation={3} sx={{ 
          p: 4, 
          background: 'rgba(30, 44, 80, 0.92)',
          borderRadius: '22px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
          color: '#fff',
          mb: 3
        }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 700 }}>
            Your QR Code
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <QRCodeSVG
              value={userInfo.id + ":" + userInfo.name}
              size={256}
              level="H"
              includeMargin={true}
            />
          </Box>
          
          <Typography variant="body2" sx={{ color: '#bdbdbd', mb: 2 }}>
            Show this QR code to check in for your tennis classes
          </Typography>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(44, 62, 100, 0.85)', borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
              Student Information
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              <strong>Name:</strong> {userInfo.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
              <strong>Email:</strong> {userInfo.email}
            </Typography>
            {userInfo.registrations && userInfo.registrations.length > 0 && (
              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                <strong>Active Packages:</strong> {userInfo.registrations.map(r => r.package_name).join(', ')}
              </Typography>
            )}
          </Box>
        </Paper>
      )}

      <Paper elevation={3} sx={{ 
        p: 4, mb: 3, 
        background: 'rgba(30, 44, 80, 0.92)',
        borderRadius: '22px',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
        color: '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        <TextField
          fullWidth
          label="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
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
          variant="contained"
          onClick={() => handleGenerate()}
          disabled={!name.trim() || loading}
          sx={{
            mt: 2,
            width: '100%',
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
          {loading ? <CircularProgress size={24} /> : 'Generate QR Code'}
        </Button>
      </Paper>
    </Box>
  );
} 