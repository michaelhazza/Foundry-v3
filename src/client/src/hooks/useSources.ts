import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { ApiResponse, Source } from '@shared/types';

export function useSources(projectId: number) {
  return useQuery({
    queryKey: queryKeys.sources.byProject(projectId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Source[]>>(
        `/projects/${projectId}/sources`
      );
      return response.data;
    },
    enabled: !!projectId,
  });
}

export function useSource(sourceId: number) {
  return useQuery({
    queryKey: queryKeys.sources.detail(sourceId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Source>>(`/sources/${sourceId}`);
      return response.data;
    },
    enabled: !!sourceId,
  });
}

export function useSourcePreview(sourceId: number) {
  return useQuery({
    queryKey: queryKeys.sources.preview(sourceId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/sources/${sourceId}/preview`);
      return response.data;
    },
    enabled: !!sourceId,
  });
}

export function useUploadSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      file,
      type,
    }: {
      projectId: number;
      file: File;
      type: 'csv' | 'excel' | 'json' | 'jsonl';
    }) => {
      const response = await api.upload<ApiResponse<Source>>(
        `/projects/${projectId}/sources/upload`,
        file,
        { type }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sources.byProject(data.projectId),
      });
    },
  });
}

export function useDeleteSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceId: number) => {
      await api.delete(`/sources/${sourceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sources.lists() });
    },
  });
}

export interface CreateApiSourceInput {
  connectionId: number;
  name: string;
  config: {
    dataType: 'tickets';
    dateRange?: {
      start?: string;
      end?: string;
    };
    projectFilter?: string[];
  };
}

export function useCreateApiSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: number;
      data: CreateApiSourceInput;
    }) => {
      const response = await api.post<ApiResponse<Source>>(
        `/projects/${projectId}/sources/api`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sources.byProject(data.projectId),
      });
    },
  });
}
