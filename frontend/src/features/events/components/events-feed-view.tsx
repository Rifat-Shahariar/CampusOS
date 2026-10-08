"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Ticket } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/features/auth";
import { useEvents } from "../hooks/use-events";
import { EventFilters } from "./event-filters";
import { EventList } from "./event-list";
import { cn } from "@/lib/utils";

export function EventsFeedView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const search = searchParams.get("search") || undefined;
  const eventType = searchParams.get("eventType") || undefined;
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const { events, meta, isLoading, error, refetch } = useEvents({
    search,
    eventType,
    page,
    limit: 9,
  });

  const handleFilterChange = (filters: {
    search?: string;
    eventType?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters.search) {
      params.set("search", filters.search);
    }
    if (filters.eventType) {
      params.set("eventType", filters.eventType);
    }
    params.set("page", "1");
    router.push(`/events?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/events?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Campus Events & Workshops
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Discover hackathons, seminars, tech talks, and cultural festivals hosted by university clubs.
          </p>
        </div>

        {user && user.role === "STUDENT" && (
          <div className="shrink-0">
            <Link
              href="/events/my-registrations"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5 text-xs font-medium cursor-pointer shadow-2xs",
              )}
            >
              <Ticket className="size-3.5 text-primary" />
              <span>My Registrations</span>
            </Link>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <EventFilters
        initialSearch={search}
        selectedCategory={eventType}
        onFilterChange={handleFilterChange}
      />

      {/* Event Grid & Pagination */}
      <EventList
        events={events}
        meta={meta}
        isLoading={isLoading}
        error={error}
        onPageChange={handlePageChange}
        onRetry={refetch}
      />
    </div>
  );
}
