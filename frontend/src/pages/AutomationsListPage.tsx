import React, { useState, useEffect } from 'react';
import { useAutomations } from '../hooks/useAutomations';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Power,
  PowerOff,
  Edit2,
  Trash2,
  MessageCircle,
  Hash,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Workflow,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Instagram } from '../components/icons';

export const AutomationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    automations,
    isLoading,
    error,
    updateAutomation,
    deleteAutomation,
  } = useAutomations();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clear toast notifications after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleCopyToken = (id: string, token: string | null) => {
    if (!token) return;
    const url = `${window.location.origin}/p/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setSuccessMessage('Landing page URL copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await updateAutomation({
        id,
        payload: { status: nextStatus },
      });
      setSuccessMessage(`Automation campaign ${nextStatus === 'active' ? 'activated' : 'paused'} successfully.`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to update automation status. Please try again.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }
    try {
      await deleteAutomation(id);
      setSuccessMessage('Automation campaign deleted successfully.');
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to delete automation campaign. Please try again.');
    }
  };

  const filteredAutomations = automations.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dmTemplate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keywords.some((k) => k.keyword.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getMatchTypeText = (type: string) => {
    switch (type) {
      case 'contains':
        return 'Contains';
      case 'starts_with':
        return 'Starts with';
      default:
        return 'Exact';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/20';
      case 'paused':
        return 'bg-[#ff9900]/10 text-[#ff9900] border-[#ff9900]/20';
      case 'archived':
        return 'bg-zinc-800 text-zinc-500 border-zinc-700/50';
      default: // draft
        return 'bg-[#7f22fe]/10 text-[#7f22fe] border-[#7f22fe]/20';
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Toast Notification Layer */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {successMessage && (
          <div className="pointer-events-auto flex items-center gap-3 bg-[#121214]/95 border border-[#14b8a6]/30 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
            <div className="size-6 rounded-full bg-[#14b8a6]/20 flex items-center justify-center text-[#14b8a6]">
              <CheckCircle2 className="size-4" />
            </div>
            <span className="text-zinc-200 text-sm font-medium">{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="pointer-events-auto flex items-center gap-3 bg-[#121214]/95 border border-red-500/30 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
            <div className="size-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
              <AlertCircle className="size-4" />
            </div>
            <span className="text-zinc-200 text-sm font-medium">{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Header filter options */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-[#121214]/30 border border-white/5 p-5 rounded-2xl backdrop-blur-md">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaign name, keyword, or DM snippet..."
            className="w-full bg-[#09090b]/40 border border-white/5 hover:border-white/10 focus:border-[#7f22fe]/40 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-500 outline-none transition-all"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status buttons */}
          <div className="flex bg-[#09090b]/30 p-1 border border-white/5 rounded-xl">
            {(['all', 'active', 'paused', 'draft'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-[#1a1a1e] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <Link
            to="/dashboard/automations/new"
            className="rounded-xl bg-[#7f22fe] hover:bg-[#9647ff] text-white px-5 py-3 text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-[#7f22fe]/20"
          >
            <Plus className="size-4" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* Main content grid */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center gap-4 py-24">
          <Loader2 className="size-10 text-[#7f22fe] animate-spin" />
          <span className="text-zinc-400 text-sm font-medium animate-pulse">
            Fetching automation campaigns...
          </span>
        </div>
      ) : error ? (
        <div className="border border-red-500/10 bg-red-500/5 rounded-2xl p-10 flex flex-col items-center gap-4 text-center max-w-xl mx-auto w-full my-6">
          <div className="size-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <AlertCircle className="size-6" />
          </div>
          <h3 className="font-semibold text-lg text-white">Error Loading Campaigns</h3>
          <p className="text-zinc-400 text-sm leading-6">
            We failed to load your automation campaigns from the backend API. Verify database connection status and attempt refreshing.
          </p>
        </div>
      ) : filteredAutomations.length === 0 ? (
        /* Empty State */
        <div className="border border-dashed border-white/5 bg-[#121214]/50 rounded-2xl p-16 text-center flex flex-col justify-center items-center gap-6 max-w-2xl mx-auto w-full my-6">
          <div className="size-16 rounded-2xl bg-[#1a1a1e] border border-white/5 flex items-center justify-center text-[#7f22fe] shadow-2xl">
            <Workflow className="size-8" />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg text-white">No Automations Found</h3>
            <p className="text-zinc-400 text-sm leading-6 max-w-md">
              {searchQuery || statusFilter !== 'all'
                ? 'No campaigns match your current filters. Clear filters or adjust search queries.'
                : 'Auto-respond to Instagram comments, distribute links, generate qualified leads, and grow your marketing scale now.'}
            </p>
          </div>
          <div className="flex gap-4">
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="rounded-xl border border-white/5 hover:border-white/10 hover:bg-[#1a1a1e] text-zinc-300 px-5 py-3 text-sm font-semibold transition-all"
              >
                Reset Filters
              </button>
            )}
            <Link
              to="/dashboard/automations/new"
              className="rounded-xl bg-[#7f22fe] hover:bg-[#9647ff] text-white px-6 py-3 text-sm font-semibold transition-all shadow-lg shadow-[#7f22fe]/20"
            >
              Build First Automation
            </Link>
          </div>
        </div>
      ) : (
        /* Automations list grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAutomations.map((item) => (
            <div
              key={item.id}
              className="relative overflow-hidden rounded-2xl border border-white/5 bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] backdrop-blur-xl p-6 flex flex-col gap-5 transition-all duration-300 hover:border-[#7f22fe]/30 hover:shadow-xl hover:shadow-[#7f22fe]/5"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#7f22fe]/5 rounded-full blur-3xl pointer-events-none" />

              {/* Title, status, profile indicator */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col min-w-0 gap-1.5">
                  <h3 className="font-bold text-lg leading-6 text-white truncate hover:text-[#9647ff] transition-colors">
                    <Link to={`/dashboard/automations/${item.id}`}>{item.name}</Link>
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-zinc-400 text-xs bg-[#1a1a1e] px-2 py-1 rounded-md border border-white/5">
                      <Instagram className="size-3 text-[#7f22fe]" />
                      <span className="font-medium">@{item.instagramAccountUsername || 'Unknown'}</span>
                    </div>
                    {item.postId ? (
                      <span className="text-[10px] text-zinc-500 font-semibold bg-white/5 px-2 py-1 rounded-md">
                        Specific Post Trigger
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#14b8a6] font-semibold bg-[#14b8a6]/5 px-2 py-1 rounded-md border border-[#14b8a6]/10">
                        Global Trigger
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Status badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(
                      item.status
                    )}`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        item.status === 'active' ? 'bg-[#14b8a6] animate-pulse' : 'bg-current'
                      }`}
                    />
                    {item.status}
                  </span>

                  {/* Toggle Switch */}
                  {item.status !== 'archived' && (
                    <button
                      onClick={() => handleToggleStatus(item.id, item.status)}
                      title={item.status === 'active' ? 'Pause Campaign' : 'Activate Campaign'}
                      className={`size-8 rounded-lg border flex items-center justify-center transition-all ${
                        item.status === 'active'
                          ? 'border-[#ff9900]/20 bg-[#ff9900]/10 text-[#ff9900] hover:bg-[#ff9900]/20'
                          : 'border-[#14b8a6]/20 bg-[#14b8a6]/10 text-[#14b8a6] hover:bg-[#14b8a6]/20'
                      }`}
                    >
                      {item.status === 'active' ? (
                        <PowerOff className="size-4" />
                      ) : (
                        <Power className="size-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/5 w-full" />

              {/* Keywords triggers list */}
              <div className="flex flex-col gap-2">
                <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                  <Hash className="size-3.5 text-zinc-500" />
                  Trigger Keywords ({item.keywords.length})
                </span>
                <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                  {item.keywords.map((k) => (
                    <span
                      key={k.id}
                      className="inline-flex items-center gap-1 bg-[#1a1a1e] border border-white/5 text-zinc-300 rounded-lg px-2.5 py-1 text-xs font-medium"
                    >
                      <span className="text-[#7f22fe] font-bold">#</span>
                      {k.keyword}
                      <span className="text-[10px] text-zinc-500 bg-white/5 px-1 py-0.5 rounded ml-1 font-semibold scale-90">
                        {getMatchTypeText(k.matchType)}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* DM response template preview */}
              <div className="flex flex-col gap-2 bg-[#09090b]/40 rounded-xl p-3 border border-white/5">
                <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5">
                  <MessageCircle className="size-3.5 text-zinc-500" />
                  Auto-Response DM ({item.flowType === 'dm' ? 'Standard DM' : 'Landing Page Lead Link'})
                </span>
                <p className="text-zinc-300 text-sm leading-6 italic line-clamp-2">
                  "{item.dmTemplate}"
                </p>
                {item.collectLeads && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-[#7f22fe]/10 border border-[#7f22fe]/20 text-[#7f22fe] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="size-3" />
                      Collects Leads
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Fields: {item.leadFields.join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer action buttons */}
              <div className="flex justify-between items-center gap-4 mt-2 pt-2 border-t border-white/5">
                <span className="text-zinc-500 text-[10px]">
                  Created {new Date(item.createdAt).toLocaleDateString()}
                </span>
                
                <div className="flex items-center gap-2">
                  {item.flowType === 'landing_page' && item.landingPageToken && (
                    <button
                      onClick={() => handleCopyToken(item.id, item.landingPageToken)}
                      className="size-8 rounded-lg border border-white/5 hover:border-white/10 bg-[#1a1a1e]/40 flex items-center justify-center text-zinc-300 hover:text-white transition-all"
                      title="Copy Landing Page URL"
                    >
                      {copiedId === item.id ? (
                        <Check className="size-4 text-[#14b8a6]" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/dashboard/automations/${item.id}`)}
                    className="size-8 rounded-lg border border-white/5 hover:border-white/10 bg-[#1a1a1e]/40 flex items-center justify-center text-zinc-300 hover:text-white transition-all"
                    title="Edit Campaign"
                  >
                    <Edit2 className="size-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="size-8 rounded-lg border border-white/5 hover:border-red-500/20 hover:bg-red-500/10 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-all"
                    title="Delete Campaign"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
