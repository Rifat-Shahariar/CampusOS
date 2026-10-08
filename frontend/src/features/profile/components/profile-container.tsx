"use client";

import React, { useState } from "react";
import { CheckCircle2, User as UserIcon } from "lucide-react";
import { useAuth } from "@/features/auth";
import { Spinner } from "@/components/ui/spinner";
import { ProfileView } from "./profile-view";
import { ProfileForm } from "./profile-form";
import type { User } from "../types";

export function ProfileContainer() {
  const { user, isLoading, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        <UserIcon className="mx-auto size-10 mb-2 opacity-50" />
        <p className="text-sm">Please sign in to view your profile.</p>
      </div>
    );
  }

  const handleSuccess = (updatedUser: User) => {
    updateUser(updatedUser);
    setIsEditing(false);
    setSuccessMessage("Your profile information has been updated successfully.");
    // Auto-dismiss success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  const handleEdit = () => {
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-lg bg-emerald-500/10 p-4 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-in fade-in-50"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {isEditing ? (
        <ProfileForm
          user={user}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      ) : (
        <ProfileView user={user} onEdit={handleEdit} />
      )}
    </div>
  );
}
