import { lazy, Suspense, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { Loader2 } from 'lucide-react';

// ─── Lazy-loaded pages — keeps initial bundle small ───────────────────────────
const DashboardLayout = lazy(() => import('../layouts/DashboardLayout'));
const Login           = lazy(() => import('../pages/AuthPage').then(m => ({ default: m.Login })));
const Register        = lazy(() => import('../pages/AuthPage').then(m => ({ default: m.Register })));
const Dashboard       = lazy(() => import('../pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Unauthorized    = lazy(() => import('../pages/Unauthorized').then(m => ({ default: m.Unauthorized })));
const Leads           = lazy(() => import('../pages/Leads').then(m => ({ default: m.Leads })));
const Teams           = lazy(() => import('../pages/Teams').then(m => ({ default: m.Teams })));
const ActivityLogs    = lazy(() => import('../pages/ActivityLogs').then(m => ({ default: m.ActivityLogs })));
const Deals           = lazy(() => import('../pages/Deals').then(m => ({ default: m.Deals })));
const AiAssistant     = lazy(() => import('../pages/AiAssistant').then(m => ({ default: m.AiAssistant })));
const TasksPage       = lazy(() => import('../pages/TasksPage').then(m => ({ default: m.TasksPage })));
const CalendarPage    = lazy(() => import('../pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const ReportsPage     = lazy(() => import('../pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const ProfilePage     = lazy(() => import('../pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const Landing         = lazy(() => import('../pages/Landing').then(m => ({ default: m.Landing })));
const SuperAdminDashboard = lazy(() => import('../pages/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const UserManagement  = lazy(() => import('../pages/UserManagement').then(m => ({ default: m.UserManagement })));
const ForgotPassword  = lazy(() => import('../pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const VerifyOTP        = lazy(() => import('../pages/VerifyOTP').then(m => ({ default: m.VerifyOTP })));
const ResetPassword   = lazy(() => import('../pages/ResetPassword').then(m => ({ default: m.ResetPassword })));

// ─── Shared Full-Screen Loading Spinner ───────────────────────────────────────
const PageLoadingSpinner = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-brand-bg gap-3">
    <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
    <p className="text-sm font-medium text-brand-textSecondary">Loading...</p>
  </div>
);

// ─── Route Guards ─────────────────────────────────────────────────────────────

/** Requires authentication — shows loader while session is being restored */
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center h-screen bg-brand-bg gap-3">
        <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
        <p className="text-sm font-medium text-brand-textSecondary">Restoring session...</p>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
};

/** For Login & Register pages — redirects authenticated users to correct dashboard */
const GuestRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  if (isLoading) return null;
  if (!isAuthenticated) return <Outlet />;
  // Role-based redirect after login
  if (user?.role === 'SuperAdmin') return <Navigate to="/super-admin" replace />;
  return <Navigate to="/dashboard" replace />;
};

/** RBAC guard — redirects to /unauthorized if role is insufficient */
interface RoleGuardProps {
  allowedRoles: ('SuperAdmin' | 'Admin' | 'SalesManager' | 'SalesRep')[];
}

const RoleGuard = ({ allowedRoles }: RoleGuardProps) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return allowedRoles.includes(user.role) ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

// ─── App Routes ───────────────────────────────────────────────────────────────

export const AppRoutes = () => {
  const { login, logout, setLoading } = useAuthStore();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const hasSessionFlag = localStorage.getItem('crm_has_session');

    if (!hasSessionFlag) {
      setLoading(false);
      return;
    }

    const restoreSession = async () => {
      try {
        // Attempt to silently refresh using the HttpOnly refresh-token cookie.
        // This is the single source of truth for session restoration.
        // No 'session-active' dummy token — only valid JWTs from the server.
        const refreshRes = await api.post('/auth/refresh', {}, { timeout: 8000 });
        const { accessToken, user } = refreshRes.data;
        if (accessToken && user) {
          login(accessToken, user);
        } else {
          // Server responded but data was malformed — clear session
          logout();
        }
      } catch {
        // Refresh token expired, missing, or server error — force re-login
        logout();
      }
    };

    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Suspense fallback={<PageLoadingSpinner />}>
      <Routes>
        {/* Public Landing */}
        <Route path="/" element={<Landing />} />

        {/* Guest Only */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>

            {/* All authenticated users */}
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/profile"      element={<ProfilePage />} />
            <Route path="/leads"        element={<Leads />} />
            <Route path="/deals"        element={<Deals />} />
            <Route path="/ai-assistant" element={<AiAssistant />} />
            <Route path="/tasks"        element={<TasksPage />} />
            <Route path="/calendar"     element={<CalendarPage />} />

            {/* SuperAdmin Only */}
            <Route element={<RoleGuard allowedRoles={['SuperAdmin']} />}>
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
            </Route>

            {/* Admin & SuperAdmin */}
            <Route element={<RoleGuard allowedRoles={['SuperAdmin', 'Admin']} />}>
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="/teams"      element={<Teams />} />
              <Route path="/activities" element={<ActivityLogs />} />
              <Route path="/admin-settings" element={
                <div className="p-6 bg-white rounded-xl border border-brand-border smooth-shadow">
                  <h1 className="text-xl font-bold text-brand-textPrimary">SuperAdmin &amp; Admin Control Hub</h1>
                  <p className="text-sm text-brand-textSecondary mt-2">
                    This interface handles administrative updates, RBAC mappings, and log settings.
                  </p>
                  <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-100 text-yellow-800 text-xs">
                    <strong>Access Logged:</strong> System audit record generated for your current account session.
                  </div>
                </div>
              } />
            </Route>

            {/* Manager, Admin, SuperAdmin */}
            <Route element={<RoleGuard allowedRoles={['SuperAdmin', 'Admin', 'SalesManager']} />}>
              <Route path="/reports" element={<ReportsPage />} />
            </Route>

          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
