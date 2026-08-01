import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line,
  CartesianGrid
} from 'recharts';
import { 
  Zap, 
  Activity, 
  TrendingUp, 
  Gauge, 
  ActivitySquare, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown
} from 'lucide-react';

const analyticsDaily = [
  { name: '00:00', ActiveLoad: 35, PassiveLoad: 12 },
  { name: '04:00', ActiveLoad: 28, PassiveLoad: 10 },
  { name: '08:00', ActiveLoad: 92, PassiveLoad: 18 },
  { name: '12:00', ActiveLoad: 125, PassiveLoad: 20 },
  { name: '16:00', ActiveLoad: 98, PassiveLoad: 15 },
  { name: '20:00', ActiveLoad: 145, PassiveLoad: 25 },
  { name: '23:00', ActiveLoad: 65, PassiveLoad: 12 },
];

const analyticsWeekly = [
  { name: 'Mon', ActiveLoad: 980, PassiveLoad: 180 },
  { name: 'Tue', ActiveLoad: 910, PassiveLoad: 160 },
  { name: 'Wed', ActiveLoad: 1020, PassiveLoad: 190 },
  { name: 'Thu', ActiveLoad: 960, PassiveLoad: 170 },
  { name: 'Fri', ActiveLoad: 1150, PassiveLoad: 210 },
  { name: 'Sat', ActiveLoad: 780, PassiveLoad: 140 },
  { name: 'Sun', ActiveLoad: 710, PassiveLoad: 120 },
];

const analyticsMonthly = [
  { name: 'Week 1', ActiveLoad: 6800, PassiveLoad: 1100 },
  { name: 'Week 2', ActiveLoad: 7100, PassiveLoad: 1250 },
  { name: 'Week 3', ActiveLoad: 7400, PassiveLoad: 1300 },
  { name: 'Week 4', ActiveLoad: 7200, PassiveLoad: 1200 },
];

