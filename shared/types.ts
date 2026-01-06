import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
  organizations,
  users,
  invitations,
  refreshTokens,
  passwordResetTokens,
  projects,
  sources,
  sourceData,
  fieldMappings,
  deidentificationConfigs,
  filterConfigs,
  processingRuns,
  outputs,
  apiConnections,
  auditLogs,
} from './schema';

// ============================================================================
// DATABASE TYPES
// ============================================================================

export type Organization = InferSelectModel<typeof organizations>;
export type NewOrganization = InferInsertModel<typeof organizations>;

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Invitation = InferSelectModel<typeof invitations>;
export type NewInvitation = InferInsertModel<typeof invitations>;

export type RefreshToken = InferSelectModel<typeof refreshTokens>;
export type NewRefreshToken = InferInsertModel<typeof refreshTokens>;

export type PasswordResetToken = InferSelectModel<typeof passwordResetTokens>;
export type NewPasswordResetToken = InferInsertModel<typeof passwordResetTokens>;

export type Project = InferSelectModel<typeof projects>;
export type NewProject = InferInsertModel<typeof projects>;

export type Source = InferSelectModel<typeof sources>;
export type NewSource = InferInsertModel<typeof sources>;

export type SourceData = InferSelectModel<typeof sourceData>;
export type NewSourceData = InferInsertModel<typeof sourceData>;

export type FieldMapping = InferSelectModel<typeof fieldMappings>;
export type NewFieldMapping = InferInsertModel<typeof fieldMappings>;

export type DeidentificationConfig = InferSelectModel<typeof deidentificationConfigs>;
export type NewDeidentificationConfig = InferInsertModel<typeof deidentificationConfigs>;

export type FilterConfig = InferSelectModel<typeof filterConfigs>;
export type NewFilterConfig = InferInsertModel<typeof filterConfigs>;

export type ProcessingRun = InferSelectModel<typeof processingRuns>;
export type NewProcessingRun = InferInsertModel<typeof processingRuns>;

export type Output = InferSelectModel<typeof outputs>;
export type NewOutput = InferInsertModel<typeof outputs>;

export type ApiConnection = InferSelectModel<typeof apiConnections>;
export type NewApiConnection = InferInsertModel<typeof apiConnections>;

export type AuditLog = InferSelectModel<typeof auditLogs>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;

// ============================================================================
// ENUM TYPES
// ============================================================================

export type UserRole = 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';
export type SourceType = 'file' | 'api';
export type ProjectStatus = 'active' | 'completed' | 'archived';
export type SourceStatus = 'uploading' | 'parsing' | 'ready' | 'error';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type OutputFormat = 'conversational_jsonl' | 'qa_pairs_jsonl' | 'raw_json';
export type ConnectionType = 'teamwork_desk';
export type ConnectionStatus = 'active' | 'inactive' | 'error';
export type AuditAction =
  | 'user_login' | 'user_logout' | 'user_created' | 'user_updated' | 'user_deleted' | 'user_role_changed'
  | 'invitation_created' | 'invitation_accepted' | 'invitation_cancelled'
  | 'project_created' | 'project_updated' | 'project_deleted'
  | 'source_created' | 'source_updated' | 'source_deleted' | 'source_replaced'
  | 'mapping_updated' | 'deidentification_updated' | 'deidentification_approved' | 'filters_updated'
  | 'processing_started' | 'processing_completed' | 'processing_failed' | 'processing_cancelled'
  | 'output_downloaded' | 'output_deleted'
  | 'connection_created' | 'connection_updated' | 'connection_deleted' | 'connection_tested'
  | 'organization_updated';

// ============================================================================
// API TYPES
// ============================================================================

// Standard API Response Wrapper
export interface ApiResponse<T> {
  data: T;
  meta?: {
    timestamp?: string;
    pagination?: PaginationMeta;
    message?: string;
    warning?: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// Standard Error Response
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: string;
    fields?: Record<string, string[]>;
  };
}

// Auth Types
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  organizationId: number;
  organizationName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface AcceptInvitationRequest {
  token: string;
  name: string;
  password: string;
}

// Mapping Types
export interface MappingEntry {
  sourceColumn: string;
  targetField: string;
  transformations?: TransformationConfig[];
  suggested?: boolean;
  confirmed?: boolean;
}

export interface TransformationConfig {
  type: 'lowercase' | 'uppercase' | 'trim' | 'date_format' | 'value_map';
  config?: Record<string, unknown>;
}

// De-identification Types
export interface DeidentificationRule {
  id: string;
  type: 'name' | 'email' | 'phone' | 'address' | 'company' | 'custom';
  pattern?: string;
  replacement: string;
  enabled: boolean;
  isDefault?: boolean;
}

export interface PiiScanSummary {
  names: number;
  emails: number;
  phones: number;
  addresses: number;
  companies: number;
  custom: number;
}

// Filter Types
export interface FilterConfigData {
  minConversationLength?: number;
  minContentLength?: number;
  statusInclude?: string[];
  statusExclude?: string[];
  categoryInclude?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
}

// Processing Types
export interface ProcessingProgress {
  status: ProcessingStatus;
  processedCount: number;
  totalCount: number;
  percentComplete: number;
  estimatedTimeRemaining?: number;
}

// Standard Target Fields
export const STANDARD_TARGET_FIELDS = [
  'conversation_id',
  'timestamp',
  'role',
  'content',
  'subject',
  'status',
  'category',
  'customer_email',
  'agent_name',
] as const;

export type StandardTargetField = typeof STANDARD_TARGET_FIELDS[number];
