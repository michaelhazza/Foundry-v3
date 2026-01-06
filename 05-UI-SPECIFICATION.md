# UI/UX Specification: Foundry

## Document Information

| Field | Value |
|-------|-------|
| Document ID | 05-UI-SPECIFICATION |
| Version | 1.0 |
| Last Updated | January 6, 2026 |
| Status | COMPLETE |
| Owner | Agent 5: UI/UX Specification |

## Input Documents Referenced

| Document | Version | Key Extractions |
|----------|---------|-----------------|
| 01-PRD.md | 1.0 | 81 user stories across 13 feature areas, 4 personas |
| 02-ARCHITECTURE.md | 1.0 | React 18, Vite, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form + Zod |
| 03-DATA-MODEL.md | 1.0 | 14 entities with Drizzle ORM schema |
| 04-API-CONTRACT.md | 1.0 | 62 endpoints, REST API, JWT in httpOnly cookies |

---

## 1. Design System Foundation

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React 18 | UI rendering |
| Language | TypeScript | Type safety |
| Bundler | Vite 5.x | Development and build |
| Styling | Tailwind CSS 3.x | Utility-first CSS |
| Components | shadcn/ui | Pre-built accessible components |
| Icons | Lucide React | Consistent icon set |
| Forms | React Hook Form + Zod | Form state and validation |
| Server State | TanStack Query | Data fetching and caching |
| Client State | Zustand | Minimal client state |
| Drag & Drop | @dnd-kit | Field mapping interactions |
| Platform | Replit | Deployment target |

### shadcn/ui Peer Dependencies

All versions should use `"latest"`:

```json
{
  "@radix-ui/react-accordion": "latest",
  "@radix-ui/react-alert-dialog": "latest",
  "@radix-ui/react-avatar": "latest",
  "@radix-ui/react-checkbox": "latest",
  "@radix-ui/react-dialog": "latest",
  "@radix-ui/react-dropdown-menu": "latest",
  "@radix-ui/react-label": "latest",
  "@radix-ui/react-popover": "latest",
  "@radix-ui/react-progress": "latest",
  "@radix-ui/react-radio-group": "latest",
  "@radix-ui/react-scroll-area": "latest",
  "@radix-ui/react-select": "latest",
  "@radix-ui/react-separator": "latest",
  "@radix-ui/react-switch": "latest",
  "@radix-ui/react-tabs": "latest",
  "@radix-ui/react-toast": "latest",
  "@radix-ui/react-tooltip": "latest",
  "class-variance-authority": "latest",
  "clsx": "latest",
  "tailwind-merge": "latest",
  "lucide-react": "latest",
  "tailwindcss-animate": "latest"
}
```

### cn() Utility Function (MANDATORY)

All `className` props must use the `cn()` utility:

```typescript
// client/src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Breakpoints

| Name | Min Width | Typical Devices |
|------|-----------|-----------------|
| sm | 640px | Large phones |
| md | 768px | Tablets |
| lg | 1024px | Laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large displays |

### Color System (CSS Variables)

Colors are defined as HSL values without the `hsl()` wrapper for Tailwind compatibility.

**Light Mode (default):**

| Variable | HSL Value | Usage |
|----------|-----------|-------|
| --background | 0 0% 100% | Page background |
| --foreground | 222.2 84% 4.9% | Primary text |
| --card | 0 0% 100% | Card backgrounds |
| --card-foreground | 222.2 84% 4.9% | Card text |
| --popover | 0 0% 100% | Popover backgrounds |
| --popover-foreground | 222.2 84% 4.9% | Popover text |
| --primary | 222.2 47.4% 11.2% | Primary actions |
| --primary-foreground | 210 40% 98% | Text on primary |
| --secondary | 210 40% 96.1% | Secondary actions |
| --secondary-foreground | 222.2 47.4% 11.2% | Text on secondary |
| --muted | 210 40% 96.1% | Muted backgrounds |
| --muted-foreground | 215.4 16.3% 46.9% | Muted text |
| --accent | 210 40% 96.1% | Accent backgrounds |
| --accent-foreground | 222.2 47.4% 11.2% | Accent text |
| --destructive | 0 84.2% 60.2% | Error/danger |
| --destructive-foreground | 210 40% 98% | Text on destructive |
| --border | 214.3 31.8% 91.4% | Borders |
| --input | 214.3 31.8% 91.4% | Input borders |
| --ring | 222.2 84% 4.9% | Focus rings |
| --radius | 0.5rem | Border radius base |

**Dark Mode:**

| Variable | HSL Value | Usage |
|----------|-----------|-------|
| --background | 222.2 84% 4.9% | Page background |
| --foreground | 210 40% 98% | Primary text |
| --card | 222.2 84% 4.9% | Card backgrounds |
| --card-foreground | 210 40% 98% | Card text |
| --popover | 222.2 84% 4.9% | Popover backgrounds |
| --popover-foreground | 210 40% 98% | Popover text |
| --primary | 210 40% 98% | Primary actions |
| --primary-foreground | 222.2 47.4% 11.2% | Text on primary |
| --secondary | 217.2 32.6% 17.5% | Secondary actions |
| --secondary-foreground | 210 40% 98% | Text on secondary |
| --muted | 217.2 32.6% 17.5% | Muted backgrounds |
| --muted-foreground | 215 20.2% 65.1% | Muted text |
| --accent | 217.2 32.6% 17.5% | Accent backgrounds |
| --accent-foreground | 210 40% 98% | Accent text |
| --destructive | 0 62.8% 30.6% | Error/danger |
| --destructive-foreground | 210 40% 98% | Text on destructive |
| --border | 217.2 32.6% 17.5% | Borders |
| --input | 217.2 32.6% 17.5% | Input borders |
| --ring | 212.7 26.8% 83.9% | Focus rings |

### Typography Scale

| Name | Tailwind Class | Size | Weight |
|------|----------------|------|--------|
| H1 | text-4xl font-bold | 36px | 700 |
| H2 | text-3xl font-semibold | 30px | 600 |
| H3 | text-2xl font-semibold | 24px | 600 |
| H4 | text-xl font-medium | 20px | 500 |
| Body | text-base | 16px | 400 |
| Small | text-sm | 14px | 400 |
| XSmall | text-xs | 12px | 400 |

### Spacing Scale

Using Tailwind's default spacing scale (4px base unit):

- 0.5 = 2px
- 1 = 4px
- 2 = 8px
- 3 = 12px
- 4 = 16px
- 6 = 24px
- 8 = 32px
- 12 = 48px
- 16 = 64px

### Border Radius

| Name | Class | Value |
|------|-------|-------|
| sm | rounded-sm | calc(var(--radius) - 4px) |
| md | rounded-md | calc(var(--radius) - 2px) |
| lg | rounded-lg | var(--radius) |
| xl | rounded-xl | calc(var(--radius) + 4px) |

### Accessibility Requirements

- **Target:** WCAG 2.1 AA minimum
- **Color contrast:** 4.5:1 for normal text, 3:1 for large text
- **Focus indicators:** Visible ring on all interactive elements (`ring-2 ring-ring ring-offset-2`)
- **Keyboard navigation:** Full support via Radix primitives

---

## 2. Navigation Structure

### Primary Navigation (Authenticated)

| Item | Route | Icon | Auth Required | Admin Only |
|------|-------|------|---------------|------------|
| Dashboard | /dashboard | LayoutDashboard | Yes | No |
| Settings | /settings | Settings | Yes | Yes |

### Secondary Navigation (Project Context)

When inside a project:

| Item | Route | Icon |
|------|-------|------|
| Overview | /projects/:id | Home |
| Sources | /projects/:id/sources | Database |
| Audit Log | /projects/:id/audit | FileText |

### User Menu

| Item | Action | Icon |
|------|--------|------|
| Profile | Navigate to /profile | User |
| Settings | Navigate to /settings | Settings |
| Logout | Clear auth, redirect to /login | LogOut |

### Route Structure

| Route | Screen | Auth | Admin | Layout |
|-------|--------|------|-------|--------|
| / | Redirect to /dashboard or /login | - | - | - |
| /login | Login | No | No | Auth |
| /forgot-password | Forgot Password | No | No | Auth |
| /reset-password | Reset Password | No | No | Auth |
| /invitations/:token | Accept Invitation | No | No | Auth |
| /dashboard | Dashboard (Project List) | Yes | No | Main |
| /projects/new | Create Project | Yes | No | Main |
| /projects/:projectId | Project Overview | Yes | No | Main |
| /projects/:projectId/sources | Source List | Yes | No | Main |
| /projects/:projectId/sources/upload | Upload Source | Yes | No | Main |
| /projects/:projectId/sources/api | Add API Source | Yes | No | Main |
| /sources/:sourceId | Source Detail | Yes | No | Main |
| /sources/:sourceId/mapping | Field Mapping | Yes | No | Main |
| /sources/:sourceId/deidentification | De-identification | Yes | No | Main |
| /sources/:sourceId/filters | Filters | Yes | No | Main |
| /sources/:sourceId/processing | Processing | Yes | No | Main |
| /sources/:sourceId/outputs | Outputs | Yes | No | Main |
| /processing-runs/:runId | Processing Run Detail | Yes | No | Main |
| /profile | User Profile | Yes | No | Main |
| /settings | Organization Settings | Yes | Yes | Main |
| /settings/users | User Management | Yes | Yes | Main |
| /settings/connections | API Connections | Yes | Yes | Main |
| /projects/:projectId/audit | Project Audit Log | Yes | No | Main |

### Breadcrumb Strategy

| Context | Breadcrumb |
|---------|------------|
| Dashboard | Dashboard |
| Project | Dashboard > [Project Name] |
| Source | Dashboard > [Project Name] > [Source Name] |
| Source Config | Dashboard > [Project Name] > [Source Name] > [Tab Name] |
| Settings | Settings |
| Settings Sub | Settings > [Section] |

---

## 3. Component Library

### shadcn/ui Components Used

| Component | Variants | Usage |
|-----------|----------|-------|
| Button | default, destructive, outline, secondary, ghost, link | All actions |
| Card | default | Content grouping |
| Dialog | default | Modals |
| Sheet | default | Side panels |
| Input | default | Text input |
| Textarea | default | Multi-line text |
| Label | default | Form labels |
| Select | default | Dropdown selection |
| Checkbox | default | Multi-select, toggles |
| RadioGroup | default | Single selection |
| Switch | default | Boolean toggles |
| Table | default | Data display |
| Badge | default, secondary, destructive, outline | Status indicators |
| Avatar | default | User images |
| Skeleton | default | Loading states |
| Toast | default, destructive | Notifications |
| Alert | default, destructive | Inline messages |
| AlertDialog | default | Confirmations |
| Progress | default | Progress indicators |
| Tabs | default | Tab navigation |
| DropdownMenu | default | Contextual menus |
| Tooltip | default | Help text |
| ScrollArea | default | Scrollable containers |
| Separator | default | Visual dividers |
| Form | default | Form wrapper |

### Button Specifications

**Variants:**

| Variant | Use Case | Example |
|---------|----------|---------|
| default | Primary actions | Submit, Save, Process |
| secondary | Alternative actions | Cancel, Back |
| outline | Tertiary actions | Edit, Configure |
| ghost | Subtle actions | Close, Menu items |
| destructive | Dangerous actions | Delete, Remove |
| link | Navigation | View more, Learn more |

**Sizes:**

| Size | Class | Use Case |
|------|-------|----------|
| sm | h-9 px-3 | Dense UIs, secondary actions |
| default | h-10 px-4 py-2 | Standard buttons |
| lg | h-11 px-8 | Hero CTAs, emphasized actions |
| icon | h-10 w-10 | Icon-only buttons |

**States:**

| State | Appearance |
|-------|------------|
| Default | Normal appearance |
| Hover | Slight background change |
| Focus | ring-2 ring-ring ring-offset-2 |
| Disabled | opacity-50, pointer-events-none |
| Loading | Disabled + Loader2 icon spinning |

### Card Specifications

**Anatomy:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Form Component Specifications

**Form Field Pattern:**

```tsx
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Label</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormDescription>Helper text</FormDescription>
      <FormMessage /> {/* Validation error */}
    </FormItem>
  )}
