import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Source, ApiResponse } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface MappingStepProps {
  sourceId: number;
  source: Source;
}

const TARGET_FIELDS = [
  { value: 'user_message', label: 'User Message', description: 'The input from the user' },
  { value: 'assistant_message', label: 'Assistant Message', description: 'The AI response' },
  { value: 'system_prompt', label: 'System Prompt', description: 'System instructions' },
  { value: 'context', label: 'Context', description: 'Additional context' },
  { value: 'question', label: 'Question', description: 'For Q&A format' },
  { value: 'answer', label: 'Answer', description: 'For Q&A format' },
  { value: 'metadata', label: 'Metadata', description: 'Additional metadata' },
];

const TRANSFORMATIONS = [
  { value: 'none', label: 'None' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'trim', label: 'Trim whitespace' },
  { value: 'strip_html', label: 'Strip HTML tags' },
];

export function MappingStep({ sourceId, source }: MappingStepProps) {
  const queryClient = useQueryClient();
  const [mappings, setMappings] = useState<Record<string, any>>({});

  // Fetch current mappings
  const { data: currentMappings, isLoading: mappingsLoading } = useQuery({
    queryKey: queryKeys.mappings.bySource(sourceId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>(`/sources/${sourceId}/mappings`);
      return response.data;
    },
  });

  // Fetch suggestions
  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: queryKeys.mappings.suggestions(sourceId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/sources/${sourceId}/mappings/suggestions`);
      return response.data;
    },
  });

  // Fetch preview
  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: queryKeys.mappings.preview(sourceId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/sources/${sourceId}/mappings/preview`);
      return response.data;
    },
    enabled: Object.keys(mappings).length > 0 || (currentMappings?.length || 0) > 0,
  });

  // Save mappings mutation
  const saveMappings = useMutation({
    mutationFn: async (data: { mappings: any[] }) => {
      const response = await api.post<ApiResponse<any>>(`/sources/${sourceId}/mappings`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mappings.bySource(sourceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sources.detail(sourceId) });
      toast.success('Mappings saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save mappings');
    },
  });

  const handleApplySuggestions = () => {
    if (suggestions?.suggestions) {
      const newMappings: Record<string, any> = {};
      suggestions.suggestions.forEach((s: any) => {
        newMappings[s.sourceField] = {
          targetField: s.suggestedTarget,
          transformation: 'none',
          isRequired: false,
        };
      });
      setMappings(newMappings);
      toast.success('Suggestions applied');
    }
  };

  const handleSave = () => {
    const mappingsArray = Object.entries(mappings).map(([sourceField, config]) => ({
      sourceField,
      ...config,
    }));
    saveMappings.mutate({ mappings: mappingsArray });
  };

  // Convert columns array to field objects
  const sourceFields = (source.columns || []).map((col: string) => ({
    name: col,
    type: 'string',
    sampleValue: null,
  }));

  if (mappingsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Field Mapping</CardTitle>
          <CardDescription>
            Map your source fields to the target training data format. Fields not mapped will be excluded from the output.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">{sourceFields.length}</span> source fields detected
            </div>
            {suggestions && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplySuggestions}
                disabled={suggestionsLoading}
              >
                Apply suggestions
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mapping Table */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          {sourceFields.length === 0 ? (
            <Alert>
              <AlertDescription>
                No fields detected in this source file. Please check the file format.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source Field</TableHead>
                  <TableHead>Sample Value</TableHead>
                  <TableHead>Target Field</TableHead>
                  <TableHead>Transformation</TableHead>
                  <TableHead>Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sourceFields.map((field: any) => {
                  const mapping = mappings[field.name] || {};
                  const suggestion = suggestions?.suggestions?.find(
                    (s: any) => s.sourceField === field.name
                  );

                  return (
                    <TableRow key={field.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{field.name}</span>
                          {suggestion && (
                            <Badge variant="outline" className="text-xs">
                              Suggested: {suggestion.suggestedTarget}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {field.type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                          {field.sampleValue || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping.targetField || ''}
                          onValueChange={(value) =>
                            setMappings({
                              ...mappings,
                              [field.name]: { ...mapping, targetField: value },
                            })
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select target" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Not mapped</SelectItem>
                            {TARGET_FIELDS.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping.transformation || 'none'}
                          onValueChange={(value) =>
                            setMappings({
                              ...mappings,
                              [field.name]: { ...mapping, transformation: value },
                            })
                          }
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TRANSFORMATIONS.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={mapping.isRequired || false}
                          onCheckedChange={(checked) =>
                            setMappings({
                              ...mappings,
                              [field.name]: { ...mapping, isRequired: checked },
                            })
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Preview how your data will look after mapping
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-64">
              {JSON.stringify(preview.sample, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          onClick={handleSave}
          disabled={saveMappings.isPending || Object.keys(mappings).length === 0}
        >
          {saveMappings.isPending ? 'Saving...' : 'Save Mappings'}
        </Button>
      </div>
    </div>
  );
}
