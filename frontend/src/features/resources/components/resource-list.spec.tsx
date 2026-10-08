import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResourceList } from "./resource-list";
import type { PaginationMeta, ResourceItem } from "../types";

describe("ResourceList", () => {
  const dummyMeta: PaginationMeta = {
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  const mockResources: ResourceItem[] = [
    {
      id: "res-1",
      courseId: "c-1",
      title: "Binary Search Trees",
      description: "BST insertion and deletion notes",
      resourceType: "NOTE",
      fileName: "bst.pdf",
      fileUrl: "https://campusos.dev/bst.pdf",
      fileSize: 102400,
      mimeType: "application/pdf",
      batch: "67",
      section: "A",
      uploadedBy: "u-1",
      isPublished: true,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z",
      course: {
        id: "c-1",
        code: "CSE 2115",
        name: "Data Structures",
      },
    },
    {
      id: "res-2",
      courseId: "c-2",
      title: "Database Normalization Sheet",
      description: "1NF to BCNF rules",
      resourceType: "QUESTION_PAPER",
      fileName: "normalization.pdf",
      fileUrl: "https://campusos.dev/norm.pdf",
      fileSize: 204800,
      mimeType: "application/pdf",
      batch: null,
      section: null,
      uploadedBy: "u-1",
      isPublished: true,
      createdAt: "2026-10-02T00:00:00Z",
      updatedAt: "2026-10-02T00:00:00Z",
      course: {
        id: "c-2",
        code: "CSE 3101",
        name: "Database Systems",
      },
    },
  ];

  it("renders loading skeletons when isLoading is true", () => {
    render(
      <ResourceList
        resources={[]}
        meta={dummyMeta}
        isLoading={true}
        error={null}
        onPageChange={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByTestId("resource-skeletons")).toBeInTheDocument();
  });

  it("renders error state with retry button when error occurs", () => {
    const handleRetry = vi.fn();
    render(
      <ResourceList
        resources={[]}
        meta={dummyMeta}
        isLoading={false}
        error="Network timeout occurred"
        onPageChange={vi.fn()}
        onRetry={handleRetry}
      />,
    );

    expect(screen.getByText("Unable to load resources")).toBeInTheDocument();
    expect(screen.getByText("Network timeout occurred")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /Try Again/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("renders empty state with reset filters button when no resources found", () => {
    const handleClear = vi.fn();
    render(
      <ResourceList
        resources={[]}
        meta={{ total: 0, page: 1, limit: 10, totalPages: 1 }}
        isLoading={false}
        error={null}
        onPageChange={vi.fn()}
        onRetry={vi.fn()}
        onClearFilters={handleClear}
      />,
    );

    expect(screen.getByText("No resources found")).toBeInTheDocument();

    const resetBtn = screen.getByRole("button", { name: /Reset Filters/i });
    fireEvent.click(resetBtn);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it("renders list of resource cards when resources are provided", () => {
    render(
      <ResourceList
        resources={mockResources}
        meta={dummyMeta}
        isLoading={false}
        error={null}
        onPageChange={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText("Binary Search Trees")).toBeInTheDocument();
    expect(screen.getByText("Database Normalization Sheet")).toBeInTheDocument();
  });
});
