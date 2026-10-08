import type { ResourceType } from "../types";

/**
 * Format bytes into human-readable string (KB, MB, GB).
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const unitIndex = Math.min(i, units.length - 1);
  const size = bytes / Math.pow(1024, unitIndex);
  return `${size >= 10 || unitIndex === 0 ? Math.round(size) : size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Human-friendly display label for ResourceType enum.
 */
export function getResourceTypeLabel(type: ResourceType): string {
  switch (type) {
    case "NOTE":
      return "Lecture Note";
    case "QUESTION_PAPER":
      return "Question Paper";
    case "LAB_MANUAL":
      return "Lab Manual";
    case "NOTICE":
      return "Official Notice";
    case "OTHER":
      return "Reference Material";
    default:
      return type;
  }
}

/**
 * Badge style variant matching category visual weight.
 */
export function getResourceTypeBadgeVariant(
  type: ResourceType,
): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "NOTE":
      return "default";
    case "QUESTION_PAPER":
      return "secondary";
    case "LAB_MANUAL":
      return "outline";
    case "NOTICE":
      return "destructive";
    case "OTHER":
      return "outline";
    default:
      return "secondary";
  }
}

/**
 * Extracts uppercase file extension from fileName (e.g. "pdf", "docx").
 */
export function getFileExtension(fileName: string): string {
  if (!fileName) return "FILE";
  const parts = fileName.split(".");
  if (parts.length < 2) return "FILE";
  const ext = parts.pop();
  return ext ? ext.toUpperCase() : "FILE";
}
