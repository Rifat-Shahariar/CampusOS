import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Download,
  FileCheck,
  FileText,
  GraduationCap,
  Layers,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ResourceDetail } from "../types";
import {
  formatFileSize,
  getFileExtension,
  getResourceTypeBadgeVariant,
  getResourceTypeLabel,
} from "../utils/resource-formatters";

interface ResourceDetailViewProps {
  resource: ResourceDetail;
}

export function ResourceDetailView({ resource }: ResourceDetailViewProps) {
  const extension = getFileExtension(resource.fileName);
  const formattedSize = formatFileSize(resource.fileSize);
  const typeLabel = getResourceTypeLabel(resource.resourceType);
  const badgeVariant = getResourceTypeBadgeVariant(resource.resourceType);

  const formattedDate = new Date(resource.createdAt).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );

  const uploaderName =
    resource.uploader?.fullName ||
    resource.uploader?.name ||
    "Campus Faculty / Admin";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Navigation Bar */}
      <div>
        <Link
          href="/resources"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Resources</span>
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-4">
        {/* Badges & Tags */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={badgeVariant} className="font-semibold text-xs shadow-2xs">
            {typeLabel}
          </Badge>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
            {resource.course.code}
          </span>
          {(resource.batch || resource.section) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-md">
              <Layers className="size-3.5" />
              <span>
                {resource.batch ? `Batch ${resource.batch}` : ""}
                {resource.batch && resource.section ? " • " : ""}
                {resource.section ? `Section ${resource.section}` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Title & Course Info */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {resource.title}
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            {resource.course.name}
            {resource.course.department
              ? ` • ${resource.course.department.name} (${resource.course.department.code})`
              : ""}
          </p>
        </div>

        {/* Metadata Strip */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs text-muted-foreground border-t border-border/60">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-primary" />
            <span>Uploaded {formattedDate}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <User className="size-3.5 text-primary" />
            <span>Shared by {uploaderName}</span>
          </div>

          {resource.course.department && (
            <div className="flex items-center gap-1.5">
              <GraduationCap className="size-3.5 text-primary" />
              <span>{resource.course.department.code}</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Description & File Action Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Description & Course Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Overview & Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-foreground/90 leading-relaxed">
              {resource.description ? (
                <p className="whitespace-pre-line">{resource.description}</p>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No additional description provided for this academic resource.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Download & File Details Card */}
        <div className="space-y-6">
          <Card className="shadow-xs border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileCheck className="size-4 text-primary" />
                <span>File Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {/* File Info Box */}
              <div className="space-y-2 p-3 rounded-lg bg-muted/40 border border-border/60">
                <div className="flex items-start gap-2">
                  <FileText className="size-4 shrink-0 text-primary mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs font-medium text-foreground break-all">
                      {resource.fileName}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span className="font-semibold uppercase bg-background px-1.5 py-0.2 rounded border border-border">
                        {extension}
                      </span>
                      <span>{formattedSize}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                  <span className="font-medium">MIME:</span> {resource.mimeType}
                </div>
              </div>

              {/* Action Button */}
              {resource.fileUrl ? (
                <a
                  href={resource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "default", size: "default" }),
                    "w-full justify-center gap-2 text-xs font-semibold cursor-pointer shadow-sm",
                  )}
                  title="Download / Open resource file"
                >
                  <Download className="size-4" />
                  <span>Download / Open Resource</span>
                </a>
              ) : (
                <div className="p-3 text-center rounded-lg bg-muted text-muted-foreground text-xs">
                  Resource file is temporarily unavailable.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
