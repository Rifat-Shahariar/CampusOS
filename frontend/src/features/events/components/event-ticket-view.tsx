"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Printer,
  Compass,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { EventTicket } from "../types";

interface EventTicketViewProps {
  ticket: EventTicket;
  qrDataUrl: string | null;
}

export function EventTicketView({
  ticket,
  qrDataUrl,
}: EventTicketViewProps) {
  const { event, attendee } = ticket;

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

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Back & Action Buttons (Hidden when printing) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/events/${event.id}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer -ml-2",
          )}
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Event</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <Printer className="size-3.5" />
            <span>Print Pass</span>
          </Button>
        </div>
      </div>

      {/* Styled Event Ticket Pass */}
      <Card className="overflow-hidden border-2 border-border shadow-md bg-card print:shadow-none print:border">
        {/* Ticket Header Banner */}
        <div className="bg-primary px-6 py-4 text-primary-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            <span className="font-bold tracking-tight text-sm uppercase">
              CampusOS Official Ticket Pass
            </span>
          </div>
          <Badge
            variant="secondary"
            className="text-[11px] font-semibold bg-white/20 text-white border-none"
          >
            {ticket.status}
          </Badge>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Event Overview */}
          <div className="space-y-2 border-b border-border pb-5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Compass className="size-3.5 text-primary" />
              <span>{event.club.name}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {event.title}
            </h1>

            <div className="space-y-1.5 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="size-3.5 text-primary shrink-0" />
                <span>
                  {startDate} ({startTime} – {endTime})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-3.5 text-primary shrink-0" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>

          {/* QR Code Presentation */}
          <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-2xl border border-border/80 space-y-3">
            {qrDataUrl ? (
              <div className="bg-white p-3 rounded-xl shadow-xs border border-border">
                <img
                  src={qrDataUrl}
                  alt={`QR Ticket for ${event.title}`}
                  className="size-48 sm:size-56 object-contain"
                />
              </div>
            ) : (
              <div className="size-48 flex items-center justify-center bg-muted rounded-xl animate-pulse text-xs text-muted-foreground">
                Generating QR code...
              </div>
            )}

            <div className="text-center space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Registration Code
              </p>
              <p className="text-base font-mono font-bold tracking-widest text-foreground">
                {ticket.registrationCode}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Present this code or QR pass at the entrance scanner for check-in.
              </p>
            </div>
          </div>

          {/* Attendee Details */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>Attendee Information</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-medium">
                  Student Name
                </span>
                <p className="font-semibold text-foreground">{attendee.name}</p>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-medium">
                  Student ID
                </span>
                <p className="font-mono text-foreground">
                  {attendee.studentId || "N/A"}
                </p>
              </div>

              <div className="col-span-2">
                <span className="text-[10px] text-muted-foreground uppercase font-medium">
                  Email
                </span>
                <p className="text-muted-foreground truncate">{attendee.email}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
