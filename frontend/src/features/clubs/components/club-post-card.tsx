import React from "react";
import { Calendar, User as UserIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ClubPost } from "../types";

interface ClubPostCardProps {
  post: ClubPost;
}

export function ClubPostCard({ post }: ClubPostCardProps) {
  const displayDate = post.publishedAt || post.createdAt;
  const formattedDate = new Date(displayDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="overflow-hidden border border-border/70 shadow-2xs">
      {post.coverImageUrl && (
        <div className="relative h-44 w-full overflow-hidden bg-muted/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImageUrl}
            alt={`${post.title} banner`}
            className="size-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <CardHeader className="p-5 pb-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-primary/70" aria-hidden="true" />
            <time dateTime={displayDate}>{formattedDate}</time>
          </span>

          <span className="flex items-center gap-1.5 font-medium text-foreground/80">
            <UserIcon className="size-3.5 text-primary/70" aria-hidden="true" />
            <span>{post.createdByUser?.name || "Club Administrator"}</span>
          </span>
        </div>

        <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
          {post.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5 pt-0">
        <CardDescription className="text-sm text-foreground/85 whitespace-pre-line leading-relaxed">
          {post.content}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
