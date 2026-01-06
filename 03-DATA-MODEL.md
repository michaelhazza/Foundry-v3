# Data Model Specification: Foundry

## Document Information

| Field | Value |
|-------|-------|
| Document ID | 03-DATA-MODEL |
| Version | 1.0 |
| Last Updated | January 6, 2026 |
| Status | COMPLETE |
| Owner | Agent 3: Data Modeling |

## Input Documents Referenced

| Document | Version | Key Extractions |
|----------|---------|-----------------|
| 01-PRD.md | 1.0 | 81 user stories, 9 features, 4 personas |
| 02-ARCHITECTURE.md | 1.0 | PostgreSQL (Neon), Drizzle ORM, JWT auth, Organization-based multi-tenancy |

---

## 1. Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Database | PostgreSQL | 15+ (Neon) |
| ORM | Drizzle ORM | latest |
| Migration Tool | drizzle-kit | latest |
| TypeScript Runner | tsx | latest |
| Platform | Replit | - |

### Replit Database Configuration

**Environment Variable:**
```
DATABASE_URL=postgresql://user:password@host:port/database
```

**Package.json Scripts:**
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "tsx node_modules/drizzle-kit/bin.cjs push --force",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## 2. Entity-Relationship Diagram

```mermaid
erDiagram
    organizations ||--o{ users : "has members"
    organizations ||--o{ projects : "contains"
    organizations ||--o{ api_connections : "owns"
    organizations ||--o{ audit_logs : "tracks"
    organizations ||--o{ invitations : "sends"
    
    users ||--o{ invitations : "invites"
    users ||--o{ refresh_tokens : "has"
    users ||--o{ password_reset_tokens : "requests"
    users ||--o{ audit_logs : "performs"
    users ||--o{ processing_runs : "triggers"
    
    projects ||--o{ sources : "contains"
    
    sources ||--o{ source_data : "stores"
    sources ||--|| field_mappings : "has"
    sources ||--|| deidentification_configs : "has"
    sources ||--|| filter_configs : "has"
    sources ||--o{ processing_runs : "generates"
    
    api_connections ||--o{ sources : "provides data to"
    
    processing_runs ||--o{ outputs : "produces"
    
    organizations {
        serial id PK
        varchar name
        timestamp created_at
        timestamp updated_at
    }
    
    users {
        serial id PK
        integer org_id FK
        varchar email UK
        varchar password_hash
        varchar name
        user_role_enum role
        integer failed_attempts
        timestamp locked_until
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }
    
    invitations {
        serial id PK
        integer org_id FK
        integer invited_by FK
        varchar email
        varchar token_hash
        user_role_enum role
        invitation_status_enum status
        timestamp expires_at
        timestamp accepted_at
        timestamp created_at
    }
    
    refresh_tokens {
        serial id PK
        integer user_id FK
        varchar token_hash
        timestamp expires_at
        timestamp revoked_at
        timestamp created_at
    }
    
    password_reset_tokens {
        serial id PK
        integer user_id FK
        varchar token_hash
        timestamp expires_at
        timestamp used_at
        timestamp created_at
    }
    
    projects {
        serial id PK
        integer org_id FK
        varchar name
        text description
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }
    
    sources {
        serial id PK
        integer project_id FK
        integer api_connection_id FK
        varchar name
        source_type_enum type
        source_status_enum status
        jsonb config
        jsonb detected_columns
        integer row_count
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }
    
    source_data {
        serial id PK
        integer source_id FK
        integer row_index
        jsonb data
        timestamp created_at
    }
    
    field_mappings {
        serial id PK
        integer source_id FK,UK
        jsonb mappings
        jsonb transformations
        timestamp created_at
        timestamp updated_at
    }
    
    deidentification_configs {
        serial id PK
        integer source_id FK,UK
        jsonb rules
        jsonb detected_pii
        timestamp pii_scanned_at
        timestamp created_at
        timestamp updated_at
    }
    
    filter_configs {
        serial id PK
        integer source_id FK,UK
        jsonb filters
        integer total_count
        integer filtered_count
        timestamp created_at
        timestamp updated_at
    }
    
    processing_runs {
        serial id PK
        integer source_id FK
        integer triggered_by FK
        processing_status_enum status
        output_format_enum output_format
        jsonb config_snapshot
        integer total_records
        integer processed_records
        text error_message
        timestamp started_at
        timestamp completed_at
        timestamp created_at
    }
    
    outputs {
        serial id PK
        integer processing_run_id FK
        output_format_enum format
        bytea file_data
        integer file_size
        integer record_count
        timestamp created_at
    }
    
    api_connections {
        serial id PK
        integer org_id FK
        api_connection_type_enum type
        varchar name
        bytea encrypted_credentials
        varchar iv
        varchar auth_tag
        connection_status_enum status
        timestamp last_tested_at
        timestamp created_at
        timestamp updated_at
    }
    
    audit_logs {
        serial id PK
        integer org_id FK
        integer user_id FK
        varchar action
        varchar resource_type
        integer resource_id
        jsonb details
        varchar ip_address
        timestamp created_at
    }
```

---

## 3. Enum Definitions

```typescript
// shared/schema.ts - Enum definitions

import { pgEnum } from "drizzle-orm/pg-core";

// User role within organization
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "member"
]);

// Invitation status
export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "cancelled",
  "expired"
]);

// Source type (file upload or API)
export const sourceTypeEnum = pgEnum("source_type", [
  "file_upload",
  "api"
]);

// Source status
export const sourceStatusEnum = pgEnum("source_status", [
  "pending",
  "parsing",
  "ready",
  "error"
]);

// API connection type
export const apiConnectionTypeEnum = pgEnum("api_connection_type", [
  "teamwork_desk"
]);

// API connection status
export const connectionStatusEnum = pgEnum("connection_status", [
  "active",
  "invalid",
  "error"
]);

// Processing run status
export const processingStatusEnum = pgEnum("processing_status", [
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled"
]);

// Output format
export const outputFormatEnum = pgEnum("output_format", [
  "conversational_jsonl",
  "qa_pairs_jsonl",
  "raw_json"
]);

// Audit action types
export const auditActionEnum = pgEnum("audit_action", [
  "user_login",
  "user_logout",
  "user_login_failed",
  "user_invited",
  "user_removed",
  "user_role_changed",
  "password_reset_requested",
  "password_reset_completed",
  "password_changed",
  "org_updated",
  "project_created",
  "project_updated",
  "project_deleted",
  "source_created",
  "source_updated",
  "source_deleted",
  "mapping_updated",
  "deidentification_updated",
  "filter_updated",
  "processing_started",
  "processing_completed",
  "processing_failed",
  "processing_cancelled",
  "output_downloaded",
  "connection_created",
  "connection_updated",
  "connection_deleted",
  "connection_tested"
]);
```

---

## 4. Entity Definitions

### Entity: organizations

**Source:** PRD US-ORG-001 through US-ORG-004, Architecture Section 1 (tenant boundary)

**Purpose:** Represents a tenant in the multi-tenant system. All other entities are scoped to an organization.

