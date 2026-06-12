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
  Video
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
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      description: 'Registered in database'
    },
    {
      title: 'Present Today',
      value: stats.presentToday,
      icon: UserCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      description: 'Marked present'
    },
    {
      title: 'Absent Today',
      value: stats.absentToday,
      icon: UserX,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
      description: 'Dynamic local calculation'
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendancePercentage}%`,
      icon: Percent,
      color: 'text-violet-600 bg-violet-50 border-violet-100',
      description: 'Today\'s average rate'
    }
  ];

  if (loading && recentLogs.length === 0) {
    return (
      <div className="space-y-6">
        {/* Shimmer skeleton for metrics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 animate-pulse rounded-2xl border border-slate-100 bg-white"></div>
          ))}
        </div>
        {/* Shimmer skeleton for chart & table */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-96 animate-pulse rounded-2xl border border-slate-100 bg-white lg:col-span-2"></div>
          <div className="h-96 animate-pulse rounded-2xl border border-slate-100 bg-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Quick action bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Smart Campus Dashboard</h2>
          <p className="text-sm text-slate-500 font-medium">Real-time attendance insights and analytics</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate('/realtime-attendance')}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600 active:scale-[0.98] transition-all"
          >
            <Video className="h-4 w-4" />
            <span>Launch Scanner</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cardItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="glass-card hover-scale flex items-center justify-between p-6 bg-white"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.title}</span>
                <span className="block text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">
                  {item.value}
                </span>
                <span className="block text-[11px] text-slate-400 font-medium">{item.description}</span>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${item.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Chart & Recent Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Analytics Trends Chart Card */}
        <div className="glass-card flex flex-col p-6 lg:col-span-2 bg-white">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 leading-none">Weekly Trends</h3>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Last 7 Active Days</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f1f5f9',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
                <Area
                  name="Present"
                  type="monotone"
                  dataKey="present"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPresent)"
                />
                <Area
                  name="Absent"
                  type="monotone"
                  dataKey="absent"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Table Card */}
        <div className="glass-card flex flex-col p-6 bg-white">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Recent Attendance</h3>
              <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Marked Today</span>
            </div>
            <button
              onClick={() => navigate('/logs')}
              className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {recentLogs.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-4">
                <Users className="h-10 w-10 text-slate-300" />
                <span className="mt-2 text-xs font-bold text-slate-400">No activity today yet.</span>
                <span className="text-[10px] text-slate-400">Mark attendance manually or via webcam scanner.</span>
              </div>
            ) : (
              recentLogs.map((log) => (
                <div key={log._id} className="flex items-center justify-between rounded-xl bg-slate-50/50 p-3.5 border border-slate-100/40 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-bold text-xs">
                      {log.student?.name ? log.student.name[0] : 'S'}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-800 truncate leading-none mb-1">
                        {log.student?.name || 'Unknown'}
                      </span>
                      <span className="block text-[10px] font-bold text-slate-400">
                        {log.student?.rollNumber} • {log.student?.branch}-{log.student?.section}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-slate-800">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="block text-[9px] font-bold text-emerald-600 uppercase">Present</span>
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
