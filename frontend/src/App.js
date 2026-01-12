import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import Timetable from './pages/Timetable';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import './styles/Global.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/welcome" />;
  return children;
};

// Back Button Handler Component
const BackButtonHandler = () => {
  const navigate = React.useRef(null);
  const location = React.useRef(null);

  // We need to access the current navigation context
  // This hook trick allows us to use standard hooks but keep the listener stable
  const NavigateContext = () => {
    const nav = require('react-router-dom').useNavigate();
    const loc = require('react-router-dom').useLocation();
    navigate.current = nav;
    location.current = loc;
    return null;
  };

  React.useEffect(() => {
    const { App } = require('@capacitor/app');

    const handleBackButton = async () => {
      if (!navigate.current) return;

      // If on root pages, exit app
      if (location.current.pathname === '/' || location.current.pathname === '/welcome') {
        const { App: CapApp } = require('@capacitor/app');
        CapApp.exitApp();
      } else {
        // Otherwise go back
        navigate.current(-1);
      }
    };

    const listener = App.addListener('backButton', handleBackButton);
    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  return <NavigateContext />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <BackButtonHandler />
        <Toaster position="top-center" />
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timetable"
            element={
              <ProtectedRoute>
                <Timetable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
