import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { ClubList } from "@/features/clubs";
import { LoadingState } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "Campus Clubs",
  description: "Browse student clubs, campus chapters, and societies on CampusOS.",
};

export default function ClubsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8">
          <LoadingState message="Loading campus clubs..." />
        </div>
      }
    >
      <DashboardShell>
        <ClubList />
      </DashboardShell>
    </Suspense>
  );
}
