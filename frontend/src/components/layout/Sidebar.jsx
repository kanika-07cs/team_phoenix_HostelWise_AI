import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  BarChart3, 
  FileSpreadsheet, 
  UserCog, 
  Settings, 
  LogOut,
  Zap
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  
  const isSuperAdmin = user?.role_name === 'super_admin';

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    isSuperAdmin 
      ? { name: 'Hostels & Map', path: '/hostels', icon: Building2 }
      : { name: user?.assigned_hostel_name || 'My Hostel', path: `/hostels/${user?.assigned_hostel_id || 1}`, icon: Building2 },
    { name: 'Occupancy', path: '/occupancy', icon: Users },
    { name: 'Energy Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
    ...(isSuperAdmin ? [{ name: 'User Management', path: '/users', icon: UserCog }] : []),
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex flex-col w-64 bg-brand-sidebar border-r border-brand-border dark:bg-dark-sidebar dark:border-dark-border transition-colors duration-300">
      {/* Sidebar Header / Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-brand-border dark:border-dark-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-premium-sm bg-brand-primary text-white shadow-premium">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="font-extrabold text-brand-textPrimary dark:text-dark-textPrimary leading-none tracking-tight">HostelWise AI</h1>
          <span className="text-[10px] font-medium text-brand-textSecondary dark:text-dark-textSecondary tracking-wider uppercase block mt-1">Smart Hostel energy</span>
        </div>
      </div>

      {/* Nav Menu Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3.5 px-4 py-3 rounded-premium-sm font-medium text-sm transition-all duration-200
              ${isActive 
                ? 'bg-brand-primary text-white shadow-premium' 
                : 'text-brand-textSecondary hover:text-brand-primary hover:bg-brand-veryLightBlue/50 dark:text-dark-textSecondary dark:hover:text-white dark:hover:bg-slate-800'
              }
            `}
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User Session card and Logout */}
      <div className="p-4 border-t border-brand-border dark:border-dark-border">
        <div className="flex items-center justify-between p-3.5 rounded-premium-sm bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border shadow-premium">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-veryLightBlue text-brand-primary font-bold uppercase text-sm shrink-0">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-brand-textPrimary dark:text-dark-textPrimary truncate">{user?.full_name || user?.username}</p>
              <p className="text-[10px] font-medium text-brand-textSecondary dark:text-dark-textSecondary capitalize truncate">
                {user?.role_name?.replace('_', ' ') || 'User'}
              </p>
            </div>
          </div>
          <button 
            onClick={logout}
            title="Logout"
            className="p-1.5 rounded-lg text-brand-textSecondary hover:text-brand-danger hover:bg-red-50 dark:text-dark-textSecondary dark:hover:bg-red-950/30 transition-colors duration-200 shrink-0"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
