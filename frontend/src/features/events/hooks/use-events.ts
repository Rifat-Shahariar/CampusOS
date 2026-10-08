"use client";

import { useEffect, useState, useCallback } from "react";
import { eventsApi } from "../api/events-api";
import type {
  EventItem,
  EventsQueryParams,
  PaginationMeta,
} from "../types";

export function useEvents(initialParams: EventsQueryParams = {}) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: initialParams.page ?? 1,
    limit: initialParams.limit ?? 10,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [params, setParams] = useState<EventsQueryParams>(initialParams);

  const fetchEvents = useCallback(
    (queryParams: EventsQueryParams) => {
      let isCurrent = true;

      eventsApi
        .getEvents(queryParams)
        .then((res) => {
          if (isCurrent) {
            setEvents(res.data);
            setMeta(res.meta);
            setError(null);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (isCurrent) {
            setError(err?.message || "Failed to load events");
            setIsLoading(false);
          }
        });

      return () => {
        isCurrent = false;
      };
    },
    [],
  );

  useEffect(() => {
    return fetchEvents(params);
  }, [fetchEvents, params]);

  const updateFilters = useCallback((newParams: Partial<EventsQueryParams>) => {
    setIsLoading(true);
    setParams((prev) => ({
      ...prev,
      ...newParams,
      // Reset to page 1 on filter/search change unless page is explicitly changed
      page: newParams.page !== undefined ? newParams.page : 1,
    }));
  }, []);

  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchEvents(params);
  }, [fetchEvents, params]);

  return {
    events,
    meta,
    isLoading,
    error,
    params,
    updateFilters,
    refetch,
  };
}
