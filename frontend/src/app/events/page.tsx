import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { EventsFeedView } from "@/features/events";
import { Spinner } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "Campus Events & Workshops | CampusOS",
  description:
    "Discover upcoming hackathons, contests, seminars, and campus events.",
};

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8">
          <Spinner size="lg" />
        </div>
      }
    >
      <DashboardShell>
        <EventsFeedView />
      </DashboardShell>
    </Suspense>
  );
}
