import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FileSpreadsheet, 
  FileDown, 
  Settings, 
  CheckCircle,
  HelpCircle,
  FileText
} from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form parameters
  const [reportType, setReportType] = useState('Daily');
  const [reportCategory, setReportCategory] = useState('Energy'); // 'Energy' | 'Carbon' | 'Occupancy'
  const [exportFormat, setExportFormat] = useState('Excel'); // 'PDF' | 'Excel' | 'CSV'
  const [selectedHostel, setSelectedHostel] = useState('1'); // Hostel ID
  
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const fetchReports = async () => {
    try {
      const response = await api.get('/reports/');
      setReports(response.data);
    } catch (error) {
      console.error('Failed fetching reports archive:', error);
      
      // Fallback mock database logs if offline
      setReports([
        { id: 1, name: 'July Hostel Energy Audit Report', type: 'Monthly', generated_at: '2026-07-28T12:00:00Z', file_path: '/exports/reports/july_audit_1722144000.xlsx' },
        { id: 2, name: 'Daily Consumption Log - Hostel A', type: 'Daily', generated_at: '2026-07-30T18:30:00Z', file_path: '/exports/reports/daily_hostela_1722316800.pdf' },
        { id: 3, name: 'Weekly Occupancy Variance Matrix', type: 'Weekly', generated_at: '2026-07-25T09:00:00Z', file_path: '/exports/reports/weekly_variance_1721884800.xlsx' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setMessage('Parsing electrical parameters and compilation cycles...');
    
    const reportName = `${reportType} ${reportCategory} Audit Log - Hostel A`;
    const payload = {
      name: reportName,
      type: reportType,
      generated_by: user?.id || 1
    };

    try {
      await api.post('/reports/generate', payload);
      setTimeout(() => {
        setMessage('Structuring cells and formatting Excel schemas...');
        setTimeout(() => {
          setGenerating(false);
          setMessage('');
          fetchReports(); // Refresh history log
        }, 1000);
      }, 1000);
    } catch (error) {
      console.warn('API error seeding report. Logging locally.', error);
      // Mock insert on failure
      setTimeout(() => {
        const mockNewReport = {
          id: reports.length + 1,
          name: reportName,
          type: reportType,
          generated_at: new Date().toISOString(),
          file_path: `/exports/reports/${reportName.toLowerCase().replace(/ /g, '_')}_${Date.now()}.xlsx`
        };
        setReports(prev => [mockNewReport, ...prev]);
        setGenerating(false);
        setMessage('');
      }, 1500);
    }
  };

  const getFormatBadge = (path) => {
    if (path.endsWith('.pdf')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-brand-danger border border-red-200">PDF</span>;
    }
    if (path.endsWith('.csv')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-brand-primary border border-blue-200">CSV</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-brand-success border border-green-200">Excel</span>;
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div>
        <h2 className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary tracking-tight">Audit Reports Center</h2>
        <p className="text-sm font-medium text-brand-textSecondary dark:text-dark-textSecondary font-sans">Generate, format, and download energy audit worksheets and occupancy statistics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Parameters Form Selection */}
        <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-6 rounded-premium shadow-premium relative">
          <div className="absolute top-[-50%] right-[-10%] w-[250px] h-[250px] bg-brand-primary/5 blur-[80px] pointer-events-none" />
          
          <h3 className="font-extrabold text-sm text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-4 border-b border-brand-border dark:border-dark-border pb-2.5 flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand-primary" />
            Config Parameters
          </h3>

          <form onSubmit={handleGenerateReport} className="space-y-4 text-xs font-semibold">
            {/* Category */}
            <div>
              <label className="block text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-2">Audit Category</label>
              <select 
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-premium-sm border border-brand-border dark:border-dark-border bg-brand-bg dark:bg-slate-900 focus:outline-none"
              >
                <option value="Energy">Electricity Consumption</option>
                <option value="Carbon">Carbon Footprint Analysis</option>
                <option value="Occupancy">Student Occupancy Variance</option>
              </select>
            </div>

            {/* Scope Type */}
            <div>
              <label className="block text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-2">Scope / Duration</label>
              <select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 rounded-premium-sm border border-brand-border dark:border-dark-border bg-brand-bg dark:bg-slate-900 focus:outline-none"
              >
                <option value="Daily">Daily Summary Log</option>
                <option value="Weekly">Weekly Variance Matrix</option>
                <option value="Monthly">Monthly Consolidated Audit</option>
              </select>
            </div>

            {/* Export Format */}
            <div>
              <label className="block text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-2">Export Format</label>
              <div className="grid grid-cols-3 gap-2">
                {['Excel', 'PDF', 'CSV'].map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => setExportFormat(format)}
                    className={`py-2 rounded-premium-sm border text-center transition-all duration-200 ${
                      exportFormat === format 
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-bold' 
                        : 'border-brand-border dark:border-dark-border text-brand-textSecondary hover:text-brand-primary bg-brand-bg dark:bg-slate-900'
                    }`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Hostel */}
            <div>
              <label className="block text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-2">Hostel Segment</label>
              <select 
                value={selectedHostel}
                onChange={(e) => setSelectedHostel(e.target.value)}
                className="w-full px-3 py-2 rounded-premium-sm border border-brand-border dark:border-dark-border bg-brand-bg dark:bg-slate-900 focus:outline-none"
              >
                <option value="1">Hostel A (Floor 1-3)</option>
                <option value="2">Hostel B (Floor 1-3)</option>
                <option value="3">Hostel C (Floor 1-3)</option>
                <option value="4">Hostel D (Floor 1-3)</option>
              </select>
            </div>

            {/* Generate Trigger */}
            <button 
              type="submit"
              disabled={generating}
              className="w-full py-2.5 mt-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-premium-sm shadow-premium flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {generating ? 'Exporting...' : 'Compile Export Worksheet'}
            </button>
          </form>

          {/* Loader Overlay */}
          {generating && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center rounded-premium z-10">
              <span className="w-8 h-8 rounded-full border-4 border-brand-primary border-t-transparent animate-spin mb-4" />
              <p className="text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary animate-pulse">{message}</p>
            </div>
          )}
        </div>

        {/* History Archive log */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-6 rounded-premium shadow-premium flex flex-col h-[400px]">
          <div>
            <h3 className="font-extrabold text-sm text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-1">Generated Files Archive</h3>
            <p className="text-[11px] text-brand-textSecondary mb-4">Click download to fetch spreadsheet or print-ready PDF files.</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center p-6 text-xs text-brand-textSecondary">Loading history...</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-sidebar dark:bg-slate-900 sticky top-0 font-bold text-brand-textSecondary text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">File Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Generated At</th>
                    <th className="p-3">Format</th>
                    <th className="p-3 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border dark:divide-dark-border">
                  {reports.map((rp) => (
                    <tr key={rp.id} className="hover:bg-brand-bg dark:hover:bg-slate-700/50 transition-colors">
                      <td className="p-3 font-bold text-brand-textPrimary dark:text-dark-textPrimary flex items-center gap-2">
                        <FileText className="w-4.5 h-4.5 text-brand-primary/70" />
                        {rp.name}
                      </td>
                      <td className="p-3 text-brand-textSecondary font-semibold capitalize">{rp.type}</td>
                      <td className="p-3 text-brand-textSecondary dark:text-dark-textSecondary font-semibold">
                        {new Date(rp.generated_at).toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3">{getFormatBadge(rp.file_path)}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            // Mock download trigger
                            alert(`Downloading file from: ${rp.file_path}`);
                          }}
                          className="p-1.5 rounded-lg border border-brand-border dark:border-dark-border text-brand-textSecondary hover:text-brand-primary dark:text-dark-textSecondary hover:bg-brand-veryLightBlue/50 transition-colors"
                          title="Save to local disk"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Reports;
