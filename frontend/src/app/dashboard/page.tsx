import type { Metadata } from "next";
import { ProtectedRoute, DashboardShell } from "@/components/layout";
import { DashboardOverview } from "@/features/dashboard/dashboard-overview";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "CampusOS Digital Campus Hub Dashboard",
};

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <DashboardOverview />
      </DashboardShell>
    </ProtectedRoute>
  );
}
