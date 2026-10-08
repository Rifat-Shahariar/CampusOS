"use client";

import { useCallback, useEffect, useState } from "react";
import { clubsApi } from "../api/clubs-api";
import type { Club, PaginationMeta } from "../types";

export function useClubs(search?: string, page = 1) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClubs = useCallback(() => {
    setIsLoading(true);
    setError(null);
    return clubsApi
      .getClubs({ search, page })
      .then((response) => {
        setClubs(response.data);
        setMeta(response.meta);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to load campus clubs. Please try again.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [search, page]);

  useEffect(() => {
    let isMounted = true;

    clubsApi
      .getClubs({ search, page })
      .then((response) => {
        if (!isMounted) return;
        setClubs(response.data);
        setMeta(response.meta);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load campus clubs. Please try again.",
        );
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [search, page]);

  return {
    clubs,
    meta,
    isLoading,
    error,
    refetch: fetchClubs,
  };
}
