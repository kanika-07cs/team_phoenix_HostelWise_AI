import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Building2, ArrowRight, Zap, Users, LayoutGrid } from 'lucide-react';

const Hostels = () => {
  const { user } = useAuth();
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role_name === 'supervisor' && user.assigned_hostel_id) {
      navigate(`/hostels/${user.assigned_hostel_id}`, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const response = await api.get('/hostels/');
        setHostels(response.data);
      } catch (error) {
        console.error('Failed fetching hostels list:', error);
        
        // Fallback mock hostels if API is not running
        setHostels([
          { id: 1, name: 'Hostel A', total_floors: 3, total_rooms: 30, occupancy: 85, current_consumption: 420.5 },
          { id: 2, name: 'Hostel B', total_floors: 3, total_rooms: 30, occupancy: 78, current_consumption: 380.2 },
          { id: 3, name: 'Hostel C', total_floors: 3, total_rooms: 30, occupancy: 65, current_consumption: 290.8 },
          { id: 4, name: 'Hostel D', total_floors: 3, total_rooms: 30, occupancy: 52, current_consumption: 193.0 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHostels();
  }, []);

  if (loading) {
    return (
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-44 bg-slate-200 dark:bg-slate-700 rounded-premium" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h2 className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary tracking-tight">Hostel Ecosystem</h2>
        <p className="text-sm font-medium text-brand-textSecondary dark:text-dark-textSecondary">Select a hostel to view floors layout, wing segments, and room allocations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hostels.map((hostel) => (
          <div 
            key={hostel.id}
            onClick={() => navigate(`/hostels/${hostel.id}`)}
            className="hover-card bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-6 rounded-premium shadow-premium flex flex-col justify-between h-48 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-premium-sm bg-brand-veryLightBlue dark:bg-slate-700/50 text-brand-primary dark:text-brand-accent">
                  <Building2 className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-brand-textPrimary dark:text-dark-textPrimary group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors duration-200">
                    {hostel.name}
                  </h3>
                  <span className="text-[10px] font-bold text-brand-textSecondary dark:text-dark-textSecondary uppercase tracking-wider">
                    {hostel.total_floors} Floors &bull; {hostel.total_rooms || 30} Rooms
                  </span>
                </div>
              </div>
              <span className="p-2 rounded-full border border-brand-border dark:border-dark-border group-hover:border-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 text-brand-textSecondary dark:text-dark-textSecondary">
                <ArrowRight className="w-4.5 h-4.5" />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-brand-border dark:border-dark-border">
              <div className="flex items-center gap-2 text-brand-textPrimary dark:text-dark-textPrimary">
                <Users className="w-4 h-4 text-brand-textSecondary" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider">Occupancy</span>
                  <span className="text-sm font-extrabold">{hostel.occupancy || '75%'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-brand-textPrimary dark:text-dark-textPrimary">
                <Zap className="w-4 h-4 text-brand-primary" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider">Electricity consumption</span>
                  <span className="text-sm font-extrabold">{hostel.current_consumption || '312'} kWh</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Hostels;
