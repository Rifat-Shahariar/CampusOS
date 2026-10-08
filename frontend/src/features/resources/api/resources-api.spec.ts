import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { resourcesApi } from "./resources-api";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

describe("resourcesApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getResources", () => {
    it("calls api.get with default /resources endpoint when no params provided", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
      });

      await resourcesApi.getResources();

      expect(api.get).toHaveBeenCalledWith("/resources", {
        requiresAuth: false,
      });
    });

    it("constructs correct query parameters for search, courseId, type, batch, and pagination", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [],
        meta: { total: 0, page: 2, limit: 15, totalPages: 1 },
      });

      await resourcesApi.getResources({
        search: "algorithms",
        courseId: "course-123",
        resourceType: "NOTE",
        batch: "67",
        section: "A",
        page: 2,
        limit: 15,
      });

      expect(api.get).toHaveBeenCalledWith(
        "/resources?search=algorithms&courseId=course-123&resourceType=NOTE&batch=67&section=A&page=2&limit=15",
        { requiresAuth: false },
      );
    });

    it("supports type alias parameter properly", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
      });

      await resourcesApi.getResources({
        type: "QUESTION_PAPER",
      });

      expect(api.get).toHaveBeenCalledWith(
        "/resources?resourceType=QUESTION_PAPER",
        { requiresAuth: false },
      );
    });
  });

  describe("getCourses", () => {
    it("calls api.get for courses with requiresAuth: false", async () => {
      vi.mocked(api.get).mockResolvedValueOnce([
        {
          id: "c1",
          code: "CSE 2115",
          name: "Data Structures",
          department: { id: "d1", code: "CSE", name: "Computer Science" },
        },
      ]);

      const courses = await resourcesApi.getCourses();

      expect(api.get).toHaveBeenCalledWith("/resources/courses", {
        requiresAuth: false,
      });
      expect(courses).toHaveLength(1);
      expect(courses[0].code).toBe("CSE 2115");
    });
  });

  describe("getResourceById", () => {
    it("calls api.get with the specific resource id", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        id: "res-uuid-1",
        title: "Linked Lists Slides",
      });

      const result = await resourcesApi.getResourceById("res-uuid-1");

      expect(api.get).toHaveBeenCalledWith("/resources/res-uuid-1");
      expect(result.id).toBe("res-uuid-1");
    });
  });
});