/>
```

**Required Form Components:**

- Form (provider wrapper)
- FormField (field wrapper)
- FormItem (field container)
- FormLabel (accessible label)
- FormControl (input wrapper)
- FormDescription (helper text)
- FormMessage (error display)

### Dialog Specifications

**Standard Dialog Pattern:**

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      <Button onClick={handleAction}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Dialog Sizes:**

| Size | Class | Use Case |
|------|-------|----------|
| sm | sm:max-w-[425px] | Simple confirmations |
| md | sm:max-w-[600px] | Standard forms |
| lg | sm:max-w-[800px] | Complex forms |
| xl | sm:max-w-[1000px] | Large content |

### Table Specifications

**Standard Table Pattern:**

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.field1}</TableCell>
        <TableCell>{item.field2}</TableCell>
        <TableCell className="text-right">
          <DropdownMenu>...</DropdownMenu>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## 4. Screen Specifications

### 4.1 Login Screen

**Metadata:**

| Field | Value |
|-------|-------|
| Route | /login |
| User Stories | US-AUTH-002 |
| Auth Required | No |
| Layout | Auth (centered card) |

**States:**

| State | Condition | Display |
|-------|-----------|---------|
| Default | Initial load | Login form |
| Loading | Submitting | Button loading state |
| Error | Invalid credentials | Alert with error message |
| Locked | Account locked | Alert with unlock time |

**Layout (Desktop):**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│     ┌───────────────────────────────────────┐      │
│     │           Foundry Logo                │      │
│     │                                       │      │
│     │  ┌─────────────────────────────────┐ │      │
│     │  │ Email                           │ │      │
│     │  │ [________________________]      │ │      │
│     │  └─────────────────────────────────┘ │      │
│     │                                       │      │
│     │  ┌─────────────────────────────────┐ │      │
│     │  │ Password                        │ │      │
│     │  │ [________________________]      │ │      │
│     │  └─────────────────────────────────┘ │      │
│     │                                       │      │
│     │  Forgot Password?                    │      │
│     │                                       │      │
│     │  [        Sign In          ]         │      │
│     │                                       │      │
│     └───────────────────────────────────────┘      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Data Requirements:**

None - this is a public form.

**Actions:**

| Element | Type | Action | API Endpoint | Success | Error |
|---------|------|--------|--------------|---------|-------|
| Sign In Button | Button type="submit" | Submit login form | POST /api/auth/login | Redirect to /dashboard | Show error Alert |
| Forgot Password Link | Link | Navigate | - | Go to /forgot-password | - |

**Form Specification:**

```typescript
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;
```

**Fields:**

| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| email | Input type="email" | Yes | Valid email format | "" |
| password | Input type="password" | Yes | Min 1 char | "" |

---

### 4.2 Forgot Password Screen

**Metadata:**

| Field | Value |
|-------|-------|
| Route | /forgot-password |
| User Stories | US-AUTH-004 |
| Auth Required | No |
| Layout | Auth (centered card) |

**States:**

| State | Condition | Display |
|-------|-----------|---------|
| Default | Initial load | Email form |
| Loading | Submitting | Button loading state |
| Success | Email sent | Success message |

**Layout (Desktop):**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│     ┌───────────────────────────────────────┐      │
│     │           Foundry Logo                │      │
│     │                                       │      │
│     │  Forgot Password                      │      │
│     │  Enter your email to receive a reset  │      │
│     │  link.                                │      │
│     │                                       │      │
│     │  ┌─────────────────────────────────┐ │      │
│     │  │ Email                           │ │      │
│     │  │ [________________________]      │ │      │
│     │  └─────────────────────────────────┘ │      │
│     │                                       │      │
│     │  [      Send Reset Link      ]        │      │
│     │                                       │      │
│     │  Back to Sign In                      │      │
│     │                                       │      │
│     └───────────────────────────────────────┘      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Actions:**

| Element | Type | Action | API Endpoint | Success | Error |
|---------|------|--------|--------------|---------|-------|
| Send Reset Link | Button type="submit" | Submit form | POST /api/auth/forgot-password | Show success message | Toast error |
| Back to Sign In | Link | Navigate | - | Go to /login | - |

**Form Specification:**

```typescript
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
```

---

### 4.3 Reset Password Screen

**Metadata:**

| Field | Value |
|-------|-------|
| Route | /reset-password?token=xxx |
| User Stories | US-AUTH-004 |
| Auth Required | No |
| Layout | Auth (centered card) |

**States:**

| State | Condition | Display |
|-------|-----------|---------|
| Loading | Validating token | Skeleton |
| Invalid | Token expired/invalid | Error message with link |
| Default | Token valid | Password form |
| Submitting | Form submitting | Button loading state |
| Success | Password reset | Success + redirect |

**Layout (Desktop):**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│     ┌───────────────────────────────────────┐      │
│     │           Foundry Logo                │      │
│     │                                       │      │
│     │  Reset Password                       │      │
│     │  Enter your new password below.       │      │
│     │                                       │      │
│     │  ┌─────────────────────────────────┐ │      │
│     │  │ New Password                    │ │      │
│     │  │ [________________________]      │ │      │
│     │  └─────────────────────────────────┘ │      │
│     │                                       │      │
│     │  ┌─────────────────────────────────┐ │      │
│     │  │ Confirm Password               │ │      │
│     │  │ [________________________]      │ │      │
│     │  └─────────────────────────────────┘ │      │
│     │                                       │      │
│     │  [      Reset Password       ]        │      │
│     │                                       │      │
│     └───────────────────────────────────────┘      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Form Specification:**

```typescript
const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
```

---

### 4.4 Accept Invitation Screen

**Metadata:**

| Field | Value |
|-------|-------|
| Route | /invitations/:token |
| User Stories | US-AUTH-001 |
| Auth Required | No |
| Layout | Auth (centered card) |

**States:**

| State | Condition | Display |
|-------|-----------|---------|
| Loading | Validating token | Skeleton |
| Invalid | Token expired/invalid | Error message |
| Default | Token valid | Registration form |
| Submitting | Form submitting | Button loading state |
| Success | Account created | Redirect to dashboard |

**Layout (Desktop):**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│     ┌───────────────────────────────────────┐      │
│     │           Foundry Logo                │      │
│     │                                       │      │
│     │  Join [Organization Name]             │      │
│     │  You've been invited to join as a     │      │
│     │  [member/admin].                      │      │
│     │                                       │      │
│     │  ┌─────────────────────────────────┐ │      │
│     │  │ Email (read-only)              │ │      │
│     │  │ [invited@example.com      ]    │ │      │
│     │  └─────────────────────────────────┘ │      │
│     │                                       │      │
│     │  ┌─────────────────────────────────┐ │      │
│     │  │ Your Name                      │ │      │
│     │  │ [________________________]      │ │      │
│     │  └─────────────────────────────────┘ │      │
│     │                                       │      │
│     │  ┌─────────────────────────────────┐ │      │
│     │  │ Password                        │ │      │
│     │  │ [________________________]      │ │      │
│     │  └─────────────────────────────────┘ │      │
│     │                                       │      │
│     │  [      Create Account       ]        │      │
│     │                                       │      │
│     └───────────────────────────────────────┘      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Data Requirements:**

| Field | API Source | Component |
|-------|------------|-----------|
| email | GET /api/invitations/:token/validate → email | Input (disabled) |
| organizationName | GET /api/invitations/:token/validate → organizationName | Text |
| role | GET /api/invitations/:token/validate → role | Badge |

**Form Specification:**

```typescript
const acceptInvitationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain at least one number"),
});
```

**Actions:**

| Element | Type | Action | API Endpoint | Success | Error |
|---------|------|--------|--------------|---------|-------|
| Create Account | Button type="submit" | Submit form | POST /api/invitations/:token/accept | Redirect to /dashboard | Toast error |

---

### 4.5 Dashboard (Project List) Screen

**Metadata:**

| Field | Value |
|-------|-------|
| Route | /dashboard |
| User Stories | US-PROJ-002, US-PROJ-005 |
| Auth Required | Yes |
| Layout | Main |

**States:**

| State | Condition | Display |
|-------|-----------|---------|
| Loading | Fetching projects | Skeleton cards |
| Default | Projects exist | Project cards grid |
| Empty | No projects | Empty state with CTA |
| Error | Fetch failed | Alert with retry |

**Layout (Desktop):**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] Foundry                    [Search]    [User Menu ▾]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Projects                                    [+ New Project]    │
│                                                                 │
│  [Search projects...]                                           │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Project 1       │  │ Project 2       │  │ Project 3       │ │
│  │ Description...  │  │ Description...  │  │ Description...  │ │
│  │                 │  │                 │  │                 │ │
│  │ 3 sources       │  │ 5 sources       │  │ 1 source        │ │
│  │ Updated 2h ago  │  │ Updated 1d ago  │  │ Updated 5d ago  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │ Project 4       │  │ Project 5       │                      │
│  │ Description...  │  │ Description...  │                      │
│  │                 │  │                 │                      │
│  │ 2 sources       │  │ 0 sources       │                      │
│  │ Updated 1w ago  │  │ Updated 2w ago  │                      │
│  └─────────────────┘  └─────────────────┘                      │
│                                                                 │
│  [Pagination: < 1 2 3 ... 5 >]                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Layout (Mobile):**

```
┌─────────────────────────┐
│ [≡]  Foundry      [👤]  │
├─────────────────────────┤
│                         │
│  Projects               │
│  [+ New Project]        │
│                         │
│  [Search...]            │
│                         │
│  ┌─────────────────────┐│
│  │ Project 1           ││
│  │ Description...      ││
│  │ 3 sources           ││
│  │ Updated 2h ago      ││
│  └─────────────────────┘│
│                         │
│  ┌─────────────────────┐│
│  │ Project 2           ││
│  │ Description...      ││
│  │ 5 sources           ││
│  │ Updated 1d ago      ││
│  └─────────────────────┘│
│                         │
└─────────────────────────┘
```

**Data Requirements:**

| Field | API Source | Component |
|-------|------------|-----------|
| projects | GET /api/projects → data | Card grid |
| name | projects[].name | CardTitle |
| description | projects[].description | CardDescription |
| sourceCount | projects[].sourceCount | Text |
| updatedAt | projects[].updatedAt | Text (relative time) |

**TanStack Query Configuration:**

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['projects', { page, search }],
  queryFn: () => fetchProjects({ page, search }),
  staleTime: 30000, // 30 seconds
});
```

