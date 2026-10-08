import type { Metadata } from "next";
import { ProtectedRoute, DashboardShell } from "@/components/layout";
import { ProfileContainer } from "@/features/profile";

export const metadata: Metadata = {
  title: "My Profile | CampusOS",
  description: "View and manage your CampusOS account and academic details",
};

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              User Profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your personal and academic information on CampusOS
            </p>
          </div>
          <ProfileContainer />
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
