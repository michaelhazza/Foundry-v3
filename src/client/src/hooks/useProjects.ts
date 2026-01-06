import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { ApiResponse, Project } from '@shared/types';

export function useProjects(filters?: { status?: string }) {
  return useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Project[]>>('/projects', filters);
      return response.data;
    },
  });
}

export function useProject(projectId: number) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Project>>(`/projects/${projectId}`);
      return response.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await api.post<ApiResponse<Project>>('/projects', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: number;
      data: { name?: string; description?: string; status?: string };
    }) => {
      const response = await api.patch<ApiResponse<Project>>(
        `/projects/${projectId}`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      queryClient.setQueryData(queryKeys.projects.detail(data.id), data);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: number) => {
      await api.delete(`/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}