**Actions:**

| Element | Type | Action | API Endpoint | Success | Error |
|---------|------|--------|--------------|---------|-------|
| New Project | Button | Open create dialog | - | Show dialog | - |
| Project Card | Clickable Card | Navigate | - | Go to /projects/:id | - |
| Search | Input | Filter projects | GET /api/projects?search= | Update list | - |
| Card Menu | DropdownMenu | Show options | - | - | - |
| Delete (in menu) | Button | Open confirm dialog | - | Show AlertDialog | - |

**Empty State:**

```tsx
<Card className="flex flex-col items-center justify-center p-12 text-center">
  <div className="rounded-full bg-muted p-4 mb-4">
    <FolderOpen className="h-8 w-8 text-muted-foreground" />
  </div>
  <CardTitle className="mb-2">No projects yet</CardTitle>
  <CardDescription className="mb-6">
    Create your first project to start preparing training data.
  </CardDescription>
  <Button onClick={() => setCreateDialogOpen(true)}>
    <Plus className="mr-2 h-4 w-4" />
    Create Project
  </Button>
</Card>
```

---

### 4.6 Create Project Dialog

**Metadata:**

| Field | Value |
|-------|-------|
| Trigger | "New Project" button on Dashboard |
| User Stories | US-PROJ-001 |
| Size | sm:max-w-[425px] |

**Layout:**

```tsx
<Dialog>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Create Project</DialogTitle>
      <DialogDescription>
        Create a new project to organize your data processing work.
      </DialogDescription>
    </DialogHeader>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField name="name" ... />
        <FormField name="description" ... />
        <DialogFooter>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            Create Project
          </Button>
        </DialogFooter>
      </form>
    </Form>
  </DialogContent>
</Dialog>
```

**Form Specification:**

```typescript
const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
});
```

**Fields:**

| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| name | Input | Yes | Min 1, max 100 chars | "" |
| description | Textarea | No | Max 500 chars | "" |

**Actions:**

| Element | Type | Action | API Endpoint | Success | Error |
|---------|------|--------|--------------|---------|-------|
| Cancel | Button | Close dialog | - | Close dialog | - |
| Create Project | Button type="submit" | Submit form | POST /api/projects | Toast success + Navigate to project | Toast error |

---

### 4.7 Project Overview Screen

**Metadata:**

| Field | Value |
|-------|-------|
| Route | /projects/:projectId |
| User Stories | US-PROJ-006 |
| Auth Required | Yes |
| Layout | Main |

**States:**

| State | Condition | Display |
|-------|-----------|---------|
| Loading | Fetching project | Skeleton |
| Default | Project loaded | Full content |
| Error | Fetch failed | Alert with retry |
| Not Found | Project doesn't exist | 404 message |

**Layout (Desktop):**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] Foundry                                  [User Menu ▾]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dashboard > [Project Name]                     [⋮ Edit/Delete] │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Tabs: [Overview] [Sources] [Audit Log]                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌────────────────────────────────┐  ┌────────────────────────┐│
│  │ Sources                        │  │ Recent Activity        ││
│  │                        [View →]│  │                        ││
│  │ ┌────────────────────────────┐ │  │ Processing completed   ││
│  │ │ Source 1         ● Ready   │ │  │ Source added           ││
│  │ └────────────────────────────┘ │  │ Config updated         ││
│  │ ┌────────────────────────────┐ │  │                        ││
│  │ │ Source 2         ● Parsing │ │  │                        ││
│  │ └────────────────────────────┘ │  │                        ││
│  │                                │  │                        ││
│  │ [+ Add Source]                 │  │                        ││
│  └────────────────────────────────┘  └────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Statistics                                                  ││
│  │                                                             ││
│  │   Total Sources: 3      Total Records: 15,000               ││
│  │   Last Processed: Jan 5, 2026                               ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Requirements:**

| Field | API Source | Component |
|-------|------------|-----------|
| project | GET /api/projects/:id → data | Page content |
| name | project.name | H1, Breadcrumb |
| description | project.description | Text |
| sourceCount | project.sourceCount | Stat card |
| totalRecordsProcessed | project.totalRecordsProcessed | Stat card |
| lastProcessedAt | project.lastProcessedAt | Stat card |
| sources | project.sources | Source list |

**Actions:**

| Element | Type | Action | API Endpoint | Success | Error |
|---------|------|--------|--------------|---------|-------|
| Edit (menu) | Button | Open edit dialog | - | Show dialog | - |
| Delete (menu) | Button | Open delete dialog | - | Show AlertDialog | - |
| Add Source | Button | Open add source dialog | - | Show dialog | - |
| Source row | Clickable | Navigate | - | Go to /sources/:id | - |
| View Sources | Button | Navigate | - | Go to /projects/:id/sources | - |

---

### 4.8 Add Source Dialog

**Metadata:**

| Field | Value |
|-------|-------|
| Trigger | "Add Source" button |
| User Stories | US-FILE-001, US-API-002 |
| Size | sm:max-w-[600px] |

**Layout:**

```tsx
<Dialog>
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>Add Data Source</DialogTitle>
      <DialogDescription>
        Upload a file or connect to an API to add data to your project.
      </DialogDescription>
    </DialogHeader>
    <Tabs defaultValue="file">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="file">
          <Upload className="mr-2 h-4 w-4" />
          File Upload
        </TabsTrigger>
        <TabsTrigger value="api">
          <Cloud className="mr-2 h-4 w-4" />
          API Connection
        </TabsTrigger>
      </TabsList>
      <TabsContent value="file">
        {/* File upload form */}
      </TabsContent>
      <TabsContent value="api">
        {/* API connection form */}
      </TabsContent>
    </Tabs>
  </DialogContent>
</Dialog>
```

**Tab: File Upload**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │     [Cloud Upload Icon]                                 ││
│  │                                                         ││
│  │     Drag & drop your file here, or click to browse      ││
│  │                                                         ││
│  │     Supports CSV, Excel (.xlsx, .xls), and JSON         ││
│  │     Maximum file size: 50MB                             ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Source Name                                             ││
│  │ [filename.csv                                    ]      ││
│  │ This name will help you identify this source later      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Cancel]                                    [Upload File]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**File Upload Form:**

```typescript
const fileUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 50 * 1024 * 1024,
    "File must be less than 50MB"
  ).refine(
    (file) => ['text/csv', 'application/vnd.ms-excel', 
               'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               'application/json'].includes(file.type),
    "File must be CSV, Excel, or JSON"
  ),
  name: z.string().min(1, "Name is required").max(100),
});
```

**Tab: API Connection**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ API Connection                                          ││
│  │ [Select a connection...                           ▾]    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Source Name                                             ││
│  │ [Teamwork Tickets Q4                              ]     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Configuration                                           ││
│  │                                                         ││
│  │ Data Type: [Tickets                               ▾]    ││
│  │                                                         ││
│  │ Date Range:                                             ││
│  │ [Start Date] to [End Date]                              ││
│  │                                                         ││
│  │ Project Filter (optional):                              ││
│  │ [Select projects...                               ▾]    ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  No connections available? [Go to Settings]                 │
│                                                             │
│  [Cancel]                                    [Fetch Data]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**API Source Form:**

```typescript
const apiSourceSchema = z.object({
  connectionId: z.number().min(1, "Please select a connection"),
  name: z.string().min(1, "Name is required").max(100),
  config: z.object({
    dataType: z.enum(["tickets"]),
    dateRange: z.object({
      start: z.string().optional(),
      end: z.string().optional(),
    }).optional(),
    projectFilter: z.array(z.string()).optional(),
  }),
});
```

**Actions:**

| Element | Type | Action | API Endpoint | Success | Error |
|---------|------|--------|--------------|---------|-------|
| Cancel | Button | Close dialog | - | Close | - |
| Upload File | Button type="submit" | Upload file | POST /api/projects/:id/sources/upload | Toast + Navigate to source | Toast error |
| Fetch Data | Button type="submit" | Create API source | POST /api/projects/:id/sources/api | Toast + Navigate to source | Toast error |

---

### 4.9 Source Detail Screen

**Metadata:**

