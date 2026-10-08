"use client";

import Link from "next/link";
import { Calendar, MapPin, QrCode, Ticket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { EventPagination } from "./event-pagination";
import { cn } from "@/lib/utils";
import type { PaginationMeta, StudentRegistrationItem } from "../types";

interface MyRegistrationsListProps {
  registrations: StudentRegistrationItem[];
  meta: PaginationMeta;
  isLoading: boolean;
  error: string | null;
  onPageChange: (newPage: number) => void;
  onRetry: () => void;
}

export function MyRegistrationsList({
  registrations,
  meta,
  isLoading,
  error,
  onPageChange,
  onRetry,
}: MyRegistrationsListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-muted-foreground animate-pulse">
          Loading your registrations...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load registrations"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (registrations.length === 0) {
    return (
      <EmptyState
        icon={<Ticket className="size-8" />}
        title="No registrations yet"
        description="You have not registered for any events yet. Explore upcoming campus events to reserve your spot."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {registrations.map((item) => {
          const startDate = new Date(item.event.startTime).toLocaleDateString(
            undefined,
            {
              month: "short",
              day: "numeric",
              year: "numeric",
            },
          );
          const startTime = new Date(item.event.startTime).toLocaleTimeString(
            undefined,
            {
              hour: "2-digit",
              minute: "2-digit",
            },
          );

          const isCancelled = item.status === "CANCELLED";
          const isAttended = item.status === "ATTENDED";

          return (
            <Card
              key={item.id}
              className={`overflow-hidden transition-all duration-200 ${
                isCancelled
                  ? "opacity-60 bg-muted/20 border-border"
                  : "hover:border-primary/40 shadow-xs"
              }`}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-primary">
                        {item.event.club.name}
                      </span>
                      {item.status === "REGISTERED" && (
                        <Badge variant="success">Confirmed</Badge>
                      )}
                      {isAttended && (
                        <Badge variant="secondary">Attended</Badge>
                      )}
                      {isCancelled && (
                        <Badge variant="destructive">Cancelled</Badge>
                      )}
                      <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                        {item.registrationCode}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold leading-tight text-foreground truncate">
                      <Link
                        href={`/events/${item.event.id}`}
                        className="hover:underline"
                      >
                        {item.event.title}
                      </Link>
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-primary shrink-0" />
                        <span>
                          {startDate} at {startTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-primary shrink-0" />
                        <span className="truncate">{item.event.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                    {!isCancelled && (
                      <Link
                        href={`/events/${item.event.id}/ticket`}
                        className={cn(
                          buttonVariants({ variant: "default", size: "sm" }),
                          "gap-1.5 text-xs font-medium w-full sm:w-auto cursor-pointer shadow-xs",
                        )}
                      >
                        <QrCode className="size-3.5" />
                        <span>View Ticket</span>
                      </Link>
                    )}
                    <Link
                      href={`/events/${item.event.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "text-xs font-medium w-full sm:w-auto cursor-pointer",
                      )}
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <EventPagination meta={meta} onPageChange={onPageChange} />
    </div>
  );
}
