"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, Eye, EyeOff, Loader2 } from "lucide-react";
import { registerSchema, type RegisterFormData } from "./schemas";
import { useAuth } from "./auth-context";
import { getDepartments } from "./api/departments-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Department } from "@/types";

export function RegisterForm() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepts, setIsLoadingDepts] = useState<boolean>(true);
  const [deptLoadError, setDeptLoadError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      studentId: "",
      batch: "",
      section: "",
      departmentId: "",
    },
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchDepartments() {
      try {
        setIsLoadingDepts(true);
        setDeptLoadError(null);
        const data = await getDepartments();
        if (isMounted) {
          setDepartments(data);
        }
      } catch {
        if (isMounted) {
          setDeptLoadError("Unable to load departments. Please refresh the page.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingDepts(false);
        }
      }
    }

    fetchDepartments();

    return () => {
      isMounted = false;
    };
  }, []);

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        studentId: data.studentId || undefined,
        batch: data.batch || undefined,
        section: data.section || undefined,
        departmentId: data.departmentId,
      };

      await registerUser(payload);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError("Unable to connect to the registration server.");
      }
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-1">
          <Image
            src="/city-university-logo.png"
            alt="City University Logo"
            width={60}
            height={45}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>
        <CardTitle className="text-2xl font-bold">Student Registration</CardTitle>
        <CardDescription>
          Create your CampusOS student account to participate in campus activities
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-3.5">
          {apiError && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive border border-destructive/20 animate-in fade-in-50"
            >
              {apiError}
            </div>
          )}

          <Input
            label="Full Name *"
            placeholder="Rafid Hasan"
            autoComplete="name"
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            label="University Email *"
            type="email"
            placeholder="student@campusos.dev"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Student ID / Roll"
            placeholder="CSE-2023-142"
            error={errors.studentId?.message}
            {...register("studentId")}
          />

          {/* Department Selection Dropdown */}
          <div className="w-full space-y-1.5 text-left">
            <label
              htmlFor="department"
              className="block text-xs font-medium text-foreground tracking-tight"
            >
              Department *
            </label>
            <div className="relative">
              <select
                id="department"
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
                    : "Select your department"}
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
              <p role="alert" className="text-xs font-medium text-destructive mt-1 animate-in fade-in-50">
                {errors.departmentId.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Batch"
              placeholder="67"
              error={errors.batch?.message}
              {...register("batch")}
            />

            <Input
              label="Section"
              placeholder="A"
              error={errors.section?.message}
              {...register("section")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Password (min 8 characters) *"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.password?.message}
              rightAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              }
              {...register("password")}
            />

            <Input
              label="Confirm Password *"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              rightAdornment={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              }
              {...register("confirmPassword")}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button
            type="submit"
            className="w-full h-10 font-semibold cursor-pointer"
            disabled={isSubmitting || isLoadingDepts}
          >
            {isSubmitting ? "Creating account..." : "Register as Student"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