| Field | Value |
|-------|-------|
| Route | /sources/:sourceId |
| User Stories | US-SRC-001, US-SRC-004, US-SRC-005 |
| Auth Required | Yes |
| Layout | Main |

**States:**

| State | Condition | Display |
|-------|-----------|---------|
| Loading | Fetching source | Skeleton |
| Parsing | Source still parsing | Progress indicator |
| Ready | Source ready | Full content with tabs |
| Error | Source has error | Alert with error message |

**Layout (Desktop):**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] Foundry                                  [User Menu ▾]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dashboard > [Project] > [Source Name]          [⋮ Options]     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Tabs: [Preview] [Mapping] [De-identification] [Filters]     ││
│  │       [Processing] [Outputs]                                ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Data Preview                                                ││
│  │                                                             ││
│  │ ┌───────────┬───────────────┬────────────────┬───────────┐ ││
│  │ │ ticket_id │ customer_email│ subject        │ status    │ ││
│  │ ├───────────┼───────────────┼────────────────┼───────────┤ ││
│  │ │ TKT-001   │ john@...      │ Need help...   │ resolved  │ ││
│  │ │ TKT-002   │ jane@...      │ Question about │ open      │ ││
│  │ │ TKT-003   │ bob@...       │ Billing issue  │ resolved  │ ││
│  │ └───────────┴───────────────┴────────────────┴───────────┘ ││
│  │                                                             ││
│  │ Showing 1-20 of 5,000 records          [< Prev] [Next >]   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌────────────────────────────┐                                │
│  │ Source Statistics          │                                │
│  │ Total Rows: 5,000          │                                │
│  │ Columns: 12                │                                │
│  │ File Size: 2.5 MB          │                                │
│  │ Uploaded: Jan 5, 2026      │                                │
│  └────────────────────────────┘                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Requirements:**

| Field | API Source | Component |
|-------|------------|-----------|
| source | GET /api/sources/:id → data | Page content |
| preview | GET /api/sources/:id/preview → data | Table |
| stats | GET /api/sources/:id/stats → data | Stats card |

**Navigation Tabs:**

| Tab | Route | Purpose |
|-----|-------|---------|
| Preview | /sources/:id | View raw data |
| Mapping | /sources/:id/mapping | Configure field mapping |
| De-identification | /sources/:id/deidentification | Configure PII rules |
| Filters | /sources/:id/filters | Configure quality filters |
| Processing | /sources/:id/processing | Run processing |
| Outputs | /sources/:id/outputs | View/download outputs |

---

### 4.10 Field Mapping Screen

**Metadata:**

| Field | Value |
|-------|-------|
| Route | /sources/:sourceId/mapping |
| User Stories | US-MAP-001 through US-MAP-007 |
| Auth Required | Yes |
| Layout | Main |

**States:**

| State | Condition | Display |
|-------|-----------|---------|
| Loading | Fetching mapping | Skeleton |
| Default | Mapping loaded | Mapping UI |
| Saving | Auto-saving | Save indicator |

**Layout (Desktop):**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] Foundry                                  [User Menu ▾]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dashboard > [Project] > [Source] > Field Mapping               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Tabs: [Preview] [Mapping ●] [De-identification] [Filters]   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌───────────────────────────┐ ┌───────────────────────────────┐│
│  │ Source Columns            │ │ Target Fields                 ││
│  │                           │ │                               ││
│  │ ┌───────────────────────┐ │ │ ┌───────────────────────────┐││
│  │ │ ○ ticket_id           │─┼─┼─│ conversation_id      ✓    │││
│  │ │   "TKT-001", "TKT-002"│ │ │ └───────────────────────────┘││
│  │ └───────────────────────┘ │ │                               ││
│  │                           │ │ ┌───────────────────────────┐││
│  │ ┌───────────────────────┐ │ │ │ timestamp            [ ]  │││
│  │ │ ○ customer_email      │ │ │ └───────────────────────────┘││
│  │ │   "john@...", "jane@" │ │ │                               ││
│  │ └───────────────────────┘ │ │ ┌───────────────────────────┐││
│  │                           │ │ │ role                 ✓    │││
│  │ ┌───────────────────────┐─┼─┼─│                           │││
│  │ │ ○ sender_type         │ │ │ │   Transform: value_map   │││
│  │ │   "1", "2"            │ │ │ └───────────────────────────┘││
│  │ └───────────────────────┘ │ │                               ││
│  │                           │ │ ┌───────────────────────────┐││
│  │ ┌───────────────────────┐─┼─┼─│ content              ✓    │││
│  │ │ ○ body                │ │ │ │                           │││
│  │ │   "Hello, I need..."  │ │ │ │   Transform: trim        │││
│  │ └───────────────────────┘ │ │ └───────────────────────────┘││
│  │                           │ │                               ││
│  │                           │ │ [+ Add Custom Field]         ││
│  └───────────────────────────┘ └───────────────────────────────┘│
│                                                                 │
│  [Preview Mapped Data]                            Auto-saved ✓  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Requirements:**

| Field | API Source | Component |
|-------|------------|-----------|
| mapping | GET /api/sources/:id/mapping → data | Mapping UI |
| suggestions | GET /api/sources/:id/mapping/suggestions → data | Dotted lines |
| sourceColumns | From source.detectedColumns | Left column list |
| targetFields | Standard fields + custom | Right column list |

**Standard Target Fields:**

- conversation_id
- timestamp
- role
- content
- subject
- status
- category

**Actions:**

| Element | Type | Action | API Endpoint | Success | Error |
|---------|------|--------|--------------|---------|-------|
| Drag source to target | DnD | Create mapping | PUT /api/sources/:id/mapping (debounced) | Visual feedback | Toast error |
| Click target dropdown | Select | Assign column | PUT /api/sources/:id/mapping (debounced) | Visual feedback | Toast error |
| Add Custom Field | Button | Open input | - | Add field | - |
| Remove mapping | Button (X) | Clear mapping | PUT /api/sources/:id/mapping (debounced) | Visual feedback | Toast error |
| Configure transform | Button (gear) | Open transform dialog | - | Show dialog | - |
| Preview Mapped Data | Button | Open preview modal | POST /api/sources/:id/mapping/preview | Show preview | Toast error |

**Transform Configuration Dialog:**

