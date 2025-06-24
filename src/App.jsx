import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
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
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Tennis Academy MVP
          </Typography>
          <Tabs 
            value={currentTab} 
            onChange={() => {}} // disables manual tab switching, navigation is handled by Link
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab 
              label="Packages" 
              component={Link} 
              to="/packages"
              sx={{ color: 'white' }}
            />
            <Tab 
              label="QR Code" 
              component={Link} 
              to="/qr"
              sx={{ color: 'white' }}
            />
            <Tab 
              label="Coach Portal" 
              component={Link} 
              to="/coach"
              sx={{ color: 'white' }}
            />
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
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
