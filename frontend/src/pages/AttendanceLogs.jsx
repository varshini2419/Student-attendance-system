import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Calendar,
  RefreshCw,
  UserCheck,
  UserX,
  FileText,
  Activity,
  CalendarDays
} from 'lucide-react';
import API from '../utils/api';

const AttendanceLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters State
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [section, setSection] = useState('');
  const [dateMode, setDateMode] = useState('single'); // 'single' | 'range'

  // Edit State
  const [updatingId, setUpdatingId] = useState(null);

  const { isFaculty } = useAuth();

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (dateMode === 'single' && date) {
        params.date = date;
      } else if (dateMode === 'range' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      if (rollNumber) params.rollNumber = rollNumber;
      if (branch) params.branch = branch;
      if (section) params.section = section;

      const response = await API.get('/attendance/logs', { params });
      if (response.data.success) {
        setLogs(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Could not retrieve attendance logs. Verify that the backend is active.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set default filter to today on initial load
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  }, []);

  useEffect(() => {
    if (date || (startDate && endDate)) {
      fetchLogs();
    }
  }, [date, startDate, endDate, branch, section]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const toggleStatus = async (logId, currentStatus, studentId, logDate) => {
    setUpdatingId(logId);
    const newStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    try {
      const response = await API.post('/attendance/manual', {
        studentId,
        date: logDate,
        status: newStatus
      });

      if (response.data.success) {
        // Refresh logs list locally to avoid full re-render flickering
        setLogs((prev) =>
          prev.map((log) =>
            log._id === logId
              ? {
                  ...log,
                  status: newStatus,
                  timestamp: new Date().toISOString(),
                  markedBy: response.data.data.markedBy
                }
              : log
          )
        );
        fetchLogs();
      }
    } catch (err) {
      console.error('Manual override error:', err);
      alert('Failed to update attendance status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const resetFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setStartDate('');
    setEndDate('');
    setRollNumber('');
    setBranch('');
    setSection('');
    setDateMode('single');
  };

  const branches = ['CSE', 'ECE', 'EEE', 'IT', 'MECH', 'CIVIL'];
  const sections = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-indigo-50 p-1.5 text-indigo-600">
              <CalendarDays className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">History</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">Attendance Logs</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">View daily registers, search records, and manage attendance states</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetFilters}
            className="flex h-11 items-center justify-center rounded-xl bg-white border border-slate-200 px-5 text-sm font-bold text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm active:scale-95"
          >
            Reset Filters
          </button>
          <button
            onClick={fetchLogs}
            className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <RefreshCw className="h-4.5 w-4.5 group-hover:rotate-180 transition-transform duration-500" />
            <span>Sync Data</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm shadow-rose-100/50">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </div>
      )}

      {/* Filters Form Panel */}
      <div className="glass-card p-6 bg-white space-y-5">
        
        {/* Toggle Date Mode */}
        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-slate-300" /> Date Filter Mode:
          </span>
          <div className="flex gap-2 bg-slate-50/50 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setDateMode('single')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                dateMode === 'single'
                  ? 'bg-white text-brand-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Specific Date
            </button>
            <button
              onClick={() => setDateMode('range')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                dateMode === 'range'
                  ? 'bg-white text-brand-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Custom Range
            </button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 items-end">
          
          {/* Date Selector */}
          {dateMode === 'single' ? (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                Target Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Roll Number Search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              Roll Number
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. 21CS001"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all uppercase shadow-sm"
              />
            </div>
          </div>

          {/* Branch Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              Department
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm cursor-pointer"
            >
              <option value="">All Branches</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Section Filter */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Class Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm cursor-pointer"
              >
                <option value="">All</option>
                {sections.map((s) => <option key={s} value={s}>Sec {s}</option>)}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-sm font-bold text-white shadow-md active:scale-95 transition-all"
            >
              Apply
            </button>
          </div>

        </form>
      </div>

      {/* Logs Table Sheet */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex h-80 flex-col items-center justify-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            <span className="text-sm font-bold text-slate-400">Processing attendance logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-80 flex-col items-center justify-center text-center p-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 border-2 border-dashed border-slate-200 mb-4">
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
            <span className="text-base font-extrabold text-slate-600">No records found</span>
            <span className="text-sm font-medium text-slate-400 mt-1">
              There are no attendance logs matching your current filters.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4 font-bold">Student Identity</th>
                  <th className="px-6 py-4 font-bold">Roll No.</th>
                  <th className="px-6 py-4 font-bold">Academic Group</th>
                  <th className="px-6 py-4 font-bold">Date & Time</th>
                  <th className="px-6 py-4 font-bold">Current Status</th>
                  {isFaculty && <th className="px-6 py-4 text-center font-bold">Override</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm bg-white">
                {logs.map((log) => {
                  const isPresent = log.status === 'Present';
                  const isCurrentlyUpdating = updatingId === log._id;
                  
                  return (
                    <tr key={log._id} className="hover:bg-brand-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 font-bold text-xs shadow-inner">
                            {log.student?.name ? log.student.name[0] : '?'}
                          </div>
                          <span className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                            {log.student?.name || 'Unknown Student'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-mono font-bold text-slate-600">
                          {log.student?.rollNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{log.student?.branch || 'N/A'}</span>
                          <span className="text-[11px] font-semibold text-slate-400">Section {log.student?.section || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{log.date}</span>
                          <span className="text-xs font-medium text-slate-500">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                            By: {log.markedBy?.name ? `${log.markedBy.name}` : 'AI Sensor'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isPresent ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            <span>Present</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700 shadow-sm">
                            <span className="flex h-2 w-2 rounded-full bg-rose-500"></span>
                            <span>Absent</span>
                          </div>
                        )}
                      </td>
                      {isFaculty && (
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() =>
                              toggleStatus(log._id, log.status, log.student._id, log.date)
                            }
                            disabled={isCurrentlyUpdating}
                            className={`inline-flex w-32 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm ${
                              isPresent
                                ? 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-300'
                                : 'border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300'
                            }`}
                            title={isPresent ? 'Mark Absent manually' : 'Mark Present manually'}
                          >
                            {isCurrentlyUpdating ? (
                              <>
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                <span>Processing...</span>
                              </>
                            ) : isPresent ? (
                              <>
                                <UserX className="h-4 w-4" />
                                <span>Mark Absent</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4" />
                                <span>Mark Present</span>
                              </>
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceLogs;
