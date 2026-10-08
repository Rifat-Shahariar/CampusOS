import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { ClubDetailView } from "@/features/clubs";
import { LoadingState } from "@/components/ui/spinner";

interface ClubDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Club Details",
  description: "View student club activities, announcements, and contact information on CampusOS.",
};

async function ClubDetailContent({ params }: ClubDetailPageProps) {
  const { id } = await params;
  return <ClubDetailView clubId={id} />;
}

export default function ClubDetailPage({ params }: ClubDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8">
          <LoadingState message="Loading club details..." />
        </div>
      }
    >
      <DashboardShell>
        <ClubDetailContent params={params} />
      </DashboardShell>
    </Suspense>
  );
}
