import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db';
import { sources, sourceData, apiConnections, projects } from '@shared/schema';
import { getDecryptedCredentials } from './connection.service';
import { NotFoundError, BadRequestError, BadGatewayError } from '../errors';

interface TeamworkTicket {
  id: number;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  assignedTo?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  threads?: Array<{
    id: number;
    body: string;
    createdAt: string;
    author: {
      type: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

export async function fetchTeamworkData(
  connectionId: number,
  organizationId: number,
  config: {
    dataType: string;
    dateRange?: { start?: string; end?: string };
    projectFilter?: string[];
    statusFilter?: string[];
  }
): Promise<{ columns: string[]; rows: Record<string, unknown>[] }> {
  const connection = await db.query.apiConnections.findFirst({
    where: and(
      eq(apiConnections.id, connectionId),
      eq(apiConnections.organizationId, organizationId)
    ),
  });

  if (!connection) {
    throw new NotFoundError('API connection');
  }

  if (connection.status !== 'active') {
    throw new BadRequestError('Connection is not active. Please test the connection first.');
  }

  const credentials = getDecryptedCredentials(connection);

  try {
    if (config.dataType === 'tickets') {
      return await fetchTickets(credentials, config);
    } else {
      throw new BadRequestError(`Unsupported data type: ${config.dataType}`);
    }
  } catch (error) {
    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      throw error;
    }
    throw new BadGatewayError(
      error instanceof Error ? error.message : 'Failed to fetch data from Teamwork'
    );
  }
}

async function fetchTickets(
  credentials: { apiKey: string; subdomain: string },
  config: {
    dateRange?: { start?: string; end?: string };
    statusFilter?: string[];
  }
): Promise<{ columns: string[]; rows: Record<string, unknown>[] }> {
  const baseUrl = `https://${credentials.subdomain}.teamwork.com/desk/v1`;
  const authHeader = `Basic ${Buffer.from(`${credentials.apiKey}:x`).toString('base64')}`;

  // Build query parameters
  const params = new URLSearchParams();
  params.append('include', 'threads,customer,assignedTo');
  params.append('pageSize', '250');

  if (config.dateRange?.start) {
    params.append('createdAfter', config.dateRange.start);
  }
  if (config.dateRange?.end) {
    params.append('createdBefore', config.dateRange.end);
  }
  if (config.statusFilter && config.statusFilter.length > 0) {
    params.append('statuses', config.statusFilter.join(','));
  }

  const rows: Record<string, unknown>[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    params.set('page', String(page));

    const response = await fetch(`${baseUrl}/tickets.json?${params}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Teamwork API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { tickets?: TeamworkTicket[]; pagination?: { hasMore?: boolean } };
    const tickets: TeamworkTicket[] = data.tickets || [];

    for (const ticket of tickets) {
      // Flatten ticket data
      const baseRow = {
        ticket_id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.createdAt,
        updated_at: ticket.updatedAt,
        customer_email: ticket.customer?.email || '',
        customer_name: ticket.customer
          ? `${ticket.customer.firstName} ${ticket.customer.lastName}`.trim()
          : '',
        agent_name: ticket.assignedTo
          ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`.trim()
          : '',
      };

      // Create a row for each thread/message
      if (ticket.threads && ticket.threads.length > 0) {
        for (const thread of ticket.threads) {
          rows.push({
            ...baseRow,
            message_id: thread.id,
            message_body: thread.body,
            message_created_at: thread.createdAt,
            sender_type: thread.author.type,
            sender_name: `${thread.author.firstName} ${thread.author.lastName}`.trim(),
          });
        }
      } else {
        // No threads, just add the ticket
        rows.push(baseRow);
      }
    }

    // Check pagination
    hasMore = data.pagination?.hasMore === true && page < 100; // Safety limit
    page++;
  }

  // Derive columns from the data
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [
    'ticket_id',
    'subject',
    'status',
    'priority',
    'created_at',
    'updated_at',
    'customer_email',
    'customer_name',
    'agent_name',
    'message_id',
    'message_body',
    'message_created_at',
    'sender_type',
    'sender_name',
  ];

  return { columns, rows };
}

export async function createApiSource(
  projectId: number,
  organizationId: number,
  data: {
    connectionId: number;
    name: string;
    config: {
      dataType: string;
      dateRange?: { start?: string; end?: string };
      projectFilter?: string[];
      statusFilter?: string[];
    };
  },
  userId: number
): Promise<{
  id: number;
  name: string;
  type: 'api';
  status: string;
  rowCount: number;
  columns: string[];
}> {
  // Verify project access
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.organizationId, organizationId),
      isNull(projects.deletedAt)
    ),
  });

  if (!project) {
    throw new NotFoundError('Project');
  }

  // Create source in uploading state
  const [source] = await db.insert(sources).values({
    projectId,
    connectionId: data.connectionId,
    name: data.name,
    type: 'api',
    status: 'parsing',
    apiConfig: data.config,
  }).returning();

  try {
    // Fetch data from API
    const result = await fetchTeamworkData(data.connectionId, organizationId, data.config);

    // Store rows
    if (result.rows.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < result.rows.length; i += batchSize) {
        const batch = result.rows.slice(i, i + batchSize);
        await db.insert(sourceData).values(
          batch.map((row, index) => ({
            sourceId: source.id,
            rowIndex: i + index,
            data: row,
          }))
        );
      }
    }

    // Update source to ready
    await db.update(sources).set({
      status: 'ready',
      rowCount: result.rows.length,
      columnCount: result.columns.length,
      columns: result.columns,
      lastRefreshedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(sources.id, source.id));

    // Initialize configs (imported from source.service)
    const { fieldMappings, deidentificationConfigs, filterConfigs } = await import('@shared/schema');

    await db.insert(fieldMappings).values({
      sourceId: source.id,
      mappings: [],
      customFields: [],
    });

    await db.insert(deidentificationConfigs).values({
      sourceId: source.id,
      rules: [
        { id: 'default-email', type: 'email', replacement: '[EMAIL]', enabled: true, isDefault: true },
        { id: 'default-phone', type: 'phone', replacement: '[PHONE]', enabled: true, isDefault: true },
        { id: 'default-name', type: 'name', replacement: '[PERSON_N]', enabled: true, isDefault: true },
      ],
      columnsToScan: result.columns,
    });

    await db.insert(filterConfigs).values({
      sourceId: source.id,
      filters: {},
    });

    return {
      id: source.id,
      name: source.name,
      type: 'api',
      status: 'ready',
      rowCount: result.rows.length,
      columns: result.columns,
    };
  } catch (error) {
    // Update source to error state
    await db.update(sources).set({
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Failed to fetch API data',
      updatedAt: new Date(),
    }).where(eq(sources.id, source.id));

    throw error;
  }
}

