import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Alert, 
  Button, 
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8001/api';

export default function CoachAttendance() {
  const navigate = useNavigate();
  const [checkedInList, setCheckedInList] = useState([]);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [lastScannedName, setLastScannedName] = useState('');
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState('');
  const [classTypes, setClassTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  
  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);
  const scannedNamesRef = useRef(new Set());

  useEffect(() => {
    // Check authentication
    if (!localStorage.getItem('coachAuthenticated')) {
      navigate('/coach');
      return;
    }

    fetchPackages();
  }, [navigate]);

  useEffect(() => {
    if (selectedPackage && selectedDate) {
      fetchClasses();
    }
  }, [selectedPackage, selectedDate]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/class_types`)
      .then(res => res.json())
      .then(data => setClassTypes(data))
      .catch(() => setClassTypes([]));
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/packages`);
      if (!response.ok) throw new Error('Failed to fetch packages');
      const data = await response.json();
      setPackages(data);
    } catch (err) {
      setError('Failed to load packages');
      console.error('Error fetching packages:', err);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/classes?package_id=${selectedPackage}&date=${selectedDate}`
      );
      if (!response.ok) throw new Error('Failed to fetch classes');
      const data = await response.json();
      setClasses(data);
      if (data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (err) {
      setError('Failed to load classes');
      console.error('Error fetching classes:', err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      setIsScanning(false);
    }
  };

  const startScanner = async () => {
    if (!selectedClass) {
      setError('Please select a class first');
      return;
    }

    try {
      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        const cameraId = devices.find(device => device.label.toLowerCase().includes('back'))?.id || devices[0].id;
        
        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            if (!isScanningRef.current) {
              isScanningRef.current = true;
              
              if (!scannedNamesRef.current.has(decodedText)) {
                scannedNamesRef.current.add(decodedText);
                
                // Mark attendance via API
                try {
                  const response = await fetch(`${API_BASE_URL}/attendance`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      qr_data: decodedText,
                      class_id: selectedClass
                    })
                  });

                  const result = await response.json();
                  
                  if (result.success) {
                    setCheckedInList(list => [...list, { 
                      name: result.user_name, 
                      time: new Date(),
                      status: result.already_present ? 'Already Present' : 'Checked In'
                    }]);
                    
                    setLastScannedName(result.user_name);
                    setShowNotification(true);
                  } else {
                    setError(result.message);
                  }
                } catch (err) {
                  setError('Failed to mark attendance');
                  console.error('Attendance error:', err);
                }
              }
              setError('');

              setTimeout(() => {
                isScanningRef.current = false;
              }, 1000);
            }
          },
          (error) => {
            console.warn(error);
          }
        );
        setIsScanning(true);
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

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning, selectedClass]);

  const handleLogout = () => {
    localStorage.removeItem('coachAuthenticated');
    navigate('/coach');
  };

  const handleStartScanning = () => {
    if (!date || !selectedType) {
      setError('Please select a date and class type.');
      return;
    }
    setError('');
    setIsScanning(true);
    // TODO: Start QR scanning logic here
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Take Attendance</Typography>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Class Selection</Typography>
        <FormControl fullWidth margin="normal">
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Class Type</InputLabel>
          <Select
            value={selectedType}
            label="Class Type"
            onChange={e => setSelectedType(e.target.value)}
          >
            {classTypes.map(type => (
              <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          disabled={!date || !selectedType}
          onClick={handleStartScanning}
        >
          Start Scanning
        </Button>
      </Paper>
      {isScanning && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ maxWidth: 400, mx: 'auto' }}>
            <div id="reader"></div>
          </Box>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button 
              variant="contained" 
              color="error"
              onClick={stopScanner}
            >
              Stop Scanning
            </Button>
          </Box>
        </Paper>
      )}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Attendance List ({checkedInList.length})</Typography>
        <List>
          {checkedInList.map((checkIn, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={checkIn.name}
                secondary={`${checkIn.time.toLocaleString()} - ${checkIn.status}`}
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