import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { MyRegistrationsContainer } from "@/features/events";
import { Spinner } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "My Event Registrations | CampusOS",
  description:
    "View your confirmed event tickets, registration status, and entry passes.",
};

export default function MyRegistrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8">
          <Spinner size="lg" />
        </div>
      }
    >
      <DashboardShell>
        <MyRegistrationsContainer />
      </DashboardShell>
    </Suspense>
  );
}
