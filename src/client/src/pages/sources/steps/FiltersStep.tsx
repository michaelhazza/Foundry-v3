import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Source, ApiResponse } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface FiltersStepProps {
  sourceId: number;
  source: Source;
}

export function FiltersStep({ sourceId, source }: FiltersStepProps) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    minLength: 10,
    maxLength: 10000,
    removeEmpty: true,
    removeDuplicates: true,
    languageFilter: '',
    customConditions: [] as { field: string; operator: string; value: string }[],
  });

  // Fetch current config
  const { data: currentConfig, isLoading: configLoading } = useQuery({
    queryKey: queryKeys.filters.config(sourceId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/sources/${sourceId}/filters`);
      return response.data;
    },
  });

  // Fetch summary
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: queryKeys.filters.summary(sourceId),
    queryFn: async () => {
      const response = await api.post<ApiResponse<any>>(`/sources/${sourceId}/filters/summary`, filters);
      return response.data;
    },
    enabled: false,
  });

  // Save filters
  const saveFilters = useMutation({
    mutationFn: async (data: typeof filters) => {
      const response = await api.post<ApiResponse<any>>(`/sources/${sourceId}/filters`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.filters.config(sourceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sources.detail(sourceId) });
      toast.success('Filters saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save filters');
    },
  });

  if (configLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const retentionRate = summary ? ((summary.passingRecords / summary.totalRecords) * 100).toFixed(1) : null;

  return (
    <div className="space-y-6">
      {/* Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Filter Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Records passing filters</span>
                <span className="font-medium">
                  {summary.passingRecords.toLocaleString()} / {summary.totalRecords.toLocaleString()}
                </span>
              </div>
              <Progress value={Number(retentionRate)} />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Retention rate: {retentionRate}%</span>
                <span>{summary.filteredRecords.toLocaleString()} records will be filtered out</span>
              </div>

              {summary.warnings && summary.warnings.length > 0 && (
                <Alert variant="warning">
                  <AlertTitle>Warnings</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {summary.warnings.map((w: string, i: number) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Length Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Length Filters</CardTitle>
          <CardDescription>Filter records based on content length.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Minimum length (characters)</Label>
              <Input
                type="number"
                value={filters.minLength}
                onChange={(e) => setFilters({ ...filters, minLength: Number(e.target.value) })}
                className="w-24"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Maximum length (characters)</Label>
              <Input
                type="number"
                value={filters.maxLength}
                onChange={(e) => setFilters({ ...filters, maxLength: Number(e.target.value) })}
                className="w-24"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Filters</CardTitle>
          <CardDescription>Remove low-quality records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Remove empty records</Label>
              <p className="text-sm text-muted-foreground">
                Filter out records with empty or whitespace-only content
              </p>
            </div>
            <Switch
              checked={filters.removeEmpty}
              onCheckedChange={(checked) => setFilters({ ...filters, removeEmpty: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Remove duplicates</Label>
              <p className="text-sm text-muted-foreground">
                Filter out duplicate records based on content similarity
              </p>
            </div>
            <Switch
              checked={filters.removeDuplicates}
              onCheckedChange={(checked) => setFilters({ ...filters, removeDuplicates: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Language Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Language Filter</CardTitle>
          <CardDescription>Filter records by detected language.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Language code (e.g., en, es, fr)"
              value={filters.languageFilter}
              onChange={(e) => setFilters({ ...filters, languageFilter: e.target.value })}
              className="w-64"
            />
            <span className="text-sm text-muted-foreground">
              Leave empty to include all languages
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Custom Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Conditions</CardTitle>
          <CardDescription>Add custom filter conditions based on field values.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filters.customConditions.map((condition, index) => (
              <div key={index} className="flex items-center gap-4">
                <Input
                  placeholder="Field name"
                  value={condition.field}
                  onChange={(e) => {
                    const newConditions = [...filters.customConditions];
                    newConditions[index].field = e.target.value;
                    setFilters({ ...filters, customConditions: newConditions });
                  }}
                  className="w-32"
                />
                <select
                  value={condition.operator}
                  onChange={(e) => {
                    const newConditions = [...filters.customConditions];
                    newConditions[index].operator = e.target.value;
                    setFilters({ ...filters, customConditions: newConditions });
                  }}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="equals">Equals</option>
                  <option value="not_equals">Not equals</option>
                  <option value="contains">Contains</option>
                  <option value="not_contains">Not contains</option>
                  <option value="greater_than">Greater than</option>
                  <option value="less_than">Less than</option>
                </select>
                <Input
                  placeholder="Value"
                  value={condition.value}
                  onChange={(e) => {
                    const newConditions = [...filters.customConditions];
                    newConditions[index].value = e.target.value;
                    setFilters({ ...filters, customConditions: newConditions });
                  }}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newConditions = filters.customConditions.filter((_, i) => i !== index);
                    setFilters({ ...filters, customConditions: newConditions });
                  }}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  ...filters,
                  customConditions: [...filters.customConditions, { field: '', operator: 'equals', value: '' }],
                })
              }
            >
              Add condition
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => refetchSummary()}
          disabled={summaryLoading}
        >
          {summaryLoading ? 'Calculating...' : 'Preview Filters'}
        </Button>
        <Button
          onClick={() => saveFilters.mutate(filters)}
          disabled={saveFilters.isPending}
        >
          {saveFilters.isPending ? 'Saving...' : 'Save Filters'}
        </Button>
      </div>
    </div>
  );
}
