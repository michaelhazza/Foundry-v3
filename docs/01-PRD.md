# Foundry — Product Requirements Document

## Section 1: Executive Summary

Foundry is a multi-tenant SaaS platform that transforms fragmented business data into clean, de-identified datasets ready for AI agent training. Users connect data sources (file uploads, API integrations), configure field mappings and privacy rules through a no-code interface, and export structured training data in formats suitable for fine-tuning, RAG systems, or analysis.

**Primary Value Proposition:** Turn messy operational data from any source into AI training-ready datasets in minutes, not months—without engineering resources or privacy expertise.

**Target Market:** Small-to-medium businesses and mid-market companies pursuing AI initiatives (support agents, sales assistants, knowledge bases) who have operational data but lack the technical capability to prepare it for AI training.

**Key Differentiators:**
- Source-agnostic architecture (files and APIs as equal citizens)
- Privacy-first with configurable de-identification as a core feature
- Configuration-driven, no-code workflow accessible to non-technical users
- Incremental value from first upload (5-minute time-to-value)

**MVP API Connector:** Teamwork Desk (GoHighLevel deferred to post-MVP)

**Deployment Target:** Replit (web application)

---

## Section 2: Problem Statement

**The Problem in Human Terms:**
Business operators and managers sit on years of valuable customer interactions, sales conversations, and operational knowledge scattered across helpdesk systems, CRMs, spreadsheets, and documents. They want to train AI agents that understand how their business actually operates—but they cannot bridge the gap between "data in systems" and "training-ready dataset."

**Current Alternatives and Their Limitations:**
1. **Custom Engineering** — Hire developers to build extraction pipelines. Cost: $50K-200K, timeline: 3-6 months, ongoing maintenance burden. Not viable for SMBs.
2. **Manual Export + Spreadsheet Wrangling** — Export CSVs, manually clean in Excel, hope privacy issues don't surface. Error-prone, doesn't scale, no PII handling.
3. **Data Science Consultants** — Project-based engagement. Expensive ($150-300/hr), no tooling left behind, must repeat for each new use case.
4. **Do Nothing** — Use generic AI models without company-specific training. Results in AI that doesn't understand company context, products, or procedures.

**Quantified Impact:**
- 73% of businesses report "data preparation" as the primary blocker to AI adoption (Gartner, 2024)
- Average company uses 130+ SaaS applications; operational data is fragmented by design
- Manual data preparation consumes 60-80% of data science project timelines

**Person Experiencing the Pain:**
Sarah, an Operations Director at a 200-person SaaS company, has 4 years of Zendesk tickets and wants to train a support AI. She has budget approval but no data engineers. Every vendor quotes 8+ weeks and $40K minimum. Her CEO asks monthly why the AI project hasn't launched.

---

## Section 3: User Personas

### Persona 1: Operations Manager (Primary)

**Name and Archetype:** Sarah Chen — "The Pragmatic Operator"

**Demographics:**
- Age: 35-45
- Role: Operations Director, VP of Customer Success, Head of Support
- Company: 50-500 employees, B2B SaaS or services
- Reports to: COO or CEO

**Goals and Motivations:**
- Launch AI-powered support/sales tools to improve efficiency
- Reduce dependency on engineering team for data projects
- Demonstrate ROI on AI investment to leadership
- Maintain compliance and avoid data privacy incidents

**Pain Points and Frustrations:**
- Cannot get engineering resources allocated to "data prep" work
- Doesn't trust manual CSV cleanup—knows she's missing PII
- Frustrated by vendors who require technical implementation
- Previous AI initiatives stalled in "data preparation" phase

**Technical Proficiency:** Comfortable with spreadsheets and SaaS tools. Can export CSVs and understand column mappings. Not comfortable with code, APIs, or command-line tools.

**Usage Context:** Works primarily from laptop, standard business hours. Will configure projects herself but may delegate monitoring to team members. Needs to show results to stakeholders quickly.

**Success Metrics (Her Perspective):**
- Time from "I have data" to "I have training file" < 1 day
- Zero PII leakage incidents
- Can explain the process to her CEO in 2 minutes

---

### Persona 2: Data Analyst

**Name and Archetype:** Marcus Rodriguez — "The Power User"

**Demographics:**
- Age: 28-38
- Role: Data Analyst, Business Intelligence Analyst, RevOps Analyst
- Company: 100-1000 employees
- Reports to: Director of Analytics or Operations

**Goals and Motivations:**
- Build robust, repeatable data pipelines
- Configure precise filtering and transformation rules
- Integrate with existing data workflows
- Produce high-quality datasets that don't require rework

**Pain Points and Frustrations:**
- Generic tools don't handle conversation data well
- Spends too much time on repetitive transformation tasks
- De-identification libraries require coding to configure
- Output formats don't match what training platforms expect

**Technical Proficiency:** Comfortable with data structures, SQL, and basic scripting. Understands APIs but prefers not to build integrations from scratch. Familiar with JSON/JSONL formats.

**Usage Context:** May set up multiple projects across different data sources. Wants fine-grained control over mappings and filters. Will iterate on configurations to optimize output quality.

**Success Metrics (His Perspective):**
- Field mapping accuracy > 95%
- Filter rules work as expected without trial-and-error
- Output validates against training platform schema first try

---

### Persona 3: Compliance Officer

**Name and Archetype:** Jennifer Walsh — "The Risk Guardian"

**Demographics:**
- Age: 40-55
- Role: Compliance Manager, Data Protection Officer, Legal Counsel
- Company: 200+ employees or regulated industry
- Reports to: General Counsel or CEO

**Goals and Motivations:**
- Ensure AI training data doesn't expose customer PII
- Maintain audit trails for data processing activities
- Meet regulatory requirements (GDPR, CCPA, industry-specific)
- Review and approve de-identification configurations

**Pain Points and Frustrations:**
- Cannot verify what happens to data in "black box" tools
- Needs documentation for compliance audits
- Worried about PII in training data causing regulatory issues
- Other teams move too fast without considering compliance

**Technical Proficiency:** Understands data privacy concepts deeply but not technical implementation. Can review configurations if presented clearly. Needs explanations in business/legal terms.

**Usage Context:** Reviews project configurations before processing. Needs visibility into what de-identification rules are applied. May require periodic audit reports. Does not configure projects herself.

**Success Metrics (Her Perspective):**
- Clear audit trail of all de-identification applied
- Can demonstrate compliance controls to auditors
- Zero reported PII incidents in processed outputs

---

### Persona 4: Organization Admin

**Name and Archetype:** David Park — "The Platform Owner"

**Demographics:**
- Age: 30-50
- Role: IT Manager, SaaS Admin, Operations Lead
- Company: Any size using Foundry
- Reports to: CTO, VP Ops, or COO

**Goals and Motivations:**
- Manage user access and permissions
- Oversee platform usage across the organization
- Configure organization-wide settings (API connections, defaults)
- Control costs and resource allocation

**Pain Points and Frustrations:**
- Needs to provision/deprovision users as team changes
- Wants visibility into who is doing what
- API credentials should be managed centrally, not per-user
- Needs to enforce organizational policies

**Technical Proficiency:** Comfortable managing SaaS platforms. Understands user management, SSO concepts, and API authentication. May not be hands-on with data processing.

**Usage Context:** Initial setup of organization and API connections. Ongoing user management. Periodic review of usage and projects.

**Success Metrics (His Perspective):**
- User onboarding < 5 minutes
- Clear visibility into organization activity
- API credentials secured and centrally managed

---

## Section 4: User Stories and Requirements

### 4.1 Authentication and Access

```
ID: US-AUTH-001
Persona: Organization Admin
Story: As an organization admin, I want to invite team members via email so that they can access our Foundry organization.
Acceptance Criteria:
  - Given I am logged in as an org admin, when I enter an email address and click invite, then an invitation email is sent within 60 seconds
  - Given an invitation is sent, when the recipient clicks the link within 7 days, then they can create an account and join the organization
  - Given an invitation link is older than 7 days, when clicked, then a clear expiration message is shown with option to request new invite
Priority: P0-Critical
MVP Status: MVP
Dependencies: None
Estimated Complexity: M
```

```
ID: US-AUTH-002
Persona: Operations Manager
Story: As a user, I want to log in with email and password so that I can access my organization's projects.
Acceptance Criteria:
  - Given valid credentials, when I submit login form, then I am redirected to dashboard within 2 seconds
  - Given invalid credentials, when I submit login form, then I see "Invalid email or password" (no indication which is wrong)
  - Given 5 failed attempts, when I try again, then account is locked for 15 minutes with clear messaging
Priority: P0-Critical
MVP Status: MVP
Dependencies: None
Estimated Complexity: M
```

```
ID: US-AUTH-003
Persona: Organization Admin
Story: As an organization admin, I want to remove users from my organization so that former employees lose access.
Acceptance Criteria:
  - Given I am org admin viewing user list, when I click remove on a user, then I see confirmation dialog
  - Given I confirm removal, when action completes, then user immediately loses access to all org resources
  - Given a user is removed, when they try to log in, then they see "Contact your administrator" message
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-AUTH-001
Estimated Complexity: S
```

```
ID: US-AUTH-004
Persona: Operations Manager
Story: As a user, I want to reset my password via email so that I can recover access if I forget it.
Acceptance Criteria:
  - Given I click "Forgot password", when I enter my email, then reset link is sent within 60 seconds
  - Given a reset link, when I click within 1 hour, then I can set a new password
  - Given a reset link older than 1 hour, when clicked, then I see expiration message with option to request new link
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-AUTH-002
Estimated Complexity: S
```

