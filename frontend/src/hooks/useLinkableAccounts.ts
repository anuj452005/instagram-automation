import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';

export interface InstagramAccount {
  id: string;
  username: string;
  name: string | null;
  profilePictureUrl: string | null;
  isActive: boolean;
  followersCount: number;
  connectedAt: string;
}

export interface LinkableAccount {
  instagramAccountId: string;
  username: string;
  name: string;
  profilePictureUrl: string;
  fbPageId: string;
}

export function useLinkableAccounts() {
  const queryClient = useQueryClient();

  // Query to fetch connected/active accounts
  const connectedQuery = useQuery<InstagramAccount[]>({
    queryKey: ['connected-accounts'],
    queryFn: async () => {
      const response = await api.get('/api/accounts');
      return response.data;
    },
  });

  // Query to fetch linkable accounts from Facebook API (disabled by default)
  const linkableQuery = useQuery<LinkableAccount[]>({
    queryKey: ['linkable-accounts'],
    queryFn: async () => {
      const response = await api.get('/api/accounts/linkable');
      return response.data;
    },
    enabled: false, // Trigger manually when wizard is open
  });

  // Mutation to link/activate an account
  const activateMutation = useMutation({
    mutationFn: async (payload: { instagramAccountId: string; fbPageId: string }) => {
      const response = await api.post('/api/accounts/activate', payload);
      return response.data;
    },
    onSuccess: () => {
      // Refresh list of connected accounts and linkable accounts
      queryClient.invalidateQueries({ queryKey: ['connected-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['linkable-accounts'] });
    },
  });

  // Mutation to deactivate an account
  const deactivateMutation = useMutation({
    mutationFn: async (payload: { instagramAccountId: string }) => {
      const response = await api.post('/api/accounts/deactivate', payload);
      return response.data;
    },
    onSuccess: () => {
      // Refresh list of connected accounts
      queryClient.invalidateQueries({ queryKey: ['connected-accounts'] });
    },
  });

  return {
    connectedAccounts: connectedQuery.data || [],
    isLoadingConnected: connectedQuery.isLoading,
    connectedError: connectedQuery.error,
    refetchConnected: connectedQuery.refetch,

    linkableAccounts: linkableQuery.data || [],
    isLoadingLinkable: linkableQuery.isLoading,
    linkableError: linkableQuery.error,
    refetchLinkable: linkableQuery.refetch,

    activate: activateMutation.mutateAsync,
    isActivating: activateMutation.isPending,

    deactivate: deactivateMutation.mutateAsync,
    isDeactivating: deactivateMutation.isPending,
  };
}
