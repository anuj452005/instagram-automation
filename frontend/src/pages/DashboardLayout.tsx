import React from 'react';
import { useAuth, useUser, UserButton } from '@clerk/clerk-react';
import { Navigate, Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import {
  BarChart3,
  Bell,
  LayoutDashboard,
  MessageCircle,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react';
import { Instagram } from '../components/icons';

export interface UserProfile {
  id: string;
  clerkUserId: string;
  name: string;
  email: string;
  subscriptionTier: 'free' | 'pro';
  subscriptionStatus: string;
}

export const DashboardLayout: React.FC = () => {
  const { isLoaded: isAuthLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const location = useLocation();

  // 1. Fetch & sync user with backend DB on component mount
  const { data: dbUser, isLoading: isDbSyncLoading, error: syncError } = useQuery<UserProfile>({
    queryKey: ['me'],
    queryFn: async () => {
      const token = await getToken();
      const response = await api.get('/api/auth/me', {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      return response.data;
    },
    enabled: !!isSignedIn,
    retry: 1,
  });

  // Handle loading state for authentication
  if (!isAuthLoaded) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center gap-4 font-sans text-[#fafafa]">
        <div className="size-10 rounded-xl bg-[#7f22fe]/20 border border-[#7f22fe]/40 animate-pulse flex items-center justify-center">
          <Send className="size-5 text-[#7f22fe] animate-bounce" />
        </div>
        <span className="text-zinc-400 text-sm animate-pulse">Initializing security context...</span>
      </div>
    );
  }

  // Route Guard: Redirect unauthenticated users
  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  // Handle loading state for PostgreSQL database synchronization
  if (isDbSyncLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center gap-4 font-sans text-[#fafafa]">
        <div className="size-12 rounded-xl bg-[#7f22fe] shadow-[0_0_30px_oklch(0.541_0.281_293.01/_0.6)] flex justify-center items-center animate-pulse">
          <Send className="size-6 text-white" />
        </div>
        <span className="text-zinc-200 font-medium text-sm">Syncing user profile with database...</span>
        <span className="text-zinc-500 text-xs">This ensures your workspace settings are prepared.</span>
      </div>
    );
  }

  // Handle db sync error
  if (syncError) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center p-6 text-center font-sans text-[#fafafa]">
        <div className="max-w-md bg-[#121214] border border-red-500/20 p-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl">
          <div className="size-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
            ⚠️
          </div>
          <h2 className="font-semibold text-lg text-white">Synchronization Failed</h2>
          <p className="text-zinc-400 text-sm">
            We authenticated your account successfully with Clerk, but failed to synchronize your profile metadata with our database services.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-[#7f22fe] hover:bg-[#9647ff] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-[#7f22fe]/20"
          >
            Retry Synchronization
          </button>
        </div>
      </div>
    );
  }

  // Determine dynamic headers based on the current path
  const currentPath = location.pathname;
  let pageTitle = 'Welcome back';
  let pageDesc = "Here's how your Instagram automations are performing today.";

  if (dbUser?.name) {
    pageTitle = `Welcome back, ${dbUser.name.split(' ')[0]}`;
  } else if (user?.firstName) {
    pageTitle = `Welcome back, ${user.firstName}`;
  }

  if (currentPath.endsWith('/analytics')) {
    pageTitle = 'Analytics Overview';
    pageDesc = 'Detailed system reports and interaction analysis.';
  } else if (currentPath.endsWith('/campaigns')) {
    pageTitle = 'Campaign Manager';
    pageDesc = 'Create, launch, and optimize active campaign triggers.';
  } else if (currentPath.endsWith('/automations')) {
    pageTitle = 'Automations List';
    pageDesc = 'Manage your comment-to-DM workflows and filters.';
  } else if (currentPath.endsWith('/messages')) {
    pageTitle = 'Message Center';
    pageDesc = 'View sent DMs, lead captures, and response queues.';
  } else if (currentPath.endsWith('/settings')) {
    pageTitle = 'System Settings';
    pageDesc = 'Manage credentials, developer configurations, and quotas.';
  } else if (currentPath.endsWith('/accounts')) {
    pageTitle = 'Instagram Accounts';
    pageDesc = 'Link and manage connected Instagram Creator or Business profiles.';
  }

  return (
    <div className="bg-[#09090b] text-[#fafafa] min-h-screen w-full flex overflow-x-hidden font-sans">
      {/* Left Navigation Sidebar */}
      <aside className="shrink-0 bg-[#121214] border-r border-white/5 flex p-6 flex-col gap-8 w-72">
        <div className="flex px-2 items-center gap-2.5">
          <div className="size-9 shadow-[0_0_24px_oklch(0.541_0.281_293.01/_0.6)] rounded-xl bg-[#7f22fe] flex justify-center items-center">
            <Send className="size-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base leading-6 tracking-tight text-white">
              Gramflow
            </span>
            <span className="text-zinc-500 text-xs leading-4">
              Marketing Suite
            </span>
          </div>
        </div>

        <nav className="flex flex-col justify-start items-stretch gap-1">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `font-medium rounded-lg text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors text-left ${
                isActive
                  ? 'bg-[#1a1a1e] text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1e]/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <LayoutDashboard className={`size-4 ${isActive ? 'text-[#7f22fe]' : ''}`} />
                Dashboard
              </>
            )}
          </NavLink>
          <NavLink
            to="/dashboard/analytics"
            className={({ isActive }) =>
              `font-medium rounded-lg text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors text-left ${
                isActive
                  ? 'bg-[#1a1a1e] text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1e]/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <BarChart3 className={`size-4 ${isActive ? 'text-[#7f22fe]' : ''}`} />
                Analytics
              </>
            )}
          </NavLink>
          <NavLink
            to="/dashboard/campaigns"
            className={({ isActive }) =>
              `font-medium rounded-lg text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors text-left ${
                isActive
                  ? 'bg-[#1a1a1e] text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1e]/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Zap className={`size-4 ${isActive ? 'text-[#7f22fe]' : ''}`} />
                Campaigns
              </>
            )}
          </NavLink>
          <NavLink
            to="/dashboard/automations"
            className={({ isActive }) =>
              `font-medium rounded-lg text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors text-left ${
                isActive
                  ? 'bg-[#1a1a1e] text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1e]/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Workflow className={`size-4 ${isActive ? 'text-[#7f22fe]' : ''}`} />
                Automations
              </>
            )}
          </NavLink>
          <NavLink
            to="/dashboard/messages"
            className={({ isActive }) =>
              `font-medium rounded-lg text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors text-left ${
                isActive
                  ? 'bg-[#1a1a1e] text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1e]/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <MessageCircle className={`size-4 ${isActive ? 'text-[#7f22fe]' : ''}`} />
                Messages
                <span className="size-5 font-semibold rounded-full bg-[#7f22fe] text-white text-[10px] flex ml-auto justify-center items-center shadow-[0_0_8px_rgba(127,34,254,0.5)]">
                  9
                </span>
              </>
            )}
          </NavLink>
          <NavLink
            to="/dashboard/accounts"
            className={({ isActive }) =>
              `font-medium rounded-lg text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors text-left ${
                isActive
                  ? 'bg-[#1a1a1e] text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1e]/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Instagram className={`size-4 ${isActive ? 'text-[#7f22fe]' : ''}`} />
                Instagram Accounts
              </>
            )}
          </NavLink>
          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) =>
              `font-medium rounded-lg text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors text-left ${
                isActive
                  ? 'bg-[#1a1a1e] text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1e]/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Settings className={`size-4 ${isActive ? 'text-[#7f22fe]' : ''}`} />
                Settings
              </>
            )}
          </NavLink>
        </nav>

        {/* Pro Plan Box */}
        <div className="bg-[linear-gradient(145deg,rgba(127,34,254,0.15),transparent)] rounded-2xl border border-[#7f22fe]/20 flex mt-auto p-4 flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#7f22fe]" />
            <span className="font-semibold text-sm leading-5 text-white">
              Pro Plan
            </span>
          </div>
          <p className="text-zinc-400 text-xs leading-4">
            Unlock unlimited automations and advanced analytics.
          </p>
          <button className="w-full py-2 rounded-lg bg-[#7f22fe] hover:bg-[#9647ff] text-white font-medium text-xs transition-colors shadow-lg shadow-[#7f22fe]/20">
            Upgrade Now
          </button>
        </div>

        {/* User Card */}
        <div className="rounded-xl border border-white/5 flex p-2 items-center gap-3 bg-[#1a1a1e]/20">
          <UserButton
            fallback={
              <img
                alt="User avatar"
                className="size-9 object-cover rounded-full border border-white/5"
                src={user?.imageUrl || "https://images.unsplash.com/photo-1650381473833-3e2c74a40fbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=150"}
              />
            }
            appearance={{
              elements: {
                avatarBox: 'size-9 border border-white/5 rounded-full overflow-hidden',
              }
            }}
          />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-medium text-sm leading-5 text-white truncate">
              {dbUser?.name || user?.fullName || 'User'}
            </span>
            <span className="text-zinc-400 text-xs leading-4 truncate">
              {dbUser?.email || user?.primaryEmailAddress?.emailAddress || 'User Email'}
            </span>
          </div>
          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#7f22fe]/20 text-[#7f22fe] shrink-0 border border-[#7f22fe]/10">
            {dbUser?.subscriptionTier || 'Free'}
          </span>
        </div>
      </aside>

      {/* Main Workspace Content */}
      <main className="flex p-8 flex-col flex-1 gap-8 min-w-0 overflow-y-auto max-h-screen">
        {/* Dynamic Header */}
        <header className="flex justify-between items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-semibold text-2xl leading-8 tracking-tight text-white">
              {pageTitle}
            </h1>
            <p className="text-zinc-400 text-sm leading-5">
              {pageDesc}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-lg bg-[#121214] border border-white/5 flex px-3 py-2 items-center gap-2 focus-within:border-[#7f22fe]/40 transition-colors">
              <Search className="size-4 text-zinc-400" />
              <input
                className="bg-transparent outline-none text-sm leading-5 w-44 text-white placeholder:text-zinc-600"
                placeholder="Search..."
              />
            </div>
            <button className="size-10 rounded-lg bg-[#121214] border border-white/5 p-0 flex items-center justify-center text-zinc-300 hover:text-white hover:border-white/10 transition-all">
              <Bell className="size-4" />
            </button>
            <Link to="/dashboard/automations/new" className="rounded-lg bg-[#7f22fe] hover:bg-[#9647ff] text-white px-4 py-2 text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-[#7f22fe]/20">
              <Plus className="size-4" />
              New Automation
            </Link>
          </div>
        </header>

        {/* Nested Routing Render */}
        <Outlet />
      </main>
    </div>
  );
};
