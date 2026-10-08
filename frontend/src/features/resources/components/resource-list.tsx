import React from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ResourceCard } from "./resource-card";
import { ResourcePagination } from "./resource-pagination";
import type { PaginationMeta, ResourceItem } from "../types";

interface ResourceListProps {
  resources: ResourceItem[];
  meta: PaginationMeta;
  isLoading: boolean;
  error: string | null;
  onPageChange: (newPage: number) => void;
  onRetry: () => void;
  onClearFilters?: () => void;
}

export function ResourceList({
  resources,
  meta,
  isLoading,
  error,
  onPageChange,
  onRetry,
  onClearFilters,
}: ResourceListProps) {
  // 1. Loading State: Render Skeleton Cards
  if (isLoading) {
    return (
      <div
        data-testid="resource-skeletons"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse flex flex-col h-64 border-border">
            <CardHeader className="space-y-3 pb-2">
              <div className="flex justify-between items-center">
                <div className="h-5 w-24 bg-muted rounded-md" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
              <div className="h-6 w-3/4 bg-muted rounded" />
              <div className="h-3.5 w-1/2 bg-muted rounded" />
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <div className="h-3.5 w-full bg-muted rounded" />
              <div className="h-3.5 w-4/5 bg-muted rounded" />
              <div className="h-10 w-full bg-muted/60 rounded-lg mt-4" />
            </CardContent>
            <div className="p-4 border-t border-border/40 flex gap-2">
              <div className="h-8 flex-1 bg-muted rounded" />
              <div className="h-8 w-16 bg-muted rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <ErrorState
        title="Unable to load resources"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  // 3. Empty State
  if (resources.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="size-10 text-muted-foreground/60" />}
        title="No resources found"
        description="Try adjusting your keyword search, selecting a different course, or resetting your filters."
        action={
          onClearFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="mt-2 text-xs cursor-pointer"
            >
              Reset Filters
            </Button>
          )
        }
      />
    );
  }

  // 4. Populated Grid
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>

      <ResourcePagination meta={meta} onPageChange={onPageChange} />
    </div>
  );
}
