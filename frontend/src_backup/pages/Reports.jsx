import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  Download,
  CheckCircle,
  AlertCircle
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
      
      setSuccess(`${format.toUpperCase()} report downloaded successfully!`);
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
    <div className="mx-auto max-w-4xl space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Reports Panel</h2>
        <p className="text-sm text-slate-500 font-medium">Export campus attendance logs into formatted spreadsheet reports and PDF sheets</p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        
        {/* Filters Card */}
        <div className="glass-card p-6 bg-white md:col-span-2 space-y-5">
          <div className="border-b border-slate-50 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Export Scope Settings</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Define criteria for filtering records</p>
          </div>

          {/* Toggle Date Mode */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date Mode:</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setDateMode('single')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  dateMode === 'single'
                    ? 'bg-brand-50 text-brand-600 border border-brand-100'
                    : 'bg-slate-50 text-slate-500 border border-transparent hover:bg-slate-100'
                }`}
              >
                Single Day
              </button>
              <button
                onClick={() => setDateMode('range')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  dateMode === 'range'
                    ? 'bg-brand-50 text-brand-600 border border-brand-100'
                    : 'bg-slate-50 text-slate-500 border border-transparent hover:bg-slate-100'
                }`}
              >
                Date Period Range
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Dates Selection */}
            {dateMode === 'single' ? (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Select Date</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs font-bold text-slate-700 outline-none focus:border-brand-500 focus:bg-white transition-all"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-brand-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-brand-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            {/* Class filters */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <span>Branch</span>
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-brand-500 focus:bg-white transition-all"
                >
                  <option value="">All Branches</option>
                  {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Section</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-brand-500 focus:bg-white transition-all"
                >
                  <option value="">All Sections</option>
                  {sections.map(s => <option key={s} value={s}>Sec {s}</option>)}
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Download Actions Card */}
        <div className="glass-card p-6 bg-white flex flex-col justify-between space-y-6">
          <div className="border-b border-slate-50 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Available Exports</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Select your preferred format</p>
          </div>

          <div className="space-y-3.5">
            {/* Excel Button */}
            <button
              onClick={() => triggerDownload('excel')}
              disabled={downloading !== null}
              className="w-full rounded-xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100/70 p-4 transition-all duration-200 flex items-center gap-3.5 disabled:opacity-50 text-left active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/10">
                <FileSpreadsheet className="h-5.5 w-5.5" />
              </div>
              <div>
                <span className="block text-xs font-extrabold text-emerald-800">Microsoft Excel Sheet</span>
                <span className="block text-[10px] font-bold text-emerald-600/70 mt-0.5 uppercase tracking-wider flex items-center gap-1">
                  {downloading === 'excel' ? 'Processing...' : 'Download .xlsx'}
                  {downloading === 'excel' ? null : <Download className="h-3 w-3" />}
                </span>
              </div>
            </button>

            {/* PDF Button */}
            <button
              onClick={() => triggerDownload('pdf')}
              disabled={downloading !== null}
              className="w-full rounded-xl border border-rose-100 bg-rose-50 hover:bg-rose-100/70 p-4 transition-all duration-200 flex items-center gap-3.5 disabled:opacity-50 text-left active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/10">
                <FileText className="h-5.5 w-5.5" />
              </div>
              <div>
                <span className="block text-xs font-extrabold text-rose-800">Adobe PDF Document</span>
                <span className="block text-[10px] font-bold text-rose-600/70 mt-0.5 uppercase tracking-wider flex items-center gap-1">
                  {downloading === 'pdf' ? 'Processing...' : 'Download .pdf'}
                  {downloading === 'pdf' ? null : <Download className="h-3 w-3" />}
                </span>
              </div>
            </button>
          </div>

          <div className="text-[10px] font-semibold text-slate-400 text-center leading-relaxed">
            Exports contain individual entry timestamps, student roll details, and manual author signatures.
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;
