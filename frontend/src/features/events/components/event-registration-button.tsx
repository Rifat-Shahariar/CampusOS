"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, QrCode, AlertCircle, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/features/auth";
import { cn } from "@/lib/utils";
import type { EventDetail } from "../types";

interface EventRegistrationButtonProps {
  event: EventDetail;
  isActionLoading: boolean;
  actionError: string | null;
  onRegister: () => Promise<unknown>;
  onCancel: () => Promise<unknown>;
}

export function EventRegistrationButton({
  event,
  isActionLoading,
  actionError,
  onRegister,
  onCancel,
}: EventRegistrationButtonProps) {
  const { user } = useAuth();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const now = new Date();
  const hasEnded = now >= new Date(event.endTime);
  const notStartedYet =
    event.registrationStart && now < new Date(event.registrationStart);
  const registrationClosed =
    event.registrationEnd && now > new Date(event.registrationEnd);
  const isCapacityFull = event.isFull;

  // 1. Guest visitor
  if (!user) {
    return (
      <div className="space-y-3">
        <Link
          href={`/login?redirect=/events/${event.id}`}
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "w-full justify-center font-medium shadow-xs cursor-pointer",
          )}
        >
          Sign In to Register
        </Link>
        <p className="text-[11px] text-center text-muted-foreground">
          You must be logged in with a student account to register and receive a ticket.
        </p>
      </div>
    );
  }

  // 2. Non-student account
  if (user.role !== "STUDENT") {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-center space-y-1.5">
        <p className="text-xs font-medium text-foreground">
          Administrative Account
        </p>
        <p className="text-[11px] text-muted-foreground">
          Registration and tickets are reserved for students. You can manage this event via the club dashboard.
        </p>
      </div>
    );
  }

  // 3. Authenticated student: Already registered / Attended
  if (event.isUserRegistered) {
    const isAttended = event.userRegistrationStatus === "ATTENDED";

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <span className="text-xs font-semibold">
              {isAttended ? "Attendance Confirmed" : "You're Registered!"}
            </span>
          </div>

          {event.userRegistrationCode && (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-muted-foreground">Registration Pass:</span>
              <span className="font-mono font-semibold text-foreground bg-background px-2 py-0.5 rounded border border-border">
                {event.userRegistrationCode}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href={`/events/${event.id}/ticket`}
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "w-full justify-center gap-2 font-medium shadow-xs cursor-pointer",
            )}
          >
            <QrCode className="size-4" />
            <span>View QR Ticket</span>
          </Link>

          {!isAttended && (
            <>
              {showCancelConfirm ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                  <p className="text-xs text-destructive font-medium text-center">
                    Are you sure you want to cancel your registration?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        try {
                          await onCancel();
                          setShowCancelConfirm(false);
                        } catch {
                          // error handled in hook
                        }
                      }}
                      disabled={isActionLoading}
                      className="flex-1 cursor-pointer"
                    >
                      {isActionLoading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        "Yes, Cancel"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCancelConfirm(false)}
                      disabled={isActionLoading}
                      className="flex-1 cursor-pointer"
                    >
                      Keep Pass
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                >
                  Cancel Registration
                </Button>
              )}
            </>
          )}
        </div>

        {actionError && (
          <div className="flex items-center gap-2 text-xs text-destructive pt-1">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
      </div>
    );
  }

  // 4. Authenticated student: Not registered yet (Evaluate constraints)
  if (hasEnded) {
    return (
      <Button disabled className="w-full" size="lg">
        Event Has Ended
      </Button>
    );
  }

  if (notStartedYet) {
    return (
      <Button disabled className="w-full" size="lg">
        Registration Opens Soon
      </Button>
    );
  }

  if (registrationClosed) {
    return (
      <Button disabled className="w-full" size="lg">
        Registration Deadline Passed
      </Button>
    );
  }

  if (isCapacityFull) {
    return (
      <Button disabled className="w-full" size="lg">
        Event Full (Capacity Reached)
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={async () => {
          try {
            await onRegister();
          } catch {
            // error handled in hook
          }
        }}
        disabled={isActionLoading}
        className="w-full cursor-pointer shadow-xs font-semibold"
        size="lg"
      >
        {isActionLoading ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" />
            Processing Registration...
          </>
        ) : (
          "Register for Event"
        )}
      </Button>

      {actionError && (
        <div className="flex items-center gap-2 text-xs text-destructive pt-1">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
    </div>
  );
}
