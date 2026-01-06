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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface DeidentificationStepProps {
  sourceId: number;
  source: Source;
}

const PII_TYPES = [
  { value: 'email', label: 'Email Addresses', icon: '@' },
  { value: 'phone', label: 'Phone Numbers', icon: '#' },
  { value: 'name', label: 'Person Names', icon: 'P' },
  { value: 'address', label: 'Addresses', icon: 'A' },
  { value: 'ssn', label: 'SSN/Tax IDs', icon: 'S' },
  { value: 'credit_card', label: 'Credit Cards', icon: '$' },
  { value: 'ip_address', label: 'IP Addresses', icon: 'I' },
  { value: 'custom', label: 'Custom Patterns', icon: '*' },
];

const REPLACEMENT_STRATEGIES = [
  { value: 'placeholder', label: 'Placeholder (e.g., [EMAIL])' },
  { value: 'mask', label: 'Mask (e.g., j***@***.com)' },
  { value: 'redact', label: 'Redact (remove entirely)' },
  { value: 'hash', label: 'Hash (consistent pseudonymization)' },
];

export function DeidentificationStep({ sourceId, source }: DeidentificationStepProps) {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<{
    enabled: boolean;
    piiTypes: string[];
    strategy: string;
    customPatterns: { name: string; pattern: string }[];
  }>({
    enabled: true,
    piiTypes: ['email', 'phone', 'name'],
    strategy: 'placeholder',
    customPatterns: [],
  });

  // Fetch current config
  const { data: currentConfig, isLoading: configLoading } = useQuery({
    queryKey: queryKeys.deidentification.config(sourceId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/sources/${sourceId}/deidentification`);
      return response.data;
    },
  });

  // Scan for PII
  const scanPii = useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<any>>(`/sources/${sourceId}/deidentification/scan`);
      return response.data;
    },
  });

  // Fetch preview
  const { data: preview, isLoading: previewLoading, refetch: refetchPreview } = useQuery({
    queryKey: queryKeys.deidentification.preview(sourceId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/sources/${sourceId}/deidentification/preview`);
      return response.data;
    },
    enabled: false,
  });

  // Save config
  const saveConfig = useMutation({
    mutationFn: async (data: typeof config) => {
      const response = await api.post<ApiResponse<any>>(`/sources/${sourceId}/deidentification`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deidentification.config(sourceId) });
      toast.success('De-identification settings saved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save settings');
    },
  });

  // Approve de-identification
  const approveDeidentification = useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<any>>(`/sources/${sourceId}/deidentification/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sources.detail(sourceId) });
      toast.success('De-identification approved');
    },
  });

  const togglePiiType = (type: string) => {
    setConfig((prev) => ({
      ...prev,
      piiTypes: prev.piiTypes.includes(type)
        ? prev.piiTypes.filter((t) => t !== type)
        : [...prev.piiTypes, type],
    }));
  };

  if (configLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>PII De-identification</CardTitle>
              <CardDescription>
                Automatically detect and remove personally identifiable information from your data.
              </CardDescription>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
            />
          </div>
        </CardHeader>
      </Card>

      {config.enabled && (
        <>
          {/* Scan Results */}
          {scanPii.data && (
            <Alert variant="warning">
              <AlertTitle>PII Detected</AlertTitle>
              <AlertDescription>
                Found {scanPii.data.totalDetections} potential PII instances across {scanPii.data.affectedRecords} records.
              </AlertDescription>
            </Alert>
          )}

          {/* PII Types */}
          <Card>
            <CardHeader>
              <CardTitle>PII Types to Detect</CardTitle>
              <CardDescription>Select which types of personal information to detect and de-identify.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PII_TYPES.map((type) => (
                  <div
                    key={type.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      config.piiTypes.includes(type.value)
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => togglePiiType(type.value)}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-sm font-medium">
                      {type.icon}
                    </div>
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Replacement Strategy */}
          <Card>
            <CardHeader>
              <CardTitle>Replacement Strategy</CardTitle>
              <CardDescription>Choose how detected PII should be replaced.</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={config.strategy}
                onValueChange={(value) => setConfig({ ...config, strategy: value })}
              >
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPLACEMENT_STRATEGIES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Custom Patterns */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Patterns</CardTitle>
              <CardDescription>Add custom regex patterns to detect organization-specific PII.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.customPatterns.map((pattern, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Input
                      placeholder="Pattern name"
                      value={pattern.name}
                      onChange={(e) => {
                        const newPatterns = [...config.customPatterns];
                        newPatterns[index].name = e.target.value;
                        setConfig({ ...config, customPatterns: newPatterns });
                      }}
                      className="w-40"
                    />
                    <Input
                      placeholder="Regex pattern"
                      value={pattern.pattern}
                      onChange={(e) => {
                        const newPatterns = [...config.customPatterns];
                        newPatterns[index].pattern = e.target.value;
                        setConfig({ ...config, customPatterns: newPatterns });
                      }}
                      className="flex-1 font-mono"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newPatterns = config.customPatterns.filter((_, i) => i !== index);
                        setConfig({ ...config, customPatterns: newPatterns });
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
                    setConfig({
                      ...config,
                      customPatterns: [...config.customPatterns, { name: '', pattern: '' }],
                    })
                  }
                >
                  Add custom pattern
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {preview && (
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Sample of de-identified data</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Original</TableHead>
                      <TableHead>De-identified</TableHead>
                      <TableHead>Detections</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.samples?.map((sample: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm max-w-[300px] truncate">
                          {sample.original}
                        </TableCell>
                        <TableCell className="font-mono text-sm max-w-[300px] truncate">
                          {sample.deidentified}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {sample.detections?.map((d: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {d}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => scanPii.mutate()}
            disabled={!config.enabled || scanPii.isPending}
          >
            {scanPii.isPending ? 'Scanning...' : 'Scan for PII'}
          </Button>
          <Button
            variant="outline"
            onClick={() => refetchPreview()}
            disabled={!config.enabled || previewLoading}
          >
            Preview
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => saveConfig.mutate(config)}
            disabled={saveConfig.isPending}
          >
            {saveConfig.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button
            onClick={() => approveDeidentification.mutate()}
            disabled={approveDeidentification.isPending}
          >
            {approveDeidentification.isPending ? 'Approving...' : 'Approve & Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
