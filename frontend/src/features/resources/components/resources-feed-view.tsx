"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen } from "lucide-react";
import { useResources } from "../hooks/use-resources";
import { ResourceFilters } from "./resource-filters";
import { ResourceList } from "./resource-list";
import type { ResourceType } from "../types";

export function ResourcesFeedView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || undefined;
  const courseId = searchParams.get("courseId") || undefined;
  const typeParam = (searchParams.get("type") ||
    searchParams.get("resourceType")) as ResourceType | null;
  const resourceType = typeParam || undefined;
  const batch = searchParams.get("batch") || undefined;
  const section = searchParams.get("section") || undefined;

  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const { resources, meta, isLoading, error, refetch } = useResources({
    search,
    courseId,
    resourceType,
    batch,
    section,
    page,
    limit: 9,
  });

  const handleFilterChange = (filters: {
    search?: string;
    courseId?: string;
    resourceType?: ResourceType;
    batch?: string;
    section?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters.search) {
      params.set("search", filters.search);
    }
    if (filters.courseId) {
      params.set("courseId", filters.courseId);
    }
    if (filters.resourceType) {
      params.set("type", filters.resourceType);
    }
    if (filters.batch) {
      params.set("batch", filters.batch);
    }
    if (filters.section) {
      params.set("section", filters.section);
    }
    params.set("page", "1");

    const queryStr = params.toString();
    router.push(`/resources${queryStr ? `?${queryStr}` : ""}`);
  };

  const handleResetFilters = () => {
    router.push("/resources");
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/resources?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="size-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Academic Resource Hub
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Access verified lecture notes, previous exam question papers, lab manuals, and notices shared across departments.
          </p>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <ResourceFilters
        initialSearch={search}
        selectedCourseId={courseId}
        selectedType={resourceType}
        selectedBatch={batch}
        selectedSection={section}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* Resources Grid & Pagination */}
      <ResourceList
        resources={resources}
        meta={meta}
        isLoading={isLoading}
        error={error}
        onPageChange={handlePageChange}
        onRetry={refetch}
        onClearFilters={handleResetFilters}
      />
    </div>
  );
}
