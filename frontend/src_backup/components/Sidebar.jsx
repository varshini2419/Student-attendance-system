import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Camera,
  Scan,
  ClipboardList,
  FileSpreadsheet,
  LogOut,
  X,
  GraduationCap,
  FlaskConical
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuth();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      allowedRoles: ['admin', 'faculty']
    },
    {
      name: 'Students',
      path: '/students',
      icon: Users,
      allowedRoles: ['admin', 'faculty'] // Allow faculty to view, Admin to edit
    },
    {
      name: 'Face Registration',
      path: '/face-registration',
      icon: Camera,
      allowedRoles: ['admin', 'faculty']
    },
    {
      name: 'Face Testing',
      path: '/face-testing',
      icon: FlaskConical,
      allowedRoles: ['admin', 'faculty']
    },
    {
      name: 'Real-Time Scanner',
      path: '/realtime-attendance',
      icon: Scan,
      allowedRoles: ['admin', 'faculty']
    },
    {
      name: 'Attendance Sheets',
      path: '/logs',
      icon: ClipboardList,
      allowedRoles: ['admin', 'faculty']
    },
    {
      name: 'Reports Panel',
      path: '/reports',
      icon: FileSpreadsheet,
      allowedRoles: ['admin', 'faculty']
    }
  ];

  const filteredItems = menuItems.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(user?.role)
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-100 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-50 px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-base font-bold text-slate-900 leading-tight">Smart Campus</span>
              <span className="text-[10px] font-semibold text-brand-600 tracking-wider uppercase">Attendance AI</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-50 text-brand-600 shadow-sm shadow-brand-100/50'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar User profile footer */}
        <div className="border-t border-slate-50 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-bold text-sm uppercase">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-slate-800 truncate leading-tight">
                {user?.name || 'Loading...'}
              </span>
              <span className="block text-[10px] font-semibold text-brand-600 capitalize">
                {user?.role || 'User'}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-red-500 hover:shadow-sm hover:shadow-slate-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
