import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  Square, 
  Users, 
  Activity, 
  ExternalLink,
  Filter,
  ArrowUpDown,
  AlertCircle,
  RefreshCw,
  X,
  History,
  Hash,
  ArrowDownAZ,
  ArrowRight,
  LogIn,
  LogOut,
  RotateCcw
} from 'lucide-react';
import API from '../utils/api';

// Material Design 2 Time Picker Dialog (with Blue Theme, Zero Lag, Matching Image 1)
const CustomClockPicker = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState('hour'); // 'hour' | 'minute'

  const dialRef = useRef(null);
  const isDraggingRef = useRef(false);
  const pickerModeRef = useRef(pickerMode);

  // Parse existing "HH:mm" into 12-hour values or defaults
  const parsed = useMemo(() => {
    if (!value) {
      return { hour: 7, minute: '00', period: 'AM', isSet: false };
    }
    const [hStr, mStr] = value.split(':');
    const hNum = parseInt(hStr, 10);
    const mNum = parseInt(mStr, 10);
    if (isNaN(hNum) || isNaN(mNum)) {
      return { hour: 7, minute: '00', period: 'AM', isSet: false };
    }
    const period = hNum >= 12 ? 'PM' : 'AM';
    let hour12 = hNum % 12;
    if (hour12 === 0) hour12 = 12;
    const minuteFormatted = String(mNum).padStart(2, '0');
    return { hour: hour12, minute: minuteFormatted, period, isSet: true };
  }, [value]);

  const [selectedHour, setSelectedHour] = useState(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(parsed.period);

  useEffect(() => {
    setSelectedHour(parsed.hour);
    setSelectedMinute(parsed.minute);
    setSelectedPeriod(parsed.period);
  }, [parsed]);

  useEffect(() => {
    pickerModeRef.current = pickerMode;
  }, [pickerMode]);

  const handleOpen = () => {
    setSelectedHour(parsed.hour);
    setSelectedMinute(parsed.minute);
    setSelectedPeriod(parsed.period);
    setPickerMode('hour');
    setIsOpen(true);
  };

  const applyTime = (h, m, p) => {
    let hour24 = h;
    if (p === 'PM' && h !== 12) hour24 += 12;
    if (p === 'AM' && h === 12) hour24 = 0;
    const time24Str = `${String(hour24).padStart(2, '0')}:${m}`;
    onChange(time24Str);
    setIsOpen(false);
  };

  const handleApply = () => {
    applyTime(selectedHour, selectedMinute, selectedPeriod);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleClear = (e) => {
    if (e) e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const formattedDisplayText = parsed.isSet
    ? `${String(parsed.hour).padStart(2, '0')}:${parsed.minute} ${parsed.period}`
    : label;

  // Geometry: Dial diameter = 256px, Center = (128, 128), Radius = 96px
  const CENTER = 128;
  const CLOCK_RADIUS = 96;

  const hoursList = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // Calculate time from pointer coordinates
  const updateTimeFromPointer = (clientX, clientY, mode) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angleDeg < 0) angleDeg += 360;

    if (mode === 'hour') {
      let h = Math.round(angleDeg / 30);
      if (h === 0) h = 12;
      setSelectedHour(h);
    } else {
      let m = Math.round(angleDeg / 6);
      if (m === 60) m = 0;
      setSelectedMinute(String(m).padStart(2, '0'));
    }
  };

  // Start dragging or click
  const handleDialStart = (e) => {
    isDraggingRef.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    updateTimeFromPointer(clientX, clientY, pickerModeRef.current);
  };

  // Global window listeners for drag movement and release
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerMove = (e) => {
      if (!isDraggingRef.current) return;
      if (e.cancelable && e.type === 'touchmove') {
        e.preventDefault();
      }
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      updateTimeFromPointer(clientX, clientY, pickerModeRef.current);
    };

    const handlePointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      // If releasing after dragging/clicking an hour, automatically advance to minute mode
      if (pickerModeRef.current === 'hour') {
        setPickerMode('minute');
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isOpen]);

  // Selected angle and hand coordinates
  const currentAngleDeg = pickerMode === 'hour'
    ? (selectedHour % 12) * 30 - 90
    : (parseInt(selectedMinute, 10) || 0) * 6 - 90;

  const handRad = (currentAngleDeg * Math.PI) / 180;
  const handX = CENTER + CLOCK_RADIUS * Math.cos(handRad);
  const handY = CENTER + CLOCK_RADIUS * Math.sin(handRad);

  return (
    <div className="relative inline-block">
      {/* Trigger Button: Displays clean "Start Time" or "End Time" when empty, NO "--:-- --" */}
      <button
        type="button"
        onClick={handleOpen}
        className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer select-none active:scale-95 ${
          parsed.isSet
            ? 'bg-blue-50 text-blue-700 border-2 border-brand-500 shadow-sm ring-2 ring-brand-500/20'
            : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
        }`}
        title={`Click clock to select ${label}`}
      >
        <Clock className={`h-3.5 w-3.5 flex-shrink-0 ${parsed.isSet ? 'text-brand-600' : 'text-slate-400'}`} />
        <span className={parsed.isSet ? 'font-mono font-extrabold text-blue-900' : 'font-semibold text-slate-600'}>
          {formattedDisplayText}
        </span>
        {parsed.isSet && (
          <span
            onClick={handleClear}
            className="ml-1 p-0.5 rounded-full hover:bg-blue-200/60 text-blue-600 hover:text-rose-600 transition-colors cursor-pointer"
            title={`Clear ${label}`}
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {/* Material Design 2 Time Picker Modal (Matching Image 1 in Blue) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-16 sm:pt-20 bg-black/40 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div 
            className="w-[320px] bg-white rounded-3xl shadow-2xl p-6 text-slate-900 select-none animate-fade-in my-auto sm:my-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: SELECT TIME */}
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-5">
              Select time
            </div>

            {/* Time Display Header (Hours : Minutes + AM/PM) */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {/* Hour Box */}
              <button
                type="button"
                onClick={() => setPickerMode('hour')}
                className={`w-[92px] h-[76px] rounded-xl flex items-center justify-center text-5xl font-medium tracking-tight cursor-pointer transition-colors ${
                  pickerMode === 'hour'
                    ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-600/40'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                {String(selectedHour).padStart(2, '0')}
              </button>

              {/* Separator Colon */}
              <span className="text-4xl font-bold text-slate-800 select-none pb-1">:</span>

              {/* Minute Box */}
              <button
                type="button"
                onClick={() => setPickerMode('minute')}
                className={`w-[92px] h-[76px] rounded-xl flex items-center justify-center text-5xl font-medium tracking-tight cursor-pointer transition-colors ${
                  pickerMode === 'minute'
                    ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-600/40'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                {selectedMinute}
              </button>

              {/* Stacked AM / PM Segmented Control */}
              <div className="w-[50px] h-[76px] border border-slate-300 rounded-xl flex flex-col overflow-hidden ml-1">
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('AM')}
                  className={`flex-1 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer border-b border-slate-300 ${
                    selectedPeriod === 'AM'
                      ? 'bg-blue-100/80 text-blue-700 font-extrabold'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('PM')}
                  className={`flex-1 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${
                    selectedPeriod === 'PM'
                      ? 'bg-blue-100/80 text-blue-700 font-extrabold'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Circular Clock Dial */}
            <div 
              ref={dialRef}
              onMouseDown={handleDialStart}
              onTouchStart={handleDialStart}
              className="relative w-[256px] h-[256px] mx-auto rounded-full bg-[#eceff1] select-none cursor-pointer flex items-center justify-center touch-none"
            >
              {/* SVG Hand & Center Pin */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {/* Hand Line */}
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={handX}
                  y2={handY}
                  stroke="#2563eb"
                  strokeWidth="2"
                />
                {/* Pointer Tip Disc */}
                <circle
                  cx={handX}
                  cy={handY}
                  r="18"
                  fill="#2563eb"
                />
                {/* Center Pin */}
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r="3.5"
                  fill="#2563eb"
                />
                {/* Small inner dot if minute is not on 5-min intervals */}
                {pickerMode === 'minute' && (parseInt(selectedMinute, 10) % 5 !== 0) && (
                  <circle
                    cx={handX}
                    cy={handY}
                    r="3"
                    fill="#ffffff"
                  />
                )}
              </svg>

              {/* Clock Numbers Rendered around the Circle */}
              {pickerMode === 'hour' ? (
                hoursList.map(h => {
                  const deg = (h % 12) * 30 - 90;
                  const rad = (deg * Math.PI) / 180;
                  const x = CENTER + CLOCK_RADIUS * Math.cos(rad);
                  const y = CENTER + CLOCK_RADIUS * Math.sin(rad);
                  const isSelected = selectedHour === h;

                  return (
                    <div
                      key={h}
                      style={{
                        position: 'absolute',
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold select-none pointer-events-none z-20 ${
                        isSelected 
                          ? 'text-white font-bold' 
                          : 'text-slate-800'
                      }`}
                    >
                      {h}
                    </div>
                  );
                })
              ) : (
                minutesList.map(m => {
                  const deg = m * 6 - 90;
                  const rad = (deg * Math.PI) / 180;
                  const x = CENTER + CLOCK_RADIUS * Math.cos(rad);
                  const y = CENTER + CLOCK_RADIUS * Math.sin(rad);
                  const isSelected = parseInt(selectedMinute, 10) === m;

                  return (
                    <div
                      key={m}
                      style={{
                        position: 'absolute',
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold select-none pointer-events-none z-20 ${
                        isSelected 
                          ? 'text-white font-bold' 
                          : 'text-slate-800'
                      }`}
                    >
                      {String(m).padStart(2, '0')}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions: CANCEL and OK (Material 2 style) */}
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LiveMonitoring = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [liveData, setLiveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Offline & Network resilience
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [networkNotice, setNetworkNotice] = useState(null);

  // Time range filter state (Start Time and End Time)
  const [startTime, setStartTime] = useState(''); // e.g. "09:00"
  const [endTime, setEndTime] = useState(''); // e.g. "12:00"
  const [sortBy, setSortBy] = useState('NORMAL'); // 'NORMAL', 'LOGIN', 'LOGOUT', 'ROLL_ASC', 'NAME_ASC'

  // Toggle helpers for Login and Logout buttons
  const handleToggleLoginSort = () => {
    setSortBy(prev => prev === 'LOGIN' ? 'NORMAL' : 'LOGIN');
  };

  const handleToggleLogoutSort = () => {
    setSortBy(prev => prev === 'LOGOUT' ? 'NORMAL' : 'LOGOUT');
  };

  // Fetch all sessions on mount
  useEffect(() => {
    fetchSessions();

    const handleOnline = () => {
      setIsOffline(false);
      setNetworkNotice('Connection restored! Syncing live activity...');
      setTimeout(() => setNetworkNotice(null), 4000);
      if (selectedSession) fetchLiveTracking(selectedSession._id);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setNetworkNotice('Network connection issue. Displaying preserved activity data.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch tracking whenever selectedSession changes or on active poll
  useEffect(() => {
    if (!selectedSession) return;
    
    // Load local cache first as offline fallback
    try {
      const cached = localStorage.getItem(`cached_live_${selectedSession._id}`);
      if (cached) {
        setLiveData(JSON.parse(cached));
      }
    } catch (e) {
      console.warn('LocalStorage read error:', e);
    }

    fetchLiveTracking(selectedSession._id);

    // If session is active and not offline, poll every 3 seconds for real-time live data
    let pollInterval = null;
    if (selectedSession.status === 'active' && !isOffline) {
      pollInterval = setInterval(() => {
        fetchLiveTracking(selectedSession._id, true);
      }, 3000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [selectedSession, isOffline]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await API.get('/attendance/sessions');
      if (res.data.success && Array.isArray(res.data.data)) {
        const allSessions = res.data.data;
        setSessions(allSessions);

        // Auto-select session:
        // Priority 1: An active session
        // Priority 2: Currently selected session if still in list
        // Priority 3: The most recent session (sessions[0])
        setSelectedSession(prev => {
          if (prev && allSessions.some(s => s._id === prev._id)) {
            const updated = allSessions.find(s => s._id === prev._id);
            return updated || prev;
          }
          const live = allSessions.find(s => s.status === 'active');
          if (live) return live;
          return allSessions[0] || null;
        });
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveTracking = async (sessionId, isBackground = false) => {
    if (!sessionId) return;
    try {
      if (!isBackground) setIsRefreshing(true);
      const res = await API.get(`/attendance/session/${sessionId}/live`);
      if (res.data.success && Array.isArray(res.data.data)) {
        setLiveData(res.data.data);
        try {
          localStorage.setItem(`cached_live_${sessionId}`, JSON.stringify(res.data.data));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to fetch live tracking:', err);
      if (err.message && (err.message.includes('Network') || !navigator.onLine)) {
        setIsOffline(true);
      }
    } finally {
      if (!isBackground) setIsRefreshing(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (mins) => {
    if (mins === undefined || mins === null) return '';
    const num = typeof mins === 'string' ? parseFloat(mins) : Number(mins);
    if (isNaN(num)) return '';
    const rounded = Math.round(num);
    if (rounded <= 0) return '< 1 min';
    return `${rounded} min`;
  };

  const getMinutesFromMidnight = (dateInput) => {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    return d.getHours() * 60 + d.getMinutes();
  };

  const parseTimeStringToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  // Filter only PRESENT attendees (students who actually attended/logged in, strictly ignoring absent records)
  const presentAttendees = useMemo(() => {
    return liveData.filter(record => {
      if (!record || !record.student) return false;
      if (record.status === 'Absent') return false;
      const hasLogin = !!record.lastLoginTime;
      const hasValidCycles = Array.isArray(record.cycles) && record.cycles.some(c => c.loginTime && c.status !== 'Absent');
      return hasLogin || hasValidCycles;
    });
  }, [liveData]);

  // Filter and sort attended students by Start Time and End Time
  const filteredAndSortedData = useMemo(() => {
    let result = [...presentAttendees];

    const fromMin = parseTimeStringToMinutes(startTime);
    const toMin = parseTimeStringToMinutes(endTime);

    if (fromMin !== null || toMin !== null) {
      result = result.filter(record => {
        // Collect all relevant timestamps for this student
        const timestamps = [];
        if (record.lastLoginTime) timestamps.push(record.lastLoginTime);
        if (Array.isArray(record.cycles)) {
          record.cycles.forEach(c => {
            if (c.loginTime && c.status !== 'Absent') timestamps.push(c.loginTime);
          });
        }

        if (timestamps.length === 0) return false;

        // Check if ANY attendance event occurred in the target window
        return timestamps.some(t => {
          const m = getMinutesFromMidnight(t);
          if (m === null) return false;
          if (fromMin !== null && m < fromMin) return false;
          if (toMin !== null && m > toMin) return false;
          return true;
        });
      });
    }

    // Helper to get latest login timestamp
    const getLatestLoginTimestamp = (record) => {
      if (record.lastLoginTime) return new Date(record.lastLoginTime).getTime();
      if (Array.isArray(record.cycles) && record.cycles.length > 0) {
        const logins = record.cycles.map(c => (c.loginTime && c.status !== 'Absent') ? new Date(c.loginTime).getTime() : 0);
        return Math.max(...logins);
      }
      return 0;
    };

    // Helper to get latest logout timestamp
    const getLatestLogoutTimestamp = (record) => {
      if (Array.isArray(record.cycles)) {
        const logouts = record.cycles
          .filter(c => c.logoutTime && c.status !== 'Absent')
          .map(c => new Date(c.logoutTime).getTime())
          .filter(t => !isNaN(t) && t > 0);
        if (logouts.length > 0) return Math.max(...logouts);
      }
      return 0;
    };

    // Sort results based on selected mode
    result.sort((a, b) => {
      if (sortBy === 'LOGIN') {
        const timeA = getLatestLoginTimestamp(a);
        const timeB = getLatestLoginTimestamp(b);
        return timeB - timeA; // Latest login first
      }
      if (sortBy === 'LOGOUT') {
        const timeA = getLatestLogoutTimestamp(a);
        const timeB = getLatestLogoutTimestamp(b);
        if (timeA > 0 && timeB > 0) {
          return timeB - timeA; // Latest logout first
        }
        if (timeA > 0 && timeB === 0) return -1; // A has logout, B does not -> A first
        if (timeB > 0 && timeA === 0) return 1;  // B has logout, A does not -> B first
        return 0;
      }
      if (sortBy === 'ROLL_ASC') {
        return (a.student?.rollNumber || '').localeCompare(b.student?.rollNumber || '', undefined, { numeric: true });
      }
      if (sortBy === 'NAME_ASC') {
        return (a.student?.name || '').localeCompare(b.student?.name || '');
      }
      // NORMAL mode (default session order - most recent activity first)
      return new Date(b.lastLoginTime || 0) - new Date(a.lastLoginTime || 0);
    });

    return result;
  }, [presentAttendees, startTime, endTime, sortBy]);

  const clearTimeFilter = () => {
    setStartTime('');
    setEndTime('');
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-amber-900">Network Issue Detected</h4>
              <p className="text-xs text-amber-700">Displaying saved session attendance data. Live synchronization will resume automatically when internet is restored.</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-200 text-amber-800 px-3 py-1 rounded-full uppercase tracking-wider">OFFLINE</span>
        </div>
      )}

      {networkNotice && !isOffline && (
        <div className="bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-900 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span className="font-bold text-sm text-emerald-800">{networkNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">Live Monitoring</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Monitor active attendance sessions and student timelines in real-time.</p>
        </div>
        {selectedSession && (
          <button
            onClick={() => fetchLiveTracking(selectedSession._id)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-brand-600' : 'text-slate-400'}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Live'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sessions List Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-500" />
              All Sessions
            </h3>
            {loading ? (
              <div className="animate-pulse flex flex-col gap-3">
                <div className="h-16 bg-slate-100 rounded-xl"></div>
                <div className="h-16 bg-slate-100 rounded-xl"></div>
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No sessions found.</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                {sessions.map(s => (
                  <button
                    key={s._id}
                    onClick={() => setSelectedSession(s)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedSession?._id === s._id 
                        ? 'border-brand-500 bg-brand-50 shadow-sm' 
                        : 'border-slate-200 hover:border-brand-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm text-slate-900 truncate pr-2">{s.sessionName}</span>
                      {s.status === 'active' ? (
                        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse mt-1 flex-shrink-0" title="Active Live Session"></span>
                      ) : (
                        <span className="flex h-2 w-2 rounded-full bg-slate-300 mt-1 flex-shrink-0" title="Completed"></span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate font-mono">{s.sessionId}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Timeline & Sorter Column */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
            {!selectedSession ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 mt-20">
                <ExternalLink className="h-12 w-12 text-slate-200" />
                <p className="font-medium">Select a session to view live activity.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Session Title Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">{selectedSession.sessionName}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedSession.sessionId}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      selectedSession.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-700 animate-pulse' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedSession.status === 'active' ? '● LIVE ACTIVE' : 'FINALIZED'}
                    </div>
                  </div>
                </div>

                {/* Sorter & Time Range Filter Bar - Single Straight Line */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs">
                  <div className="flex flex-row items-center justify-between gap-3 w-full overflow-x-auto pb-1 sm:pb-0">
                    
                    {/* Left: Start Time and End Time in a single straight line */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <CustomClockPicker
                        label="Start Time"
                        value={startTime}
                        onChange={setStartTime}
                      />

                      <span className="text-slate-400 font-bold text-xs select-none">to</span>

                      <CustomClockPicker
                        label="End Time"
                        value={endTime}
                        onChange={setEndTime}
                      />

                      {(startTime || endTime) && (
                        <button
                          type="button"
                          onClick={clearTimeFilter}
                          className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-all cursor-pointer active:scale-95 flex-shrink-0"
                          title="Reset time filter"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Reset</span>
                        </button>
                      )}
                    </div>

                    {/* Right: Login and Logout toggle buttons in that same straight line */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Login Toggle Button */}
                      <button
                        type="button"
                        onClick={handleToggleLoginSort}
                        className={`group flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 select-none ${
                          sortBy === 'LOGIN'
                            ? 'bg-emerald-600 text-white border border-emerald-600 shadow-md shadow-emerald-600/20 ring-2 ring-emerald-500/30'
                            : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300'
                        }`}
                        title={sortBy === 'LOGIN' ? 'Currently sorted by Login. Click to reset to normal.' : 'Click to sort attendees by Login time.'}
                      >
                        <div className={`p-1 rounded-lg transition-colors ${
                          sortBy === 'LOGIN' ? 'bg-emerald-500 text-white' : 'bg-emerald-100/80 text-emerald-700'
                        }`}>
                          <LogIn className="h-3.5 w-3.5" />
                        </div>
                        <span>Login</span>
                        {sortBy === 'LOGIN' && (
                          <span className="flex h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                        )}
                      </button>

                      {/* Logout Toggle Button - Styled RED */}
                      <button
                        type="button"
                        onClick={handleToggleLogoutSort}
                        className={`group flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 select-none ${
                          sortBy === 'LOGOUT'
                            ? 'bg-rose-600 text-white border border-rose-600 shadow-md shadow-rose-600/20 ring-2 ring-rose-500/30'
                            : 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300'
                        }`}
                        title={sortBy === 'LOGOUT' ? 'Currently sorted by Logout. Click to reset to normal.' : 'Click to sort attendees by Logout time.'}
                      >
                        <div className={`p-1 rounded-lg transition-colors ${
                          sortBy === 'LOGOUT' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-600'
                        }`}>
                          <LogOut className="h-3.5 w-3.5" />
                        </div>
                        <span>Logout</span>
                        {sortBy === 'LOGOUT' && (
                          <span className="flex h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Attendee Counts & Active Sorting/Filter Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 mt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="font-semibold text-slate-600">
                        Showing <strong className="text-slate-900 font-extrabold">{filteredAndSortedData.length}</strong> of{' '}
                        <strong className="text-slate-900 font-extrabold">{presentAttendees.length}</strong> present attendee{presentAttendees.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Active Sorting Status Badge */}
                      {sortBy === 'LOGIN' && (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-lg text-[11px] border border-emerald-200/70 shadow-xs animate-fade-in">
                          <LogIn className="h-3 w-3 text-emerald-600" />
                          <span>Sorted by: Login Time</span>
                        </span>
                      )}
                      {sortBy === 'LOGOUT' && (
                        <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 font-extrabold px-2.5 py-0.5 rounded-lg text-[11px] border border-rose-200/70 shadow-xs animate-fade-in">
                          <LogOut className="h-3 w-3 text-rose-600" />
                          <span>Sorted by: Logout Time</span>
                        </span>
                      )}

                      {/* Active Time Window Status Badge */}
                      {(startTime || endTime) && (
                        <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 font-extrabold px-2.5 py-0.5 rounded-lg text-[11px] border border-brand-200/60 shadow-xs">
                          <Clock className="h-3 w-3 text-brand-600" />
                          <span>Window: {startTime || 'Start'} → {endTime || 'End'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Students Activity Cards */}
                <div className="space-y-4">
                  {filteredAndSortedData.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                      <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-600">
                        {presentAttendees.length === 0 ? 'No students have attended this session yet.' : 'No students attended within the selected timeframe.'}
                      </p>
                      {(startTime || endTime) && (
                        <button
                          onClick={clearTimeFilter}
                          className="mt-3 px-4 py-2 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-all cursor-pointer"
                        >
                          Reset Time Filter
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredAndSortedData.map(record => {
                      const isActiveSession = selectedSession.status === 'active';
                      return (
                        <div key={record.student._id} className="bg-slate-50 rounded-2xl border border-slate-200 p-4 transition-all hover:border-slate-300 shadow-sm">
                          <div className="flex items-center justify-between mb-4 border-b border-slate-200/60 pb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                                {record.student.name ? record.student.name[0] : 'S'}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{record.student.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs font-extrabold text-brand-600 font-mono">
                                    {record.student.rollNumber || record.student._id}
                                  </span>
                                  {record.student.branch && (
                                    <span className="text-[11px] font-semibold text-slate-400">
                                      • {record.student.branch} {record.student.section ? `Sec ${record.student.section}` : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current State</div>
                              {record.currentState === 'IN' ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                  IN
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-200 px-2.5 py-1 rounded-lg">
                                  <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                                  OUT
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Attendance Login / Logout Timeline */}
                          <div className="space-y-2">
                            {(record.cycles || []).map((c, i) => (
                              <div key={i} className="flex flex-col sm:flex-row gap-2 sm:gap-6 bg-white border border-slate-100 p-3 rounded-xl shadow-xs text-sm items-start sm:items-center">
                                <div className="flex-1 flex items-center gap-2 text-emerald-700">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/60">L{i+1}</span>
                                  <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Login:</span>
                                  <span className="font-mono font-bold text-slate-800">{formatTime(c.loginTime)}</span>
                                </div>
                                <div className="flex-1 flex items-center gap-2 text-slate-700">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200/60">O{i+1}</span>
                                  <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Logout:</span>
                                  <span className="font-mono font-bold text-slate-800">
                                    {c.cycleStatus === 'COMPLETED' ? formatTime(c.logoutTime) : (isActiveSession ? 'Still Logged In' : "Didn't Logout")}
                                  </span>
                                </div>
                                {c.durationMinutes !== undefined && c.durationMinutes !== null && (
                                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70 self-start sm:self-center shadow-xs">
                                    <Clock className="h-3 w-3 text-slate-400" />
                                    <span>Duration: {formatDuration(c.durationMinutes)}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoring;
