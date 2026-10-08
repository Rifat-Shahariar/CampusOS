"use client";

import { useCallback, useEffect, useState } from "react";
import { clubsApi } from "../api/clubs-api";
import type { ClubPost, PaginationMeta } from "../types";

export function useClubPosts(clubId: string, page = 1) {
  const [posts, setPosts] = useState<ClubPost[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(() => {
    if (!clubId) return Promise.resolve();
    setIsLoading(true);
    setError(null);
    return clubsApi
      .getClubPosts(clubId, { page })
      .then((response) => {
        setPosts(response.data);
        setMeta(response.meta);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to load club posts.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [clubId, page]);

  useEffect(() => {
    let isMounted = true;

    if (!clubId) return;

    clubsApi
      .getClubPosts(clubId, { page })
      .then((response) => {
        if (!isMounted) return;
        setPosts(response.data);
        setMeta(response.meta);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load club posts.",
        );
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [clubId, page]);

  return {
    posts,
    meta,
    isLoading,
    error,
    refetch: fetchPosts,
  };
}
