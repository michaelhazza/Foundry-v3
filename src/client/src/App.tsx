import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Layouts
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { AcceptInvitationPage } from '@/pages/auth/AcceptInvitationPage';

// Dashboard Pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProjectsPage } from '@/pages/projects/ProjectsPage';
import { ProjectDetailPage } from '@/pages/projects/ProjectDetailPage';
import { SourceConfigPage } from '@/pages/sources/SourceConfigPage';

// Settings Pages
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { TeamPage } from '@/pages/settings/TeamPage';
import { ConnectionsPage } from '@/pages/settings/ConnectionsPage';
import { AuditLogPage } from '@/pages/settings/AuditLogPage';

// Loading component
function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Admin route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Public route wrapper (redirects authenticated users)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Accept invitation - special public route */}
      <Route
        path="/accept-invitation"
        element={
          <AuthLayout />
        }
      >
        <Route index element={<AcceptInvitationPage />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route path="/" element={<DashboardPage />} />

        {/* Projects */}
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />

        {/* Source Configuration */}
        <Route path="/sources/:sourceId" element={<SourceConfigPage />} />
        <Route path="/sources/:sourceId/:step" element={<SourceConfigPage />} />

        {/* Settings */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/team" element={<TeamPage />} />

        {/* Admin Routes */}
        <Route
          path="/settings/connections"
          element={
            <AdminRoute>
              <ConnectionsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/settings/audit-log"
          element={
            <AdminRoute>
              <AuditLogPage />
            </AdminRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
