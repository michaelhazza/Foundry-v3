import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { ApiResponse } from '@shared/types';
import { PageHeader, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

const CONNECTION_TYPES = [
  {
    value: 'teamwork_desk',
    label: 'Teamwork Desk',
    description: 'Import tickets from Teamwork Desk',
    icon: 'T',
  },
];

export function ConnectionsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editConnection, setEditConnection] = useState<any>(null);
  const [deleteConnectionId, setDeleteConnectionId] = useState<number | null>(null);
  const [newConnection, setNewConnection] = useState({
    type: '',
    name: '',
    credentials: { apiKey: '', subdomain: '' },
  });

  // Fetch connections
  const { data: connections, isLoading } = useQuery({
    queryKey: queryKeys.connections.lists(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>('/connections');
      return response.data;
    },
  });

  // Create connection
  const createConnection = useMutation({
    mutationFn: async (data: typeof newConnection) => {
      const response = await api.post<ApiResponse<any>>('/connections', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.lists() });
      setCreateOpen(false);
      setNewConnection({ type: '', name: '', credentials: { apiKey: '', subdomain: '' } });
      toast.success('Connection created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create connection');
    },
  });

  // Update connection
  const updateConnection = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await api.patch<ApiResponse<any>>(`/connections/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.lists() });
      setEditConnection(null);
      toast.success('Connection updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update connection');
    },
  });

  // Delete connection
  const deleteConnection = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/connections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.lists() });
      setDeleteConnectionId(null);
      toast.success('Connection deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete connection');
    },
  });

  // Test connection
  const testConnection = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<ApiResponse<any>>(`/connections/${id}/test`);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Connection test successful');
      } else {
        toast.error(data.error || 'Connection test failed');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Connection test failed');
    },
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="API Connections" description="Manage external API connections" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="API Connections"
        description="Connect external services to import data"
        breadcrumbs={[{ label: 'Settings', href: '/settings' }, { label: 'Connections' }]}
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add connection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add API Connection</DialogTitle>
                <DialogDescription>
                  Connect an external service to import data.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Connection Type</Label>
                  <Select
                    value={newConnection.type}
                    onValueChange={(value) => setNewConnection({ ...newConnection, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONNECTION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Connection Name</Label>
                  <Input
                    id="name"
                    placeholder="My Teamwork Connection"
                    value={newConnection.name}
                    onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input
                    id="subdomain"
                    placeholder="yourcompany"
                    value={newConnection.credentials.subdomain}
                    onChange={(e) =>
                      setNewConnection({
                        ...newConnection,
                        credentials: { ...newConnection.credentials, subdomain: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your API key"
                    value={newConnection.credentials.apiKey}
                    onChange={(e) =>
                      setNewConnection({
                        ...newConnection,
                        credentials: { ...newConnection.credentials, apiKey: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createConnection.mutate(newConnection)}
                  disabled={
                    !newConnection.type ||
                    !newConnection.name ||
                    !newConnection.credentials.apiKey ||
                    createConnection.isPending
                  }
                >
                  {createConnection.isPending ? 'Creating...' : 'Create connection'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Connections List */}
      {!connections || connections.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              }
              title="No connections"
              description="Add an API connection to import data from external services"
              action={{ label: 'Add connection', onClick: () => setCreateOpen(true) }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {connections.map((connection: any) => {
            const typeInfo = CONNECTION_TYPES.find((t) => t.value === connection.type);
            return (
              <Card key={connection.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                        {typeInfo?.icon || connection.type[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{connection.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {typeInfo?.label || connection.type} • Last tested{' '}
                          {connection.lastTestedAt
                            ? formatRelativeTime(connection.lastTestedAt)
                            : 'never'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          connection.status === 'active'
                            ? 'success'
                            : connection.status === 'error'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {connection.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection.mutate(connection.id)}
                        disabled={testConnection.isPending}
                      >
                        Test
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditConnection(connection)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteConnectionId(connection.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConnectionId} onOpenChange={() => setDeleteConnectionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete connection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this connection? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConnectionId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConnectionId && deleteConnection.mutate(deleteConnectionId)}
              disabled={deleteConnection.isPending}
            >
              {deleteConnection.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
