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
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

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
  const [selectedClass, setSelectedClass] = useState(null);
  const [date, setDate] = useState('');
  const [classTypes, setClassTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  
  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);
  const scannedNamesRef = useRef(new Set());

  // Manual attendance state
  const [showManualAttendance, setShowManualAttendance] = useState(false);
  const [uncheckedStudents, setUncheckedStudents] = useState([]);
  const [loadingUnchecked, setLoadingUnchecked] = useState(false);

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
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
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
                      status: result.already_present ? 'Already Present' : 'Checked In',
                      is_registered: result.is_registered,
                      registration_message: result.registration_message
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
    if (isScanning && selectedClass) {
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

  const handleStartScanning = async () => {
    if (!date || !selectedType) {
      setError('Please select a date and class type.');
      return;
    }
    setError('');
    try {
      // Get or create class for this date and class type
      const response = await fetch(`${API_BASE_URL}/classes/by_type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, class_type_id: selectedType })
      });
      if (!response.ok) throw new Error('Failed to get or create class');
      const classObj = await response.json();
      setSelectedClass(classObj.id);
      setIsScanning(true);
    } catch (err) {
      setError('Failed to get or create class.');
    }
  };

  const fetchUncheckedStudents = async () => {
    if (!selectedClass) return;
    
    setLoadingUnchecked(true);
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/unchecked/${selectedClass}`);
      if (!response.ok) throw new Error('Failed to fetch unchecked students');
      const students = await response.json();
      setUncheckedStudents(students);
    } catch (err) {
      setError('Failed to fetch unchecked students');
      console.error('Error fetching unchecked students:', err);
    } finally {
      setLoadingUnchecked(false);
    }
  };

  const handleManualAttendance = async () => {
    if (!date || !selectedType) {
      setError('Please select a date and class type first.');
      return;
    }
    setError('');
    try {
      // Get or create class for this date and class type
      const response = await fetch(`${API_BASE_URL}/classes/by_type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, class_type_id: selectedType })
      });
      if (!response.ok) throw new Error('Failed to get or create class');
      const classObj = await response.json();
      setSelectedClass(classObj.id);
      setShowManualAttendance(true);
      fetchUncheckedStudents();
    } catch (err) {
      setError('Failed to get or create class.');
    }
  };

  const markStudentAttendance = async (userId, userName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/manual/${selectedClass}/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to mark attendance');
      const result = await response.json();
      
      if (result.success) {
        // Add to attendance list
        setCheckedInList(list => [...list, { 
          name: result.user_name, 
          time: new Date(),
          status: 'Manually Marked',
          is_registered: result.is_registered,
          registration_message: result.registration_message
        }]);
        
        // Remove from unchecked list
        setUncheckedStudents(students => students.filter(s => s.id !== userId));
        
        // Show notification
        setLastScannedName(result.user_name);
        setShowNotification(true);
      }
    } catch (err) {
      setError('Failed to mark attendance');
      console.error('Error marking attendance:', err);
    }
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
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          sx={{ mt: 1 }}
          disabled={!date || !selectedType}
          onClick={handleManualAttendance}
        >
          Manual Attendance
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
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">
                      {checkIn.name}
                    </Typography>
                    {checkIn.is_registered !== null && (
                      <Box
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          bgcolor: checkIn.is_registered ? 'success.light' : 'error.light',
                          color: checkIn.is_registered ? 'success.dark' : 'error.dark',
                        }}
                      >
                        {checkIn.is_registered ? 'REGISTERED' : 'UNREGISTERED'}
                      </Box>
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {checkIn.time.toLocaleString()} - {checkIn.status}
                    </Typography>
                    {checkIn.registration_message && (
                      <Typography 
                        variant="body2" 
                        color={checkIn.is_registered ? 'success.main' : 'error.main'}
                        sx={{ fontStyle: 'italic' }}
                      >
                        {checkIn.registration_message}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
      <Snackbar
        open={showNotification}
        autoHideDuration={4000}
        onClose={() => setShowNotification(false)}
        message={
          <Box>
            <Typography variant="body1">
              {lastScannedName} has been added to the attendance list!
            </Typography>
            {checkedInList.length > 0 && checkedInList[checkedInList.length - 1].is_registered !== null && (
              <Typography 
                variant="body2" 
                color={checkedInList[checkedInList.length - 1].is_registered ? 'success.light' : 'error.light'}
                sx={{ fontWeight: 'bold' }}
              >
                Status: {checkedInList[checkedInList.length - 1].is_registered ? 'REGISTERED' : 'UNREGISTERED'}
              </Typography>
            )}
          </Box>
        }
      />

      {/* Manual Attendance Modal */}
      <Dialog 
        open={showManualAttendance} 
        onClose={() => setShowManualAttendance(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Manual Attendance - {classTypes.find(t => t.id === selectedType)?.name} on {date}
        </DialogTitle>
        <DialogContent>
          {loadingUnchecked ? (
            <Typography>Loading unchecked students...</Typography>
          ) : uncheckedStudents.length === 0 ? (
            <Typography color="text.secondary">
              All registered students have been checked in!
            </Typography>
          ) : (
            <List>
              {uncheckedStudents.map((student) => (
                <ListItem key={student.id} divider>
                  <ListItemText
                    primary={student.name}
                    secondary={student.email}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      color="primary"
                      onClick={() => markStudentAttendance(student.id, student.name)}
                      title="Mark Present"
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
} 