**Drizzle Schema:**
```typescript
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Field Details:**

| Field | Type | Nullable | Default | Constraints | Notes |
|-------|------|----------|---------|-------------|-------|
| id | serial | NO | auto | PK | Auto-incrementing |
| name | varchar(100) | NO | - | - | Organization display name |
| created_at | timestamp | NO | NOW() | - | Creation timestamp |
| updated_at | timestamp | NO | NOW() | - | Last modification |

---

### Entity: users

**Source:** PRD US-AUTH-001 through US-AUTH-009, Architecture Section 5 (Auth)

**Purpose:** Stores user accounts for authentication. Users belong to exactly one organization.

**Drizzle Schema:**
```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  role: userRoleEnum("role").default("member").notNull(),
  failedAttempts: integer("failed_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  emailOrgIdx: uniqueIndex("users_email_org_idx").on(table.email, table.orgId),
  orgIdx: index("users_org_id_idx").on(table.orgId),
}));
```

**Field Details:**

| Field | Type | Nullable | Default | Constraints | Notes |
|-------|------|----------|---------|-------------|-------|
| id | serial | NO | auto | PK | Auto-incrementing |
| org_id | integer | NO | - | FK → organizations.id | Organization membership |
| email | varchar(255) | NO | - | UNIQUE per org | User's email address |
| password_hash | varchar(255) | NO | - | - | bcrypt hash (cost 12) |
| name | varchar(100) | NO | - | - | User's display name |
| role | user_role | NO | 'member' | - | admin or member |
| failed_attempts | integer | NO | 0 | - | Login failure count |
| locked_until | timestamp | YES | NULL | - | Account lockout expiry |
| created_at | timestamp | NO | NOW() | - | Creation timestamp |
| updated_at | timestamp | NO | NOW() | - | Last modification |
| deleted_at | timestamp | YES | NULL | - | Soft delete marker |

---

### Entity: invitations

**Source:** PRD US-AUTH-001, US-AUTH-008, US-AUTH-009, Architecture Section 5 (Registration Flow)

**Purpose:** Stores pending user invitations. Tokens expire after 7 days.

**Drizzle Schema:**
```typescript
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  invitedBy: integer("invited_by").references(() => users.id, { onDelete: "set null" }),
  email: varchar("email", { length: 255 }).notNull(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("member").notNull(),
  status: invitationStatusEnum("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tokenHashIdx: uniqueIndex("invitations_token_hash_idx").on(table.tokenHash),
  orgIdx: index("invitations_org_id_idx").on(table.orgId),
  emailOrgIdx: index("invitations_email_org_idx").on(table.email, table.orgId),
  statusIdx: index("invitations_status_idx").on(table.status),
}));
```

**Field Details:**

| Field | Type | Nullable | Default | Constraints | Notes |
|-------|------|----------|---------|-------------|-------|
| id | serial | NO | auto | PK | Auto-incrementing |
| org_id | integer | NO | - | FK → organizations.id | Target organization |
| invited_by | integer | YES | NULL | FK → users.id | Inviting admin (NULL if deleted) |
| email | varchar(255) | NO | - | - | Invitee email |
| token_hash | varchar(255) | NO | - | UNIQUE | Hashed invitation token |
| role | user_role | NO | 'member' | - | Role to assign on accept |
| status | invitation_status | NO | 'pending' | - | Current invitation state |
| expires_at | timestamp | NO | - | - | 7 days from creation |
| accepted_at | timestamp | YES | NULL | - | When invitation was used |
| created_at | timestamp | NO | NOW() | - | Creation timestamp |

---

### Entity: refresh_tokens

**Source:** Architecture Section 5 (Token Management)

**Purpose:** Stores refresh tokens for JWT session management. Tokens are single-use with rotation.

**Drizzle Schema:**
```typescript
export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tokenHashIdx: uniqueIndex("refresh_tokens_token_hash_idx").on(table.tokenHash),
  userIdx: index("refresh_tokens_user_id_idx").on(table.userId),
  expiresIdx: index("refresh_tokens_expires_at_idx").on(table.expiresAt),
}));
```

**Field Details:**

| Field | Type | Nullable | Default | Constraints | Notes |
|-------|------|----------|---------|-------------|-------|
| id | serial | NO | auto | PK | Auto-incrementing |
| user_id | integer | NO | - | FK → users.id | Token owner |
| token_hash | varchar(255) | NO | - | UNIQUE | Hashed refresh token |
| expires_at | timestamp | NO | - | - | 7 days from creation |
| revoked_at | timestamp | YES | NULL | - | When manually revoked |
| created_at | timestamp | NO | NOW() | - | Creation timestamp |

---

### Entity: password_reset_tokens

**Source:** PRD US-AUTH-004, Architecture Section 5 (Password Reset Flow)

**Purpose:** Stores password reset tokens. Tokens expire after 1 hour.

**Drizzle Schema:**
```typescript
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tokenHashIdx: uniqueIndex("password_reset_tokens_token_hash_idx").on(table.tokenHash),
  userIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
}));
```

**Field Details:**

| Field | Type | Nullable | Default | Constraints | Notes |
|-------|------|----------|---------|-------------|-------|
| id | serial | NO | auto | PK | Auto-incrementing |
| user_id | integer | NO | - | FK → users.id | User requesting reset |
| token_hash | varchar(255) | NO | - | UNIQUE | Hashed reset token |
| expires_at | timestamp | NO | - | - | 1 hour from creation |
| used_at | timestamp | YES | NULL | - | When token was used |
| created_at | timestamp | NO | NOW() | - | Creation timestamp |

---

### Entity: projects

**Source:** PRD US-PROJ-001 through US-PROJ-006, Architecture Section 4

**Purpose:** Organizes data processing work. Projects contain sources and are scoped to an organization.

**Drizzle Schema:**
```typescript
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  orgIdx: index("projects_org_id_idx").on(table.orgId),
  createdAtIdx: index("projects_created_at_idx").on(table.createdAt),
}));
```

**Field Details:**

| Field | Type | Nullable | Default | Constraints | Notes |
|-------|------|----------|---------|-------------|-------|
| id | serial | NO | auto | PK | Auto-incrementing |
| org_id | integer | NO | - | FK → organizations.id | Owning organization |
| name | varchar(100) | NO | - | - | Project display name |
| description | text | YES | NULL | - | Optional description (max 500) |
| created_at | timestamp | NO | NOW() | - | Creation timestamp |
| updated_at | timestamp | NO | NOW() | - | Last modification |
| deleted_at | timestamp | YES | NULL | - | Soft delete marker |

---

### Entity: api_connections

**Source:** PRD US-API-001 through US-API-006, Architecture Section 7 (Integration Authentication Storage)

**Purpose:** Stores encrypted credentials for third-party API connections. Organization-level resource.

**Drizzle Schema:**
```typescript
export const apiConnections = pgTable("api_connections", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  type: apiConnectionTypeEnum("type").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  encryptedCredentials: text("encrypted_credentials").notNull(),
  iv: varchar("iv", { length: 32 }).notNull(),
  authTag: varchar("auth_tag", { length: 32 }).notNull(),
  status: connectionStatusEnum("status").default("active").notNull(),
  lastTestedAt: timestamp("last_tested_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("api_connections_org_id_idx").on(table.orgId),
  typeIdx: index("api_connections_type_idx").on(table.type),
}));
```

**Field Details:**

| Field | Type | Nullable | Default | Constraints | Notes |
|-------|------|----------|---------|-------------|-------|
| id | serial | NO | auto | PK | Auto-incrementing |
| org_id | integer | NO | - | FK → organizations.id | Owning organization |
| type | api_connection_type | NO | - | - | teamwork_desk (MVP) |
| name | varchar(100) | NO | - | - | User-friendly connection name |
| encrypted_credentials | text | NO | - | - | AES-256-GCM encrypted JSON |
| iv | varchar(32) | NO | - | - | Initialization vector (hex) |
| auth_tag | varchar(32) | NO | - | - | Authentication tag (hex) |
| status | connection_status | NO | 'active' | - | Current connection state |
| last_tested_at | timestamp | YES | NULL | - | Last successful test |
| created_at | timestamp | NO | NOW() | - | Creation timestamp |
| updated_at | timestamp | NO | NOW() | - | Last modification |

---

### Entity: sources

**Source:** PRD US-FILE-001 through US-FILE-007, US-SRC-001 through US-SRC-006, US-API-002

**Purpose:** Represents a data source (file upload or API fetch) within a project.

**Drizzle Schema:**
```typescript
export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  apiConnectionId: integer("api_connection_id").references(() => apiConnections.id, { onDelete: "set null" }),
  name: varchar("name", { length: 100 }).notNull(),
  type: sourceTypeEnum("type").notNull(),
  status: sourceStatusEnum("status").default("pending").notNull(),
  originalFilename: varchar("original_filename", { length: 255 }),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size"),
  fileData: text("file_data"), // Base64 encoded for <10MB, NULL for larger
  config: jsonb("config"), // API fetch config, sheet selection, JSON path
  detectedColumns: jsonb("detected_columns"), // Array of column metadata
  rowCount: integer("row_count"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  projectIdx: index("sources_project_id_idx").on(table.projectId),
  statusIdx: index("sources_status_idx").on(table.status),
  typeIdx: index("sources_type_idx").on(table.type),
  apiConnectionIdx: index("sources_api_connection_id_idx").on(table.apiConnectionId),
}));
```

**Field Details:**

| Field | Type | Nullable | Default | Constraints | Notes |
|-------|------|----------|---------|-------------|-------|
| id | serial | NO | auto | PK | Auto-incrementing |
| project_id | integer | NO | - | FK → projects.id | Parent project |
| api_connection_id | integer | YES | NULL | FK → api_connections.id | For API sources |
| name | varchar(100) | NO | - | - | Source display name |
| type | source_type | NO | - | - | file_upload or api |
| status | source_status | NO | 'pending' | - | Current parsing state |
| original_filename | varchar(255) | YES | NULL | - | For file uploads |
| mime_type | varchar(100) | YES | NULL | - | File MIME type |
| file_size | integer | YES | NULL | - | File size in bytes |
| file_data | text | YES | NULL | - | Base64 encoded file (<10MB) |
| config | jsonb | YES | NULL | - | Source-specific configuration |
| detected_columns | jsonb | YES | NULL | - | Parsed column metadata |
| row_count | integer | YES | NULL | - | Total rows detected |
| error_message | text | YES | NULL | - | Parsing error details |
| created_at | timestamp | NO | NOW() | - | Creation timestamp |
| updated_at | timestamp | NO | NOW() | - | Last modification |
| deleted_at | timestamp | YES | NULL | - | Soft delete marker |

**Config JSONB Structure (by type):**

```typescript
// For file_upload
{
  selectedSheet?: string;  // For Excel files
  jsonPath?: string;       // For JSON files with nested data
  hasHeaders?: boolean;    // Whether first row is headers
}

