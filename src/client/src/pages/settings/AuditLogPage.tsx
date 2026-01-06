import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { ApiResponse } from '@shared/types';
import { PageHeader, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';

const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  'user.login': { label: 'Login', variant: 'default' },
  'user.logout': { label: 'Logout', variant: 'secondary' },
  'user.invited': { label: 'User Invited', variant: 'default' },
  'user.removed': { label: 'User Removed', variant: 'destructive' },
  'project.created': { label: 'Project Created', variant: 'default' },
  'project.updated': { label: 'Project Updated', variant: 'secondary' },
  'project.deleted': { label: 'Project Deleted', variant: 'destructive' },
  'source.uploaded': { label: 'Source Uploaded', variant: 'default' },
  'source.processed': { label: 'Source Processed', variant: 'default' },
  'source.deleted': { label: 'Source Deleted', variant: 'destructive' },
  'output.downloaded': { label: 'Output Downloaded', variant: 'secondary' },
  'connection.created': { label: 'Connection Created', variant: 'default' },
  'connection.deleted': { label: 'Connection Deleted', variant: 'destructive' },
};

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const limit = 20;

  // Fetch audit logs
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.auditLog.organization({ page, limit, action: actionFilter, startDate, endDate }),
    queryFn: async () => {
      const params: Record<string, any> = { page, limit };
      if (actionFilter) params.action = actionFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await api.get<ApiResponse<any[]>>('/audit-log', params);
      return response;
    },
  });

  const logs = data?.data || [];
  const pagination = data?.meta?.pagination;

  const handleClearFilters = () => {
    setActionFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="View all activity in your organization"
        breadcrumbs={[{ label: 'Settings', href: '/settings' }, { label: 'Audit Log' }]}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Track all actions performed in your organization</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-[150px]"
                placeholder="Start date"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-[150px]"
                placeholder="End date"
              />
              {(actionFilter || startDate || endDate) && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              title="No activity found"
              description={
                actionFilter || startDate || endDate
                  ? 'Try adjusting your filters'
                  : 'Activity will appear here as your team uses the platform'
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => {
                    const actionInfo = ACTION_LABELS[log.action] || {
                      label: log.action,
                      variant: 'outline' as const,
                    };
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant={actionInfo.variant}>{actionInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {log.user?.name || (
                            <span className="text-muted-foreground">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.project?.name || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          {log.details ? (
                            <span className="text-sm text-muted-foreground truncate block">
                              {typeof log.details === 'string'
                                ? log.details
                                : JSON.stringify(log.details)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to{' '}
                    {Math.min(page * limit, pagination.total)} of {pagination.total} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!pagination.hasMore}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
