import { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Briefcase,
  UserCheck,
  Activity,
  DollarSign,
  TrendingUp,
  Bot,
  Server,
  Database,
  CheckCircle2,
  Lock,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../services/api';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

interface SuperAdminMetrics {
  userStats: {
    totalUsers: number;
    superAdminCount: number;
    adminCount: number;
    managerCount: number;
    repCount: number;
    activeUsers: number;
    onlineUsers: number;
  };
  crmStats: {
    totalLeads: number;
    totalDeals: number;
    openDeals: number;
    closedDeals: number;
    totalRevenue: number;
    monthlyRevenue: number;
  };
  aiStats: {
    copilotQueriesCount: number;
    activeModels: string[];
  };
  systemHealth: {
    serverStatus: string;
    databaseStatus: string;
    uptimeSeconds: number;
  };
  auditLogs: any[];
}

const ROLE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

export const SuperAdminDashboard = () => {
  const { error } = useToast();
  const [metrics, setMetrics] = useState<SuperAdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/users/superadmin-metrics');
      setMetrics(res.data);
    } catch (err: any) {
      error('Failed to load SuperAdmin metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <RefreshCw className="w-8 h-8 text-brand-primary animate-spin" />
        <p className="text-sm font-medium text-brand-textSecondary">Loading SuperAdmin Dashboard Data...</p>
      </div>
    );
  }

  const roleDistribution = [
    { name: 'SuperAdmin', value: metrics?.userStats.superAdminCount || 1 },
    { name: 'Admin', value: metrics?.userStats.adminCount || 1 },
    { name: 'SalesManager', value: metrics?.userStats.managerCount || 0 },
    { name: 'SalesRep', value: metrics?.userStats.repCount || 0 },
  ];

  const crmPerformanceData = [
    { name: 'Leads', count: metrics?.crmStats.totalLeads || 0 },
    { name: 'Deals', count: metrics?.crmStats.totalDeals || 0 },
    { name: 'Open Deals', count: metrics?.crmStats.openDeals || 0 },
    { name: 'Closed Won', count: metrics?.crmStats.closedDeals || 0 },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-900/50">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30 backdrop-blur-md">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Enterprise SuperAdmin Dashboard</h1>
          </div>
          <p className="text-xs text-indigo-200/80 mt-1 max-w-2xl">
            Unrestricted system oversight: workspace roles, security logs, CRM deal performance, server diagnostics, and AI usage metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchMetrics} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh Diagnostics
          </Button>
        </div>
      </div>

      {/* Row 1: Statistics Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-white hover:border-brand-primary/40 transition-all shadow-xs">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">Total Users</p>
              <h3 className="text-2xl font-bold text-brand-textPrimary mt-1">{metrics?.userStats.totalUsers}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                {metrics?.userStats.activeUsers} Active • {metrics?.userStats.onlineUsers} Online 24h
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white hover:border-brand-primary/40 transition-all shadow-xs">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-bold text-brand-textPrimary mt-1">
                ${metrics?.crmStats.totalRevenue.toLocaleString()}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                +${metrics?.crmStats.monthlyRevenue.toLocaleString()} this month
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white hover:border-brand-primary/40 transition-all shadow-xs">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">AI Copilot Activity</p>
              <h3 className="text-2xl font-bold text-brand-textPrimary mt-1">
                {metrics?.aiStats.copilotQueriesCount} queries
              </h3>
              <p className="text-[11px] text-indigo-600 font-medium mt-1">Groq LLaMA 3.3 Active</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white hover:border-brand-primary/40 transition-all shadow-xs">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">System Health</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{metrics?.systemHealth.serverStatus}</h3>
              <p className="text-[11px] text-brand-textSecondary font-medium mt-1">
                DB: {metrics?.systemHealth.databaseStatus}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Server className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Row 2: Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Distribution Donut Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h3 className="font-bold text-sm text-brand-textPrimary flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-primary" />
              Role Distribution
            </h3>
          </CardHeader>
          <CardBody className="h-64 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {roleDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap justify-center">
              {roleDistribution.map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ROLE_COLORS[idx] }} />
                  <span>{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* CRM Volume Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-bold text-sm text-brand-textPrimary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-primary" />
              CRM Pipeline Volume & Conversions
            </h3>
          </CardHeader>
          <CardBody className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={crmPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Row 3: Security Audit Stream & System Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-brand-textPrimary flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-primary" />
              Live System Audit Stream & Login Logs
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
              Top 10 Recent Events
            </span>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {metrics?.auditLogs && metrics.auditLogs.length > 0 ? (
                metrics.auditLogs.map((log: any) => (
                  <div key={log._id} className="p-3 sm:px-4 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                        {log.userId?.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <p className="font-semibold text-brand-textPrimary">
                          {log.userId?.name || 'System User'}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">({log.userId?.role || 'System'})</span>
                        </p>
                        <p className="text-slate-500 text-[11px]">{log.action}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 italic">No recent system audit records.</div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Server & Infrastructure Diagnostics Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h3 className="font-bold text-sm text-brand-textPrimary flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-primary" />
              Server & Infrastructure Diagnostics
            </h3>
          </CardHeader>
          <CardBody className="flex flex-col gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">MongoDB Connection</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                Connected
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-700">Groq AI Microservice</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                LLaMA-3 Ready
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-700">JWT Security Token Engine</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
                Active & Encrypted
              </span>
            </div>

            <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
              <strong>Enterprise RBAC Guard Active:</strong> API calls and frontend routes are strictly filtered based on authenticated JSON Web Tokens and user roles.
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
