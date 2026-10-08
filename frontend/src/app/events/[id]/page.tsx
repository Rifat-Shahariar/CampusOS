import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { EventDetailContainer } from "@/features/events";
import { Spinner } from "@/components/ui/spinner";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Event Details | CampusOS",
  description:
    "View event schedule, location, capacity, and register for a ticket pass.",
};

async function EventDetailContent({ params }: EventDetailPageProps) {
  const { id } = await params;
  return <EventDetailContainer eventId={id} />;
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8">
          <Spinner size="lg" />
        </div>
      }
    >
      <DashboardShell>
        <EventDetailContent params={params} />
      </DashboardShell>
    </Suspense>
  );
}
