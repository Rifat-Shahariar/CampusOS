import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useEvents } from "./use-events";
import { eventsApi } from "../api/events-api";

describe("useEvents hook", () => {
  const mockEventsResponse = {
    data: [
      {
        id: "e-1",
        title: "Campus Hackathon 2026",
        slug: "campus-hackathon-2026",
        description: "Build sprint",
        coverImageUrl: null,
        eventType: "Hackathon",
        location: "Hall A",
        startTime: "2026-11-10T10:00:00Z",
        endTime: "2026-11-12T18:00:00Z",
        registrationStart: "2026-10-01T00:00:00Z",
        registrationEnd: "2026-11-09T23:59:59Z",
        maxAttendees: 80,
        isRegistrationRequired: true,
        isActive: true,
        club: { id: "c-1", name: "Computer Club", slug: "computer-club", logoUrl: null },
        currentAttendeesCount: 20,
        isFull: false,
        isRegistrationOpen: true,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
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

  it("fetches events on initial mount", async () => {
    const getEventsSpy = vi.spyOn(eventsApi, "getEvents").mockResolvedValue(mockEventsResponse);

    const { result } = renderHook(() => useEvents({ limit: 10 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getEventsSpy).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].title).toBe("Campus Hackathon 2026");
  });

  it("applies search term correctly when initialParams changes", async () => {
    const getEventsSpy = vi.spyOn(eventsApi, "getEvents").mockResolvedValue(mockEventsResponse);

    let params = { search: undefined as string | undefined, eventType: undefined as string | undefined };
    const { result, rerender } = renderHook(() => useEvents(params));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getEventsSpy).toHaveBeenCalledWith(expect.objectContaining({ search: undefined }));

    // User submits search term (URL updates in feed view)
    params = { search: "Hackathon", eventType: undefined };
    rerender();

    await waitFor(() => {
      expect(getEventsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Hackathon", eventType: undefined }),
      );
    });
  });

  it("applies category filter correctly when initialParams changes", async () => {
    const getEventsSpy = vi.spyOn(eventsApi, "getEvents").mockResolvedValue(mockEventsResponse);

    let params = { search: undefined as string | undefined, eventType: undefined as string | undefined };
    const { result, rerender } = renderHook(() => useEvents(params));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // User clicks Category pill
    params = { search: undefined, eventType: "Workshop" };
    rerender();

    await waitFor(() => {
      expect(getEventsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: "Workshop" }),
      );
    });
  });

  it("applies search and category filter combination simultaneously", async () => {
    const getEventsSpy = vi.spyOn(eventsApi, "getEvents").mockResolvedValue(mockEventsResponse);

    const params = { search: "Git", eventType: "Workshop" };
    const { result } = renderHook(() => useEvents(params));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getEventsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "Git",
        eventType: "Workshop",
      }),
    );
  });

  it("resets page and updates filters using updateFilters", async () => {
    const getEventsSpy = vi.spyOn(eventsApi, "getEvents").mockResolvedValue(mockEventsResponse);

    const { result } = renderHook(() => useEvents({ page: 2 }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.updateFilters({ search: "seminar" });
    });

    await waitFor(() => {
      expect(getEventsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ search: "seminar", page: 1 }),
      );
    });
  });
});