// For api (Teamwork Desk)
{
  subdomain: string;
  dataType: "tickets";
  projectFilter?: string[];
  dateRange?: { start: string; end: string };
  statusFilter?: string[];
}
```

**Detected Columns JSONB Structure:**

```typescript
{
  columns: Array<{
    name: string;
    index: number;
    detectedType: "string" | "number" | "date" | "boolean";
    sampleValues: string[];  // First 3 non-empty values
    nullCount: number;
  }>;
}
```

---

### Entity: source_data

**Source:** Architecture Section 6 (Data Architecture Overview)

**Purpose:** Stores parsed row data from sources. Each row is a JSONB document.

**Drizzle Schema:**
```typescript
export const sourceData = pgTable("source_data", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => sources.id, { onDelete: "cascade" }).notNull(),
  rowIndex: integer("row_index").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sourceIdx: index("source_data_source_id_idx").on(table.sourceId),
  sourceRowIdx: uniqueIndex("source_data_source_row_idx").on(table.sourceId, table.rowIndex),
}));
```

**Field Details:**

| Field | Type | Nullable | Default | Constraints | Notes |
|-------|------|----------|---------|-------------|-------|
| id | serial | NO | auto | PK | Auto-incrementing |
| source_id | integer | NO | - | FK → sources.id | Parent source |
| row_index | integer | NO | - | - | Row position (0-based) |
| data | jsonb | NO | - | - | Row data as key-value pairs |
| created_at | timestamp | NO | NOW() | - | Creation timestamp |

**Data JSONB Structure:**

```typescript
{
  [columnName: string]: string | number | boolean | null;
}
```

---

### Entity: field_mappings

**Source:** PRD US-MAP-001 through US-MAP-007, Architecture Section 4 (Mapping Module)

**Purpose:** Stores field mapping configuration for a source. One-to-one with sources.

**Drizzle Schema:**
```typescript
export const fieldMappings = pgTable("field_mappings", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => sources.id, { onDelete: "cascade" }).notNull().unique(),
  mappings: jsonb("mappings").notNull().default('[]'),
  customFields: jsonb("custom_fields").notNull().default('[]'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  sourceIdx: uniqueIndex("field_mappings_source_id_idx").on(table.sourceId),
}));
```

**Field Details:**

| Field | Type | Nullable | Default | Constraints | Notes |
|-------|------|----------|---------|-------------|-------|
| id | serial | NO | auto | PK | Auto-incrementing |
| source_id | integer | NO | - | FK → sources.id, UNIQUE | Parent source |
| mappings | jsonb | NO | '[]' | - | Array of field mappings |
| custom_fields | jsonb | NO | '[]' | - | User-defined target fields |
| created_at | timestamp | NO | NOW() | - | Creation timestamp |
| updated_at | timestamp | NO | NOW() | - | Last modification |

**Mappings JSONB Structure:**

```typescript
{
  mappings: Array<{
    sourceColumn: string;
    targetField: string;  // conversation_id, timestamp, role, content, etc.
    transformations?: Array<{
      type: "lowercase" | "uppercase" | "trim" | "date_format" | "value_map";
      config?: {
        format?: string;      // For date_format
        valueMap?: Record<string, string>;  // For value_map
      };
    }>;
    suggested?: boolean;  // Was this auto-suggested?
    confirmed?: boolean;  // Has user confirmed suggestion?
  }>;
  customFields: string[];  // User-defined target field names
}
```

---

### Entity: deidentification_configs

**Source:** PRD US-PII-001 through US-PII-008, Architecture Section 4 (PII Module)

**Purpose:** Stores de-identification rules and PII detection results for a source.

**Drizzle Schema:**
```typescript
export const deidentificationConfigs = pgTable("deidentification_configs", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => sources.id, { onDelete: "cascade" }).notNull().unique(),
  rules: jsonb("rules").notNull().default('[]'),
  columnsToScan: jsonb("columns_to_scan").notNull().default('[]'),
  detectedPii: jsonb("detected_pii"),
  piiScannedAt: timestamp("pii_scanned_at"),
  approvedAt: timestamp("approved_at"),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  sourceIdx: uniqueIndex("deidentification_configs_source_id_idx").on(table.sourceId),
}));
```

**Field Details:**

| Field | Type | Nullable | Default | Constraints | Notes |
|-------|------|----------|---------|-------------|-------|
| id | serial | NO | auto | PK | Auto-incrementing |
| source_id | integer | NO | - | FK → sources.id, UNIQUE | Parent source |
| rules | jsonb | NO | '[]' | - | De-identification rules |
| columns_to_scan | jsonb | NO | '[]' | - | Columns selected for PII scan |
| detected_pii | jsonb | YES | NULL | - | PII detection results |
| pii_scanned_at | timestamp | YES | NULL | - | When PII scan completed |
| approved_at | timestamp | YES | NULL | - | User approval timestamp |
| approved_by | integer | YES | NULL | FK → users.id | Approving user |
| created_at | timestamp | NO | NOW() | - | Creation timestamp |
| updated_at | timestamp | NO | NOW() | - | Last modification |

**Rules JSONB Structure:**

```typescript
{
  rules: Array<{
    id: string;
    type: "name" | "email" | "phone" | "address" | "company" | "custom";
    pattern?: string;  // Regex pattern (for custom rules)
    replacement: string;  // e.g., "[PERSON_N]", "[EMAIL]", "[PHONE]"
    enabled: boolean;
    isDefault: boolean;
  }>;
  columnsToScan: string[];  // Column names to scan for PII
}
```

**Detected PII JSONB Structure:**

```typescript
{
  summary: {
    names: number;
    emails: number;
    phones: number;
    addresses: number;
    companies: number;
    custom: number;
  };
  samples: Array<{
    type: string;
    column: string;
    originalValue: string;
    rowIndex: number;
  }>;
  highDensityWarning: boolean;  // >20% of records contain PII
}
```

---

### Entity: filter_configs

**Source:** PRD US-FILT-001 through US-FILT-007, Architecture Section 4 (Filtering Module)

**Purpose:** Stores quality filter configuration for a source.

**Drizzle Schema:**
```typescript
export const filterConfigs = pgTable("filter_configs", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => sources.id, { onDelete: "cascade" }).notNull().unique(),
  filters: jsonb("filters").notNull().default('{}'),
  totalCount: integer("total_count"),
  filteredCount: integer("filtered_count"),
  filterBreakdown: jsonb("filter_breakdown"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  sourceIdx: uniqueIndex("filter_configs_source_id_idx").on(table.sourceId),
}));
```

**Field Details:**

| Field | Type | Nullable | Default | Constraints | Notes |
|-------|------|----------|---------|-------------|-------|
| id | serial | NO | auto | PK | Auto-incrementing |
| source_id | integer | NO | - | FK → sources.id, UNIQUE | Parent source |
| filters | jsonb | NO | '{}' | - | Filter configuration |
| total_count | integer | YES | NULL | - | Total records before filtering |
| filtered_count | integer | YES | NULL | - | Records passing filters |
| filter_breakdown | jsonb | YES | NULL | - | Exclusion counts by rule |
| created_at | timestamp | NO | NOW() | - | Creation timestamp |
| updated_at | timestamp | NO | NOW() | - | Last modification |

**Filters JSONB Structure:**

```typescript
{
  minConversationLength?: number;  // Minimum messages in conversation
  minContentLength?: number;       // Minimum characters in content field
  statusInclude?: string[];        // Status values to include
  statusExclude?: string[];        // Status values to exclude
  categoryInclude?: string[];      // Categories to include
  dateRange?: {
    start?: string;  // ISO date
    end?: string;    // ISO date
  };
}
```

**Filter Breakdown JSONB Structure:**

```typescript
{
  byRule: {
    minConversationLength?: number;  // Records excluded by this rule
    minContentLength?: number;
    status?: number;
    category?: number;
    dateRange?: number;
  };
  progressiveCounts: Array<{
    rule: string;
    remaining: number;
  }>;
}
```

---

### Entity: processing_runs

**Source:** PRD US-PROC-001 through US-PROC-009, Architecture Section 4 (Processing Module)

**Purpose:** Records each processing execution for a source, including configuration snapshot.

**Drizzle Schema:**
```typescript
export const processingRuns = pgTable("processing_runs", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => sources.id, { onDelete: "cascade" }).notNull(),
  triggeredBy: integer("triggered_by").references(() => users.id, { onDelete: "set null" }),
  status: processingStatusEnum("status").default("queued").notNull(),
  outputFormat: outputFormatEnum("output_format").notNull(),
  configSnapshot: jsonb("config_snapshot").notNull(),
  totalRecords: integer("total_records"),
  processedRecords: integer("processed_records").default(0).notNull(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sourceIdx: index("processing_runs_source_id_idx").on(table.sourceId),
  statusIdx: index("processing_runs_status_idx").on(table.status),
  createdAtIdx: index("processing_runs_created_at_idx").on(table.createdAt),
}));
```

**Field Details:**

| Field | Type | Nullable | Default | Constraints | Notes |
|-------|------|----------|---------|-------------|-------|
| id | serial | NO | auto | PK | Auto-incrementing |
| source_id | integer | NO | - | FK → sources.id | Parent source |
| triggered_by | integer | YES | NULL | FK → users.id | User who started run |
| status | processing_status | NO | 'queued' | - | Current processing state |
| output_format | output_format | NO | - | - | Selected output format |
| config_snapshot | jsonb | NO | - | - | Frozen configuration at run time |
| total_records | integer | YES | NULL | - | Records to process (after filters) |
| processed_records | integer | NO | 0 | - | Records processed so far |
| error_message | text | YES | NULL | - | Error details if failed |
| started_at | timestamp | YES | NULL | - | When processing began |
| completed_at | timestamp | YES | NULL | - | When processing finished |
| created_at | timestamp | NO | NOW() | - | Run creation time |

**Config Snapshot JSONB Structure:**

```typescript
{
  mappings: {...};           // Copy of field_mappings.mappings
  deidentification: {...};   // Copy of deidentification_configs.rules
  filters: {...};            // Copy of filter_configs.filters
}
```

---

### Entity: outputs

**Source:** PRD US-OUT-001 through US-OUT-004, Architecture Section 4 (Processing Module)

**Purpose:** Stores generated output files from processing runs.

**Drizzle Schema:**
```typescript
export const outputs = pgTable("outputs", {
  id: serial("id").primaryKey(),
  processingRunId: integer("processing_run_id").references(() => processingRuns.id, { onDelete: "cascade" }).notNull(),
  format: outputFormatEnum("format").notNull(),
  fileData: text("file_data"), // Base64 encoded for <10MB
  fileSize: integer("file_size").notNull(),
  recordCount: integer("record_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  processingRunIdx: index("outputs_processing_run_id_idx").on(table.processingRunId),
}));
```

**Field Details:**

| Field | Type | Nullable | Default | Constraints | Notes |
|-------|------|----------|---------|-------------|-------|
| id | serial | NO | auto | PK | Auto-incrementing |
| processing_run_id | integer | NO | - | FK → processing_runs.id | Parent processing run |
| format | output_format | NO | - | - | Output format used |
| file_data | text | YES | NULL | - | Base64 encoded output (<10MB) |
| file_size | integer | NO | - | - | File size in bytes |
| record_count | integer | NO | - | - | Records in output |
| created_at | timestamp | NO | NOW() | - | Generation timestamp |

---

### Entity: audit_logs

**Source:** PRD US-AUDIT-001 through US-AUDIT-004, Architecture Section 4 (Audit Module)

**Purpose:** Immutable event log for compliance and debugging. Organization-scoped.

**Drizzle Schema:**
```typescript
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: auditActionEnum("action").notNull(),
  resourceType: varchar("resource_type", { length: 50 }),
  resourceId: integer("resource_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("audit_logs_org_id_idx").on(table.orgId),
  userIdx: index("audit_logs_user_id_idx").on(table.userId),
  actionIdx: index("audit_logs_action_idx").on(table.action),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
  resourceIdx: index("audit_logs_resource_idx").on(table.resourceType, table.resourceId),
}));
```

**Field Details:**

| Field | Type | Nullable | Default | Constraints | Notes |
|-------|------|----------|---------|-------------|-------|
| id | serial | NO | auto | PK | Auto-incrementing |
| org_id | integer | NO | - | FK → organizations.id | Organization context |
| user_id | integer | YES | NULL | FK → users.id | Acting user (NULL if deleted) |
| action | audit_action | NO | - | - | Action performed |
| resource_type | varchar(50) | YES | NULL | - | Entity type affected |
| resource_id | integer | YES | NULL | - | Entity ID affected |
| details | jsonb | YES | NULL | - | Additional context |
| ip_address | varchar(45) | YES | NULL | - | Client IP (IPv4/IPv6) |
| created_at | timestamp | NO | NOW() | - | Event timestamp |

**Details JSONB Structure (varies by action):**

```typescript
// For user_role_changed
{
  previousRole: "member";
  newRole: "admin";
}

