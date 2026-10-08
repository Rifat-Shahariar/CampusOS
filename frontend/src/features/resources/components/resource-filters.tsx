"use client";

import React, { useState } from "react";
import { Filter, RotateCcw, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useResourceCourses } from "../hooks/use-resource-courses";
import type { ResourceType } from "../types";

interface ResourceFiltersProps {
  initialSearch?: string;
  selectedCourseId?: string;
  selectedType?: ResourceType;
  selectedBatch?: string;
  selectedSection?: string;
  onFilterChange: (filters: {
    search?: string;
    courseId?: string;
    resourceType?: ResourceType;
    batch?: string;
    section?: string;
  }) => void;
  onResetFilters: () => void;
}

const RESOURCE_TYPES: { value: ResourceType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Types" },
  { value: "NOTE", label: "Lecture Notes" },
  { value: "QUESTION_PAPER", label: "Question Papers" },
  { value: "LAB_MANUAL", label: "Lab Manuals" },
  { value: "NOTICE", label: "Notices" },
  { value: "OTHER", label: "References" },
];

export function ResourceFilters({
  initialSearch = "",
  selectedCourseId,
  selectedType,
  selectedBatch = "",
  selectedSection = "",
  onFilterChange,
  onResetFilters,
}: ResourceFiltersProps) {
  const [searchValue, setSearchValue] = useState(initialSearch);
  const [batchValue, setBatchValue] = useState(selectedBatch);
  const [sectionValue, setSectionValue] = useState(selectedSection);
  const { courses, isLoading: isCoursesLoading } = useResourceCourses();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      search: searchValue.trim() || undefined,
      courseId: selectedCourseId,
      resourceType: selectedType,
      batch: batchValue.trim() || undefined,
      section: sectionValue.trim() || undefined,
    });
  };

  const handleClearSearch = () => {
    setSearchValue("");
    onFilterChange({
      search: undefined,
      courseId: selectedCourseId,
      resourceType: selectedType,
      batch: batchValue.trim() || undefined,
      section: sectionValue.trim() || undefined,
    });
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      search: searchValue.trim() || undefined,
      courseId: value === "ALL" ? undefined : value,
      resourceType: selectedType,
      batch: batchValue.trim() || undefined,
      section: sectionValue.trim() || undefined,
    });
  };

  const handleTypeSelect = (typeVal: ResourceType | "ALL") => {
    const newType = typeVal === "ALL" ? undefined : typeVal;
    onFilterChange({
      search: searchValue.trim() || undefined,
      courseId: selectedCourseId,
      resourceType: newType,
      batch: batchValue.trim() || undefined,
      section: sectionValue.trim() || undefined,
    });
  };

  const handleBatchSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      search: searchValue.trim() || undefined,
      courseId: selectedCourseId,
      resourceType: selectedType,
      batch: batchValue.trim() || undefined,
      section: sectionValue.trim() || undefined,
    });
  };

  const handleReset = () => {
    setSearchValue("");
    setBatchValue("");
    setSectionValue("");
    onResetFilters();
  };

  const hasActiveFilters = Boolean(
    searchValue ||
      selectedCourseId ||
      selectedType ||
      batchValue ||
      sectionValue,
  );

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs">
      {/* Top Search Bar & Action Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search by title, description, or file name..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 pr-9 text-sm"
              aria-label="Search resources"
            />
            {searchValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Clear search text"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Button type="submit" size="sm" className="px-4 text-xs font-semibold">
            Search
          </Button>
        </form>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-destructive gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset Filters</span>
          </Button>
        )}
      </div>

      {/* Filter Grid: Course Select, Batch, Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Course Select */}
        <div className="space-y-1.5">
          <label htmlFor="course-select" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Filter className="size-3" />
            Course
          </label>
          <select
            id="course-select"
            value={selectedCourseId || "ALL"}
            onChange={handleCourseChange}
            disabled={isCoursesLoading}
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground cursor-pointer"
            aria-label="Filter by course"
          >
            <option value="ALL">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} — {course.name} ({course.department?.code || ""})
              </option>
            ))}
          </select>
        </div>

        {/* Batch Filter Input */}
        <div className="space-y-1.5">
          <label htmlFor="batch-input" className="text-xs font-medium text-muted-foreground">
            Academic Batch
          </label>
          <form onSubmit={handleBatchSectionSubmit} className="flex gap-1.5">
            <Input
              id="batch-input"
              type="text"
              placeholder="e.g. 67, 68"
              value={batchValue}
              onChange={(e) => setBatchValue(e.target.value)}
              className="h-9 text-xs"
              aria-label="Filter by batch"
            />
            <Button type="submit" variant="secondary" size="sm" className="h-9 px-2.5 text-xs">
              Apply
            </Button>
          </form>
        </div>

        {/* Section Filter Input */}
        <div className="space-y-1.5">
          <label htmlFor="section-input" className="text-xs font-medium text-muted-foreground">
            Section / Group
          </label>
          <form onSubmit={handleBatchSectionSubmit} className="flex gap-1.5">
            <Input
              id="section-input"
              type="text"
              placeholder="e.g. A, B"
              value={sectionValue}
              onChange={(e) => setSectionValue(e.target.value)}
              className="h-9 text-xs"
              aria-label="Filter by section"
            />
            <Button type="submit" variant="secondary" size="sm" className="h-9 px-2.5 text-xs">
              Apply
            </Button>
          </form>
        </div>
      </div>

      {/* Resource Type Category Pills */}
      <div className="space-y-1.5 pt-2 border-t border-border/60">
        <span className="text-xs font-medium text-muted-foreground">Resource Type:</span>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {RESOURCE_TYPES.map((typeObj) => {
            const isSelected =
              (typeObj.value === "ALL" && !selectedType) ||
              selectedType === typeObj.value;

            return (
              <button
                key={typeObj.value}
                type="button"
                onClick={() => handleTypeSelect(typeObj.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
                aria-pressed={isSelected}
              >
                {typeObj.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
