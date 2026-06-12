import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit, Lock, Mail, AlertCircle, ServerCrash, CheckCircle2, ArrowRight } from 'lucide-react';

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
    <div className="flex h-screen w-screen bg-white">
      {/* Left Side - AI Illustration Panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-900 p-12 lg:flex">
        {/* Animated Background Gradients */}
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-brand-600/30 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-indigo-600/30 blur-[120px]"></div>
        <div className="absolute left-[30%] top-[40%] h-[20%] w-[20%] rounded-full bg-emerald-500/20 blur-[80px]"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-xl border border-white/20 shadow-xl">
            <BrainCircuit className="h-7 w-7 text-brand-400" />
          </div>
          <span className="text-xl font-bold text-white tracking-wide">Smart<span className="text-brand-400">AI</span></span>
        </div>

        <div className="relative z-10 my-auto max-w-lg">
          <h1 className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
            Next-Gen <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">
              Student Attendance
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 leading-relaxed font-medium">
            Seamless facial recognition. Real-time analytics. Enterprise-grade security. Managing campus attendance has never been this effortless.
          </p>
          
          <div className="mt-12 flex gap-4">
            <div className="flex items-center gap-3 rounded-full bg-white/5 border border-white/10 px-4 py-2 backdrop-blur-md">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-sm font-semibold text-slate-200">System Online</span>
            </div>
            <div className="flex items-center gap-3 rounded-full bg-white/5 border border-white/10 px-4 py-2 backdrop-blur-md">
              <CheckCircle2 className="h-4 w-4 text-brand-400" />
              <span className="text-sm font-semibold text-slate-200">Secure Access</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm font-medium text-slate-500">
          &copy; {new Date().getFullYear()} Smart AI Systems. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full items-center justify-center bg-slate-50 lg:w-1/2">
        <div className="w-full max-w-md px-8 py-10 sm:px-12 sm:py-16">
          
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="mb-10 flex flex-col items-center justify-center text-center lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/30">
              <BrainCircuit className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-3xl font-extrabold text-slate-900 tracking-tight">SmartAI</h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">Sign in to your dashboard</p>
          </div>

          <div className="hidden lg:block mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">Please enter your details to sign in.</p>
          </div>

          {/* Error / Success Messages */}
          <div className="animate-fade-in-up">
            {(localError || authError) && (
              <div className="mb-6 flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-100 p-4 shadow-sm shadow-rose-100/50">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                <div className="text-sm font-semibold text-rose-700">{localError || authError}</div>
              </div>
            )}

            {seedSuccess && (
              <div className="mb-6 flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-100 p-4 shadow-sm shadow-emerald-100/50">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="text-sm font-semibold text-emerald-700">{seedSuccess}</div>
              </div>
            )}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700 uppercase tracking-widest">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credentials Panel */}
          <div className="mt-8 border-t border-slate-200/60 pt-8">
            <span className="mb-4 block text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
              Demo Accounts
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fillCredentials('admin')}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3 text-center transition-all hover:border-brand-300 hover:bg-brand-50 hover:shadow-sm active:scale-[0.97] cursor-pointer"
              >
                <span className="text-[13px] font-bold text-slate-800">Admin</span>
                <span className="text-[10px] font-semibold text-slate-400 mt-0.5">Full Access</span>
              </button>
              <button
                onClick={() => fillCredentials('faculty')}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3 text-center transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm active:scale-[0.97] cursor-pointer"
              >
                <span className="text-[13px] font-bold text-slate-800">Faculty</span>
                <span className="text-[10px] font-semibold text-slate-400 mt-0.5">Class Access</span>
              </button>
            </div>
          </div>

          {/* Seed Database Option */}
          <div className="mt-8 text-center">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-brand-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <ServerCrash className="h-4 w-4" />
              {seeding ? 'Configuring...' : 'System Setup (Seed Database)'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;