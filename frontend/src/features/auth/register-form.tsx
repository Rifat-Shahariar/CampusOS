"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerSchema, type RegisterFormData } from "./schemas";
import { useAuth } from "./auth-context";
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

export function RegisterForm() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

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
      studentId: "",
      batch: "",
      section: "",
      departmentId: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);
    try {
      // Normalize departmentId: omit empty strings so backend receives undefined/null
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        studentId: data.studentId || undefined,
        batch: data.batch || undefined,
        section: data.section || undefined,
        departmentId: data.departmentId || undefined,
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
            label="Password (min 8 characters) *"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Student ID / Roll"
              placeholder="CSE-2023-142"
              error={errors.studentId?.message}
              {...register("studentId")}
            />

            <Input
              label="Batch"
              placeholder="67"
              error={errors.batch?.message}
              {...register("batch")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Section"
              placeholder="A"
              error={errors.section?.message}
              {...register("section")}
            />

            <Input
              label="Department UUID (optional)"
              placeholder="Optional department UUID"
              error={errors.departmentId?.message}
              {...register("departmentId")}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button
            type="submit"
            className="w-full h-10 font-semibold cursor-pointer"
            disabled={isSubmitting}
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
