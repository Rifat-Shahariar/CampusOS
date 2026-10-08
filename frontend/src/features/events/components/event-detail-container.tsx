"use client";

import { useEventDetail } from "../hooks/use-event-detail";
import { EventDetailView } from "./event-detail-view";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";

export function EventDetailContainer({ eventId }: { eventId: string }) {
  const {
    event,
    isLoading,
    error,
    isActionLoading,
    actionError,
    register,
    cancelRegistration,
    refetch,
  } = useEventDetail(eventId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-muted-foreground animate-pulse">
          Loading event details...
        </p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <ErrorState
        title="Event not found"
        message={
          error ||
          "The requested event could not be found or is currently inactive."
        }
        onRetry={refetch}
      />
    );
  }

  return (
    <EventDetailView
      event={event}
      isActionLoading={isActionLoading}
      actionError={actionError}
      onRegister={register}
      onCancel={cancelRegistration}
    />
  );
}
