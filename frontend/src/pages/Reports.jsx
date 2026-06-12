import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  Download,
  CheckCircle,
  AlertCircle,
  DownloadCloud
} from 'lucide-react';
import API from '../utils/api';

const Reports = () => {
  const [dateMode, setDateMode] = useState('single'); // 'single' | 'range'
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [branch, setBranch] = useState('');
  const [section, setSection] = useState('');

  // UI state
  const [downloading, setDownloading] = useState(null); // null | 'excel' | 'pdf'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  }, []);

  const triggerDownload = async (format) => {
    setDownloading(format);
    setError('');
    setSuccess('');

    // Prepare parameters
    const params = {};
    if (dateMode === 'single') {
      if (!date) {
        setError('Please select a date first.');
        setDownloading(null);
        return;
      }
      params.date = date;
    } else {
      if (!startDate || !endDate) {
        setError('Please select start and end dates.');
        setDownloading(null);
        return;
      }
      params.startDate = startDate;
      params.endDate = endDate;
    }

    if (branch) params.branch = branch;
    if (section) params.section = section;

    try {
      console.log(`Downloading authenticated ${format} report...`);
      const response = await API.get(`/reports/${format}`, {
        params,
        responseType: 'blob' // Critical to handle raw binary file streams
      });

      // Create local object URL for the downloaded blob
      const blob = new Blob([response.data], {
        type: format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      });
      
      const fileUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = fileUrl;
      
      // Filename formatting
      const dateString = dateMode === 'single' ? date : `${startDate}_to_${endDate}`;
      const branchString = branch ? `_${branch}` : '';
      const sectionString = section ? `_Sec${section}` : '';
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      
      downloadLink.setAttribute(
        'download',
        `Attendance_Report_${dateString}${branchString}${sectionString}.${extension}`
      );
      
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Cleanup
      downloadLink.parentNode.removeChild(downloadLink);
      window.URL.revokeObjectURL(fileUrl);
      
      setSuccess(`${format.toUpperCase()} report generated and downloaded!`);
    } catch (err) {
      console.error('Report download error:', err);
      setError(`Failed to generate the ${format.toUpperCase()} report. Ensure the server has records for selected filters.`);
    } finally {
      setDownloading(null);
    }
  };

  const branches = ['CSE', 'ECE', 'EEE', 'IT', 'MECH', 'CIVIL'];
  const sections = ['A', 'B', 'C', 'D'];

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-in-up">
      
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
              <DownloadCloud className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Exports</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">Data Reports</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Extract AI attendance records into spreadsheets and documents</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm shadow-rose-100/50 text-sm font-semibold text-rose-700">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm shadow-emerald-100/50 text-sm font-semibold text-emerald-700">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Filters Card */}
        <div className="glass-card p-8 bg-white lg:col-span-2 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900">Export Scope Settings</h3>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Define criteria for filtering records</p>
          </div>

          {/* Toggle Date Mode */}
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-300" /> Export Period:
            </span>
            <div className="flex gap-2 bg-slate-50/50 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setDateMode('single')}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                  dateMode === 'single'
                    ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Specific Day
              </button>
              <button
                onClick={() => setDateMode('range')}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                  dateMode === 'range'
                    ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Date Range
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Dates Selection */}
            {dateMode === 'single' ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Class filters */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  Department
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm cursor-pointer"
                >
                  <option value="">All</option>
                  {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Section</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm cursor-pointer"
                >
                  <option value="">All</option>
                  {sections.map(s => <option key={s} value={s}>Sec {s}</option>)}
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Download Actions Card */}
        <div className="glass-card p-8 bg-white flex flex-col justify-between space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900">Available Formats</h3>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Select your export format</p>
          </div>

          <div className="space-y-4">
            {/* Excel Button */}
            <button
              onClick={() => triggerDownload('excel')}
              disabled={downloading !== null}
              className="w-full rounded-2xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100/70 p-5 transition-all duration-200 flex items-center gap-4 disabled:opacity-50 text-left active:scale-95 group"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-sm font-extrabold text-emerald-900">Microsoft Excel</span>
                <span className="block text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                  {downloading === 'excel' ? 'Processing...' : 'Download .xlsx'}
                  {downloading === 'excel' ? null : <Download className="h-3 w-3" />}
                </span>
              </div>
            </button>

            {/* PDF Button */}
            <button
              onClick={() => triggerDownload('pdf')}
              disabled={downloading !== null}
              className="w-full rounded-2xl border border-rose-100 bg-rose-50 hover:bg-rose-100/70 p-5 transition-all duration-200 flex items-center gap-4 disabled:opacity-50 text-left active:scale-95 group"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/20 group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-sm font-extrabold text-rose-900">Adobe PDF</span>
                <span className="block text-[10px] font-bold text-rose-600 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                  {downloading === 'pdf' ? 'Processing...' : 'Download .pdf'}
                  {downloading === 'pdf' ? null : <Download className="h-3 w-3" />}
                </span>
              </div>
            </button>
          </div>

          <div className="text-[10px] font-bold text-slate-400 text-center leading-relaxed uppercase tracking-wider px-2">
            Exports contain individual timestamps, identity details, and manual overrides.
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;