```
ID: US-AUTH-005
Persona: Operations Manager
Story: As a user, I want to log out of my session so that I can secure my account on shared devices.
Acceptance Criteria:
  - Given I am logged in, when I click logout, then I am redirected to login page
  - Given I have logged out, when I try to access any protected page, then I am redirected to login
  - Given I log out, when I use the back button, then I cannot access protected content
Priority: P1-High
MVP Status: MVP
Dependencies: US-AUTH-002
Estimated Complexity: S
```

```
ID: US-AUTH-006
Persona: Operations Manager
Story: As a user, I want to change my password from my profile so that I can maintain account security.
Acceptance Criteria:
  - Given I am logged in, when I navigate to profile settings, then I see password change option
  - Given I enter current password and new password (twice), when passwords match and current is correct, then password is updated
  - Given current password is incorrect, when I submit, then I see "Current password is incorrect"
  - Given new passwords don't match, when I submit, then I see "Passwords do not match"
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-AUTH-002
Estimated Complexity: S
```

```
ID: US-AUTH-007
Persona: Operations Manager
Story: As a user, I want to view and update my profile information so that my account details are accurate.
Acceptance Criteria:
  - Given I am logged in, when I navigate to profile, then I see my name and email
  - Given I update my name, when I save, then the change is reflected immediately across the application
  - Given I try to change email, when I submit, then verification is sent to new email before change takes effect
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-AUTH-002
Estimated Complexity: S
```

```
ID: US-AUTH-008
Persona: Organization Admin
Story: As an org admin, I want to resend an invitation so that users who missed the original email can still join.
Acceptance Criteria:
  - Given a pending invitation exists, when I click resend, then a new invitation email is sent
  - Given I resend, when the new email is sent, then the previous link is invalidated
  - Given I resend, when viewing invitations, then the sent date is updated
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-AUTH-001
Estimated Complexity: S
```

```
ID: US-AUTH-009
Persona: Organization Admin
Story: As an org admin, I want to cancel a pending invitation so that I can revoke access before it's accepted.
Acceptance Criteria:
  - Given a pending invitation exists, when I click cancel, then the invitation link becomes invalid
  - Given I cancel an invitation, when the user clicks the old link, then they see "Invitation cancelled"
  - Given I cancel, when viewing invitations list, then the invitation is removed
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-AUTH-001
Estimated Complexity: S
```

### 4.2 Organization Management

```
ID: US-ORG-001
Persona: Organization Admin
Story: As an org admin, I want to view my organization's details so that I can see our account information.
Acceptance Criteria:
  - Given I am an org admin, when I navigate to organization settings, then I see organization name and creation date
  - Given I view settings, when I look at the page, then I see count of users and projects
Priority: P1-High
MVP Status: MVP
Dependencies: US-AUTH-002
Estimated Complexity: S
```

```
ID: US-ORG-002
Persona: Organization Admin
Story: As an org admin, I want to update my organization's name so that it reflects our current branding.
Acceptance Criteria:
  - Given I am viewing organization settings, when I edit the name, then I can save the new name
  - Given I save a new name, when I view any page, then the new name appears in the header/navigation
  - Given name exceeds 100 characters, when I save, then validation error is shown
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-ORG-001
Estimated Complexity: S
```

```
ID: US-ORG-003
Persona: Organization Admin
Story: As an org admin, I want to see all users in my organization so that I can manage team access.
Acceptance Criteria:
  - Given I am an org admin, when I view users list, then I see all active users with name, email, role, and join date
  - Given I view users list, when there are pending invitations, then they appear separately marked as "Pending"
  - Given more than 20 users, when I view the list, then pagination is available
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-AUTH-001
Estimated Complexity: S
```

```
ID: US-ORG-004
Persona: Organization Admin
Story: As an org admin, I want to change a user's role so that I can promote members to admin or demote admins.
Acceptance Criteria:
  - Given I am viewing a user, when I change their role from member to admin, then they gain admin capabilities
  - Given I am the only admin, when I try to demote myself, then I see error "Organization must have at least one admin"
  - Given I change a role, when the change is saved, then an audit log entry is created
Priority: P1-High
MVP Status: MVP
Dependencies: US-ORG-003
Estimated Complexity: S
```

### 4.3 Project Management

```
ID: US-PROJ-001
Persona: Operations Manager
Story: As a user, I want to create a new project so that I can organize my data processing work for a specific AI training goal.
Acceptance Criteria:
  - Given I am on the dashboard, when I click "New Project", then I see a creation form
  - Given I enter project name (required) and description (optional), when I submit, then project is created and I am redirected to project view
  - Given project name is empty, when I submit, then validation error is shown without page reload
  - Given project name exceeds 100 characters, when I submit, then validation error is shown
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-AUTH-002
Estimated Complexity: S
```

```
ID: US-PROJ-002
Persona: Operations Manager
Story: As a user, I want to see all projects in my organization so that I can navigate to the one I need.
Acceptance Criteria:
  - Given I am logged in, when I view the dashboard, then I see all projects listed with name, description preview, last updated date, and source count
  - Given more than 20 projects exist, when I view the list, then pagination controls appear
  - Given no projects exist, when I view the dashboard, then I see empty state with "Create your first project" prompt
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: S
```

```
ID: US-PROJ-003
Persona: Operations Manager
Story: As a user, I want to edit project name and description so that I can keep project metadata accurate.
Acceptance Criteria:
  - Given I am viewing a project, when I click edit, then name and description become editable inline
  - Given I change values and click save, when action completes, then changes are persisted and confirmed visually
  - Given I click cancel, when action completes, then original values are restored
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: S
```

```
ID: US-PROJ-004
Persona: Organization Admin
Story: As an org admin, I want to delete a project so that I can remove obsolete work and free up resources.
Acceptance Criteria:
  - Given I am org admin viewing a project, when I click delete, then I see confirmation dialog warning that all sources and outputs will be deleted
  - Given I type project name to confirm, when I click confirm delete, then project and all associated data are permanently removed
  - Given I do not type correct project name, when I click confirm, then button remains disabled
Priority: P1-High
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: S
```

```
ID: US-PROJ-005
Persona: Operations Manager
Story: As a user, I want to search and filter projects so that I can quickly find the project I need.
Acceptance Criteria:
  - Given I am on the dashboard, when I type in the search box, then projects are filtered by name in real-time
  - Given I search, when no projects match, then I see "No projects match your search"
  - Given I clear the search, when the box is empty, then all projects are shown again
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-PROJ-002
Estimated Complexity: S
```

```
ID: US-PROJ-006
Persona: Operations Manager
Story: As a user, I want to see a project overview so that I can understand the current state of my data processing work.
Acceptance Criteria:
  - Given I open a project, when the page loads, then I see: project name, description, source count, last processing date, total records processed
  - Given I view overview, when there are sources, then I see a summary list with source name, type, and status
  - Given I view overview, when processing is in progress, then I see active processing indicator
Priority: P1-High
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: S
```

### 4.4 File Upload Source

```
ID: US-FILE-001
Persona: Operations Manager
Story: As a user, I want to upload a CSV file as a data source so that I can process my exported data.
Acceptance Criteria:
  - Given I am in a project, when I click "Add Source" then "File Upload", then I see upload interface
  - Given I select a CSV file under 50MB, when upload completes, then file is stored and I proceed to column mapping
  - Given I select a file over 50MB, when I attempt upload, then I see size limit error before upload starts
  - Given upload is in progress, when I view the interface, then I see progress percentage
  - Given upload fails (network error), when I see the error, then I can retry without re-selecting file
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: M
```

```
ID: US-FILE-002
Persona: Operations Manager
Story: As a user, I want to upload Excel files so that I can use my spreadsheet exports directly.
Acceptance Criteria:
  - Given I select an .xlsx or .xls file, when upload completes, then first sheet is parsed and I proceed to column mapping
  - Given Excel file has multiple sheets, when upload completes, then I can select which sheet to use
  - Given Excel file has formatting/merged cells, when parsed, then data is extracted as flat rows with warning if structure is complex
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-FILE-001
Estimated Complexity: M
```

```
ID: US-FILE-003
Persona: Data Analyst
Story: As a user, I want to upload JSON files so that I can use API exports and structured data.
Acceptance Criteria:
  - Given I upload a JSON file with array of objects, when parsed, then each object becomes a row
  - Given I upload a JSON file with nested structure, when parsed, then I can specify the array path to use as records
  - Given JSON is malformed, when I upload, then I see clear error message indicating line/position of error
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-FILE-001
Estimated Complexity: M
```

```
ID: US-FILE-004
Persona: Operations Manager
Story: As a user, I want columns auto-detected from my uploaded file so that I can quickly proceed to mapping.
Acceptance Criteria:
  - Given a CSV/Excel with header row, when parsed, then column names are extracted as field names
  - Given a CSV without clear headers, when parsed, then first row values are shown with option to "use first row as headers" or "generate column names"
  - Given column detection completes, when I view mapping screen, then all detected columns are listed with sample values (first 3 rows)
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-FILE-001
Estimated Complexity: M
```

```
ID: US-FILE-005
Persona: Operations Manager
Story: As a user, I want to drag and drop files to upload so that I can quickly add data without navigating file dialogs.
Acceptance Criteria:
  - Given I am on the upload screen, when I drag a file over the drop zone, then visual feedback indicates drop is possible
  - Given I drop a valid file, when the drop completes, then upload begins automatically
  - Given I drop an invalid file type, when the drop completes, then I see error message about supported formats
Priority: P1-High
MVP Status: MVP
Dependencies: US-FILE-001
Estimated Complexity: S
```

