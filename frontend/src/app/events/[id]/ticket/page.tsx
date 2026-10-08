import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { EventTicketContainer } from "@/features/events";
import { Spinner } from "@/components/ui/spinner";

interface EventTicketPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Official Event Ticket | CampusOS",
  description: "View and present your official QR entry pass for event check-in.",
};

async function EventTicketContent({ params }: EventTicketPageProps) {
  const { id } = await params;
  return <EventTicketContainer eventId={id} />;
}

export default function EventTicketPage({ params }: EventTicketPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8">
          <Spinner size="lg" />
        </div>
      }
    >
      <DashboardShell>
        <EventTicketContent params={params} />
      </DashboardShell>
    </Suspense>
  );
}
