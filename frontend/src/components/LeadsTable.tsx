import React, { useState } from 'react';
import { Search, Download, Filter, MessageSquare, Calendar, Phone, Mail, User } from 'lucide-react';
import { api } from '../lib/axios';

export interface Lead {
  id: string;
  automationId: string | null;
  instagramAccountId: string;
  igUserId: string;
  igUsername: string | null;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  sourceComment: string | null;
  capturedAt: string;
  automationName: string | null;
  accountUsername: string | null;
}

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({ leads, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  // Extract unique campaigns for dropdown filter
  const uniqueCampaigns = Array.from(
    new Set(leads.map((l) => l.automationName).filter(Boolean))
  ) as string[];

  // Filter leads based on search term and campaign selection
  const filteredLeads = leads.filter((lead) => {
    const searchString = `${lead.fullName || ''} ${lead.email || ''} ${lead.phone || ''} ${lead.igUsername || ''} ${lead.automationName || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesCampaign =
      selectedCampaign === 'all' || lead.automationName === selectedCampaign;
    return matchesSearch && matchesCampaign;
  });

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const response = await api.get('/api/leads/export', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gramflow-leads-${new Date().toISOString().split('T')[0]}.csv`);
      
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Failed to export CSV:', error);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Table Filters & Actions Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md rounded-xl bg-[#121214] border border-white/5 flex px-3.5 py-2.5 items-center gap-2.5 focus-within:border-[#7f22fe]/50 focus-within:shadow-[0_0_12px_rgba(127,34,254,0.15)] transition-all">
            <Search className="size-4 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none text-sm leading-5 w-full text-white placeholder:text-zinc-600"
              placeholder="Search by name, email, phone, campaign..."
            />
          </div>

          {/* Campaign Filter Dropdown */}
          <div className="relative rounded-xl bg-[#121214] border border-white/5 flex px-3.5 py-2.5 items-center gap-2.5 focus-within:border-[#7f22fe]/50 transition-all">
            <Filter className="size-4 text-zinc-400" />
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="bg-transparent outline-none text-sm leading-5 text-zinc-300 w-full pr-8 cursor-pointer appearance-none"
            >
              <option value="all" className="bg-[#121214] text-white">All Campaigns</option>
              {uniqueCampaigns.map((name) => (
                <option key={name} value={name} className="bg-[#121214] text-white">
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleExportCSV}
          disabled={isExporting || leads.length === 0}
          className="rounded-xl bg-[#7f22fe] hover:bg-[#9647ff] disabled:opacity-50 disabled:hover:bg-[#7f22fe] text-white px-5 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#7f22fe]/20 shrink-0"
        >
          <Download className="size-4" />
          {isExporting ? 'Exporting CSV...' : 'Export CSV'}
        </button>
      </div>

      {/* Main Table Wrapper */}
      <div className="border border-white/5 bg-[#121214]/30 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-[#121214]/50">
                <th className="p-4 font-semibold text-xs leading-4 text-zinc-400 uppercase tracking-wider">Follower Info</th>
                <th className="p-4 font-semibold text-xs leading-4 text-zinc-400 uppercase tracking-wider">Contact details</th>
                <th className="p-4 font-semibold text-xs leading-4 text-zinc-400 uppercase tracking-wider">Campaign source</th>
                <th className="p-4 font-semibold text-xs leading-4 text-zinc-400 uppercase tracking-wider">Source comment / Activity</th>
                <th className="p-4 font-semibold text-xs leading-4 text-zinc-400 uppercase tracking-wider">Captured Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                // Shimmer Loader Rows
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4"><div className="h-4 bg-white/5 rounded w-32 mb-2"></div><div className="h-3 bg-white/5 rounded w-24"></div></td>
                    <td className="p-4"><div className="h-4 bg-white/5 rounded w-40 mb-2"></div><div className="h-3 bg-white/5 rounded w-36"></div></td>
                    <td className="p-4"><div className="h-4 bg-white/5 rounded w-28"></div></td>
                    <td className="p-4"><div className="h-4 bg-white/5 rounded w-48"></div></td>
                    <td className="p-4"><div className="h-4 bg-white/5 rounded w-20"></div></td>
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="size-12 rounded-xl bg-zinc-800/40 border border-white/5 flex items-center justify-center text-zinc-500">
                        🔍
                      </div>
                      <span className="text-zinc-400 text-sm font-medium">No leads captured yet</span>
                      <p className="text-zinc-600 text-xs max-w-xs">
                        Configure comment-to-DM triggers with lead collection turned on or distribute your public web landing form.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const hasValidName = lead.fullName && lead.fullName !== '';
                  const hasIgUsername = lead.igUsername && lead.igUsername !== 'WebVisitor';

                  return (
                    <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Column 1: Follower Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 group-hover:border-[#7f22fe]/40 transition-all">
                            <User className="size-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm leading-5 text-white truncate">
                              {hasValidName ? lead.fullName : (hasIgUsername ? `@${lead.igUsername}` : 'Visitor')}
                            </span>
                            <span className="text-zinc-500 text-xs leading-4 truncate">
                              ID: {lead.igUserId.startsWith('web_') ? 'Web Submission' : lead.igUserId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Contact Details */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 justify-center">
                          {lead.email && (
                            <span className="text-sm text-zinc-200 flex items-center gap-1.5">
                              <Mail className="size-3.5 text-zinc-500 shrink-0" />
                              {lead.email}
                            </span>
                          )}
                          {lead.phone && (
                            <span className="text-sm text-zinc-200 flex items-center gap-1.5">
                              <Phone className="size-3.5 text-zinc-500 shrink-0" />
                              +91 {lead.phone}
                            </span>
                          )}
                          {!lead.email && !lead.phone && (
                            <span className="text-zinc-600 text-xs font-mono">None Provided</span>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Campaign Source */}
                      <td className="p-4">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm text-[#c084fc] truncate">
                            {lead.automationName || 'Global Drop'}
                          </span>
                          <span className="text-zinc-500 text-xs truncate">
                            @{lead.accountUsername || 'instagram'}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Activity Source */}
                      <td className="p-4">
                        <div className="flex items-center gap-2 max-w-sm">
                          <MessageSquare className="size-4 text-zinc-500 shrink-0" />
                          <span className="text-zinc-300 text-xs leading-4 truncate" title={lead.sourceComment || ''}>
                            {lead.sourceComment || 'Direct Submission'}
                          </span>
                        </div>
                      </td>

                      {/* Column 5: Date */}
                      <td className="p-4 text-zinc-400 text-xs leading-4">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-zinc-600" />
                          {new Date(lead.capturedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
