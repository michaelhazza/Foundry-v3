import { Express } from 'express';
import authRoutes from './auth.routes';
import invitationsRoutes from './invitations.routes';
import usersRoutes from './users.routes';
import organizationsRoutes from './organizations.routes';
import projectsRoutes from './projects.routes';
import sourcesRoutes from './sources.routes';
import mappingsRoutes from './mappings.routes';
import deidentificationRoutes from './deidentification.routes';
import filtersRoutes from './filters.routes';
import processingRoutes from './processing.routes';
import outputsRoutes from './outputs.routes';
import connectionsRoutes from './connections.routes';
import auditRoutes from './audit.routes';

export function registerRoutes(app: Express): void {
  // Auth routes
  app.use('/api/auth', authRoutes);

  // Invitation routes
  app.use('/api/invitations', invitationsRoutes);

  // User routes
  app.use('/api/users', usersRoutes);

  // Organization routes
  app.use('/api/organization', organizationsRoutes);

  // Connection routes - MUST be before any parameterized /api routes
  app.use('/api/connections', connectionsRoutes);

  // Project routes
  app.use('/api/projects', projectsRoutes);

  // Source routes (includes nested routes for projects)
  app.use('/api/sources', sourcesRoutes);

  // Mapping routes
  app.use('/api/sources', mappingsRoutes);

  // De-identification routes
  app.use('/api/sources', deidentificationRoutes);

  // Filter routes
  app.use('/api/sources', filtersRoutes);

  // Processing routes
  app.use('/api/sources', processingRoutes);
  app.use('/api/processing-runs', processingRoutes);

  // Output routes
  app.use('/api/outputs', outputsRoutes);

  // Audit routes
  app.use('/api/audit-log', auditRoutes);

  // IMPORTANT: Routes with parameterized paths mounted at /api MUST be registered LAST
  // These catch-all patterns could match specific routes if registered first
  app.use('/api', sourcesRoutes); // For /api/projects/:projectId/sources
  app.use('/api', outputsRoutes); // For /api/sources/:sourceId/outputs
  app.use('/api', auditRoutes); // For /api/projects/:projectId/audit-log
}
