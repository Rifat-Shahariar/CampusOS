"use client";

import { useEffect, useState, useCallback } from "react";
import { eventsApi } from "../api/events-api";
import type {
  MyRegistrationsQueryParams,
  PaginationMeta,
  StudentRegistrationItem,
} from "../types";

export function useMyRegistrations(initialParams: MyRegistrationsQueryParams = {}) {
  const [registrations, setRegistrations] = useState<StudentRegistrationItem[]>(
    [],
  );
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: initialParams.page ?? 1,
    limit: initialParams.limit ?? 10,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] =
    useState<MyRegistrationsQueryParams>(initialParams);

  const fetchRegistrations = useCallback(
    (queryParams: MyRegistrationsQueryParams) => {
      let isCurrent = true;

      eventsApi
        .getMyRegistrations(queryParams)
        .then((res) => {
          if (isCurrent) {
            setRegistrations(res.data);
            setMeta(res.meta);
            setError(null);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (isCurrent) {
            setError(err?.message || "Failed to load registrations");
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
    return fetchRegistrations(params);
  }, [fetchRegistrations, params]);

  const updateFilters = useCallback(
    (newParams: Partial<MyRegistrationsQueryParams>) => {
      setIsLoading(true);
      setParams((prev) => ({
        ...prev,
        ...newParams,
        page: newParams.page !== undefined ? newParams.page : 1,
      }));
    },
    [],
  );

  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchRegistrations(params);
  }, [fetchRegistrations, params]);

  return {
    registrations,
    meta,
    isLoading,
    error,
    params,
    updateFilters,
    refetch,
  };
}
