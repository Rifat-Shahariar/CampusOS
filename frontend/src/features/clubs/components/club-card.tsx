import React from "react";
import Link from "next/link";
import { Calendar, FileText, Mail, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Club } from "../types";

interface ClubCardProps {
  club: Club;
}

export function ClubCard({ club }: ClubCardProps) {
  const eventCount = club._count?.events ?? 0;
  const postCount = club._count?.posts ?? 0;

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/40 group">
      {/* Optional Cover Banner */}
      {club.coverImageUrl && (
        <div className="relative h-32 w-full overflow-hidden bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={club.coverImageUrl}
            alt={`${club.name} cover`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      <CardHeader className="flex flex-row items-start gap-3.5 p-5 pb-3">
        {/* Club Logo / Avatar Icon */}
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/60 overflow-hidden text-primary font-bold text-base shadow-2xs">
          {club.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={club.logoUrl}
              alt={`${club.name} logo`}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <Users className="size-6 text-primary/80" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <CardTitle className="text-base font-semibold leading-snug truncate group-hover:text-primary transition-colors">
            <Link
              href={`/clubs/${club.id}`}
              className="focus-visible:outline-none focus-visible:underline"
              aria-label={`View details for ${club.name}`}
            >
              {club.name}
            </Link>
          </CardTitle>
          {club.contactEmail && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 truncate">
              <Mail className="size-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{club.contactEmail}</span>
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 px-5 py-2">
        <CardDescription className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
          {club.description}
        </CardDescription>
      </CardContent>

      <CardFooter className="flex items-center justify-between px-5 py-3 border-t border-border/60 bg-muted/15 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span
            className="flex items-center gap-1"
            title={`${eventCount} campus events`}
          >
            <Calendar className="size-3.5 text-primary/70" aria-hidden="true" />
            <span>
              {eventCount} {eventCount === 1 ? "Event" : "Events"}
            </span>
          </span>
          <span
            className="flex items-center gap-1"
            title={`${postCount} announcements`}
          >
            <FileText className="size-3.5 text-primary/70" aria-hidden="true" />
            <span>
              {postCount} {postCount === 1 ? "Post" : "Posts"}
            </span>
          </span>
        </div>

        <Link
          href={`/clubs/${club.id}`}
          className="font-medium text-primary hover:underline text-xs inline-flex items-center gap-1"
        >
          <span>Explore</span>
          <span aria-hidden="true">→</span>
        </Link>
      </CardFooter>
    </Card>
  );
}
