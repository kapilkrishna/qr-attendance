import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Button, Box, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import logo from './assets/logo.png';

// Import pages
import Packages from './pages/Packages';
import GenerateQR from './pages/GenerateQR';
import CoachLogin from './pages/CoachLogin';
import CoachAttendance from './pages/CoachAttendance';
import CoachCancelClass from './pages/CoachCancelClass';

function App() {
  const location = useLocation();
  // Map pathnames to tab indices
  const tabMap = {
    '/packages': 0,
    '/': 0,
    '/qr': 1,
    '/coach': 2,
    '/coach/attendance': 2,
    '/coach/cancel': 2,
  };
  const currentTab = tabMap[location.pathname] ?? 0;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ 
        background: 'rgba(30, 44, 80, 0.85)',
        boxShadow: '0 4px 24px rgba(30,60,114,0.12)',
        height: 72,
        justifyContent: 'center',
        px: { xs: 2, md: 6 },
        backdropFilter: 'blur(8px)',
      }}>
        <Toolbar disableGutters sx={{ minHeight: 72, display: 'flex', alignItems: 'center', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3, ml: 2 }}>
            <img src={logo} alt="CoachPro Logo" style={{ height: 48, marginRight: 20 }} />
          </Box>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: 1, fontSize: '2rem', color: '#fff', textShadow: '0 2px 8px rgba(30,60,114,0.18)' }}>
            CoachPro
          </Typography>
          <Tabs 
            value={currentTab} 
            onChange={() => {}} 
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ 
              minHeight: 72,
              ".MuiTab-root": { fontWeight: 600, fontSize: '1.1rem', color: '#e0e0e0', textTransform: 'none', minWidth: 120 },
              ".Mui-selected": { color: '#fff' },
              ".MuiTabs-indicator": { backgroundColor: '#a259ff', height: 4, borderRadius: 2 }
            }}
          >
            <Tab label="Packages" component={Link} to="/packages" />
            <Tab label="QR Code" component={Link} to="/qr" />
            <Tab label="Coach Portal" component={Link} to="/coach" />
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', maxWidth: 'lg!important' }}>
        <Routes>
          <Route path="/" element={<Packages />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/qr" element={<GenerateQR />} />
          <Route path="/coach" element={<CoachLogin />} />
          <Route path="/coach/attendance" element={<CoachAttendance />} />
          <Route path="/coach/cancel" element={<CoachCancelClass />} />
        </Routes>
      </Container>
    </Box>
  );
}

function AppWithRouter() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default AppWithRouter;
