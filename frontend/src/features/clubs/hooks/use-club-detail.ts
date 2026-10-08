"use client";

import { useCallback, useEffect, useState } from "react";
import { clubsApi } from "../api/clubs-api";
import type { Club } from "../types";

export function useClubDetail(id: string) {
  const [club, setClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const fetchClub = useCallback(() => {
    if (!id) return Promise.resolve();
    setIsLoading(true);
    setError(null);
    setIsNotFound(false);
    return clubsApi
      .getClubById(id)
      .then((data) => {
        setClub(data);
      })
      .catch((err: unknown) => {
        if (
          typeof err === "object" &&
          err !== null &&
          "statusCode" in err &&
          (err as { statusCode: number }).statusCode === 404
        ) {
          setIsNotFound(true);
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to load club details. Please try again.",
          );
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    if (!id) return;

    clubsApi
      .getClubById(id)
      .then((data) => {
        if (!isMounted) return;
        setClub(data);
        setError(null);
        setIsNotFound(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        if (
          typeof err === "object" &&
          err !== null &&
          "statusCode" in err &&
          (err as { statusCode: number }).statusCode === 404
        ) {
          setIsNotFound(true);
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to load club details. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  return {
    club,
    isLoading,
    error,
    isNotFound,
    refetch: fetchClub,
  };
}
