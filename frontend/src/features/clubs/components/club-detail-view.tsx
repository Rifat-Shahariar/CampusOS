"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/spinner";
import { useClubDetail } from "../hooks/use-club-detail";
import { ClubDetailHeader } from "./club-detail-header";
import { ClubPostsList } from "./club-posts-list";

interface ClubDetailViewProps {
  clubId: string;
}

export function ClubDetailView({ clubId }: ClubDetailViewProps) {
  const { club, isLoading, error, isNotFound, refetch } = useClubDetail(clubId);

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingState message="Loading club details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorState
          title="Failed to Load Club"
          message={error}
          onRetry={refetch}
        />
      </div>
    );
  }

  if (isNotFound || !club) {
    return (
      <div className="py-16 space-y-4">
        <EmptyState
          icon={<Users className="size-10 text-muted-foreground" aria-hidden="true" />}
          title="Club Not Found"
          description="The requested club does not exist or is currently inactive."
          action={
            <Link href="/clubs">
              <Button size="sm" variant="outline" className="text-xs cursor-pointer gap-1.5">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                <span>Return to Clubs</span>
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Club Hero and Info Header */}
      <ClubDetailHeader club={club} />

      {/* Announcements / Posts Section */}
      <section aria-labelledby="announcements-heading" className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div>
            <h2
              id="announcements-heading"
              className="text-lg sm:text-xl font-bold tracking-tight text-foreground"
            >
              Announcements & Updates
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Latest news, notices, and activity updates published by {club.name}.
            </p>
          </div>
        </div>

        <ClubPostsList clubId={club.id} />
      </section>
    </div>
  );
}
