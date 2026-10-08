"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  Info,
  Loader2,
  Lock,
  Save,
  ShieldCheck,
  User as UserIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { profileSchema, type ProfileFormValues } from "../schemas/profile-schema";
import { profileApi } from "../api/profile-api";
import type { Department, User } from "../types";

interface ProfileFormProps {
  user: User;
  onSuccess: (updatedUser: User) => void;
  onCancel: () => void;
}

export function ProfileForm({ user, onSuccess, onCancel }: ProfileFormProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepts, setIsLoadingDepts] = useState<boolean>(true);
  const [deptLoadError, setDeptLoadError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name ?? "",
      studentId: user.studentId ?? "",
      batch: user.batch ?? "",
      section: user.section ?? "",
      departmentId: user.department?.id ?? "",
    },
  });

  useEffect(() => {
    let isMounted = true;
    async function loadDepartments() {
      try {
        setIsLoadingDepts(true);
        const data = await profileApi.getDepartments();
        if (isMounted) {
          setDepartments(data);
          setDeptLoadError(null);
        }
      } catch {
        if (isMounted) {
          setDeptLoadError("Failed to load departments. Please refresh.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingDepts(false);
        }
      }
    }

    void loadDepartments();
    return () => {
      isMounted = false;
    };
  }, []);

  const onSubmit = async (values: ProfileFormValues) => {
    setApiError(null);
    try {
      const updatedUser = await profileApi.updateProfile({
        name: values.name.trim(),
        studentId: values.studentId?.trim() || undefined,
        batch: values.batch?.trim() || undefined,
        section: values.section?.trim() || undefined,
        departmentId: values.departmentId?.trim() || undefined,
      });

      onSuccess(updatedUser);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError("Failed to update profile. Please try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Top Banner Alert for errors */}
      {apiError && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-lg bg-destructive/10 p-3.5 text-xs font-medium text-destructive border border-destructive/20 animate-in fade-in-50"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserIcon className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base">Personal Details</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <Input
              label="Full Name *"
              placeholder="e.g. Rafid Hasan"
              error={errors.name?.message}
              disabled={isSubmitting}
              {...register("name")}
            />

            {/* Email (Read-Only) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-foreground tracking-tight">
                  Email Address
                </label>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Lock className="size-3" />
                  Read-only
                </span>
              </div>
              <input
                type="email"
                value={user.email}
                disabled
                aria-label="Email Address"
                className="flex h-9 w-full rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground shadow-xs cursor-not-allowed select-none opacity-80"
              />
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Info className="size-3 shrink-0" />
                Email address is managed by university administration
              </p>
            </div>

            <Input
              label="Student ID / Roll"
              placeholder="e.g. CSE-2023-142"
              error={errors.studentId?.message}
              disabled={isSubmitting}
              {...register("studentId")}
            />
          </CardContent>
        </Card>

        {/* Academic Details Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base">Academic Details</CardTitle>
                <CardDescription>Update your department and class enrollment</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Department Dropdown */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="departmentId"
                className="block text-xs font-medium text-foreground tracking-tight"
              >
                Department
              </label>
              <div className="relative">
                <select
                  id="departmentId"
                  aria-label="Department"
                  disabled={isLoadingDepts || isSubmitting}
                  className={cn(
                    "flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground shadow-xs transition-colors appearance-none cursor-pointer pr-9",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    errors.departmentId && "border-destructive focus-visible:ring-destructive",
                  )}
                  {...register("departmentId")}
                >
                  <option value="">
                    {isLoadingDepts
                      ? "Loading departments..."
                      : "Select department"}
                  </option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                  {isLoadingDepts ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </div>
              </div>
              {deptLoadError && (
                <p role="alert" className="text-xs font-medium text-destructive mt-1">
                  {deptLoadError}
                </p>
              )}
              {errors.departmentId && (
                <p role="alert" className="text-xs font-medium text-destructive mt-1">
                  {errors.departmentId.message}
                </p>
              )}
            </div>

            <Input
              label="Batch"
              placeholder="e.g. 67"
              error={errors.batch?.message}
              disabled={isSubmitting}
              {...register("batch")}
            />

            <Input
              label="Section"
              placeholder="e.g. A"
              error={errors.section?.message}
              disabled={isSubmitting}
              {...register("section")}
            />
          </CardContent>
        </Card>

        {/* Security / Role Read-Only Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base">Role & Permissions</CardTitle>
                <CardDescription>Security and access rights</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border/60 bg-muted/30">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Current Role: <span className="text-primary">{user.role}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Account permissions and administrative roles can only be granted by university administrators.
                </p>
              </div>
              <Badge variant="outline" className="gap-1.5 py-1 px-3 self-start sm:self-auto font-medium">
                <Lock className="size-3 text-muted-foreground" />
                <span>Protected Role</span>
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-border/60 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="gap-2 cursor-pointer w-full sm:w-auto"
            >
              <X className="size-4" />
              <span>Cancel</span>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 cursor-pointer w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
