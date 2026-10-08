"use client";

import { useEffect, useState, useCallback } from "react";
import { eventsApi } from "../api/events-api";
import type { EventDetail } from "../types";

export function useEventDetail(eventIdOrSlug: string) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDetail = useCallback(
    (id: string) => {
      let isCurrent = true;

      eventsApi
        .getEventById(id)
        .then((data) => {
          if (isCurrent) {
            setEvent(data);
            setError(null);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (isCurrent) {
            setError(err?.message || "Failed to load event details");
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
    return fetchDetail(eventIdOrSlug);
  }, [fetchDetail, eventIdOrSlug]);

  const register = useCallback(async () => {
    if (!event) return;
    setIsActionLoading(true);
    setActionError(null);
    try {
      const res = await eventsApi.register(event.id);
      // Refresh event detail state
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              isUserRegistered: true,
              userRegistrationStatus: "REGISTERED",
              userRegistrationCode: res.registration.registrationCode,
              currentAttendeesCount: prev.currentAttendeesCount + 1,
            }
          : null,
      );
      return res;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to register for event";
      setActionError(msg);
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  }, [event]);

  const cancelRegistration = useCallback(async () => {
    if (!event) return;
    setIsActionLoading(true);
    setActionError(null);
    try {
      const res = await eventsApi.cancelRegistration(event.id);
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              isUserRegistered: false,
              userRegistrationStatus: "CANCELLED",
              userRegistrationCode: null,
              currentAttendeesCount: Math.max(0, prev.currentAttendeesCount - 1),
            }
          : null,
      );
      return res;
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to cancel event registration";
      setActionError(msg);
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  }, [event]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchDetail(eventIdOrSlug);
  }, [fetchDetail, eventIdOrSlug]);

  return {
    event,
    isLoading,
    error,
    isActionLoading,
    actionError,
    register,
    cancelRegistration,
    refetch,
  };
}
