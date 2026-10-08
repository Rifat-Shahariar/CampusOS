import { api } from "@/lib/api";
import type {
  Club,
  ClubPostsQueryParams,
  ClubPost,
  ClubsQueryParams,
  PaginatedResponse,
} from "../types";

export const clubsApi = {
  /**
   * Fetch active clubs with optional search and pagination.
   */
  async getClubs(params: ClubsQueryParams = {}): Promise<PaginatedResponse<Club>> {
    const searchParams = new URLSearchParams();
    if (params.search?.trim()) {
      searchParams.set("search", params.search.trim());
    }
    if (params.page && params.page > 1) {
      searchParams.set("page", params.page.toString());
    }
    if (params.limit && params.limit !== 10) {
      searchParams.set("limit", params.limit.toString());
    }

    const queryString = searchParams.toString();
    const endpoint = `/clubs${queryString ? `?${queryString}` : ""}`;

    return api.get<PaginatedResponse<Club>>(endpoint, { requiresAuth: false });
  },

  /**
   * Fetch a single active club by ID.
   */
  async getClubById(id: string): Promise<Club> {
    return api.get<Club>(`/clubs/${id}`, { requiresAuth: false });
  },

  /**
   * Fetch published posts for a club with pagination.
   */
  async getClubPosts(
    clubId: string,
    params: ClubPostsQueryParams = {},
  ): Promise<PaginatedResponse<ClubPost>> {
    const searchParams = new URLSearchParams();
    if (params.page && params.page > 1) {
      searchParams.set("page", params.page.toString());
    }
    if (params.limit && params.limit !== 10) {
      searchParams.set("limit", params.limit.toString());
    }

    const queryString = searchParams.toString();
    const endpoint = `/clubs/${clubId}/posts${queryString ? `?${queryString}` : ""}`;

    return api.get<PaginatedResponse<ClubPost>>(endpoint, { requiresAuth: false });
  },
};
