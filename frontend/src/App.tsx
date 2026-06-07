import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BarChart3,
  Bell,
  ChevronRight,
  ChevronsUpDown,
  DollarSign,
  Eye,
  Filter,
  Gift,
  LayoutDashboard,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  MousePointerClick,
  Play,
  Plus,
  Search,
  Send,
  Settings,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';

const queryClient = new QueryClient();

function DashboardShell() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'campaigns' | 'automations' | 'messages' | 'settings'>('dashboard');

  return (
    <div className="bg-bg-base text-text-primary min-h-screen w-full flex overflow-x-hidden font-sans">
      {/* Left Navigation Sidebar */}
      <aside className="shrink-0 bg-bg-surface border-r border-border-default flex p-6 flex-col gap-8 w-72">
        <div className="flex px-2 items-center gap-2.5">
          <div className="size-9 shadow-[0_0_24px_oklch(0.541_0.281_293.01/_0.6)] rounded-xl bg-accent-primary flex justify-center items-center">
            <Send className="size-5 text-text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base leading-6 tracking-tight text-text-primary">
              Gramflow
            </span>
            <span className="text-text-muted text-xs leading-4">
              Marketing Suite
            </span>
          </div>
        </div>

        <nav className="flex flex-col justify-start items-stretch gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`font-medium rounded-lg text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors text-left ${
              activeTab === 'dashboard'
                ? 'bg-bg-surface-elevated text-text-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-elevated-hover'
            }`}
          >
            <LayoutDashboard className={`size-4 ${activeTab === 'dashboard' ? 'text-accent-primary' : ''}`} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`font-medium rounded-lg text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors text-left ${
              activeTab === 'analytics'
                ? 'bg-bg-surface-elevated text-text-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-elevated-hover'
            }`}
          >
            <BarChart3 className={`size-4 ${activeTab === 'analytics' ? 'text-accent-primary' : ''}`} />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`font-medium rounded-lg text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors text-left ${
              activeTab === 'campaigns'
                ? 'bg-bg-surface-elevated text-text-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-elevated-hover'
            }`}
          >
            <Zap className={`size-4 ${activeTab === 'campaigns' ? 'text-accent-primary' : ''}`} />
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('automations')}
            className={`font-medium rounded-lg text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors text-left ${
              activeTab === 'automations'
                ? 'bg-bg-surface-elevated text-text-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-elevated-hover'
            }`}
          >
            <Workflow className={`size-4 ${activeTab === 'automations' ? 'text-accent-primary' : ''}`} />
            Automations
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`font-medium rounded-lg text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors text-left ${
              activeTab === 'messages'
                ? 'bg-bg-surface-elevated text-text-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-elevated-hover'
            }`}
          >
            <MessageCircle className={`size-4 ${activeTab === 'messages' ? 'text-accent-primary' : ''}`} />
            Messages
            <span className="size-5 font-semibold rounded-full bg-accent-primary text-text-primary text-[10px] flex ml-auto justify-center items-center shadow-[0_0_8px_var(--accent-primary)]">
              9
            </span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`font-medium rounded-lg text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors text-left ${
              activeTab === 'settings'
                ? 'bg-bg-surface-elevated text-text-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-elevated-hover'
            }`}
          >
            <Settings className={`size-4 ${activeTab === 'settings' ? 'text-accent-primary' : ''}`} />
            Settings
          </button>
        </nav>

        {/* Pro Plan Box */}
        <div className="bg-[linear-gradient(145deg,oklch(0.541_0.281_293.01/_0.15),transparent)] rounded-2xl border border-accent-primary/20 flex mt-auto p-4 flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent-primary" />
            <span className="font-semibold text-sm leading-5 text-text-primary">
              Pro Plan
            </span>
          </div>
          <p className="text-text-muted text-xs leading-4">
            Unlock unlimited automations and advanced analytics.
          </p>
          <button className="w-full py-2 rounded-lg bg-accent-primary hover:bg-accent-primary-hover text-text-primary font-medium text-xs transition-colors shadow-lg shadow-accent-primary/20">
            Upgrade Now
          </button>
        </div>

        {/* User Card */}
        <div className="rounded-xl border border-border-default flex p-2 items-center gap-3">
          <img
            alt="User avatar"
            className="size-9 object-cover rounded-full border border-border-default"
            src="https://images.unsplash.com/photo-1650381473833-3e2c74a40fbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=150"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-sm leading-5 text-text-primary truncate">Mara Lin</span>
            <span className="text-text-muted text-xs leading-4 truncate">
              @maralin.studio
            </span>
          </div>
          <ChevronsUpDown className="size-4 text-text-muted ml-auto shrink-0" />
        </div>
      </aside>

      {/* Main Workspace Content */}
      <main className="flex p-8 flex-col flex-1 gap-8 min-w-0 overflow-y-auto max-h-screen">
        {/* Dynamic Header */}
        <header className="flex justify-between items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-semibold text-2xl leading-8 tracking-tight text-text-primary">
              {activeTab === 'dashboard' && 'Welcome back, Mara'}
              {activeTab === 'analytics' && 'Analytics Overview'}
              {activeTab === 'campaigns' && 'Campaign Manager'}
              {activeTab === 'automations' && 'Automations List'}
              {activeTab === 'messages' && 'Message Center'}
              {activeTab === 'settings' && 'System Settings'}
            </h1>
            <p className="text-text-muted text-sm leading-5">
              {activeTab === 'dashboard' && "Here's how your Instagram automations are performing today."}
              {activeTab === 'analytics' && 'Detailed system reports and interaction analysis.'}
              {activeTab === 'campaigns' && 'Create, launch, and optimize active campaign triggers.'}
              {activeTab === 'automations' && 'Manage your comment-to-DM workflows and filters.'}
              {activeTab === 'messages' && 'View sent DMs, lead captures, and response queues.'}
              {activeTab === 'settings' && 'Manage credentials, developer configurations, and quotas.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-lg bg-bg-surface border border-border-default flex px-3 py-2 items-center gap-2 focus-within:border-accent-primary/40 transition-colors">
              <Search className="size-4 text-text-muted" />
              <input
                className="bg-transparent outline-none text-sm leading-5 w-44 text-text-primary placeholder:text-text-disabled"
                placeholder="Search..."
              />
            </div>
            <button className="size-10 rounded-lg bg-bg-surface border border-border-default p-0 flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-hover transition-all">
              <Bell className="size-4" />
            </button>
            <button className="rounded-lg bg-accent-primary hover:bg-accent-primary-hover text-text-primary px-4 py-2 text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-accent-primary/20">
              <Plus className="size-4" />
              New Automation
            </button>
          </div>
        </header>

        {/* Dynamic Tab Render */}
        {activeTab === 'dashboard' ? (
          <div className="flex flex-col gap-8">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: DMs Sent */}
              <div className="bg-[linear-gradient(160deg,var(--bg-surface-elevated),rgba(26,26,30,0.6))] backdrop-blur-xl rounded-2xl border border-border-default p-6 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="size-10 rounded-xl bg-accent-primary/20 flex justify-center items-center">
                    <MessageCircle className="size-5 text-accent-primary" />
                  </div>
                  <span className="text-accent-secondary font-medium text-xs leading-4 flex items-center gap-1">
                    <TrendingUp className="size-3" />
                    +18.2%
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-3xl leading-9 tracking-tight text-text-primary">
                    48,259
                  </span>
                  <span className="text-text-muted text-sm leading-5">
                    DMs Sent
                  </span>
                </div>
              </div>

              {/* Card 2: New Leads */}
              <div className="bg-[linear-gradient(160deg,var(--bg-surface-elevated),rgba(26,26,30,0.6))] backdrop-blur-xl rounded-2xl border border-border-default p-6 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="size-10 rounded-xl bg-accent-primary/20 flex justify-center items-center">
                    <Users className="size-5 text-accent-primary" />
                  </div>
                  <span className="text-accent-secondary font-medium text-xs leading-4 flex items-center gap-1">
                    <TrendingUp className="size-3" />
                    +9.4%
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-3xl leading-9 tracking-tight text-text-primary">
                    12,847
                  </span>
                  <span className="text-text-muted text-sm leading-5">
                    New Leads
                  </span>
                </div>
              </div>

              {/* Card 3: Engagement Rate */}
              <div className="bg-[linear-gradient(160deg,var(--bg-surface-elevated),rgba(26,26,30,0.6))] backdrop-blur-xl rounded-2xl border border-border-default p-6 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="size-10 rounded-xl bg-accent-primary/20 flex justify-center items-center">
                    <MousePointerClick className="size-5 text-accent-primary" />
                  </div>
                  <span className="text-accent-secondary font-medium text-xs leading-4 flex items-center gap-1">
                    <TrendingUp className="size-3" />
                    +24.1%
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-3xl leading-9 tracking-tight text-text-primary">
                    68.5%
                  </span>
                  <span className="text-text-muted text-sm leading-5">
                    Engagement Rate
                  </span>
                </div>
              </div>

              {/* Card 4: Revenue Driven */}
              <div className="bg-[linear-gradient(160deg,var(--bg-surface-elevated),rgba(26,26,30,0.6))] backdrop-blur-xl rounded-2xl border border-border-default p-6 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="size-10 rounded-xl bg-accent-primary/20 flex justify-center items-center">
                    <DollarSign className="size-5 text-accent-primary" />
                  </div>
                  <span className="font-medium text-state-error text-xs leading-4 flex items-center gap-1">
                    <TrendingDown className="size-3" />
                    -2.3%
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-3xl leading-9 tracking-tight text-text-primary">
                    $32,910
                  </span>
                  <span className="text-text-muted text-sm leading-5">
                    Revenue Driven
                  </span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Conversion Area Chart */}
              <div className="lg:col-span-2 rounded-2xl bg-bg-surface border border-border-default p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold text-base leading-6 text-text-primary">
                      Conversions Overview
                    </h3>
                    <p className="text-text-muted text-sm leading-5">
                      DMs sent vs. leads converted
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-text-muted text-xs leading-4 flex items-center gap-2">
                      <span className="size-2 bg-accent-primary rounded-full shadow-[0_0_8px_var(--accent-primary)]" />
                      DMs
                    </span>
                    <span className="text-text-muted text-xs leading-4 flex items-center gap-2">
                      <span className="size-2 bg-accent-secondary rounded-full shadow-[0_0_8px_var(--accent-secondary)]" />
                      Leads
                    </span>
                  </div>
                </div>

                {/* SVG Area Chart */}
                <div className="w-full h-64 bg-bg-base/30 rounded-xl p-2 border border-border-default flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 600 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="dms-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity="0.3"/>
                        <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity="0"/>
                      </linearGradient>
                      <linearGradient id="leads-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-secondary)" stopOpacity="0.25"/>
                        <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    {/* Grid Lines */}
                    <line x1="40" y1="40" x2="560" y2="40" stroke="var(--border-default)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="40" y1="90" x2="560" y2="90" stroke="var(--border-default)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="40" y1="140" x2="560" y2="140" stroke="var(--border-default)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="40" y1="190" x2="560" y2="190" stroke="var(--border-default)" strokeWidth="1" />

                    {/* DMs curve: Mon (110), Tue (87), Wed (95), Thu (60), Fri (37), Sat (55), Sun (10) */}
                    <path d="M 50 110 C 90 95, 90 87, 130 87 C 170 87, 170 95, 210 95 C 250 95, 250 60, 290 60 C 330 60, 330 37, 370 37 C 410 37, 410 55, 450 55 C 490 55, 490 10, 530 10" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" />
                    <path d="M 50 110 C 90 95, 90 87, 130 87 C 170 87, 170 95, 210 95 C 250 95, 250 60, 290 60 C 330 60, 330 37, 370 37 C 410 37, 410 55, 450 55 C 490 55, 490 10, 530 10 L 530 190 L 50 190 Z" fill="url(#dms-grad)" />

                    {/* Leads curve: Mon (162), Tue (152), Wed (157), Thu (137), Fri (125), Sat (132), Sun (112) */}
                    <path d="M 50 162 C 90 157, 90 152, 130 152 C 170 152, 170 157, 210 157 C 250 157, 250 137, 290 137 C 330 137, 330 125, 370 125 C 410 125, 410 132, 450 132 C 490 132, 490 112, 530 112" fill="none" stroke="var(--accent-secondary)" strokeWidth="2.5" />
                    <path d="M 50 162 C 90 157, 90 152, 130 152 C 170 152, 170 157, 210 157 C 250 157, 250 137, 290 137 C 330 137, 330 125, 370 125 C 410 125, 410 132, 450 132 C 490 132, 490 112, 530 112 L 530 190 L 50 190 Z" fill="url(#leads-grad)" />

                    {/* Chart Labels */}
                    <text x="50" y="212" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Mon</text>
                    <text x="130" y="212" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Tue</text>
                    <text x="210" y="212" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Wed</text>
                    <text x="290" y="212" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Thu</text>
                    <text x="370" y="212" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Fri</text>
                    <text x="450" y="212" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Sat</text>
                    <text x="530" y="212" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Sun</text>
                  </svg>
                </div>
              </div>

              {/* Right Column: Lead Sources Donut Chart */}
              <div className="rounded-2xl bg-bg-surface border border-border-default p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-base leading-6 text-text-primary">
                    Lead Sources
                  </h3>
                  <p className="text-text-muted text-sm leading-5">
                    By trigger type
                  </p>
                </div>

                <div className="flex flex-col items-center gap-6 justify-center flex-1">
                  {/* SVG Pie/Donut Chart */}
                  <div className="relative flex items-center justify-center size-40">
                    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Comments (48%) - Accent Primary */}
                      <circle cx="50" cy="50" r="35" stroke="var(--accent-primary)" strokeWidth="8" strokeDasharray="105.6 220" strokeDashoffset="0" transform="rotate(-90 50 50)" strokeLinecap="round" />
                      {/* Stories (32%) - Orchid AI */}
                      <circle cx="50" cy="50" r="35" stroke="var(--accent-ai)" strokeWidth="8" strokeDasharray="70.4 220" strokeDashoffset="-105.6" transform="rotate(-90 50 50)" strokeLinecap="round" />
                      {/* Posts (20%) - Accent Secondary */}
                      <circle cx="50" cy="50" r="35" stroke="var(--accent-secondary)" strokeWidth="8" strokeDasharray="44 220" strokeDashoffset="-176" transform="rotate(-90 50 50)" strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="font-bold text-xl leading-6 text-text-primary">12,847</span>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider">Leads</span>
                    </div>
                  </div>

                  {/* Legends */}
                  <div className="flex flex-col gap-2.5 w-full">
                    <div className="text-sm leading-5 flex justify-between items-center">
                      <span className="text-text-muted flex items-center gap-2">
                        <span className="size-2 bg-accent-primary rounded-full shadow-[0_0_8px_var(--accent-primary)]" />
                        Comments
                      </span>
                      <span className="font-medium text-text-primary">48%</span>
                    </div>
                    <div className="text-sm leading-5 flex justify-between items-center">
                      <span className="text-text-muted flex items-center gap-2">
                        <span className="size-2 bg-accent-ai rounded-full shadow-[0_0_8px_var(--accent-ai)]" />
                        Stories
                      </span>
                      <span className="font-medium text-text-primary">32%</span>
                    </div>
                    <div className="text-sm leading-5 flex justify-between items-center">
                      <span className="text-text-muted flex items-center gap-2">
                        <span className="size-2 bg-accent-secondary rounded-full shadow-[0_0_8px_var(--accent-secondary)]" />
                        Posts
                      </span>
                      <span className="font-medium text-text-primary">20%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Visual Flow Builder & Top Automations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Campaign Visual Flow Builder */}
              <div className="lg:col-span-2 rounded-2xl bg-bg-surface border border-border-default p-6 flex flex-col gap-5">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold text-base leading-6 flex items-center gap-2 text-text-primary">
                      <Workflow className="size-4 text-accent-primary" />
                      Comment-to-DM Flow Builder
                    </h3>
                    <p className="text-text-muted text-sm leading-5">
                      Visual trigger automation
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="bg-transparent hover:bg-bg-surface-elevated-hover rounded-lg text-xs leading-4 border border-border-default flex items-center gap-1.5 px-3 py-1.5 text-text-secondary transition-colors">
                      <Eye className="size-3.5" />
                      Preview
                    </button>
                    <button className="rounded-lg bg-accent-primary hover:bg-accent-primary-hover text-text-primary text-xs leading-4 flex items-center gap-1.5 px-3 py-1.5 transition-colors shadow-md shadow-accent-primary/20">
                      <Play className="size-3.5" />
                      Activate
                    </button>
                  </div>
                </div>

                {/* dot-grid radial backdrop */}
                <div className="relative bg-[radial-gradient(circle_at_center,var(--border-default)_1px,transparent_1px)] bg-[size:16px_16px] border border-border-default rounded-xl p-8 flex flex-col md:flex-row justify-between items-center gap-6 overflow-hidden min-h-[160px] bg-bg-base/40">
                  {/* Trigger Node */}
                  <div className="shadow-[0_0_20px_oklch(0.541_0.281_293.01/_0.15)] rounded-xl bg-bg-surface-elevated border border-accent-primary/40 flex p-4 flex-col gap-2 w-44 shrink-0 transition-transform hover:scale-[1.02]">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="size-4 text-accent-primary" />
                      <span className="font-semibold text-xs leading-4 text-text-primary">
                        Trigger
                      </span>
                    </div>
                    <span className="text-text-muted text-[11px]">
                      User comments "PRICE" on post
                    </span>
                  </div>

                  {/* Gradient Connector Line 1 */}
                  <div className="flex justify-center items-center flex-1 w-full md:w-auto">
                    <div className="bg-[linear-gradient(90deg,var(--accent-primary),var(--accent-ai))] h-0.5 w-full md:flex-1" />
                    <ChevronRight className="size-4 text-accent-primary shrink-0 rotate-90 md:rotate-0" />
                  </div>

                  {/* Condition Node */}
                  <div className="rounded-xl bg-bg-surface-elevated border border-border-default flex p-4 flex-col gap-2 w-44 shrink-0 transition-transform hover:scale-[1.02]">
                    <div className="flex items-center gap-2">
                      <Filter className="size-4 text-accent-ai" />
                      <span className="font-semibold text-xs leading-4 text-text-primary">
                        Condition
                      </span>
                    </div>
                    <span className="text-text-muted text-[11px]">
                      If new follower → branch
                    </span>
                  </div>

                  {/* Gradient Connector Line 2 */}
                  <div className="flex justify-center items-center flex-1 w-full md:w-auto">
                    <div className="bg-[linear-gradient(90deg,var(--accent-ai),var(--accent-secondary))] h-0.5 w-full md:flex-1" />
                    <ChevronRight className="size-4 text-accent-secondary shrink-0 rotate-90 md:rotate-0" />
                  </div>

                  {/* Action Node */}
                  <div className="border-accent-secondary/40 shadow-[0_0_20px_oklch(0.696_0.17_162.48/_0.12)] rounded-xl bg-bg-surface-elevated border flex p-4 flex-col gap-2 w-44 shrink-0 transition-transform hover:scale-[1.02]">
                    <div className="flex items-center gap-2">
                      <Send className="size-4 text-accent-secondary" />
                      <span className="font-semibold text-xs leading-4 text-text-primary">
                        Action
                      </span>
                    </div>
                    <span className="text-text-muted text-[11px]">
                      Send DM with link + offer
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Automations list */}
              <div className="rounded-2xl bg-bg-surface border border-border-default p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center gap-2">
                  <h3 className="font-semibold text-base leading-6 text-text-primary">
                    Top Automations
                  </h3>
                  <MoreHorizontal className="size-4 text-text-muted hover:text-text-primary cursor-pointer transition-colors" />
                </div>

                <div className="flex flex-col gap-3 flex-1 justify-start">
                  <div className="rounded-xl border border-border-default flex p-3 items-center gap-3 hover:border-border-hover hover:bg-bg-surface-elevated/40 transition-all">
                    <div className="size-9 rounded-lg bg-accent-primary/20 flex justify-center items-center shrink-0">
                      <Zap className="size-4 text-accent-primary" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium text-sm leading-5 text-text-primary truncate">
                        Launch Giveaway
                      </span>
                      <span className="text-text-muted text-xs leading-4 truncate">
                        2,418 triggers
                      </span>
                    </div>
                    <span className="text-accent-secondary font-semibold text-xs leading-4 shrink-0">
                      Active
                    </span>
                  </div>

                  <div className="rounded-xl border border-border-default flex p-3 items-center gap-3 hover:border-border-hover hover:bg-bg-surface-elevated/40 transition-all">
                    <div className="size-9 rounded-lg bg-accent-primary/20 flex justify-center items-center shrink-0">
                      <ShoppingBag className="size-4 text-accent-primary" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium text-sm leading-5 text-text-primary truncate">
                        Product Drop
                      </span>
                      <span className="text-text-muted text-xs leading-4 truncate">
                        1,902 triggers
                      </span>
                    </div>
                    <span className="text-accent-secondary font-semibold text-xs leading-4 shrink-0">
                      Active
                    </span>
                  </div>

                  <div className="rounded-xl border border-border-default flex p-3 items-center gap-3 hover:border-border-hover hover:bg-bg-surface-elevated/40 transition-all">
                    <div className="size-9 rounded-lg bg-bg-surface-elevated border border-border-default flex justify-center items-center shrink-0">
                      <Gift className="size-4 text-text-muted" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium text-sm leading-5 text-text-primary truncate">
                        Welcome Series
                      </span>
                      <span className="text-text-muted text-xs leading-4 truncate">
                        1,140 triggers
                      </span>
                    </div>
                    <span className="font-semibold text-text-muted text-xs leading-4 shrink-0">
                      Paused
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Placeholder Layout for other tabs */
          <div className="flex-1 border border-border-default bg-bg-surface/50 rounded-2xl flex flex-col justify-center items-center p-12 text-center border-dashed min-h-[400px]">
            <div className="size-16 rounded-2xl bg-bg-surface-elevated border border-border-default flex items-center justify-center text-accent-primary mb-4 shadow-xl">
              {activeTab === 'analytics' && <BarChart3 className="size-8" />}
              {activeTab === 'campaigns' && <Zap className="size-8" />}
              {activeTab === 'automations' && <Workflow className="size-8" />}
              {activeTab === 'messages' && <MessageCircle className="size-8" />}
              {activeTab === 'settings' && <Settings className="size-8" />}
            </div>
            <h2 className="font-semibold text-lg leading-6 text-text-primary mb-2 capitalize">
              {activeTab} Workspace
            </h2>
            <p className="text-text-muted text-sm leading-5 max-w-sm">
              This space will display operations, records, and configs corresponding to Unit {
                activeTab === 'analytics' && '26'
              }{
                activeTab === 'campaigns' && '12 (Automations Builder)'
              }{
                activeTab === 'automations' && '12 (Automations CRUD)'
              }{
                activeTab === 'messages' && '22 (Leads & Public Forms)'
              }{
                activeTab === 'settings' && '09 (Accounts Dashboard / Pricing)'
              } of the Gramflow Master Build Plan.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardShell />
    </QueryClientProvider>
  );
}
