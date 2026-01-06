import { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { useSources, useUploadSource, useDeleteSource } from '@/hooks/useSources';
import { PageHeader, EmptyState, LoadingSpinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { formatRelativeTime, formatFileSize, formatNumber } from '@/lib/utils';
import { toast } from 'sonner';

const FILE_TYPE_ICONS: Record<string, JSX.Element> = {
  csv: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  excel: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  ),
  json: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  jsonl: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
};

const STATUS_COLORS: Record<string, string> = {
  uploading: 'bg-blue-100 text-blue-800',
  parsing: 'bg-yellow-100 text-yellow-800',
  ready: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
};

function getFileTypeFromMime(mimeType?: string | null): string {
  if (!mimeType) return 'csv';
  if (mimeType.includes('csv') || mimeType.includes('text/plain')) return 'csv';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'excel';
  if (mimeType.includes('json')) return 'json';
  return 'csv';
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSourceId, setDeleteSourceId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ name: '', description: '', status: '' });

  const { data: project, isLoading: projectLoading } = useProject(Number(projectId));
  const { data: sources, isLoading: sourcesLoading } = useSources(Number(projectId));
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const uploadSource = useUploadSource();
  const deleteSource = useDeleteSource();

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
      { projectId: Number(projectId), file, type },
      {
        onSuccess: () => {
          toast.success('File uploaded successfully');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const handleUpdate = () => {
    updateProject.mutate(
      {
        projectId: Number(projectId),
        data: {
          name: editData.name || undefined,
          description: editData.description || undefined,
          status: editData.status || undefined,
        },
      },
      {
        onSuccess: () => {
          setEditOpen(false);
          toast.success('Project updated successfully');
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteProject.mutate(Number(projectId), {
      onSuccess: () => {
        navigate('/projects');
        toast.success('Project deleted successfully');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const handleDeleteSource = (sourceId: number) => {
    deleteSource.mutate(sourceId, {
      onSuccess: () => {
        setDeleteSourceId(null);
        toast.success('Source deleted successfully');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        icon={
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
        title="Project not found"
        description="This project doesn't exist or you don't have access to it"
        action={{ label: 'Go to projects', onClick: () => navigate('/projects') }}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.description || 'No description'}
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: project.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.json,.jsonl"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadSource.isPending}
            >
              {uploadSource.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload source
                </>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setEditData({
                      name: project.name,
                      description: project.description || '',
                      status: project.status,
                    });
                    setEditOpen(true);
                  }}
                >
                  Edit project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* Project Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                project.status === 'active'
                  ? 'default'
                  : project.status === 'completed'
                  ? 'success'
                  : 'secondary'
              }
            >
              {project.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sources?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{formatRelativeTime(project.createdAt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{formatRelativeTime(project.updatedAt)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>
            Upload and manage your training data sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sourcesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : !sources || sources.length === 0 ? (
            <EmptyState
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              }
              title="No sources yet"
              description="Upload your first data source to get started"
              action={{
                label: 'Upload source',
                onClick: () => fileInputRef.current?.click(),
              }}
            />
          ) : (
            <div className="space-y-4">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    {FILE_TYPE_ICONS[getFileTypeFromMime(source.mimeType)] || FILE_TYPE_ICONS.csv}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{source.originalFilename || source.name}</h4>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[source.status] || STATUS_COLORS.uploading
                        }`}
                      >
                        {source.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatFileSize(source.fileSize || 0)}</span>
                      <span>{formatNumber(source.rowCount || 0)} records</span>
                      <span>{formatRelativeTime(source.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/sources/${source.id}`}>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/sources/${source.id}`}>View details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteSourceId(source.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Project Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
            <DialogDescription>Update your project details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project name</Label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editData.status}
                onValueChange={(value) => setEditData({ ...editData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateProject.isPending}>
              {updateProject.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot
              be undone and all associated sources and data will be permanently
              removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending ? 'Deleting...' : 'Delete project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Source Dialog */}
      <Dialog
        open={deleteSourceId !== null}
        onOpenChange={() => setDeleteSourceId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete source</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this source? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSourceId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteSourceId && handleDeleteSource(deleteSourceId)}
              disabled={deleteSource.isPending}
            >
              {deleteSource.isPending ? 'Deleting...' : 'Delete source'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
