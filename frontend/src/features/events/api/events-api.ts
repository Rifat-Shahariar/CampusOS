import { api } from "@/lib/api";
import type {
  EventDetail,
  EventItem,
  EventTicket,
  EventsQueryParams,
  MyRegistrationsQueryParams,
  PaginatedEventsResponse,
  StudentRegistrationItem,
} from "../types";

export const eventsApi = {
  /**
   * Fetch paginated events with optional filters (search, club, type, date).
   */
  async getEvents(
    params: EventsQueryParams = {},
  ): Promise<PaginatedEventsResponse<EventItem>> {
    const searchParams = new URLSearchParams();
    if (params.search?.trim()) {
      searchParams.set("search", params.search.trim());
    }
    if (params.clubId) {
      searchParams.set("clubId", params.clubId);
    }
    if (params.clubSlug) {
      searchParams.set("clubSlug", params.clubSlug);
    }
    if (params.eventType) {
      searchParams.set("eventType", params.eventType);
    }
    if (params.startDate) {
      searchParams.set("startDate", params.startDate);
    }
    if (params.endDate) {
      searchParams.set("endDate", params.endDate);
    }
    if (params.page && params.page > 1) {
      searchParams.set("page", params.page.toString());
    }
    if (params.limit && params.limit !== 10) {
      searchParams.set("limit", params.limit.toString());
    }

    const queryStr = searchParams.toString();
    const endpoint = `/events${queryStr ? `?${queryStr}` : ""}`;
    return api.get<PaginatedEventsResponse<EventItem>>(endpoint, {
      requiresAuth: false,
    });
  },

  /**
   * Fetch event details by UUID or slug.
   * Sends Authorization header if token exists to report user registration status.
   */
  async getEventById(id: string): Promise<EventDetail> {
    return api.get<EventDetail>(`/events/${id}`);
  },

  /**
   * Fetch logged-in student's registrations.
   */
  async getMyRegistrations(
    params: MyRegistrationsQueryParams = {},
  ): Promise<PaginatedEventsResponse<StudentRegistrationItem>> {
    const searchParams = new URLSearchParams();
    if (params.status) {
      searchParams.set("status", params.status);
    }
    if (params.page && params.page > 1) {
      searchParams.set("page", params.page.toString());
    }
    if (params.limit && params.limit !== 10) {
      searchParams.set("limit", params.limit.toString());
    }

    const queryStr = searchParams.toString();
    const endpoint = `/events/my-registrations${queryStr ? `?${queryStr}` : ""}`;
    return api.get<PaginatedEventsResponse<StudentRegistrationItem>>(endpoint, {
      requiresAuth: true,
    });
  },

  /**
   * Register for an event. Authenticated STUDENT only.
   */
  async register(eventId: string): Promise<{
    success: boolean;
    message: string;
    registration: {
      id: string;
      registrationCode: string;
      status: string;
      registeredAt: string;
    };
  }> {
    return api.post(`/events/${eventId}/register`, undefined, {
      requiresAuth: true,
    });
  },

  /**
   * Cancel own registration for an event.
   */
  async cancelRegistration(
    eventId: string,
  ): Promise<{ success: boolean; message: string }> {
    return api.delete(`/events/${eventId}/register`, {
      requiresAuth: true,
    });
  },

  /**
   * Fetch QR ticket for an active registration.
   */
  async getTicket(eventId: string): Promise<EventTicket> {
    return api.get<EventTicket>(`/events/${eventId}/ticket`, {
      requiresAuth: true,
    });
  },
};
