import { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, Alert, Button, Snackbar } from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScanQR() {
  const [checkedInList, setCheckedInList] = useState([]);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [lastScannedName, setLastScannedName] = useState('');
  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);
  const scannedNamesRef = useRef(new Set()); // Keep track of scanned names

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      setIsScanning(false);
    }
  };

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        // Use the back camera if available, otherwise use the first camera
        const cameraId = devices.find(device => device.label.toLowerCase().includes('back'))?.id || devices[0].id;
        
        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Only process if we're not already scanning
            if (!isScanningRef.current) {
              isScanningRef.current = true;
              
              // Check if the name has already been scanned
              if (!scannedNamesRef.current.has(decodedText)) {
                // Add to the set of scanned names
                scannedNamesRef.current.add(decodedText);
                
                // Add the check-in to the list
                setCheckedInList(list => [...list, { 
                  name: decodedText, 
                  time: new Date() 
                }]);
                
                // Show notification
                setLastScannedName(decodedText);
                setShowNotification(true);
              }
              setError('');

              // Reset scanning flag after a short delay
              setTimeout(() => {
                isScanningRef.current = false;
              }, 1000); // Wait 1 second before allowing next scan
            }
          },
          (error) => {
            // Ignore errors as they're usually just failed scan attempts
            console.warn(error);
          }
        );
      }
    } catch (err) {
      console.error("Failed to start scanner:", err);
      setError("Failed to start camera: " + err.message);
    }
  };

  useEffect(() => {
    if (isScanning) {
      startScanner();
    }

    // Cleanup function
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center">
        QR Code Scanner
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ maxWidth: 400, mx: 'auto' }}>
          <div id="reader"></div>
        </Box>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            color={isScanning ? "error" : "success"}
            onClick={() => setIsScanning(!isScanning)}
          >
            {isScanning ? "Stop Scanning" : "Start Scanning"}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Attendance List ({checkedInList.length})
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

      <Snackbar
        open={showNotification}
        autoHideDuration={3000}
        onClose={() => setShowNotification(false)}
        message={`${lastScannedName} has been added to the attendance list!`}
      />
    </Box>
  );
} 