import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  CloudSun,
  ShieldAlert,
  Info,
  TriangleAlert
} from 'lucide-react';

const Navbar = ({ alerts = [], onSearch }) => {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Tick clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync dark mode class with state
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'High': return <ShieldAlert className="w-4 h-4 text-brand-danger" />;
      case 'Warning': return <TriangleAlert className="w-4 h-4 text-brand-warning" />;
      default: return <Info className="w-4 h-4 text-brand-secondary" />;
    }
  };

  return (
    <header className="fixed top-0 right-0 left-64 z-10 flex items-center justify-between h-16 px-8 bg-white border-b border-brand-border dark:bg-dark-bg dark:border-dark-border transition-colors duration-300">
      
      {/* Search Bar */}
      <div className="relative w-80">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-brand-textSecondary dark:text-dark-textSecondary">
          <Search className="w-4 h-4" />
        </span>
        <input 
          type="text" 
          placeholder="Search hostels, rooms or students..." 
          onChange={(e) => onSearch && onSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm rounded-premium-sm bg-brand-bg dark:bg-slate-800 border border-brand-border dark:border-dark-border focus:border-brand-primary dark:focus:border-brand-accent focus:outline-none transition-all duration-200 text-brand-textPrimary dark:text-dark-textPrimary"
        />
      </div>

      {/* Utilities panel */}
      <div className="flex items-center gap-6">
        
        {/* Date & Time Widget */}
        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs font-semibold text-brand-textPrimary dark:text-dark-textPrimary">{formatTime(time)}</span>
          <span className="text-[10px] font-medium text-brand-textSecondary dark:text-dark-textSecondary">{formatDate(time)}</span>
        </div>

        {/* Weather Widget */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-premium-sm bg-brand-bg dark:bg-slate-800 border border-brand-border dark:border-dark-border text-brand-textPrimary dark:text-dark-textPrimary">
          <CloudSun className="w-4 h-4 text-brand-accent" />
          <div className="text-xs font-semibold">
            <span>28°C</span>
            <span className="hidden sm:inline text-[10px] text-brand-textSecondary dark:text-dark-textSecondary font-medium ml-1">Sunny</span>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-premium-sm bg-brand-bg dark:bg-slate-800 border border-brand-border dark:border-dark-border text-brand-textSecondary dark:text-dark-textSecondary hover:text-brand-primary dark:hover:text-white transition-colors duration-200"
          title="Toggle Theme"
        >
          {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-premium-sm bg-brand-bg dark:bg-slate-800 border border-brand-border dark:border-dark-border text-brand-textSecondary dark:text-dark-textSecondary hover:text-brand-primary dark:hover:text-white transition-colors duration-200"
            title="Notification alerts"
          >
            <Bell className="w-4.5 h-4.5" />
            {alerts.length > 0 && (
              <span className="absolute top-1 right-1 flex w-2.5 h-2.5 bg-brand-danger rounded-full ring-2 ring-white dark:ring-slate-900 live-indicator" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border rounded-premium-sm shadow-premium z-30 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-brand-sidebar dark:bg-slate-900 border-b border-brand-border dark:border-dark-border">
                <span className="text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary">Recent Activity Alerts</span>
                <span className="text-[10px] font-bold bg-brand-danger/10 text-brand-danger px-2 py-0.5 rounded-full">
                  {alerts.length} Active
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-brand-border dark:divide-dark-border">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-brand-textSecondary dark:text-dark-textSecondary">
                    No active energy anomalies. System normal.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="p-3.5 hover:bg-brand-bg dark:hover:bg-slate-700/50 transition-colors duration-200">
                      <div className="flex gap-2">
                        <span className="mt-0.5">{getAlertIcon(alert.severity)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary truncate">{alert.room} ({alert.hostel})</span>
                            <span className="text-[10px] text-brand-textSecondary dark:text-dark-textSecondary font-medium">{alert.time}</span>
                          </div>
                          <p className="text-xs text-brand-textSecondary dark:text-dark-textSecondary leading-normal">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