```
ID: US-FILE-006
Persona: Operations Manager
Story: As a user, I want to name my source when uploading so that I can identify it later among multiple sources.
Acceptance Criteria:
  - Given I am uploading a file, when the upload screen loads, then I see a source name field pre-filled with filename
  - Given I edit the source name, when I proceed, then my custom name is used
  - Given source name is empty, when I try to proceed, then validation requires a name
Priority: P1-High
MVP Status: MVP
Dependencies: US-FILE-001
Estimated Complexity: S
```

```
ID: US-FILE-007
Persona: Data Analyst
Story: As a user, I want to replace the file in an existing source so that I can update data without reconfiguring mappings.
Acceptance Criteria:
  - Given I have a configured source, when I click "Replace File", then I can upload a new file
  - Given the new file has the same columns, when uploaded, then existing mappings are preserved
  - Given the new file has different columns, when uploaded, then I see warning and can review/update mappings
  - Given I replace the file, when complete, then previous processing outputs are marked as outdated
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-FILE-001
Estimated Complexity: M
```

### 4.5 Source Management

```
ID: US-SRC-001
Persona: Operations Manager
Story: As a user, I want to see all sources in my project so that I can manage my data inputs.
Acceptance Criteria:
  - Given I am in a project, when I view sources tab, then I see list of all sources with name, type (file/API), status, and record count
  - Given no sources exist, when I view sources tab, then I see empty state prompting to add first source
  - Given sources exist, when I click on one, then I navigate to source detail view
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: S
```

```
ID: US-SRC-002
Persona: Operations Manager
Story: As a user, I want to rename a source so that I can keep my project organized with meaningful names.
Acceptance Criteria:
  - Given I am viewing a source, when I click on the name, then it becomes editable
  - Given I change the name and blur/press enter, when the action completes, then the new name is saved
  - Given name is empty, when I try to save, then validation error appears and old name is restored
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-SRC-001
Estimated Complexity: S
```

```
ID: US-SRC-003
Persona: Operations Manager
Story: As a user, I want to delete a source so that I can remove data I no longer need.
Acceptance Criteria:
  - Given I am viewing a source, when I click delete, then I see confirmation dialog
  - Given I confirm deletion, when action completes, then source and all its outputs are permanently removed
  - Given I have active processing for this source, when I try to delete, then I see error "Cannot delete while processing is active"
Priority: P1-High
MVP Status: MVP
Dependencies: US-SRC-001
Estimated Complexity: S
```

```
ID: US-SRC-004
Persona: Data Analyst
Story: As a user, I want to preview the raw data in my source so that I can verify the upload was parsed correctly.
Acceptance Criteria:
  - Given I am viewing a source, when I click "Data Preview", then I see first 100 rows in a table format
  - Given preview is showing, when I scroll, then additional rows load (lazy loading)
  - Given I view preview, when I click on a cell, then I can see full content if truncated
  - Given I view preview, when data includes long text, then cells are truncated with expand option
Priority: P1-High
MVP Status: MVP
Dependencies: US-FILE-001
Estimated Complexity: M
```

```
ID: US-SRC-005
Persona: Data Analyst
Story: As a user, I want to see source statistics so that I can understand my data at a glance.
Acceptance Criteria:
  - Given I am viewing a source, when I view stats panel, then I see: total rows, column count, file size, upload date
  - Given stats are shown, when I view column list, then I see data type detected for each column
  - Given I view stats, when there are null values, then I see null count per column
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-FILE-001
Estimated Complexity: S
```

```
ID: US-SRC-006
Persona: Data Analyst
Story: As a user, I want to search within my source data so that I can find specific records.
Acceptance Criteria:
  - Given I am in data preview, when I type in search box, then records containing search term are highlighted/filtered
  - Given I search, when matches exist, then count of matches is shown
  - Given I search, when I press enter or click next, then I navigate to next match
Priority: P3-Low
MVP Status: Post-MVP
Dependencies: US-SRC-004
Estimated Complexity: M
```

### 4.6 Field Mapping

```
ID: US-MAP-001
Persona: Operations Manager
Story: As a user, I want to map source columns to standard training fields so that my output is properly structured.
Acceptance Criteria:
  - Given I am on mapping screen, when I view it, then I see source columns on left, target fields on right
  - Given target fields include: conversation_id, timestamp, role (agent/customer), content, subject, status, category
  - Given I drag a source column to a target field, when I drop it, then mapping is created and visually confirmed
  - Given I map incorrectly, when I click remove on a mapping, then it is cleared
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-FILE-004
Estimated Complexity: M
```

```
ID: US-MAP-002
Persona: Operations Manager
Story: As a user, I want smart mapping suggestions so that common column names are pre-mapped.
Acceptance Criteria:
  - Given source has column "email" or "customer_email", when mapping loads, then it is pre-suggested for "customer_email" target
  - Given source has column "message" or "body" or "content", when mapping loads, then it is pre-suggested for "content" target
  - Given suggestions are made, when I view mapping screen, then suggestions are shown as dotted lines that I can accept or dismiss
  - Given I accept a suggestion, when I click accept, then mapping becomes solid/confirmed
Priority: P1-High
MVP Status: MVP
Dependencies: US-MAP-001
Estimated Complexity: M
```

```
ID: US-MAP-003
Persona: Data Analyst
Story: As a user, I want to define value transformations for mapped fields so that I can normalize data formats.
Acceptance Criteria:
  - Given I have created a mapping, when I click "transform" on it, then I see transformation options
  - Given transformation options include: lowercase, uppercase, trim whitespace, date format conversion, value mapping (e.g., "1"→"agent", "2"→"customer")
  - Given I define a transformation, when I save, then preview updates to show transformed values
  - Given multiple transformations on one field, when I define them, then they apply in specified order
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-MAP-001
Estimated Complexity: M
```

```
ID: US-MAP-004
Persona: Data Analyst
Story: As a user, I want to preview mapped and transformed data so that I can verify correctness before processing.
Acceptance Criteria:
  - Given mappings are configured, when I click "Preview", then I see first 10 records in target format
  - Given preview is shown, when I view it, then original values and transformed values are both visible
  - Given preview reveals mapping errors, when I adjust mappings, then preview updates within 2 seconds
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-MAP-001
Estimated Complexity: S
```

```
ID: US-MAP-005
Persona: Data Analyst
Story: As a user, I want to create custom target fields so that I can include domain-specific data in my output.
Acceptance Criteria:
  - Given I am on mapping screen, when I click "Add Custom Field", then I can enter field name
  - Given I create a custom field, when I view target fields, then my custom field appears as a mapping target
  - Given I map to a custom field, when I process, then the field appears in output
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-MAP-001
Estimated Complexity: S
```

```
ID: US-MAP-006
Persona: Data Analyst
Story: As a user, I want to use dropdown selection for mapping so that I have an alternative to drag-and-drop.
Acceptance Criteria:
  - Given I am on mapping screen, when I click on a target field, then I see dropdown of unmapped source columns
  - Given I select a source column from dropdown, when I click, then mapping is created
  - Given a target field is mapped, when I view it, then dropdown shows current selection with option to change
Priority: P1-High
MVP Status: MVP
Dependencies: US-MAP-001
Estimated Complexity: S
```

```
ID: US-MAP-007
Persona: Operations Manager
Story: As a user, I want to save my mapping configuration so that I can return to it later without losing work.
Acceptance Criteria:
  - Given I have configured mappings, when I navigate away, then my progress is auto-saved
  - Given I return to mapping screen, when the page loads, then my previous mappings are restored
  - Given I want to start over, when I click "Clear All Mappings", then all mappings are removed after confirmation
Priority: P1-High
MVP Status: MVP
Dependencies: US-MAP-001
Estimated Complexity: S
```

### 4.7 De-identification

```
ID: US-PII-001
Persona: Operations Manager
Story: As a user, I want automatic PII detection in my data so that I can see what sensitive information exists.
Acceptance Criteria:
  - Given a source is uploaded, when auto-detection runs, then names, emails, phone numbers, and addresses are identified
  - Given PII is detected, when I view the source, then a summary shows count of each PII type found
  - Given detection completes, when I view preview, then detected PII is highlighted in original text
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-FILE-001
Estimated Complexity: L
```

```
ID: US-PII-002
Persona: Operations Manager
Story: As a user, I want to configure de-identification rules so that PII is replaced appropriately in outputs.
Acceptance Criteria:
  - Given I am in de-identification settings, when I view defaults, then rules exist for: names→[PERSON_N], emails→[EMAIL], phones→[PHONE], addresses→[ADDRESS], companies→[COMPANY_N]
  - Given default rules, when I process data, then consistent replacement occurs (same name always becomes same placeholder like [PERSON_1])
  - Given I want to customize, when I edit a rule, then I can change the replacement pattern
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PII-001
Estimated Complexity: M
```

```
ID: US-PII-003
Persona: Data Analyst
Story: As a user, I want to add custom pattern rules so that I can mask domain-specific identifiers.
Acceptance Criteria:
  - Given I am in de-identification settings, when I click "Add Rule", then I can define regex pattern and replacement
  - Given I define pattern for account numbers (e.g., ACC-\d{6}), when processing runs, then matches are replaced with [ACCOUNT_ID]
  - Given I save a custom rule, when I view rule list, then it appears alongside default rules
  - Given custom rule has invalid regex, when I save, then validation error explains the issue
Priority: P1-High
MVP Status: MVP
Dependencies: US-PII-002
Estimated Complexity: M
```

