import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Wifi, WifiOff, Bell, BrainCircuit } from 'lucide-react';
import API from '../utils/api';

const Navbar = ({ onMenuOpen }) => {
  const location = useLocation();
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
    const checkAiHealth = async () => {
      try {
        const res = await fetch('http://localhost:5000/');
        if (res.ok) {
          try {
            const aiRes = await fetch('http://127.0.0.1:8000/api/health');
            if (aiRes.ok) {
              setAiStatus('online');
            } else {
              setAiStatus('offline');
            }
          } catch {
            setAiStatus('offline');
          }
        } else {
          setAiStatus('offline');
        }
      } catch (err) {
        setAiStatus('offline');
      }
    };

    checkAiHealth();
    const interval = setInterval(checkAiHealth, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

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

      <div className="flex items-center gap-3 sm:gap-5">
        {/* Connection status badge */}
        <div 
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all duration-300 border ${
            aiStatus === 'online'
              ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/50 shadow-emerald-100/50'
              : aiStatus === 'offline'
              ? 'bg-rose-50/80 text-rose-700 border-rose-200/50 shadow-rose-100/50'
              : 'bg-amber-50/80 text-amber-700 border-amber-200/50 shadow-amber-100/50'
          }`}
          title={aiStatus === 'online' ? 'Face recognition service is active' : 'AI service is offline'}
        >
          {aiStatus === 'online' ? (
            <>
              <BrainCircuit className="h-4 w-4 animate-pulse text-emerald-500" />
              <span className="hidden sm:inline tracking-wide">AI Core Online</span>
            </>
          ) : aiStatus === 'offline' ? (
            <>
              <WifiOff className="h-4 w-4" />
              <span className="hidden sm:inline tracking-wide">AI Core Offline</span>
            </>
          ) : (
            <>
              <div className="flex h-4 w-4 items-center justify-center">
                <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
              </div>
              <span className="hidden sm:inline tracking-wide">Connecting...</span>
            </>
          )}
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