```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Configure Transformation</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Transformation Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lowercase">Lowercase</SelectItem>
            <SelectItem value="uppercase">Uppercase</SelectItem>
            <SelectItem value="trim">Trim Whitespace</SelectItem>
            <SelectItem value="date_format">Date Format</SelectItem>
            <SelectItem value="value_map">Value Mapping</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {type === 'value_map' && (
        <div className="space-y-2">
          <Label>Value Mappings</Label>
          {/* Dynamic key-value input */}
        </div>
      )}
      
      {type === 'date_format' && (
        <div className="space-y-2">
          <Label>Output Format</Label>
          <Input placeholder="YYYY-MM-DD" />
        </div>
      )}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={close}>Cancel</Button>
      <Button onClick={save}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 4.11 De-identification Screen

**Metadata:**

| Field | Value |
|-------|-------|
| Route | /sources/:sourceId/deidentification |
| User Stories | US-PII-001 through US-PII-008 |
| Auth Required | Yes |
| Layout | Main |

**States:**

| State | Condition | Display |
|-------|-----------|---------|
| Loading | Fetching config | Skeleton |
| Default | Config loaded | Rules + summary |
| Scanning | PII scan running | Progress indicator |
| Approved | Config approved | Approved badge |

**Layout (Desktop):**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Dashboard > [Project] > [Source] > De-identification           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Tabs: [Preview] [Mapping ✓] [De-identification ●] [Filters] ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌────────────────────────────────┐ ┌──────────────────────────┐│
│  │ PII Detection Summary          │ │ Columns to Scan          ││
│  │                                │ │                          ││
│  │ Last scanned: Jan 5, 2026     │ │ ☑ customer_email         ││
│  │ [Scan Again]                   │ │ ☑ body                   ││
│  │                                │ │ ☐ ticket_id              ││
│  │ ┌────────────────────────────┐ │ │ ☐ status                 ││
│  │ │ 📧 Emails: 4,800           │ │ │ ☑ notes                  ││
│  │ │ 👤 Names: 150              │ │ │                          ││
│  │ │ 📞 Phones: 230             │ │ │                          ││
│  │ │ 📍 Addresses: 45           │ │ │                          ││
│  │ │ 🏢 Companies: 80           │ │ │                          ││
│  │ └────────────────────────────┘ │ │                          ││
│  └────────────────────────────────┘ └──────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ De-identification Rules                                     ││
│  │                                                             ││
│  │ ┌──────────────────────────────────────────────────────────┐││
│  │ │ ☑ Emails                  [EMAIL]            Default    │││
│  │ └──────────────────────────────────────────────────────────┘││
│  │ ┌──────────────────────────────────────────────────────────┐││
│  │ │ ☑ Names                   [PERSON_N]         Default    │││
│  │ └──────────────────────────────────────────────────────────┘││
│  │ ┌──────────────────────────────────────────────────────────┐││
│  │ │ ☑ Phone Numbers           [PHONE]            Default    │││
│  │ └──────────────────────────────────────────────────────────┘││
│  │ ┌──────────────────────────────────────────────────────────┐││
│  │ │ ☑ Addresses               [ADDRESS]          Default    │││
│  │ └──────────────────────────────────────────────────────────┘││
│  │ ┌──────────────────────────────────────────────────────────┐││
│  │ │ ☑ Account IDs             [ACCOUNT_ID]       Custom     │││
│  │ │   Pattern: ACC-\d{6}                          [Edit]    │││
│  │ └──────────────────────────────────────────────────────────┘││
│  │                                                             ││
│  │ [+ Add Custom Rule]                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [Preview De-identification]              [Approve Configuration]│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Requirements:**

| Field | API Source | Component |
|-------|------------|-----------|
| config | GET /api/sources/:id/deidentification → data | Page content |
| summary | GET /api/sources/:id/deidentification/summary → data | Summary card |

**Actions:**

| Element | Type | Action | API Endpoint | Success | Error |
|---------|------|--------|--------------|---------|-------|
| Scan Again | Button | Trigger PII scan | POST /api/sources/:id/deidentification/scan | Update summary | Toast error |
| Toggle rule | Switch | Enable/disable rule | PUT /api/sources/:id/deidentification | Auto-save | Toast error |
| Toggle column | Checkbox | Include/exclude column | PUT /api/sources/:id/deidentification | Auto-save | Toast error |
| Edit rule | Button | Open edit dialog | - | Show dialog | - |
| Add Custom Rule | Button | Open create dialog | - | Show dialog | - |
| Preview | Button | Open preview modal | POST /api/sources/:id/deidentification/preview | Show preview | Toast error |
| Approve | Button | Approve config | POST /api/sources/:id/deidentification/approve | Toast success + badge | Toast error |

**Custom Rule Dialog:**

```typescript
const customRuleSchema = z.object({
  type: z.literal("custom"),
  pattern: z.string().min(1, "Pattern is required"),
  replacement: z.string().min(1, "Replacement is required"),
});
```

---

### 4.12 Filters Screen

**Metadata:**

| Field | Value |
|-------|-------|
| Route | /sources/:sourceId/filters |
| User Stories | US-FILT-001 through US-FILT-007 |
| Auth Required | Yes |
| Layout | Main |

**Layout (Desktop):**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Dashboard > [Project] > [Source] > Filters                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Tabs: [Preview] [Mapping ✓] [De-identification ✓] [Filters ●]│
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Filter Summary                                              │ │
│  │                                                             │ │
│  │ Total Records: 5,000                                        │ │
│  │ After Filters: 4,200 (84%)                                  │ │
│  │ Excluded: 800 (16%)                                         │ │
│  │                                                             │ │
│  │ [=========================================--------] 84%     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Filter Configuration                                        │ │
│  │                                                             │ │
│  │ ┌──────────────────────────────────────────────────────────┐│ │
│  │ │ Minimum Conversation Length                              ││ │
│  │ │ Exclude conversations with fewer than [3    ] messages   ││ │
│  │ │                                           Excludes: 300  ││ │
│  │ └──────────────────────────────────────────────────────────┘│ │
│  │                                                             │ │
│  │ ┌──────────────────────────────────────────────────────────┐│ │
│  │ │ Minimum Content Length                                   ││ │
│  │ │ Exclude messages shorter than [50   ] characters         ││ │
│  │ │                                           Excludes: 150  ││ │
│  │ └──────────────────────────────────────────────────────────┘│ │
│  │                                                             │ │
│  │ ┌──────────────────────────────────────────────────────────┐│ │
│  │ │ Status Filter                                            ││ │
│  │ │ Include only: ☑ resolved  ☑ closed  ☐ open  ☐ pending   ││ │
│  │ │                                           Excludes: 200  ││ │
│  │ └──────────────────────────────────────────────────────────┘│ │
│  │                                                             │ │
│  │ ┌──────────────────────────────────────────────────────────┐│ │
│  │ │ Date Range                                               ││ │
│  │ │ From: [2025-10-01] To: [2025-12-31]                      ││ │
│  │ │                                           Excludes: 150  ││ │
│  │ └──────────────────────────────────────────────────────────┘│ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                                    Auto-saved ✓ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Requirements:**

| Field | API Source | Component |
|-------|------------|-----------|
| filters | GET /api/sources/:id/filters → data.filters | Form fields |
| summary | GET /api/sources/:id/filters/summary → data | Summary card |

**Filter Form:**

```typescript
const filtersSchema = z.object({
  minConversationLength: z.number().min(0).optional(),
  minContentLength: z.number().min(0).optional(),
  statusInclude: z.array(z.string()).optional(),
  statusExclude: z.array(z.string()).optional(),
  categoryInclude: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
});
```

**Actions:**

| Element | Type | Action | API Endpoint | Success | Error |
|---------|------|--------|--------------|---------|-------|
| Any filter change | Input/Checkbox | Update filters | PUT /api/sources/:id/filters (debounced) | Update summary | Toast error |

**Warning States:**

- If filters exclude > 90% of records: Show warning Alert
- If filters exclude 100% of records: Show error Alert

---

### 4.13 Processing Screen

**Metadata:**

| Field | Value |
|-------|-------|
| Route | /sources/:sourceId/processing |
| User Stories | US-PROC-001 through US-PROC-009 |
| Auth Required | Yes |
| Layout | Main |

**States:**

| State | Condition | Display |
|-------|-----------|---------|
| Ready | No active processing | Start processing form |
| Processing | Run in progress | Progress UI |
| Complete | Run finished | Success + download |
| Failed | Run failed | Error + retry |

**Layout (Desktop) - Ready State:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Dashboard > [Project] > [Source] > Processing                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Tabs: [Preview] [Mapping ✓] [De-id ✓] [Filters ✓] [Process ●]│
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Start Processing                                            │ │
│  │                                                             │ │
│  │ Configuration Summary                                       │ │
│  │ • Field Mappings: 6 configured ✓                            │ │
│  │ • De-identification: Approved ✓                             │ │
│  │ • Filters: 4,200 records will be processed                  │ │
│  │                                                             │ │
│  │ Output Format                                               │ │
│  │ ○ Conversational JSONL                                      │ │
│  │   One conversation per line with messages array             │ │
│  │                                                             │ │
│  │ ○ Q&A Pairs JSONL                                           │ │
│  │   Question/answer pairs extracted from conversations        │ │
│  │                                                             │ │
│  │ ○ Raw JSON                                                  │ │
│  │   Structured JSON with all mapped fields                    │ │
│  │                                                             │ │
│  │ [Preview Output Format]              [Start Processing]     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Processing History                                          │ │
│  │                                                             │ │
│  │ ┌──────────────────────────────────────────────────────────┐│ │
│  │ │ Run #15 | Jan 5, 2026 | Completed | 4,195 records        ││ │
│  │ │ Format: conversational_jsonl         [View] [Download]   ││ │
│  │ └──────────────────────────────────────────────────────────┘│ │
│  │ ┌──────────────────────────────────────────────────────────┐│ │
│  │ │ Run #14 | Jan 3, 2026 | Failed                           ││ │
│  │ │ Error: Memory limit exceeded            [View Log]       ││ │
│  │ └──────────────────────────────────────────────────────────┘│ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Layout (Desktop) - Processing State:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Processing in Progress                                      │ │
│  │                                                             │ │
│  │ ┌──────────────────────────────────────────────────────────┐│ │
│  │ │ Processing records...                                    ││ │
│  │ │                                                          ││ │
│  │ │ [=============================---------] 70%             ││ │
│  │ │                                                          ││ │
│  │ │ 2,940 of 4,200 records processed                         ││ │
│  │ │ Estimated time remaining: 2 minutes                      ││ │
│  │ └──────────────────────────────────────────────────────────┘│ │
│  │                                                             │ │
│  │                                     [Cancel Processing]     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Processing Form:**

```typescript
const startProcessingSchema = z.object({
  outputFormat: z.enum([
    "conversational_jsonl",
    "qa_pairs_jsonl", 
    "raw_json"
  ]),
});
```

**Actions:**

| Element | Type | Action | API Endpoint | Success | Error |
|---------|------|--------|--------------|---------|-------|
| Start Processing | Button | Start run | POST /api/sources/:id/process | Show progress | Toast error |
| Cancel Processing | Button | Cancel run | POST /api/processing-runs/:id/cancel | Toast + update UI | Toast error |
| Preview Format | Button | Open preview | POST /api/sources/:id/output-preview | Show dialog | Toast error |
| Download | Button | Download output | GET /api/outputs/:id/download | Download file | Toast error |
| View Log | Button | Navigate | - | Go to /processing-runs/:id | - |

**Polling Configuration:**

```typescript
const { data: runStatus } = useQuery({
  queryKey: ['processing-run', runId],
  queryFn: () => fetchProcessingRun(runId),
  refetchInterval: (data) => 
    data?.status === 'processing' ? 2000 : false,
  enabled: !!runId,
});
```

---

### 4.14 Outputs Screen

**Metadata:**

| Field | Value |
|-------|-------|
| Route | /sources/:sourceId/outputs |
| User Stories | US-OUT-001 through US-OUT-004 |
| Auth Required | Yes |
| Layout | Main |

**Layout (Desktop):**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Dashboard > [Project] > [Source] > Outputs                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Tabs: [Preview] [Mapping] [De-id] [Filters] [Process] [Out ●]│
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Generated Outputs                                           ││
│  │                                                             ││
│  │ ┌──────────────────────────────────────────────────────────┐││
│  │ │ output-15.jsonl                                          │││
│  │ │ Format: Conversational JSONL | 2.5 MB | 4,195 records    │││
│  │ │ Generated: Jan 5, 2026 3:35 PM                           │││
│  │ │                                                          │││
│  │ │ [Preview]  [Download]  [Delete]                          │││
│  │ └──────────────────────────────────────────────────────────┘││
│  │                                                             ││
│  │ ┌──────────────────────────────────────────────────────────┐││
│  │ │ output-12.jsonl                                          │││
│  │ │ Format: Q&A Pairs JSONL | 1.8 MB | 3,200 pairs           │││
│  │ │ Generated: Jan 3, 2026 10:20 AM                          │││
│  │ │                                                          │││
│  │ │ [Preview]  [Download]  [Delete]                          │││
│  │ └──────────────────────────────────────────────────────────┘││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Empty State:**

```tsx
<Card className="flex flex-col items-center justify-center p-12 text-center">
  <FileOutput className="h-8 w-8 text-muted-foreground mb-4" />
  <CardTitle className="mb-2">No outputs yet</CardTitle>
  <CardDescription className="mb-6">
    Process your data to generate downloadable outputs.
  </CardDescription>
  <Button asChild>
    <Link to={`/sources/${sourceId}/processing`}>Go to Processing</Link>
  </Button>
