import type { ApiResponse, ErrorResponse } from '@shared/types';

const API_BASE_URL = '/api';

export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: string;
  public fields?: Record<string, string[]>;

  constructor(response: ErrorResponse, status: number) {
    super(response.error.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = response.error.code;
    this.details = response.error.details;
    this.fields = response.error.fields;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, params, headers: customHeaders, ...rest } = options;

  // Build URL with query params
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const config: RequestInit = {
    ...rest,
    headers,
    credentials: 'include', // Important for cookies
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);

  // Handle empty responses
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    // Handle 401 - redirect to login
    if (response.status === 401) {
      // Don't redirect if already on auth pages to prevent infinite loop
      const authPaths = ['/login', '/forgot-password', '/reset-password', '/accept-invitation'];
      const isAuthPage = authPaths.some(path => window.location.pathname.startsWith(path));
      
      if (!isAuthPage) {
        // Try to refresh token
        const refreshed = await refreshToken();
        if (refreshed) {
          // Retry the original request
          return request<T>(endpoint, options);
        }
        // Redirect to login if refresh failed
        window.location.href = '/login';
      }
      
      throw new ApiError(
        { error: { code: 'UNAUTHORIZED', message: 'Session expired' } },
        401
      );
    }

    throw new ApiError(data as ErrorResponse, response.status);
  }

  return data;
}

async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
}

// API methods
export const api = {
  get<T>(endpoint: string, params?: RequestOptions['params']): Promise<T> {
    return request<T>(endpoint, { method: 'GET', params });
  },

  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, { method: 'POST', body });
  },

  patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, { method: 'PATCH', body });
  },

  put<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, { method: 'PUT', body });
  },

  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' });
  },

  // File upload method
  async upload<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data as ErrorResponse, response.status);
    }

    return data;
  },

  // Download method
  async download(endpoint: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new ApiError(data as ErrorResponse, response.status);
    }

    return response.blob();
  },
};

// Auth-specific API calls
export const authApi = {
  login(email: string, password: string) {
    return api.post<ApiResponse<{ user: any }>>('/auth/login', {
      email,
      password,
    });
  },

  logout() {
    return api.post<ApiResponse<{ message: string }>>('/auth/logout');
  },

  getProfile() {
    return api.get<ApiResponse<{ user: any }>>('/auth/profile');
  },

  updateProfile(data: { name?: string }) {
    return api.patch<ApiResponse<{ user: any }>>('/auth/profile', data);
  },

  changePassword(currentPassword: string, newPassword: string) {
    return api.post<ApiResponse<{ message: string }>>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  forgotPassword(email: string) {
    return api.post<ApiResponse<{ message: string }>>('/auth/forgot-password', {
      email,
    });
  },

  resetPassword(token: string, password: string) {
    return api.post<ApiResponse<{ message: string }>>('/auth/reset-password', {
      token,
      password,
    });
  },

  validateInvitation(token: string) {
    return api.get<ApiResponse<{ invitation: any }>>('/invitations/validate', {
      token,
    });
  },

  acceptInvitation(token: string, name: string, password: string) {
    return api.post<ApiResponse<{ user: any }>>('/invitations/accept', {
      token,
      name,
      password,
    });
  },
};
