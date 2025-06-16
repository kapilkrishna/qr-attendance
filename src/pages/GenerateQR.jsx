import { useState } from 'react';
import { Box, TextField, Button, Paper, Typography } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

export default function GenerateQR() {
  const [name, setName] = useState('');
  const [showQR, setShowQR] = useState(false);

  const handleGenerate = () => {
    if (name.trim()) {
      setShowQR(true);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        Generate QR Code
      </Typography>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
        />
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={!name.trim()}
          sx={{ mt: 2 }}
        >
          Generate QR Code
        </Button>
      </Paper>
      
      {showQR && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Your QR Code
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <QRCodeSVG
              value={name}
              size={256}
              level="H"
              includeMargin={true}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Show this QR code to check in
          </Typography>
        </Paper>
      )}
    </Box>
  );
} 