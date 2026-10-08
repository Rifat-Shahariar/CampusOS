"use client";

import React from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Mail,
  Pencil,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { User } from "../types";

interface ProfileViewProps {
  user: User;
  onEdit: () => void;
}

export function ProfileView({ user, onEdit }: ProfileViewProps) {
  // Format member joined date
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const isStudent = user.role === "STUDENT";

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="relative overflow-hidden border-border bg-card">
        <div className="h-28 bg-gradient-to-r from-primary/15 via-primary/5 to-muted border-b border-border" />
        <CardContent className="px-6 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
            <div className="flex items-end gap-4">
              <div className="flex size-24 items-center justify-center rounded-2xl border-4 border-card bg-primary text-primary-foreground font-bold text-2xl shadow-sm">
                {getInitials(user.name)}
              </div>
              <div className="mb-1">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {user.name}
                </h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5 text-muted-foreground" />
                  {user.email}
                </p>
              </div>
            </div>

            <Button
              onClick={onEdit}
              className="gap-2 self-start sm:self-end cursor-pointer"
              aria-label="Edit Profile"
            >
              <Pencil className="size-4" />
              <span>Edit Profile</span>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 font-medium">
              <ShieldCheck className="size-3.5 text-primary" />
              <span>{user.role}</span>
            </Badge>
            <Badge
              variant={user.isActive ? "default" : "destructive"}
              className="gap-1.5 py-1 px-2.5 font-medium"
            >
              <CheckCircle2 className="size-3.5" />
              <span>{user.isActive ? "Active Account" : "Inactive Account"}</span>
            </Badge>
            {user.department && (
              <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 font-medium">
                <GraduationCap className="size-3.5" />
                <span>{user.department.name}</span>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Structured Profile Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserIcon className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base">Personal Information</CardTitle>
                <CardDescription>Basic contact and identification details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="flex justify-between items-center py-2 border-b border-border/50 text-sm">
              <span className="text-muted-foreground">Full Name</span>
              <span className="font-medium text-foreground">{user.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50 text-sm">
              <span className="text-muted-foreground">Email Address</span>
              <span className="font-medium text-foreground">{user.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 text-sm">
              <span className="text-muted-foreground">Student ID / Roll</span>
              <span className="font-medium text-foreground">
                {user.studentId || (
                  <span className="text-muted-foreground font-normal italic">
                    Not provided
                  </span>
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base">Academic Information</CardTitle>
                <CardDescription>
                  {isStudent
                    ? "University department, batch, and section enrollment"
                    : "University department assignment"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="flex justify-between items-start py-2 border-b border-border/50 text-sm">
              <span className="text-muted-foreground">Department</span>
              <span className="font-medium text-foreground text-right max-w-[65%]">
                {user.department ? (
                  user.department.name
                ) : (
                  <span className="text-muted-foreground font-normal italic">
                    Not assigned
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50 text-sm">
              <span className="text-muted-foreground">Batch</span>
              <span className="font-medium text-foreground">
                {user.batch || (
                  <span className="text-muted-foreground font-normal italic">
                    Not provided
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 text-sm">
              <span className="text-muted-foreground">Section</span>
              <span className="font-medium text-foreground">
                {user.section || (
                  <span className="text-muted-foreground font-normal italic">
                    Not provided
                  </span>
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base">Account Information</CardTitle>
                <CardDescription>System access permissions and account status</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-lg border border-border/60 bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <ShieldCheck className="size-3.5 text-primary" />
                  <span>Account Role</span>
                </div>
                <p className="font-semibold text-sm text-foreground">{user.role}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Managed by university administrator
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border/60 bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  <span>Account Status</span>
                </div>
                <p className="font-semibold text-sm text-foreground">
                  {user.isActive ? "Active" : "Inactive"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Full campus platform access
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border/60 bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Calendar className="size-3.5 text-primary" />
                  <span>Member Since</span>
                </div>
                <p className="font-semibold text-sm text-foreground">{memberSince}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Account registration date
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
