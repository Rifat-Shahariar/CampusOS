"use client";

import { useCallback, useEffect, useState } from "react";
import { resourcesApi } from "../api/resources-api";
import type {
  PaginationMeta,
  ResourceItem,
  ResourcesQueryParams,
} from "../types";

export function useResources(initialParams: ResourcesQueryParams = {}) {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: initialParams.page ?? 1,
    limit: initialParams.limit ?? 10,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [params, setParams] = useState<ResourcesQueryParams>(initialParams);

  const fetchResources = useCallback(
    (queryParams: ResourcesQueryParams) => {
      let isCurrent = true;

      resourcesApi
        .getResources(queryParams)
        .then((res) => {
          if (isCurrent) {
            setResources(res.data);
            setMeta(res.meta);
            setError(null);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (isCurrent) {
            setError(err?.message || "Failed to load resources");
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
    return fetchResources(params);
  }, [fetchResources, params]);

  const updateFilters = useCallback(
    (newParams: Partial<ResourcesQueryParams>) => {
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
    fetchResources(params);
  }, [fetchResources, params]);

  return {
    resources,
    meta,
    isLoading,
    error,
    params,
    updateFilters,
    refetch,
  };
}
