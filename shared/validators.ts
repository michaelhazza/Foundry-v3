import { z } from 'zod';

// ============================================================================
// AUTH VALIDATORS
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Password must contain at least one number'),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  name: z.string().min(1, 'Name is required').max(100),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Password must contain at least one number'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Password must contain at least one number'),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

// ============================================================================
// USER VALIDATORS
// ============================================================================

export const inviteUserSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  role: z.enum(['admin', 'member']).default('member'),
});

export const changeRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});

// ============================================================================
// ORGANIZATION VALIDATORS
// ============================================================================

export const organizationUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

// ============================================================================
// PROJECT VALIDATORS
// ============================================================================

export const createProjectSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// ============================================================================
// SOURCE VALIDATORS
// ============================================================================

export const createApiSourceSchema = z.object({
  connectionId: z.number().min(1, 'Please select a connection'),
  name: z.string().min(1, 'Name is required').max(100),
  config: z.object({
    dataType: z.enum(['tickets']),
    dateRange: z.object({
      start: z.string().optional(),
      end: z.string().optional(),
    }).optional(),
    projectFilter: z.array(z.string()).optional(),
    statusFilter: z.array(z.string()).optional(),
  }),
});

export const updateSourceSchema = z.object({
  name: z.string().min(1).max(100),
});

// ============================================================================
// MAPPING VALIDATORS
// ============================================================================

export const transformationSchema = z.object({
  type: z.enum(['lowercase', 'uppercase', 'trim', 'date_format', 'value_map']),
  config: z.record(z.any()).optional(),
});

export const mappingEntrySchema = z.object({
  sourceColumn: z.string().min(1),
  targetField: z.string().min(1),
  transformations: z.array(transformationSchema).optional(),
});

export const updateMappingSchema = z.object({
  mappings: z.array(mappingEntrySchema),
  customFields: z.array(z.string()).optional(),
});

export const mappingPreviewSchema = z.object({
  limit: z.number().min(1).max(100).default(10),
});

// ============================================================================
// DE-IDENTIFICATION VALIDATORS
// ============================================================================

export const deidentificationRuleSchema = z.object({
  id: z.string(),
  type: z.enum(['name', 'email', 'phone', 'address', 'company', 'custom']),
  pattern: z.string().optional(),
  replacement: z.string().min(1, 'Replacement is required'),
  enabled: z.boolean(),
});

export const updateDeidentificationSchema = z.object({
  rules: z.array(deidentificationRuleSchema).optional(),
  columnsToScan: z.array(z.string()).optional(),
});

export const testPatternSchema = z.object({
  pattern: z.string().min(1, 'Pattern is required'),
  replacement: z.string().min(1, 'Replacement is required'),
});

export const deidentificationPreviewSchema = z.object({
  limit: z.number().min(1).max(100).default(10),
});

// ============================================================================
// FILTER VALIDATORS
// ============================================================================

export const updateFiltersSchema = z.object({
  filters: z.object({
    minConversationLength: z.number().min(0).optional(),
    minContentLength: z.number().min(0).optional(),
    statusInclude: z.array(z.string()).optional(),
    statusExclude: z.array(z.string()).optional(),
    categoryInclude: z.array(z.string()).optional(),
    dateRange: z.object({
      start: z.string().optional(),
      end: z.string().optional(),
    }).optional(),
  }),
});

// ============================================================================
// PROCESSING VALIDATORS
// ============================================================================

export const startProcessingSchema = z.object({
  outputFormat: z.enum(['conversational_jsonl', 'qa_pairs_jsonl', 'raw_json']),
});

export const outputPreviewSchema = z.object({
  format: z.enum(['conversational_jsonl', 'qa_pairs_jsonl', 'raw_json']),
  limit: z.number().min(1).max(10).default(5),
});

// ============================================================================
// CONNECTION VALIDATORS
// ============================================================================

export const createConnectionSchema = z.object({
  type: z.enum(['teamwork_desk']),
  name: z.string().min(1, 'Name is required').max(100),
  credentials: z.object({
    apiKey: z.string().min(1, 'API key is required'),
    subdomain: z.string().min(1, 'Subdomain is required'),
  }),
});

export const updateConnectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  credentials: z.object({
    apiKey: z.string().min(1),
    subdomain: z.string().min(1),
  }).optional(),
});

// ============================================================================
// PAGINATION VALIDATORS
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
});

export const sourcePreviewSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(100),
  search: z.string().optional(),
});

// ============================================================================
// AUDIT VALIDATORS
// ============================================================================

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  action: z.string().optional(),
  userId: z.coerce.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type AcceptInvitationValues = z.infer<typeof acceptInvitationSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;
export type InviteUserValues = z.infer<typeof inviteUserSchema>;
export type ChangeRoleValues = z.infer<typeof changeRoleSchema>;
export type OrganizationUpdateValues = z.infer<typeof organizationUpdateSchema>;
export type CreateProjectValues = z.infer<typeof createProjectSchema>;
export type UpdateProjectValues = z.infer<typeof updateProjectSchema>;
export type CreateApiSourceValues = z.infer<typeof createApiSourceSchema>;
export type UpdateSourceValues = z.infer<typeof updateSourceSchema>;
export type UpdateMappingValues = z.infer<typeof updateMappingSchema>;
export type UpdateDeidentificationValues = z.infer<typeof updateDeidentificationSchema>;
export type TestPatternValues = z.infer<typeof testPatternSchema>;
export type UpdateFiltersValues = z.infer<typeof updateFiltersSchema>;
export type StartProcessingValues = z.infer<typeof startProcessingSchema>;
export type CreateConnectionValues = z.infer<typeof createConnectionSchema>;
export type UpdateConnectionValues = z.infer<typeof updateConnectionSchema>;
export type PaginationValues = z.infer<typeof paginationSchema>;
export type AuditLogQueryValues = z.infer<typeof auditLogQuerySchema>;