```
ID: US-PII-004
Persona: Compliance Officer
Story: As a compliance reviewer, I want to see de-identification preview before processing so that I can verify sensitive data is handled correctly.
Acceptance Criteria:
  - Given de-identification rules are configured, when I click "Preview De-identification", then I see before/after comparison for sample records
  - Given preview is shown, when I review it, then original text shows PII highlighted, processed text shows replacements
  - Given I am satisfied, when I approve configuration, then my approval is logged with timestamp
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PII-002
Estimated Complexity: S
```

```
ID: US-PII-005
Persona: Data Analyst
Story: As a user, I want to enable or disable specific de-identification rules so that I can control what gets masked.
Acceptance Criteria:
  - Given I am in de-identification settings, when I view a rule, then I see an enable/disable toggle
  - Given I disable a rule, when processing runs, then that PII type is not masked
  - Given I disable a rule, when I view preview, then that PII type appears unmasked
Priority: P1-High
MVP Status: MVP
Dependencies: US-PII-002
Estimated Complexity: S
```

```
ID: US-PII-006
Persona: Data Analyst
Story: As a user, I want to specify which columns to scan for PII so that I can limit detection to relevant fields.
Acceptance Criteria:
  - Given I am in de-identification settings, when I view column list, then I see checkboxes for each column
  - Given I uncheck a column, when PII detection runs, then that column is skipped
  - Given I check only specific columns, when I view detection results, then only those columns show findings
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-PII-001
Estimated Complexity: S
```

```
ID: US-PII-007
Persona: Compliance Officer
Story: As a compliance reviewer, I want to see a summary of all PII detected so that I can assess data sensitivity.
Acceptance Criteria:
  - Given PII detection has run, when I view de-identification screen, then I see total counts by type (X names, Y emails, etc.)
  - Given summary is shown, when I click on a type, then I see sample occurrences from the data
  - Given I view summary, when there is high PII density, then a warning is displayed
Priority: P1-High
MVP Status: MVP
Dependencies: US-PII-001
Estimated Complexity: S
```

```
ID: US-PII-008
Persona: Data Analyst
Story: As a user, I want to test a custom regex pattern before saving so that I can verify it matches what I expect.
Acceptance Criteria:
  - Given I am creating a custom rule, when I enter a regex pattern, then I see a "Test" button
  - Given I click test, when the pattern is applied to sample data, then I see matches highlighted
  - Given the pattern has errors, when I test, then I see validation message explaining the issue
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-PII-003
Estimated Complexity: S
```

### 4.8 Quality Filtering

```
ID: US-FILT-001
Persona: Data Analyst
Story: As a user, I want to filter records by minimum conversation length so that I exclude trivial exchanges from training data.
Acceptance Criteria:
  - Given I am in filter settings, when I set minimum messages to N, then conversations with fewer than N messages are excluded
  - Given filter is set, when I view filter preview, then count of included vs excluded records is shown
  - Given no filter is set, when I process, then all records are included (no minimum)
Priority: P1-High
MVP Status: MVP
Dependencies: US-MAP-001
Estimated Complexity: S
```

```
ID: US-FILT-002
Persona: Data Analyst
Story: As a user, I want to filter by resolution status so that I only include successfully resolved cases in training data.
Acceptance Criteria:
  - Given status field is mapped, when I open filter settings, then I see unique status values from data
  - Given I select statuses to include (e.g., "resolved", "closed"), when I save, then only matching records are included
  - Given I select statuses to exclude, when I save, then matching records are excluded
Priority: P1-High
MVP Status: MVP
Dependencies: US-MAP-001
Estimated Complexity: S
```

```
ID: US-FILT-003
Persona: Data Analyst
Story: As a user, I want to filter by date range so that I can focus on recent or specific time period data.
Acceptance Criteria:
  - Given timestamp field is mapped, when I open filter settings, then I can set start date, end date, or both
  - Given I set date range, when I save, then only records within range are included
  - Given records have invalid/missing timestamps, when filtering, then they are excluded with count shown
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-MAP-001
Estimated Complexity: S
```

```
ID: US-FILT-004
Persona: Data Analyst
Story: As a user, I want to see filter summary before processing so that I understand how many records will be processed.
Acceptance Criteria:
  - Given filters are configured, when I view processing screen, then I see: total records, records passing filters, records excluded (with breakdown by filter rule)
  - Given filter would exclude >90% of records, when I view summary, then a warning is shown
  - Given filter would result in 0 records, when I view summary, then error is shown with suggestion to adjust filters
Priority: P1-High
MVP Status: MVP
Dependencies: US-FILT-001, US-FILT-002, US-FILT-003
Estimated Complexity: S
```

```
ID: US-FILT-005
Persona: Data Analyst
Story: As a user, I want to filter by minimum content length so that I exclude very short messages.
Acceptance Criteria:
  - Given content field is mapped, when I set minimum character length, then messages shorter than threshold are excluded
  - Given filter is set, when I view preview, then I see excluded count and samples
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-MAP-001
Estimated Complexity: S
```

```
ID: US-FILT-006
Persona: Data Analyst
Story: As a user, I want to filter by category or tag so that I can focus on specific types of conversations.
Acceptance Criteria:
  - Given category field is mapped, when I open filter settings, then I see unique category values
  - Given I select categories to include, when I save, then only matching records pass filter
  - Given I click "Select All" or "Deselect All", when clicked, then all checkboxes update accordingly
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-MAP-001
Estimated Complexity: S
```

```
ID: US-FILT-007
Persona: Data Analyst
Story: As a user, I want to combine multiple filters with AND logic so that I can apply precise selection criteria.
Acceptance Criteria:
  - Given I set multiple filters, when processing runs, then records must pass ALL filters to be included
  - Given multiple filters are active, when I view summary, then I see breakdown showing progressive filtering
  - Given I view summary, when I see the breakdown, then I understand which filter has most impact
Priority: P1-High
MVP Status: MVP
Dependencies: US-FILT-001
Estimated Complexity: S
```

### 4.9 Processing and Output

```
ID: US-PROC-001
Persona: Operations Manager
Story: As a user, I want to trigger processing of my configured source so that I can generate training data output.
Acceptance Criteria:
  - Given source is configured with mapping, de-identification, and filters, when I click "Process", then processing job starts
  - Given processing starts, when I view the source, then I see progress indicator (records processed / total)
  - Given processing completes, when I view the source, then status shows "Complete" with timestamp and record count
  - Given processing fails, when I view the source, then status shows "Failed" with error message and option to retry
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-MAP-001, US-PII-002
Estimated Complexity: L
```

```
ID: US-PROC-002
Persona: Operations Manager
Story: As a user, I want to select output format before processing so that I get data in the structure I need.
Acceptance Criteria:
  - Given I am configuring processing, when I select format, then options include: Conversational JSONL, Q&A Pairs JSONL, Raw JSON
  - Given I select Conversational JSONL, when processing completes, then output has one conversation per line with messages array
  - Given I select Q&A Pairs, when processing completes, then output has question/answer pairs extracted from conversations
  - Given I select Raw JSON, when processing completes, then output is structured JSON with all mapped fields
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: M
```

```
ID: US-PROC-003
Persona: Operations Manager
Story: As a user, I want to download processed output so that I can use it for AI training.
Acceptance Criteria:
  - Given processing is complete, when I click "Download", then file downloads immediately
  - Given output is large (>10MB), when I click download, then I see brief "Preparing download" state before download starts
  - Given output file, when I open it, then format matches selected output format with no corruption
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: S
```

```
ID: US-PROC-004
Persona: Data Analyst
Story: As a user, I want to re-run processing after changing configuration so that I can iterate on output quality.
Acceptance Criteria:
  - Given I have a completed processing run, when I change mapping/filters/de-identification, then "Re-process" button appears
  - Given I click re-process, when new processing completes, then new output replaces previous output
  - Given I re-process, when viewing history, then I see current output and can access processing log
Priority: P1-High
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: S
```

```
ID: US-PROC-005
Persona: Operations Manager
Story: As a user, I want to see processing history so that I can track what outputs have been generated.
Acceptance Criteria:
  - Given I am viewing a source, when I click "History", then I see list of all processing runs
  - Given history is shown, when I view a run, then I see: timestamp, output format, record count, user who triggered
  - Given history is shown, when I click on a completed run, then I can download that output
Priority: P1-High
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: S
```

```
ID: US-PROC-006
Persona: Operations Manager
Story: As a user, I want to cancel processing in progress so that I can stop a job that was started incorrectly.
Acceptance Criteria:
  - Given processing is in progress, when I click "Cancel", then I see confirmation dialog
  - Given I confirm cancellation, when action completes, then processing stops and status shows "Cancelled"
  - Given processing is cancelled, when I view the source, then I can start a new processing run
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: M
```

```
ID: US-PROC-007
Persona: Data Analyst
Story: As a user, I want to preview output format before processing so that I can verify the structure meets my needs.
Acceptance Criteria:
  - Given I select an output format, when I click "Preview Format", then I see 3 sample records in chosen format
  - Given preview is shown, when I view it, then I can expand/collapse JSON structure
  - Given I change format selection, when preview updates, then I see same records in new format
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-PROC-002
Estimated Complexity: S
```

```
ID: US-PROC-008
Persona: Operations Manager
Story: As a user, I want to receive notification when processing completes so that I don't have to watch the progress.
Acceptance Criteria:
  - Given processing is running, when I navigate away from the page, then processing continues
  - Given processing completes while I'm on another page, when I return, then I see completion notification
  - Given processing completes, when I'm on the same page, then status updates automatically without refresh
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: M
```

