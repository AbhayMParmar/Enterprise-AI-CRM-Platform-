import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Sparkles,
  UserCheck,
  Trash2,
} from 'lucide-react';
import api from '../../services/api';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { useToast } from '../../components/ui/Toast';

export interface UserSubscriptionMappingItem {
  id: string;
  name: string;
  email: string;
  role: string;
  accountStatus: string;
  companyId?: string;
  companyName: string;
  companyStatus: string;
  inheritedSubscription: {
    plan: string;
    status: string;
    billingCycle: string;
    aiAccess: boolean;
    aiQueryLimit: number;
    currentAiUsage: number;
  };
  lastLogin: string;
}

export const UserSubscriptionTable = () => {
  const { success, error } = useToast();
  const [users, setUsers] = useState<UserSubscriptionMappingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchUserSubscriptionOverview = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/companies/user-subscriptions', {
        params: { role: roleFilter, search: searchQuery },
      });
      setUsers(res.data.users || []);
    } catch (err: any) {
      error('Failed to load user subscription mapping data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSubscriptionOverview();
  }, [roleFilter, searchQuery]);

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete employee ${userName}? This action cannot be undone.`)) {
      return;
    }
    // Optimistic local state update
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    success(`Employee ${userName} deleted successfully.`);

    try {
      await api.delete(`/users/${userId}`);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete employee user');
      fetchUserSubscriptionOverview();
    }
  };

  return (
    <Card className="bg-white dark:bg-[#121212] border-slate-200 dark:border-zinc-800 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">User &amp; Subscription Mapping Overview</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Clear mapping of users, roles, parent companies, and inherited subscription &amp; AI access contexts.
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={fetchUserSubscriptionOverview} className="dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
          <RefreshCw size={14} className="mr-1" />
          Refresh Mapping
        </Button>
      </CardHeader>

      <CardBody className="p-0">
        {/* Search & Role Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#18181B] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['ALL', 'COMPANY_OWNER', 'SALES_MANAGER', 'SALES_REPRESENTATIVE', 'SUPER_ADMIN'].map((rl) => (
              <button
                key={rl}
                type="button"
                onClick={() => setRoleFilter(rl)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  roleFilter === rl
                    ? 'bg-slate-900 dark:bg-zinc-800 text-white'
                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-white'
                }`}
              >
                {rl.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* User Mapping Table */}
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table className="w-full min-w-[750px] text-left text-xs text-slate-700 dark:text-zinc-300">
            <thead className="bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-zinc-800">
              <tr>
                <th className="p-3.5">User Details</th>
                <th className="p-3.5">Platform Role</th>
                <th className="p-3.5">Assigned Company</th>
                <th className="p-3.5">Inherited Plan Context</th>
                <th className="p-3.5 text-center">AI Feature Access</th>
                <th className="p-3.5 text-center">AI Credit Usage</th>
                <th className="p-3.5 text-center">Account Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-zinc-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 dark:text-indigo-400 mb-2" />
                    Loading user subscription mappings...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-zinc-500 italic">
                    No users match the search filter.
                  </td>
                </tr>
              ) : (
                users.map((usr) => {
                  const sub = usr.inheritedSubscription;
                  const isSuperAdmin = usr.role === 'SUPER_ADMIN' || usr.role === 'SuperAdmin';
                  return (
                    <tr key={usr.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{usr.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">{usr.email}</div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isSuperAdmin
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 dark:border dark:border-purple-800'
                              : usr.role === 'COMPANY_OWNER' || usr.role === 'Admin'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 dark:border dark:border-blue-800'
                              : usr.role === 'SALES_MANAGER' || usr.role === 'SalesManager'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300 dark:border dark:border-zinc-700'
                          }`}
                        >
                          {usr.role}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                          <Building2 size={13} className="text-slate-400 dark:text-zinc-500" />
                          <span>{usr.companyName}</span>
                        </div>
                        {usr.companyId && (
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                            ID: {usr.companyId.slice(-8)}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="font-extrabold text-blue-600 dark:text-blue-400 uppercase text-xs">
                          {sub.plan}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500 capitalize">
                          Status: {sub.status} • Cycle: {sub.billingCycle}
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        {sub.aiAccess ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-800 font-bold rounded text-[10px] inline-flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            Enabled
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 dark:border dark:border-rose-800 font-bold rounded text-[10px] inline-flex items-center gap-1">
                            <XCircle size={12} />
                            Disabled
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center font-bold text-indigo-700 dark:text-indigo-400">
                        {sub.currentAiUsage} / {sub.aiQueryLimit}
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border inline-flex items-center gap-1 ${
                            usr.accountStatus === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
                              : usr.accountStatus === 'REJECTED' || usr.accountStatus === 'SUSPENDED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {usr.accountStatus}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        {!isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(usr.id, usr.name)}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                            title="Delete Employee Account"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
};

export default UserSubscriptionTable;
