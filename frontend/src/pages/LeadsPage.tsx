import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { LeadsTable, Lead } from '../components/LeadsTable';
import { Users, Mail, Phone, BarChart2 } from 'lucide-react';

export const LeadsPage: React.FC = () => {
  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: async () => {
      const response = await api.get('/api/leads');
      return response.data;
    },
  });

  // Calculate metrics
  const totalLeads = leads.length;
  const emailsCollected = leads.filter((l) => l.email).length;
  const phonesCollected = leads.filter((l) => l.phone).length;
  const uniqueCampaignsCount = new Set(leads.map((l) => l.automationId).filter(Boolean)).size;

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Metrics Header Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] backdrop-blur-xl rounded-2xl border border-white/5 p-6 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="size-10 rounded-xl bg-[#7f22fe]/20 flex justify-center items-center">
              <Users className="size-5 text-[#7f22fe]" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-3xl leading-9 tracking-tight text-white">
              {isLoading ? '...' : totalLeads}
            </span>
            <span className="text-zinc-400 text-sm leading-5">Total Captured Leads</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] backdrop-blur-xl rounded-2xl border border-white/5 p-6 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="size-10 rounded-xl bg-[#7f22fe]/20 flex justify-center items-center">
              <Mail className="size-5 text-[#7f22fe]" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-3xl leading-9 tracking-tight text-white">
              {isLoading ? '...' : emailsCollected}
            </span>
            <span className="text-zinc-400 text-sm leading-5">Emails Captured</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] backdrop-blur-xl rounded-2xl border border-white/5 p-6 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="size-10 rounded-xl bg-[#7f22fe]/20 flex justify-center items-center">
              <Phone className="size-5 text-[#7f22fe]" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-3xl leading-9 tracking-tight text-white">
              {isLoading ? '...' : phonesCollected}
            </span>
            <span className="text-zinc-400 text-sm leading-5">Phone Numbers Captured</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] backdrop-blur-xl rounded-2xl border border-white/5 p-6 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="size-10 rounded-xl bg-[#7f22fe]/20 flex justify-center items-center">
              <BarChart2 className="size-5 text-[#7f22fe]" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-3xl leading-9 tracking-tight text-white">
              {isLoading ? '...' : uniqueCampaignsCount}
            </span>
            <span className="text-zinc-400 text-sm leading-5">Active Lead Campaigns</span>
          </div>
        </div>
      </div>

      {/* Main Leads Table */}
      <div className="flex flex-col gap-4">
        <h3 className="font-semibold text-lg leading-7 text-white">Leads Database</h3>
        <p className="text-zinc-400 text-sm leading-5 -mt-2">
          Browse, filter, and export the contact information gathered from comments and web landing forms.
        </p>
        <LeadsTable leads={leads} isLoading={isLoading} />
      </div>
    </div>
  );
};
