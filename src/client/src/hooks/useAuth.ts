import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, ApiError } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'member';
  organizationId: number;
  organizationName: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: async () => {
      const response = await authApi.getProfile();
      return response.data.user as User;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isAuthenticated = !!user && !error;

  return {
    user,
    isLoading,
    isAuthenticated,
    error: error as ApiError | null,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const response = await authApi.login(email, password);
      return response.data.user as User;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.profile(), user);
      navigate('/');
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      await authApi.logout();
    },
    onSuccess: () => {
      queryClient.clear();
      navigate('/login');
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name?: string }) => {
      const response = await authApi.updateProfile(data);
      return response.data.user as User;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.profile(), user);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      await authApi.changePassword(currentPassword, newPassword);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      await authApi.forgotPassword(email);
    },
  });
}

export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({
      token,
      password,
    }: {
      token: string;
      password: string;
    }) => {
      await authApi.resetPassword(token, password);
    },
    onSuccess: () => {
      navigate('/login');
    },
  });
}

export function useValidateInvitation(token: string) {
  return useQuery({
    queryKey: queryKeys.invitations.validation(token),
    queryFn: async () => {
      const response = await authApi.validateInvitation(token);
      return response.data.invitation;
    },
    enabled: !!token,
    retry: false,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({
      token,
      name,
      password,
    }: {
      token: string;
      name: string;
      password: string;
    }) => {
      const response = await authApi.acceptInvitation(token, name, password);
      return response.data.user as User;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.profile(), user);
      navigate('/');
    },
  });
}
