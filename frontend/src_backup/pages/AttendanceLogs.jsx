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
  FileText
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
                  markedBy: response.data.data.markedBy // Should populate later, let's keep details updated
                }
              : log
          )
        );
        // Refresh log list to ensure populated values (markedBy) are correct
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
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Attendance Sheet Explorer</h2>
          <p className="text-sm text-slate-500 font-medium">Verify daily registers, search logs, and override attendance states</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetFilters}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 transition-colors"
          >
            Reset Filters
          </button>
          <button
            onClick={fetchLogs}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600 active:scale-[0.98] transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Sheet</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Filters Form Panel */}
      <div className="glass-card p-5 bg-white space-y-4">
        
        {/* Toggle Date Mode */}
        <div className="flex items-center gap-4 border-b border-slate-50 pb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date Mode:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setDateMode('single')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                dateMode === 'single'
                  ? 'bg-brand-50 text-brand-600 border border-brand-100 shadow-sm'
                  : 'bg-slate-50 text-slate-500 border border-transparent hover:bg-slate-100'
              }`}
            >
              Single Date
            </button>
            <button
              onClick={() => setDateMode('range')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                dateMode === 'range'
                  ? 'bg-brand-50 text-brand-600 border border-brand-100 shadow-sm'
                  : 'bg-slate-50 text-slate-500 border border-transparent hover:bg-slate-100'
              }`}
            >
              Date Range
            </button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
          
          {/* Date Selector */}
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
            <div className="grid grid-cols-2 gap-2">
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

          {/* Roll Number Search */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span>Search Roll Number</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 21CS001"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs font-semibold text-slate-700 outline-none focus:border-brand-500 focus:bg-white transition-all uppercase"
            />
          </div>

          {/* Branch Filter */}
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
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Section Filter */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-brand-500 focus:bg-white transition-all"
              >
                <option value="">All</option>
                {sections.map((s) => <option key={s} value={s}>Sec {s}</option>)}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-xl bg-brand-500 hover:bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 active:scale-[0.98] transition-all"
            >
              Apply
            </button>
          </div>

        </form>
      </div>

      {/* Logs Table Sheet */}
      <div className="glass-card overflow-hidden bg-white">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent"></div>
            <span className="text-xs font-medium text-slate-400">Filtering registers...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center p-6">
            <FileText className="h-12 w-12 text-slate-300" />
            <span className="mt-3 text-sm font-bold text-slate-500">No attendance records found</span>
            <span className="text-xs text-slate-400 mt-1">
              No students matched the selected filters on this date.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Roll Number</th>
                  <th className="px-6 py-4">Class</th>
                  <th className="px-6 py-4">Register Date</th>
                  <th className="px-6 py-4">Marked Time</th>
                  <th className="px-6 py-4">Status</th>
                  {isFaculty && <th className="px-6 py-4 text-center">Override</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {logs.map((log) => {
                  const isPresent = log.status === 'Present';
                  const isCurrentlyUpdating = updatingId === log._id;
                  
                  return (
                    <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {log.student?.name || 'Unknown Student'}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-500">
                        {log.student?.rollNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-600">
                          {log.student?.branch || 'N/A'}
                        </span>
                        <span className="text-slate-400 mx-1.5">-</span>
                        <span className="text-slate-500">Sec {log.student?.section || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">
                        {log.date}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                        <span className="block text-[9px] text-slate-400 italic">
                          By: {log.markedBy?.name ? `${log.markedBy.name} (${log.markedBy.role})` : 'AI Scanner'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isPresent ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Present</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
                            <XCircle className="h-3.5 w-3.5" />
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
                            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50 active:scale-[0.97] ${
                              isPresent
                                ? 'border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100'
                                : 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                            title={isPresent ? 'Mark Absent' : 'Mark Present'}
                          >
                            {isCurrentlyUpdating ? (
                              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                            ) : isPresent ? (
                              <UserX className="h-3.5 w-3.5" />
                            ) : (
                              <UserCheck className="h-3.5 w-3.5" />
                            )}
                            <span>{isPresent ? 'Mark Absent' : 'Mark Present'}</span>
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
