import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { ResourceDetailContainer } from "@/features/resources";
import { Spinner } from "@/components/ui/spinner";

interface ResourceDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Resource Details | CampusOS",
  description:
    "View complete learning resource details and download course materials.",
};

async function ResourceDetailContent({ params }: ResourceDetailPageProps) {
  const { id } = await params;
  return <ResourceDetailContainer resourceId={id} />;
}

export default function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8">
          <Spinner size="lg" />
        </div>
      }
    >
      <DashboardShell>
        <ResourceDetailContent params={params} />
      </DashboardShell>
    </Suspense>
  );
}