// For processing_completed
{
  recordCount: 5000;
  outputFormat: "conversational_jsonl";
  duration: 45000;  // ms
}

// For connection_tested
{
  success: true;
  responseTime: 234;  // ms
}
```

---

## 5. Relationship Definitions

### Relationship Matrix

| Entity A | Entity B | Type | FK Location | ON DELETE |
|----------|----------|------|-------------|-----------|
| organizations | users | 1:M | users.org_id | CASCADE |
| organizations | projects | 1:M | projects.org_id | CASCADE |
| organizations | api_connections | 1:M | api_connections.org_id | CASCADE |
| organizations | invitations | 1:M | invitations.org_id | CASCADE |
| organizations | audit_logs | 1:M | audit_logs.org_id | CASCADE |
| users | invitations | 1:M | invitations.invited_by | SET NULL |
| users | refresh_tokens | 1:M | refresh_tokens.user_id | CASCADE |
| users | password_reset_tokens | 1:M | password_reset_tokens.user_id | CASCADE |
| users | processing_runs | 1:M | processing_runs.triggered_by | SET NULL |
| users | audit_logs | 1:M | audit_logs.user_id | SET NULL |
| users | deidentification_configs | 1:M | deidentification_configs.approved_by | SET NULL |
| projects | sources | 1:M | sources.project_id | CASCADE |
| api_connections | sources | 1:M | sources.api_connection_id | SET NULL |
| sources | source_data | 1:M | source_data.source_id | CASCADE |
| sources | field_mappings | 1:1 | field_mappings.source_id | CASCADE |
| sources | deidentification_configs | 1:1 | deidentification_configs.source_id | CASCADE |
| sources | filter_configs | 1:1 | filter_configs.source_id | CASCADE |
| sources | processing_runs | 1:M | processing_runs.source_id | CASCADE |
| processing_runs | outputs | 1:M | outputs.processing_run_id | CASCADE |

### ON DELETE Behavior Rationale

| Relationship | ON DELETE | Rationale |
|--------------|-----------|-----------|
| org → users | CASCADE | Users cannot exist without organization |
| org → projects | CASCADE | Projects meaningless without organization |
| user → refresh_tokens | CASCADE | Tokens invalid without user |
| user → audit_logs | SET NULL | Preserve audit history, show "[Deleted User]" |
| user → invitations (invited_by) | SET NULL | Preserve invitation history |
| project → sources | CASCADE | Sources meaningless without project |
| source → source_data | CASCADE | Data meaningless without source |
| source → field_mappings | CASCADE | Config meaningless without source |
| api_connection → sources | SET NULL | Keep source, mark connection unavailable |
| processing_run → outputs | CASCADE | Outputs meaningless without run |

---

## 6. Index Definitions

### Primary Key Indexes (Automatic)

All tables have automatic indexes on their primary key `id` column.

### Foreign Key Indexes (Required for Join Performance)

| Table | Index Name | Column(s) |
|-------|------------|-----------|
| users | users_org_id_idx | org_id |
| invitations | invitations_org_id_idx | org_id |
| refresh_tokens | refresh_tokens_user_id_idx | user_id |
| password_reset_tokens | password_reset_tokens_user_id_idx | user_id |
| projects | projects_org_id_idx | org_id |
| api_connections | api_connections_org_id_idx | org_id |
| sources | sources_project_id_idx | project_id |
| sources | sources_api_connection_id_idx | api_connection_id |
| source_data | source_data_source_id_idx | source_id |
| field_mappings | field_mappings_source_id_idx | source_id |
| deidentification_configs | deidentification_configs_source_id_idx | source_id |
| filter_configs | filter_configs_source_id_idx | source_id |
| processing_runs | processing_runs_source_id_idx | source_id |
| outputs | outputs_processing_run_id_idx | processing_run_id |
| audit_logs | audit_logs_org_id_idx | org_id |
| audit_logs | audit_logs_user_id_idx | user_id |

### Unique Indexes

| Table | Index Name | Column(s) | Purpose |
|-------|------------|-----------|---------|
| users | users_email_org_idx | (email, org_id) | Email unique per org |
| invitations | invitations_token_hash_idx | token_hash | Token lookup |
| refresh_tokens | refresh_tokens_token_hash_idx | token_hash | Token lookup |
| password_reset_tokens | password_reset_tokens_token_hash_idx | token_hash | Token lookup |
| source_data | source_data_source_row_idx | (source_id, row_index) | Unique row per source |

### Query Pattern Indexes

| Table | Index Name | Column(s) | Query Pattern | User Story |
|-------|------------|-----------|---------------|------------|
| projects | projects_created_at_idx | created_at | Sort by date | US-PROJ-002 |
| sources | sources_status_idx | status | Filter by status | US-SRC-001 |
| sources | sources_type_idx | type | Filter by type | US-SRC-001 |
| invitations | invitations_status_idx | status | Filter pending | US-AUTH-008 |
| invitations | invitations_email_org_idx | (email, org_id) | Check existing | US-AUTH-001 |
| processing_runs | processing_runs_status_idx | status | Filter by status | US-PROC-005 |
| processing_runs | processing_runs_created_at_idx | created_at | Sort by date | US-PROC-005 |
| api_connections | api_connections_type_idx | type | Filter by type | US-API-001 |
| refresh_tokens | refresh_tokens_expires_at_idx | expires_at | Cleanup expired | Auth flow |
| audit_logs | audit_logs_action_idx | action | Filter by action | US-AUDIT-001 |
| audit_logs | audit_logs_created_at_idx | created_at | Sort by date | US-AUDIT-001 |
| audit_logs | audit_logs_resource_idx | (resource_type, resource_id) | Find by resource | US-AUDIT-001 |

---

## 7. Complete Schema File

```typescript
// shared/schema.ts

