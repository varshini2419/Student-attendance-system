import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Wifi, WifiOff, Bell } from 'lucide-react';
import API from '../utils/api';

const Navbar = ({ onMenuOpen }) => {
  const location = useLocation();
  const [aiStatus, setAiStatus] = useState('connecting'); // 'online', 'offline', 'connecting'

  // Determine current page title
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard Analytics';
      case '/students':
        return 'Student Directory';
      case '/face-registration':
        return 'Face Database Registration';
      case '/realtime-attendance':
        return 'Real-Time Webcam Scan';
      case '/logs':
        return 'Attendance Sheets';
      case '/reports':
        return 'Reports & Downloads';
      default:
        return 'Smart Attendance AI';
    }
  };

  useEffect(() => {
    const checkAiHealth = async () => {
      try {
        // Querying check to see if the server responds
        const response = await API.get('/auth/me'); // Simple auth ping
        // Actually, we can check a generic status or direct query to AI service (proxied or via API)
        // Let's assume if backend is up, we check if AI is reachable. 
        // We'll create a health-check endpoint on the backend or we check local server.
        // Let's just do a fetch to backend check
        const res = await fetch('http://localhost:5000/');
        if (res.ok) {
          // Let's check AI service through our backend (we'll implement this route or just check the health route)
          try {
            // For checking local AI service directly or via backend health check.
            // Let's ping the backend. If backend works, we can assume online, but let's query the actual AI service health
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
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white px-6 shadow-sm shadow-slate-100/50">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-900 lg:text-xl">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Connection status badge */}
        <div 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all duration-300 ${
            aiStatus === 'online'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              : aiStatus === 'offline'
              ? 'bg-rose-50 text-rose-700 border border-rose-100'
              : 'bg-amber-50 text-amber-700 border border-amber-100'
          }`}
          title={aiStatus === 'online' ? 'Face recognition service is active' : 'AI service is offline'}
        >
          {aiStatus === 'online' ? (
            <>
              <Wifi className="h-3.5 w-3.5 animate-pulse" />
              <span className="hidden sm:inline">AI Core Active</span>
            </>
          ) : aiStatus === 'offline' ? (
            <>
              <WifiOff className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI Core Offline</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 animate-ping rounded-full bg-amber-500"></div>
              <span className="hidden sm:inline">Connecting...</span>
            </>
          )}
        </div>

        {/* Notifications Icon (Placeholder for polish) */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-500"></span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
