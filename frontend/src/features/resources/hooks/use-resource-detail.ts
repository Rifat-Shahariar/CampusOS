"use client";

import { useCallback, useEffect, useState } from "react";
import { resourcesApi } from "../api/resources-api";
import type { ResourceDetail } from "../types";

export function useResourceDetail(id: string) {
  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(
    (resourceId: string) => {
      let isCurrent = true;

      resourcesApi
        .getResourceById(resourceId)
        .then((data) => {
          if (isCurrent) {
            setResource(data);
            setError(null);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (isCurrent) {
            setError(err?.message || "Failed to load resource details");
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
    return fetchDetail(id);
  }, [fetchDetail, id]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchDetail(id);
  }, [fetchDetail, id]);

  return { resource, isLoading, error, refetch };
}
