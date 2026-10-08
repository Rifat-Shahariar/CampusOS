import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { ResourcesFeedView } from "@/features/resources";
import { Spinner } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "Academic Resource Hub | CampusOS",
  description:
    "Browse verified lecture notes, question papers, lab manuals, and notices across campus courses.",
};

export default function ResourcesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8">
          <Spinner size="lg" />
        </div>
      }
    >
      <DashboardShell>
        <ResourcesFeedView />
      </DashboardShell>
    </Suspense>
  );
}