</Card>
```

**Actions:**

| Element | Type | Action | API Endpoint | Success | Error |
|---------|------|--------|--------------|---------|-------|
| Preview | Button | Open preview dialog | GET /api/outputs/:id/preview | Show dialog | Toast error |
| Download | Button | Download file | GET /api/outputs/:id/download | Download starts | Toast error |
| Delete | Button | Open confirm dialog | - | Show AlertDialog | - |
| Confirm Delete | Button | Delete output | DELETE /api/outputs/:id | Toast + refresh list | Toast error |

---

### 4.15 Organization Settings Screen

**Metadata:**

| Field | Value |
|-------|-------|
| Route | /settings |
| User Stories | US-ORG-001, US-ORG-002 |
| Auth Required | Yes |
| Admin Only | Yes |
| Layout | Main |

**Layout (Desktop):**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] Foundry                                  [User Menu ▾]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Settings                                                       │
│                                                                 │
│  ┌────────────────┐  ┌─────────────────────────────────────────┐│
│  │ Sidebar        │  │ Organization Details                   ││
│  │                │  │                                         ││
│  │ Organization   │  │ ┌─────────────────────────────────────┐ ││
│  │ Users          │  │ │ Organization Name                   │ ││
│  │ API Connections│  │ │ [Acme Corp                      ]   │ ││
│  │                │  │ └─────────────────────────────────────┘ ││
│  │                │  │                                         ││
│  │                │  │ Statistics                              ││
│  │                │  │ Users: 5                                ││
│  │                │  │ Projects: 12                            ││
│  │                │  │ Created: June 1, 2025                   ││
│  │                │  │                                         ││
│  │                │  │ [Save Changes]                          ││
│  │                │  │                                         ││
│  └────────────────┘  └─────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Requirements:**

| Field | API Source | Component |
|-------|------------|-----------|
| organization | GET /api/organization → data | Form |

**Form Specification:**

```typescript
const organizationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});
```

**Actions:**

| Element | Type | Action | API Endpoint | Success | Error |
|---------|------|--------|--------------|---------|-------|
| Save Changes | Button type="submit" | Update org | PATCH /api/organization | Toast success | Toast error |

---

### 4.16 User Management Screen

**Metadata:**

| Field | Value |
|-------|-------|
| Route | /settings/users |
| User Stories | US-ORG-003, US-ORG-004, US-AUTH-001, US-AUTH-003 |
| Auth Required | Yes |
| Admin Only | Yes |
| Layout | Main |

**Layout (Desktop):**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Settings > Users                                               │
│                                                                 │
│  ┌────────────────┐  ┌─────────────────────────────────────────┐│
│  │ Sidebar        │  │ Team Members                [+ Invite] ││
│  │                │  │                                         ││
│  │ Organization   │  │ ┌──────────────────────────────────────┐││
│  │ Users ●        │  │ │ Avatar | John Doe (you)             │││
│  │ API Connections│  │ │        | admin@example.com   Admin  │││
│  │                │  │ │        |                      [⋮]   │││
│  │                │  │ └──────────────────────────────────────┘││
│  │                │  │                                         ││
│  │                │  │ ┌──────────────────────────────────────┐││
│  │                │  │ │ Avatar | Jane Smith                  │││
│  │                │  │ │        | jane@example.com   Member   │││
│  │                │  │ │        |                      [⋮]   │││
│  │                │  │ └──────────────────────────────────────┘││
│  │                │  │                                         ││
│  │                │  │ Pending Invitations                     ││
│  │                │  │                                         ││
│  │                │  │ ┌──────────────────────────────────────┐││
│  │                │  │ │ new@example.com | Member | Pending   │││
│  │                │  │ │ Expires: Jan 13, 2026    [Resend][X] │││
│  │                │  │ └──────────────────────────────────────┘││
│  │                │  │                                         ││
│  └────────────────┘  └─────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Requirements:**

| Field | API Source | Component |
|-------|------------|-----------|
| users | GET /api/users → data | User list |
| invitations | GET /api/invitations → data | Invitation list |

**Actions:**

| Element | Type | Action | API Endpoint | Success | Error |
|---------|------|--------|--------------|---------|-------|
| Invite | Button | Open invite dialog | - | Show dialog | - |
| Change Role (menu) | Button | Open role dialog | - | Show dialog | - |
| Remove (menu) | Button | Open confirm dialog | - | Show AlertDialog | - |
| Resend Invitation | Button | Resend invite | POST /api/invitations/:id/resend | Toast success | Toast error |
| Cancel Invitation | Button | Cancel invite | DELETE /api/invitations/:id | Toast + refresh | Toast error |

**Invite User Dialog:**

```typescript
const inviteUserSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  role: z.enum(["admin", "member"]).default("member"),
});
```

---

### 4.17 API Connections Screen

**Metadata:**

| Field | Value |
|-------|-------|
| Route | /settings/connections |
| User Stories | US-API-001, US-API-004, US-API-005 |
| Auth Required | Yes |
| Admin Only | Yes |
| Layout | Main |

**Layout (Desktop):**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Settings > API Connections                                     │
│                                                                 │
│  ┌────────────────┐  ┌─────────────────────────────────────────┐│
│  │ Sidebar        │  │ API Connections          [+ Add Connection]│
│  │                │  │                                         ││
│  │ Organization   │  │ ┌──────────────────────────────────────┐││
│  │ Users          │  │ │ 🔗 Teamwork Production               │││
│  │ Connections ●  │  │ │    Type: Teamwork Desk               │││
│  │                │  │ │    Status: ● Active                  │││
│  │                │  │ │    Last tested: Jan 5, 2026          │││
│  │                │  │ │    Used by: 3 sources                │││
│  │                │  │ │                                      │││
│  │                │  │ │    [Test]  [Edit]  [Delete]          │││
│  │                │  │ └──────────────────────────────────────┘││
│  │                │  │                                         ││
│  └────────────────┘  └─────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Empty State:**

```tsx
<Card className="flex flex-col items-center justify-center p-12 text-center">
  <Cloud className="h-8 w-8 text-muted-foreground mb-4" />
  <CardTitle className="mb-2">No API connections</CardTitle>
  <CardDescription className="mb-6">
    Connect to external services to fetch data directly.
  </CardDescription>
  <Button onClick={() => setAddDialogOpen(true)}>
    <Plus className="mr-2 h-4 w-4" />
    Add Connection
  </Button>
</Card>
```

**Add Connection Dialog:**

```typescript
const connectionSchema = z.object({
  type: z.enum(["teamwork_desk"]),
  name: z.string().min(1, "Name is required").max(100),
  credentials: z.object({
    apiKey: z.string().min(1, "API key is required"),
    subdomain: z.string().min(1, "Subdomain is required"),
  }),
});
```

**Actions:**

| Element | Type | Action | API Endpoint | Success | Error |
|---------|------|--------|--------------|---------|-------|
| Add Connection | Button | Open dialog | - | Show dialog | - |
| Test | Button | Test connection | POST /api/connections/:id/test | Show result dialog | Show result dialog |
| Edit | Button | Open edit dialog | - | Show dialog | - |
| Delete | Button | Open confirm dialog | - | Show AlertDialog | - |
| Confirm Delete | Button | Delete connection | DELETE /api/connections/:id | Toast + refresh | Toast error |

---

### 4.18 User Profile Screen

**Metadata:**

| Field | Value |
|-------|-------|
| Route | /profile |
| User Stories | US-AUTH-006, US-AUTH-007 |
| Auth Required | Yes |
| Layout | Main |

**Layout (Desktop):**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Profile                                                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Personal Information                                        ││
│  │                                                             ││
│  │ ┌─────────────────────────────────────────────────────────┐ ││
│  │ │ Name                                                    │ ││
│  │ │ [John Doe                                           ]   │ ││
│  │ └─────────────────────────────────────────────────────────┘ ││
│  │                                                             ││
│  │ ┌─────────────────────────────────────────────────────────┐ ││
│  │ │ Email                                                   │ ││
│  │ │ [admin@example.com                                  ]   │ ││
│  │ └─────────────────────────────────────────────────────────┘ ││
│  │                                                             ││
│  │ [Save Changes]                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Change Password                                             ││
│  │                                                             ││
│  │ ┌─────────────────────────────────────────────────────────┐ ││
│  │ │ Current Password                                        │ ││
│  │ │ [••••••••                                           ]   │ ││
│  │ └─────────────────────────────────────────────────────────┘ ││
│  │                                                             ││
│  │ ┌─────────────────────────────────────────────────────────┐ ││
│  │ │ New Password                                            │ ││
│  │ │ [                                                   ]   │ ││
│  │ └─────────────────────────────────────────────────────────┘ ││
│  │                                                             ││
│  │ ┌─────────────────────────────────────────────────────────┐ ││
│  │ │ Confirm New Password                                    │ ││
│  │ │ [                                                   ]   │ ││
│  │ └─────────────────────────────────────────────────────────┘ ││
│  │                                                             ││
│  │ [Update Password]                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Profile Form:**

```typescript
const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Please enter a valid email"),
});
```

**Change Password Form:**

```typescript
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
```

**Actions:**

| Element | Type | Action | API Endpoint | Success | Error |
|---------|------|--------|--------------|---------|-------|
| Save Changes | Button type="submit" | Update profile | PATCH /api/auth/profile | Toast success | Toast error |
| Update Password | Button type="submit" | Change password | POST /api/auth/change-password | Toast success | Toast error |

---

### 4.19 Audit Log Screen

**Metadata:**

| Field | Value |
|-------|-------|
| Route | /projects/:projectId/audit |
| User Stories | US-AUDIT-001 |
| Auth Required | Yes |
| Layout | Main |

**Layout (Desktop):**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Dashboard > [Project] > Audit Log                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Tabs: [Overview] [Sources] [Audit Log ●]                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Filters: [Action ▾] [User ▾] [Date Range 📅]    [Export CSV]││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Date/Time       │ User      │ Action              │ Details ││
│  ├─────────────────┼───────────┼─────────────────────┼─────────┤│
│  │ Jan 5, 3:35 PM  │ John Doe  │ processing_completed│ [View]  ││
│  │ Jan 5, 3:30 PM  │ John Doe  │ processing_started  │ [View]  ││
│  │ Jan 5, 2:15 PM  │ Jane Smith│ mapping_updated     │ [View]  ││
│  │ Jan 5, 10:00 AM │ John Doe  │ source_created      │ [View]  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Showing 1-20 of 100 entries              [< Prev] [Next >]     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Requirements:**

| Field | API Source | Component |
|-------|------------|-----------|
| auditLog | GET /api/projects/:id/audit-log → data | Table |

**Actions:**

| Element | Type | Action | API Endpoint | Success | Error |
|---------|------|--------|--------------|---------|-------|
| Filter change | Select | Filter results | GET /api/.../audit-log?action=&userId= | Update table | - |
| Export CSV | Button | Download CSV | GET /api/.../audit-log?format=csv | Download file | Toast error |
| View Details | Button | Open details dialog | - | Show dialog | - |

---

## 5. Form Specifications Summary

### All Zod Schemas

```typescript
// client/src/lib/validators.ts

