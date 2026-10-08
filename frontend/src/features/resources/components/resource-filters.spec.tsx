import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResourceFilters } from "./resource-filters";

vi.mock("../hooks/use-resource-courses", () => ({
  useResourceCourses: () => ({
    courses: [
      {
        id: "c-1",
        code: "CSE 2115",
        name: "Data Structures",
        department: { id: "d-1", code: "CSE", name: "Computer Science" },
      },
      {
        id: "c-2",
        code: "CSE 3101",
        name: "Database Systems",
        department: { id: "d-1", code: "CSE", name: "Computer Science" },
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe("ResourceFilters", () => {
  it("renders with search input, course dropdown, and category pills", () => {
    render(
      <ResourceFilters
        initialSearch="linked lists"
        onFilterChange={vi.fn()}
        onResetFilters={vi.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    expect(searchInput).toHaveValue("linked lists");

    expect(screen.getByText("All Types")).toBeInTheDocument();
    expect(screen.getByText("Lecture Notes")).toBeInTheDocument();
    expect(screen.getByText("Question Papers")).toBeInTheDocument();

    expect(screen.getByRole("combobox", { name: /Filter by course/i })).toBeInTheDocument();
    expect(screen.getByText(/CSE 2115/)).toBeInTheDocument();
  });

  it("submits search and calls onFilterChange with trimmed keyword", () => {
    const handleFilterChange = vi.fn();
    render(
      <ResourceFilters
        onFilterChange={handleFilterChange}
        onResetFilters={vi.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    fireEvent.change(searchInput, { target: { value: "sql joins" } });

    const searchButton = screen.getByRole("button", { name: "Search" });
    fireEvent.click(searchButton);

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "sql joins",
      }),
    );
  });

  it("calls onFilterChange when category pill is selected", () => {
    const handleFilterChange = vi.fn();
    render(
      <ResourceFilters
        onFilterChange={handleFilterChange}
        onResetFilters={vi.fn()}
      />,
    );

    const labManualPill = screen.getByText("Lab Manuals");
    fireEvent.click(labManualPill);

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceType: "LAB_MANUAL",
      }),
    );
  });

  it("calls onFilterChange when course selection changes", () => {
    const handleFilterChange = vi.fn();
    render(
      <ResourceFilters
        onFilterChange={handleFilterChange}
        onResetFilters={vi.fn()}
      />,
    );

    const courseSelect = screen.getByRole("combobox", {
      name: /Filter by course/i,
    });
    fireEvent.change(courseSelect, { target: { value: "c-1" } });

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: "c-1",
      }),
    );
  });

  it("renders Reset Filters button when active filters exist and triggers onResetFilters", () => {
    const handleReset = vi.fn();
    render(
      <ResourceFilters
        initialSearch="sorting"
        onFilterChange={vi.fn()}
        onResetFilters={handleReset}
      />,
    );

    const resetButton = screen.getByRole("button", { name: /Reset Filters/i });
    expect(resetButton).toBeInTheDocument();

    fireEvent.click(resetButton);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
