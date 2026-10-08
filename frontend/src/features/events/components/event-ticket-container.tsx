"use client";

import Link from "next/link";
import { ArrowLeft, Ticket } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { useAuth } from "@/features/auth";
import { useEventTicket } from "../hooks/use-event-ticket";
import { EventTicketView } from "./event-ticket-view";
import { cn } from "@/lib/utils";

export function EventTicketContainer({ eventId }: { eventId: string }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { ticket, qrDataUrl, isLoading, error, refetch } =
    useEventTicket(eventId);

  if (!isAuthLoading && !user) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
          <Ticket className="size-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Sign In to Access Ticket
        </h2>
        <p className="text-sm text-muted-foreground">
          You must be logged in as the ticket owner to view this event pass.
        </p>
        <Link
          href={`/login?redirect=/events/${eventId}/ticket`}
          className={cn(buttonVariants({ variant: "default" }), "cursor-pointer")}
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-muted-foreground animate-pulse">
          Generating your event QR ticket...
        </p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto space-y-4 py-8">
        <ErrorState
          title="Ticket Unavailable"
          message={
            error ||
            "Unable to find an active registration pass for this event."
          }
          onRetry={refetch}
        />
        <div className="text-center">
          <Link
            href={`/events/${eventId}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 cursor-pointer text-xs",
            )}
          >
            <ArrowLeft className="size-3.5" />
            <span>Return to Event Details</span>
          </Link>
        </div>
      </div>
    );
  }

  return <EventTicketView ticket={ticket} qrDataUrl={qrDataUrl} />;
}
