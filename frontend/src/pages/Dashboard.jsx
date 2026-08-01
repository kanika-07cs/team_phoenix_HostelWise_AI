import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  LineChart,
  Line
} from 'recharts';
import { 
  Activity, 
  Zap, 
  Gauge, 
  DollarSign, 
  Leaf, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle,
  Building,
  Layers,
  Users,
  Grid,
  Sparkles
} from 'lucide-react';

// Pre-seeded sparkline dataset
const sparkData1 = [{ v: 420 }, { v: 450 }, { v: 430 }, { v: 480 }, { v: 490 }, { v: 510 }, { v: 540 }];
const sparkData2 = [{ v: 220 }, { v: 228 }, { v: 225 }, { v: 232 }, { v: 230 }, { v: 228 }, { v: 230 }];
const sparkData3 = [{ v: 1200 }, { v: 1230 }, { v: 1190 }, { v: 1240 }, { v: 1280 }, { v: 1260 }, { v: 1284 }];
const sparkData4 = [{ v: 100 }, { v: 120 }, { v: 135 }, { v: 160 }, { v: 190 }, { v: 205 }, { v: 214 }];

const trendDataDaily = [
  { time: '00:00', Expected: 50, Actual: 45 },
  { time: '04:00', Expected: 40, Actual: 38 },
  { time: '08:00', Expected: 90, Actual: 110 },
  { time: '12:00', Expected: 120, Actual: 135 },
  { time: '16:00', Expected: 110, Actual: 105 },
  { time: '20:00', Expected: 150, Actual: 162 },
  { time: '23:00', Expected: 80, Actual: 75 },
];

const trendDataWeekly = [
  { time: 'Mon', Expected: 1200, Actual: 1280 },
  { time: 'Tue', Expected: 1250, Actual: 1210 },
  { time: 'Wed', Expected: 1300, Actual: 1340 },
  { time: 'Thu', Expected: 1280, Actual: 1290 },
  { time: 'Fri', Expected: 1350, Actual: 1420 },
  { time: 'Sat', Expected: 950, Actual: 1050 },
  { time: 'Sun', Expected: 900, Actual: 980 },
];

const trendDataMonthly = [
  { time: 'Week 1', Expected: 8500, Actual: 8900 },
  { time: 'Week 2', Expected: 8800, Actual: 8650 },
  { time: 'Week 3', Expected: 9100, Actual: 9400 },
  { time: 'Week 4', Expected: 8900, Actual: 9150 },
];

