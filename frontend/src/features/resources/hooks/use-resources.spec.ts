import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useResources } from "./use-resources";
import { resourcesApi } from "../api/resources-api";
import type { ResourceType } from "../types";

describe("useResources hook", () => {
  const mockResourcesResponse = {
    data: [
      {
        id: "r-1",
        courseId: "c-1",
        title: "Linked Lists Lecture Slides",
        description: "Notes on data structures",
        resourceType: "NOTE" as const,
        fileName: "linked-lists.pdf",
        fileUrl: "https://example.com/linked-lists.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        batch: "67",
        section: "A",
        uploadedBy: "u-1",
        isPublished: true,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        course: {
          id: "c-1",
          code: "CSE 2115",
          name: "Data Structures",
          department: {
            id: "d-1",
            code: "CSE",
            name: "Computer Science",
          },
        },
        uploadedByUser: {
          id: "u-1",
          name: "Dr. Smith",
          email: "smith@campusos.dev",
          role: "RESOURCE_ADMIN" as const,
        },
      },
    ],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches resources on initial mount", async () => {
    const getResourcesSpy = vi.spyOn(resourcesApi, "getResources").mockResolvedValue(mockResourcesResponse);

    const { result } = renderHook(() => useResources({ limit: 10 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getResourcesSpy).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
    expect(result.current.resources).toHaveLength(1);
    expect(result.current.resources[0].title).toBe("Linked Lists Lecture Slides");
  });

  it("applies search term correctly when initialParams changes", async () => {
    const getResourcesSpy = vi.spyOn(resourcesApi, "getResources").mockResolvedValue(mockResourcesResponse);

    let params = { search: undefined as string | undefined };
    const { result, rerender } = renderHook(() => useResources(params));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // User submits search term in URL
    params = { search: "algorithms" };
    rerender();

    await waitFor(() => {
      expect(getResourcesSpy).toHaveBeenCalledWith(
        expect.objectContaining({ search: "algorithms" }),
      );
    });
  });

  it("applies course filter correctly when initialParams changes", async () => {
    const getResourcesSpy = vi.spyOn(resourcesApi, "getResources").mockResolvedValue(mockResourcesResponse);

    let params = { courseId: undefined as string | undefined };
    const { result, rerender } = renderHook(() => useResources(params));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // User selects course in dropdown
    params = { courseId: "c-1" };
    rerender();

    await waitFor(() => {
      expect(getResourcesSpy).toHaveBeenCalledWith(
        expect.objectContaining({ courseId: "c-1" }),
      );
    });
  });

  it("applies resource type filter correctly when initialParams changes", async () => {
    const getResourcesSpy = vi.spyOn(resourcesApi, "getResources").mockResolvedValue(mockResourcesResponse);

    let params: { resourceType?: ResourceType } = { resourceType: undefined };
    const { result, rerender } = renderHook(() => useResources(params));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // User clicks Resource Type pill
    params = { resourceType: "NOTE" as const };
    rerender();

    await waitFor(() => {
      expect(getResourcesSpy).toHaveBeenCalledWith(
        expect.objectContaining({ resourceType: "NOTE" }),
      );
    });
  });

  it("applies combined filters (search + course + resourceType + batch + section) simultaneously", async () => {
    const getResourcesSpy = vi.spyOn(resourcesApi, "getResources").mockResolvedValue(mockResourcesResponse);

    const combinedParams = {
      search: "midterm",
      courseId: "c-1",
      resourceType: "QUESTION_PAPER" as const,
      batch: "67",
      section: "A",
    };

    const { result } = renderHook(() => useResources(combinedParams));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getResourcesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "midterm",
        courseId: "c-1",
        resourceType: "QUESTION_PAPER",
        batch: "67",
        section: "A",
      }),
    );
  });

  it("resets page and updates filters using updateFilters", async () => {
    const getResourcesSpy = vi.spyOn(resourcesApi, "getResources").mockResolvedValue(mockResourcesResponse);

    const { result } = renderHook(() => useResources({ page: 3 }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.updateFilters({ courseId: "c-2" });
    });

    await waitFor(() => {
      expect(getResourcesSpy).toHaveBeenCalledWith(
        expect.objectContaining({ courseId: "c-2", page: 1 }),
      );
    });
  });
});
