"use client";

import { Calendar } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { EventCard } from "./event-card";
import { EventPagination } from "./event-pagination";
import type { EventItem, PaginationMeta } from "../types";

interface EventListProps {
  events: EventItem[];
  meta: PaginationMeta;
  isLoading: boolean;
  error: string | null;
  onPageChange: (newPage: number) => void;
  onRetry: () => void;
}

export function EventList({
  events,
  meta,
  isLoading,
  error,
  onPageChange,
  onRetry,
}: EventListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-muted-foreground animate-pulse">
          Loading campus events...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load events"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="size-8" />}
        title="No events found"
        description="There are currently no events matching your criteria. Try adjusting your search or category filters."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      <EventPagination meta={meta} onPageChange={onPageChange} />
    </div>
  );
}