```
ID: US-PROC-009
Persona: Data Analyst
Story: As a user, I want to see processing logs so that I can debug issues with my configuration.
Acceptance Criteria:
  - Given processing has completed or failed, when I click "View Log", then I see detailed processing log
  - Given log is shown, when I view it, then I see records processed, errors encountered, warnings
  - Given errors occurred, when I view log, then error messages help me understand what went wrong
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: S
```

### 4.10 Output Management

```
ID: US-OUT-001
Persona: Operations Manager
Story: As a user, I want to see all outputs for a source so that I can access any version of processed data.
Acceptance Criteria:
  - Given I am viewing a source, when I click "Outputs", then I see list of all generated outputs
  - Given outputs exist, when I view list, then I see: date generated, format, file size, record count
  - Given no outputs exist, when I view list, then I see message "No outputs yet. Process your data to generate outputs."
Priority: P1-High
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: S
```

```
ID: US-OUT-002
Persona: Data Analyst
Story: As a user, I want to preview output content so that I can verify quality before downloading.
Acceptance Criteria:
  - Given an output exists, when I click "Preview", then I see first 20 records in formatted view
  - Given preview is shown, when I view records, then JSON structure is syntax-highlighted
  - Given I view preview, when I want more detail, then I can expand individual records
Priority: P1-High
MVP Status: MVP
Dependencies: US-OUT-001
Estimated Complexity: S
```

```
ID: US-OUT-003
Persona: Organization Admin
Story: As a user, I want to delete old outputs so that I can manage storage and remove outdated data.
Acceptance Criteria:
  - Given I am viewing outputs, when I click delete on an output, then I see confirmation dialog
  - Given I confirm deletion, when action completes, then output is permanently removed
  - Given output is deleted, when I view outputs list, then it no longer appears
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-OUT-001
Estimated Complexity: S
```

```
ID: US-OUT-004
Persona: Data Analyst
Story: As a user, I want to see output file metadata so that I can verify processing parameters.
Acceptance Criteria:
  - Given I am viewing an output, when I click "Details", then I see: processing date, configuration used, filter summary, de-identification rules applied
  - Given I view details, when configuration has changed since processing, then I see indicator that current config differs
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-OUT-001
Estimated Complexity: S
```

### 4.11 API Connector - Teamwork Desk

```
ID: US-API-001
Persona: Organization Admin
Story: As an org admin, I want to connect Teamwork Desk API so that we can pull support ticket data.
Acceptance Criteria:
  - Given I am in organization settings, when I click "Add Connection" then "Teamwork Desk", then I see authentication form
  - Given I enter API key and subdomain, when I click "Test Connection", then connection is validated and success/failure shown
  - Given connection succeeds, when I save, then connection is stored and available for all projects in the organization
  - Given connection fails, when I see error, then message explains the issue (invalid key, wrong subdomain, etc.)
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-AUTH-001
Estimated Complexity: M
```

```
ID: US-API-002
Persona: Data Analyst
Story: As a user, I want to add a Teamwork Desk source to my project so that I can pull ticket data.
Acceptance Criteria:
  - Given organization has Teamwork Desk connection, when I click "Add Source" in project, then I see Teamwork Desk option
  - Given I select Teamwork Desk, when I configure, then I can select: data type (tickets), project filter, date range
  - Given configuration is complete, when I save, then data fetch begins and I see progress
  - Given fetch completes, when I view source, then I proceed to field mapping with fetched data
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-API-001
Estimated Complexity: L
```

```
ID: US-API-003
Persona: Data Analyst
Story: As a user, I want to refresh Teamwork Desk data so that I can get the latest tickets.
Acceptance Criteria:
  - Given a Teamwork Desk source exists, when I click "Refresh", then new data is fetched from API
  - Given refresh completes, when I view source, then record count is updated
  - Given refresh encounters API errors, when I view status, then error message explains the issue
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-API-002
Estimated Complexity: M
```

```
ID: US-API-004
Persona: Organization Admin
Story: As an org admin, I want to update API credentials so that I can rotate keys or fix authentication issues.
Acceptance Criteria:
  - Given I am viewing a connection, when I click "Edit", then I can update credentials
  - Given I update credentials, when I click "Test", then new credentials are validated
  - Given I save updated credentials, when I save, then all projects using this connection continue to work
Priority: P1-High
MVP Status: MVP
Dependencies: US-API-001
Estimated Complexity: S
```

```
ID: US-API-005
Persona: Organization Admin
Story: As an org admin, I want to delete an API connection so that I can remove unused integrations.
Acceptance Criteria:
  - Given I am viewing a connection, when I click "Delete", then I see warning about affected sources
  - Given sources use this connection, when I view warning, then I see list of affected sources
  - Given I confirm deletion, when action completes, then connection is removed and sources show "Connection unavailable"
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-API-001
Estimated Complexity: S
```

```
ID: US-API-006
Persona: Data Analyst
Story: As a user, I want to filter which Teamwork Desk data to fetch so that I don't pull unnecessary records.
Acceptance Criteria:
  - Given I am configuring Teamwork Desk source, when I view options, then I can filter by: project, date range, status
  - Given I set filters, when data is fetched, then only matching records are retrieved
  - Given I set date range, when I enter dates, then validation ensures start < end
Priority: P1-High
MVP Status: MVP
Dependencies: US-API-002
Estimated Complexity: M
```

### 4.12 Audit and History

```
ID: US-AUDIT-001
Persona: Compliance Officer
Story: As a compliance reviewer, I want to see audit log of processing runs so that I can document data handling for audits.
Acceptance Criteria:
  - Given processing runs have occurred, when I view project audit log, then I see: timestamp, user who triggered, record count, de-identification rules applied, output format
  - Given audit log, when I export it, then I get CSV with all audit fields
  - Given audit entries, when I view one, then I see detailed configuration snapshot at time of run
Priority: P1-High
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: M
```

```
ID: US-AUDIT-002
Persona: Organization Admin
Story: As an org admin, I want to see organization-wide activity log so that I can track what's happening across projects.
Acceptance Criteria:
  - Given I am org admin, when I view activity log, then I see events across all projects
  - Given activity log, when I filter by user, then I see only that user's actions
  - Given activity log, when I filter by project, then I see only that project's events
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-ORG-001
Estimated Complexity: M
```

```
ID: US-AUDIT-003
Persona: Compliance Officer
Story: As a compliance reviewer, I want to see data deletion history so that I can prove data was properly removed.
Acceptance Criteria:
  - Given sources or outputs have been deleted, when I view audit log, then I see deletion events
  - Given deletion event, when I view details, then I see: what was deleted, who deleted it, timestamp
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-AUDIT-001
Estimated Complexity: S
```

```
ID: US-AUDIT-004
Persona: Compliance Officer
Story: As a compliance reviewer, I want to see user access history so that I can verify who has accessed data.
Acceptance Criteria:
  - Given user actions occur, when I view audit log, then I see: login events, data access events, export/download events
  - Given I filter by user, when I view results, then I see complete activity timeline
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-AUDIT-001
Estimated Complexity: S
```

### 4.13 Help and Onboarding

```
ID: US-HELP-001
Persona: Operations Manager
Story: As a new user, I want guided onboarding so that I can understand how to use the platform quickly.
Acceptance Criteria:
  - Given I am a new user on first login, when dashboard loads, then I see welcome message with quick start guide
  - Given I see quick start guide, when I view it, then I see 3-4 key steps to get value (create project, upload file, process, download)
  - Given I complete onboarding, when I dismiss it, then it doesn't appear again
Priority: P1-High
MVP Status: MVP
Dependencies: US-AUTH-002
Estimated Complexity: M
```

```
ID: US-HELP-002
Persona: Operations Manager
Story: As a user, I want contextual help tips so that I can understand features as I use them.
Acceptance Criteria:
  - Given I am on mapping screen for first time, when page loads, then I see tooltip explaining drag-and-drop
  - Given I hover on a feature, when help icon is present, then clicking shows explanation
  - Given I see a tip, when I dismiss it, then it doesn't appear again for that feature
Priority: P2-Medium
MVP Status: MVP
Dependencies: None
Estimated Complexity: M
```

```
ID: US-HELP-003
Persona: Operations Manager
Story: As a user, I want to access documentation so that I can learn advanced features.
Acceptance Criteria:
  - Given I am anywhere in the app, when I click help icon in header, then I see link to documentation
  - Given I click documentation link, when new tab opens, then I see relevant help content
Priority: P2-Medium
MVP Status: MVP
Dependencies: None
Estimated Complexity: S
```

```
ID: US-HELP-004
Persona: Operations Manager
Story: As a user, I want to contact support so that I can get help with issues.
Acceptance Criteria:
  - Given I am anywhere in the app, when I click help icon, then I see "Contact Support" option
  - Given I click contact support, when form opens, then I can describe my issue
  - Given I submit support request, when submission completes, then I see confirmation with expected response time
Priority: P2-Medium
MVP Status: MVP
Dependencies: None
Estimated Complexity: S
```

---

## Section 5: Feature Specification

### F-001: User Authentication and Management

**Description:** Secure user authentication with organization-based access control and invite-only onboarding.

**User Stories Addressed:** US-AUTH-001, US-AUTH-002, US-AUTH-003, US-AUTH-004

**Functional Requirements:**
- Email/password authentication with bcrypt hashing
- JWT-based session management with 24-hour expiry
- Organization-scoped user management
- Email invitation system with 7-day expiry
- Password reset via email with 1-hour expiry

**Non-Functional Requirements:**
- Login response time < 500ms
- Password requirements: minimum 8 characters, at least one number
- Rate limiting: 5 failed attempts triggers 15-minute lockout

