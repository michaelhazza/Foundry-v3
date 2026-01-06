import { pgTable, pgEnum, serial, varchar, text, integer, boolean, timestamp, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', ['admin', 'member']);
export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'accepted', 'expired', 'cancelled']);
export const sourceTypeEnum = pgEnum('source_type', ['file', 'api']);
export const projectStatusEnum = pgEnum('project_status', ['active', 'completed', 'archived']);
export const sourceStatusEnum = pgEnum('source_status', ['uploading', 'parsing', 'ready', 'error']);
export const processingStatusEnum = pgEnum('processing_status', ['pending', 'processing', 'completed', 'failed', 'cancelled']);
export const outputFormatEnum = pgEnum('output_format', ['conversational_jsonl', 'qa_pairs_jsonl', 'raw_json']);
export const connectionTypeEnum = pgEnum('connection_type', ['teamwork_desk']);
export const connectionStatusEnum = pgEnum('connection_status', ['active', 'inactive', 'error']);
export const auditActionEnum = pgEnum('audit_action', [
  'user_login',
  'user_logout',
  'user_created',
  'user_updated',
  'user_deleted',
  'user_role_changed',
  'invitation_created',
  'invitation_accepted',
  'invitation_cancelled',
  'project_created',
  'project_updated',
  'project_deleted',
  'source_created',
  'source_updated',
  'source_deleted',
  'source_replaced',
  'mapping_updated',
  'deidentification_updated',
  'deidentification_approved',
  'filters_updated',
  'processing_started',
  'processing_completed',
  'processing_failed',
  'processing_cancelled',
  'output_downloaded',
  'output_deleted',
  'connection_created',
  'connection_updated',
  'connection_deleted',
  'connection_tested',
  'organization_updated'
]);

// ============================================================================
// TABLES
// ============================================================================

// Organizations
export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: userRoleEnum('role').default('member').notNull(),
  failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  emailOrgIdx: unique('users_email_org_unique').on(table.email, table.organizationId),
  orgIdx: index('users_org_idx').on(table.organizationId),
}));

// Invitations
export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('member').notNull(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  status: invitationStatusEnum('status').default('pending').notNull(),
  invitedById: integer('invited_by_id').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailOrgIdx: index('invitations_email_org_idx').on(table.email, table.organizationId),
  statusIdx: index('invitations_status_idx').on(table.status),
}));

// Refresh Tokens
export const refreshTokens = pgTable('refresh_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('refresh_tokens_user_idx').on(table.userId),
}));

// Password Reset Tokens
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('password_reset_user_idx').on(table.userId),
}));

// Projects
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  status: projectStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('projects_org_idx').on(table.organizationId),
}));

// Sources
export const sources = pgTable('sources', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  connectionId: integer('connection_id').references(() => apiConnections.id),
  name: varchar('name', { length: 100 }).notNull(),
  type: sourceTypeEnum('type').notNull(),
  status: sourceStatusEnum('status').default('uploading').notNull(),
  originalFilename: varchar('original_filename', { length: 255 }),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  rowCount: integer('row_count'),
  columnCount: integer('column_count'),
  columns: jsonb('columns').$type<string[]>(),
  errorMessage: text('error_message'),
  apiConfig: jsonb('api_config').$type<{
    dataType: string;
    dateRange?: { start?: string; end?: string };
    projectFilter?: string[];
    statusFilter?: string[];
  }>(),
  lastRefreshedAt: timestamp('last_refreshed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  projectIdx: index('sources_project_idx').on(table.projectId),
  statusIdx: index('sources_status_idx').on(table.status),
}));

// Source Data (row storage)
export const sourceData = pgTable('source_data', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  rowIndex: integer('row_index').notNull(),
  data: jsonb('data').notNull().$type<Record<string, unknown>>(),
}, (table) => ({
  sourceRowIdx: index('source_data_source_row_idx').on(table.sourceId, table.rowIndex),
}));

// Field Mappings
export const fieldMappings = pgTable('field_mappings', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  mappings: jsonb('mappings').notNull().$type<Array<{
    sourceColumn: string;
    targetField: string;
    transformations?: Array<{
      type: 'lowercase' | 'uppercase' | 'trim' | 'date_format' | 'value_map';
      config?: Record<string, unknown>;
    }>;
    suggested?: boolean;
    confirmed?: boolean;
  }>>(),
  customFields: jsonb('custom_fields').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  sourceUnique: unique('field_mappings_source_unique').on(table.sourceId),
}));

// De-identification Configs
export const deidentificationConfigs = pgTable('deidentification_configs', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  rules: jsonb('rules').notNull().$type<Array<{
    id: string;
    type: 'name' | 'email' | 'phone' | 'address' | 'company' | 'custom';
    pattern?: string;
    replacement: string;
    enabled: boolean;
    isDefault?: boolean;
  }>>(),
  columnsToScan: jsonb('columns_to_scan').$type<string[]>(),
  piiScanResults: jsonb('pii_scan_results').$type<{
    summary: Record<string, number>;
    byColumn: Record<string, Record<string, number>>;
    samples: Array<{
      type: string;
      column: string;
      originalValue: string;
      rowIndex: number;
    }>;
    scannedAt: string;
  }>(),
  approvedAt: timestamp('approved_at'),
  approvedById: integer('approved_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  sourceUnique: unique('deidentification_source_unique').on(table.sourceId),
}));

