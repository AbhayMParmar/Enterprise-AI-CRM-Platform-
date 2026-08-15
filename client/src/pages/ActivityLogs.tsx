import React, { useState, useEffect } from 'react';
import { 
  Database, 
  LogIn, 
  PlusCircle, 
  RefreshCw, 
  UserPlus, 
  Users, 
  FileSpreadsheet, 
  Activity,
  Trash2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

interface ActivityLogSession {
  _id: string;
  action: string;
  userId?: { name: string; email: string; role: string };
  details?: any;
  createdAt: string;
}

export const ActivityLogs = () => {
  const { error } = useToast();
  const [logs, setLogs] = useState<ActivityLogSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/activities', {
        params: {
          page,
          limit: 15,
        }
      });
      setLogs(response.data.logs);
      setTotalPages(response.data.pagination.pages);
    } catch {
      // Silently ignore on initial load — user will see empty state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const getActionIcon = (action: string) => {
    const map: any = {
      TEAM_CREATE: <PlusCircle className="w-4 h-4 text-blue-600" />,
      INVITE_SEND: <UserPlus className="w-4 h-4 text-amber-500" />,
      INVITE_ACCEPT: <CheckCircleIcon className="w-4 h-4 text-green-500" />,
      INVITE_DECLINE: <XCircleIcon className="w-4 h-4 text-red-500" />,
      CUSTOMER_CREATE: <PlusCircle className="w-4 h-4 text-emerald-600" />,
      CUSTOMER_UPDATE: <RefreshCw className="w-4 h-4 text-purple-500 animate-spin-once" />,
      CUSTOMER_NOTE_ADD: <Database className="w-4 h-4 text-indigo-500" />,
      CUSTOMER_DELETE: <Trash2 className="w-4 h-4 text-red-600" />,
      CUSTOMER_IMPORT: <FileSpreadsheet className="w-4 h-4 text-emerald-700" />,
      USER_LOGIN: <LogIn className="w-4 h-4 text-green-600" />,
    };
    return map[action] || <Activity className="w-4 h-4 text-slate-500" />;
  };

  const getActionLabel = (action: string) => {
    return action.replace(/_/g, ' ');
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-brand-textPrimary">Audit log timeline</h1>
          <p className="text-xs text-brand-textSecondary mt-0.5">Real-time system records of mutations, logins, and CRM modifications.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} isLoading={isLoading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Logs Card */}
      <Card className="overflow-hidden">
        <CardBody className="p-0">
          <div className="overflow-x-auto w-full scrollbar-thin">
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-brand-border text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                  <th className="px-6 py-4 w-12">Log</th>
                  <th className="px-6 py-4">Action Event</th>
                  <th className="px-6 py-4">Operator details</th>
                  <th className="px-6 py-4">Details payload</th>
                  <th className="px-6 py-4 text-right">Logged Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="w-5 h-5 bg-slate-200 rounded-full" /></td>
                      <td className="px-6 py-4"><div className="w-20 h-4 bg-slate-200 rounded" /></td>
                      <td className="px-6 py-4"><div className="w-32 h-4 bg-slate-200 rounded" /></td>
                      <td className="px-6 py-4"><div className="w-48 h-4 bg-slate-200 rounded" /></td>
                      <td className="px-6 py-4 text-right"><div className="w-16 h-4 bg-slate-200 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-brand-textSecondary italic">
                      <div className="flex flex-col items-center gap-2 max-w-xs mx-auto">
                        <AlertCircle className="w-8 h-8 text-brand-primary/30" />
                        <p className="text-sm font-semibold">No audit records logged yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">{getActionIcon(log.action)}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] uppercase font-semibold text-slate-700">
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-brand-textPrimary">{log.userId?.name || 'Workspace User'}</span>
                          <span className="text-[10px] text-brand-textSecondary">{log.userId?.email || ''}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-[10px] max-w-sm truncate select-all">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-brand-textSecondary font-medium">
                        {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-brand-border bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs text-brand-textSecondary">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

// Internal mini icons to avoid syntax import conflicts
const CheckCircleIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const XCircleIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

export default ActivityLogs;
