import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';

const QRScanner = () => {
  const [scanResults, setScanResults] = useState([]);
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    const newScanner = new Html5QrcodeScanner('reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });

    newScanner.render(onScanSuccess, onScanError);
    setScanner(newScanner);

    return () => {
      if (newScanner) {
        newScanner.clear();
      }
    };
  }, []);

  const onScanSuccess = (result) => {
    // Add timestamp to the scan result
    const timestamp = new Date().toLocaleString();
    const newResult = {
      id: Date.now(), // unique id for the result
      data: result,
      timestamp: timestamp
    };
    
    setScanResults(prevResults => [...prevResults, newResult]);
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