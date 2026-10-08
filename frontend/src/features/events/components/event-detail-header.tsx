import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Users, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EventDetail } from "../types";

interface EventDetailHeaderProps {
  event: EventDetail;
}

export function EventDetailHeader({ event }: EventDetailHeaderProps) {
  const startDate = new Date(event.startTime).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const startTime = new Date(event.startTime).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = new Date(event.endTime).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link
          href="/events"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer -ml-2",
          )}
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Events Feed</span>
        </Link>
      </div>

      {/* Main Banner / Cover */}
      <div className="relative h-48 sm:h-64 md:h-80 w-full rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5 to-muted border border-border shadow-xs">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-8 text-center">
            <span className="text-4xl md:text-5xl font-black text-primary/15 tracking-widest uppercase select-none">
              {event.eventType}
            </span>
          </div>
        )}

        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs font-semibold shadow-xs">
            {event.eventType}
          </Badge>
          {event.isFull && (
            <Badge variant="destructive" className="text-xs font-semibold shadow-xs">
              Full Capacity
            </Badge>
          )}
          {event.isRegistrationOpen && !event.isFull && (
            <Badge variant="success" className="text-xs font-semibold shadow-xs">
              Registration Open
            </Badge>
          )}
        </div>
      </div>

      {/* Title & Host info */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/clubs/${event.club.slug || event.club.id}`}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <Compass className="size-3.5" />
            <span>Hosted by {event.club.name}</span>
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {event.title}
        </h1>

        {/* Quick Details Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-2xs">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Calendar className="size-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Date & Time
              </span>
              <span className="text-xs font-semibold text-foreground truncate">
                {startDate}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {startTime} – {endTime}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-2xs">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <MapPin className="size-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Location
              </span>
              <span className="text-xs font-semibold text-foreground truncate">
                {event.location}
              </span>
              <span className="text-[11px] text-muted-foreground">
                In-Person Campus
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-2xs">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Users className="size-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Attendance
              </span>
              <span className="text-xs font-semibold text-foreground">
                {event.currentAttendeesCount} registered
              </span>
              <span className="text-[11px] text-muted-foreground">
                {event.maxAttendees !== null
                  ? `Limit: ${event.maxAttendees} attendees`
                  : "Open capacity"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
