"use client";

import React, { useState } from "react";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/spinner";
import { useClubPosts } from "../hooks/use-club-posts";
import { ClubPostCard } from "./club-post-card";
import { ClubPagination } from "./club-pagination";

interface ClubPostsListProps {
  clubId: string;
}

export function ClubPostsList({ clubId }: ClubPostsListProps) {
  const [page, setPage] = useState(1);
  const { posts, meta, isLoading, error, refetch } = useClubPosts(clubId, page);

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading club announcements..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <ErrorState
          title="Failed to Load Announcements"
          message={error}
          onRetry={refetch}
        />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          icon={<FileText className="size-8 text-muted-foreground" aria-hidden="true" />}
          title="No announcements yet"
          description="This club has not published any notices or announcements yet. Check back soon!"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {posts.map((post) => (
          <ClubPostCard key={post.id} post={post} />
        ))}
      </div>

      <ClubPagination meta={meta} onPageChange={setPage} />
    </div>
  );
}
