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

  const [overrides, setOverrides] = useState<Partial<ResourcesQueryParams>>({});
  const [prevInitialParams, setPrevInitialParams] = useState(initialParams);

  const hasInitialParamsChanged =
    initialParams.search !== prevInitialParams.search ||
    initialParams.courseId !== prevInitialParams.courseId ||
    initialParams.resourceType !== prevInitialParams.resourceType ||
    initialParams.type !== prevInitialParams.type ||
    initialParams.batch !== prevInitialParams.batch ||
    initialParams.section !== prevInitialParams.section ||
    initialParams.semester !== prevInitialParams.semester ||
    initialParams.page !== prevInitialParams.page ||
    initialParams.limit !== prevInitialParams.limit;

  if (hasInitialParamsChanged) {
    setPrevInitialParams(initialParams);
    setOverrides({});
  }

  const params: ResourcesQueryParams = {
    ...initialParams,
    ...overrides,
  };

  const { search, courseId, resourceType, type, batch, section, semester, page, limit } = params;

  useEffect(() => {
    let isCurrent = true;

    resourcesApi
      .getResources({ search, courseId, resourceType, type, batch, section, semester, page, limit })
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
  }, [search, courseId, resourceType, type, batch, section, semester, page, limit]);

  const updateFilters = useCallback(
    (newParams: Partial<ResourcesQueryParams>) => {
      setIsLoading(true);
      setOverrides((prev) => ({
        ...prev,
        ...newParams,
        page: newParams.page !== undefined ? newParams.page : 1,
      }));
    },
    [],
  );

  const refetch = useCallback(() => {
    setIsLoading(true);
    resourcesApi
      .getResources({ search, courseId, resourceType, type, batch, section, semester, page, limit })
      .then((res) => {
        setResources(res.data);
        setMeta(res.meta);
        setError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err?.message || "Failed to load resources");
        setIsLoading(false);
      });
  }, [search, courseId, resourceType, type, batch, section, semester, page, limit]);

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
