import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useUploadSource, useCreateApiSource, CreateApiSourceInput } from '@/hooks/useSources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { ApiResponse } from '@shared/types';

interface Connection {
  id: number;
  name: string;
  type: string;
  status: 'active' | 'error' | 'pending';
}

interface AddSourceDialogProps {
  projectId: number;
  trigger: React.ReactNode;
}

export function AddSourceDialog({ projectId, trigger }: AddSourceDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API source form state
  const [connectionId, setConnectionId] = useState<string>('');
  const [sourceName, setSourceName] = useState('');
  const [dataType] = useState<'tickets'>('tickets');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch connections
  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: queryKeys.connections.lists(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Connection[]>>('/connections');
      return response.data;
    },
    enabled: open,
  });

  const activeConnections = connections?.filter((c) => c.status === 'active') || [];

  const uploadSource = useUploadSource();
  const createApiSource = useCreateApiSource();

  const resetForm = () => {
    setConnectionId('');
    setSourceName('');
    setStartDate('');
    setEndDate('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    let type: 'csv' | 'excel' | 'json' | 'jsonl' = 'csv';

    if (extension === 'xlsx' || extension === 'xls') {
      type = 'excel';
    } else if (extension === 'json') {
      type = 'json';
    } else if (extension === 'jsonl') {
      type = 'jsonl';
    }

    uploadSource.mutate(
      { projectId, file, type },
      {
        onSuccess: () => {
          toast.success('File uploaded successfully');
          resetForm();
          setOpen(false);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const handleApiSourceSubmit = () => {
    if (!connectionId || !sourceName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const data: CreateApiSourceInput = {
      connectionId: parseInt(connectionId, 10),
      name: sourceName.trim(),
      config: {
        dataType,
        ...(startDate || endDate
          ? {
              dateRange: {
                ...(startDate ? { start: startDate } : {}),
                ...(endDate ? { end: endDate } : {}),
              },
            }
          : {}),
      },
    };

    createApiSource.mutate(
      { projectId, data },
      {
        onSuccess: () => {
          toast.success('API source created successfully');
          resetForm();
          setOpen(false);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const isApiFormValid = connectionId && sourceName.trim();
  const isPending = uploadSource.isPending || createApiSource.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Source</DialogTitle>
          <DialogDescription>
            Upload a file or import data from an API connection.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">File Upload</TabsTrigger>
            <TabsTrigger value="api">API Connection</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4 pt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload a CSV, Excel, JSON, or JSONL file to import your data.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json,.jsonl"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 hover:border-muted-foreground/50 transition-colors">
                <svg
                  className="h-10 w-10 text-muted-foreground mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop or click to browse
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                >
                  {uploadSource.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Uploading...
                    </>
                  ) : (
                    'Select File'
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Supported formats: CSV, XLSX, XLS, JSON, JSONL
              </p>
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-4 pt-4">
            {connectionsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : activeConnections.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-10 w-10 text-muted-foreground mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <p className="text-muted-foreground mb-4">
                  No active connections available.
                </p>
                <Link
                  to="/settings/connections"
                  className="text-primary hover:underline text-sm"
                  onClick={() => setOpen(false)}
                >
                  Go to Settings &gt; Connections
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="connection">
                    API Connection <span className="text-destructive">*</span>
                  </Label>
                  <Select value={connectionId} onValueChange={setConnectionId}>
                    <SelectTrigger id="connection">
                      <SelectValue placeholder="Select a connection..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeConnections.map((connection) => (
                        <SelectItem
                          key={connection.id}
                          value={connection.id.toString()}
                        >
                          {connection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceName">
                    Source Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sourceName"
                    placeholder="e.g., Teamwork Tickets Q4"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                  />
                </div>

                <Separator className="my-4" />
                <p className="text-sm font-medium text-muted-foreground">Configuration</p>

                <div className="space-y-2">
                  <Label htmlFor="dataType">Data Type</Label>
                  <Select value={dataType} disabled>
                    <SelectTrigger id="dataType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tickets">Tickets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Range (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1"
                      placeholder="Start Date"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="flex-1"
                      placeholder="End Date"
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  No connections?{' '}
                  <Link
                    to="/settings/connections"
                    className="text-primary hover:underline"
                    onClick={() => setOpen(false)}
                  >
                    Go to Settings &gt; Connections
                  </Link>
                </p>
              </>
            )}
          </TabsContent>
        </Tabs>

        {activeTab === 'api' && activeConnections.length > 0 && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApiSourceSubmit}
              disabled={!isApiFormValid || isPending}
            >
              {createApiSource.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Importing...
                </>
              ) : (
                'Import Data'
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
