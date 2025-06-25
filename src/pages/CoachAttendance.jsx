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
  IconButton,
  Chip
} from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SearchIcon from "@mui/icons-material/Search";

const API_BASE_URL = 'http://localhost:8000/api';

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

  // New state for the enhanced attendance system
  const [allStudents, setAllStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  // New effect to fetch students when date and class type are selected
  useEffect(() => {
    if (date && selectedType) {
      fetchAllStudentsForClass();
    }
  }, [date, selectedType]);

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

  // New function to fetch all students for a class type and date
  const fetchAllStudentsForClass = async () => {
    setLoadingStudents(true);
    try {
      // First get or create the class
      const classResponse = await fetch(`${API_BASE_URL}/classes/by_type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, class_type_id: selectedType })
      });
      
      if (!classResponse.ok) throw new Error('Failed to get or create class');
      const classObj = await classResponse.json();
      setSelectedClass(classObj.id);

      // Then get comprehensive attendance data
      const attendanceResponse = await fetch(`${API_BASE_URL}/attendance/comprehensive/${classObj.id}`);
      if (!attendanceResponse.ok) throw new Error('Failed to fetch attendance data');
      const attendanceData = await attendanceResponse.json();

      // Combine all students and sort them (unchecked first, then checked in)
      const allStudentsData = [
        ...attendanceData.unchecked.map(student => ({ ...student, status: 'unchecked' })),
        ...attendanceData.checked_in.map(student => ({ ...student, status: student.status }))
      ];

      setAllStudents(allStudentsData);
      setCheckedInList(attendanceData.checked_in.map(student => ({
        name: student.name,
        time: new Date(student.checked_in_at),
        status: student.status === 'present' ? 'Present' : student.status === 'late' ? 'Late' : 'Checked In',
        is_registered: student.is_registered
      })));
    } catch (err) {
      setError('Failed to fetch students');
      console.error('Error fetching students:', err);
    } finally {
      setLoadingStudents(false);
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
                    
                    // Refresh the student list
                    fetchAllStudentsForClass();
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
    setIsScanning(true);
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

  // New function to mark student as present
  const markStudentPresent = async (userId, userName) => {
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
          status: 'Present',
          is_registered: result.is_registered,
          registration_message: result.registration_message
        }]);
        
        // Show notification
        setLastScannedName(result.user_name);
        setShowNotification(true);
        
        // Refresh the student list
        fetchAllStudentsForClass();
      }
    } catch (err) {
      setError('Failed to mark attendance');
      console.error('Error marking attendance:', err);
    }
  };

  // New function to mark student as late
  const markStudentLate = async (userId, userName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/${selectedClass}/${userId}/status?status=late`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to mark attendance');
      const result = await response.json();
      
      if (result.success) {
        // Add to attendance list
        setCheckedInList(list => [...list, { 
          name: result.user_name, 
          time: new Date(),
          status: 'Late',
          is_registered: true
        }]);
        
        // Show notification
        setLastScannedName(result.user_name);
        setShowNotification(true);
        
        // Refresh the student list
        fetchAllStudentsForClass();
      }
    } catch (err) {
      setError('Failed to mark attendance');
      console.error('Error marking attendance:', err);
    }
  };

  // New function to mark student as absent
  const markStudentAbsent = async (userId, userName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/${selectedClass}/${userId}/status?status=missing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to mark attendance');
      const result = await response.json();
      
      if (result.success) {
        // Show notification
        setLastScannedName(result.user_name);
        setShowNotification(true);
        
        // Refresh the student list
        fetchAllStudentsForClass();
      }
    } catch (err) {
      setError('Failed to mark attendance');
      console.error('Error marking attendance:', err);
    }
  };

  // New function to update student status
  const updateStudentStatus = async (userId, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/${selectedClass}/${userId}/status?status=${status}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to update attendance');
      const result = await response.json();
      
      if (result.success) {
        // Show notification
        setLastScannedName(result.user_name);
        setShowNotification(true);
        
        // Refresh the student list
        fetchAllStudentsForClass();
      }
    } catch (err) {
      setError('Failed to update attendance');
      console.error('Error updating attendance:', err);
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

  // Filter students based on search term
  const filteredStudents = allStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Take Attendance</Typography>
      <Paper elevation={3} sx={{ 
        p: 3, mb: 3, 
        background: 'rgba(30, 44, 80, 0.92)',
        borderRadius: '22px',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
        color: '#fff',
      }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 700 }}>Class Selection</Typography>
        <FormControl fullWidth margin="normal" sx={{
          '& .MuiInputBase-root': {
            borderRadius: '12px',
            background: 'rgba(44, 62, 100, 0.85)',
            color: '#fff',
          },
          '& .MuiInputLabel-root': { color: '#bdbdbd' },
          '& .MuiSelect-icon': { color: '#fff' },
        }}>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            InputLabelProps={{ shrink: true, sx: { color: '#bdbdbd' } }}
            InputProps={{
              sx: {
                borderRadius: '12px',
                background: 'rgba(44, 62, 100, 0.85)',
                color: '#fff',
                input: { color: '#fff' },
                '& .MuiInputBase-input::placeholder': { color: '#bdbdbd', opacity: 1 }
              }
            }}
          />
        </FormControl>
        <FormControl fullWidth margin="normal" sx={{
          '& .MuiInputBase-root': {
            borderRadius: '12px',
            background: 'rgba(44, 62, 100, 0.85)',
            color: '#fff',
          },
          '& .MuiInputLabel-root': { color: '#bdbdbd' },
          '& .MuiSelect-icon': { color: '#fff' },
        }}>
          <InputLabel>Class Type</InputLabel>
          <Select
            value={selectedType}
            label="Class Type"
            onChange={e => setSelectedType(e.target.value)}
            sx={{ color: '#fff' }}
          >
            {classTypes.map(type => (
              <MenuItem key={type.id} value={type.id} sx={{ color: '#fff', background: 'rgba(44, 62, 100, 0.98)' }}>{type.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{
            mt: 2,
            background: 'linear-gradient(90deg, #a259ff 0%, #3a8dde 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1.1rem',
            borderRadius: '12px',
            py: 1.2,
            boxShadow: '0 4px 16px 0 rgba(162,89,255,0.18)',
            textTransform: 'none',
            '&:hover': {
              background: 'linear-gradient(90deg, #3a8dde 0%, #a259ff 100%)',
              boxShadow: '0 8px 24px 0 rgba(162,89,255,0.28)'
            }
          }}
          disabled={!date || !selectedType}
          onClick={handleStartScanning}
        >
          Start QR Scanning
        </Button>
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          sx={{
            mt: 1,
            color: '#fff',
            borderRadius: '12px',
            fontWeight: 600,
            px: 3,
            py: 1.2,
            borderColor: '#a259ff',
            background: 'rgba(44, 62, 100, 0.7)',
            '&:hover': { background: 'rgba(44, 62, 100, 1)' }
          }}
          disabled={!date || !selectedType}
          onClick={handleManualAttendance}
        >
          Manual Attendance
        </Button>
      </Paper>

      {/* QR Scanning Section */}
      {isScanning && (
        <Paper elevation={3} sx={{ 
          p: 3, mb: 3, 
          background: 'rgba(30, 44, 80, 0.92)',
          borderRadius: '22px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
          color: '#fff',
        }}>
          <Box sx={{ maxWidth: 400, mx: 'auto' }}>
            <div id="reader"></div>
          </Box>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button 
              variant="contained" 
              color="error"
              onClick={stopScanner}
              sx={{
                background: 'linear-gradient(90deg, #ff5f6d 0%, #ffc371 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.1rem',
                borderRadius: '12px',
                py: 1.2,
                boxShadow: '0 4px 16px 0 rgba(255,95,109,0.18)',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(90deg, #ffc371 0%, #ff5f6d 100%)',
                  boxShadow: '0 8px 24px 0 rgba(255,95,109,0.28)'
                }
              }}
            >
              Stop Scanning
            </Button>
          </Box>
        </Paper>
      )}

      {/* Student List Section */}
      {date && selectedType && (
        <Paper elevation={3} sx={{ 
          p: 3, mb: 3, 
          background: 'rgba(30, 44, 80, 0.92)',
          borderRadius: '22px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
          color: '#fff',
        }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 700 }}>
            Students - {classTypes.find(t => t.id === selectedType)?.name} on {date}
          </Typography>
          
          {/* Search Bar */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                background: 'rgba(44, 62, 100, 0.85)',
                color: '#fff',
                '& fieldset': { borderColor: '#a259ff' },
                '&:hover fieldset': { borderColor: '#3a8dde' },
                '&.Mui-focused fieldset': { borderColor: '#a259ff' }
              },
              '& .MuiInputBase-input': { color: '#fff' },
              '& .MuiInputBase-input::placeholder': { color: '#bdbdbd', opacity: 1 }
            }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: '#bdbdbd', mr: 1 }} />
            }}
          />

          {loadingStudents ? (
            <Typography sx={{ textAlign: 'center', color: '#bdbdbd' }}>Loading students...</Typography>
          ) : filteredStudents.length === 0 ? (
            <Typography sx={{ textAlign: 'center', color: '#bdbdbd' }}>
              {searchTerm ? 'No students found matching your search.' : 'No students registered for this class.'}
            </Typography>
          ) : (
            <List>
              {filteredStudents.map((student) => (
                <ListItem 
                  key={student.id} 
                  sx={{ 
                    mb: 1, 
                    borderRadius: '12px',
                    background: student.status === 'unchecked' 
                      ? 'rgba(44, 62, 100, 0.6)' 
                      : 'rgba(44, 62, 100, 0.3)',
                    border: student.status === 'unchecked' ? '1px solid #a259ff' : '1px solid transparent'
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                          {student.name}
                        </Typography>
                        {student.status !== 'unchecked' && (
                          <Chip 
                            label={student.status === 'present' ? 'Present' : student.status === 'late' ? 'Late' : student.status === 'missing' ? 'Absent' : student.status} 
                            size="small"
                            sx={{
                              bgcolor: student.status === 'present' ? '#4caf50' : student.status === 'late' ? '#ff9800' : '#f44336',
                              color: '#fff',
                              fontWeight: 'bold'
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                        {student.email}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    {student.status === 'unchecked' ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            bgcolor: '#4caf50',
                            color: '#fff',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            px: 2,
                            '&:hover': { bgcolor: '#45a049' }
                          }}
                          onClick={() => markStudentPresent(student.id, student.name)}
                        >
                          Present
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            bgcolor: '#ff9800',
                            color: '#fff',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            px: 2,
                            '&:hover': { bgcolor: '#f57c00' }
                          }}
                          onClick={() => markStudentLate(student.id, student.name)}
                        >
                          Late
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            bgcolor: '#f44336',
                            color: '#fff',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            px: 2,
                            '&:hover': { bgcolor: '#d32f2f' }
                          }}
                          onClick={() => markStudentAbsent(student.id, student.name)}
                        >
                          Absent
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: '#4caf50',
                            color: '#4caf50',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            px: 2,
                            '&:hover': { 
                              borderColor: '#45a049',
                              color: '#45a049',
                              bgcolor: 'rgba(76, 175, 80, 0.1)'
                            }
                          }}
                          onClick={() => updateStudentStatus(student.id, 'present')}
                          disabled={student.status === 'present'}
                        >
                          Present
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: '#ff9800',
                            color: '#ff9800',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            px: 2,
                            '&:hover': { 
                              borderColor: '#f57c00',
                              color: '#f57c00',
                              bgcolor: 'rgba(255, 152, 0, 0.1)'
                            }
                          }}
                          onClick={() => updateStudentStatus(student.id, 'late')}
                          disabled={student.status === 'late'}
                        >
                          Late
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: '#f44336',
                            color: '#f44336',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            px: 2,
                            '&:hover': { 
                              borderColor: '#d32f2f',
                              color: '#d32f2f',
                              bgcolor: 'rgba(244, 67, 54, 0.1)'
                            }
                          }}
                          onClick={() => updateStudentStatus(student.id, 'missing')}
                          disabled={student.status === 'missing'}
                        >
                          Absent
                        </Button>
                      </Box>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}

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