import { z } from "zod";

// Auth Forms
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const acceptInvitationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain at least one number"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Please enter a valid email"),
});

// Project Forms
export const createProjectSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z.string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const deleteProjectSchema = z.object({
  confirmName: z.string(),
});

// Source Forms
export const fileUploadSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const apiSourceSchema = z.object({
  connectionId: z.number().min(1, "Please select a connection"),
  name: z.string().min(1, "Name is required").max(100),
  config: z.object({
    dataType: z.enum(["tickets"]),
    dateRange: z.object({
      start: z.string().optional(),
      end: z.string().optional(),
    }).optional(),
    projectFilter: z.array(z.string()).optional(),
    statusFilter: z.array(z.string()).optional(),
  }),
});

// Mapping Forms
export const fieldMappingSchema = z.object({
  mappings: z.array(z.object({
    sourceColumn: z.string(),
    targetField: z.string(),
    transformations: z.array(z.object({
      type: z.enum(["lowercase", "uppercase", "trim", "date_format", "value_map"]),
      config: z.record(z.any()).optional(),
    })).optional(),
  })),
  customFields: z.array(z.string()).optional(),
});

// De-identification Forms
export const deidentificationRuleSchema = z.object({
  id: z.string(),
  type: z.enum(["name", "email", "phone", "address", "company", "custom"]),
  pattern: z.string().optional(),
  replacement: z.string().min(1, "Replacement is required"),
  enabled: z.boolean(),
});

export const customPatternTestSchema = z.object({
  pattern: z.string().min(1, "Pattern is required"),
  replacement: z.string().min(1, "Replacement is required"),
});

// Filter Forms
export const filtersSchema = z.object({
  minConversationLength: z.number().min(0).optional(),
  minContentLength: z.number().min(0).optional(),
  statusInclude: z.array(z.string()).optional(),
  statusExclude: z.array(z.string()).optional(),
  categoryInclude: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
});

// Processing Forms
export const startProcessingSchema = z.object({
  outputFormat: z.enum([
    "conversational_jsonl",
    "qa_pairs_jsonl",
    "raw_json",
  ]),
});

// Organization Forms
export const organizationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

// User Management Forms
export const inviteUserSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  role: z.enum(["admin", "member"]).default("member"),
});

export const changeRoleSchema = z.object({
  role: z.enum(["admin", "member"]),
});

// API Connection Forms
export const connectionSchema = z.object({
  type: z.enum(["teamwork_desk"]),
  name: z.string().min(1, "Name is required").max(100),
  credentials: z.object({
    apiKey: z.string().min(1, "API key is required"),
    subdomain: z.string().min(1, "Subdomain is required"),
  }),
});

// Type exports
export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type AcceptInvitationValues = z.infer<typeof acceptInvitationSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type CreateProjectValues = z.infer<typeof createProjectSchema>;
export type UpdateProjectValues = z.infer<typeof updateProjectSchema>;
export type ApiSourceValues = z.infer<typeof apiSourceSchema>;
export type FieldMappingValues = z.infer<typeof fieldMappingSchema>;
export type FiltersValues = z.infer<typeof filtersSchema>;
export type StartProcessingValues = z.infer<typeof startProcessingSchema>;
export type OrganizationValues = z.infer<typeof organizationSchema>;
export type InviteUserValues = z.infer<typeof inviteUserSchema>;
export type ConnectionValues = z.infer<typeof connectionSchema>;
```

---

## 6. Dialog/Modal Specifications

### Confirmation Dialogs

All destructive actions use AlertDialog with this pattern:

```tsx
<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete...
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleDelete}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Delete Project Confirmation

Special case requiring name confirmation:

```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Project</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete the project "{project.name}" and all its 
        sources, configurations, and outputs. This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <div className="py-4">
      <Label>Type "{project.name}" to confirm:</Label>
      <Input 
        value={confirmName}
        onChange={(e) => setConfirmName(e.target.value)}
        placeholder="Project name"
      />
    </div>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction 
        disabled={confirmName !== project.name}
        onClick={handleDelete}
        className="bg-destructive text-destructive-foreground"
      >
        Delete Project
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Dialog Size Reference

| Dialog | Size Class | Use Case |
|--------|------------|----------|
| Create Project | sm:max-w-[425px] | Simple form |
| Edit Project | sm:max-w-[425px] | Simple form |
| Add Source | sm:max-w-[600px] | Tabbed form |
| Invite User | sm:max-w-[425px] | Simple form |
| Add Connection | sm:max-w-[500px] | Credential form |
| Transform Config | sm:max-w-[500px] | Dynamic form |
| Data Preview | sm:max-w-[900px] | Table display |
| Audit Details | sm:max-w-[600px] | JSON display |

---

## 7. Loading & Empty States

### Loading Patterns

| Context | Pattern | Component |
|---------|---------|-----------|
| Page load | Skeleton matching layout | Skeleton |
| Table data | Skeleton rows | Skeleton |
| Card grid | Skeleton cards | Skeleton |
| Button action | Disabled + Loader2 | Button with loading |
| Form submit | Button disabled + spinner | Button with loading |
| Background fetch | No indicator | - |
| Long operation | Progress bar | Progress |

### Skeleton Components

**Card Skeleton:**

```tsx
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-[200px]" />
    <Skeleton className="h-4 w-[300px]" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-3/4" />
  </CardContent>
</Card>
```

**Table Skeleton:**

```tsx
<TableRow>
  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
</TableRow>
```

### Empty States by Screen

| Screen | Icon | Heading | Description | CTA |
|--------|------|---------|-------------|-----|
| Dashboard | FolderOpen | No projects yet | Create your first project | Create Project |
| Source List | Database | No sources yet | Add a data source | Add Source |
| Outputs | FileOutput | No outputs yet | Process your data | Go to Processing |
| Processing History | History | No runs yet | Start your first processing | Start Processing |
| Connections | Cloud | No connections | Connect to external services | Add Connection |
| User List | Users | No team members | Invite your first team member | Invite User |

---

## 8. Error Pages

### 404 Not Found

```tsx
<div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
  <div className="rounded-full bg-muted p-6 mb-6">
    <FileQuestion className="h-12 w-12 text-muted-foreground" />
  </div>
  <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
  <p className="text-muted-foreground mb-8 text-center max-w-md">
    The page you're looking for doesn't exist or you don't have permission to view it.
  </p>
  <Button asChild>
    <Link to="/dashboard">
      <Home className="mr-2 h-4 w-4" />
      Back to Dashboard
    </Link>
  </Button>
</div>
```

### 403 Forbidden

```tsx
<div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
  <div className="rounded-full bg-muted p-6 mb-6">
    <ShieldAlert className="h-12 w-12 text-muted-foreground" />
  </div>
  <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
  <p className="text-muted-foreground mb-8 text-center max-w-md">
    You don't have permission to access this page. Contact your administrator if you believe this is an error.
  </p>
  <Button asChild>
    <Link to="/dashboard">
      <Home className="mr-2 h-4 w-4" />
      Back to Dashboard
    </Link>
  </Button>
</div>
```

### 500 Server Error

```tsx
<div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
  <div className="rounded-full bg-muted p-6 mb-6">
    <AlertTriangle className="h-12 w-12 text-destructive" />
  </div>
  <h1 className="text-3xl font-bold mb-2">Something Went Wrong</h1>
  <p className="text-muted-foreground mb-8 text-center max-w-md">
    We encountered an unexpected error. Please try again or contact support if the problem persists.
  </p>
  <div className="flex gap-4">
    <Button variant="outline" onClick={() => window.location.reload()}>
      <RefreshCw className="mr-2 h-4 w-4" />
      Try Again
    </Button>
    <Button asChild>
      <Link to="/dashboard">
        <Home className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>
    </Button>
  </div>
</div>
```

---

## 9. Accessibility Specifications

### Focus Management

| Scenario | Behavior |
|----------|----------|
| Dialog open | Focus first focusable element |
| Dialog close | Return focus to trigger element |
| Form error | Focus first invalid field |
| Route change | Focus main content heading |
| Toast notification | Announced via aria-live |

### Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| Escape | Close modal/dropdown | Overlays |
| Enter | Submit form / Activate button | Forms/Buttons |
| Tab | Move focus forward | Global |
| Shift+Tab | Move focus backward | Global |
| Arrow keys | Navigate menu items | Menus |
| Space | Toggle checkbox/switch | Form elements |

### ARIA Labels Required

| Component | ARIA Requirement |
|-----------|------------------|
| Icon buttons | aria-label or sr-only text |
| Dialogs | DialogTitle required |
| Alerts | role="alert" (automatic) |
| Loading | aria-busy="true" |
| Progress | aria-valuenow, aria-valuemin, aria-valuemax |
| Tables | Proper thead/tbody structure |

### Color Contrast Requirements

All text meets WCAG AA standards:
- Normal text: 4.5:1 minimum contrast
- Large text (24px+): 3:1 minimum contrast
- Interactive elements: Clear focus states

### Screen Reader Considerations

| Component | Consideration |
|-----------|---------------|
| Icons with meaning | Include sr-only text or aria-label |
| Status badges | Include descriptive text |
| Progress bars | Include aria-label describing action |
| Drag and drop | Provide alternative keyboard method |
| Data tables | Use proper heading structure |

---

## 10. Responsive Design Specifications

### Breakpoint Behaviors

| Component | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) |
|-----------|-----------------|---------------------|-------------------|
| Navigation | Hamburger menu | Hamburger menu | Sidebar |
| Card grid | 1 column | 2 columns | 3-4 columns |
| Tables | Card view | Horizontal scroll | Full table |
| Dialogs | Full screen | Centered | Centered |
| Forms | Full width | Centered max-w-md | Centered max-w-lg |

### Mobile Navigation Pattern

```tsx
// Mobile: Sheet-based navigation
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="md:hidden">
      <Menu className="h-5 w-5" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    <nav className="flex flex-col gap-4">
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/settings">Settings</Link>
    </nav>
  </SheetContent>
