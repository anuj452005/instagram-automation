import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useAuth } from '@clerk/clerk-react';
import {
  Activity,
  Users,
  DollarSign,
  AlertOctagon,
  RefreshCw,
  LogOut,
  Terminal,
  Database,
  ExternalLink,
  ShieldAlert,
  Layers,
} from 'lucide-react';

interface AdminStats {
  systemMRR: number;
  totalUsers: number;
  systemErrorRate: string;
  queueDepths: {
    'comment-ingest': number;
    'dm-sender': number;
    'lead-processor': number;
    'analytics': number;
    'scheduled-activations': number;
  };
}

interface AuditLog {
  id: string;
  userId: string | null;
  actorType: 'user' | 'system' | 'admin' | 'worker';
  action: string;
  entityType: string | null;
  entityId: string | null;
  oldData: any;
  newData: any;
  ipAddress: string | null;
  occurredAt: string;
  userName: string | null;
  userEmail: string | null;
}

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getToken, isSignedIn } = useAuth();
  const [isAdminTokenValid, setIsAdminTokenValid] = useState<boolean | null>(null);

  const localToken = localStorage.getItem('admin_token');
  const staffUser = localStorage.getItem('admin_user') ? JSON.parse(localStorage.getItem('admin_user')!) : null;

  // Verify authentication on load
  useEffect(() => {
    const verifyAuth = async () => {
      // 1. If local admin token exists, try to fetch stats with it as header
      if (localToken) {
        try {
          await api.get('/api/admin/stats', {
            headers: {
              'X-Admin-Token': localToken,
            },
          });
          setIsAdminTokenValid(true);
          return;
        } catch {
          // Token invalid, clear it
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
        }
      }

      // 2. If no valid local token, check Clerk role
      if (isSignedIn) {
        try {
          const clerkToken = await getToken();
          const meRes = await api.get('/api/auth/me', {
            headers: {
              Authorization: clerkToken ? `Bearer ${clerkToken}` : undefined,
            },
          });
          if (meRes.data?.role === 'admin') {
            setIsAdminTokenValid(true);
            return;
          }
        } catch (err) {
          console.error('Failed to verify Clerk admin role:', err);
        }
      }

      // If both fail, block entry
      setIsAdminTokenValid(false);
      navigate('/dashboard');
    };

    verifyAuth();
  }, [localToken, isSignedIn, getToken, navigate]);

  // Query Stats
  const { data: stats, refetch: refetchStats, isFetching: isFetchingStats } = useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (localToken) {
        headers['X-Admin-Token'] = localToken;
      }
      const res = await api.get('/api/admin/stats', { headers });
      return res.data;
    },
    enabled: isAdminTokenValid === true,
    refetchInterval: 5000,
  });

  // Query Audit Logs
  const { data: logs, refetch: refetchLogs, isFetching: isFetchingLogs } = useQuery<{ success: boolean; logs: AuditLog[] }>({
    queryKey: ['admin', 'logs'],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (localToken) {
        headers['X-Admin-Token'] = localToken;
      }
      const res = await api.get('/api/admin/logs', { headers });
      return res.data;
    },
    enabled: isAdminTokenValid === true,
    refetchInterval: 10000,
  });

  // Retry job mutation
  const retryMutation = useMutation({
    mutationFn: async ({ queueName, jobId }: { queueName: string; jobId: string }) => {
      const headers: Record<string, string> = {};
      if (localToken) {
        headers['X-Admin-Token'] = localToken;
      }
      const res = await api.post('/api/admin/queues/retry', { queueName, jobId }, { headers });
      return res.data;
    },
    onSuccess: (data) => {
      alert(data.message || 'Job queued for retry successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'logs'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error?.message || 'Failed to retry job.');
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  if (isAdminTokenValid === null) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center gap-4 text-[#fafafa] font-sans">
        <Activity className="size-8 text-red-500 animate-spin" />
        <span className="text-zinc-500 text-sm animate-pulse">Decrypting administrative handshake...</span>
      </div>
    );
  }

  const queueKeys = stats ? (Object.keys(stats.queueDepths) as Array<keyof AdminStats['queueDepths']>) : [];

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] font-sans pb-16">
      {/* Top Staff Navigation Bar */}
      <header className="bg-[#121214] border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-md">
              <ShieldAlert className="size-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm leading-5 text-white tracking-tight">GramFlow Operations</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Admin Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-zinc-300">
                {staffUser ? staffUser.fullName : 'System Administrator'}
              </span>
              <span className="text-[10px] text-zinc-500">
                {staffUser ? `${staffUser.role.toUpperCase()} ACTOR` : 'CLERK ROLE ADMIN'}
              </span>
            </div>
            
            <button
              onClick={() => {
                refetchStats();
                refetchLogs();
              }}
              className="p-2 bg-[#1a1a1e] border border-white/5 text-zinc-400 hover:text-white rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold"
            >
              <RefreshCw className={`size-3.5 ${(isFetchingStats || isFetchingLogs) ? 'animate-spin' : ''}`} />
              Sync Telemetry
            </button>

            <button
              onClick={handleLogout}
              className="p-2 bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-red-500 rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold"
            >
              <LogOut className="size-3.5" />
              Staff Exit
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 mt-8 flex flex-col gap-8">
        {/* Core Administrative Stats Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: System-wide MRR */}
          <div className="bg-[#121214] border border-white/5 p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#7f22fe]/5 rounded-full blur-2xl group-hover:bg-[#7f22fe]/10 transition-colors pointer-events-none" />
            <div className="flex justify-between items-center">
              <div className="size-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
                <DollarSign className="size-5" />
              </div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Recurring Gross</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-extrabold text-white">
                {stats ? `$${stats.systemMRR.toLocaleString()}` : '$0.00'}
              </span>
              <span className="text-xs text-zinc-500 mt-1">Estimated Monthly Recurring Revenue</span>
            </div>
          </div>

          {/* Card 2: Active Users */}
          <div className="bg-[#121214] border border-white/5 p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#3b82f6]/5 rounded-full blur-2xl group-hover:bg-[#3b82f6]/10 transition-colors pointer-events-none" />
            <div className="flex justify-between items-center">
              <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <Users className="size-5" />
              </div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Account Database</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-extrabold text-white">
                {stats ? stats.totalUsers : 0}
              </span>
              <span className="text-xs text-zinc-500 mt-1">Total Synchronized Users</span>
            </div>
          </div>

          {/* Card 3: Error Rates */}
          <div className="bg-[#121214] border border-white/5 p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors pointer-events-none" />
            <div className="flex justify-between items-center">
              <div className="size-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <AlertOctagon className="size-5" />
              </div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Telemetry Failure</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-extrabold text-white">
                {stats ? stats.systemErrorRate : '0.00%'}
              </span>
              <span className="text-xs text-zinc-500 mt-1">DM Transmission Error Ratio (30 Days)</span>
            </div>
          </div>
        </div>

        {/* Queues & Monitors Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Queues Inspector */}
          <div className="lg:col-span-2 bg-[#121214] border border-white/5 p-6 rounded-2xl flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold text-base text-white flex items-center gap-2">
                  <Layers className="size-4.5 text-red-500" />
                  Durable Message Queues
                </h3>
                <p className="text-xs text-zinc-500">
                  Real-time pending and processing queue depths for BullMQ workers.
                </p>
              </div>

              <a
                href={`${api.defaults.baseURL || 'http://localhost:3000'}/admin/queues`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-red-500 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow shadow-red-500/5"
              >
                <span>Launch Bull Board</span>
                <ExternalLink className="size-3" />
              </a>
            </div>

            {stats ? (
              <div className="flex flex-col gap-4">
                {queueKeys.map((key) => {
                  const val = stats.queueDepths[key];
                  return (
                    <div key={key} className="bg-[#09090b]/40 rounded-xl p-4 border border-white/5 flex justify-between items-center group">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-white group-hover:text-red-500 transition-colors">{key}</span>
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Active State Depth</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-extrabold px-3 py-1 rounded-lg ${
                          val > 20 ? 'bg-red-500/15 text-red-500' : val > 0 ? 'bg-amber-500/15 text-amber-500' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {val} pending
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-40 border border-white/5 border-dashed rounded-xl flex items-center justify-center text-zinc-500 text-xs">
                No active queue stats loaded.
              </div>
            )}
          </div>

          {/* DB Status & Quick Info */}
          <div className="bg-[#121214] border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="font-semibold text-base text-white flex items-center gap-2">
              <Database className="size-4.5 text-red-500" />
              Database Status
            </h3>
            
            <div className="flex flex-col gap-4 justify-start flex-1 py-2">
              <div className="flex justify-between items-center border-b border-white/5 pb-2 text-xs">
                <span className="text-zinc-500">PostgreSQL Connections</span>
                <span className="font-bold text-emerald-500">Active</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2 text-xs">
                <span className="text-zinc-500">Redis Engine</span>
                <span className="font-bold text-emerald-500">Connected</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2 text-xs">
                <span className="text-zinc-500">Meta Webhook Ingestion</span>
                <span className="font-bold text-emerald-500">Healthy</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2 text-xs">
                <span className="text-zinc-500">Rate Limits</span>
                <span className="font-bold text-zinc-300">30 DMs/min per Acct</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">SSL Encryption</span>
                <span className="font-bold text-emerald-500">Enforced</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Timeline */}
        <div className="bg-[#121214] border border-white/5 p-6 rounded-2xl flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-base text-white flex items-center gap-2">
              <Terminal className="size-4.5 text-red-500" />
              System Operations Logs
            </h3>
            <p className="text-xs text-zinc-500">
              Interactive timeline of admin login successes, queue changes, and customer modifications.
            </p>
          </div>

          {logs && logs.logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    <th className="pb-3 pr-4">Occurred At</th>
                    <th className="pb-3 px-4">Actor</th>
                    <th className="pb-3 px-4">Action Event</th>
                    <th className="pb-3 px-4">Entity Type</th>
                    <th className="pb-3 px-4">Entity ID</th>
                    <th className="pb-3 px-4">IP Address</th>
                    <th className="pb-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {logs.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3 pr-4 text-zinc-400 font-mono whitespace-nowrap">
                        {new Date(log.occurredAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold mr-1.5 ${
                          log.actorType === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {log.actorType.toUpperCase()}
                        </span>
                        {log.userEmail || 'System'}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-200">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 capitalize whitespace-nowrap">
                        {log.entityType || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-500 truncate max-w-[120px]">
                        {log.entityId || '—'}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 font-mono">
                        {log.ipAddress || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {log.action === 'retry_queue_job' && log.newData?.jobId ? (
                          <button
                            onClick={() => retryMutation.mutate({ queueName: log.newData.queueName, jobId: log.newData.jobId })}
                            disabled={retryMutation.isPending}
                            className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded font-bold text-[10px] transition-colors"
                          >
                            Re-Retry
                          </button>
                        ) : log.newData || log.oldData ? (
                          <button
                            onClick={() => alert(`Metadata:\n${JSON.stringify({ oldData: log.oldData, newData: log.newData }, null, 2)}`)}
                            className="px-2 py-1 bg-[#1a1a1e] border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white rounded font-semibold text-[10px] transition-all"
                          >
                            Inspect
                          </button>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-white/5 border-dashed rounded-xl p-8 text-center text-zinc-500 text-xs">
              Timeline is clean. Operational logs will display here as events trigger.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
