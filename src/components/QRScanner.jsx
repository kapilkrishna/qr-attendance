import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';

// QR Scanner component with continuous scanning capability
const QRScanner = () => {
  const [scanResults, setScanResults] = useState([]);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Initialize the scanner
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    // Start scanning
    scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      onScanSuccess,
      onScanError
    ).catch((err) => {
      console.error("Failed to start scanner:", err);
    });

    // Cleanup function
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const onScanSuccess = (decodedText) => {
    // Add timestamp to the scan result
    const timestamp = new Date().toLocaleString();
    const newResult = {
      id: Date.now(),
      data: decodedText,
      timestamp: timestamp
    };
    
    setScanResults(prevResults => [...prevResults, newResult]);
  };

  const onScanError = (error) => {
    // We can ignore errors as they're usually just failed scan attempts
    console.warn(error);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Scan QR Code
        </Typography>
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