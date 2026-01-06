import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Source, ApiResponse } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatRelativeTime, formatFileSize, formatNumber } from '@/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';

interface OutputsStepProps {
  sourceId: number;
  source: Source;
}

const FORMAT_LABELS: Record<string, string> = {
  conversational_jsonl: 'Conversational JSONL',
  qa_pairs_jsonl: 'Q&A Pairs JSONL',
  raw_json: 'Raw JSON',
};

export function OutputsStep({ sourceId, source }: OutputsStepProps) {
  const queryClient = useQueryClient();
  const [previewOutput, setPreviewOutput] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Fetch outputs
  const { data: outputs, isLoading: outputsLoading } = useQuery({
    queryKey: queryKeys.outputs.bySource(sourceId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>(`/sources/${sourceId}/outputs`);
      return response.data;
    },
  });

  // Fetch preview
  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: previewOutput ? queryKeys.outputs.preview(previewOutput) : [''],
    queryFn: async () => {
      if (!previewOutput) return null;
      const response = await api.get<ApiResponse<any>>(`/outputs/${previewOutput}/preview`, { limit: 5 });
      return response.data;
    },
    enabled: !!previewOutput,
  });

  // Delete output
  const deleteOutput = useMutation({
    mutationFn: async (outputId: number) => {
      await api.delete(`/outputs/${outputId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outputs.bySource(sourceId) });
      setDeleteConfirmId(null);
      toast.success('Output deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete output');
    },
  });

  // Download output
  const handleDownload = async (outputId: number, fileName: string) => {
    try {
      const blob = await api.download(`/outputs/${outputId}/download`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download');
    }
  };

  if (outputsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Outputs List */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Outputs</CardTitle>
          <CardDescription>
            Download your processed training data in various formats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!outputs || outputs.length === 0 ? (
            <EmptyState
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              }
              title="No outputs yet"
              description="Run processing to generate output files."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outputs.map((output: any) => (
                  <TableRow key={output.id}>
                    <TableCell className="font-medium">{output.fileName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {FORMAT_LABELS[output.format] || output.format}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatNumber(output.recordCount)}</TableCell>
                    <TableCell>{formatFileSize(output.fileSize)}</TableCell>
                    <TableCell>{formatRelativeTime(output.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewOutput(output.id)}
                        >
                          Preview
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(output.id, output.fileName)}
                        >
                          Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteConfirmId(output.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewOutput} onOpenChange={() => setPreviewOutput(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Output Preview</DialogTitle>
            <DialogDescription>
              First 5 records from the output file
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {previewLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : preview?.records ? (
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96 font-mono">
                {preview.records.map((record: any, index: number) => (
                  <div key={index} className="mb-4 pb-4 border-b border-border last:border-0">
                    {JSON.stringify(record, null, 2)}
                  </div>
                ))}
              </pre>
            ) : (
              <div className="text-center text-muted-foreground">
                No preview available
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOutput(null)}>
              Close
            </Button>
            {previewOutput && (
              <Button
                onClick={() => {
                  const output = outputs?.find((o: any) => o.id === previewOutput);
                  if (output) handleDownload(output.id, output.fileName);
                }}
              >
                Download Full File
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Output</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this output file? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteOutput.mutate(deleteConfirmId)}
              disabled={deleteOutput.isPending}
            >
              {deleteOutput.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
