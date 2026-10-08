import Link from "next/link";
import { Download, FileText, Layers } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ResourceItem } from "../types";
import {
  formatFileSize,
  getFileExtension,
  getResourceTypeBadgeVariant,
  getResourceTypeLabel,
} from "../utils/resource-formatters";

interface ResourceCardProps {
  resource: ResourceItem;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const extension = getFileExtension(resource.fileName);
  const formattedSize = formatFileSize(resource.fileSize);
  const typeLabel = getResourceTypeLabel(resource.resourceType);
  const badgeVariant = getResourceTypeBadgeVariant(resource.resourceType);

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:border-primary/50 transition-all duration-200 shadow-xs">
      <CardHeader className="space-y-2 pb-2">
        {/* Category & Course Tag Row */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={badgeVariant} className="font-semibold text-[11px] shadow-2xs">
              {typeLabel}
            </Badge>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              {resource.course.code}
            </span>
          </div>

          {(resource.batch || resource.section) && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
              <Layers className="size-3 text-muted-foreground" />
              <span>
                {resource.batch ? `Batch ${resource.batch}` : ""}
                {resource.batch && resource.section ? " • " : ""}
                {resource.section ? `Sec ${resource.section}` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <CardTitle className="text-base sm:text-lg line-clamp-2 leading-snug pt-1">
          <Link
            href={`/resources/${resource.id}`}
            className="hover:text-primary transition-colors focus-visible:underline outline-none"
          >
            {resource.title}
          </Link>
        </CardTitle>

        {/* Course Name */}
        <p className="text-xs font-medium text-muted-foreground line-clamp-1">
          {resource.course.name}
          {resource.course.department ? ` (${resource.course.department.code})` : ""}
        </p>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-4">
        {/* Description */}
        {resource.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {resource.description}
          </p>
        )}

        {/* File Meta Information Box */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
            <FileText className="size-4 shrink-0 text-primary" />
            <span className="truncate font-mono text-[11px] text-foreground">
              {resource.fileName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-semibold text-[10px] uppercase bg-background px-1.5 py-0.5 rounded border border-border">
              {extension}
            </span>
            <span className="text-[11px]">{formattedSize}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t border-border/60 flex items-center gap-2">
        <Link
          href={`/resources/${resource.id}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "flex-1 justify-center text-xs font-medium cursor-pointer",
          )}
        >
          View Details
        </Link>

        {resource.fileUrl ? (
          <a
            href={resource.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "gap-1 text-xs font-medium cursor-pointer shadow-2xs",
            )}
            title="Download or open resource file in new tab"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Open</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "opacity-50 cursor-not-allowed text-xs",
            )}
          >
            Unavailable
          </button>
        )}
      </CardFooter>
    </Card>
  );
}