// Filter Configs
export const filterConfigs = pgTable('filter_configs', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  filters: jsonb('filters').notNull().$type<{
    minConversationLength?: number;
    minContentLength?: number;
    statusInclude?: string[];
    statusExclude?: string[];
    categoryInclude?: string[];
    dateRange?: {
      start?: string;
      end?: string;
    };
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  sourceUnique: unique('filter_configs_source_unique').on(table.sourceId),
}));

// Processing Runs
export const processingRuns = pgTable('processing_runs', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  startedById: integer('started_by_id').notNull().references(() => users.id),
  status: processingStatusEnum('status').default('pending').notNull(),
  outputFormat: outputFormatEnum('output_format').notNull(),
  configSnapshot: jsonb('config_snapshot').$type<{
    mappings: unknown;
    deidentification: unknown;
    filters: unknown;
  }>(),
  processedCount: integer('processed_count').default(0),
  totalCount: integer('total_count'),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  sourceIdx: index('processing_runs_source_idx').on(table.sourceId),
  statusIdx: index('processing_runs_status_idx').on(table.status),
}));

// Outputs
export const outputs = pgTable('outputs', {
  id: serial('id').primaryKey(),
  processingRunId: integer('processing_run_id').notNull().references(() => processingRuns.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 255 }).notNull(),
  format: outputFormatEnum('format').notNull(),
  fileSize: integer('file_size').notNull(),
  recordCount: integer('record_count').notNull(),
  fileData: text('file_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  runIdx: index('outputs_run_idx').on(table.processingRunId),
}));

// API Connections
export const apiConnections = pgTable('api_connections', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  type: connectionTypeEnum('type').notNull(),
  credentialsEncrypted: text('credentials_encrypted').notNull(),
  credentialsIv: text('credentials_iv').notNull(),
  credentialsAuthTag: text('credentials_auth_tag').notNull(),
  status: connectionStatusEnum('status').default('active').notNull(),
  lastTestedAt: timestamp('last_tested_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('api_connections_org_idx').on(table.organizationId),
}));

// Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id),
  projectId: integer('project_id').references(() => projects.id),
  sourceId: integer('source_id').references(() => sources.id),
  action: auditActionEnum('action').notNull(),
  details: jsonb('details').$type<Record<string, unknown>>(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgDateIdx: index('audit_logs_org_date_idx').on(table.organizationId, table.createdAt),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  userIdx: index('audit_logs_user_idx').on(table.userId),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  invitations: many(invitations),
  projects: many(projects),
  apiConnections: many(apiConnections),
  auditLogs: many(auditLogs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  refreshTokens: many(refreshTokens),
  passwordResetTokens: many(passwordResetTokens),
  sentInvitations: many(invitations),
  processingRuns: many(processingRuns),
  auditLogs: many(auditLogs),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [invitations.organizationId],
    references: [organizations.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedById],
    references: [users.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  sources: many(sources),
  auditLogs: many(auditLogs),
}));

export const sourcesRelations = relations(sources, ({ one, many }) => ({
  project: one(projects, {
    fields: [sources.projectId],
    references: [projects.id],
  }),
  connection: one(apiConnections, {
    fields: [sources.connectionId],
    references: [apiConnections.id],
  }),
  sourceData: many(sourceData),
  fieldMapping: one(fieldMappings),
  deidentificationConfig: one(deidentificationConfigs),
  filterConfig: one(filterConfigs),
  processingRuns: many(processingRuns),
  auditLogs: many(auditLogs),
}));

export const sourceDataRelations = relations(sourceData, ({ one }) => ({
  source: one(sources, {
    fields: [sourceData.sourceId],
    references: [sources.id],
  }),
}));

export const fieldMappingsRelations = relations(fieldMappings, ({ one }) => ({
  source: one(sources, {
    fields: [fieldMappings.sourceId],
    references: [sources.id],
  }),
}));

export const deidentificationConfigsRelations = relations(deidentificationConfigs, ({ one }) => ({
  source: one(sources, {
    fields: [deidentificationConfigs.sourceId],
    references: [sources.id],
  }),
  approvedBy: one(users, {
    fields: [deidentificationConfigs.approvedById],
    references: [users.id],
  }),
}));

export const filterConfigsRelations = relations(filterConfigs, ({ one }) => ({
  source: one(sources, {
    fields: [filterConfigs.sourceId],
    references: [sources.id],
  }),
}));

export const processingRunsRelations = relations(processingRuns, ({ one, many }) => ({
  source: one(sources, {
    fields: [processingRuns.sourceId],
    references: [sources.id],
  }),
  startedBy: one(users, {
    fields: [processingRuns.startedById],
    references: [users.id],
  }),
  outputs: many(outputs),
}));

export const outputsRelations = relations(outputs, ({ one }) => ({
  processingRun: one(processingRuns, {
    fields: [outputs.processingRunId],
    references: [processingRuns.id],
  }),
}));

export const apiConnectionsRelations = relations(apiConnections, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [apiConnections.organizationId],
    references: [organizations.id],
  }),
  sources: many(sources),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [auditLogs.projectId],
    references: [projects.id],
  }),
  source: one(sources, {
    fields: [auditLogs.sourceId],
    references: [sources.id],
  }),
}));
