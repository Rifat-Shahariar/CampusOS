import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { clubsApi } from "./clubs-api";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

describe("clubsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getClubs", () => {
    it("calls api.get with default endpoint when no params provided", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
      });

      await clubsApi.getClubs();

      expect(api.get).toHaveBeenCalledWith("/clubs", { requiresAuth: false });
    });

    it("constructs correct query parameters for search and pagination", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [],
        meta: { total: 0, page: 2, limit: 20, totalPages: 1 },
      });

      await clubsApi.getClubs({ search: "robotics", page: 2, limit: 20 });

      expect(api.get).toHaveBeenCalledWith(
        "/clubs?search=robotics&page=2&limit=20",
        { requiresAuth: false },
      );
    });
  });

  describe("getClubById", () => {
    it("calls api.get with the specific club id", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        id: "club-123",
        name: "Test Club",
      });

      await clubsApi.getClubById("club-123");

      expect(api.get).toHaveBeenCalledWith("/clubs/club-123", {
        requiresAuth: false,
      });
    });
  });

  describe("getClubPosts", () => {
    it("calls api.get with the specific club posts endpoint", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
      });

      await clubsApi.getClubPosts("club-123", { page: 2 });

      expect(api.get).toHaveBeenCalledWith("/clubs/club-123/posts?page=2", {
        requiresAuth: false,
      });
    });
  });
});
