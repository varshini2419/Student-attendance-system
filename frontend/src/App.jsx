import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import FaceRegistration from './pages/FaceRegistration';
import FaceTestingModule from './pages/FaceTestingModule';
import RealTimeAttendance from './pages/RealTimeAttendance';
import AttendanceLogs from './pages/AttendanceLogs';
import Reports from './pages/Reports';

// Layout wrapper for authenticated pages
const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 bg-grid-pattern">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected App Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['admin', 'faculty']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/face-registration" element={<FaceRegistration />} />
            <Route path="/realtime-attendance" element={<RealTimeAttendance />} />
            <Route path="/face-testing" element={<FaceTestingModule />} />
            <Route path="/logs" element={<AttendanceLogs />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          {/* Fallback redirect */}
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
