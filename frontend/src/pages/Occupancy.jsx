import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Users, 
  UserMinus, 
  CalendarDays, 
  DoorOpen, 
  Percent, 
  ArrowRight,
  Fingerprint,
  FileText,
  Sparkles,
  Search
} from 'lucide-react';

const Occupancy = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    const fetchOccupancyData = async () => {
      try {
        const overviewRes = await api.get('/energy/overview');
        setData(overviewRes.data);
        
        const studentsRes = await api.get('/students/');
        setStudents(studentsRes.data);
        
        const leavesRes = await api.get('/students/leaves');
        setLeaves(leavesRes.data);
      } catch (error) {
        console.error('Failed fetching occupancy lists:', error);
        
        // Mock data fallback if offline
        setStudents([
          { id: 1, roll_number: 'CS22B104', name: 'Rohan Kulkarni', email: 'rohan.k@college.edu', contact: '+91 9876543210', status: 'present' },
          { id: 2, roll_number: 'EC22B208', name: 'Aman Sharma', email: 'aman.s@college.edu', contact: '+91 9876543211', status: 'outside' },
          { id: 3, roll_number: 'ME22B301', name: 'Gourav Patil', email: 'gourav.p@college.edu', contact: '+91 9876543212', status: 'leave' },
          { id: 4, roll_number: 'EE22B112', name: 'Nikhil Deshmukh', email: 'nikhil.d@college.edu', contact: '+91 9876543213', status: 'present' },
        ]);
        
        setLeaves([
          { id: 1, student_id: 3, start_date: '2026-07-30', end_date: '2026-08-04', reason: 'Family function trip', status: 'Approved' },
          { id: 2, student_id: 2, start_date: '2026-08-01', end_date: '2026-08-03', reason: 'Medical Checkup', status: 'Pending' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOccupancyData();
  }, []);

  const getStudentStatusBadge = (status) => {
    switch (status) {
      case 'present': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-brand-success border border-green-200">Present</span>;
      case 'outside': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-brand-warning border border-amber-200">Outside Campus</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-brand-primary border border-blue-200">On Leave</span>;
    }
  };

  const getLeaveStatusBadge = (status) => {
    switch (status) {
      case 'Approved': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-brand-success">Approved</span>;
      case 'Rejected': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-brand-danger">Rejected</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-brand-warning">Pending Approval</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-12 w-64 bg-slate-200 dark:bg-slate-700 rounded-premium-sm" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-700 rounded-premium" />
          ))}
        </div>
      </div>
    );
  }

  const summary = data?.summary || { total_hostels: 4, total_floors: 16, total_rooms: 256, occupancy_rate: 75.0, students_present: 768, students_outside: 180, students_leave: 76 };

  // Filter students based on search string
  const filteredStudents = students.filter(st => 
    st.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    st.roll_number.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div>
        <h2 className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary tracking-tight">Occupancy Analysis</h2>
        <p className="text-sm font-medium text-brand-textSecondary dark:text-dark-textSecondary">Real-time attendance biometric scans, holiday plans, and room densities.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        
        <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-5 rounded-premium shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-1">Students Present</span>
            <span className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary">{summary.students_present}</span>
          </div>
          <div className="p-2.5 rounded-premium-sm bg-green-50 text-brand-success">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-5 rounded-premium shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-1">Students Outside</span>
            <span className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary">{summary.students_outside}</span>
          </div>
          <div className="p-2.5 rounded-premium-sm bg-amber-50 text-brand-warning">
            <UserMinus className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-5 rounded-premium shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-1">Students on Leave</span>
            <span className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary">{summary.students_leave}</span>
          </div>
          <div className="p-2.5 rounded-premium-sm bg-brand-veryLightBlue text-brand-primary">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-5 rounded-premium shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-1">Active Rooms</span>
            <span className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary">192 / 256</span>
          </div>
          <div className="p-2.5 rounded-premium-sm bg-brand-veryLightBlue text-brand-primary">
            <DoorOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-5 rounded-premium shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-1">Occupancy Density</span>
            <span className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary">{summary.occupancy_rate}%</span>
          </div>
          <div className="p-2.5 rounded-premium-sm bg-brand-veryLightBlue text-brand-primary">
            <Percent className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Beautiful pipeline diagram requested by user */}
      <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-6 rounded-premium shadow-premium space-y-6">
        <div>
          <h3 className="font-extrabold text-brand-textPrimary dark:text-dark-textPrimary text-base">Occupancy Flow Engine Pipeline</h3>
          <p className="text-xs text-brand-textSecondary dark:text-dark-textSecondary">How real-time parameters compile to trigger smart electrical override commands.</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-premium-sm bg-brand-bg dark:bg-slate-900 border border-brand-border dark:border-dark-border overflow-x-auto">
          
          {/* Node 1: Biometric IN/OUT */}
          <div className="flex flex-col items-center p-3.5 bg-white dark:bg-slate-800 rounded-premium-sm shadow-premium border border-brand-border dark:border-dark-border min-w-[140px] text-center">
            <Fingerprint className="w-5 h-5 text-brand-primary mb-1.5" />
            <span className="text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary leading-none">Biometric Gate</span>
            <span className="text-[9px] text-brand-textSecondary dark:text-dark-textSecondary font-semibold mt-1">IN / OUT Logs</span>
          </div>

          <ArrowRight className="w-5 h-5 text-brand-primary rotate-90 lg:rotate-0" />

          {/* Node 2: Leaves & Calendar */}
          <div className="flex flex-col items-center p-3.5 bg-white dark:bg-slate-800 rounded-premium-sm shadow-premium border border-brand-border dark:border-dark-border min-w-[140px] text-center">
            <CalendarDays className="w-5 h-5 text-brand-primary mb-1.5" />
            <span className="text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary leading-none">Calendar & Leaves</span>
            <span className="text-[9px] text-brand-textSecondary dark:text-dark-textSecondary font-semibold mt-1">Leave records + Timetable</span>
          </div>

          <ArrowRight className="w-5 h-5 text-brand-primary rotate-90 lg:rotate-0" />

          {/* Node 3: Academic context */}
          <div className="flex flex-col items-center p-3.5 bg-white dark:bg-slate-800 rounded-premium-sm shadow-premium border border-brand-border dark:border-dark-border min-w-[140px] text-center">
            <FileText className="w-5 h-5 text-brand-primary mb-1.5" />
            <span className="text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary leading-none">Academic Context</span>
            <span className="text-[9px] text-brand-textSecondary dark:text-dark-textSecondary font-semibold mt-1">Working vs Holidays</span>
          </div>

          <ArrowRight className="w-5 h-5 text-brand-primary rotate-90 lg:rotate-0" />

          {/* Node 4: AI Engine */}
          <div className="flex flex-col items-center p-3.5 bg-brand-primary text-white rounded-premium-sm shadow-premium min-w-[150px] text-center">
            <Sparkles className="w-5 h-5 fill-current text-white mb-1.5 animate-pulse" />
            <span className="text-xs font-bold leading-none">Occupancy Engine</span>
            <span className="text-[9px] opacity-80 font-bold mt-1">State Predictor</span>
          </div>

          <ArrowRight className="w-5 h-5 text-brand-primary rotate-90 lg:rotate-0" />

          {/* Node 5: Override Suggestion */}
          <div className="flex flex-col items-center p-3.5 bg-green-50 dark:bg-green-950/20 text-brand-success rounded-premium-sm border border-brand-success/30 shadow-premium min-w-[140px] text-center">
            <DoorOpen className="w-5 h-5 text-brand-success mb-1.5" />
            <span className="text-xs font-bold leading-none">Smart Override</span>
            <span className="text-[9px] text-brand-success font-bold mt-1">Energy Saving Action</span>
          </div>

        </div>
      </div>

      {/* Student list and Leaves tracking table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Active Students Log */}
        <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-6 rounded-premium shadow-premium flex flex-col h-[400px]">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <div>
              <h3 className="font-extrabold text-sm text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider">Campus Students Ledger</h3>
              <p className="text-[11px] text-brand-textSecondary">List of hostel occupants and active campus statuses.</p>
            </div>
            
            {/* Table search bar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-2.5 flex items-center text-brand-textSecondary"><Search className="w-3.5 h-3.5" /></span>
              <input 
                type="text" 
                placeholder="Search roll / name..." 
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-premium-sm border border-brand-border dark:border-dark-border bg-brand-bg dark:bg-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-sidebar dark:bg-slate-900 sticky top-0 font-bold text-brand-textSecondary text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Roll Number</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border dark:divide-dark-border">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-brand-bg dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-3 font-bold text-brand-primary dark:text-brand-accent">{st.roll_number}</td>
                    <td className="p-3 font-semibold text-brand-textPrimary dark:text-dark-textPrimary">{st.name}</td>
                    <td className="p-3 text-brand-textSecondary dark:text-dark-textSecondary">{st.email}</td>
                    <td className="p-3">{getStudentStatusBadge(st.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leaves Approval log */}
        <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-6 rounded-premium shadow-premium flex flex-col h-[400px]">
          <div>
            <h3 className="font-extrabold text-sm text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-1">Student Leave Logs</h3>
            <p className="text-[11px] text-brand-textSecondary mb-4">Leave records indicating planned vacancies for energy optimization rules.</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-sidebar dark:bg-slate-900 sticky top-0 font-bold text-brand-textSecondary text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Student ID</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border dark:divide-dark-border">
                {leaves.map((lv) => (
                  <tr key={lv.id} className="hover:bg-brand-bg dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-3 font-bold text-brand-textPrimary dark:text-dark-textPrimary">ID: {lv.student_id}</td>
                    <td className="p-3 text-brand-textSecondary dark:text-dark-textSecondary font-semibold">
                      {lv.start_date} to {lv.end_date}
                    </td>
                    <td className="p-3 text-brand-textPrimary dark:text-dark-textPrimary font-medium">{lv.reason}</td>
                    <td className="p-3">{getLeaveStatusBadge(lv.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Occupancy;
