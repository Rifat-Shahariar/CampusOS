import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "../types";

interface EventPaginationProps {
  meta: PaginationMeta;
  onPageChange: (newPage: number) => void;
}

export function EventPagination({
  meta,
  onPageChange,
}: EventPaginationProps) {
  const { page, totalPages, total } = meta;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-border text-xs text-muted-foreground"
      aria-label="Events list pagination"
    >
      <div>
        Showing page{" "}
        <span className="font-semibold text-foreground">{page}</span> of{" "}
        <span className="font-semibold text-foreground">{totalPages}</span> (
        {total} total {total === 1 ? "event" : "events"})
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Go to previous page"
          className="h-8 gap-1 text-xs cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
          <span>Previous</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Go to next page"
          className="h-8 gap-1 text-xs cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Next</span>
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