import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  integer, 
  boolean, 
  timestamp, 
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// ENUMS
// ============================================================

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "member"
]);

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "cancelled",
  "expired"
]);

export const sourceTypeEnum = pgEnum("source_type", [
  "file_upload",
  "api"
]);

export const sourceStatusEnum = pgEnum("source_status", [
  "pending",
  "parsing",
  "ready",
  "error"
]);

export const apiConnectionTypeEnum = pgEnum("api_connection_type", [
  "teamwork_desk"
]);

export const connectionStatusEnum = pgEnum("connection_status", [
  "active",
  "invalid",
  "error"
]);

export const processingStatusEnum = pgEnum("processing_status", [
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled"
]);

export const outputFormatEnum = pgEnum("output_format", [
  "conversational_jsonl",
  "qa_pairs_jsonl",
  "raw_json"
]);

export const auditActionEnum = pgEnum("audit_action", [
  "user_login",
  "user_logout",
  "user_login_failed",
  "user_invited",
  "user_removed",
  "user_role_changed",
  "password_reset_requested",
  "password_reset_completed",
  "password_changed",
  "org_updated",
  "project_created",
  "project_updated",
  "project_deleted",
  "source_created",
  "source_updated",
  "source_deleted",
  "mapping_updated",
  "deidentification_updated",
  "filter_updated",
  "processing_started",
  "processing_completed",
  "processing_failed",
  "processing_cancelled",
  "output_downloaded",
  "connection_created",
  "connection_updated",
  "connection_deleted",
  "connection_tested"
]);

