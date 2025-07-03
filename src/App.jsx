import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Button, Box, Tabs, Tab } from '@mui/material';
import { useState } from 'react';

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
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <AppBar position="static" sx={{ 
        background: 'rgba(30, 44, 80, 0.85)',
        boxShadow: '0 4px 24px rgba(30,60,114,0.12)',
        height: { xs: 64, sm: 72 },
        justifyContent: 'center',
        px: { xs: 1, sm: 2, md: 6 },
        backdropFilter: 'blur(8px)',
      }}>
        <Toolbar disableGutters sx={{ 
          minHeight: { xs: 64, sm: 72 }, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '100%',
          px: { xs: 0, sm: 2 }
        }}>
          <Tabs 
            value={currentTab} 
            onChange={() => {}} 
            textColor="inherit"
            indicatorColor="secondary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              minHeight: { xs: 64, sm: 72 },
              ".MuiTab-root": { 
                fontWeight: 600, 
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' }, 
                color: '#e0e0e0', 
                textTransform: 'none', 
                minWidth: { xs: 80, sm: 100, md: 120 },
                maxWidth: { xs: 120, sm: 140, md: 160 },
                px: { xs: 1, sm: 2 },
                py: { xs: 1, sm: 1.5 }
              },
              ".Mui-selected": { color: '#fff' },
              ".MuiTabs-indicator": { backgroundColor: '#a259ff', height: 4, borderRadius: 2 },
              ".MuiTabs-scrollButtons": {
                color: '#fff',
                '&.Mui-disabled': {
                  opacity: 0.3,
                  color: '#bdbdbd'
                }
              },
              ".MuiTabs-flexContainer": {
                justifyContent: 'center'
              }
            }}
          >
            <Tab label="Packages" component={Link} to="/packages" />
            <Tab label="QR Code" component={Link} to="/qr" />
            <Tab label="Coach Portal" component={Link} to="/coach" />
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container sx={{ 
        mt: { xs: 4, sm: 6 }, 
        px: { xs: 2, sm: 3, md: 4 },
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '80vh', 
        maxWidth: 'lg!important' 
      }}>
        <Routes>
          <Route path="/" element={<Packages />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/qr" element={<GenerateQR />} />
          <Route path="/coach" element={<CoachLogin />} />
          <Route path="/coach/attendance" element={<CoachAttendance />} />
          <Route path="/coach/cancel" element={<CoachCancelClass />} />
          <Route path="*" element={<Navigate to="/" replace />} />
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
