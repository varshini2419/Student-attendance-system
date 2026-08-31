import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Camera,
  ScanFace,
  ClipboardList,
  FileSpreadsheet,
  LogOut,
  X,
  GraduationCap,
  Fingerprint,
  Activity
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, allowedRoles: ['admin', 'faculty'] },
    { name: 'Students', path: '/students', icon: Users, allowedRoles: ['admin', 'faculty'] },
    { name: 'Face Registration', path: '/face-registration', icon: Fingerprint, allowedRoles: ['admin', 'faculty'] },
    { name: 'Real-Time Scanner', path: '/realtime-attendance', icon: ScanFace, allowedRoles: ['admin', 'faculty'] },
    { name: 'Live Monitoring', path: '/monitoring', icon: Activity, allowedRoles: ['admin', 'faculty'] },
    { name: 'Attendance History', path: '/logs', icon: ClipboardList, allowedRoles: ['admin', 'faculty'] }
  ];

  const filteredItems = menuItems.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(user?.role)
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/60 bg-white/80 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}
      >
        {/* Sidebar Header */}
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-blue-800 text-white shadow-lg shadow-brand-500/30">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-lg font-extrabold text-slate-900 tracking-tight leading-none">CSD & CSIT</span>
              <span className="text-[10px] font-bold text-brand-700 tracking-[0.2em] uppercase mt-1 block">Internships</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto">
          <div className="px-3 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Main Menu</p>
          </div>
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-brand-50 text-brand-600 shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50/80 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -mt-3 h-6 w-1 rounded-r-full bg-brand-500" />
                    )}
                    <Icon className={`h-5 w-5 transition-colors duration-300 ${isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-brand-500'}`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar User profile footer */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50/80 p-3 border border-slate-100/50 hover:border-brand-100 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 text-brand-600 font-bold text-sm uppercase">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-slate-800 truncate leading-tight">
                {user?.name || 'Loading...'}
              </span>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                {user?.role || 'User'}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
              title="Sign Out"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
