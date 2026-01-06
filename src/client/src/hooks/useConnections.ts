import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { ApiResponse } from '@shared/types';

export interface Connection {
  id: number;
  name: string;
  type: 'teamwork_desk';
  status: 'active' | 'error' | 'pending';
  lastTestedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConnectionInput {
  type: 'teamwork_desk';
  name: string;
  credentials: {
    apiKey: string;
    subdomain: string;
  };
}

export interface UpdateConnectionInput {
  name?: string;
  credentials?: {
    apiKey: string;
    subdomain: string;
  };
}

export function useConnections() {
  return useQuery({
    queryKey: queryKeys.connections.lists(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Connection[]>>('/connections');
      return response.data;
    },
  });
}

export function useConnection(connectionId: number) {
  return useQuery({
    queryKey: queryKeys.connections.detail(connectionId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Connection>>(`/connections/${connectionId}`);
      return response.data;
    },
    enabled: !!connectionId,
  });
}

export function useCreateConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateConnectionInput) => {
      const response = await api.post<ApiResponse<Connection>>('/connections', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.lists() });
    },
  });
}

export function useUpdateConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateConnectionInput }) => {
      const response = await api.patch<ApiResponse<Connection>>(`/connections/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.lists() });
    },
  });
}

export function useDeleteConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/connections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.lists() });
    },
  });
}

export function useTestConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<ApiResponse<{ success: boolean; error?: string }>>(
        `/connections/${id}/test`
      );
      return response.data;
    },
    onSuccess: () => {
      // Refresh connections list to update lastTestedAt
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.lists() });
    },
  });
}
