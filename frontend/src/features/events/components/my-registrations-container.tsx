"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Ticket } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/features/auth";
import { useMyRegistrations } from "../hooks/use-my-registrations";
import { MyRegistrationsList } from "./my-registrations-list";
import { cn } from "@/lib/utils";
import type { EventRegistrationStatus } from "../types";

export function MyRegistrationsContainer() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const statusParam = (searchParams.get("status") ||
    undefined) as EventRegistrationStatus | undefined;
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const { registrations, meta, isLoading, error, refetch } = useMyRegistrations({
    status: statusParam,
    page,
    limit: 10,
  });

  const handleStatusFilter = (status?: EventRegistrationStatus) => {
    const params = new URLSearchParams();
    if (status) {
      params.set("status", status);
    }
    params.set("page", "1");
    router.push(`/events/my-registrations?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/events/my-registrations?${params.toString()}`);
  };

  if (!isAuthLoading && !user) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
          <Ticket className="size-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Sign in to view your tickets
        </h2>
        <p className="text-sm text-muted-foreground">
          You must be logged in with your student account to access your event registrations.
        </p>
        <Link
          href="/login?redirect=/events/my-registrations"
          className={cn(buttonVariants({ variant: "default" }), "cursor-pointer")}
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (!isAuthLoading && user && user.role !== "STUDENT") {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-foreground">Student Portal</h2>
        <p className="text-sm text-muted-foreground">
          Event registration passes and attendance tickets are only available for student accounts.
        </p>
        <Link
          href="/events"
          className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}
        >
          Back to Events Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <Link
            href="/events"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer -ml-2",
            )}
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Events Feed</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              My Registrations
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your event passes, check status, and view QR scanner tickets.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <Button
              variant={!statusParam ? "default" : "outline"}
              size="xs"
              onClick={() => handleStatusFilter(undefined)}
              className="cursor-pointer"
            >
              All
            </Button>
            <Button
              variant={statusParam === "REGISTERED" ? "default" : "outline"}
              size="xs"
              onClick={() => handleStatusFilter("REGISTERED")}
              className="cursor-pointer"
            >
              Confirmed
            </Button>
            <Button
              variant={statusParam === "ATTENDED" ? "default" : "outline"}
              size="xs"
              onClick={() => handleStatusFilter("ATTENDED")}
              className="cursor-pointer"
            >
              Attended
            </Button>
            <Button
              variant={statusParam === "CANCELLED" ? "default" : "outline"}
              size="xs"
              onClick={() => handleStatusFilter("CANCELLED")}
              className="cursor-pointer"
            >
              Cancelled
            </Button>
          </div>
        </div>
      </div>

      {/* Registrations List */}
      <MyRegistrationsList
        registrations={registrations}
        meta={meta}
        isLoading={isLoading}
        error={error}
        onPageChange={handlePageChange}
        onRetry={refetch}
      />
    </div>
  );
}