const Analytics = () => {
  const { user } = useAuth();
  const [range, setRange] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/energy/analytics');
        setAnalyticsData(response.data);
      } catch (error) {
        console.error('Failed loading energy analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const getChartData = () => {
    if (analyticsData) {
      switch (range) {
        case 'weekly': return analyticsData.weekly_load || analyticsWeekly;
        case 'monthly': return analyticsData.monthly_load || analyticsMonthly;
        default: return analyticsData.daily_load || analyticsDaily;
      }
    }
    switch (range) {
      case 'weekly': return analyticsWeekly;
      case 'monthly': return analyticsMonthly;
      default: return analyticsDaily;
    }
  };

  const getRankings = () => {
    const defaultRankings = {
      highestConsuming: [
        { name: 'Floor 3 Wing A', detail: 'High active HVAC loads', value: '180.5 kWh', color: 'text-brand-danger bg-red-50' },
        { name: 'Floor 1 Wing B', detail: 'Idle socket usage', value: '154.2 kWh', color: 'text-brand-danger bg-red-50' }
      ],
      lowestConsuming: [
        { name: 'Floor 2 Wing A', detail: 'Optimal LED standby', value: '88.0 kWh', color: 'text-brand-success bg-green-50' },
        { name: 'Floor 3 Wing B', detail: 'Biometric sleep cycle', value: '112.4 kWh', color: 'text-brand-success bg-green-50' }
      ],
      highestSavings: [
        { name: 'Floor 3 Wing A override', detail: 'Automated schedule cut', value: '48 kWh saved', color: 'text-brand-success bg-green-50' },
        { name: 'Standby optimization', detail: 'Unoccupied wing shutdown', value: '35 kWh saved', color: 'text-brand-success bg-green-50' }
      ]
    };

    if (!analyticsData?.rankings) {
      return {
        highestConsuming: defaultRankings.highestConsuming.map(r => ({ ...r, icon: ArrowUpRight })),
        lowestConsuming: defaultRankings.lowestConsuming.map(r => ({ ...r, icon: ArrowDownRight })),
        highestSavings: defaultRankings.highestSavings.map(r => ({ ...r, icon: TrendingDown }))
      };
    }

    return {
      highestConsuming: analyticsData.rankings.highestConsuming.map(r => ({ ...r, icon: ArrowUpRight })),
      lowestConsuming: analyticsData.rankings.lowestConsuming.map(r => ({ ...r, icon: ArrowDownRight })),
      highestSavings: analyticsData.rankings.highestSavings.map(r => ({ ...r, icon: TrendingDown }))
    };
  };

  const activeRankings = getRankings();
  const frequency = analyticsData?.frequency || "50.02 Hz";
  const powerFactor = analyticsData?.power_factor || "0.94 PF";
  const peakLoad = analyticsData?.peak_load || "64.5 kW";
  const loadDistribution = analyticsData?.load_distribution || "72% Active";

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-12 w-64 bg-slate-200 dark:bg-slate-700 rounded-premium-sm" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-700 rounded-premium" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-premium" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary tracking-tight">Energy Analytics Console</h2>
          <p className="text-sm font-medium text-brand-textSecondary dark:text-dark-textSecondary">
            {user?.role_name === 'supervisor' 
              ? `Audit reviews of active vs passive electrical loads on circuits for: ${user?.assigned_hostel_name || 'My Hostel'}.`
              : 'Deep audit reviews of active vs passive electrical loads on campus-wide smart circuits.'}
          </p>
        </div>
        
        {/* Toggle Range */}
        <div className="flex bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-1 rounded-premium-sm">
          {['daily', 'weekly', 'monthly'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 text-xs font-bold capitalize rounded-premium-sm transition-all duration-200 ${
                range === r 
                  ? 'bg-brand-primary text-white shadow-premium' 
                  : 'text-brand-textSecondary hover:text-brand-primary'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Smart Meter Gauge cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-5 rounded-premium shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-1">Grid Frequency</span>
            <span className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary">{frequency}</span>
            <span className="text-[10px] font-semibold text-brand-success block mt-1">Stable &bull; Nominal 50Hz</span>
          </div>
          <div className="p-2.5 rounded-premium-sm bg-brand-veryLightBlue text-brand-primary"><Activity className="w-5 h-5" /></div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-5 rounded-premium shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-1">Power Factor</span>
            <span className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary">{powerFactor}</span>
            <span className="text-[10px] font-semibold text-brand-success block mt-1">Highly Efficient (ideal &gt;0.9)</span>
          </div>
          <div className="p-2.5 rounded-premium-sm bg-brand-veryLightBlue text-brand-primary"><Gauge className="w-5 h-5" /></div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-5 rounded-premium shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-1">Peak Demand load</span>
            <span className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary">{peakLoad}</span>
            <span className="text-[10px] font-semibold text-brand-textSecondary dark:text-dark-textSecondary block mt-1">Registered today at 20:35</span>
          </div>
          <div className="p-2.5 rounded-premium-sm bg-brand-veryLightBlue text-brand-primary"><Zap className="w-5 h-5 fill-current" /></div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-5 rounded-premium shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-1">Load Distribution</span>
            <span className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary">{loadDistribution}</span>
            <span className="text-[10px] font-semibold text-brand-textSecondary block mt-1">28% Passive Baseload</span>
          </div>
          <div className="p-2.5 rounded-premium-sm bg-brand-veryLightBlue text-brand-primary"><ActivitySquare className="w-5 h-5" /></div>
        </div>

      </div>

      {/* Large load analysis Recharts line chart */}
      <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-6 rounded-premium shadow-premium">
        <div className="mb-6">
          <h3 className="font-extrabold text-brand-textPrimary dark:text-dark-textPrimary text-base">Active vs Passive Circuit Loads</h3>
          <p className="text-xs text-brand-textSecondary">Analysis tracking energy usage during student activity cycles vs passive standby energy draw.</p>
        </div>

        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend verticalAlign="top" height={36}/>
              <Line type="monotone" dataKey="ActiveLoad" stroke="#2563EB" strokeWidth={2.5} name="Active Appliance Load (kWh)" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="PassiveLoad" stroke="#93C5FD" strokeWidth={2} name="Baseload / Standby Power (kWh)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Consuming vs Top Savings Lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Highest consuming */}
        <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-6 rounded-premium shadow-premium">
          <h4 className="font-extrabold text-sm text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-4 border-b border-brand-border dark:border-dark-border pb-2.5">
            Top Energy Consumers
          </h4>
          <div className="space-y-4">
            {activeRankings.highestConsuming.map((r, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${r.color}`}>
                    <r.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary block">{r.name}</span>
                    <span className="text-[10px] font-semibold text-brand-textSecondary dark:text-dark-textSecondary">{r.detail}</span>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-brand-textPrimary dark:text-dark-textPrimary">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lowest consuming */}
        <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-6 rounded-premium shadow-premium">
          <h4 className="font-extrabold text-sm text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-4 border-b border-brand-border dark:border-dark-border pb-2.5">
            Energy Efficient Rankings
          </h4>
          <div className="space-y-4">
            {activeRankings.lowestConsuming.map((r, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${r.color}`}>
                    <r.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary block">{r.name}</span>
                    <span className="text-[10px] font-semibold text-brand-textSecondary dark:text-dark-textSecondary">{r.detail}</span>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-brand-textPrimary dark:text-dark-textPrimary">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Highest savings */}
        <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-6 rounded-premium shadow-premium">
          <h4 className="font-extrabold text-sm text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-4 border-b border-brand-border dark:border-dark-border pb-2.5">
            Highest Savings Actions
          </h4>
          <div className="space-y-4">
            {activeRankings.highestSavings.map((r, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${r.color}`}>
                    <r.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary block">{r.name}</span>
                    <span className="text-[10px] font-semibold text-brand-textSecondary dark:text-dark-textSecondary">{r.detail}</span>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-brand-success">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Analytics;
