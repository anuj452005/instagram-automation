import React, { useState, useEffect } from 'react';
import { useLinkableAccounts } from '../hooks/useLinkableAccounts';
import type { LinkableAccount } from '../hooks/useLinkableAccounts';
import { InstagramAccountCard } from '../components/InstagramAccountCard';
import { Instagram } from '../components/icons';
import {
  Plus,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const AccountsPage: React.FC = () => {
  const {
    connectedAccounts,
    isLoadingConnected,
    connectedError,
    linkableAccounts,
    isLoadingLinkable,
    linkableError,
    refetchLinkable,
    activate,
    isActivating,
    deactivate,
    isDeactivating,
  } = useLinkableAccounts();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clear toast notifications after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleOpenWizard = () => {
    setIsModalOpen(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    refetchLinkable();
  };

  const handleLinkAccount = async (account: LinkableAccount) => {
    try {
      await activate({
        instagramAccountId: account.instagramAccountId,
        fbPageId: account.fbPageId,
      });
      setSuccessMessage(`Successfully connected @${account.username}!`);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      setErrorMessage(
        axiosError.response?.data?.error?.message ||
          'Failed to link the selected Instagram account. Please try again.'
      );
    }
  };

  const handleDeactivate = async (instagramAccountId: string) => {
    try {
      await deactivate({ instagramAccountId });
      setSuccessMessage('Instagram account disconnected successfully.');
    } catch (err) {
      console.error(err);
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      setErrorMessage(
        axiosError.response?.data?.error?.message ||
          'Failed to disconnect account. Please try again.'
      );
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Toast Notification Layer */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {successMessage && (
          <div className="pointer-events-auto flex items-center gap-3 bg-[#121214]/90 border border-[#14b8a6]/30 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
            <div className="size-6 rounded-full bg-[#14b8a6]/20 flex items-center justify-center text-[#14b8a6]">
              <CheckCircle2 className="size-4" />
            </div>
            <span className="text-zinc-200 text-sm font-medium">{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="pointer-events-auto flex items-center gap-3 bg-[#121214]/90 border border-red-500/30 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
            <div className="size-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
              <AlertCircle className="size-4" />
            </div>
            <span className="text-zinc-200 text-sm font-medium">{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Title Header with Connect Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121214]/30 border border-white/5 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Instagram className="size-5 text-[#7f22fe]" />
            Instagram Accounts
          </h2>
          <p className="text-zinc-400 text-sm">
            Link and manage Instagram profiles to enable comment-to-DM automation.
          </p>
        </div>
        <button
          onClick={handleOpenWizard}
          className="shrink-0 rounded-xl bg-[#7f22fe] hover:bg-[#9647ff] text-white px-5 py-3 text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-[#7f22fe]/20"
        >
          <Plus className="size-4" />
          Link Profile
        </button>
      </div>

      {/* Main Grid View */}
      {isLoadingConnected ? (
        <div className="flex flex-col justify-center items-center gap-4 py-20">
          <Loader2 className="size-10 text-[#7f22fe] animate-spin" />
          <span className="text-zinc-400 text-sm font-medium animate-pulse">
            Fetching connected accounts...
          </span>
        </div>
      ) : connectedError ? (
        <div className="border border-red-500/10 bg-red-500/5 rounded-2xl p-8 flex flex-col items-center gap-4 text-center max-w-xl mx-auto">
          <div className="size-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <AlertCircle className="size-6" />
          </div>
          <h3 className="font-semibold text-lg text-white">Connection Error</h3>
          <p className="text-zinc-400 text-sm leading-6">
            We failed to load connected Instagram profiles from the server. Check your database or API connection and try again.
          </p>
        </div>
      ) : connectedAccounts.length === 0 ? (
        /* Empty State */
        <div className="border border-dashed border-white/5 bg-[#121214]/50 rounded-2xl p-12 text-center flex flex-col justify-center items-center gap-6 max-w-2xl mx-auto w-full my-6">
          <div className="size-16 rounded-2xl bg-[#1a1a1e] border border-white/5 flex items-center justify-center text-[#7f22fe] shadow-2xl">
            <Instagram className="size-8" />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg text-white">No Connected Instagram Accounts</h3>
            <p className="text-zinc-400 text-sm leading-6 max-w-md">
              Link your professional Instagram accounts to start driving leads and auto-responding to comment triggers.
            </p>
          </div>
          <button
            onClick={handleOpenWizard}
            className="rounded-xl bg-[#7f22fe]/10 border border-[#7f22fe]/30 hover:bg-[#7f22fe] hover:text-white text-[#7f22fe] px-6 py-3 text-sm font-semibold transition-all duration-300"
          >
            Start Account Setup Wizard
          </button>
        </div>
      ) : (
        /* Account Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectedAccounts.map((account) => (
            <InstagramAccountCard
              key={account.id}
              account={account}
              onDeactivate={handleDeactivate}
              isDeactivating={isDeactivating}
            />
          ))}
        </div>
      )}

      {/* Linking Wizard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/5 bg-[#121214] shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <Sparkles className="size-4.5 text-[#7f22fe]" />
                  Link Instagram Account
                </h3>
                <span className="text-zinc-400 text-xs">
                  Available profiles detected on your Facebook pages
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="size-8 rounded-lg border border-white/5 hover:border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {isLoadingLinkable ? (
                /* Loading States */
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="size-8 text-[#7f22fe] animate-spin" />
                  <span className="text-zinc-400 text-xs font-medium animate-pulse">
                    Scanning Facebook Managed Pages...
                  </span>
                </div>
              ) : linkableError ? (
                /* API Error */
                <div className="border border-red-500/10 bg-red-500/5 rounded-xl p-6 flex flex-col gap-4 text-center">
                  <AlertCircle className="size-8 text-red-500 mx-auto" />
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-white text-sm">Meta Fetch Failed</span>
                    <p className="text-zinc-400 text-xs leading-5">
                      Failed to fetch linkable accounts. Verify that your Facebook integration is complete under Clerk social connections.
                    </p>
                  </div>
                  <button
                    onClick={() => refetchLinkable()}
                    className="mx-auto rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs px-3.5 py-2 font-medium flex items-center gap-1.5 border border-white/5"
                  >
                    <RefreshCw className="size-3" />
                    Retry Search
                  </button>
                </div>
              ) : linkableAccounts.length === 0 ? (
                /* No linkable accounts detected */
                <div className="border border-white/5 bg-[#09090b]/50 rounded-xl p-8 text-center flex flex-col items-center gap-4">
                  <div className="size-12 rounded-xl bg-[#1a1a1e] border border-white/5 flex items-center justify-center text-zinc-500">
                    <Instagram className="size-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-white text-sm">No Unlinked Profiles Found</span>
                    <p className="text-zinc-400 text-xs leading-5 max-w-xs mx-auto">
                      Make sure your Instagram account is set as a **Professional** (Creator or Business) account and linked to a Facebook Page you manage.
                    </p>
                  </div>
                  <button
                    onClick={() => refetchLinkable()}
                    className="rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs px-3.5 py-2 font-medium flex items-center gap-1.5 border border-white/5"
                  >
                    <RefreshCw className="size-3" />
                    Scan Again
                  </button>
                </div>
              ) : (
                /* List of Linkable Profiles */
                <div className="flex flex-col gap-3">
                  {linkableAccounts.map((account) => {
                    const isAlreadyConnected = connectedAccounts.some(
                      (conn) => conn.id === account.instagramAccountId
                    );
                    return (
                      <div
                        key={account.instagramAccountId}
                        className="rounded-xl border border-white/5 bg-[#09090b]/30 p-4 flex items-center justify-between gap-4 transition-all hover:bg-[#09090b]/60 hover:border-white/10"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {account.profilePictureUrl ? (
                            <img
                              src={account.profilePictureUrl}
                              alt={account.username}
                              className="size-11 rounded-xl object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="size-11 rounded-xl bg-[#1a1a1e] border border-white/5 flex items-center justify-center text-zinc-500 shrink-0">
                              <Instagram className="size-5" />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-white text-sm truncate">
                              {account.name || account.username}
                            </span>
                            <span className="text-zinc-500 text-xs truncate">
                              @{account.username}
                            </span>
                          </div>
                        </div>

                        {isAlreadyConnected ? (
                          <span className="text-[10px] tracking-wide font-semibold text-zinc-500 uppercase px-2.5 py-1 rounded bg-[#1a1a1e] border border-white/5">
                            Connected
                          </span>
                        ) : (
                          <button
                            onClick={() => handleLinkAccount(account)}
                            disabled={isActivating}
                            className="rounded-lg bg-[#7f22fe] hover:bg-[#9647ff] text-white text-xs px-3.5 py-2 font-semibold transition-all disabled:opacity-50"
                          >
                            {isActivating ? 'Linking...' : 'Connect'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/5 bg-[#1a1a1e]/40 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-white/5 hover:border-white/10 hover:bg-[#1a1a1e] text-zinc-300 text-xs px-4 py-2 font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
