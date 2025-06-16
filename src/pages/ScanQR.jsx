import { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, Alert } from '@mui/material';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ScanQR() {
  const [lastCheckIn, setLastCheckIn] = useState('');
  const [checkedInList, setCheckedInList] = useState([]);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 10,
    });

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        if (decodedText && decodedText !== lastCheckIn) {
          setLastCheckIn(decodedText);
          setCheckedInList(list => [...list, { name: decodedText, time: new Date() }]);
          setError('');
        }
      },
      (errorMessage) => {
        setError('Error scanning QR code: ' + errorMessage);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [lastCheckIn]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center">
        QR Code Scanner
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ maxWidth: 400, mx: 'auto' }}>
          <div id="reader"></div>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {lastCheckIn && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {lastCheckIn} just checked in!
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Attendance List
        </Typography>
        <List>
          {checkedInList.map((checkIn, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={checkIn.name}
                secondary={checkIn.time.toLocaleString()}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
} 