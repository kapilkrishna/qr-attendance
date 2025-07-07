import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider, Alert, Button } from '@mui/material';

// QR Scanner component with continuous scanning capability
const QRScanner = () => {
  const [scanResults, setScanResults] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);

  const startScanner = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      console.log('Available cameras:', devices);
      
      if (devices && devices.length) {
        // Use the back camera if available, otherwise use the first camera
        const cameraId = devices.find(device => device.label.toLowerCase().includes('back'))?.id || devices[0].id;
        console.log('Using camera:', cameraId);
        
        await scanner.start(
          cameraId,
          {
            fps: 10,
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Only process if we're not already scanning
            if (!isScanningRef.current) {
              isScanningRef.current = true;
              
              // Add the scan result
              const timestamp = new Date().toLocaleString();
              setScanResults(prevResults => [...prevResults, {
                id: Date.now(),
                data: decodedText,
                timestamp: timestamp
              }]);

              // Reset scanning flag after a short delay
              setTimeout(() => {
                isScanningRef.current = false;
              }, 1000); // Wait 1 second before allowing next scan
            }
          },
          (error) => {
            // Ignore errors as they're usually just failed scan attempts
            console.warn('Scan error:', error);
          }
        );
        setIsLoading(false);
      } else {
        setError('No cameras found. Please check your device has a camera and grant permission.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Failed to start scanner:", err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotSupportedError') {
        setError('Camera not supported on this device or browser.');
      } else {
        setError(`Failed to start camera: ${err.message}`);
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startScanner();

    // Cleanup function
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Scan QR Code
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <Button 
              variant="outlined" 
              size="small" 
              onClick={startScanner}
              sx={{ ml: 2 }}
            >
              Retry
            </Button>
          </Alert>
        )}
        
        {isLoading && !error && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Starting camera...
          </Alert>
        )}
        
        <div id="reader" style={{ width: '100%' }}></div>
        
        {scanResults.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Attendance List ({scanResults.length})
            </Typography>
            <List>
              {scanResults.map((result, index) => (
                <React.Fragment key={result.id}>
                  <ListItem>
                    <ListItemText
                      primary={result.data}
                      secondary={result.timestamp}
                    />
                  </ListItem>
                  {index < scanResults.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default QRScanner; 