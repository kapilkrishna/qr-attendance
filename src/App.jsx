import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import GenerateQR from './pages/GenerateQR';
import ScanQR from './pages/ScanQR';

function App() {
  return (
    <BrowserRouter>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              QR Attendance System
            </Typography>
            <Button color="inherit" component={Link} to="/generate">
              Generate QR
            </Button>
            <Button color="inherit" component={Link} to="/scan">
              Scan QR
            </Button>
          </Toolbar>
        </AppBar>
        <Container sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={<GenerateQR />} />
            <Route path="/generate" element={<GenerateQR />} />
            <Route path="/scan" element={<ScanQR />} />
          </Routes>
        </Container>
      </Box>
    </BrowserRouter>
  );
}

export default App;