**Edge Cases:**
- User invited to organization that doesn't exist (invitation invalid)
- User already has account and is invited to new organization (auto-join vs new account)
- Email delivery failure (retry mechanism, status indication)

**Error States:**
- Invalid credentials: "Invalid email or password" (no specificity)
- Account locked: "Account temporarily locked. Try again in X minutes."
- Expired invitation: "This invitation has expired. Please request a new one."

**Out of Scope for MVP:**
- SSO/SAML integration
- Two-factor authentication
- Session management across devices

---

### F-002: Project Management

**Description:** Create, view, edit, and delete data processing projects within an organization.

**User Stories Addressed:** US-PROJ-001, US-PROJ-002, US-PROJ-003, US-PROJ-004

**Functional Requirements:**
- Create project with name (required, max 100 chars) and description (optional, max 500 chars)
- List all projects in organization with metadata
- Edit project name and description
- Delete project with confirmation (requires typing project name)
- Cascade delete removes all sources, outputs, and processing history

**Non-Functional Requirements:**
- Project list load time < 1 second for up to 100 projects
- Pagination at 20 projects per page

**Edge Cases:**
- Duplicate project names (allowed—projects have unique IDs)
- Very long project list (pagination handles gracefully)
- Concurrent edits (last write wins for MVP)

**Error States:**
- Empty project name: "Project name is required"
- Name too long: "Project name must be 100 characters or fewer"
- Delete confirmation mismatch: Button remains disabled

**Out of Scope for MVP:**
- Project templates
- Project duplication
- Project-level permissions (all org members see all projects)

---

### F-003: File Upload and Parsing

**Description:** Upload CSV, Excel, and JSON files as data sources with automatic column/field detection.

**User Stories Addressed:** US-FILE-001, US-FILE-002, US-FILE-003, US-FILE-004

**Functional Requirements:**
- Accept CSV, XLSX, XLS, JSON file uploads
- Maximum file size: 50MB
- Parse files and detect columns/structure
- Handle CSV with/without headers
- Excel: parse first sheet by default, allow sheet selection
- JSON: auto-detect array of objects, allow path specification for nested structures

**Non-Functional Requirements:**
- Upload progress indication for files > 1MB
- Parsing complete within 30 seconds for 50MB file
- Store uploaded files for 30 days

**Edge Cases:**
- CSV with inconsistent column counts (use max column count, fill missing with null)
- Excel with merged cells (unmerge and duplicate values)
- JSON with mixed object structures (union of all keys)
- UTF-8 encoding issues (attempt detection, fall back to latin-1)
- Empty files (reject with clear message)

**Error States:**
- File too large: "Maximum file size is 50MB. Your file is X MB."
- Unsupported format: "Supported formats: CSV, XLSX, XLS, JSON"
- Parse failure: "Unable to parse file. Please check the format." + specific error
- Upload network failure: "Upload interrupted. Click to retry."

**Out of Scope for MVP:**
- Zip file handling
- Multi-file upload in single action
- Direct URL import

---

### F-004: Field Mapping

**Description:** Map source fields to standard training data fields with transformation support.

**User Stories Addressed:** US-MAP-001, US-MAP-002, US-MAP-003, US-MAP-004

**Functional Requirements:**
- Display source columns with sample values (first 3 non-empty)
- Target fields: conversation_id, timestamp, role, content, subject, status, category, custom fields
- Drag-and-drop or dropdown mapping interface
- Smart suggestions based on column name matching
- Transformations: lowercase, uppercase, trim, date format, value mapping
- Live preview of mapped and transformed data (10 records)

**Non-Functional Requirements:**
- Preview update < 2 seconds after mapping change
- Support up to 100 source columns

