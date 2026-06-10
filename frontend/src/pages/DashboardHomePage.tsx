import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { AnalyticsChart } from '../components/AnalyticsChart';
import {
  MessageCircle,
  Users,
  DollarSign,
  Workflow,
  Plus,
  Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface OverviewData {
  dmsSent: number;
  newLeads: number;
  engagementRate: string;
  revenueDriven: string;
  commentsCount: number;
  keywordsMatched: number;
  failuresCount: number;
}

interface TimeSeriesPoint {
  date: string;
  comments: number;
  matches: number;
  dms: number;
  leads: number;
}

interface CampaignRow {
  id: string;
  name: string;
  status: 'active' | 'draft' | 'paused' | 'archived';
  flowType: 'dm' | 'landing_page';
  collectLeads: boolean;
  comments: number;
  matches: number;
  dms: number;
  failures: number;
  leads: number;
}

export const DashboardHomePage: React.FC = () => {
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('30d');

  // Fetch aggregate overview stats
  const { data: overview, isLoading: isOverviewLoading } = useQuery<OverviewData>({
    queryKey: ['analytics', 'overview', range],
    queryFn: async () => {
      const res = await api.get(`/api/analytics/overview?range=${range}`);
      return res.data.data;
    },
    refetchInterval: 10000, // Refetch every 10s for live vibe
  });

  // Fetch time-series graph data
  const { data: timeSeries, isLoading: isSeriesLoading } = useQuery<TimeSeriesPoint[]>({
    queryKey: ['analytics', 'time-series', range],
    queryFn: async () => {
      const res = await api.get(`/api/analytics/time-series?range=${range}`);
      return res.data.data;
    },
    refetchInterval: 15000,
  });

  // Fetch campaign breakdown list
  const { data: campaigns, isLoading: isCampaignsLoading } = useQuery<CampaignRow[]>({
    queryKey: ['analytics', 'campaigns'],
    queryFn: async () => {
      const res = await api.get('/api/analytics/campaigns');
      return res.data.data;
    },
    refetchInterval: 20000,
  });

  const isLoading = isOverviewLoading || isSeriesLoading || isCampaignsLoading;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center gap-4 min-h-[400px]">
        <div className="size-10 rounded-xl bg-[#7f22fe]/10 border border-[#7f22fe]/20 animate-pulse flex items-center justify-center">
          <Activity className="size-5 text-[#7f22fe] animate-spin" />
        </div>
        <span className="text-zinc-400 text-sm animate-pulse">Analyzing campaign telemetry...</span>
      </div>
    );
  }

  // Fallback default values
  const stats = overview || {
    dmsSent: 0,
    newLeads: 0,
    engagementRate: '0.0%',
    revenueDriven: '$0.00',
    commentsCount: 0,
    keywordsMatched: 0,
    failuresCount: 0,
  };

  const chartData = timeSeries || [];
  const validCampaigns = campaigns || [];

  return (
    <div className="flex flex-col gap-8">
      {/* Date Range Selection Bar */}
      <div className="flex justify-between items-center bg-[#121214]/60 backdrop-blur-md rounded-xl p-3 border border-white/5">
        <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider flex items-center gap-2">
          <span className="size-2 bg-emerald-500 rounded-full animate-ping" />
          Live Metrics
        </span>
        <div className="bg-[#09090b]/80 border border-white/5 rounded-lg p-0.5 flex">
          {(['7d', '30d', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                range === r
                  ? 'bg-[#1a1a1e] text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {r === 'all' ? 'All Time' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: DMs Sent */}
        <div className="bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] backdrop-blur-xl rounded-2xl border border-white/5 p-6 flex flex-col gap-3 transition-transform hover:-translate-y-0.5">
          <div className="flex justify-between items-center">
            <div className="size-10 rounded-xl bg-[#7f22fe]/20 flex justify-center items-center">
              <MessageCircle className="size-5 text-[#7f22fe]" />
            </div>
            <span className="text-[#14b8a6] font-medium text-xs leading-4 flex items-center gap-1">
              Active
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl leading-9 tracking-tight text-white">
              {stats.dmsSent.toLocaleString()}
            </span>
            <span className="text-zinc-400 text-xs leading-5 uppercase tracking-wider font-semibold">
              DMs Sent
            </span>
          </div>
        </div>

        {/* Card 2: New Leads */}
        <div className="bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] backdrop-blur-xl rounded-2xl border border-white/5 p-6 flex flex-col gap-3 transition-transform hover:-translate-y-0.5">
          <div className="flex justify-between items-center">
            <div className="size-10 rounded-xl bg-[#14b8a6]/20 flex justify-center items-center">
              <Users className="size-5 text-[#14b8a6]" />
            </div>
            <span className="text-[#14b8a6] font-medium text-xs leading-4 flex items-center gap-1">
              Live Sync
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl leading-9 tracking-tight text-white">
              {stats.newLeads.toLocaleString()}
            </span>
            <span className="text-zinc-400 text-xs leading-5 uppercase tracking-wider font-semibold">
              Captured Leads
            </span>
          </div>
        </div>

        {/* Card 3: Engagement Rate */}
        <div className="bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] backdrop-blur-xl rounded-2xl border border-white/5 p-6 flex flex-col gap-3 transition-transform hover:-translate-y-0.5">
          <div className="flex justify-between items-center">
            <div className="size-10 rounded-xl bg-[#3b82f6]/20 flex justify-center items-center">
              <Activity className="size-5 text-[#3b82f6]" />
            </div>
            <span className="text-zinc-400 font-medium text-xs leading-4">
              Rate
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl leading-9 tracking-tight text-white">
              {stats.engagementRate}
            </span>
            <span className="text-zinc-400 text-xs leading-5 uppercase tracking-wider font-semibold">
              Engagement Rate
            </span>
          </div>
        </div>

        {/* Card 4: Revenue Driven */}
        <div className="bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] backdrop-blur-xl rounded-2xl border border-white/5 p-6 flex flex-col gap-3 transition-transform hover:-translate-y-0.5">
          <div className="flex justify-between items-center">
            <div className="size-10 rounded-xl bg-amber-500/20 flex justify-center items-center">
              <DollarSign className="size-5 text-amber-500" />
            </div>
            <span className="text-[#14b8a6] font-medium text-xs leading-4">
              Est. Value
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-3xl leading-9 tracking-tight text-white">
              {stats.revenueDriven}
            </span>
            <span className="text-zinc-400 text-xs leading-5 uppercase tracking-wider font-semibold">
              Estimated Revenue
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-[#121214] border border-white/5 p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-base leading-6 text-white">
              Conversions & Ingestion Trends
            </h3>
            <p className="text-zinc-400 text-sm leading-5">
              Daily comment triggers, matches, and successfully dispatched DMs.
            </p>
          </div>
          {chartData.length > 0 ? (
            <AnalyticsChart data={chartData} />
          ) : (
            <div className="w-full h-80 bg-[#09090b]/30 rounded-xl border border-white/5 border-dashed flex flex-col items-center justify-center p-8 text-center text-zinc-500">
              <Activity className="size-8 text-zinc-600 mb-2 animate-pulse" />
              <p className="text-sm">No historical analytics event snapshots found for selected range.</p>
              <p className="text-xs text-zinc-600 mt-1">Metrics will populate as comment events are received.</p>
            </div>
          )}
        </div>

        {/* Funnel chart representation */}
        <div className="rounded-2xl bg-[#121214] border border-white/5 p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-base leading-6 text-white">
              Campaign Conversion Funnel
            </h3>
            <p className="text-zinc-400 text-sm leading-5">
              General funnel conversion effectiveness
            </p>
          </div>

          <div className="flex flex-col justify-center gap-6 flex-1 py-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <span>Comments Ingested</span>
                <span className="text-white">{stats.commentsCount}</span>
              </div>
              <div className="w-full bg-[#1a1a1e] h-2 rounded-full overflow-hidden">
                <div className="bg-[#3b82f6] h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <span>Keyword Matches</span>
                <span className="text-white">{stats.keywordsMatched} ({stats.commentsCount > 0 ? ((stats.keywordsMatched / stats.commentsCount) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full bg-[#1a1a1e] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#7f22fe] h-full rounded-full"
                  style={{ width: stats.commentsCount > 0 ? `${(stats.keywordsMatched / stats.commentsCount) * 100}%` : '0%' }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <span>Leads Converted</span>
                <span className="text-white">{stats.newLeads} ({stats.keywordsMatched > 0 ? ((stats.newLeads / stats.keywordsMatched) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full bg-[#1a1a1e] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#14b8a6] h-full rounded-full"
                  style={{ width: stats.keywordsMatched > 0 ? `${(stats.newLeads / stats.keywordsMatched) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance Breakdown Table */}
      <div className="rounded-2xl bg-[#121214] border border-white/5 p-6 flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-base leading-6 text-white flex items-center gap-2">
              <Workflow className="size-4 text-[#7f22fe]" />
              Campaign Performance Breakdown
            </h3>
            <p className="text-zinc-400 text-sm leading-5">
              Statistics grouped per automation campaign
            </p>
          </div>
          <Link to="/dashboard/automations/new" className="rounded-lg bg-[#7f22fe] hover:bg-[#9647ff] text-white text-xs leading-4 flex items-center gap-1.5 px-3 py-2 transition-colors shadow shadow-[#7f22fe]/10">
            <Plus className="size-3.5" />
            New Campaign
          </Link>
        </div>

        {validCampaigns.length === 0 ? (
          <div className="border border-white/5 rounded-xl border-dashed p-10 text-center text-zinc-500">
            <Workflow className="size-10 text-zinc-700 mx-auto mb-3" />
            <p className="font-medium text-white mb-1">No automations created yet</p>
            <p className="text-xs mb-4">Create an automation keyword match flow to start tracking performance metrics.</p>
            <Link to="/dashboard/automations/new" className="px-4 py-2 bg-[#7f22fe] text-white text-xs font-semibold rounded-lg hover:bg-[#9647ff] transition-colors">
              Create First Automation
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pr-4">Campaign Name</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Type</th>
                  <th className="pb-3 px-4 text-right">Comments</th>
                  <th className="pb-3 px-4 text-right">Matches</th>
                  <th className="pb-3 px-4 text-right">DMs Sent</th>
                  <th className="pb-3 px-4 text-right">Failures</th>
                  <th className="pb-3 px-4 text-right">Leads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {validCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="py-4 pr-4 font-semibold text-white group-hover:text-[#7f22fe] transition-colors">
                      <Link to={`/dashboard/automations/${campaign.id}`}>{campaign.name}</Link>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                        campaign.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : campaign.status === 'draft'
                          ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-zinc-400 capitalize">
                      {campaign.flowType.replace('_', ' ')}
                    </td>
                    <td className="py-4 px-4 text-right text-zinc-300 font-medium">
                      {campaign.comments.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right text-zinc-300 font-medium">
                      {campaign.matches.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right text-zinc-300 font-medium">
                      {campaign.dms.toLocaleString()}
                    </td>
                    <td className={`py-4 px-4 text-right font-medium ${campaign.failures > 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                      {campaign.failures.toLocaleString()}
                    </td>
                    <td className={`py-4 px-4 text-right font-bold ${campaign.leads > 0 ? 'text-[#14b8a6]' : 'text-zinc-500'}`}>
                      {campaign.leads.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
