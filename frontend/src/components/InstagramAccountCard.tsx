import React from 'react';
import { Users, Calendar, Power, PowerOff } from 'lucide-react';
import { Instagram } from './icons';
import type { InstagramAccount } from '../hooks/useLinkableAccounts';

interface InstagramAccountCardProps {
  account: InstagramAccount;
  onDeactivate: (id: string) => Promise<void>;
  isDeactivating: boolean;
}

export const InstagramAccountCard: React.FC<InstagramAccountCardProps> = ({
  account,
  onDeactivate,
  isDeactivating,
}) => {
  const formattedDate = new Date(account.connectedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[linear-gradient(160deg,#1a1a1e,rgba(26,26,30,0.6))] backdrop-blur-xl p-6 flex flex-col gap-6 transition-all duration-300 hover:border-white/10 hover:shadow-xl hover:shadow-[#7f22fe]/5">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#7f22fe]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Profile Info & Status */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {account.profilePictureUrl ? (
              <img
                src={account.profilePictureUrl}
                alt={account.username}
                className="size-14 rounded-2xl object-cover border border-white/10"
              />
            ) : (
              <div className="size-14 rounded-2xl bg-[#1a1a1e] border border-white/5 flex items-center justify-center text-zinc-500">
                <Instagram className="size-6" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 size-5 rounded-lg bg-[#7f22fe] flex items-center justify-center border border-[#121214] shadow-md shadow-[#7f22fe]/20">
              <Instagram className="size-3 text-white" />
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <h3 className="font-semibold text-base leading-6 text-white truncate">
              {account.name || account.username}
            </h3>
            <span className="text-zinc-400 text-sm leading-5 truncate">
              @{account.username}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        {account.isActive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/20">
            <span className="size-1.5 rounded-full bg-[#14b8a6] animate-pulse" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ff6467]/10 text-[#ff6467] border border-[#ff6467]/20">
            <span className="size-1.5 rounded-full bg-[#ff6467]" />
            Paused
          </span>
        )}
      </div>

      {/* Stats Divider */}
      <div className="h-px bg-white/5 w-full" />

      {/* Metadata Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
            <Users className="size-3.5" />
            <span>Followers</span>
          </div>
          <span className="font-bold text-white text-base leading-6">
            {account.followersCount.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
            <Calendar className="size-3.5" />
            <span>Connected</span>
          </div>
          <span className="font-semibold text-zinc-300 text-sm leading-6 truncate">
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex mt-2 justify-stretch">
        {account.isActive ? (
          <button
            onClick={() => onDeactivate(account.id)}
            disabled={isDeactivating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/5 hover:border-[#ff6467]/30 hover:bg-[#ff6467]/10 text-zinc-300 hover:text-[#ff6467] text-sm font-semibold transition-all duration-200 disabled:opacity-50"
          >
            <PowerOff className="size-4" />
            {isDeactivating ? 'Disconnecting...' : 'Disconnect Profile'}
          </button>
        ) : (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1a1e]/50 border border-white/5 text-zinc-500 text-sm font-semibold cursor-not-allowed"
          >
            <Power className="size-4" />
            Reconnect in Wizard
          </button>
        )}
      </div>
    </div>
  );
};
