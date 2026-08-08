import React, { useState, useMemo, useCallback } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CircleUser,
  GitFork,
  Handshake,
  Sparkles,
  ListTodo,
  CalendarDays,
  BarChart3,
  Users2,
  ScrollText,
  Settings2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Menu,
  ShieldCheck,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { useToast } from '../components/ui/Toast';
import NotificationBell from '../components/notifications/NotificationBell';
import { Logo } from '../components/common/Logo';

type UserRole = 'SuperAdmin' | 'Admin' | 'SalesManager' | 'SalesRep';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: UserRole[]; // undefined = visible to all authenticated users
}

// Full ordered navigation manifest — items without `roles` are universal
const NAV_MANIFEST: NavItem[] = [
  { label: 'Overview',          path: '/dashboard',       icon: LayoutDashboard },
  { label: 'SuperAdmin Hub',    path: '/super-admin',     icon: ShieldCheck, roles: ['SuperAdmin'] },
  { label: 'User Management',   path: '/user-management',  icon: Users2,      roles: ['SuperAdmin', 'Admin'] },
  { label: 'My Profile',        path: '/profile',         icon: CircleUser },
  { label: 'Leads Pipeline',    path: '/leads',           icon: GitFork },
  { label: 'Deals Tracker',     path: '/deals',           icon: Handshake },
  { label: 'AI Copilot',        path: '/ai-assistant',    icon: Sparkles },
  { label: 'Tasks Manager',     path: '/tasks',           icon: ListTodo },
  { label: 'Sales Calendar',    path: '/calendar',        icon: CalendarDays },
  { label: 'Executive Reports', path: '/reports',         icon: BarChart3,   roles: ['SuperAdmin', 'Admin', 'SalesManager'] },
  { label: 'Team Manager',      path: '/teams',           icon: Users2,      roles: ['SuperAdmin', 'Admin', 'SalesManager'] },
  { label: 'Audit Logs',        path: '/activities',      icon: ScrollText,  roles: ['SuperAdmin', 'Admin'] },
  { label: 'Admin Hub',         path: '/admin-settings',  icon: Settings2,   roles: ['SuperAdmin', 'Admin'] },
];

export const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { success } = useToast();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter nav items by the current user's role — memoized for performance
  const navItems = useMemo(() => {
    if (!user) return NAV_MANIFEST.filter(item => !item.roles);
    return NAV_MANIFEST.filter(item =>
      !item.roles || item.roles.includes(user.role as UserRole)
    );
  }, [user?.role]);

  const handleLogout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore API errors on logout
    } finally {
      logout();
      success('Logged out successfully.');
      navigate('/login');
    }
  }, [logout, navigate, success]);

  const getPageTitle = useCallback(() => {
    const active = navItems.find(item => item.path === location.pathname);
    return active ? active.label : 'Dashboard';
  }, [navItems, location.pathname]);

  // Shared nav link renderer
  const renderNavLinks = (onClickFn?: () => void) =>
    navItems.map((item) => {
      const Icon = item.icon;
      const isActive = location.pathname === item.path;
      return (
        <Link
          key={item.path}
          to={item.path}
          onClick={onClickFn}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${isActive
              ? 'bg-brand-primary/10 text-brand-primary font-bold'
              : 'text-brand-textSecondary hover:text-brand-textPrimary hover:bg-slate-50'
            }
          `}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {!isSidebarCollapsed && <span>{item.label}</span>}
        </Link>
      );
    });

  const avatarSrc =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=2563eb&color=fff&size=80`;

  return (
    <div className="h-screen flex bg-brand-bg text-brand-textPrimary overflow-hidden font-sans">

      {/* ── Sidebar: Desktop ───────────────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col bg-brand-surface border-r border-brand-border h-screen transition-all duration-300 relative z-30
          ${isSidebarCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-brand-border flex-shrink-0">
          {!isSidebarCollapsed ? (
            <Logo size="sm" showText={true} />
          ) : (
            <div className="mx-auto">
              <Logo size="sm" showText={false} />
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(prev => !prev)}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3.5 top-20 z-40 bg-white border border-slate-200 p-1.5 rounded-full text-slate-600 hover:text-brand-primary hover:border-blue-300 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Nav Links — scrollbar hidden but scrollable */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1.5 overflow-y-auto scrollbar-hide">
          {renderNavLinks()}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-brand-border flex flex-col gap-3 flex-shrink-0">
          <Link
            to="/profile"
            className="flex items-center gap-3 overflow-hidden p-1.5 hover:bg-slate-100/80 rounded-xl transition-all cursor-pointer"
          >
            <img
              src={avatarSrc}
              alt={user?.name || 'User avatar'}
              className="w-10 h-10 rounded-full border border-brand-border object-cover flex-shrink-0"
            />
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate leading-snug hover:text-blue-600 transition-colors">
                  {user?.name}
                </span>
                <span className="text-xs text-brand-textSecondary truncate">{user?.role}</span>
              </div>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors w-full"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Mobile Backdrop ────────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden"
        />
      )}

      {/* ── Sidebar: Mobile Drawer ─────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 bg-brand-surface border-r border-brand-border w-64 z-50 flex flex-col transition-transform duration-300 md:hidden
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-brand-border flex-shrink-0">
          <div className="flex items-center gap-2 font-bold text-lg text-brand-primary">
            <span className="bg-brand-primary text-white p-1.5 rounded-lg text-xs leading-none">AI</span>
            <span>CRM Platform</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close mobile menu"
            className="text-brand-textSecondary hover:text-brand-textPrimary transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable nav, no scrollbar */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1.5 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-brand-primary/10 text-brand-primary font-bold'
                    : 'text-brand-textSecondary hover:text-brand-textPrimary hover:bg-slate-50'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-brand-border flex flex-col gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={avatarSrc}
              alt={user?.name || 'User avatar'}
              className="w-10 h-10 rounded-full border border-brand-border object-cover"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate leading-snug">{user?.name}</span>
              <span className="text-xs text-brand-textSecondary truncate">{user?.role}</span>
            </div>
          </div>
          <button
            onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Workspace ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-brand-surface border-b border-brand-border px-5 flex items-center justify-between z-20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open mobile menu"
              className="md:hidden text-brand-textSecondary hover:text-brand-textPrimary"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-base font-semibold text-brand-textPrimary hidden md:block">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Search */}
            <div className="relative max-w-xs hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-textSecondary" />
              <input
                type="text"
                placeholder="Quick search..."
                className="pl-9 pr-4 py-1.5 bg-brand-bg border border-brand-border rounded-lg text-xs outline-none focus:border-brand-primary/60 focus:ring-1 focus:ring-brand-primary/30 w-48 transition-all"
              />
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Server Status Badge */}
            <div className="hidden lg:flex items-center gap-1.5 bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-1 rounded-full text-xs font-semibold text-brand-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
              <span>Workspace Server: online</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50 scrollbar-hide"
          style={{ padding: '16px' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
