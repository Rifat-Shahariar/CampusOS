import { api } from "@/lib/api";
import type {
  CourseItem,
  PaginatedResourcesResponse,
  ResourceDetail,
  ResourceItem,
  ResourcesQueryParams,
} from "../types";

export const resourcesApi = {
  /**
   * Fetch paginated resources with optional filters (search, courseId, type, batch, section).
   * Public endpoint.
   */
  async getResources(
    params: ResourcesQueryParams = {},
  ): Promise<PaginatedResourcesResponse<ResourceItem>> {
    const searchParams = new URLSearchParams();

    if (params.search?.trim()) {
      searchParams.set("search", params.search.trim());
    }
    if (params.courseId) {
      searchParams.set("courseId", params.courseId);
    }
    const typeVal = params.resourceType || params.type;
    if (typeVal) {
      searchParams.set("resourceType", typeVal);
    }
    if (params.batch?.trim()) {
      searchParams.set("batch", params.batch.trim());
    }
    if (params.section?.trim()) {
      searchParams.set("section", params.section.trim());
    }
    if (params.semester !== undefined && params.semester !== null) {
      searchParams.set("semester", params.semester.toString());
    }
    if (params.page && params.page > 1) {
      searchParams.set("page", params.page.toString());
    }
    if (params.limit && params.limit !== 10) {
      searchParams.set("limit", params.limit.toString());
    }

    const queryStr = searchParams.toString();
    const endpoint = `/resources${queryStr ? `?${queryStr}` : ""}`;

    return api.get<PaginatedResourcesResponse<ResourceItem>>(endpoint, {
      requiresAuth: false,
    });
  },

  /**
   * Fetch active courses with department details for filter dropdowns.
   * Public endpoint.
   */
  async getCourses(): Promise<CourseItem[]> {
    return api.get<CourseItem[]>("/resources/courses", {
      requiresAuth: false,
    });
  },

  /**
   * Fetch single resource details by UUID.
   * Public endpoint (sends token if available).
   */
  async getResourceById(id: string): Promise<ResourceDetail> {
    return api.get<ResourceDetail>(`/resources/${id}`);
  },
};
