import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, Mail, AlertCircle, ServerCrash } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState('');

  const { login, error: authError, token, seedDefaultUsers, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (token) {
      navigate(from, { replace: true });
    }
  }, [token, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSeedSuccess('');

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      navigate(from, { replace: true });
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setLocalError('');
    try {
      const res = await seedDefaultUsers();
      if (res.success) {
        setSeedSuccess('Default Admin & Faculty accounts created successfully!');
      } else {
        setLocalError(res.message || 'Seeding failed. Is the MongoDB service running?');
      }
    } catch (err) {
      setLocalError('Connection to backend failed. Please verify that the backend is running.');
    } finally {
      setSeeding(false);
    }
  };

  // Quick fill helper
  const fillCredentials = (role) => {
    if (role === 'admin') {
      setEmail('admin@attendance.com');
      setPassword('Admin@123');
    } else {
      setEmail('faculty@attendance.com');
      setPassword('Faculty@123');
    }
    setLocalError('');
    setSeedSuccess('');
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 bg-grid-pattern p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-100/40">
        
        {/* Top Logo */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">AI Attendance System</h2>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">Smart Campus Faculty & Admin Login</p>
        </div>

        {/* Display Error Message */}
        {(localError || authError) && (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-100 p-3.5 text-xs font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <div>{localError || authError}</div>
          </div>
        )}

        {/* Display Seed Success Message */}
        {seedSuccess && (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 text-xs font-semibold text-emerald-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-emerald-600" />
            <div>{seedSuccess}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="faculty@attendance.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Credentials Panel */}
        <div className="mt-6 border-t border-slate-100 pt-6">
          <span className="block text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            Quick Credentials Templates
          </span>
          <div className="mt-3.5 grid grid-cols-2 gap-3">
            <button
              onClick={() => fillCredentials('admin')}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-200 p-2.5 text-center transition-all hover:bg-slate-50 active:scale-[0.97] cursor-pointer"
            >
              <span className="text-xs font-bold text-slate-800">Admin Account</span>
              <span className="text-[10px] text-slate-400">admin@attendance.com</span>
            </button>
            <button
              onClick={() => fillCredentials('faculty')}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-200 p-2.5 text-center transition-all hover:bg-slate-50 active:scale-[0.97] cursor-pointer"
            >
              <span className="text-xs font-bold text-slate-800">Faculty Account</span>
              <span className="text-[10px] text-slate-400">faculty@attendance.com</span>
            </button>
          </div>
        </div>

        {/* Seed Database Option */}
        <div className="mt-5 text-center">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50 cursor-pointer"
          >
            <ServerCrash className="h-3.5 w-3.5" />
            {seeding ? 'Configuring database...' : 'First-time setup? Seed default accounts'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;