**Edge Cases:**
- Source column mapped to multiple targets (not allowed—one-to-one only)
- Target field without mapping (remains null in output)
- Transformation produces empty value (keep empty, don't drop record)
- Date parsing with ambiguous formats (show warning, let user specify)

**Error States:**
- Invalid date format: "Could not parse date. Expected format: YYYY-MM-DD"
- Invalid value mapping: "Value 'X' has no mapping defined"
- Preview unavailable: "Unable to generate preview. Please check your mappings."

**Out of Scope for MVP:**
- Calculated fields (combining multiple source columns)
- Conditional mapping logic
- Machine learning-based auto-mapping

---

### F-005: De-identification Engine

**Description:** Detect and replace PII with configurable placeholder patterns.

**User Stories Addressed:** US-PII-001, US-PII-002, US-PII-003, US-PII-004

**Functional Requirements:**
- Auto-detect: names, emails, phone numbers, addresses, company names
- Default replacement patterns: [PERSON_1], [EMAIL], [PHONE], [ADDRESS], [COMPANY_1]
- Consistent replacement (same entity → same placeholder throughout)
- Custom regex rules with user-defined replacement patterns
- Preview showing before/after comparison
- Configuration approval workflow (user confirms before processing)

**Non-Functional Requirements:**
- PII detection accuracy > 90% for common patterns
- Detection completes within 60 seconds for 10,000 records
- Support up to 50 custom de-identification rules

**Edge Cases:**
- Name that is also a common word (e.g., "Will", "May")—flag ambiguous for review
- Multiple PII types in single field (replace all sequentially)
- PII detection false positive (user can add to exception list, post-MVP)
- Unicode names and addresses (support common Unicode ranges)

**Error States:**
- Invalid regex pattern: "Invalid pattern: [specific regex error]"
- Detection timeout: "PII detection taking longer than expected. Processing large dataset—please wait."

**Out of Scope for MVP:**
- ML-based entity recognition
- PII detection for non-English text
- Exception list for false positives
- De-identification audit report export

---

### F-006: Quality Filtering

**Description:** Filter records based on conversation length, status, date range, and custom criteria.

**User Stories Addressed:** US-FILT-001, US-FILT-002, US-FILT-003, US-FILT-004

**Functional Requirements:**
- Minimum conversation length filter (message count)
- Status-based filtering (include/exclude specific values)
- Date range filtering (start date, end date, or both)
- Filter summary showing record counts (total, included, excluded by rule)
- Warning when filters exclude >90% of records
- Error when filters result in 0 records

**Non-Functional Requirements:**
- Filter summary calculation < 5 seconds for 100,000 records

**Edge Cases:**
- Filters with conflicting criteria (apply all—may result in 0 records)
- Records with null values for filtered fields (exclude from filter, include in processing unless explicitly filtered)
- Date field not mapped (date filter option disabled)

**Error States:**
- No records pass filters: "No records match your filter criteria. Please adjust filters."
- Filter field not mapped: "To filter by [field], first map a source column to [field]."

**Out of Scope for MVP:**
- Custom SQL/expression filters
- Content-based filtering (keyword, topic)
- Quality scoring

---

### F-007: Processing and Output Generation

**Description:** Execute processing pipeline and generate downloadable output files.

**User Stories Addressed:** US-PROC-001, US-PROC-002, US-PROC-003, US-PROC-004

**Functional Requirements:**
- Output formats: Conversational JSONL, Q&A Pairs JSONL, Raw JSON
- Progress indication during processing (records processed / total)
- Processing status: Queued, Processing, Complete, Failed
- Download complete output file
- Re-process with changed configuration (replaces previous output)
- Store outputs until manually deleted

**Non-Functional Requirements:**
- Process 100,000 records within 10 minutes
- Output file available for download within 5 seconds of completion
- Maximum output file size: 500MB

**Edge Cases:**
- Processing interrupted (server restart)—detect incomplete runs and allow retry
- Very large output file (>100MB)—stream download rather than generate in memory
- Concurrent processing requests for same source (queue and process sequentially)

**Error States:**
- Processing failed: "Processing failed: [specific error]. Click to retry."
- Download failed: "Unable to prepare download. Please try again."
- Output expired: "Output file no longer available. Re-process to generate new output."

**Out of Scope for MVP:**
- Scheduled/automated processing
- Incremental processing (only new records)
- Cloud storage destination (S3, GCS)
- Webhook notification on completion

---

### F-008: API Connector - Teamwork Desk

**Description:** Connect to Teamwork Desk to fetch support ticket data.

**User Stories Addressed:** US-API-001, US-API-002, US-API-003, US-API-004, US-API-005, US-API-006

**Functional Requirements:**
- Organization-level API connection management
- Teamwork Desk: API key authentication, fetch tickets with conversations
- Connection testing before save
- Project-level source configuration: select data type, apply filters (date range, project)
- Manual data refresh from API

**Non-Functional Requirements:**
- API connection test < 10 seconds
- Initial data fetch completes within 5 minutes for typical dataset
- Handle API rate limiting gracefully (retry with backoff)

**Edge Cases:**
- API credentials revoked (show auth failure, prompt re-auth)
- API returns unexpected data structure (log error, show failure with details)
- Rate limited by API (exponential backoff, max 3 retries, then fail with message)
- Large dataset from API (paginate requests, show progress)

**Error States:**
- Authentication failed: "Unable to connect. Please verify your API credentials."
- Rate limited: "API rate limit reached. Will retry automatically."
- Fetch failed: "Unable to fetch data from Teamwork Desk: [specific error]"

**Out of Scope for MVP:**
- GoHighLevel connector (post-MVP)
- OAuth flow (API key only for MVP)
- Webhook-based sync
- Additional connectors (Zendesk, HubSpot, etc.)

---

### F-009: Audit Logging

**Description:** Record processing activities for compliance and debugging.

**User Stories Addressed:** US-AUDIT-001

**Functional Requirements:**
- Log all processing runs: timestamp, user, source, configuration snapshot, result
- Log user authentication events: login, logout, failed attempts
- Log administrative actions: user invite, removal, connection changes
- Project-level audit log view
- Export audit log to CSV

**Non-Functional Requirements:**
- Audit log entries retained indefinitely (MVP)
- Log query response < 2 seconds for 1,000 entries

**Edge Cases:**
- Very long audit history (pagination)
- Deleted user in audit log (show "[Deleted User]" with historical ID)
- Configuration snapshot for deleted source (retain snapshot in log)

**Error States:**
- Export failed: "Unable to export audit log. Please try again."

**Out of Scope for MVP:**
- SIEM integration
- Real-time audit alerts
- Custom audit report generation

---

## Section 6: MVP Definition

### MVP Feature List with Removal Test Results

| Feature | Removal Test | MVP Status | Rationale |
|---------|--------------|------------|-----------|
| F-001: User Authentication | Cannot be removed—no access control | MVP | Core requirement |
| F-002: Project Management | Cannot be removed—no organization | MVP | Core requirement |
| F-003: File Upload (CSV) | Cannot be removed—no data ingestion | MVP | Core value prop |
| F-003: File Upload (Excel) | Could ship without, but breaks "any source" promise | MVP | Target users have Excel |
| F-003: File Upload (JSON) | Could ship without | MVP | Common export format |
| F-004: Field Mapping | Cannot be removed—no transformation | MVP | Core value prop |
| F-004: Smart Suggestions | Could ship without—manual mapping works | MVP | Key to 5-min experience |
| F-004: Transformations | Could ship without | MVP | Required for role mapping |
| F-005: De-identification | Cannot be removed—core differentiator | MVP | Core value prop |
| F-005: Custom Patterns | Could ship without defaults | MVP | Required for "any data" |
| F-006: Quality Filtering | Could ship without—full output | MVP | Training data quality |
| F-007: Processing | Cannot be removed—no output | MVP | Core requirement |
| F-007: Output Formats | Could ship with one format only | MVP | Different use cases |
| F-008: API - Teamwork Desk | Could launch file-upload only | MVP | Key differentiation |
| F-009: Audit Log | Could ship without | MVP | Compliance requirement |

### MVP Scope Summary

**Included in MVP:**
- User authentication (email/password, invite-only)
- Organization and project management
- File upload sources (CSV, Excel, JSON)
- Automated column detection and smart mapping suggestions
- Field mapping with basic transformations
- PII detection and de-identification with custom patterns
- Quality filtering (length, status, date)
- Batch processing with progress indication
- Three output formats (Conversational JSONL, Q&A Pairs, Raw JSON)
- Download outputs
- Teamwork Desk API connector
- Basic audit logging

**Excluded from MVP (Post-Launch):**
- SSO/SAML
- Self-service signup
- GoHighLevel API connector
- Scheduled/automated processing
- Cloud storage export destinations
- Additional API connectors (Zendesk, HubSpot, etc.)
- De-identification exception lists
- Advanced filtering (keyword, topic, quality scoring)
- Project-level permissions

### Success Criteria for Launch

1. **Core Flow Completion Rate:** 80% of users who upload a CSV complete processing and download output
2. **Time to Value:** Median time from signup to first download < 10 minutes
3. **Data Quality:** < 1% of outputs contain detectable PII (audited sample)
4. **Reliability:** 99% uptime during business hours, < 1% failed processing jobs

### Post-Launch Metrics (6-Month Targets)

- 50 active organizations
- 200 total projects created
- 1M records processed
- NPS > 40

---

## Section 7: Information Architecture

### Content Organization

**Primary Hierarchy:**
```
Organization (tenant boundary)
├── Settings
│   ├── Organization Details
│   ├── User Management
│   └── API Connections
├── Projects (list)
│   └── Project
│       ├── Sources (list)
│       │   └── Source
│       │       ├── Configuration
│       │       │   ├── Field Mapping
│       │       │   ├── De-identification
│       │       │   └── Filters
│       │       ├── Processing
│       │       └── Outputs
│       └── Audit Log
└── Help / Documentation
```

### Navigation Structure

**Global Navigation (persistent):**
- Logo (home/dashboard)
- Projects
- Organization Settings (admin only indicator)
- User Profile / Logout

**Project-Level Navigation:**
- Project Overview
- Sources
- Processing History
- Audit Log

**Source-Level Navigation (tabs):**
- Data Preview
- Field Mapping
- De-identification
- Filters
- Output

### User Flows

**Flow 1: First-Time File Upload (Core Value Path)**
1. Dashboard (empty state) → Click "Create Project"
2. Project creation modal → Enter name → Click Create
3. Project view (empty) → Click "Add Source" → Select "File Upload"
4. File upload screen → Drag CSV file → Upload completes
5. Column detection → Review detected columns with samples
6. Field mapping → Accept smart suggestions or adjust → Click Continue
7. De-identification preview → Review highlighted PII → Confirm rules → Click Continue
8. Filter configuration → Set minimum length (optional) → Click Continue
9. Processing screen → Select output format → Click "Process"
10. Progress indicator → Processing completes
11. Download screen → Click "Download" → File saves locally

**Flow 2: API Source Setup**
1. Organization Settings → API Connections → Click "Add Connection"
2. Select platform (Teamwork Desk) → Enter API credentials → Test → Save
3. Navigate to Project → Add Source → Select Teamwork Desk
4. Configure: select data type, date range, specific projects
5. Fetch data → Progress → Complete
6. Continue to Field Mapping (same as file upload from here)

**Flow 3: Re-process with Changes**
1. Project view → Select existing source
2. Navigate to section to change (Mapping, De-identification, or Filters)
3. Make changes → Save
4. Processing tab shows "Configuration changed" indicator
5. Click "Re-process" → Confirm → Processing runs
6. New output available → Download

**Flow 4: User Management**
1. Organization Settings → Users
2. View current users (name, email, role, invite date)
3. Click "Invite User" → Enter email → Send
4. Invited user appears as "Pending"
5. (Async) User receives email → Clicks link → Creates account → Joins org
6. User status changes to "Active"

### Screen/Page Inventory

| Screen | Purpose | Primary User |
|--------|---------|--------------|
| Login | Authentication | All |
| Password Reset | Account recovery | All |
| Accept Invitation | New user onboarding | New users |
| Dashboard | Project list, empty state | All |
| Project View | Source list, project summary | All |
| Add Source - File Upload | Upload and parsing | Ops Manager, Analyst |
| Add Source - API | Platform selection, config | Analyst, Admin |
| Source - Data Preview | View parsed data | All |
| Source - Field Mapping | Map columns to fields | Ops Manager, Analyst |
| Source - De-identification | Configure PII rules | Analyst, Compliance |
| Source - Filters | Configure quality filters | Analyst |
| Source - Processing | Trigger and monitor processing | Ops Manager, Analyst |
| Source - Output | View and download results | Ops Manager, Analyst |
| Org Settings - General | Organization name, info | Admin |
| Org Settings - Users | Invite, manage, remove users | Admin |
| Org Settings - Connections | API connection management | Admin |
| Project Audit Log | Processing history, compliance | Compliance, Admin |

---

## Section 8: Assumptions and Constraints

### Technical Assumptions (Replit Context)

- **Deployment platform:** Replit
- **Database:** PostgreSQL (Neon)
- **Architecture:** Monolithic full-stack application
- **Frontend:** React with TypeScript
- **Backend:** Express.js with TypeScript
- **ORM:** Drizzle
- **Authentication:** JWT-based with bcrypt password hashing
- **File Storage:** Local filesystem for MVP (Replit persistent storage)
- **Background Processing:** Inline processing (no dedicated worker queue for MVP)

### Business Assumptions

1. **User acquisition:** Initial users will come from direct outreach and existing networks (no self-serve signup needed for MVP)
2. **Data ownership:** Users have legal right to process the data they upload
3. **Use case validation:** Support agent training is the primary initial use case; sales agent training is secondary
4. **Pricing:** Free during MVP; usage-based pricing post-MVP (per record processed)
5. **Support:** Email-based support sufficient for MVP user base

### Known Constraints

1. **Single container deployment** — No microservices, no dedicated background workers
2. **Replit resource limits** — Memory and CPU constraints affect processing large files
3. **Web browser access only** — No native mobile app, no desktop app
4. **File size limit** — 50MB per file due to upload/parsing constraints
5. **Record limit** — 100,000 records per project to ensure reasonable processing times
6. **API rate limits** — Dependent on third-party API limits (Teamwork Desk, GoHighLevel)
7. **Invite-only** — No self-service signup in MVP

### Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| PII detection misses sensitive data | High | Medium | Multiple detection passes, user preview/confirmation, conservative defaults |
| Third-party API changes | Medium | Medium | Abstraction layer, version monitoring, graceful degradation |
| Processing large files times out | Medium | Medium | Chunked processing, progress indication, resume capability |
| Users upload malformed data | Low | High | Robust parsing with clear error messages, sample validation |
| API credentials stored insecurely | High | Low | Encrypted at rest, limited access, no plaintext logging |
| Concurrent processing overloads server | Medium | Low | Queue processing requests, limit concurrent jobs |

---

## Section 9: Success Metrics

### Key Performance Indicators

| KPI | Definition | Measurement Method |
|-----|------------|-------------------|
| Time to First Output | Minutes from signup to first download | Analytics: timestamp tracking |
| Processing Completion Rate | % of started processing jobs that complete | Database: job status counts |
| Core Flow Completion | % of users who upload → download | Funnel analytics |
| Weekly Active Projects | Projects with ≥1 processing run per week | Database: activity query |
| PII Detection Accuracy | % of known PII correctly detected | Audit sample + manual review |
| User Retention (7-day) | % of users active 7 days after signup | Analytics: cohort tracking |

### Launch Targets (Day 0)

- Core flow completion rate: >60%
- Time to first output: <15 minutes
- Processing completion rate: >95%
- System uptime: >99%

### 6-Month Milestones

| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| Active Organizations | 10 | 25 | 50 |
| Total Projects | 30 | 100 | 200 |
| Records Processed | 100K | 500K | 1M |
| NPS | Baseline | >30 | >40 |
| Core Flow Completion | >70% | >75% | >80% |

### Analytics Requirements

**Events to Track:**
- User: signup, login, logout
- Project: created, deleted
- Source: created (by type), mapping completed, de-identification configured, processing triggered, processing completed, download
- Organization: user invited, user removed, API connection added

**Funnels to Monitor:**
1. Signup → First project → First source → First download
2. Source created → Mapping complete → Processing complete → Downloaded
3. Invited → Accepted → Active (within 7 days)

---

## Section 10: Glossary

### Domain Terms

| Term | Definition |
|------|------------|
| De-identification | Process of removing or replacing personally identifiable information (PII) with placeholders |
| Field Mapping | Configuration that defines how source data columns correspond to target output fields |
| Processing Run | A single execution of the data transformation pipeline for a source |
| Source | A data input within a project (file upload or API connection) |
| Training Data | Structured output data formatted for AI model training or fine-tuning |

### Technical Terms

| Term | Definition |
|------|------------|
| JSONL | JSON Lines format; one JSON object per line, used for ML training data |
| PII | Personally Identifiable Information; data that can identify an individual |
| RAG | Retrieval-Augmented Generation; AI technique using external knowledge |
| Fine-tuning | Process of training a pre-trained AI model on domain-specific data |

### Acronyms

| Acronym | Expansion |
|---------|-----------|
| API | Application Programming Interface |
| CSV | Comma-Separated Values |
| JWT | JSON Web Token |
| MVP | Minimum Viable Product |
| CRUD | Create, Read, Update, Delete |

---

## Document Validation

### Completeness Check

- [x] All 10 sections populated
- [x] All personas have ≥3 user stories
- [x] All user stories have ≥2 acceptance criteria
- [x] All MVP features have documented removal test
- [x] All features trace to user stories
- [x] All user stories trace to personas
- [x] All user flows include error states
- [x] Technical assumptions compatible with Replit

### Confidence Scores

| Section | Score (1-10) | Notes |
|---------|--------------|-------|
| Problem Statement | 9 | Clear pain point, quantified, specific persona |
| Personas | 8 | Four distinct personas, may add more post-research |
| User Stories | 8 | Comprehensive for MVP, acceptance criteria testable |
| MVP Scope | 9 | Clear removal tests, defensible decisions |
| Replit Compatibility | 9 | Standard stack, within resource limits |
| Overall | 8 | Ready for downstream agents |

### Flagged Items Requiring Review

1. **File size limit (50MB)** — May need adjustment based on real user data sizes
2. **Processing without workers** — Inline processing may timeout for largest datasets; monitor and add queue if needed

### Assumptions Made

1. **All org members see all projects** — Simplest permission model; may need project-level ACL post-MVP
2. **Single sheet parsing for Excel** — Sheet selection UI deferred; parse first sheet by default
3. **Teamwork Desk API key auth** — Verify API key is sufficient, no OAuth required
4. **30-day file retention** — Arbitrary; may need adjustment based on usage patterns

### Document Status: COMPLETE

---

## Downstream Agent Handoff Brief

### Deployment Context (All Agents)

**Target Platform: Replit**
- Single container deployment
- PostgreSQL database (Neon)
- Port 5000 for backend server
- Automatic HTTPS via Replit
- Environment variables via Replit Secrets

This context applies to all downstream agents. Do not specify infrastructure that conflicts with Replit's deployment model.

### For Agent 2: System Architecture

**Core Technical Challenges:**
- File parsing for multiple formats (CSV, Excel, JSON) with large file support (50MB)
- PII detection across free-text fields (names, emails, phones, addresses, companies)
- Consistent entity replacement (same entity → same placeholder throughout document)
- Processing pipeline: parse → map → detect PII → replace → filter → format → output

**Scale Expectations:**
- Concurrent users: 10-100
- Database records: Up to 500K (sources, runs, outputs metadata)
- Files: Up to 100MB per file (50MB upload + processing artifacts)
- Processing: Up to 100,000 records per job, target < 10 minutes

**Integration Requirements:**
- Teamwork Desk API (REST, API key auth)
- Email delivery (Replit-compatible service or simple SMTP)

**Authentication/Authorization:**
- JWT-based sessions, 24-hour expiry
- Organization-scoped access (multi-tenant)
- Admin vs. member role distinction

**Key Decisions Deferred:**
- PII detection library selection (regex vs. ML-lite approach)
- File storage strategy (Replit persistent storage vs. external)
- Background processing approach (inline vs. simple queue)

**Replit Constraints:**
- Single process, no dedicated workers
- Port 5000 required
- Consider memory limits for large file parsing

### For Agent 3: Data Modeling

**Primary Entities:**
- Organization (tenant)
- User (belongs to Organization)
- Invitation
- Project (belongs to Organization)
- Source (belongs to Project, polymorphic: FileSource, APISource)
- FieldMapping (belongs to Source)
- DeidentificationRule (belongs to Source)
- Filter (belongs to Source)
- ProcessingRun (belongs to Source)
- AuditLogEntry (belongs to Organization)
- APIConnection (belongs to Organization)

**Key Relationships:**
- Organization 1:N Users
- Organization 1:N Projects
- Organization 1:N APIConnections
- Project 1:N Sources
- Source 1:N FieldMappings
- Source 1:N DeidentificationRules
- Source 1:N Filters
- Source 1:N ProcessingRuns
- ProcessingRun 1:1 Output (or embedded)

**Data Lifecycle:**
- Uploaded files: 30-day retention
- Processed outputs: Kept until manually deleted
- Audit logs: Indefinite retention (MVP)
- Deleted projects: Cascade delete all related data

**Multi-Tenancy:**
- Organization ID on all tenant-scoped tables
- Query scoping required at application layer

**Replit Constraints:**
- PostgreSQL via Neon
- Drizzle ORM
- Consider JSON columns for flexible config storage (mappings, rules)

### For Agent 4: API Contract

**Primary Operations:**

Authentication:
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

Users:
- GET /api/users (org members)
- POST /api/users/invite
- DELETE /api/users/:id

Projects:
- GET /api/projects
- POST /api/projects
- GET /api/projects/:id
- PUT /api/projects/:id
- DELETE /api/projects/:id

Sources:
- GET /api/projects/:projectId/sources
- POST /api/projects/:projectId/sources/upload (multipart)
- POST /api/projects/:projectId/sources/api
- GET /api/sources/:id
- DELETE /api/sources/:id

Source Configuration:
- GET /api/sources/:id/mapping
- PUT /api/sources/:id/mapping
- GET /api/sources/:id/deidentification
- PUT /api/sources/:id/deidentification
- GET /api/sources/:id/filters
- PUT /api/sources/:id/filters

Processing:
- POST /api/sources/:id/process
- GET /api/sources/:id/processing-runs
- GET /api/processing-runs/:id

Outputs:
- GET /api/processing-runs/:id/download

Connections:
- GET /api/connections
- POST /api/connections
- PUT /api/connections/:id
- DELETE /api/connections/:id
- POST /api/connections/:id/test

Audit:
- GET /api/projects/:projectId/audit-log

**Authentication:** JWT in Authorization header (Bearer token)

**Replit Constraints:**
- Express.js
- Port 5000
- /api prefix
- Health endpoint required at GET /api/health

### For Agent 5: UI/UX Specification

**Primary User Flows:**
1. First-time file upload (core value demonstration)
2. API source setup
3. Re-process with configuration changes
4. User invitation and management

**Key Interaction Patterns:**
- Drag-and-drop file upload with progress
- Drag-and-drop field mapping
- Live preview for mappings and de-identification
- Step-by-step wizard for source configuration
- Inline editing for project metadata
- Confirmation dialogs for destructive actions

**Accessibility Requirements:**
- WCAG 2.1 AA compliance target
- Keyboard navigation for all interactions
- Screen reader compatibility
- Sufficient color contrast

**Mobile/Responsive Requirements:**
- Responsive design, mobile-friendly
- Primary use case is desktop; mobile is view-only acceptable
- Minimum supported width: 320px

**Replit Constraints:**
- React frontend
- Vite bundler
- Responsive web (no native mobile)

### For Agent 6: Implementation Orchestrator

**Replit-Specific Requirements:**
- Health endpoint at GET /api/health (required for deployment)
- Server must listen on process.env.PORT || 5000
- Database URL from environment variable DATABASE_URL
- Drizzle migrations with tsx wrapper
- Environment variables via Replit Secrets

**Implementation Priorities:**
1. Authentication + basic project CRUD
2. File upload + parsing (CSV first, then Excel, then JSON)
3. Field mapping UI + preview
4. De-identification engine + preview
5. Processing pipeline + download
6. API connectors
7. Audit logging

### Handoff Summary

- **Total user stories:** 81 (P0: 22, P1: 27, P2: 31, P3: 1)
- **MVP feature count:** 9 features
- **MVP user stories:** 80
- **Estimated complexity:** S: 40, M: 32, L: 8, XL: 1
- **Deployment target:** Replit
- **Recommended human review points:**
  - PII detection accuracy threshold (90% acceptable?)
  - File size and record count limits
  - Background processing approach decision
