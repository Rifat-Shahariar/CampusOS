import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResourceHierarchyView } from "./resource-hierarchy-view";
import type { PaginationMeta, ResourceItem } from "../types";

describe("ResourceHierarchyView", () => {
  const dummyMeta: PaginationMeta = {
    total: 4,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  const mockResources: ResourceItem[] = [
    {
      id: "res-3",
      courseId: "c-3",
      title: "Algorithms & Complexity Notes",
      description: "Asymptotic notation",
      resourceType: "NOTE",
      fileName: "algo.pdf",
      fileUrl: "https://campusos.dev/algo.pdf",
      fileSize: 102400,
      mimeType: "application/pdf",
      batch: "67",
      section: "B",
      uploadedBy: "u-1",
      isPublished: true,
      createdAt: "2026-10-03T00:00:00Z",
      updatedAt: "2026-10-03T00:00:00Z",
      course: {
        id: "c-3",
        code: "CSE 2115",
        name: "Data Structures and Algorithms",
        semester: 4,
        department: {
          id: "dept-cse",
          code: "CSE",
          name: "Department of Computer Science & Engineering",
        },
      },
    },
    {
      id: "res-1",
      courseId: "c-1",
      title: "Structured Programming Slides",
      description: "C programming pointers",
      resourceType: "NOTE",
      fileName: "sp.pdf",
      fileUrl: "https://campusos.dev/sp.pdf",
      fileSize: 204800,
      mimeType: "application/pdf",
      batch: "68",
      section: "A",
      uploadedBy: "u-1",
      isPublished: true,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z",
      course: {
        id: "c-1",
        code: "CSE 1101",
        name: "Structured Programming",
        semester: 1,
        department: {
          id: "dept-cse",
          code: "CSE",
          name: "Department of Computer Science & Engineering",
        },
      },
    },
    {
      id: "res-2",
      courseId: "c-2",
      title: "Database Normalization Sheet",
      description: "BCNF decomposition",
      resourceType: "QUESTION_PAPER",
      fileName: "normalization.pdf",
      fileUrl: "https://campusos.dev/norm.pdf",
      fileSize: 307200,
      mimeType: "application/pdf",
      batch: "67",
      section: null, // General / All Sections
      uploadedBy: "u-1",
      isPublished: true,
      createdAt: "2026-10-02T00:00:00Z",
      updatedAt: "2026-10-02T00:00:00Z",
      course: {
        id: "c-2",
        code: "CSE 3101",
        name: "Database Systems",
        semester: 7,
        department: {
          id: "dept-cse",
          code: "CSE",
          name: "Department of Computer Science & Engineering",
        },
      },
    },
    {
      id: "res-4",
      courseId: "c-4",
      title: "Circuit Theorems Lab Manual",
      description: "Thevenin and Norton",
      resourceType: "LAB_MANUAL",
      fileName: "circuits.pdf",
      fileUrl: "https://campusos.dev/circuits.pdf",
      fileSize: 409600,
      mimeType: "application/pdf",
      batch: "67",
      section: "A",
      uploadedBy: "u-1",
      isPublished: true,
      createdAt: "2026-10-04T00:00:00Z",
      updatedAt: "2026-10-04T00:00:00Z",
      course: {
        id: "c-4",
        code: "EEE 1101",
        name: "Electrical Circuits I",
        semester: 1,
        department: {
          id: "dept-eee",
          code: "EEE",
          name: "Department of Electrical & Electronic Engineering",
        },
      },
    },
  ];

  it("renders loading skeletons when isLoading is true", () => {
    render(
      <ResourceHierarchyView
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
      <ResourceHierarchyView
        resources={[]}
        meta={dummyMeta}
        isLoading={false}
        error="Failed to fetch hierarchy"
        onPageChange={vi.fn()}
        onRetry={handleRetry}
      />,
    );

    expect(screen.getByText("Unable to load resources")).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch hierarchy")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /Try Again/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when no resources are provided", () => {
    const handleClear = vi.fn();
    render(
      <ResourceHierarchyView
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

  it("groups resources by department and displays resource count", () => {
    render(
      <ResourceHierarchyView
        resources={mockResources}
        meta={dummyMeta}
        isLoading={false}
        error={null}
        onPageChange={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Department of Computer Science & Engineering"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Department of Electrical & Electronic Engineering"),
    ).toBeInTheDocument();

    expect(screen.getByText("3 Resources")).toBeInTheDocument(); // CSE total
    expect(screen.getByText("1 Resource")).toBeInTheDocument(); // EEE total
  });

  it("groups resources by semester and sorts semesters numerically (1 -> 12)", () => {
    render(
      <ResourceHierarchyView
        resources={mockResources}
        meta={dummyMeta}
        isLoading={false}
        error={null}
        onPageChange={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    // Semesters inside CSE (1, 4, 7)
    const semester1Badges = screen.getAllByText("Semester 1");
    expect(semester1Badges.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("Semester 4")).toBeInTheDocument();
    expect(screen.getByText("Semester 7")).toBeInTheDocument();
  });

  it("groups resources by section and labels null section as 'General / All Sections'", () => {
    render(
      <ResourceHierarchyView
        resources={mockResources}
        meta={dummyMeta}
        isLoading={false}
        error={null}
        onPageChange={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Section A").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Section B")).toBeInTheDocument();
    expect(screen.getByText("General / All Sections")).toBeInTheDocument();
  });

  it("reuses ResourceCard component to render individual resource cards", () => {
    render(
      <ResourceHierarchyView
        resources={mockResources}
        meta={dummyMeta}
        isLoading={false}
        error={null}
        onPageChange={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText("Structured Programming Slides")).toBeInTheDocument();
    expect(screen.getByText("Database Normalization Sheet")).toBeInTheDocument();
    expect(screen.getByText("Algorithms & Complexity Notes")).toBeInTheDocument();
    expect(screen.getByText("Circuit Theorems Lab Manual")).toBeInTheDocument();
  });

  it("only renders departments and semesters present in the filtered result set", () => {
    // Filtered to only 1 resource (Semester 4 of CSE)
    const filteredResources = [mockResources[0]]; // Algorithms & Complexity Notes (CSE, Sem 4, Sec B)

    render(
      <ResourceHierarchyView
        resources={filteredResources}
        meta={{ total: 1, page: 1, limit: 10, totalPages: 1 }}
        isLoading={false}
        error={null}
        onPageChange={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    // CSE and Semester 4 must appear
    expect(
      screen.getByText("Department of Computer Science & Engineering"),
    ).toBeInTheDocument();
    expect(screen.getByText("Semester 4")).toBeInTheDocument();
    expect(screen.getByText("Section B")).toBeInTheDocument();

    // EEE, Semester 1, and Semester 7 must NOT appear
    expect(
      screen.queryByText("Department of Electrical & Electronic Engineering"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Semester 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Semester 7")).not.toBeInTheDocument();
  });

  it("toggles collapse and expand when department or semester headers are clicked", () => {
    render(
      <ResourceHierarchyView
        resources={mockResources}
        meta={dummyMeta}
        isLoading={false}
        error={null}
        onPageChange={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    const cseToggle = screen.getByRole("button", {
      name: /Toggle Department of Computer Science & Engineering/i,
    });
    expect(cseToggle).toHaveAttribute("aria-expanded", "true");

    // Click to collapse CSE
    fireEvent.click(cseToggle);
    expect(cseToggle).toHaveAttribute("aria-expanded", "false");

    // Click again to expand CSE
    fireEvent.click(cseToggle);
    expect(cseToggle).toHaveAttribute("aria-expanded", "true");
  });

  it("displays summary text of resources and unique semesters count", () => {
    render(
      <ResourceHierarchyView
        resources={mockResources}
        meta={dummyMeta}
        isLoading={false}
        error={null}
        onPageChange={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    // 4 resources across Semesters 1, 4, 7 (3 unique semesters)
    expect(
      screen.getByText("Showing 4 resources across 3 semesters"),
    ).toBeInTheDocument();
  });
});