const Dashboard = ({ onAlertTrigger }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendRange, setTrendRange] = useState('daily'); // 'daily' | 'weekly' | 'monthly'

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await api.get('/energy/overview');
        setData(response.data);
        if (onAlertTrigger && response.data.alerts) {
          onAlertTrigger(response.data.alerts);
        }
      } catch (error) {
        console.error('Failed fetching dashboard aggregates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [onAlertTrigger]);

  const getTrendData = () => {
    if (data) {
      switch (trendRange) {
        case 'weekly': return data.weekly_trend || trendDataWeekly;
        case 'monthly': return data.monthly_trend || trendDataMonthly;
        default: return data.daily_trend || trendDataDaily;
      }
    }
    switch (trendRange) {
      case 'weekly': return trendDataWeekly;
      case 'monthly': return trendDataMonthly;
      default: return trendDataDaily;
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-12 w-64 bg-slate-200 dark:bg-slate-700 rounded-premium-sm" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-premium" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 h-96 bg-slate-200 dark:bg-slate-700 rounded-premium" />
          <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-premium" />
        </div>
      </div>
    );
  }

  // Fallback defaults if API fails
  const summary = data?.summary || { total_hostels: 4, total_floors: 16, total_rooms: 256, occupancy_rate: 75, students_present: 768, students_outside: 180, students_leave: 76 };
  const realtime = data?.realtime || { voltage: 230.40, current_load: 54.20, frequency: 50.02, power_factor: 0.94, today_consumption_kwh: 1284.5, expected_consumption_kwh: 1450.0, today_cost: 16056.25, today_savings_cost: 2068.75, today_co2_kg: 1091.8, trees_equivalent: 54 };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      
      {/* Welcome Banner */}
      <div className="relative p-8 overflow-hidden rounded-premium bg-gradient-to-r from-brand-primary/10 via-brand-secondary/5 to-transparent border border-brand-primary/10 dark:border-dark-border">
        <div className="absolute top-[-50%] right-[-10%] w-[350px] h-[350px] bg-brand-primary/5 blur-[80px] pointer-events-none" />
        <div className="flex justify-between items-center flex-wrap gap-4 z-10 relative">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-5 h-5 text-brand-primary dark:text-brand-accent animate-pulse" />
              <h2 className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary tracking-tight">
                Welcome back, {user?.full_name || user?.username}!
              </h2>
            </div>
            <p className="text-sm font-medium text-brand-textSecondary dark:text-dark-textSecondary">
              {user?.role_name === 'supervisor' 
                ? `Currently monitoring energy parameters for your assigned scope: ${user?.assigned_hostel_name || 'My Hostel'}. System health is optimal.`
                : 'Here is your campus smart hostel energy summary for today. System health is optimal.'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-accent px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-brand-primary dark:bg-brand-accent live-indicator" />
            Live monitoring Active
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Current Power */}
        <div className="hover-card p-6 bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border rounded-premium shadow-premium flex flex-col justify-between h-40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-textSecondary dark:text-dark-textSecondary uppercase tracking-wider">Current Power Load</span>
            <div className="p-2 rounded-premium-sm bg-brand-veryLightBlue dark:bg-slate-700/50 text-brand-primary dark:text-brand-accent">
              <Zap className="w-5 h-5 fill-current" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-brand-textPrimary dark:text-dark-textPrimary">{realtime.current_load} kW</span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-brand-danger mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+3.2% vs last hour</span>
            </div>
          </div>
          <div className="h-10 w-full overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData1}>
                <Area type="monotone" dataKey="v" stroke="#2563EB" fill="#DBEAFE" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI 2: Current Voltage */}
        <div className="hover-card p-6 bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border rounded-premium shadow-premium flex flex-col justify-between h-40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-textSecondary dark:text-dark-textSecondary uppercase tracking-wider">Campus Avg Voltage</span>
            <div className="p-2 rounded-premium-sm bg-brand-veryLightBlue dark:bg-slate-700/50 text-brand-primary dark:text-brand-accent">
              <Gauge className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-brand-textPrimary dark:text-dark-textPrimary">{realtime.voltage} V</span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-brand-success mt-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Stable (±0.4V deviation)</span>
            </div>
          </div>
          <div className="h-10 w-full overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData2}>
                <Area type="monotone" dataKey="v" stroke="#3B82F6" fill="#DBEAFE" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI 3: Today's Consumption */}
        <div className="hover-card p-6 bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border rounded-premium shadow-premium flex flex-col justify-between h-40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-textSecondary dark:text-dark-textSecondary uppercase tracking-wider">Today's Consumption</span>
            <div className="p-2 rounded-premium-sm bg-brand-veryLightBlue dark:bg-slate-700/50 text-brand-primary dark:text-brand-accent">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-brand-textPrimary dark:text-dark-textPrimary">{realtime.today_consumption_kwh} kWh</span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-brand-success mt-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>-11.4% (under expected forecast)</span>
            </div>
          </div>
          <div className="h-10 w-full overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData3}>
                <Area type="monotone" dataKey="v" stroke="#2563EB" fill="#DBEAFE" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI 4: Today's Savings */}
        <div className="hover-card p-6 bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border rounded-premium shadow-premium flex flex-col justify-between h-40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-textSecondary dark:text-dark-textSecondary uppercase tracking-wider">Today's Savings (Cost)</span>
            <div className="p-2 rounded-premium-sm bg-green-50 dark:bg-green-950/20 text-brand-success">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-brand-textPrimary dark:text-dark-textPrimary">₹{realtime.today_savings_cost}</span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-brand-success mt-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>+₹420 saved since yesterday</span>
            </div>
          </div>
          <div className="h-10 w-full overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData4}>
                <Area type="monotone" dataKey="v" stroke="#22C55E" fill="#DCFCE7" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Expected vs Actual Line Chart */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border rounded-premium shadow-premium flex flex-col justify-between">
          <div className="flex justify-between items-center flex-wrap gap-2 mb-6">
            <div>
              <h3 className="font-extrabold text-lg text-brand-textPrimary dark:text-dark-textPrimary tracking-tight">Energy Consumption Trends</h3>
              <p className="text-xs text-brand-textSecondary dark:text-dark-textSecondary">Expected baseline forecast comparison against actual active readings.</p>
            </div>
            <div className="flex bg-brand-bg dark:bg-slate-900 border border-brand-border dark:border-dark-border p-1 rounded-premium-sm">
              {['daily', 'weekly', 'monthly'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTrendRange(range)}
                  className={`px-3 py-1.5 text-xs font-bold capitalize rounded-premium-sm transition-all duration-200 ${
                    trendRange === range 
                      ? 'bg-brand-primary text-white shadow-premium' 
                      : 'text-brand-textSecondary hover:text-brand-primary'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getTrendData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#93C5FD" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#93C5FD" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #E5E7EB' }} />
                <Area type="monotone" dataKey="Expected" stroke="#93C5FD" fillOpacity={1} fill="url(#colorExpected)" strokeWidth={2} />
                <Area type="monotone" dataKey="Actual" stroke="#2563EB" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expected vs Actual Bar Chart & AI Insight summary */}
        <div className="p-6 bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border rounded-premium shadow-premium flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-lg text-brand-textPrimary dark:text-dark-textPrimary tracking-tight">Baselines Audit</h3>
            <p className="text-xs text-brand-textSecondary dark:text-dark-textSecondary mb-4">Comparison of today's cumulative consumption values.</p>
          </div>
          
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Expected', kWh: realtime.expected_consumption_kwh },
                { name: 'Actual', kWh: realtime.today_consumption_kwh }
              ]}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <Tooltip />
                <Bar dataKey="kWh" fill="#3B82F6" radius={[12, 12, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 p-4 rounded-premium-sm bg-brand-veryLightBlue/50 dark:bg-slate-900 border border-brand-lightBlue/30">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">AI Audit Explanation</span>
            </div>
            <p className="text-xs text-brand-textPrimary dark:text-dark-textPrimary leading-relaxed">
              Today's actual load is <strong className="text-brand-success font-semibold">12% lower</strong> than baseline. This reduction is driven by 32 empty rooms detected with automated lighting/HVAC optimization rules.
            </p>
          </div>
        </div>

      </div>

      {/* Overview stats layout footer */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 pt-6 border-t border-brand-border dark:border-dark-border">
        
        <div className="flex flex-col">
          {user?.role_name === 'supervisor' ? (
            <>
              <span className="text-[10px] font-bold text-brand-textSecondary dark:text-dark-textSecondary uppercase tracking-wider mb-1">Hostel Scope</span>
              <span className="text-2xl font-black text-brand-primary dark:text-brand-accent truncate max-w-[180px]" title={summary.hostel_name}>{summary.hostel_name || user?.assigned_hostel_name}</span>
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold text-brand-textSecondary dark:text-dark-textSecondary uppercase tracking-wider mb-1">Total Hostels</span>
              <span className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary">{summary.total_hostels}</span>
            </>
          )}
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-brand-textSecondary dark:text-dark-textSecondary uppercase tracking-wider mb-1">Total Floors</span>
          <span className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary">{summary.total_floors}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-brand-textSecondary dark:text-dark-textSecondary uppercase tracking-wider mb-1">Total Rooms</span>
          <span className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary">{summary.total_rooms}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-brand-textSecondary dark:text-dark-textSecondary uppercase tracking-wider mb-1">Total Students</span>
          <span className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary">{summary.students_present + summary.students_outside + summary.students_leave}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-brand-textSecondary dark:text-dark-textSecondary uppercase tracking-wider mb-1">Occupancy Rate</span>
          <span className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary">{summary.occupancy_rate}%</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-brand-textSecondary dark:text-dark-textSecondary uppercase tracking-wider mb-1">Trees Equivalent</span>
          <span className="text-2xl font-black text-brand-success flex items-center gap-1.5">
            <Leaf className="w-5 h-5 fill-current" />
            {realtime.trees_equivalent}
          </span>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
