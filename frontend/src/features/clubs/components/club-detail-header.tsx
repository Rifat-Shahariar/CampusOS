import React from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, FileText, Mail, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Club } from "../types";

interface ClubDetailHeaderProps {
  club: Club;
}

export function ClubDetailHeader({ club }: ClubDetailHeaderProps) {
  const eventCount = club._count?.events ?? 0;
  const postCount = club._count?.posts ?? 0;

  return (
    <div className="space-y-6">
      {/* Back to clubs link */}
      <div>
        <Link
          href="/clubs"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          <span>Back to All Clubs</span>
        </Link>
      </div>

      {/* Hero / Cover Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-xs">
        {club.coverImageUrl ? (
          <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={club.coverImageUrl}
              alt={`${club.name} banner`}
              className="size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
          </div>
        ) : (
          <div className="h-32 sm:h-40 w-full bg-linear-to-r from-primary/10 via-primary/5 to-muted/20 border-b border-border/50" />
        )}

        {/* Club Meta Info */}
        <div className="p-6 sm:p-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-12 sm:-mt-16 mb-4">
            {/* Avatar / Logo */}
            <div className="flex size-24 sm:size-28 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-card overflow-hidden shadow-md text-primary font-bold text-2xl">
              {club.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={club.logoUrl}
                  alt={`${club.name} logo`}
                  className="size-full object-cover"
                />
              ) : (
                <Users className="size-12 text-primary" aria-hidden="true" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {club.name}
                </h1>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  Active
                </span>
              </div>

              {club.contactEmail && (
                <a
                  href={`mailto:${club.contactEmail}`}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mt-0.5"
                >
                  <Mail className="size-3.5" aria-hidden="true" />
                  <span>{club.contactEmail}</span>
                </a>
              )}
            </div>
          </div>

          <p className="text-sm text-foreground/85 max-w-3xl leading-relaxed mt-4">
            {club.description}
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-border/60">
            <Card className="p-3.5 bg-muted/20 border-border/60 shadow-none">
              <CardContent className="p-0 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Calendar className="size-4.5" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-lg font-bold text-foreground leading-none block">
                    {eventCount}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    Campus Events
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3.5 bg-muted/20 border-border/60 shadow-none">
              <CardContent className="p-0 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4.5" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-lg font-bold text-foreground leading-none block">
                    {postCount}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    Announcements
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