</Sheet>

// Desktop: Sidebar navigation
<nav className="hidden md:flex flex-col w-64 border-r">
  <Link to="/dashboard">Dashboard</Link>
  <Link to="/settings">Settings</Link>
</nav>
```

### Responsive Table Pattern

```tsx
// Mobile: Card view
<div className="md:hidden space-y-4">
  {data.map((item) => (
    <Card key={item.id}>
      <CardContent className="pt-4">
        <div className="flex justify-between">
          <span className="font-medium">{item.name}</span>
          <Badge>{item.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </CardContent>
    </Card>
  ))}
</div>

// Desktop: Table view
<Table className="hidden md:table">
  <TableHeader>...</TableHeader>
  <TableBody>...</TableBody>
</Table>
```

---

## Document Validation

### PRD Coverage Check

| User Story ID | Screen(s) | Status |
|---------------|-----------|--------|
| US-AUTH-001 | Accept Invitation | ✓ |
| US-AUTH-002 | Login | ✓ |
| US-AUTH-003 | User Management | ✓ |
| US-AUTH-004 | Forgot Password, Reset Password | ✓ |
| US-AUTH-005 | User Menu (logout) | ✓ |
| US-AUTH-006 | Profile | ✓ |
| US-AUTH-007 | Profile | ✓ |
| US-AUTH-008 | User Management | ✓ |
| US-AUTH-009 | User Management | ✓ |
| US-ORG-001 | Organization Settings | ✓ |
| US-ORG-002 | Organization Settings | ✓ |
| US-ORG-003 | User Management | ✓ |
| US-ORG-004 | User Management | ✓ |
| US-PROJ-001 | Create Project Dialog | ✓ |
| US-PROJ-002 | Dashboard | ✓ |
| US-PROJ-003 | Project Overview (edit) | ✓ |
| US-PROJ-004 | Project Overview (delete) | ✓ |
| US-PROJ-005 | Dashboard (search) | ✓ |
| US-PROJ-006 | Project Overview | ✓ |
| US-FILE-001 | Add Source Dialog | ✓ |
| US-FILE-002 | Add Source Dialog | ✓ |
| US-FILE-003 | Add Source Dialog | ✓ |
| US-FILE-004 | Source Detail | ✓ |
| US-FILE-005 | Add Source Dialog (drag & drop) | ✓ |
| US-FILE-006 | Add Source Dialog | ✓ |
| US-FILE-007 | Source Detail (replace) | ✓ |
| US-SRC-001 | Source List, Source Detail | ✓ |
| US-SRC-002 | Source Detail | ✓ |
| US-SRC-003 | Source Detail | ✓ |
| US-SRC-004 | Source Detail (preview tab) | ✓ |
| US-SRC-005 | Source Detail (stats) | ✓ |
| US-MAP-001 | Field Mapping | ✓ |
| US-MAP-002 | Field Mapping (suggestions) | ✓ |
| US-MAP-003 | Field Mapping (transforms) | ✓ |
| US-MAP-004 | Field Mapping (preview) | ✓ |
| US-MAP-005 | Field Mapping (custom fields) | ✓ |
| US-MAP-006 | Field Mapping (dropdown) | ✓ |
| US-MAP-007 | Field Mapping (auto-save) | ✓ |
| US-PII-001 | De-identification | ✓ |
| US-PII-002 | De-identification | ✓ |
| US-PII-003 | De-identification (custom rules) | ✓ |
| US-PII-004 | De-identification (preview, approve) | ✓ |
| US-PII-005 | De-identification (toggle) | ✓ |
| US-PII-006 | De-identification (columns) | ✓ |
| US-PII-007 | De-identification (summary) | ✓ |
| US-PII-008 | De-identification (test pattern) | ✓ |
| US-FILT-001 | Filters | ✓ |
| US-FILT-002 | Filters | ✓ |
| US-FILT-003 | Filters | ✓ |
| US-FILT-004 | Filters (summary) | ✓ |
| US-FILT-005 | Filters | ✓ |
| US-FILT-006 | Filters | ✓ |
| US-FILT-007 | Filters (AND logic) | ✓ |
| US-PROC-001 | Processing | ✓ |
| US-PROC-002 | Processing (format select) | ✓ |
| US-PROC-003 | Outputs (download) | ✓ |
| US-PROC-004 | Processing (re-process) | ✓ |
| US-PROC-005 | Processing (history) | ✓ |
| US-PROC-006 | Processing (cancel) | ✓ |
| US-PROC-007 | Processing (preview format) | ✓ |
| US-PROC-008 | Processing (polling) | ✓ |
| US-PROC-009 | Processing (log) | ✓ |
| US-OUT-001 | Outputs | ✓ |
| US-OUT-002 | Outputs (preview) | ✓ |
| US-OUT-003 | Outputs (delete) | ✓ |
| US-OUT-004 | Outputs (details) | ✓ |
| US-API-001 | API Connections | ✓ |
| US-API-002 | Add Source Dialog (API tab) | ✓ |
| US-API-003 | Source Detail (refresh) | ✓ |
| US-API-004 | API Connections (edit) | ✓ |
| US-API-005 | API Connections (delete) | ✓ |
| US-API-006 | Add Source Dialog (filters) | ✓ |
| US-AUDIT-001 | Audit Log | ✓ |
| US-AUDIT-002 | Organization Activity | ✓ |
| US-AUDIT-003 | Audit Log (deletions) | ✓ |
| US-AUDIT-004 | Audit Log (access) | ✓ |
| US-HELP-001 | Onboarding (first-time) | ✓ |
| US-HELP-002 | Contextual tooltips | ✓ |
| US-HELP-003 | Help menu | ✓ |
| US-HELP-004 | Support contact | ✓ |

**Coverage: 81/81 user stories (100%)**

### State Completeness Check

| Screen | Loading | Default | Empty | Error |
|--------|---------|---------|-------|-------|
| Login | - | ✓ | - | ✓ |
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Project Overview | ✓ | ✓ | - | ✓ |
| Source List | ✓ | ✓ | ✓ | ✓ |
| Source Detail | ✓ | ✓ | - | ✓ |
| Field Mapping | ✓ | ✓ | - | ✓ |
| De-identification | ✓ | ✓ | - | ✓ |
| Filters | ✓ | ✓ | - | ✓ |
| Processing | ✓ | ✓ | ✓ | ✓ |
| Outputs | ✓ | ✓ | ✓ | ✓ |
| Settings | ✓ | ✓ | - | ✓ |
| User Management | ✓ | ✓ | ✓ | ✓ |
| API Connections | ✓ | ✓ | ✓ | ✓ |

### Backend Coverage Check

All API endpoints from 04-API-CONTRACT have UI triggers:

| API Endpoint | UI Trigger | Verified |
|--------------|------------|----------|
| POST /api/auth/login | Login form | ✓ |
| POST /api/auth/logout | User menu | ✓ |
| POST /api/auth/forgot-password | Forgot password form | ✓ |
| POST /api/auth/reset-password | Reset password form | ✓ |
| GET /api/auth/me | Auto-fetch on load | ✓ |
| PATCH /api/auth/profile | Profile form | ✓ |
| POST /api/auth/change-password | Change password form | ✓ |
| All project endpoints | Dashboard, Project views | ✓ |
| All source endpoints | Source views | ✓ |
| All mapping endpoints | Mapping screen | ✓ |
| All deidentification endpoints | De-identification screen | ✓ |
| All filter endpoints | Filters screen | ✓ |
| All processing endpoints | Processing screen | ✓ |
| All output endpoints | Outputs screen | ✓ |
| All connection endpoints | Connections screen | ✓ |
| All invitation endpoints | User management | ✓ |
| All audit endpoints | Audit log screen | ✓ |

### Accessibility Checklist

- [x] All interactive elements have focus visible states
- [x] All icon buttons have accessible labels
- [x] All forms use FormLabel components
- [x] Color contrast meets WCAG AA
- [x] Keyboard navigation works throughout
- [x] Focus management handled for dialogs
- [x] ARIA labels specified where needed
- [x] Screen reader considerations documented

### Confidence Scores

| Section | Score (1-10) | Notes |
|---------|--------------|-------|
| Screen Coverage | 10 | All user stories mapped |
| Component Library | 9 | Complete shadcn/ui integration |
| Form Specifications | 10 | All Zod schemas documented |
| State Coverage | 9 | All major states documented |
| Accessibility | 9 | WCAG AA compliant |
| Responsive Design | 9 | All breakpoints addressed |
| Overall | 9.3 | Production-ready specification |

### Document Status: COMPLETE

---

## Downstream Handoff Brief

### For Agent 6: Implementation Orchestrator

**Component Installation:**

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog alert-dialog form input label select checkbox switch textarea table badge avatar skeleton toast alert progress tabs dropdown-menu tooltip scroll-area separator sheet radio-group popover
```

**Additional Dependencies:**

```bash
npm install @dnd-kit/core @dnd-kit/sortable
npm install date-fns
npm install @tanstack/react-query
npm install zustand
npm install react-hook-form @hookform/resolvers zod
```

**Critical Configuration:**

1. Ensure `tailwind.config.ts` includes all CSS variables
2. Create `client/src/lib/utils.ts` with `cn()` function
3. Set up TanStack Query provider at app root
4. Configure React Router with all routes

**Implementation Order:**

1. Auth screens (Login, Forgot Password, Reset Password, Accept Invitation)
2. Main layout with navigation
3. Dashboard with project list
4. Project detail with tabs
5. Source detail with all configuration tabs
6. Settings screens
7. Dialogs and modals

### For Agent 7: QA & Deployment

**Component Testing:**

- All shadcn/ui components have built-in accessibility
- Test all form validation scenarios with Zod schemas
- Verify keyboard navigation through all screens

**Visual Regression Points:**

- All screens in light and dark mode
- All responsive breakpoints (mobile, tablet, desktop)
- All form error states
- All empty states
- All loading states

**Accessibility Testing:**

- Keyboard navigation flow through entire app
- Screen reader announcements (use VoiceOver/NVDA)
- Color contrast verification
- Focus management in dialogs

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 6, 2026 | Initial release - complete UI specification for Foundry |