// ============================================================
// TABLES
// ============================================================

// Organizations (Tenant boundary)
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  role: userRoleEnum("role").default("member").notNull(),
  failedAttempts: integer("failed_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  emailOrgIdx: uniqueIndex("users_email_org_idx").on(table.email, table.orgId),
  orgIdx: index("users_org_id_idx").on(table.orgId),
}));

// Invitations
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  invitedBy: integer("invited_by").references(() => users.id, { onDelete: "set null" }),
  email: varchar("email", { length: 255 }).notNull(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("member").notNull(),
  status: invitationStatusEnum("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tokenHashIdx: uniqueIndex("invitations_token_hash_idx").on(table.tokenHash),
  orgIdx: index("invitations_org_id_idx").on(table.orgId),
  emailOrgIdx: index("invitations_email_org_idx").on(table.email, table.orgId),
  statusIdx: index("invitations_status_idx").on(table.status),
}));

// Refresh Tokens
export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tokenHashIdx: uniqueIndex("refresh_tokens_token_hash_idx").on(table.tokenHash),
  userIdx: index("refresh_tokens_user_id_idx").on(table.userId),
  expiresIdx: index("refresh_tokens_expires_at_idx").on(table.expiresAt),
}));

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tokenHashIdx: uniqueIndex("password_reset_tokens_token_hash_idx").on(table.tokenHash),
  userIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
}));

// Projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  orgIdx: index("projects_org_id_idx").on(table.orgId),
  createdAtIdx: index("projects_created_at_idx").on(table.createdAt),
}));

// API Connections
export const apiConnections = pgTable("api_connections", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  type: apiConnectionTypeEnum("type").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  encryptedCredentials: text("encrypted_credentials").notNull(),
  iv: varchar("iv", { length: 32 }).notNull(),
  authTag: varchar("auth_tag", { length: 32 }).notNull(),
  status: connectionStatusEnum("status").default("active").notNull(),
  lastTestedAt: timestamp("last_tested_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("api_connections_org_id_idx").on(table.orgId),
  typeIdx: index("api_connections_type_idx").on(table.type),
}));

// Sources
export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  apiConnectionId: integer("api_connection_id").references(() => apiConnections.id, { onDelete: "set null" }),
  name: varchar("name", { length: 100 }).notNull(),
  type: sourceTypeEnum("type").notNull(),
  status: sourceStatusEnum("status").default("pending").notNull(),
  originalFilename: varchar("original_filename", { length: 255 }),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size"),
  fileData: text("file_data"),
  config: jsonb("config"),
  detectedColumns: jsonb("detected_columns"),
  rowCount: integer("row_count"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  projectIdx: index("sources_project_id_idx").on(table.projectId),
  statusIdx: index("sources_status_idx").on(table.status),
  typeIdx: index("sources_type_idx").on(table.type),
  apiConnectionIdx: index("sources_api_connection_id_idx").on(table.apiConnectionId),
}));

// Source Data (parsed rows)
export const sourceData = pgTable("source_data", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => sources.id, { onDelete: "cascade" }).notNull(),
  rowIndex: integer("row_index").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sourceIdx: index("source_data_source_id_idx").on(table.sourceId),
  sourceRowIdx: uniqueIndex("source_data_source_row_idx").on(table.sourceId, table.rowIndex),
}));

// Field Mappings
export const fieldMappings = pgTable("field_mappings", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => sources.id, { onDelete: "cascade" }).notNull().unique(),
  mappings: jsonb("mappings").notNull().default([]),
  customFields: jsonb("custom_fields").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  sourceIdx: uniqueIndex("field_mappings_source_id_idx").on(table.sourceId),
}));

// De-identification Configs
export const deidentificationConfigs = pgTable("deidentification_configs", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => sources.id, { onDelete: "cascade" }).notNull().unique(),
  rules: jsonb("rules").notNull().default([]),
  columnsToScan: jsonb("columns_to_scan").notNull().default([]),
  detectedPii: jsonb("detected_pii"),
  piiScannedAt: timestamp("pii_scanned_at"),
  approvedAt: timestamp("approved_at"),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  sourceIdx: uniqueIndex("deidentification_configs_source_id_idx").on(table.sourceId),
}));

// Filter Configs
export const filterConfigs = pgTable("filter_configs", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => sources.id, { onDelete: "cascade" }).notNull().unique(),
  filters: jsonb("filters").notNull().default({}),
  totalCount: integer("total_count"),
  filteredCount: integer("filtered_count"),
  filterBreakdown: jsonb("filter_breakdown"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  sourceIdx: uniqueIndex("filter_configs_source_id_idx").on(table.sourceId),
}));

// Processing Runs
export const processingRuns = pgTable("processing_runs", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => sources.id, { onDelete: "cascade" }).notNull(),
  triggeredBy: integer("triggered_by").references(() => users.id, { onDelete: "set null" }),
  status: processingStatusEnum("status").default("queued").notNull(),
  outputFormat: outputFormatEnum("output_format").notNull(),
  configSnapshot: jsonb("config_snapshot").notNull(),
  totalRecords: integer("total_records"),
  processedRecords: integer("processed_records").default(0).notNull(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sourceIdx: index("processing_runs_source_id_idx").on(table.sourceId),
  statusIdx: index("processing_runs_status_idx").on(table.status),
  createdAtIdx: index("processing_runs_created_at_idx").on(table.createdAt),
}));

// Outputs
export const outputs = pgTable("outputs", {
  id: serial("id").primaryKey(),
  processingRunId: integer("processing_run_id").references(() => processingRuns.id, { onDelete: "cascade" }).notNull(),
  format: outputFormatEnum("format").notNull(),
  fileData: text("file_data"),
  fileSize: integer("file_size").notNull(),
  recordCount: integer("record_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  processingRunIdx: index("outputs_processing_run_id_idx").on(table.processingRunId),
}));

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: auditActionEnum("action").notNull(),
  resourceType: varchar("resource_type", { length: 50 }),
  resourceId: integer("resource_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("audit_logs_org_id_idx").on(table.orgId),
  userIdx: index("audit_logs_user_id_idx").on(table.userId),
  actionIdx: index("audit_logs_action_idx").on(table.action),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
  resourceIdx: index("audit_logs_resource_idx").on(table.resourceType, table.resourceId),
}));

// ============================================================
// RELATIONS (for Drizzle query builder)
// ============================================================

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  projects: many(projects),
  apiConnections: many(apiConnections),
  invitations: many(invitations),
  auditLogs: many(auditLogs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.orgId],
    references: [organizations.id],
  }),
  invitationsSent: many(invitations),
  refreshTokens: many(refreshTokens),
  passwordResetTokens: many(passwordResetTokens),
  processingRuns: many(processingRuns),
  auditLogs: many(auditLogs),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [invitations.orgId],
    references: [organizations.id],
  }),
  inviter: one(users, {
    fields: [invitations.invitedBy],
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
    fields: [projects.orgId],
    references: [organizations.id],
  }),
  sources: many(sources),
}));

export const apiConnectionsRelations = relations(apiConnections, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [apiConnections.orgId],
    references: [organizations.id],
  }),
  sources: many(sources),
}));

