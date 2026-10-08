import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { eventsApi } from "./events-api";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("eventsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getEvents", () => {
    it("calls api.get with default endpoint when no params provided", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
      });

      await eventsApi.getEvents();

      expect(api.get).toHaveBeenCalledWith("/events", { requiresAuth: false });
    });

    it("constructs correct query parameters for search, category, and pagination", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [],
        meta: { total: 0, page: 2, limit: 20, totalPages: 1 },
      });

      await eventsApi.getEvents({
        search: "hackathon",
        eventType: "Workshop",
        page: 2,
        limit: 20,
      });

      expect(api.get).toHaveBeenCalledWith(
        "/events?search=hackathon&eventType=Workshop&page=2&limit=20",
        { requiresAuth: false },
      );
    });
  });

  describe("getEventById", () => {
    it("calls api.get with the specific event id", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        id: "event-123",
        title: "Test Event",
      });

      await eventsApi.getEventById("event-123");

      expect(api.get).toHaveBeenCalledWith("/events/event-123");
    });
  });

  describe("getMyRegistrations", () => {
    it("calls api.get for my registrations with requiresAuth: true", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
      });

      await eventsApi.getMyRegistrations({ status: "REGISTERED" });

      expect(api.get).toHaveBeenCalledWith(
        "/events/my-registrations?status=REGISTERED",
        { requiresAuth: true },
      );
    });
  });

  describe("register", () => {
    it("calls api.post for event registration with requiresAuth: true", async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        success: true,
        registration: { id: "reg-1" },
      });

      await eventsApi.register("event-123");

      expect(api.post).toHaveBeenCalledWith(
        "/events/event-123/register",
        undefined,
        { requiresAuth: true },
      );
    });
  });

  describe("cancelRegistration", () => {
    it("calls api.delete for cancelling registration", async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({
        success: true,
      });

      await eventsApi.cancelRegistration("event-123");

      expect(api.delete).toHaveBeenCalledWith(
        "/events/event-123/register",
        { requiresAuth: true },
      );
    });
  });

  describe("getTicket", () => {
    it("calls api.get for event ticket", async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        qrToken: "token-abc",
      });

      await eventsApi.getTicket("event-123");

      expect(api.get).toHaveBeenCalledWith(
        "/events/event-123/ticket",
        { requiresAuth: true },
      );
    });
  });
});
