import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components & Layout
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Hostels from './pages/Hostels';
import HostelDetails from './pages/HostelDetails';
import Occupancy from './pages/Occupancy';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';

// Route Guard for Authenticated sessions
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg dark:bg-dark-bg">
        <span className="w-8 h-8 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role_name)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Layout Shell wrapper including Sidebar and Navbar grids
const LayoutShell = ({ children, alerts, onSearch }) => {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-textPrimary dark:bg-dark-bg dark:text-dark-textPrimary transition-colors duration-300">
      <Sidebar />
      <div className="pl-64 min-h-screen flex flex-col">
        <Navbar alerts={alerts} onSearch={onSearch} />
        <main className="flex-1 pt-16 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user } = useAuth();
  const [globalAlerts, setGlobalAlerts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAlertTrigger = (alertsList) => {
    setGlobalAlerts(alertsList);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <Router>
      <Routes>
        {/* Auth Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <LayoutShell alerts={globalAlerts} onSearch={handleSearch}>
                <Routes>
                  <Route path="/" element={<Dashboard onAlertTrigger={handleAlertTrigger} />} />
                  <Route path="/hostels" element={<Hostels />} />
                  <Route path="/hostels/:id" element={<HostelDetails />} />
                  <Route path="/occupancy" element={<Occupancy />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/reports" element={<Reports />} />
                  
                  {/* Super Admin Restricted User Management */}
                  <Route 
                    path="/users" 
                    element={
                      <ProtectedRoute allowedRoles={['super_admin']}>
                        <UserManagement />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route path="/settings" element={<Settings />} />
                  
                  {/* Wildcard Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </LayoutShell>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
