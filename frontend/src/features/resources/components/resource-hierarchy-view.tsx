"use client";

import React, { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ResourceCard } from "./resource-card";
import { ResourcePagination } from "./resource-pagination";
import type { PaginationMeta, ResourceItem } from "../types";

interface ResourceHierarchyViewProps {
  resources: ResourceItem[];
  meta: PaginationMeta;
  isLoading: boolean;
  error: string | null;
  onPageChange: (newPage: number) => void;
  onRetry: () => void;
  onClearFilters?: () => void;
}

interface SectionGroup {
  sectionKey: string;
  sectionLabel: string;
  items: ResourceItem[];
}

interface SemesterGroup {
  semesterNumber: number;
  semesterLabel: string;
  resourceCount: number;
  sections: SectionGroup[];
}

interface DepartmentGroup {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  resourceCount: number;
  semesters: SemesterGroup[];
}

export function ResourceHierarchyView({
  resources,
  meta,
  isLoading,
  error,
  onPageChange,
  onRetry,
  onClearFilters,
}: ResourceHierarchyViewProps) {
  // Build the hierarchical tree: Department -> Semester -> Section -> Resources
  const departmentGroups = useMemo<DepartmentGroup[]>(() => {
    const deptMap = new Map<string, {
      code: string;
      name: string;
      semestersMap: Map<number, Map<string, ResourceItem[]>>;
    }>();

    for (const resource of resources) {
      const deptCode = resource.course.department?.code || "GENERAL";
      const deptName =
        resource.course.department?.name || "General Academic Resources";
      const deptKey = resource.course.department?.id || deptCode;

      if (!deptMap.has(deptKey)) {
        deptMap.set(deptKey, {
          code: deptCode,
          name: deptName,
          semestersMap: new Map(),
        });
      }

      const deptEntry = deptMap.get(deptKey)!;
      const semNum = resource.course.semester || 1;

      if (!deptEntry.semestersMap.has(semNum)) {
        deptEntry.semestersMap.set(semNum, new Map());
      }

      const semEntry = deptEntry.semestersMap.get(semNum)!;
      const secKey = resource.section?.trim() || "";

      if (!semEntry.has(secKey)) {
        semEntry.set(secKey, []);
      }

      semEntry.get(secKey)!.push(resource);
    }

    const result: DepartmentGroup[] = [];

    for (const [deptId, deptData] of deptMap.entries()) {
      let deptTotalCount = 0;
      const semesterGroups: SemesterGroup[] = [];

      // Sort semesters numerically 1 -> 12
      const sortedSemNumbers = Array.from(deptData.semestersMap.keys()).sort(
        (a, b) => a - b,
      );

      for (const semNum of sortedSemNumbers) {
        const secMap = deptData.semestersMap.get(semNum)!;
        const sectionGroups: SectionGroup[] = [];
        let semTotalCount = 0;

        // Sort sections: "A", "B", ... then empty/null as "General / All Sections"
        const sortedSecKeys = Array.from(secMap.keys()).sort((a, b) => {
          if (!a) return 1;
          if (!b) return -1;
          return a.localeCompare(b);
        });

        for (const secKey of sortedSecKeys) {
          const items = secMap.get(secKey)!;
          const sectionLabel = secKey ? `Section ${secKey}` : "General / All Sections";

          sectionGroups.push({
            sectionKey: secKey || "GENERAL",
            sectionLabel,
            items,
          });

          semTotalCount += items.length;
        }

        semesterGroups.push({
          semesterNumber: semNum,
          semesterLabel: `Semester ${semNum}`,
          resourceCount: semTotalCount,
          sections: sectionGroups,
        });

        deptTotalCount += semTotalCount;
      }

      result.push({
        departmentId: deptId,
        departmentCode: deptData.code,
        departmentName: deptData.name,
        resourceCount: deptTotalCount,
        semesters: semesterGroups,
      });
    }

    // Sort departments by code alphabetically
    result.sort((a, b) => a.departmentCode.localeCompare(b.departmentCode));

    return result;
  }, [resources]);

  // Collapsible state:
  // Departments: default first department expanded
  // Semesters: default all semesters expanded
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});
  const [collapsedSemesters, setCollapsedSemesters] = useState<Record<string, boolean>>({});

  const toggleDept = (deptId: string) => {
    setCollapsedDepts((prev) => ({
      ...prev,
      [deptId]: !prev[deptId],
    }));
  };

  const toggleSemester = (semKey: string) => {
    setCollapsedSemesters((prev) => ({
      ...prev,
      [semKey]: !prev[semKey],
    }));
  };

  // Result summary calculation
  const summaryText = useMemo(() => {
    if (resources.length === 0) return null;
    const uniqueSemesters = new Set(resources.map((r) => r.course.semester)).size;
    const resourceWord = resources.length === 1 ? "resource" : "resources";
    const semesterWord = uniqueSemesters === 1 ? "semester" : "semesters";
    return `Showing ${resources.length} ${resourceWord} across ${uniqueSemesters} ${semesterWord}`;
  }, [resources]);

  // 1. Loading State
  if (isLoading) {
    return (
      <div
        data-testid="resource-skeletons"
        className="space-y-6"
      >
        <div className="h-6 w-56 bg-muted rounded animate-pulse" />
        {Array.from({ length: 2 }).map((_, dIdx) => (
          <div key={dIdx} className="rounded-xl border border-border p-5 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border/60">
              <div className="h-6 w-1/3 bg-muted rounded animate-pulse" />
              <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, cIdx) => (
                <Card key={cIdx} className="animate-pulse flex flex-col h-56 border-border">
                  <CardHeader className="space-y-2 pb-2">
                    <div className="h-5 w-20 bg-muted rounded" />
                    <div className="h-5 w-3/4 bg-muted rounded" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-10 w-full bg-muted/60 rounded mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
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

  // 4. Hierarchical Tree Content
  return (
    <div className="space-y-6">
      {/* Result Count & Structure Summary */}
      {summaryText && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-medium text-muted-foreground">
            {summaryText}
          </p>
        </div>
      )}

      {/* Department Panels */}
      <div className="space-y-6">
        {departmentGroups.map((dept, deptIndex) => {
          // Default: first department is expanded, others expanded if fewer than 3 departments
          const isDeptCollapsed =
            collapsedDepts[dept.departmentId] !== undefined
              ? collapsedDepts[dept.departmentId]
              : deptIndex > 1;

          return (
            <div
              key={dept.departmentId}
              data-testid={`department-group-${dept.departmentCode}`}
              className="rounded-xl border border-border bg-card shadow-xs overflow-hidden transition-all"
            >
              {/* Department Header / Accordion Trigger */}
              <button
                type="button"
                onClick={() => toggleDept(dept.departmentId)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-muted/30 hover:bg-muted/50 border-b border-border/60 transition-colors cursor-pointer"
                aria-expanded={!isDeptCollapsed}
                aria-label={`Toggle ${dept.departmentName}`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                    <GraduationCap className="size-4 sm:size-5" />
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground line-clamp-1">
                      {dept.departmentName}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Faculty / Department Code: <span className="font-semibold text-foreground">{dept.departmentCode}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5">
                    {dept.resourceCount} {dept.resourceCount === 1 ? "Resource" : "Resources"}
                  </Badge>
                  {isDeptCollapsed ? (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Department Content: Semesters */}
              {!isDeptCollapsed && (
                <div className="p-4 sm:p-5 space-y-5">
                  {dept.semesters.map((sem) => {
                    const semKey = `${dept.departmentId}-${sem.semesterNumber}`;
                    const isSemCollapsed = Boolean(collapsedSemesters[semKey]);

                    return (
                      <div
                        key={semKey}
                        data-testid={`semester-group-${sem.semesterNumber}`}
                        className="rounded-lg border border-border/80 bg-background/50 overflow-hidden"
                      >
                        {/* Semester Header / Accordion Trigger */}
                        <button
                          type="button"
                          onClick={() => toggleSemester(semKey)}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 text-left bg-muted/20 hover:bg-muted/40 border-b border-border/40 transition-colors cursor-pointer"
                          aria-expanded={!isSemCollapsed}
                          aria-label={`Toggle ${sem.semesterLabel}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {sem.semesterLabel}
                            </span>
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              (Curriculum Progression)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium">
                              {sem.resourceCount} {sem.resourceCount === 1 ? "file" : "files"}
                            </span>
                            {isSemCollapsed ? (
                              <ChevronRight className="size-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="size-3.5 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {/* Semester Content: Sections & Resource Cards */}
                        {!isSemCollapsed && (
                          <div className="p-3 sm:p-4 space-y-4">
                            {sem.sections.map((sec) => (
                              <div
                                key={sec.sectionKey}
                                data-testid={`section-group-${sec.sectionKey}`}
                                className="space-y-3"
                              >
                                {/* Section Header */}
                                <div className="flex items-center gap-2 pt-1 border-b border-border/30 pb-1.5">
                                  <Layers className="size-3.5 text-muted-foreground" />
                                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {sec.sectionLabel}
                                  </h3>
                                  <span className="text-[11px] text-muted-foreground/70 font-mono">
                                    ({sec.items.length})
                                  </span>
                                </div>

                                {/* Resource Cards Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {sec.items.map((resource) => (
                                    <ResourceCard
                                      key={resource.id}
                                      resource={resource}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      <ResourcePagination meta={meta} onPageChange={onPageChange} />
    </div>
  );
}
