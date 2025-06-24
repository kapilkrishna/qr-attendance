import { useState } from 'react';
import { Box, TextField, Button, Paper, Typography, Alert, CircularProgress } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

const API_BASE_URL = 'http://localhost:8001/api';

export default function GenerateQR() {
  const [name, setName] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  const handleGenerate = async () => {
    if (!name.trim()) return;

    setLoading(true);
    setError('');
    setShowQR(false);
    setUserInfo(null);

    try {
      const response = await fetch(`${API_BASE_URL}/generate_qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate QR code');
      }

      const data = await response.json();
      setUserInfo(data.user_info);
      setShowQR(true);
    } catch (err) {
      setError(err.message || 'Failed to generate QR code. Please check the name and try again.');
      console.error('Error generating QR:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        Generate Your QR Code
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Enter your name to generate a QR code for attendance tracking
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          disabled={loading}
        />
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={!name.trim() || loading}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Generate QR Code'}
        </Button>
      </Paper>
      
      {showQR && userInfo && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
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
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Show this QR code to check in for your tennis classes
          </Typography>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Student Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Name:</strong> {userInfo.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Email:</strong> {userInfo.email}
            </Typography>
            {userInfo.registrations && userInfo.registrations.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                <strong>Active Packages:</strong> {userInfo.registrations.map(r => r.package_name).join(', ')}
              </Typography>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
} 