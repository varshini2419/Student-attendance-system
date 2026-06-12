import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Wifi, WifiOff, Bell, BrainCircuit } from 'lucide-react';
import API from '../utils/api';

const Navbar = ({ onMenuOpen }) => {
  const location = useLocation();
  const [backendStatus, setBackendStatus] = useState('connecting');
  const [dbStatus, setDbStatus] = useState('connecting');
  const [aiStatus, setAiStatus] = useState('connecting');

  // Determine current page title
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard Analytics';
      case '/students': return 'Student Directory';
      case '/face-registration': return 'Face Database Registration';
      case '/realtime-attendance': return 'Real-Time Webcam Scan';
      case '/logs': return 'Attendance History';
      case '/reports': return 'Reports & Downloads';
      default: return 'Smart Attendance AI';
    }
  };

  useEffect(() => {
    console.log('[DIAGNOSTICS] Frontend successfully connected to browser environment.');
    const checkHealth = async () => {
      // Check Backend & DB
      try {
        const res = await API.get('/health');
        if (res.data && res.data.success) {
          if (backendStatus !== 'online') console.log('[DIAGNOSTICS] Backend connected successfully.');
          setBackendStatus('online');
          
          if (res.data.dbConnected) {
             if (dbStatus !== 'online') console.log('[DIAGNOSTICS] MongoDB Atlas connected securely.');
             setDbStatus('online');
          } else {
             if (dbStatus !== 'offline') console.warn('[DIAGNOSTICS] MongoDB Atlas connection failed.');
             setDbStatus('offline');
          }
        } else {
          console.warn('[DIAGNOSTICS] Backend responded with non-success state.');
          setBackendStatus('offline');
          setDbStatus('offline');
        }
      } catch (err) {
        console.error('[DIAGNOSTICS] Backend connection timeout or refusal:', err.message);
        setBackendStatus('offline');
        setDbStatus('offline');
      }

      // Check AI Service
      try {
        let aiUrl = import.meta.env.VITE_AI_SERVICE_URL || 'https://student-attendance-system-1-p2tq.onrender.com';
        if (aiUrl.includes('127.0.0.1') || aiUrl.includes('localhost')) {
          aiUrl = 'https://student-attendance-system-1-p2tq.onrender.com';
        }
        const aiRes = await fetch(`${aiUrl}/api/health`);
        if (aiRes.ok) {
          if (aiStatus !== 'online') console.log('[DIAGNOSTICS] Python AI Service connected and model loaded.');
          setAiStatus('online');
        } else {
          console.warn(`[DIAGNOSTICS] Python AI Service responded with status: ${aiRes.status}`);
          setAiStatus('offline');
        }
      } catch (err) {
        console.error('[DIAGNOSTICS] Python AI Service connection error:', err.message);
        setAiStatus('offline');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [backendStatus, dbStatus, aiStatus]);

  const StatusBadge = ({ status, label, icon: Icon }) => (
    <div 
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all duration-300 border ${
        status === 'online'
          ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/50 shadow-emerald-100/50'
          : status === 'offline'
          ? 'bg-rose-50/80 text-rose-700 border-rose-200/50 shadow-rose-100/50'
          : 'bg-amber-50/80 text-amber-700 border-amber-200/50 shadow-amber-100/50'
      }`}
      title={`${label} is ${status}`}
    >
      {status === 'online' ? (
        <Icon className="h-3 w-3 text-emerald-500" />
      ) : status === 'offline' ? (
        <WifiOff className="h-3 w-3" />
      ) : (
        <div className="flex h-3 w-3 items-center justify-center">
          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500"></span>
        </div>
      )}
      <span className="hidden lg:inline tracking-wide uppercase">{label}</span>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 flex h-[76px] w-full items-center justify-between border-b border-slate-200/50 bg-white/70 px-6 backdrop-blur-xl shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-brand-600 lg:hidden shadow-sm transition-all"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 hidden sm:block">
            {getPageTitle()}
          </h1>
          <h1 className="text-lg font-bold text-slate-900 sm:hidden">
            {getPageTitle()}
          </h1>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Connection status badges */}
        <div className="flex flex-col sm:flex-row gap-1.5">
          <StatusBadge status={backendStatus} label="API" icon={Wifi} />
          <StatusBadge status={dbStatus} label="DB" icon={Wifi} />
          <StatusBadge status={aiStatus} label="AI" icon={BrainCircuit} />
        </div>

        {/* Notifications Icon */}
        <button className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-brand-200 hover:text-brand-500 transition-all shadow-sm">
          <Bell className="h-5 w-5 group-hover:animate-wiggle" />
          <span className="absolute right-2.5 top-2.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500 border-2 border-white"></span>
          </span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
