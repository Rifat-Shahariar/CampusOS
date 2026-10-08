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

  const [overrides, setOverrides] = useState<Partial<EventsQueryParams>>({});
  const [prevInitialParams, setPrevInitialParams] = useState(initialParams);

  const hasInitialParamsChanged =
    initialParams.search !== prevInitialParams.search ||
    initialParams.eventType !== prevInitialParams.eventType ||
    initialParams.clubId !== prevInitialParams.clubId ||
    initialParams.clubSlug !== prevInitialParams.clubSlug ||
    initialParams.startDate !== prevInitialParams.startDate ||
    initialParams.endDate !== prevInitialParams.endDate ||
    initialParams.page !== prevInitialParams.page ||
    initialParams.limit !== prevInitialParams.limit;

  if (hasInitialParamsChanged) {
    setPrevInitialParams(initialParams);
    setOverrides({});
  }

  const params: EventsQueryParams = {
    ...initialParams,
    ...overrides,
  };

  const { search, eventType, clubId, clubSlug, startDate, endDate, page, limit } = params;

  useEffect(() => {
    let isCurrent = true;

    eventsApi
      .getEvents({ search, eventType, clubId, clubSlug, startDate, endDate, page, limit })
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
  }, [search, eventType, clubId, clubSlug, startDate, endDate, page, limit]);

  const updateFilters = useCallback((newParams: Partial<EventsQueryParams>) => {
    setIsLoading(true);
    setOverrides((prev) => ({
      ...prev,
      ...newParams,
      // Reset to page 1 on filter/search change unless page is explicitly changed
      page: newParams.page !== undefined ? newParams.page : 1,
    }));
  }, []);

  const refetch = useCallback(() => {
    setIsLoading(true);
    eventsApi
      .getEvents({ search, eventType, clubId, clubSlug, startDate, endDate, page, limit })
      .then((res) => {
        setEvents(res.data);
        setMeta(res.meta);
        setError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err?.message || "Failed to load events");
        setIsLoading(false);
      });
  }, [search, eventType, clubId, clubSlug, startDate, endDate, page, limit]);

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
