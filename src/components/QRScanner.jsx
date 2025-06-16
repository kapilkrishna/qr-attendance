import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Box, Typography, Paper } from '@mui/material';

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });

    scanner.render(onScanSuccess, onScanError);

    return () => {
      scanner.clear();
    };
  }, []);

  const onScanSuccess = (result) => {
    scanner.clear();
    setScanResult(result);
  };

  const onScanError = (error) => {
    console.warn(error);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Scan QR Code
        </Typography>
        <div id="reader" style={{ width: '100%' }}></div>
        {scanResult && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Scan Result:</Typography>
            <Typography>{scanResult}</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default QRScanner; 