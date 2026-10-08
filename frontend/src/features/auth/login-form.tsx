"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema, type LoginFormData } from "./schemas";
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

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    try {
      await login(data);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError("Unable to connect to the authentication server.");
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-sm">
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
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>
          Enter your university email to access CampusOS
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {apiError && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive border border-destructive/20 animate-in fade-in-50"
            >
              {apiError}
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="student@campusos.dev"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
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
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full h-10 font-semibold cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              Register here
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
