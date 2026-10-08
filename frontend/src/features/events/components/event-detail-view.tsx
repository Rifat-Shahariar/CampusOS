"use client";

import Link from "next/link";
import { Compass, Mail, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { EventDetailHeader } from "./event-detail-header";
import { EventRegistrationButton } from "./event-registration-button";
import { cn } from "@/lib/utils";
import type { EventDetail } from "../types";

interface EventDetailViewProps {
  event: EventDetail;
  isActionLoading: boolean;
  actionError: string | null;
  onRegister: () => Promise<unknown>;
  onCancel: () => Promise<unknown>;
}

export function EventDetailView({
  event,
  isActionLoading,
  actionError,
  onRegister,
  onCancel,
}: EventDetailViewProps) {
  const regStartStr = event.registrationStart
    ? new Date(event.registrationStart).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const regEndStr = event.registrationEnd
    ? new Date(event.registrationEnd).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <EventDetailHeader event={event} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Event Description & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold">
                About this Event
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                {event.description}
              </p>
            </CardContent>
          </Card>

          {/* Registration Window Information */}
          {(regStartStr || regEndStr) && (
            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  <span>Registration Window</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs text-muted-foreground">
                {regStartStr && (
                  <div className="flex justify-between items-center py-1">
                    <span>Registration Opens:</span>
                    <span className="font-medium text-foreground">{regStartStr}</span>
                  </div>
                )}
                {regEndStr && (
                  <div className="flex justify-between items-center py-1">
                    <span>Registration Closes:</span>
                    <span className="font-medium text-foreground">{regEndStr}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Hosting Club Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Compass className="size-4 text-primary" />
                <span>Organized by</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                  {event.club.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {event.club.name}
                  </span>
                  {event.club.contactEmail && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="size-3" />
                      {event.club.contactEmail}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/clubs/${event.club.slug || event.club.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "w-full text-xs cursor-pointer",
                  )}
                >
                  View Club Profile & Announcements
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Registration Card */}
        <div className="space-y-6">
          <Card className="sticky top-20 border-primary/20 shadow-md">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold">
                Event Pass & Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-1.5 pb-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Availability:</span>
                  <span className="font-medium text-foreground">
                    {event.isFull ? (
                      <span className="text-destructive font-semibold">Full</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Available
                      </span>
                    )}
                  </span>
                </div>

                {event.maxAttendees !== null && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="font-medium text-foreground">
                      {event.currentAttendeesCount} / {event.maxAttendees} spots
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Entry Type:</span>
                  <span className="font-medium text-foreground">
                    {event.isRegistrationRequired
                      ? "Ticket Required"
                      : "Open Walk-in (RSVP)"}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/80">
                <EventRegistrationButton
                  event={event}
                  isActionLoading={isActionLoading}
                  actionError={actionError}
                  onRegister={onRegister}
                  onCancel={onCancel}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
