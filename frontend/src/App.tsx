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
import { LeadsPage } from './pages/LeadsPage';
import { PublicLeadPage } from './pages/PublicLeadPage';
import { DashboardHomePage } from './pages/DashboardHomePage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
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

// Removed static mockup DashboardHome

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routing */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/l/:token" element={<PublicLeadPage />} />
            
            {/* Admin Routing */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            
            {/* Protected Workspace Layout */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHomePage />} />
              <Route path="analytics" element={<DashboardHomePage />} />
              <Route path="campaigns" element={<AutomationsListPage />} />
              <Route path="automations" element={<AutomationsListPage />} />
              <Route path="automations/new" element={<AutomationBuilderPage />} />
              <Route path="automations/:id" element={<AutomationBuilderPage />} />
              <Route path="leads" element={<LeadsPage />} />
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
