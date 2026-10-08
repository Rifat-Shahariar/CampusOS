"use client";

import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { useResourceDetail } from "../hooks/use-resource-detail";
import { ResourceDetailView } from "./resource-detail-view";

interface ResourceDetailContainerProps {
  resourceId: string;
}

export function ResourceDetailContainer({
  resourceId,
}: ResourceDetailContainerProps) {
  const { resource, isLoading, error, refetch } = useResourceDetail(resourceId);

  if (isLoading) {
    return (
      <div
        data-testid="resource-detail-loading"
        className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-8"
      >
        <Spinner size="lg" />
        <span className="text-xs text-muted-foreground font-medium">
          Loading resource details...
        </span>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorState
          title="Resource Not Found"
          message={error || "The requested learning resource does not exist or has been unpublished."}
          onRetry={refetch}
        />
      </div>
    );
  }

  return <ResourceDetailView resource={resource} />;
}
