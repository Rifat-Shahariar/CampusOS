"use client";

import React from "react";
import { useAuth } from "@/features/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Compass, FileText } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardOverview() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.name || "Student"}! 👋
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            You are logged in as a{" "}
            <span className="font-semibold text-foreground">{user?.role}</span>
            {user?.department && (
              <span> in {user.department.name} ({user.department.code})</span>
            )}
            . Explore upcoming activities, campus societies, and academic resources.
          </p>
        </div>
      </div>

      {/* Feature Modules Cards (Placeholders for upcoming steps) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Clubs Card */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="space-y-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Compass className="size-5" />
            </div>
            <CardTitle>Clubs & Societies</CardTitle>
            <CardDescription>
              Join technical and cultural clubs, view announcements and participate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/clubs"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full cursor-pointer")}
            >
              Explore Clubs
            </Link>
          </CardContent>
        </Card>

        {/* Events Card */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="space-y-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="size-5" />
            </div>
            <CardTitle>Events & Workshops</CardTitle>
            <CardDescription>
              Discover upcoming campus events, contests, hackathons and secure your ticket.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/events"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full cursor-pointer")}
            >
              Browse Events
            </Link>
          </CardContent>
        </Card>

        {/* Resource Hub Card */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="space-y-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <CardTitle>Resource Hub</CardTitle>
            <CardDescription>
              Access lecture notes, past exam questions, lab manuals and notices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/resources"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full cursor-pointer")}
            >
              Access Resources
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