export const sourcesRelations = relations(sources, ({ one, many }) => ({
  project: one(projects, {
    fields: [sources.projectId],
    references: [projects.id],
  }),
  apiConnection: one(apiConnections, {
    fields: [sources.apiConnectionId],
    references: [apiConnections.id],
  }),
  sourceData: many(sourceData),
  fieldMapping: one(fieldMappings),
  deidentificationConfig: one(deidentificationConfigs),
  filterConfig: one(filterConfigs),
  processingRuns: many(processingRuns),
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
  approver: one(users, {
    fields: [deidentificationConfigs.approvedBy],
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
  triggeredByUser: one(users, {
    fields: [processingRuns.triggeredBy],
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

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// ============================================================
// TYPE EXPORTS (for type-safe queries)
// ============================================================

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ApiConnection = typeof apiConnections.$inferSelect;
export type NewApiConnection = typeof apiConnections.$inferInsert;

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;

export type SourceData = typeof sourceData.$inferSelect;
export type NewSourceData = typeof sourceData.$inferInsert;

export type FieldMapping = typeof fieldMappings.$inferSelect;
export type NewFieldMapping = typeof fieldMappings.$inferInsert;

export type DeidentificationConfig = typeof deidentificationConfigs.$inferSelect;
export type NewDeidentificationConfig = typeof deidentificationConfigs.$inferInsert;

export type FilterConfig = typeof filterConfigs.$inferSelect;
export type NewFilterConfig = typeof filterConfigs.$inferInsert;

export type ProcessingRun = typeof processingRuns.$inferSelect;
export type NewProcessingRun = typeof processingRuns.$inferInsert;

export type Output = typeof outputs.$inferSelect;
export type NewOutput = typeof outputs.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
```

---

## 8. Database Connection

```typescript
// server/db.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Connection pool configuration for Replit
const client = postgres(process.env.DATABASE_URL, {
  max: 10,              // Maximum connections in pool
  idle_timeout: 20,     // Close idle connections after 20 seconds
  connect_timeout: 10,  // Connection timeout
});

export const db = drizzle(client, { schema });
```

---

## 9. Drizzle Configuration

```typescript
// drizzle.config.ts

import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
```

---

## 10. Migration Strategy

### Initial Schema Push

```bash
npm run db:push
# Executes: tsx node_modules/drizzle-kit/bin.cjs push --force
```

**Note:** The `tsx` wrapper is required for drizzle-kit commands in ESM projects to avoid `require is not defined` errors.

### Programmatic Migration Runner (Backup)

```typescript
// src/db/migrate.ts

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

async function main() {
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete");
  await sql.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
```

### Table Creation Order

Due to foreign key dependencies, tables are created in this order:

1. **Independent tables (no FKs):**
   - organizations

2. **Tables with single FK dependency:**
   - users (depends on organizations)
   - projects (depends on organizations)
   - api_connections (depends on organizations)

3. **Tables with FK to users:**
   - invitations (depends on organizations, users)
   - refresh_tokens (depends on users)
   - password_reset_tokens (depends on users)

4. **Tables with multiple FK dependencies:**
   - sources (depends on projects, api_connections)
   - audit_logs (depends on organizations, users)

5. **Tables depending on sources:**
   - source_data (depends on sources)
   - field_mappings (depends on sources)
   - deidentification_configs (depends on sources, users)
   - filter_configs (depends on sources)
   - processing_runs (depends on sources, users)

6. **Final dependent tables:**
   - outputs (depends on processing_runs)

### Seed Data Requirements

| Table | Required Seed | Reason |
|-------|---------------|--------|
| organizations | At least one | Bootstrap first admin user |
| users | At least one admin | First login capability |

**Seed Script (server/seed.ts):**

```typescript
import { db } from "./db";
import { organizations, users } from "../shared/schema";
import bcrypt from "bcrypt";

async function seed() {
  // Create default organization
  const [org] = await db.insert(organizations).values({
    name: "Default Organization",
  }).returning();
  
  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  await db.insert(users).values({
    orgId: org.id,
    email: "admin@foundry.local",
    passwordHash,
    name: "Admin User",
    role: "admin",
  });
  
  console.log("Seed data inserted");
  console.log("Admin email: admin@foundry.local");
  console.log("Admin password: admin123");
}

seed().catch(console.error);
```

---

## Document Validation

### PRD Traceability Matrix

| User Story ID | Entities Required | Status |
|---------------|-------------------|--------|
| US-AUTH-001 | users, invitations, organizations | ✓ Covered |
| US-AUTH-002 | users, refresh_tokens | ✓ Covered |
| US-AUTH-003 | users | ✓ Covered |
| US-AUTH-004 | password_reset_tokens | ✓ Covered |
| US-AUTH-005 | refresh_tokens | ✓ Covered |
| US-AUTH-006 | users | ✓ Covered |
| US-AUTH-007 | users | ✓ Covered |
| US-AUTH-008 | invitations | ✓ Covered |
| US-AUTH-009 | invitations | ✓ Covered |
| US-ORG-001 | organizations | ✓ Covered |
| US-ORG-002 | organizations | ✓ Covered |
| US-ORG-003 | users, invitations | ✓ Covered |
| US-ORG-004 | users | ✓ Covered |
| US-PROJ-001 | projects | ✓ Covered |
| US-PROJ-002 | projects | ✓ Covered |
| US-PROJ-003 | projects | ✓ Covered |
| US-PROJ-004 | projects, sources, outputs | ✓ Covered |
| US-PROJ-005 | projects | ✓ Covered |
| US-PROJ-006 | projects, sources | ✓ Covered |
| US-FILE-001 | sources | ✓ Covered |
| US-FILE-002 | sources | ✓ Covered |
| US-FILE-003 | sources | ✓ Covered |
| US-FILE-004 | sources, source_data | ✓ Covered |
| US-FILE-005 | sources | ✓ Covered |
| US-FILE-006 | sources | ✓ Covered |
| US-FILE-007 | sources | ✓ Covered |
| US-SRC-001 | sources | ✓ Covered |
| US-SRC-002 | sources | ✓ Covered |
| US-SRC-003 | sources | ✓ Covered |
| US-SRC-004 | source_data | ✓ Covered |
| US-SRC-005 | sources | ✓ Covered |
| US-MAP-001 | field_mappings | ✓ Covered |
| US-MAP-002 | field_mappings | ✓ Covered |
| US-MAP-003 | field_mappings | ✓ Covered |
| US-MAP-004 | field_mappings, source_data | ✓ Covered |
| US-MAP-005 | field_mappings | ✓ Covered |
| US-MAP-006 | field_mappings | ✓ Covered |
| US-MAP-007 | field_mappings | ✓ Covered |
| US-PII-001 | deidentification_configs | ✓ Covered |
| US-PII-002 | deidentification_configs | ✓ Covered |
| US-PII-003 | deidentification_configs | ✓ Covered |
| US-PII-004 | deidentification_configs | ✓ Covered |
| US-PII-005 | deidentification_configs | ✓ Covered |
| US-PII-006 | deidentification_configs | ✓ Covered |
| US-PII-007 | deidentification_configs | ✓ Covered |
| US-PII-008 | deidentification_configs | ✓ Covered |
| US-FILT-001 | filter_configs | ✓ Covered |
| US-FILT-002 | filter_configs | ✓ Covered |
| US-FILT-003 | filter_configs | ✓ Covered |
| US-FILT-004 | filter_configs | ✓ Covered |
| US-FILT-005 | filter_configs | ✓ Covered |
| US-FILT-006 | filter_configs | ✓ Covered |
| US-FILT-007 | filter_configs | ✓ Covered |
| US-PROC-001 | processing_runs | ✓ Covered |
| US-PROC-002 | processing_runs, outputs | ✓ Covered |
| US-PROC-003 | outputs | ✓ Covered |
| US-PROC-004 | processing_runs | ✓ Covered |
| US-PROC-005 | processing_runs | ✓ Covered |
| US-PROC-006 | processing_runs | ✓ Covered |
| US-PROC-007 | processing_runs | ✓ Covered |
| US-PROC-008 | processing_runs | ✓ Covered |
| US-PROC-009 | processing_runs | ✓ Covered |
| US-OUT-001 | outputs | ✓ Covered |
| US-OUT-002 | outputs | ✓ Covered |
| US-OUT-003 | outputs | ✓ Covered |
| US-OUT-004 | outputs, processing_runs | ✓ Covered |
| US-API-001 | api_connections | ✓ Covered |
| US-API-002 | sources, api_connections | ✓ Covered |
| US-API-003 | sources | ✓ Covered |
| US-API-004 | api_connections | ✓ Covered |
| US-API-005 | api_connections, sources | ✓ Covered |
| US-API-006 | sources | ✓ Covered |
| US-AUDIT-001 | audit_logs, processing_runs | ✓ Covered |
| US-AUDIT-002 | audit_logs | ✓ Covered |
| US-AUDIT-003 | audit_logs | ✓ Covered |
| US-AUDIT-004 | audit_logs | ✓ Covered |

### Architecture Compliance Check

| Requirement | Status | Supporting Schema Element |
|-------------|--------|---------------------------|
| PostgreSQL database | ✓ | Drizzle pg-core types |
| JWT authentication | ✓ | users, refresh_tokens tables |
| Organization-based multi-tenancy | ✓ | org_id FK on all tenant-scoped tables |
| Role-based access control | ✓ | users.role enum (admin/member) |
| Encrypted API credentials | ✓ | api_connections with encrypted_credentials, iv, auth_tag |
| Audit logging | ✓ | audit_logs table with action enum |
| Soft delete pattern | ✓ | deleted_at on users, projects, sources |
| 50MB file storage | ✓ | sources.file_data (text/base64) |
| JSONB configuration storage | ✓ | All config fields use jsonb type |

### Schema Integrity Check

- [x] All tables have id, created_at
- [x] All tables with user-editable data have updated_at
- [x] Soft-delete tables have deleted_at (users, projects, sources)
- [x] All foreign keys have indexes
- [x] All foreign keys have ON DELETE specified
- [x] All enum fields use pgEnum
- [x] All unique fields have UNIQUE constraints
- [x] All required fields are NOT NULL
- [x] Naming conventions consistent (snake_case DB, camelCase TS)

### Replit Compliance Check

- [x] DATABASE_URL environment variable used
- [x] drizzle.config.ts properly configured
- [x] Migration script uses tsx wrapper
- [x] Connection pool configured for serverless environment
- [x] Schema location in shared/ directory

### Confidence Scores

| Section | Score (1-10) | Notes |
|---------|--------------|-------|
| Entity Completeness | 10 | All PRD entities covered |
| Relationship Accuracy | 10 | All relationships traced to PRD/Architecture |
| Index Coverage | 9 | All FKs and common queries indexed |
| Constraint Completeness | 9 | All business rules enforced |
| Drizzle Implementation | 10 | Complete schema with relations and types |
| Replit Compliance | 10 | All Replit requirements met |
| Overall | 9.7 | Production-ready schema |

### Document Status: COMPLETE

---

## Downstream Agent Handoff Brief

### For Agent 4: API Contract

**CRUD Operations Required:**

| Entity | Create | Read | Update | Delete | Notes |
|--------|--------|------|--------|--------|-------|
| organizations | ✓ | ✓ | ✓ | - | Created via seed/setup |
| users | ✓ | ✓ | ✓ | Soft | Via auth/admin endpoints |
| invitations | ✓ | ✓ | - | ✓ | Cancel = delete |
| projects | ✓ | ✓ | ✓ | Soft | Cascade deletes sources |
| sources | ✓ | ✓ | ✓ | Soft | Via upload/API endpoints |
| field_mappings | ✓ | ✓ | ✓ | - | Auto-created with source |
| deidentification_configs | ✓ | ✓ | ✓ | - | Auto-created with source |
| filter_configs | ✓ | ✓ | ✓ | - | Auto-created with source |
| processing_runs | ✓ | ✓ | - | - | Immutable after creation |
| outputs | ✓ | ✓ | - | ✓ | Download + delete |
| api_connections | ✓ | ✓ | ✓ | ✓ | Admin only |
| audit_logs | ✓ | ✓ | - | - | Immutable |

**Query Patterns to Support:**

| Pattern | Entity | Index Supporting |
|---------|--------|------------------|
| List by organization | users, projects, api_connections | *_org_id_idx |
| List by project | sources | sources_project_id_idx |
| List by source | source_data, processing_runs | *_source_id_idx |
| Filter by status | sources, processing_runs, invitations | *_status_idx |
| Sort by created_at | projects, processing_runs, audit_logs | *_created_at_idx |
| Token lookup | invitations, refresh_tokens, password_reset_tokens | *_token_hash_idx |

### For Agent 5: UI/UX Specification

**Form Entities:**

| Entity | Create Form | Edit Form | Required Fields |
|--------|-------------|-----------|-----------------|
| organizations | Setup | Settings | name |
| users | Register | Profile | email, password, name |
| invitations | Invite Modal | - | email, role |
| projects | New Project | Edit Project | name |
| sources (file) | Upload | - | file, name |
| sources (api) | Configure | - | connection, config |
| field_mappings | Mapping UI | Mapping UI | mappings |
| deidentification | Rules UI | Rules UI | rules |
| filter_configs | Filter UI | Filter UI | filters |
| api_connections | Add Connection | Edit Connection | type, name, credentials |

**Enum Fields for Dropdowns:**

| Entity | Field | Valid Values |
|--------|-------|--------------|
| users | role | admin, member |
| invitations | role | admin, member |
| sources | type | file_upload, api |
| api_connections | type | teamwork_desk |
| processing_runs | output_format | conversational_jsonl, qa_pairs_jsonl, raw_json |

### For Agent 6: Implementation Orchestrator

**Migration Command:**

```bash
npm run db:push
# Executes: tsx node_modules/drizzle-kit/bin.cjs push --force
```

**Note:** The `tsx` wrapper is required for drizzle-kit in ESM projects.

**Implementation Order:**

1. Set up DATABASE_URL in Replit Secrets
2. Install dependencies (drizzle-orm, postgres, drizzle-kit, tsx)
3. Create shared/schema.ts
4. Create drizzle.config.ts
5. Create server/db.ts
6. Run `npm run db:push`
7. Run seed script

**Entity Dependencies:**

| Entity | Requires First |
|--------|----------------|
| users | organizations |
| invitations | organizations, users |
| projects | organizations |
| api_connections | organizations |
| sources | projects, (api_connections) |
| source_data | sources |
| field_mappings | sources |
| deidentification_configs | sources |
| filter_configs | sources |
| processing_runs | sources, users |
| outputs | processing_runs |
| audit_logs | organizations, users |

### Handoff Summary

| Metric | Count |
|--------|-------|
| Total entities | 14 |
| Domain entities | 10 |
| Foundation entities | 4 |
| Junction tables | 0 |
| Total relationships | 19 |
| Indexes defined | 32 |
| pgEnum definitions | 9 |
| Soft-delete tables | 3 |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 6, 2026 | Initial release - complete Drizzle schema for Foundry |
