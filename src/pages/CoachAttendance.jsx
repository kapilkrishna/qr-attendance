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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function CoachAttendance() {
  const navigate = useNavigate();
  const [checkedInList, setCheckedInList] = useState([]);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedName, setLastScannedName] = useState('');
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [date, setDate] = useState('');
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

  // New state for modifying student
  const [modifyingId, setModifyingId] = useState(null);

  // New state for managing menu open/close
  const [menuOpenId, setMenuOpenId] = useState(null);

  // Ref map for student list items
  const studentRefs = useRef({});
  // State to track last edited student
  const [lastEditedId, setLastEditedId] = useState(null);

  // Ref to store scroll position for preserving relative scroll
  const scrollAnchorRef = useRef({ id: null, offset: 0 });

  // New state for QR scanning status
  const [qrScanStatus, setQrScanStatus] = useState('present');

  // New state for success message
  const [successMessage, setSuccessMessage] = useState('');

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

  // Auto-load students when date and class type are selected
  useEffect(() => {
    if (date && selectedType) {
      fetchAllStudentsForClass();
    }
  }, [date, selectedType]);

  // Reset scanned names when date or class type changes
  useEffect(() => {
    if (date || selectedType) {
      console.log('Resetting scanned names due to date/type change:', { date, selectedType });
      scannedNamesRef.current.clear();
    }
  }, [date, selectedType]);

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/packages`);
      if (!response.ok) throw new Error('Failed to fetch packages');
      const data = await response.json();
      setPackages(data);
      if (data.length > 0) {
        setSelectedType(data[0].class_type_id);
      } else {
        setSelectedType('');
      }
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
    // Clear scanned names when stopping scanner
    console.log('Clearing scanned names - stopping scanner');
    scannedNamesRef.current.clear();
  };

  const startScanner = async () => {
    if (!selectedClass) {
      setError('Please select a class first');
      return;
    }

    // Clear scanned names when starting scanner
    console.log('Clearing scanned names - starting scanner');
    scannedNamesRef.current.clear();

    try {
      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      // First, check if we can get camera devices
      let devices;
      try {
        devices = await Html5Qrcode.getCameras();
      } catch (cameraError) {
        console.error("Camera access error:", cameraError);
        if (cameraError.name === 'NotAllowedError') {
          setError("Camera access denied. Please allow camera permissions and try again.");
        } else if (cameraError.name === 'NotFoundError') {
          setError("No camera found on this device.");
        } else if (cameraError.name === 'NotSupportedError') {
          setError("Camera not supported on this device or browser.");
        } else {
          setError("Failed to access camera. Please check your browser settings and try again.");
        }
        return;
      }

      if (!devices || devices.length === 0) {
        setError("No cameras found on this device.");
        return;
      }

      // Try to find a back camera first, then fall back to any available camera
      const cameraId = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      )?.id || devices[0].id;
      
      console.log("Available cameras:", devices.map(d => ({ id: d.id, label: d.label })));
      console.log("Selected camera:", cameraId);
      
      await scanner.start(
        cameraId,
        {
          fps: 10,
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
                    class_id: selectedClass,
                    status: qrScanStatus
                  })
                });

                const result = await response.json();
                
                if (result.success) {
                  setCheckedInList(list => [...list, { 
                    name: result.user_name, 
                    time: new Date(),
                    status: result.already_present ? 'Already Present' : (qrScanStatus === 'present' ? 'Present' : 'Late'),
                    is_registered: result.is_registered,
                    registration_message: result.registration_message
                  }]);
                  
                  setLastScannedName(result.user_name);
                  
                  // Show success message
                  if (!result.already_present) {
                    setSuccessMessage(`${result.user_name} marked as ${qrScanStatus === 'present' ? 'Present' : 'Late'}`);
                    setTimeout(() => setSuccessMessage(''), 3000);
                  }
                  
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
          console.warn("QR scanning error:", error);
          // Don't show QR scanning errors to user unless they're critical
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error("Failed to start scanner:", err);
      let errorMessage = "Failed to start camera";
      
      if (err.message) {
        errorMessage += ": " + err.message;
      } else if (err.name) {
        switch (err.name) {
          case 'NotAllowedError':
            errorMessage = "Camera access denied. Please allow camera permissions and try again.";
            break;
          case 'NotFoundError':
            errorMessage = "No camera found on this device.";
            break;
          case 'NotSupportedError':
            errorMessage = "Camera not supported on this device or browser.";
            break;
          default:
            errorMessage = "Failed to start camera. Please check your browser settings and try again.";
        }
      }
      
      setError(errorMessage);
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
    await fetchAllStudentsForClass();
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
      // Find the first visible student in the list before update
      const entries = Object.entries(studentRefs.current);
      let firstVisible = null;
      for (let [id, el] of entries) {
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.bottom > 0) { // visible in viewport
            firstVisible = { id, offset: rect.top };
            break;
          }
        }
      }
      if (firstVisible) {
        scrollAnchorRef.current = firstVisible;
      } else {
        scrollAnchorRef.current = { id: null, offset: 0 };
      }
      const response = await fetch(`${API_BASE_URL}/attendance/${selectedClass}/${userId}/status?status=${status}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to update attendance');
      const result = await response.json();
      
      if (result.success) {
        setLastEditedId(userId); // Track the edited student
        setAllStudents(students => {
          const updated = students.map(s =>
            s.id === userId ? { ...s, status } : s
          );
          // Sort: unchecked first, then present, then late, then missing
          return updated.sort((a, b) => {
            const order = {
              'unchecked': 0,
              'present': 1,
              'late': 2,
              'missing': 3
            };
            return (order[a.status] ?? 99) - (order[b.status] ?? 99);
          });
        });
        setCheckedInList(list =>
          list.map(s =>
            s.id === userId ? { ...s, status: status === 'present' ? 'Present' : status.charAt(0).toUpperCase() + status.slice(1) } : s
          )
        );
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
        
        // Refresh the student list
        fetchAllStudentsForClass();
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

  // Add this function to handle unchecking attendance
  const uncheckStudentAttendance = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/${selectedClass}/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to uncheck attendance');
      const result = await response.json();
      if (result.success) {
        // Remove this specific user's QR data from the scanned names set
        // QR data format is "user_id:user_name", so we can find and remove entries that start with this user_id
        const userIdStr = userId.toString();
        for (const qrData of scannedNamesRef.current) {
          if (qrData.startsWith(userIdStr + ':')) {
            scannedNamesRef.current.delete(qrData);
            break;
          }
        }
        // Refresh the student list
        fetchAllStudentsForClass();
      }
    } catch (err) {
      setError('Failed to uncheck attendance');
      console.error('Error unchecking attendance:', err);
    }
  };

  // After allStudents changes, scroll last edited student into view if needed
  useEffect(() => {
    if (lastEditedId && studentRefs.current[lastEditedId]) {
      studentRefs.current[lastEditedId].scrollIntoView({ behavior: 'smooth', block: 'center' });
      setLastEditedId(null);
    }
  }, [allStudents, lastEditedId]);

  // After allStudents changes, restore relative scroll position if needed
  useEffect(() => {
    const { id, offset } = scrollAnchorRef.current;
    if (id && studentRefs.current[id]) {
      const rect = studentRefs.current[id].getBoundingClientRect();
      const scrollDiff = rect.top - offset;
      window.scrollBy({ top: scrollDiff, behavior: 'auto' });
      scrollAnchorRef.current = { id: null, offset: 0 };
    }
  }, [allStudents]);

  return (
    <Box sx={{
      width: '100%',
      maxWidth: '100%',
      mx: 'auto',
      mt: 4,
      px: { xs: 0, sm: 2 },
      overflowX: { xs: 'hidden', sm: 'visible' }
    }}>
      <Typography variant="h4" gutterBottom>Take Attendance</Typography>
      <Paper elevation={3} sx={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        p: { xs: 2, sm: 3 },
        mb: 3,
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
            fullWidth
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
        }} disabled={packages.length === 0}>
          <InputLabel>Class Type</InputLabel>
          <Select
            value={selectedType}
            label="Class Type"
            onChange={e => setSelectedType(e.target.value)}
            sx={{ color: '#fff' }}
          >
            {packages.map(pkg => (
              <MenuItem key={pkg.id} value={pkg.id} sx={{ color: '#fff', background: 'rgba(44, 62, 100, 0.98)' }}>{pkg.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {packages.length === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>No packages available. Please add a package.</Alert>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ mt: 2 }}>{successMessage}</Alert>}
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
          disabled={!date || !selectedType || packages.length === 0}
          onClick={handleStartScanning}
        >
          Start QR Scanning
        </Button>
      </Paper>

      {/* QR Scanning Section */}
      {isScanning && (
        <Paper elevation={3} sx={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          p: { xs: 2, sm: 3 },
          mb: 3,
          background: 'rgba(30, 44, 80, 0.92)',
          borderRadius: '22px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
          color: '#fff',
        }}>
          {/* Status Selector */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
              QR Scan Status
            </Typography>
            <Typography variant="body1" sx={{ color: '#bdbdbd', mb: 2, fontSize: '1rem' }}>
              Mark students as:
            </Typography>
            <FormControl sx={{ minWidth: 250, mb: 2 }}>
              <Select
                value={qrScanStatus}
                onChange={(e) => setQrScanStatus(e.target.value)}
                displayEmpty
                sx={{
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  background: qrScanStatus === 'present' ? '#4caf50' : '#ff9800',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'transparent',
                    borderWidth: '0px',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'transparent',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'transparent',
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#fff',
                  },
                  '& .MuiSelect-select': {
                    padding: '12px 16px',
                    textAlign: 'center',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: 'rgba(44, 62, 100, 0.95)',
                      color: '#fff',
                      '& .MuiMenuItem-root': {
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        padding: '12px 16px',
                        '&:hover': {
                          bgcolor: 'rgba(162, 89, 255, 0.2)',
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="present" sx={{ 
                  color: '#fff',
                  bgcolor: '#4caf50',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  textAlign: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    bgcolor: '#45a049',
                  }
                }}>
                  Present
                </MenuItem>
                <MenuItem value="late" sx={{ 
                  color: '#fff',
                  bgcolor: '#ff9800',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  textAlign: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    bgcolor: '#f57c00',
                  }
                }}>
                  Late
                </MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body1" sx={{ color: '#bdbdbd', fontStyle: 'italic', fontSize: '1rem' }}>
              Students scanned will be marked as {qrScanStatus === 'present' ? 'Present' : 'Late'}
            </Typography>
          </Box>
          
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
          {/* Snackbar for QR scan success (now inside QR scanning section) */}
          <Snackbar
            open={!!successMessage}
            autoHideDuration={3000}
            onClose={() => setSuccessMessage("")}
            message={successMessage}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          />
        </Paper>
      )}

      {/* Student List Section */}
      {date && selectedType && (
      <Paper elevation={3} sx={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          p: { xs: 2, sm: 3 },
          mb: 3,
          background: 'rgba(30, 44, 80, 0.92)',
          borderRadius: '22px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
          color: '#fff',
        }}>
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
                  ref={el => studentRefs.current[student.id] = el}
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minWidth: 0,
                    px: 2,
                    py: 1.5,
                    gap: 0,
                  }}
                >
                  {/* Name column with fixed width and ellipsis */}
                  <Box sx={{ flex: '0 0 180px', minWidth: 0, maxWidth: 180, overflow: 'hidden' }}>
                    <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {student.name}
                    </Typography>
                  </Box>
                  {/* Status column, always right-aligned and same width */}
                  <Box sx={{ flex: '0 0 130px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {student.status !== 'unchecked' && (
                      <Chip 
                        label={student.status === 'present' ? 'Present' : student.status === 'late' ? 'Late' : student.status === 'missing' ? 'Absent' : student.status} 
                        size="medium"
                        sx={{
                          bgcolor: student.status === 'present' ? '#4caf50' : student.status === 'late' ? '#ff9800' : '#f44336',
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          height: 40,
                          minWidth: 120,
                          maxWidth: 120,
                          justifyContent: 'center',
                          textAlign: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={e => { e.stopPropagation(); setMenuOpenId(student.id); }}
                      />
                    )}
                    {/* For unmarked students, always show the three buttons */}
                    {student.status === 'unchecked' ? (
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, alignItems: 'stretch', ml: { xs: 0, sm: 3 } }}>
                        <Button
                          type="button"
                          variant='outlined'
                          size='medium'
                          sx={{
                            borderColor: '#4caf50',
                            color: '#4caf50',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            minWidth: { xs: 0, sm: 90 },
                            px: { xs: 1, sm: 3 },
                            width: { xs: '100%', sm: 'auto' },
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': { bgcolor: '#45a049', color: '#fff', borderColor: '#45a049' }
                          }}
                          onClick={() => { updateStudentStatus(student.id, 'present'); setMenuOpenId(null); }}
                        >
                          PRESENT
                        </Button>
                        <Button
                          type="button"
                          variant='outlined'
                          size='medium'
                          sx={{
                            borderColor: '#ff9800',
                            color: '#ff9800',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            minWidth: { xs: 0, sm: 90 },
                            px: { xs: 1, sm: 3 },
                            width: { xs: '100%', sm: 'auto' },
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': { bgcolor: '#f57c00', color: '#fff', borderColor: '#f57c00' }
                          }}
                          onClick={() => { updateStudentStatus(student.id, 'late'); setMenuOpenId(null); }}
                        >
                          LATE
                        </Button>
                        <Button
                          type="button"
                          variant='outlined'
                          size='medium'
                          sx={{
                            borderColor: '#f44336',
                            color: '#f44336',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            minWidth: { xs: 0, sm: 90 },
                            px: { xs: 1, sm: 3 },
                            width: { xs: '100%', sm: 'auto' },
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': { bgcolor: '#d32f2f', color: '#fff', borderColor: '#d32f2f' }
                          }}
                          onClick={() => { updateStudentStatus(student.id, 'missing'); setMenuOpenId(null); }}
                        >
                          ABSENT
                        </Button>
                      </Box>
                    ) : menuOpenId === student.id && (
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, alignItems: 'stretch', ml: { xs: 0, sm: 3 } }} onClick={e => e.stopPropagation()}>
                        {student.status !== 'present' && (
                          <Button
                            type="button"
                            variant='outlined'
                            size='medium'
                            sx={{
                              borderColor: '#4caf50',
                              color: '#4caf50',
                              fontWeight: 'bold',
                              borderRadius: '8px',
                              minWidth: { xs: 0, sm: 90 },
                              px: { xs: 1, sm: 3 },
                              width: { xs: '100%', sm: 'auto' },
                              height: 40,
                              display: 'flex',
                              alignItems: 'center',
                              '&:hover': { bgcolor: '#45a049', color: '#fff', borderColor: '#45a049' }
                            }}
                            onClick={() => { updateStudentStatus(student.id, 'present'); setMenuOpenId(null); }}
                          >
                            PRESENT
                          </Button>
                        )}
                        {student.status !== 'late' && (
                          <Button
                            type="button"
                            variant='outlined'
                            size='medium'
                            sx={{
                              borderColor: '#ff9800',
                              color: '#ff9800',
                              fontWeight: 'bold',
                              borderRadius: '8px',
                              minWidth: { xs: 0, sm: 90 },
                              px: { xs: 1, sm: 3 },
                              width: { xs: '100%', sm: 'auto' },
                              height: 40,
                              display: 'flex',
                              alignItems: 'center',
                              '&:hover': { bgcolor: '#f57c00', color: '#fff', borderColor: '#f57c00' }
                            }}
                            onClick={() => { updateStudentStatus(student.id, 'late'); setMenuOpenId(null); }}
                          >
                            LATE
                          </Button>
                        )}
                        {student.status !== 'missing' && (
                          <Button
                            type="button"
                            variant='outlined'
                            size='medium'
                            sx={{
                              borderColor: '#f44336',
                              color: '#f44336',
                              fontWeight: 'bold',
                              borderRadius: '8px',
                              minWidth: { xs: 0, sm: 90 },
                              px: { xs: 1, sm: 3 },
                              width: { xs: '100%', sm: 'auto' },
                              height: 40,
                              display: 'flex',
                              alignItems: 'center',
                              '&:hover': { bgcolor: '#d32f2f', color: '#fff', borderColor: '#d32f2f' }
                            }}
                            onClick={() => { updateStudentStatus(student.id, 'missing'); setMenuOpenId(null); }}
                          >
                            ABSENT
                          </Button>
                        )}
                        {student.status !== 'unchecked' && (
                          <Button
                            type="button"
                            variant='outlined'
                            size='medium'
                            sx={{
                              borderColor: '#a259ff',
                              color: '#a259ff',
                              fontWeight: 'bold',
                              borderRadius: '8px',
                              minWidth: { xs: 0, sm: 90 },
                              px: { xs: 1, sm: 3 },
                              width: { xs: '100%', sm: 'auto' },
                              height: 40,
                              display: 'flex',
                              alignItems: 'center',
                              '&:hover': { bgcolor: 'rgba(162, 89, 255, 0.1)', color: '#a259ff', borderColor: '#a259ff' }
                            }}
                            onClick={() => { uncheckStudentAttendance(student.id); setMenuOpenId(null); }}
                          >
                            UNMARKED
                          </Button>
                        )}
                      </Box>
                    )}
                  </Box>
                </ListItem>
          ))}
        </List>
          )}
      </Paper>
      )}

      {/* Manual Attendance Modal */}
      <Dialog 
        open={showManualAttendance} 
        onClose={() => setShowManualAttendance(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Manual Attendance - {packages.length > 0 ? packages[0].name : 'Class'} on {date}
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