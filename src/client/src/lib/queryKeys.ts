// Query key factory for TanStack Query
// Follows the pattern from https://tkdodo.eu/blog/effective-react-query-keys

export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: { role?: string }) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.users.details(), id] as const,
  },

  // Organization
  organization: {
    all: ['organization'] as const,
    details: () => [...queryKeys.organization.all, 'detail'] as const,
  },

  // Invitations
  invitations: {
    all: ['invitations'] as const,
    lists: () => [...queryKeys.invitations.all, 'list'] as const,
    list: (filters?: { status?: string }) =>
      [...queryKeys.invitations.lists(), filters] as const,
    validation: (token: string) =>
      [...queryKeys.invitations.all, 'validate', token] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: { status?: string }) =>
      [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.projects.details(), id] as const,
    auditLog: (id: number, filters?: Record<string, any>) =>
      [...queryKeys.projects.detail(id), 'audit-log', filters] as const,
  },

  // Sources
  sources: {
    all: ['sources'] as const,
    lists: () => [...queryKeys.sources.all, 'list'] as const,
    byProject: (projectId: number) =>
      [...queryKeys.sources.lists(), { projectId }] as const,
    details: () => [...queryKeys.sources.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.sources.details(), id] as const,
    data: (id: number, page?: number, limit?: number) =>
      [...queryKeys.sources.detail(id), 'data', { page, limit }] as const,
    preview: (id: number) =>
      [...queryKeys.sources.detail(id), 'preview'] as const,
  },

  // Mappings
  mappings: {
    all: ['mappings'] as const,
    bySource: (sourceId: number) =>
      [...queryKeys.mappings.all, 'source', sourceId] as const,
    suggestions: (sourceId: number) =>
      [...queryKeys.mappings.bySource(sourceId), 'suggestions'] as const,
    preview: (sourceId: number) =>
      [...queryKeys.mappings.bySource(sourceId), 'preview'] as const,
  },

  // De-identification
  deidentification: {
    all: ['deidentification'] as const,
    config: (sourceId: number) =>
      [...queryKeys.deidentification.all, 'config', sourceId] as const,
    scan: (sourceId: number) =>
      [...queryKeys.deidentification.all, 'scan', sourceId] as const,
    preview: (sourceId: number) =>
      [...queryKeys.deidentification.all, 'preview', sourceId] as const,
  },

  // Filters
  filters: {
    all: ['filters'] as const,
    config: (sourceId: number) =>
      [...queryKeys.filters.all, 'config', sourceId] as const,
    summary: (sourceId: number) =>
      [...queryKeys.filters.all, 'summary', sourceId] as const,
  },

  // Processing
  processing: {
    all: ['processing'] as const,
    runs: (sourceId: number) =>
      [...queryKeys.processing.all, 'runs', sourceId] as const,
    run: (runId: number) =>
      [...queryKeys.processing.all, 'run', runId] as const,
  },

  // Outputs
  outputs: {
    all: ['outputs'] as const,
    bySource: (sourceId: number) =>
      [...queryKeys.outputs.all, 'source', sourceId] as const,
    detail: (id: number) => [...queryKeys.outputs.all, 'detail', id] as const,
    preview: (id: number) =>
      [...queryKeys.outputs.detail(id), 'preview'] as const,
  },

  // Connections
  connections: {
    all: ['connections'] as const,
    lists: () => [...queryKeys.connections.all, 'list'] as const,
    detail: (id: number) =>
      [...queryKeys.connections.all, 'detail', id] as const,
  },

  // Audit Log
  auditLog: {
    all: ['audit-log'] as const,
    organization: (filters?: Record<string, any>) =>
      [...queryKeys.auditLog.all, 'organization', filters] as const,
  },
};

// Type helper for extracting query key types
export type QueryKeys = typeof queryKeys;
