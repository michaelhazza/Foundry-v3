import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Source, ApiResponse } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

interface ProcessingStepProps {
  sourceId: number;
  source: Source;
}

const OUTPUT_FORMATS = [
  {
    value: 'conversational_jsonl',
    label: 'Conversational JSONL',
    description: 'Multi-turn conversation format for chat models',
  },
  {
    value: 'qa_pairs_jsonl',
    label: 'Q&A Pairs JSONL',
    description: 'Question-answer format for fine-tuning',
  },
  {
    value: 'raw_json',
    label: 'Raw JSON',
    description: 'Complete processed data as JSON',
  },
];

export function ProcessingStep({ sourceId, source }: ProcessingStepProps) {
  const queryClient = useQueryClient();
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['conversational_jsonl']);

  // Fetch processing runs
  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: queryKeys.processing.runs(sourceId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>(`/sources/${sourceId}/processing-runs`);
      return response.data;
    },
    refetchInterval: (query) => {
      // Poll if there's an active run
      const data = query.state.data;
      const hasActiveRun = data?.some((r: any) => r.status === 'processing');
      return hasActiveRun ? 3000 : false;
    },
  });

  // Start processing
  const startProcessing = useMutation({
    mutationFn: async (formats: string[]) => {
      const response = await api.post<ApiResponse<any>>(`/sources/${sourceId}/process`, { outputFormats: formats });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.processing.runs(sourceId) });
      toast.success('Processing started');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to start processing');
    },
  });

  // Cancel processing
  const cancelProcessing = useMutation({
    mutationFn: async (runId: number) => {
      const response = await api.post<ApiResponse<any>>(`/processing-runs/${runId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.processing.runs(sourceId) });
      toast.success('Processing cancelled');
    },
  });

  const toggleFormat = (format: string) => {
    setSelectedFormats((prev) =>
      prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]
    );
  };

  const activeRun = runs?.find((r: any) => r.status === 'processing');
  const latestRun = runs?.[0];

  if (runsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Processing */}
      {activeRun && (
        <Alert>
          <AlertTitle>Processing in progress</AlertTitle>
          <AlertDescription>
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{activeRun.progress || 0}%</span>
              </div>
              <Progress value={activeRun.progress || 0} />
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cancelProcessing.mutate(activeRun.id)}
                  disabled={cancelProcessing.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Output Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Output Formats</CardTitle>
          <CardDescription>Select the output formats for your processed data.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {OUTPUT_FORMATS.map((format) => (
              <div
                key={format.value}
                className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedFormats.includes(format.value)
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-primary/50'
                }`}
                onClick={() => toggleFormat(format.value)}
              >
                <Checkbox
                  checked={selectedFormats.includes(format.value)}
                  onCheckedChange={() => toggleFormat(format.value)}
                />
                <div>
                  <div className="font-medium">{format.label}</div>
                  <div className="text-sm text-muted-foreground">{format.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Processing History */}
      <Card>
        <CardHeader>
          <CardTitle>Processing History</CardTitle>
          <CardDescription>View past processing runs and their results.</CardDescription>
        </CardHeader>
        <CardContent>
          {!runs || runs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No processing runs yet. Start a new run to process your data.
            </div>
          ) : (
            <div className="space-y-4">
              {runs.map((run: any) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        run.status === 'completed'
                          ? 'bg-green-500'
                          : run.status === 'processing'
                          ? 'bg-blue-500 animate-pulse'
                          : run.status === 'failed'
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                      }`}
                    />
                    <div>
                      <div className="font-medium">Run #{run.id}</div>
                      <div className="text-sm text-muted-foreground">
                        Started {formatRelativeTime(run.startedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        run.status === 'completed'
                          ? 'success'
                          : run.status === 'failed'
                          ? 'destructive'
                          : 'default'
                      }
                    >
                      {run.status}
                    </Badge>
                    {run.status === 'completed' && (
                      <div className="text-sm text-muted-foreground">
                        {run.recordsProcessed?.toLocaleString()} records
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Button
          onClick={() => startProcessing.mutate(selectedFormats)}
          disabled={
            startProcessing.isPending ||
            !!activeRun ||
            selectedFormats.length === 0 ||
            source.status !== 'ready'
          }
        >
          {startProcessing.isPending
            ? 'Starting...'
            : activeRun
            ? 'Processing...'
            : 'Start Processing'}
        </Button>
      </div>

      {source.status !== 'ready' && (
        <Alert>
          <AlertDescription>
            Please complete the previous configuration steps before processing.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
