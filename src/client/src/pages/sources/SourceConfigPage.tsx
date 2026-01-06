import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSource } from '@/hooks/useSources';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MappingStep } from './steps/MappingStep';
import { DeidentificationStep } from './steps/DeidentificationStep';
import { FiltersStep } from './steps/FiltersStep';
import { ProcessingStep } from './steps/ProcessingStep';
import { OutputsStep } from './steps/OutputsStep';

const STEPS = ['mapping', 'deidentification', 'filters', 'processing', 'outputs'] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  mapping: 'Field Mapping',
  deidentification: 'De-identification',
  filters: 'Quality Filters',
  processing: 'Processing',
  outputs: 'Outputs',
};

export function SourceConfigPage() {
  const { sourceId, step = 'mapping' } = useParams<{
    sourceId: string;
    step?: Step;
  }>();
  const navigate = useNavigate();
  const { data: source, isLoading, error } = useSource(Number(sourceId));

  const currentStep = STEPS.includes(step as Step) ? (step as Step) : 'mapping';

  const handleStepChange = (newStep: string) => {
    navigate(`/sources/${sourceId}/${newStep}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !source) {
    return (
      <EmptyState
        icon={
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
        title="Source not found"
        description="This source doesn't exist or you don't have access to it"
        action={{
          label: 'Go to projects',
          onClick: () => navigate('/projects'),
        }}
      />
    );
  }

  const displayName = source.originalFilename || source.name;

  return (
    <div>
      <PageHeader
        title={displayName}
        description={`Configure your data source for processing`}
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: source.projectId?.toString() || 'Project', href: `/projects/${source.projectId}` },
          { label: displayName },
        ]}
        actions={
          <Badge
            variant={
              source.status === 'ready'
                ? 'success'
                : source.status === 'error'
                ? 'destructive'
                : 'default'
            }
          >
            {source.status}
          </Badge>
        }
      />

      <Tabs value={currentStep} onValueChange={handleStepChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          {STEPS.map((s) => (
            <TabsTrigger key={s} value={s}>
              {STEP_LABELS[s]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="mapping">
          <MappingStep sourceId={Number(sourceId)} source={source} />
        </TabsContent>

        <TabsContent value="deidentification">
          <DeidentificationStep sourceId={Number(sourceId)} source={source} />
        </TabsContent>

        <TabsContent value="filters">
          <FiltersStep sourceId={Number(sourceId)} source={source} />
        </TabsContent>

        <TabsContent value="processing">
          <ProcessingStep sourceId={Number(sourceId)} source={source} />
        </TabsContent>

        <TabsContent value="outputs">
          <OutputsStep sourceId={Number(sourceId)} source={source} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
