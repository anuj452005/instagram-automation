import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';

export interface AutomationKeyword {
  id?: string;
  automationId?: string;
  keyword: string;
  matchType: 'exact' | 'contains' | 'starts_with';
}

export interface Automation {
  id: string;
  instagramAccountId: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  postId: string | null;
  postUrl: string | null;
  postType: 'FEED' | 'REEL' | 'STORY' | null;
  flowType: 'dm' | 'landing_page';
  dmTemplate: string;
  collectLeads: boolean;
  leadFields: string[];
  landingPageToken: string | null;
  alsoReplyComment: boolean;
  commentReplyText: string | null;
  scheduledActivateAt: string | null;
  createdAt: string;
  updatedAt: string;
  instagramAccountUsername?: string;
  keywords: AutomationKeyword[];
}

export interface CreateAutomationInput {
  instagramAccountId: string;
  name: string;
  flowType: 'dm' | 'landing_page';
  dmTemplate: string;
  status?: 'draft' | 'active' | 'paused' | 'archived';
  postId?: string | null;
  postUrl?: string | null;
  postType?: 'FEED' | 'REEL' | 'STORY' | null;
  collectLeads?: boolean;
  leadFields?: string[];
  landingPageToken?: string | null;
  alsoReplyComment?: boolean;
  commentReplyText?: string | null;
  scheduledActivateAt?: string | null;
  keywords: { keyword: string; matchType?: 'exact' | 'contains' | 'starts_with' }[];
}

export interface UpdateAutomationInput {
  instagramAccountId?: string;
  name?: string;
  flowType?: 'dm' | 'landing_page';
  dmTemplate?: string;
  status?: 'draft' | 'active' | 'paused' | 'archived';
  postId?: string | null;
  postUrl?: string | null;
  postType?: 'FEED' | 'REEL' | 'STORY' | null;
  collectLeads?: boolean;
  leadFields?: string[];
  landingPageToken?: string | null;
  alsoReplyComment?: boolean;
  commentReplyText?: string | null;
  scheduledActivateAt?: string | null;
  keywords?: { keyword: string; matchType?: 'exact' | 'contains' | 'starts_with' }[];
}

export function useAutomations() {
  const queryClient = useQueryClient();

  // Query to list all automations
  const listQuery = useQuery<Automation[]>({
    queryKey: ['automations'],
    queryFn: async () => {
      const response = await api.get('/api/automations');
      return response.data;
    },
  });

  // Mutation to create an automation
  const createMutation = useMutation({
    mutationFn: async (payload: CreateAutomationInput) => {
      const response = await api.post('/api/automations', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });

  // Mutation to update an automation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateAutomationInput }) => {
      const response = await api.put(`/api/automations/${id}`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.invalidateQueries({ queryKey: ['automation', data.id] });
    },
  });

  // Mutation to delete an automation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/automations/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });

  return {
    automations: listQuery.data || [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    refetch: listQuery.refetch,

    createAutomation: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateAutomation: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    deleteAutomation: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useAutomation(id?: string) {
  const queryQuery = useQuery<Automation>({
    queryKey: ['automation', id],
    queryFn: async () => {
      const response = await api.get(`/api/automations/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  return {
    automation: queryQuery.data,
    isLoading: queryQuery.isLoading,
    error: queryQuery.error,
    refetch: queryQuery.refetch,
  };
}
