import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { CLERK_PUBLISHABLE_KEY } from './lib/clerk';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { DashboardLayout } from './pages/DashboardLayout';
import { AccountsPage } from './pages/AccountsPage';
import { AutomationsListPage } from './pages/AutomationsListPage';
import { AutomationBuilderPage } from './pages/AutomationBuilderPage';
import {
  BarChart3,
  ChevronRight,
  DollarSign,
  Eye,
  Filter,
  Gift,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  MousePointerClick,
  Play,
  Send,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import React from 'react';

const queryClient = new QueryClient();

// Reusable workspace placeholder for tabs under construction
function WorkspacePlaceholder({ name, unit, icon: Icon }: { name: string; unit: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex-1 border border-white/5 bg-[#121214]/50 rounded-2xl flex flex-col justify-center items-center p-12 text-center border-dashed min-h-[400px]">
      <div className="size-16 rounded-2xl bg-[#1a1a1e] border border-white/5 flex items-center justify-center text-[#7f22fe] mb-4 shadow-xl">
        <Icon className="size-8" />
      </div>
      <h2 className="font-semibold text-lg leading-6 text-white mb-2 capitalize">
        {name} Workspace
      </h2>
      <p className="text-zinc-400 text-sm leading-5 max-w-sm">
        This space will display operations, records, and configs corresponding to Unit {unit} of the Gramflow Master Build Plan.
      </p>
    </div>
  );
}

function AnalyticsPage() {
  return <WorkspacePlaceholder name="analytics" unit="26" icon={BarChart3} />;
}

function MessagesPage() {
  return <WorkspacePlaceholder name="messages" unit="22 (Leads & Public Forms)" icon={MessageCircle} />;
}

function SettingsPage() {
  return <WorkspacePlaceholder name="settings" unit="09 (Accounts Dashboard / Pricing)" icon={SettingsPageIcon} />;
}

// Custom icon since standard Settings is in layout
function SettingsPageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function DashboardHome() {
  return (
    <div className="flex flex-col gap-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: DMs Sent */}
        <div className="bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] backdrop-blur-xl rounded-2xl border border-white/5 p-6 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="size-10 rounded-xl bg-[#7f22fe]/20 flex justify-center items-center">
              <MessageCircle className="size-5 text-[#7f22fe]" />
            </div>
            <span className="text-[#14b8a6] font-medium text-xs leading-4 flex items-center gap-1">
              <TrendingUp className="size-3" />
              +18.2%
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-3xl leading-9 tracking-tight text-white">
              48,259
            </span>
            <span className="text-zinc-400 text-sm leading-5">
              DMs Sent
            </span>
          </div>
        </div>

        {/* Card 2: New Leads */}
        <div className="bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] backdrop-blur-xl rounded-2xl border border-white/5 p-6 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="size-10 rounded-xl bg-[#7f22fe]/20 flex justify-center items-center">
              <Users className="size-5 text-[#7f22fe]" />
            </div>
            <span className="text-[#14b8a6] font-medium text-xs leading-4 flex items-center gap-1">
              <TrendingUp className="size-3" />
              +9.4%
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-3xl leading-9 tracking-tight text-white">
              12,847
            </span>
            <span className="text-zinc-400 text-sm leading-5">
              New Leads
            </span>
          </div>
        </div>

        {/* Card 3: Engagement Rate */}
        <div className="bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] backdrop-blur-xl rounded-2xl border border-white/5 p-6 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="size-10 rounded-xl bg-[#7f22fe]/20 flex justify-center items-center">
              <MousePointerClick className="size-5 text-[#7f22fe]" />
            </div>
            <span className="text-[#14b8a6] font-medium text-xs leading-4 flex items-center gap-1">
              <TrendingUp className="size-3" />
              +24.1%
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-3xl leading-9 tracking-tight text-white">
              68.5%
            </span>
            <span className="text-zinc-400 text-sm leading-5">
              Engagement Rate
            </span>
          </div>
        </div>

        {/* Card 4: Revenue Driven */}
        <div className="bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] backdrop-blur-xl rounded-2xl border border-white/5 p-6 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="size-10 rounded-xl bg-[#7f22fe]/20 flex justify-center items-center">
              <DollarSign className="size-5 text-[#7f22fe]" />
            </div>
            <span className="font-medium text-[#ff6467] text-xs leading-4 flex items-center gap-1">
              <TrendingDown className="size-3" />
              -2.3%
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-3xl leading-9 tracking-tight text-white">
              $32,910
            </span>
            <span className="text-zinc-400 text-sm leading-5">
              Revenue Driven
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Conversion Area Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-[#121214] border border-white/5 p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold text-base leading-6 text-white">
                Conversions Overview
              </h3>
              <p className="text-zinc-400 text-sm leading-5">
                DMs sent vs. leads converted
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-zinc-400 text-xs leading-4 flex items-center gap-2">
                <span className="size-2 bg-[#7f22fe] rounded-full shadow-[0_0_8px_#7f22fe]" />
                DMs
              </span>
              <span className="text-zinc-400 text-xs leading-4 flex items-center gap-2">
                <span className="size-2 bg-[#14b8a6] rounded-full shadow-[0_0_8px_#14b8a6]" />
                Leads
              </span>
            </div>
          </div>

          {/* SVG Area Chart */}
          <div className="w-full h-64 bg-[#09090b]/30 rounded-xl p-2 border border-white/5 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 600 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="dms-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7f22fe" stopOpacity="0.3" />
                  <stop offset="95%" stopColor="#7f22fe" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="leads-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity="0.25" />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="40" y1="40" x2="560" y2="40" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="40" y1="90" x2="560" y2="90" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="40" y1="140" x2="560" y2="140" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="40" y1="190" x2="560" y2="190" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

              {/* DMs curve */}
              <path d="M 50 110 C 90 95, 90 87, 130 87 C 170 87, 170 95, 210 95 C 250 95, 250 60, 290 60 C 330 60, 330 37, 370 37 C 410 37, 410 55, 450 55 C 490 55, 490 10, 530 10" fill="none" stroke="#7f22fe" strokeWidth="2.5" />
              <path d="M 50 110 C 90 95, 90 87, 130 87 C 170 87, 170 95, 210 95 C 250 95, 250 60, 290 60 C 330 60, 330 37, 370 37 C 410 37, 410 55, 450 55 C 490 55, 490 10, 530 10 L 530 190 L 50 190 Z" fill="url(#dms-grad)" />

              {/* Leads curve */}
              <path d="M 50 162 C 90 157, 90 152, 130 152 C 170 152, 170 157, 210 157 C 250 157, 250 137, 290 137 C 330 137, 330 125, 370 125 C 410 125, 410 132, 450 132 C 490 132, 490 112, 530 112" fill="none" stroke="#14b8a6" strokeWidth="2.5" />
              <path d="M 50 162 C 90 157, 90 152, 130 152 C 170 152, 170 157, 210 157 C 250 157, 250 137, 290 137 C 330 137, 330 125, 370 125 C 410 125, 410 132, 450 132 C 490 132, 490 112, 530 112 L 530 190 L 50 190 Z" fill="url(#leads-grad)" />

              {/* Chart Labels */}
              <text x="50" y="212" fill="zinc-400" fontSize="10" textAnchor="middle">Mon</text>
              <text x="130" y="212" fill="zinc-400" fontSize="10" textAnchor="middle">Tue</text>
              <text x="210" y="212" fill="zinc-400" fontSize="10" textAnchor="middle">Wed</text>
              <text x="290" y="212" fill="zinc-400" fontSize="10" textAnchor="middle">Thu</text>
              <text x="370" y="212" fill="zinc-400" fontSize="10" textAnchor="middle">Fri</text>
              <text x="450" y="212" fill="zinc-400" fontSize="10" textAnchor="middle">Sat</text>
              <text x="530" y="212" fill="zinc-400" fontSize="10" textAnchor="middle">Sun</text>
            </svg>
          </div>
        </div>

        {/* Right Column: Lead Sources Donut Chart */}
        <div className="rounded-2xl bg-[#121214] border border-white/5 p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-base leading-6 text-white">
              Lead Sources
            </h3>
            <p className="text-zinc-400 text-sm leading-5">
              By trigger type
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 justify-center flex-1">
            {/* SVG Pie/Donut Chart */}
            <div className="relative flex items-center justify-center size-40">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Comments (48%) - Electric Purple */}
                <circle cx="50" cy="50" r="35" stroke="#7f22fe" strokeWidth="8" strokeDasharray="105.6 220" strokeDashoffset="0" transform="rotate(-90 50 50)" strokeLinecap="round" />
                {/* Stories (32%) - Orchid AI */}
                <circle cx="50" cy="50" r="35" stroke="#d946ef" strokeWidth="8" strokeDasharray="70.4 220" strokeDashoffset="-105.6" transform="rotate(-90 50 50)" strokeLinecap="round" />
                {/* Posts (20%) - Neon Emerald-Teal */}
                <circle cx="50" cy="50" r="35" stroke="#14b8a6" strokeWidth="8" strokeDasharray="44 220" strokeDashoffset="-176" transform="rotate(-90 50 50)" strokeLinecap="round" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="font-bold text-xl leading-6 text-white">12,847</span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Leads</span>
              </div>
            </div>

            {/* Legends */}
            <div className="flex flex-col gap-2.5 w-full">
              <div className="text-sm leading-5 flex justify-between items-center">
                <span className="text-zinc-400 flex items-center gap-2">
                  <span className="size-2 bg-[#7f22fe] rounded-full shadow-[0_0_8px_#7f22fe]" />
                  Comments
                </span>
                <span className="font-medium text-white">48%</span>
              </div>
              <div className="text-sm leading-5 flex justify-between items-center">
                <span className="text-zinc-400 flex items-center gap-2">
                  <span className="size-2 bg-[#d946ef] rounded-full shadow-[0_0_8px_#d946ef]" />
                  Stories
                </span>
                <span className="font-medium text-white">32%</span>
              </div>
              <div className="text-sm leading-5 flex justify-between items-center">
                <span className="text-zinc-400 flex items-center gap-2">
                  <span className="size-2 bg-[#14b8a6] rounded-full shadow-[0_0_8px_#14b8a6]" />
                  Posts
                </span>
                <span className="font-medium text-white">20%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Visual Flow Builder & Top Automations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Visual Flow Builder */}
        <div className="lg:col-span-2 rounded-2xl bg-[#121214] border border-white/5 p-6 flex flex-col gap-5">
          <div className="flex justify-between items-center gap-2">
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold text-base leading-6 flex items-center gap-2 text-white">
                <Workflow className="size-4 text-[#7f22fe]" />
                Comment-to-DM Flow Builder
              </h3>
              <p className="text-zinc-400 text-sm leading-5">
                Visual trigger automation
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="bg-transparent hover:bg-[#1a1a1e] rounded-lg text-xs leading-4 border border-white/5 flex items-center gap-1.5 px-3 py-1.5 text-zinc-300 transition-colors">
                <Eye className="size-3.5" />
                Preview
              </button>
              <button className="rounded-lg bg-[#7f22fe] hover:bg-[#9647ff] text-white text-xs leading-4 flex items-center gap-1.5 px-3 py-1.5 transition-colors shadow-md shadow-[#7f22fe]/20">
                <Play className="size-3.5" />
                Activate
              </button>
            </div>
          </div>

          {/* dot-grid radial backdrop */}
          <div className="relative bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:16px_16px] border border-white/5 rounded-xl p-8 flex flex-col md:flex-row justify-between items-center gap-6 overflow-hidden min-h-[160px] bg-[#09090b]/40">
            {/* Trigger Node */}
            <div className="shadow-[0_0_20px_rgba(127,34,254,0.15)] rounded-xl bg-[#1a1a1e] border border-[#7f22fe]/40 flex p-4 flex-col gap-2 w-44 shrink-0 transition-transform hover:scale-[1.02]">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-[#7f22fe]" />
                <span className="font-semibold text-xs leading-4 text-white">
                  Trigger
                </span>
              </div>
              <span className="text-zinc-400 text-[11px]">
                User comments "PRICE" on post
              </span>
            </div>

            {/* Gradient Connector Line 1 */}
            <div className="flex justify-center items-center flex-1 w-full md:w-auto">
              <div className="bg-[linear-gradient(90deg,#7f22fe,#d946ef)] h-0.5 w-full md:flex-1" />
              <ChevronRight className="size-4 text-[#7f22fe] shrink-0 rotate-90 md:rotate-0" />
            </div>

            {/* Condition Node */}
            <div className="rounded-xl bg-[#1a1a1e] border border-white/5 flex p-4 flex-col gap-2 w-44 shrink-0 transition-transform hover:scale-[1.02]">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-[#d946ef]" />
                <span className="font-semibold text-xs leading-4 text-white">
                  Condition
                </span>
              </div>
              <span className="text-zinc-400 text-[11px]">
                If new follower → branch
              </span>
            </div>

            {/* Gradient Connector Line 2 */}
            <div className="flex justify-center items-center flex-1 w-full md:w-auto">
              <div className="bg-[linear-gradient(90deg,#d946ef,#14b8a6)] h-0.5 w-full md:flex-1" />
              <ChevronRight className="size-4 text-[#14b8a6] shrink-0 rotate-90 md:rotate-0" />
            </div>

            {/* Action Node */}
            <div className="border-[#14b8a6]/40 shadow-[0_0_20px_rgba(20,184,166,0.12)] rounded-xl bg-[#1a1a1e] border flex p-4 flex-col gap-2 w-44 shrink-0 transition-transform hover:scale-[1.02]">
              <div className="flex items-center gap-2">
                <Send className="size-4 text-[#14b8a6]" />
                <span className="font-semibold text-xs leading-4 text-white">
                  Action
                </span>
              </div>
              <span className="text-zinc-400 text-[11px]">
                Send DM with link + offer
              </span>
            </div>
          </div>
        </div>

        {/* Top Automations list */}
        <div className="rounded-2xl bg-[#121214] border border-white/5 p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center gap-2">
            <h3 className="font-semibold text-base leading-6 text-white">
              Top Automations
            </h3>
            <MoreHorizontal className="size-4 text-zinc-400 hover:text-white cursor-pointer transition-colors" />
          </div>

          <div className="flex flex-col gap-3 flex-1 justify-start">
            <div className="rounded-xl border border-white/5 flex p-3 items-center gap-3 hover:border-white/10 hover:bg-[#1a1a1e]/40 transition-all">
              <div className="size-9 rounded-lg bg-[#7f22fe]/20 flex justify-center items-center shrink-0">
                <Zap className="size-4 text-[#7f22fe]" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-medium text-sm leading-5 text-white truncate">
                  Launch Giveaway
                </span>
                <span className="text-zinc-400 text-xs leading-4 truncate">
                  2,418 triggers
                </span>
              </div>
              <span className="text-[#14b8a6] font-semibold text-xs leading-4 shrink-0">
                Active
              </span>
            </div>

            <div className="rounded-xl border border-white/5 flex p-3 items-center gap-3 hover:border-white/10 hover:bg-[#1a1a1e]/40 transition-all">
              <div className="size-9 rounded-lg bg-[#7f22fe]/20 flex justify-center items-center shrink-0">
                <ShoppingBag className="size-4 text-[#7f22fe]" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-medium text-sm leading-5 text-white truncate">
                  Product Drop
                </span>
                <span className="text-zinc-400 text-xs leading-4 truncate">
                  1,902 triggers
                </span>
              </div>
              <span className="text-[#14b8a6] font-semibold text-xs leading-4 shrink-0">
                Active
              </span>
            </div>

            <div className="rounded-xl border border-white/5 flex p-3 items-center gap-3 hover:border-white/10 hover:bg-[#1a1a1e]/40 transition-all">
              <div className="size-9 rounded-lg bg-[#1a1a1e] border border-white/5 flex justify-center items-center shrink-0">
                <Gift className="size-4 text-zinc-500" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-medium text-sm leading-5 text-white truncate">
                  Welcome Series
                </span>
                <span className="text-zinc-400 text-xs leading-4 truncate">
                  1,140 triggers
                </span>
              </div>
              <span className="font-semibold text-zinc-500 text-xs leading-4 shrink-0">
                Paused
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routing */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            
            {/* Protected Workspace Layout */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="campaigns" element={<AutomationsListPage />} />
              <Route path="automations" element={<AutomationsListPage />} />
              <Route path="automations/new" element={<AutomationBuilderPage />} />
              <Route path="automations/:id" element={<AutomationBuilderPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="accounts" element={<AccountsPage />} />
            </Route>

            {/* Default Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ClerkProvider>
    </QueryClientProvider>
  );
}