export async function refreshApiSource(
  sourceId: number,
  organizationId: number
): Promise<{ status: string; message: string }> {
  const source = await db.query.sources.findFirst({
    where: eq(sources.id, sourceId),
    with: {
      project: true,
    },
  });

  if (!source || source.project.organizationId !== organizationId) {
    throw new NotFoundError('Source');
  }

  if (source.type !== 'api') {
    throw new BadRequestError('Source is not an API source');
  }

  if (!source.connectionId || !source.apiConfig) {
    throw new BadRequestError('Source is missing API configuration');
  }

  // Update status to parsing
  await db.update(sources).set({ status: 'parsing' }).where(eq(sources.id, sourceId));

  // Refresh in background
  refreshApiSourceData(sourceId, organizationId).catch(console.error);

  return { status: 'parsing', message: 'Refreshing data from API' };
}

async function refreshApiSourceData(sourceId: number, organizationId: number): Promise<void> {
  const source = await db.query.sources.findFirst({
    where: eq(sources.id, sourceId),
  });

  if (!source || !source.connectionId || !source.apiConfig) return;

  try {
    // Fetch fresh data
    const result = await fetchTeamworkData(
      source.connectionId,
      organizationId,
      source.apiConfig as any
    );

    // Delete old data
    await db.delete(sourceData).where(eq(sourceData.sourceId, sourceId));

    // Insert new data
    if (result.rows.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < result.rows.length; i += batchSize) {
        const batch = result.rows.slice(i, i + batchSize);
        await db.insert(sourceData).values(
          batch.map((row, index) => ({
            sourceId,
            rowIndex: i + index,
            data: row,
          }))
        );
      }
    }

    // Update source
    await db.update(sources).set({
      status: 'ready',
      rowCount: result.rows.length,
      columnCount: result.columns.length,
      columns: result.columns,
      lastRefreshedAt: new Date(),
      errorMessage: null,
      updatedAt: new Date(),
    }).where(eq(sources.id, sourceId));

  } catch (error) {
    await db.update(sources).set({
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Refresh failed',
      updatedAt: new Date(),
    }).where(eq(sources.id, sourceId));
  }
}
