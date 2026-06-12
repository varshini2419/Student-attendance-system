import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  Percent,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  ScanFace,
  BrainCircuit,
  Activity
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import API from '../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendancePercentage: 0
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/attendance/dashboard');
      if (response.data.success) {
        setStats(response.data.data.stats);
        setRecentLogs(response.data.data.recentLogs);
        setTrends(response.data.data.trends);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Could not fetch dashboard analytics. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const cardItems = [
    {
      title: 'Total Enrolled',
      value: stats.totalStudents,
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600',
      bgClass: 'bg-blue-50/50',
      textClass: 'text-blue-600',
      description: 'Registered in database'
    },
    {
      title: 'Present Today',
      value: stats.presentToday,
      icon: UserCheck,
      gradient: 'from-emerald-400 to-emerald-600',
      bgClass: 'bg-emerald-50/50',
      textClass: 'text-emerald-600',
      description: 'Active attendees'
    },
    {
      title: 'Absent Today',
      value: stats.absentToday,
      icon: UserX,
      gradient: 'from-rose-400 to-rose-600',
      bgClass: 'bg-rose-50/50',
      textClass: 'text-rose-600',
      description: 'Pending check-ins'
    },
    {
      title: 'Daily Average',
      value: `${stats.attendancePercentage}%`,
      icon: Percent,
      gradient: 'from-amber-400 to-orange-500',
      bgClass: 'bg-amber-50/50',
      textClass: 'text-amber-600',
      description: 'Overall attendance rate'
    }
  ];

  if (loading && recentLogs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-36 animate-pulse rounded-2xl bg-white border border-slate-100 shadow-sm"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-[400px] animate-pulse rounded-2xl bg-white border border-slate-100 lg:col-span-2 shadow-sm"></div>
          <div className="h-[400px] animate-pulse rounded-2xl bg-white border border-slate-100 shadow-sm"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header and Quick action bar */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-brand-50 p-1.5 text-brand-600">
              <Activity className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">Overview</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">Dashboard Analytics</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Real-time attendance insights processed by AI</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => navigate('/realtime-attendance')}
            className="group flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <ScanFace className="h-4.5 w-4.5 text-brand-400 group-hover:animate-pulse" />
            <span>Launch Scanner</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm shadow-rose-100/50">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cardItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50"
            >
              <div className="relative z-10 flex items-center justify-between">
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.title}</span>
                  <span className="block text-3xl font-black text-slate-900 tracking-tight">
                    {item.value}
                  </span>
                  <span className="block text-xs font-semibold text-slate-500">{item.description}</span>
                </div>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              
              {/* Decorative background glow */}
              <div className={`absolute -right-6 -top-6 h-32 w-32 rounded-full ${item.bgClass} blur-3xl transition-transform group-hover:scale-150`}></div>
            </div>
          );
        })}
      </div>

      {/* Analytics Chart & Recent Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Analytics Trends Chart Card */}
        <div className="glass-card flex flex-col p-6 lg:col-span-2">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-brand-400 shadow-md">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Weekly Attendance Trends</h3>
                <span className="text-[11px] text-slate-400 font-bold tracking-widest uppercase">Last 7 Active Days</span>
              </div>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    fontWeight: '600'
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontWeight: '600', color: '#475569' }} />
                <Area
                  name="Present"
                  type="monotone"
                  dataKey="present"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPresent)"
                />
                <Area
                  name="Absent"
                  type="monotone"
                  dataKey="absent"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAbsent)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Table Card */}
        <div className="glass-card flex flex-col p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">AI Log Feed</h3>
                <span className="text-[11px] text-slate-400 font-bold tracking-widest uppercase">Live Captures</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/logs')}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-brand-50 hover:text-brand-600 transition-colors"
              title="View All History"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {recentLogs.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
                  <ScanFace className="h-6 w-6 text-slate-400" />
                </div>
                <span className="block text-sm font-bold text-slate-600">Awaiting Data</span>
                <span className="mt-1 block text-xs font-medium text-slate-400">Launch scanner to begin recognition</span>
              </div>
            ) : (
              recentLogs.map((log) => (
                <div key={log._id} className="group flex items-center justify-between rounded-xl bg-white border border-slate-200 p-3.5 shadow-sm hover:border-brand-300 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-indigo-100 text-brand-700 font-bold text-sm shadow-inner">
                      {log.student?.name ? log.student.name[0] : 'S'}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-bold text-slate-900 truncate leading-tight group-hover:text-brand-600 transition-colors">
                        {log.student?.name || 'Unknown'}
                      </span>
                      <span className="block text-[11px] font-bold text-slate-500 mt-0.5">
                        {log.student?.rollNumber} • {log.student?.branch}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-slate-800">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600 uppercase border border-emerald-100">
                      <span className="h-1 w-1 rounded-full bg-emerald-500"></span>
                      Present
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
